﻿using DanpheEMR.Controllers;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.InventoryModels;
using DanpheEMR.ServerModel.NotificationModels;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;

namespace DanpheEMR.Services
{
    public class InventoryGoodReceiptService : IInventoryGoodReceiptService
    {
        public InventoryDbContext db;
        public NotiFicationDbContext notificationDb;
        public RbacDbContext rbacDb;
        private readonly string connString = null;
        private readonly ILogger<InventoryGoodReceiptService> _logger;

        public IInventoryReceiptNumberService ReceiptNumberService { get; }

        public InventoryGoodReceiptService(IOptions<MyConfiguration> _config, IInventoryReceiptNumberService receiptNumberService, ILogger<InventoryGoodReceiptService> logger)
        {
            connString = _config.Value.Connectionstring;
            db = new InventoryDbContext(connString);
            ReceiptNumberService = receiptNumberService;
            _logger = logger;
        }

        public List<GoodsReceiptModel> ListGoodsReceipt()
        {
            try
            {
                var query = db.GoodsReceipts.ToList();
                return query;
            }
            catch (Exception Ex)
            {
                throw Ex;
            }
        }

        public GoodsReceiptModel AddGoodsArrival(GoodsReceiptModel model)
        {

            using (var transaction = db.Database.BeginTransaction())
            {
                try
                {
                    var currentDate = DateTime.Now;
                    int FiscalYearId = InventoryBL.GetFiscalYear(db).FiscalYearId;
                    var IsGRAlreadyExist = db.GoodsReceipts.Any(g => g.BillNo == model.BillNo && g.VendorId == model.VendorId && g.FiscalYearId == FiscalYearId && g.IsCancel == false);
                    if (IsGRAlreadyExist == true)
                    {
                        throw new Exception("Duplicate BillNo for the same Vendor is not allowed");
                    }
                    model.CreatedOn = currentDate;
                    //GoodsArrivalNo max+1 increment logic with fiscal year.
                    //removed from here as it is set only when all the verifications are completed.
                    model.GoodsArrivalNo = ReceiptNumberService.GenerateGAN(model.GoodsArrivalDate, model.GRGroupId);
                    model.FiscalYearId = FiscalYearId;
                    model.GoodsReceiptNo = ReceiptNumberService.GenerateGAN(model.GoodsReceiptDate, model.GRGroupId);

                    //check if verification enabled
                    model.VerifierIds = (model.IsVerificationEnabled) ? InventoryBL.SerializeProcurementVerifiers(model.VerifierList) : "";
                    model.GoodsReceiptItem.ForEach(item =>
                    {
                        item.OtherChargesModelList.ForEach(charge =>
                        {
                            charge.CreatedOn = currentDate;
                            charge.CreatedBy = item.CreatedBy;
                        });
                    });
                    db.GoodsReceipts.Add(model);
                    //Save Goods Receipt to DB
                    db.SaveChanges();

                    //If GR generated then save items in  Stock table
                    int SavedGoodsReceiptId = model.GoodsReceiptID;
                    if (SavedGoodsReceiptId > 0)
                    {
                        var CheckForPOCompletion = true;
                        model.GoodsReceiptItem.ForEach(item =>
                        {
                            item.CreatedOn = currentDate;  //Assign Today's date as CreatedOn
                            item.CreatedBy = model.CreatedBy;
                            item.GRItemDate = model.GoodsReceiptDate;
                            item.ArrivalQuantity = item.ReceivedQuantity;
                            item.DonationId = model.DonationId;
                            //for purchase order item
                            if (model.PurchaseOrderId != null)
                            {
                                var purchaseOrderItem = db.PurchaseOrderItems.Where(a => a.PurchaseOrderId == model.PurchaseOrderId && a.ItemId == item.ItemId).Select(a => a).FirstOrDefault();
                                //Sud: 26Sept'21-- We need to updat below logic after we allow duplicate items in single GR.
                                //eg: 5Qty of PO can come as 3+2 in GR. Which means PO is 'Completed'
                                if (purchaseOrderItem != null)
                                {
                                    purchaseOrderItem.ReceivedQuantity += item.ReceivedQuantity;
                                    purchaseOrderItem.PendingQuantity = purchaseOrderItem.Quantity - purchaseOrderItem.ReceivedQuantity;
                                    if (purchaseOrderItem.PendingQuantity <= 0)
                                    {
                                        purchaseOrderItem.POItemStatus = "complete";
                                        purchaseOrderItem.PendingQuantity = 0;
                                    }
                                    else //if the item is received but ordered qunatity is not fulfilled , item status must be partial.
                                    {
                                        if (purchaseOrderItem.ReceivedQuantity > 0)
                                        {
                                            purchaseOrderItem.POItemStatus = "partial";
                                        }
                                        CheckForPOCompletion = false;
                                    }
                                    db.PurchaseOrderItems.Attach(purchaseOrderItem);

                                    //sud:20Sept'21--Attaching the Object coming from client and Making the Entity.Modified will update all properties of the object.. 
                                    //Very RISKY operation when attaching the object from frontend.
                                    //Correct way: Attach the object then Mention IsModified=true to only required properties.
                                    //db.Entry(purchaseOrderItem).State = EntityState.Modified;

                                    db.Entry(purchaseOrderItem).Property(x => x.ReceivedQuantity).IsModified = true;
                                    db.Entry(purchaseOrderItem).Property(x => x.PendingQuantity).IsModified = true;
                                    db.Entry(purchaseOrderItem).Property(x => x.POItemStatus).IsModified = true;
                                }
                            }
                        });
                        //Save => Stock Items in stock table
                        db.SaveChanges();
                        UpdatePurchaseOrder(model.PurchaseOrderId, CheckForPOCompletion);
                    }
                    transaction.Commit();
                    //since the dbcontext is changed, sending notification is done after the commit.
                    SendNotificationToVerifiers(model.GoodsReceiptID, model.VerifierList, model.IsVerificationEnabled);
                }
                catch (Exception Ex)
                {
                    transaction.Rollback();
                    throw Ex;
                }
            }
            return model;
        }

        public void SendNotificationToVerifiers(int GoodsReceiptId, List<POVerifier> Verifiers, bool IsVerificationEnabled)
        {
            if (IsVerificationEnabled == true)
            {
                notificationDb = new NotiFicationDbContext(connString);
                rbacDb = new RbacDbContext(connString);
                Verifiers.ForEach(verifier =>
                {
                    int recipientId = (verifier.Type == "user") ? rbacDb.Users.Where(u => u.UserId == verifier.Id).Select(u => u.EmployeeId).FirstOrDefault() : verifier.Id;
                    var notification = new NotificationViewModel();
                    notification.Notification_ModuleName = "Inventory_Module";
                    notification.Notification_Title = "New Goods Arrival";
                    notification.Notification_Details = "Click Here To Verify.";
                    notification.RecipientId = recipientId;
                    notification.RecipientType = verifier.Type == "role" ? "rbac-role" : "user";
                    notification.ParentTableName = "INV_TXN_GoodsReceipt";
                    notification.NotificationParentId = GoodsReceiptId;
                    notification.IsRead = false;
                    notification.IsArchived = false;
                    notification.CreatedOn = DateTime.Now;
                    notification.Sub_ModuleName = "GR_QualtityInspection";
                    notificationDb.Notifications.Add(notification);
                });
                notificationDb.SaveChanges();
            }
        }

        private void UpdatePurchaseOrder(int? PurchaseOrderId, bool CheckForPOCompletion)
        {
            if (CheckForPOCompletion)
            {
                PurchaseOrderModel poitems = db.PurchaseOrders.Include(po => po.PurchaseOrderItems).Where(a => a.PurchaseOrderId == PurchaseOrderId).FirstOrDefault();
                if (poitems != null)
                {
                    List<string> POItemStatuses = new List<string>();
                    POItemStatuses.Add(ENUM_InventoryPurchaseOrderStatus.Active);
                    POItemStatuses.Add(ENUM_InventoryPurchaseOrderStatus.Partial);
                    bool POItemStatusCheck = poitems.PurchaseOrderItems.Any(poi => POItemStatuses.Contains(poi.POItemStatus));
                    poitems.POStatus = POItemStatusCheck ? "partial" : "complete";
                    db.Entry(poitems).State = EntityState.Modified;
                    db.SaveChanges();
                }
            }
            else //status must be partial if the ordered quantity is not fulfilled.
            {
                PurchaseOrderModel poitems = db.PurchaseOrders.Where(a => a.PurchaseOrderId == PurchaseOrderId).FirstOrDefault();
                if (poitems != null)
                {
                    poitems.POStatus = "partial";
                    db.Entry(poitems).State = EntityState.Modified;
                    db.SaveChanges();
                }
            }
        }

        public InventoryStockIds AddtoInventoryStock(GoodsReceiptItemsModel grItem, string GRCategory, int StoreId, RbacUser currentUser, DateTime currentDate, int currentFiscalYearId)
        {
            try
            {
                if (grItem.GoodsReceiptItemId == 0)
                {
                    grItem.CreatedOn = currentDate;
                    db.GoodsReceiptItems.Add(grItem);
                    db.SaveChanges();
                }
                if (GRCategory == "Consumables")
                {
                    return AddtoConsumableStock(grItem, StoreId, currentUser, currentDate, currentFiscalYearId);
                }
                else if (GRCategory == "Capital Goods" && grItem.IsFixedAssets == false) // Capital Goods case when IsFixedAssets feature is OFF.
                {
                    return AddtoConsumableStock(grItem, StoreId, currentUser, currentDate, currentFiscalYearId);

                }
                else  // Capital Goods case when IsFixedAssets feature is ON.
                {
                    return AddtoConsumableAndFixedAssetStock(grItem, StoreId, currentUser, currentDate, currentFiscalYearId);
                }

            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        private InventoryStockIds AddtoConsumableStock(GoodsReceiptItemsModel item, int StoreId, RbacUser currentUser, DateTime currentDate, int currentFiscalYearId)
        {
            InventoryStockIds stockIds = new InventoryStockIds();
            // Add to stock master
            var newStockMaster = new StockMasterModel(
                itemId: item.ItemId,
                batchNo: item.BatchNO,
                expiryDate: item.ExpiryDate,
                costPrice: item.CostPrice,
                mRP: item.MRP,
                specification: item.GRItemSpecification,
                createdBy: item.CreatedBy.Value,
                createdOn: currentDate
                );

            db.StockMasters.Add(newStockMaster);
            db.SaveChanges();

            var newStock = new StoreStockModel(
                stockMaster: newStockMaster,
                storeId: StoreId,
                quantity: item.ReceivedQuantity + item.FreeQuantity,
                transactionType: ENUM_INV_StockTransactionType.PurchaseItem,
                transactionDate: item.GRItemDate,
                currentDate: currentDate,
                referenceNo: item.GoodsReceiptItemId,
                createdBy: currentUser.EmployeeId,
                fiscalYearId: currentFiscalYearId,
                needConfirmation: false
                );

            db.StoreStocks.Add(newStock);
            db.SaveChanges();
            stockIds.StockId = newStock.StockId;
            stockIds.StoreStockId = newStock.StoreStockId;
            return stockIds;
        }


        #region This Fxn adds the data to Master Stock, StoreStock and Stktxn along with the Assets Stock and Assets History
        public InventoryStockIds AddtoConsumableAndFixedAssetStock(GoodsReceiptItemsModel item, int StoreId, RbacUser currentUser, DateTime currentDate, int currentFiscalYearId)
        {
            try
            {
                FixedAssetStockModel FAstockItem = new FixedAssetStockModel();
                AssetLocationHistoryModel assetslocation = new AssetLocationHistoryModel();
                InventoryStockIds stockIds = new InventoryStockIds();


                #region Adding Consumbale Stock 
                var newStockMaster = new StockMasterModel(
                       itemId: item.ItemId,
                       batchNo: item.BatchNO,
                       expiryDate: item.ExpiryDate,
                       costPrice: item.ItemRate,
                       mRP: item.MRP,
                       specification: item.GRItemSpecification,
                       createdBy: item.CreatedBy.Value,
                       createdOn: currentDate
                       );

                db.StockMasters.Add(newStockMaster);
                db.SaveChanges();

                var newStock = new StoreStockModel(
                    stockMaster: newStockMaster,
                    storeId: StoreId,
                    quantity: item.ReceivedQuantity + item.FreeQuantity,
                    transactionType: ENUM_INV_StockTransactionType.PurchaseItem,
                    transactionDate: item.GRItemDate,
                    currentDate: currentDate,
                    referenceNo: item.GoodsReceiptItemId,
                    createdBy: currentUser.EmployeeId,
                    fiscalYearId: currentFiscalYearId,
                    needConfirmation: false
                    );

                db.StoreStocks.Add(newStock);
                db.SaveChanges();
                #endregion


                string barCodeIncremental;
                var itemCode = db.Items.FirstOrDefault(a => a.ItemId == item.ItemId).Code;
                for (var i = 0; i < item.ReceivedQuantity; i++)
                {
                    FAstockItem = new FixedAssetStockModel()
                    {
                        GoodsReceiptItemId = item.GoodsReceiptItemId,
                        ItemId = item.ItemId,
                        BatchNo = item.BatchNO,
                        CcAmount = item.CcAmount,
                        CcCharge = item.CcCharge,
                        MRP = item.MRP,
                        OtherCharge = item.OtherCharge,
                        VAT = item.VAT,
                        VATAmount = item.VATAmount,
                        ItemRate = item.ItemRate,
                        CounterId = item.CounterId,
                        DiscountPercent = item.DiscountPercent,
                        DiscountAmount = item.DiscountAmount,
                        IsBarCodeGenerated = false,
                        IsUnderMaintenance = false,
                        IsActive = true,
                        IsAssetDamaged = false,
                        CreatedBy = item.CreatedBy,
                        CreatedOn = item.CreatedOn,
                        WarrantyExpiryDate = item.ExpiryDate,
                        IsMaintenanceRequired = false,
                        IsAssetDamageConfirmed = false,
                        IsAssetScraped = false,
                        DonationId = item.DonationId,
                        StoreId = StoreId,
                        StockSpecification = item.GRItemSpecification
                    };

                    //Barcode generation                                   
                    if (db.FixedAssetStock.Count() > 0)
                    {
                        string lastBarcode = db.FixedAssetStock.OrderByDescending(a => a.FixedAssetStockId).FirstOrDefault().BarCodeNumber;
                        // barCodeIncremental = lastBarcode.Substring(lastBarcode.Length - 5)
                        barCodeIncremental = (Int32.Parse(lastBarcode) + 1).ToString();
                    }
                    else
                        barCodeIncremental = (1111111).ToString();
                    // barcode = fiscalyearId + itemCode + incremental
                    FAstockItem.BarCodeNumber = barCodeIncremental;
                    db.FixedAssetStock.Add(FAstockItem);
                    db.SaveChanges();

                    var newAssetLocationHistory = new AssetLocationHistoryModel
                    {
                        CreatedBy = FAstockItem.CreatedBy,
                        StartDate = FAstockItem.CreatedOn,
                        //OldStoreId = 1, //Main Store IdB
                        OldStoreId = StoreId,
                        FixedAssetStockId = FAstockItem.FixedAssetStockId
                    };
                    db.AssetLocationHistory.Add(newAssetLocationHistory);
                }


                db.SaveChanges();
                stockIds.StockId = newStock.StockId;
                stockIds.StoreStockId = newStock.StoreStockId;
                return stockIds;
            }
            catch (Exception ex)
            {

                return null;
            }
        }
        #endregion

        public GoodsReceiptModel GetGoodsReceipt(int id)
        {
            try
            {
                var result = db.GoodsReceipts.Where(x => x.GoodsReceiptID == id).FirstOrDefault();
                return result;
            }
            catch (Exception Ex)
            {
                throw Ex;
            }
        }

        public List<VendorMasterModel> GetVendorList()
        {
            try
            {
                var query = db.Vendors.ToList();
                return query;
            }
            catch (Exception Ex)
            {
                throw Ex;
            }
        }

        public PurchaseOrderModel AddPOAndPOItemsByGRId(GoodsReceiptModel model)
        {
            using (var transaction = db.Database.BeginTransaction())
            {
                PurchaseOrderModel po = new PurchaseOrderModel();
                try
                {
                    po.VendorId = model.VendorId;
                    po.PoDate = DateTime.Now;
                    po.POStatus = "complete";
                    po.SubTotal = model.SubTotal;
                    po.TotalAmount = model.TotalAmount;
                    po.VAT = model.VATTotal;
                    po.CreatedBy = model.CreatedBy.Value;
                    po.CreatedOn = DateTime.Now;
                    po.PurchaseOrderItems = new List<PurchaseOrderItemsModel>();
                    model.GoodsReceiptItem.ForEach(grItm =>
                    {
                        PurchaseOrderItemsModel poItem = new PurchaseOrderItemsModel();
                        poItem.ItemId = grItm.ItemId;
                        poItem.Quantity = grItm.ReceivedQuantity;
                        poItem.PurchaseOrderId = po.PurchaseOrderId;
                        poItem.StandardRate = grItm.ItemRate;
                        poItem.TotalAmount = grItm.TotalAmount;
                        poItem.ReceivedQuantity = grItm.ReceivedQuantity;
                        poItem.PendingQuantity = 0;
                        poItem.DeliveryDays = 0;
                        poItem.AuthorizedBy = po.CreatedBy;
                        poItem.AuthorizedOn = DateTime.Now;
                        poItem.AuthorizedRemark = "this is auto po creating on gr creation time";
                        poItem.CreatedBy = po.CreatedBy;
                        poItem.CreatedOn = DateTime.Now;
                        poItem.POItemStatus = "complete";
                        po.PurchaseOrderItems.Add(poItem);
                    });
                    db.PurchaseOrders.Add(po);
                    db.SaveChanges();
                    transaction.Commit();
                }
                catch (Exception Ex)
                {
                    transaction.Rollback();
                    throw Ex;
                }
                return po;
            }
        }
        public int UpdateGoodsReceipt(GoodsReceiptModel GoodsReceipt, RbacUser currentUser)
        {
            using (var dbTransaction = db.Database.BeginTransaction())
            {
                try
                {
                    var currentDate = DateTime.Now;
                    GoodsReceipt.ModifiedOn = currentDate;
                    GoodsReceipt.ModifiedBy = currentUser.EmployeeId;
                    var grId = GoodsReceipt.GoodsReceiptID;
                    //if any old item has been deleted, we need to compare grItemList
                    // removed since only whole cancel is allowed, item cancel is not allowed.
                    //List<int> GrItemIdList = db.GoodsReceiptItems.Where(a => a.GoodsReceiptId == grId && a.IsActive == true).Select(a => a.GoodsReceiptItemId).ToList();
                    GoodsReceipt.GoodsReceiptItem.ForEach(item =>
                    {
                        if (item.GoodsReceiptItemId > 0) //old elememnt will have the grItemId
                        {
                            //for updating old element
                            item.ModifiedBy = currentUser.EmployeeId;
                            item.ModifiedOn = currentDate;
                            db.GoodsReceiptItems.Attach(item);

                            //sud:20Sept'21--Attaching the Object coming from frontend and Making the Entity.Modified will update all properties of the object.. 
                            //Very RISKY operation when attaching the object coming from frontend.
                            //Correct way: Attach the object, then Mention IsModified=true to only required properties.
                            //db.Entry(item).State = EntityState.Modified;

                            db.Entry(item).Property(a => a.GRItemSpecification).IsModified = true;
                            db.Entry(item).Property(a => a.BatchNO).IsModified = true;
                            db.Entry(item).Property(a => a.ExpiryDate).IsModified = true;
                            db.Entry(item).Property(a => a.Remarks).IsModified = true;
                            db.Entry(item).Property(a => a.ModifiedBy).IsModified = true;
                            db.Entry(item).Property(a => a.ModifiedOn).IsModified = true;

                            if (item.StockId != null)
                            {
                                // removed since gr Date edit feature is disabled
                                //var PurchaseTxn = ENUM_INV_StockTransactionType.PurchaseItem;
                                //var stkTxn = db.StockTransactions.FirstOrDefault(a => a.ReferenceNo == item.GoodsReceiptItemId && a.TransactionType == PurchaseTxn);
                                //if (stkTxn != null)
                                //{
                                //    stkTxn.UpdateTransactionDate(item.GRItemDate);
                                //}

                                var stk = db.StockMasters.Find(item.StockId);
                                stk.UpdateBatch(item.BatchNO, item.ModifiedBy);
                                stk.UpdateExpiry(item.ExpiryDate, item.ModifiedBy);
                                stk.UpdateSpecification(item.GRItemSpecification, item.ModifiedBy);
                            }
                            db.SaveChanges();
                            //cancel the present GritemId from the list, so later we can cancel the remaining item in the list.
                            //GrItemIdList = GrItemIdList.Where(a => a != item.GoodsReceiptItemId).ToList();
                        }
                        else //new items wont have GRItemId
                        {
                            //for adding new gritems
                            item.CreatedOn = currentDate;
                            item.CreatedBy = currentUser.EmployeeId;
                            item.GoodsReceiptId = grId;
                            db.GoodsReceiptItems.Add(item);
                            db.SaveChanges();
                        }
                    });
                    //for cancelling old element
                    //if (GrItemIdList.Any())
                    //{
                    //    foreach (int gritmId in GrItemIdList)
                    //    {
                    //        var grItem = db.GoodsReceiptItems.Find(gritmId);
                    //        grItem.IsActive = false;
                    //        grItem.CancelledBy = currentUser.EmployeeId;
                    //        grItem.CancelledOn = DateTime.Now;
                    //        db.GoodsReceiptItems.Attach(grItem);
                    //        db.Entry(grItem).State = EntityState.Modified;
                    //        db.Entry(grItem).Property(a => a.IsActive).IsModified = true;
                    //        db.Entry(grItem).Property(a => a.CancelledOn).IsModified = true;
                    //        db.Entry(grItem).Property(a => a.CancelledBy).IsModified = true;
                    //        db.SaveChanges();
                    //    }

                    //    db.SaveChanges();
                    //}
                    GoodsReceipt.OtherChargesList = null;
                    GoodsReceipt.VerifierIds = (GoodsReceipt.IsVerificationEnabled) ? InventoryBL.SerializeProcurementVerifiers(GoodsReceipt.VerifierList) : "";
                    //To avoid referential integrity constraint violation. --Rohit
                    if (GoodsReceipt.VerifierList.Count > 0)
                    {
                        GoodsReceipt.GRStatus = ENUM_GRVerificationStatus.pending;
                    }
                    else
                    {
                        GoodsReceipt.GRStatus = ENUM_GRVerificationStatus.verified;
                    }
                    GoodsReceipt.VerificationId = null;
                    db.GoodsReceipts.Attach(GoodsReceipt);

                    //sud:20Sept'21--Attaching the Object coming from client and Making the Entity.Modified will update all properties of the object.. 
                    //Very RISKY operation when attaching the object from frontend.
                    //Correct way: Attach the object then Mention IsModified=true to only required properties.
                    //db.Entry(GoodsReceipt).State = EntityState.Modified;
                    db.Entry(GoodsReceipt).Property(a => a.VerificationId).IsModified = true;
                    db.Entry(GoodsReceipt).Property(a => a.GRStatus).IsModified = true;
                    db.Entry(GoodsReceipt).Property(a => a.IsVerificationEnabled).IsModified = true;
                    db.Entry(GoodsReceipt).Property(a => a.VendorBillDate).IsModified = true;
                    db.Entry(GoodsReceipt).Property(a => a.BillNo).IsModified = true;
                    db.Entry(GoodsReceipt).Property(a => a.VendorId).IsModified = true;
                    db.Entry(GoodsReceipt).Property(a => a.CreditPeriod).IsModified = true;
                    db.Entry(GoodsReceipt).Property(a => a.Remarks).IsModified = true;
                    db.Entry(GoodsReceipt).Property(a => a.ModifiedBy).IsModified = true;
                    db.Entry(GoodsReceipt).Property(a => a.ModifiedOn).IsModified = true;
                    db.Entry(GoodsReceipt).Property(a => a.VerifierIds).IsModified = true;
                    db.SaveChanges();
                    dbTransaction.Commit();
                }
                catch (Exception Ex)
                {
                    dbTransaction.Rollback();
                    throw Ex;
                }
                return GoodsReceipt.GoodsReceiptID;
            }

        }

        public bool ReceiveGoodsReceipt(int GRId, RbacUser currentUser, string ReceiveRemarks = "")
        {
            using (var dbTransaction = db.Database.BeginTransaction())
            {
                try
                {
                    var currentDate = DateTime.Now;

                    var goodsReceipt = db.GoodsReceipts
                        .Include(gr => gr.GoodsReceiptItem)
                        .SingleOrDefault(gr => gr.GoodsReceiptID == GRId);

                    if (goodsReceipt is null)
                    {
                        _logger.LogError($"Goods Receipt not found with GoodsReceiptId = {GRId}");
                        throw new Exception("Goods Receipt not found");
                    }

                    goodsReceipt.GRStatus = "active";
                    goodsReceipt.ReceivedBy = currentUser.EmployeeId;
                    goodsReceipt.ReceivedOn = currentDate;
                    goodsReceipt.ReceivedRemarks = ReceiveRemarks;

                    int currentFiscalYearId = InventoryBL.GetFiscalYear(db).FiscalYearId;

                    var itemIds = goodsReceipt.GoodsReceiptItem.Select(grItem => grItem.ItemId).ToList();
                    var items = db.Items.Where(x => itemIds.Contains(x.ItemId)).ToDictionary(x => x.ItemId);

                    var goodsReceiptItemIds = goodsReceipt.GoodsReceiptItem.Select(grItem => grItem.GoodsReceiptItemId).ToList();
                    var stockTransactions = db.StockTransactions
                        .Where(st => goodsReceiptItemIds.Contains((int)st.ReferenceNo) && st.TransactionType == ENUM_INV_StockTransactionType.PurchaseItem)
                        .ToDictionary(st => st.ReferenceNo);

                    var storeStockIds = goodsReceipt.GoodsReceiptItem.Select(grItem => grItem.StoreStockId).Where(id => id > 0).Distinct().ToList();
                    var storeStocks = db.StoreStocks.Where(ss => storeStockIds.Contains(ss.StoreStockId)).ToDictionary(ss => ss.StoreStockId);

                    foreach (var grItem in goodsReceipt.GoodsReceiptItem)
                    {
                        if (items.TryGetValue(grItem.ItemId, out var item))
                        {
                            grItem.IsFixedAssets = item.IsFixedAssets;
                        }
                        grItem.DonationId = goodsReceipt.DonationId;

                        var stockIds = new InventoryStockIds();

                        if (stockTransactions.TryGetValue(grItem.GoodsReceiptItemId, out var stockTransaction))
                        {
                            if (grItem.StoreStockId > 0 && storeStocks.TryGetValue(grItem.StoreStockId, out var storeStock))
                            {
                                storeStock.UpdateAvailableQuantity(grItem.ReceivedQuantity - stockTransaction.InQty);
                                stockIds.StoreStockId = grItem.StoreStockId;
                            }

                            stockIds.StockId = stockTransaction.StockId;
                            stockTransaction.SetInQuantity(grItem.ReceivedQuantity);
                        }
                        else
                        {
                            if (grItem.StoreStockId == 0 || grItem.StoreStockId == null)
                            {
                                stockIds = AddtoInventoryStock(grItem, grItem.ItemCategory, goodsReceipt.StoreId, currentUser, currentDate, currentFiscalYearId);
                                grItem.StockId = stockIds.StockId;
                            }
                        }

                        grItem.StoreStockId = stockIds.StoreStockId;
                    }

                    db.SaveChanges();
                    dbTransaction.Commit();
                    return true;
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Error in ReceiveGoodsReceipt: {ex}");
                    dbTransaction.Rollback();
                    throw;
                }
            }
        }

        #region GET Other Charges Details
        public List<InventoryChargesMasterModel> GetINVOtherChargesDetails()
        {
            try
            {
                var query = db.OtherCharges.ToList();
                return query;
            }
            catch (Exception Ex)
            {
                throw Ex;
            }
        }
        #endregion
    }
}
