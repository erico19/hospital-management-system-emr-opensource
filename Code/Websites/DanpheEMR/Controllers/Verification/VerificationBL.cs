﻿using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.InventoryModels;
using DanpheEMR.ServerModel.LabModels;
using DanpheEMR.ServerModel.VerificationModels.Pharmacy;
using DanpheEMR.Services.Pharmacy.DTOs.PurchaseOrder;
using DanpheEMR.Services.Verification;
using DanpheEMR.Services.Verification.DTOs;
using DanpheEMR.Services.Verification.DTOs.Pharmacy;
using DanpheEMR.Utilities;
using DanpheEMR.ViewModel.Pharmacy;
using Google.Apis.Drive.v3.Data;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;

namespace DanpheEMR.Controllers
{
    public class VerificationBL
    {
        private static string VerificationStatus { get; set; } //sanjit: 14 April: This property is created in order to retrieve the verification status for a the level in which the verification is already done.
        public static List<RequisitionModel> GetInventoryRequisitionListBasedOnUser(DateTime FromDate, DateTime ToDate, InventoryDbContext inventoryDb, RbacDbContext rbacDb, RbacUser user)
        {
            try
            {
                var realToDate = ToDate.AddDays(1);
                //Step 1: Take all the active requisition in memory.
                var requisitionList = inventoryDb.Requisitions.Where(req => req.RequisitionDate >= FromDate && req.RequisitionDate <= realToDate && req.RequisitionStatus != "withdrawn" && req.IsVerificationEnabled == true).OrderByDescending(req => req.RequisitionId).ToList();
                foreach (var req in requisitionList)
                {
                    req.CurrentVerificationLevelCount = GetNumberOfVerificationDone(inventoryDb, req.VerificationId ?? 0);

                    var VerifierIdsParsed = DanpheJSONConvert.DeserializeObject<List<dynamic>>(req.VerifierIds);
                    IsUserAllowedToSeeRequisition(inventoryDb, user, req, VerifierIdsParsed);
                    req.StoreName = GetStoreName(inventoryDb, req.RequestFromStoreId);


                    // SetDataForInventoryRequisition(inventoryDb, rbacDb, req);
                }
                //Step 3: filter the requisition List based on Permission Id.
                //requisitionList = FilterRequisitionListByUserPermission(user, requisitionList);
                //CheckForVerificationPermission(inventoryDb, rbacDb, user, requisitionList);
                return requisitionList;
            }
            catch (Exception ex)
            {

                throw ex;
            }
        }

        private static string GetStoreName(InventoryDbContext inventoryDb, int StoreId)
        {
            return inventoryDb.StoreMasters.FirstOrDefault(store => store.StoreId == StoreId).Name;
        }

        private static bool IsUserAllowedToSeeRequisition(InventoryDbContext db, RbacUser user, RequisitionModel requisition, List<dynamic> VerifierIdsParsed)
        {
            bool isUserAllowToSeeReq = false;
            for (int i = 0; i < VerifierIdsParsed.Count(); i++)
            {
                dynamic VerifierId = DanpheJSONConvert.DeserializeObject<int>(Convert.ToString(VerifierIdsParsed[i].Id));
                var VerifierType = VerifierIdsParsed[i].Type;
                if ((RBAC.UserIsSuperAdmin(user.UserId) || (VerifierType == "role" && RBAC.UserHasRoleId(user.UserId, VerifierId)) || (VerifierType == "user" && user.UserId == VerifierId)))
                {
                    isUserAllowToSeeReq = true;
                    requisition.CurrentVerificationLevel = i + 1;
                    requisition.isVerificationAllowed = !CheckForVerificationExistAtThisLevel(db, requisition.CurrentVerificationLevel, requisition.VerificationId);
                    requisition.MaxVerificationLevel = VerifierIdsParsed.Count();
                    if (requisition.isVerificationAllowed == true)
                    {
                        break;
                    }
                    requisition.VerificationStatus = VerificationStatus;
                }
            }
            return isUserAllowToSeeReq;
        }
        private static void CheckForVerificationPermission(InventoryDbContext inventoryDb, RbacDbContext rbacDb, RbacUser user, List<RequisitionModel> requisitionList)
        {
            requisitionList.ForEach(req =>
            {
                req.isVerificationAllowed = false;
                req.VerificationStatus = "pending";
                // Verification should not be allowed in the level in which verification has already been done.
                if (req.CurrentVerificationLevelCount <= req.MaxVerificationLevel)
                {
                    //Algorithm for allowing verification sanjit: 6 April,2020
                    //1. Find out the permissions of store verifiers , i.e. req.PermissionIdList
                    //2. Find out the permission to which our user has access to. At this point, we should only view these requisition in the requisition list.
                    //3. Find the level associated with that permission.
                    //4. Find out if verification already exists at this level. If Not, verification is allowed.
                    for (int i = 0; i < req.PermissionIdList.Count(); i++)
                    {
                        if (RBAC.UserHasPermissionId(user.UserId, req.PermissionIdList[i]) == true)
                        {
                            var authorizedPermissionId = req.PermissionIdList[i];
                            req.CurrentVerificationLevel = rbacDb.StoreVerificationMapModel.Where(svm => svm.StoreId == req.RequestFromStoreId && svm.PermissionId == authorizedPermissionId)
                                                                                        .Select(svm => svm.VerificationLevel).FirstOrDefault();
                            req.isVerificationAllowed = !CheckForVerificationExistAtThisLevel(inventoryDb, req.CurrentVerificationLevel, req.VerificationId);
                            if (req.isVerificationAllowed == true)
                            {
                                break;
                            }
                            req.VerificationStatus = VerificationStatus;
                        }

                    }
                }
            });
        }
        /// <summary>
        /// 1. Checks if verification exists, if not returns false, allow verification.
        /// 2. Checks if status is rejected, if yes, returns true, disable verification.
        /// 3. Checks for level matched, if not, do this process for parent verification id, if yes, returns true, disable verification.
        /// </summary>
        /// <param name="inventoryDb"></param>
        /// <param name="VerificationLevel"></param>
        /// <param name="VerificationId"></param>
        /// <returns></returns>
        private static bool CheckForVerificationExistAtThisLevel(InventoryDbContext inventoryDb, int VerificationLevel, int? VerificationId)
        {
            bool isExist = false;
            if (VerificationLevel > 0 && VerificationId != null & VerificationId > 0)
            {
                var verification = inventoryDb.Verifications.Where(v => v.VerificationId == VerificationId)
                                                            .Select(v => new { v.CurrentVerificationLevel, v.ParentVerificationId, v.VerificationStatus })
                                                            .FirstOrDefault();

                if (verification.VerificationStatus != "rejected" && verification.CurrentVerificationLevel != VerificationLevel)
                {
                    if (verification.ParentVerificationId > 0)
                    {
                        //call this function again;
                        //because it is possible that requisition at this level has been verified in the past.
                        isExist = CheckForVerificationExistAtThisLevel(inventoryDb, VerificationLevel, verification.ParentVerificationId);
                    }
                    else
                    {
                        isExist = false;
                    }
                }
                else
                {
                    VerificationStatus = verification.VerificationStatus;
                    isExist = true;
                }
            }
            return isExist;
        }


        public static void UpdateRequisitionAfterApproved(InventoryDbContext inventoryDbContext, RequisitionModel requisition, int VerificationId, RbacUser currentUser, int CurrentVerificationLevelCount)
        {
            try
            {
                foreach (var rItems in requisition.RequisitionItems)
                {
                    var existingItem = inventoryDbContext.RequisitionItems.Find(rItems.RequisitionItemId);
                    if (existingItem != null)
                    {
                        existingItem.PendingQuantity = rItems.PendingQuantity;
                        existingItem.CancelQuantity = rItems.CancelQuantity;
                        existingItem.ModifiedOn = DateTime.Now;
                        existingItem.ModifiedBy = currentUser.EmployeeId;
                        existingItem.RequisitionItemStatus = rItems.RequisitionItemStatus;
                        existingItem.Quantity = rItems.Quantity;
                        existingItem.IsActive = rItems.IsActive;

                        // These are the extra cases to look at during item cancel.
                        if (rItems.IsActive == false && rItems.CancelBy == null)
                        {
                            existingItem.CancelQuantity = rItems.PendingQuantity;
                            existingItem.CancelBy = currentUser.EmployeeId;
                            existingItem.CancelOn = DateTime.Now;
                        }
                    }
                }
                int minimumDispatchLevel = 0;
                var param = inventoryDbContext.CfgParameters.FirstOrDefault(p => p.ParameterGroupName == "Inventory" && p.ParameterName == "SigningPanelConfiguration");
                if (param != null)
                {
                    var jsonObject = JObject.Parse(param.ParameterValue);
                    minimumDispatchLevel = (int)jsonObject["MinimumDispatchLevel"];
                }

                if (CurrentVerificationLevelCount > 0 && (minimumDispatchLevel == CurrentVerificationLevelCount || requisition.MaxVerificationLevel == CurrentVerificationLevelCount))
                {
                    requisition.RequisitionStatus = ENUM_InventoryRequisitionStatus.Active;
                }

                var existingRequisition = inventoryDbContext.Requisitions.Find(requisition.RequisitionId);
                if (existingRequisition != null)
                {
                    existingRequisition.RequisitionStatus = requisition.RequisitionStatus;
                    existingRequisition.ModifiedOn = DateTime.Now;
                    existingRequisition.ModifiedBy = currentUser.EmployeeId;
                    existingRequisition.VerificationId = VerificationId;
                }

                inventoryDbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        private static List<RequisitionModel> FilterRequisitionListByUserPermission(RbacUser user, List<RequisitionModel> requisitionList)
        {
            requisitionList = requisitionList.Where(req => req.PermissionIdList
                                             .Any(p => RBAC.UserHasPermissionId(user.UserId, p) == true) == true)
                                             .ToList();
            return requisitionList;
        }
        private static void SetDataForInventoryRequisition(InventoryDbContext inventoryDb, RbacDbContext rbacDb, RequisitionModel req)
        {
            //set current verification level in the requisition level
            if (req.VerificationId == null || req.VerificationId == 0)
            {
                req.CurrentVerificationLevel = 0;
                req.CurrentVerificationLevelCount = 0;
            }
            else
            {
                req.CurrentVerificationLevelCount = GetNumberOfVerificationDone(inventoryDb, req.VerificationId ?? 0);
            }
            //set store Name and Max Verification Level for displaying purpose
            var storeDetails = inventoryDb.StoreMasters
                                .Where(store => store.StoreId == req.RequestFromStoreId)
                                .Select(store => new { store.Name, store.MaxVerificationLevel }).FirstOrDefault();
            req.StoreName = storeDetails.Name;
            req.MaxVerificationLevel = storeDetails.MaxVerificationLevel;

            //Step 2: set permission id so that we can filter which requisition to show.
            req.PermissionIdList = SubstoreBL.GetStoreVerifiersPermissionList(req.RequestFromStoreId, rbacDb).ToList();
            //req.NextVerifiersPermissionName = SubstoreBL.GetCurrentVerifiersPermissionName(req.StoreId, req.CurrentVerificationLevel + 1, rbacDb);
        }
        public static InventoryRequisitionViewModel GetInventoryRequisitionDetails(int RequisitionId, RbacUser user, InventoryDbContext inventoryDb)
        {
            try
            {
                var requisitionVM = new InventoryRequisitionViewModel();
                requisitionVM.RequisitionItemList = inventoryDb.RequisitionItems.Where(RI => RI.RequisitionId == RequisitionId && RI.RequisitionItemStatus != "withdrawn").ToList();


                var requisition = inventoryDb.Requisitions.Where(req => req.RequisitionId == RequisitionId).FirstOrDefault();

                foreach (var item in requisitionVM.RequisitionItemList)
                {
                    var itemDetails = inventoryDb.Items.Where(itm => itm.ItemId == item.ItemId)
                                                        .Select(itm => new { itm.ItemName, itm.Code, itm.UnitOfMeasurementId }).FirstOrDefault();
                    var itemUOMName = inventoryDb.UnitOfMeasurementMaster.Where(uom => uom.UOMId == itemDetails.UnitOfMeasurementId)
                                                                            .Select(uom => uom.UOMName).FirstOrDefault();
                    item.ItemName = itemDetails.ItemName;
                    item.Code = itemDetails.Code;
                    item.UOMName = itemUOMName;
                    item.IsEdited = false;
                    item.AvailableQuantity = inventoryDb.StoreStocks
                                                .Where(s => s.ItemId == item.ItemId && s.StoreId == requisition.RequestToStoreId)
                                                .Sum(s => (double?)s.AvailableQuantity) ?? 0;
                }


                if (requisition != null)
                {
                    requisitionVM.RequestingUser.Name = GetNameByEmployeeId(requisition.CreatedBy, inventoryDb);
                    requisitionVM.RequestingUser.Date = requisition.CreatedOn;
                    if (requisition.VerificationId != null)
                    {
                        int VerificationId = requisition.VerificationId ?? 0;
                        requisitionVM.Verifiers = GetVerifiersList(VerificationId, inventoryDb);
                    }

                    dynamic VerifierList = null;
                    if (requisition.VerifierIds != null)
                    {
                        VerifierList = DanpheJSONConvert.DeserializeObject<List<dynamic>>(requisition.VerifierIds);
                    }

                    requisitionVM.isVerificationAllowed = InventoryBL.IsUserAllowedToSeeRequisition(inventoryDb, user, requisition, VerifierList);
                    requisitionVM.Dispatchers = GetDispatchersList(RequisitionId, inventoryDb);
                }

                return requisitionVM;
            }
            catch (Exception ex)
            {

                throw ex;
            }
        }
        public static List<DispatchVerificationActor> GetDispatchersList(int RequisitionId, InventoryDbContext inventoryDb)
        {
            List<DispatchListViewModel> dispatchDetails = InventoryBL.GetDispatchesFromRequisitionId(RequisitionId, inventoryDb);
            var dispatchers = new List<DispatchVerificationActor>();
            if (dispatchDetails != null && dispatchDetails.Count() > 0)
            {
                dispatchers = dispatchDetails.Select(D => new DispatchVerificationActor
                {
                    DispatchId = D.DispatchId,
                    Date = D.DispatchedDate ?? default(DateTime),
                    Remarks = D.Remarks,
                    Name = D.DispatchedByName,
                    isReceived = D.isReceived
                }).ToList();
            }

            return dispatchers;
        }


        public static object GetReceiversFromRequisitionId(int RequisitionId, InventoryDbContext inventoryDbContext)
        {

            var receiveDetails = (from
                                    dis in inventoryDbContext.Dispatch
                                  join emp in inventoryDbContext.Employees on dis.ReceivedBy equals emp.EmployeeId
                                  where dis.RequisitionId == RequisitionId
                                  select new
                                  {
                                      Date = dis.ReceivedOn,
                                      Remarks = dis.ReceivedRemarks,
                                      Name = emp.FullName
                                  }).ToList();


            return receiveDetails;
        }

        public static List<PurchaseRequestModel> GetInventoryPurchaseRequestsBasedOnUser(DateTime FromDate, DateTime ToDate, InventoryDbContext inventoryDb, RbacDbContext rbacDb, RbacUser user)
        {
            try
            {
                var PRVerificationSettingsParsed = GetPurchaseRequestVerificationSetting(inventoryDb);
                if (PRVerificationSettingsParsed != null)
                {
                    if (PRVerificationSettingsParsed.VerificationLevel > 0)
                    {
                        var realToDate = ToDate.AddDays(1);
                        //Step 1: Take all the active requisition in memory.
                        var PurchaseRequests = inventoryDb.PurchaseRequest.Where(PR => PR.RequestDate >= FromDate && PR.RequestDate <= realToDate && PR.RequestStatus != ENUM_InventoryRequisitionStatus.Withdrawn).OrderByDescending(req => req.PurchaseRequestId).ToList();
                        foreach (var purchaseReq in PurchaseRequests)
                        {
                            //set current verification level in the requisition level
                            if (purchaseReq.VerificationId == null || purchaseReq.VerificationId == 0)
                            {
                                purchaseReq.CurrentVerificationLevel = 0;
                                purchaseReq.CurrentVerificationLevelCount = 0;
                            }
                            else
                            {
                                purchaseReq.CurrentVerificationLevelCount = GetNumberOfVerificationDone(inventoryDb, purchaseReq.VerificationId ?? 0);
                            }
                            //set store Name and Max Verification Level for displaying purpose

                            purchaseReq.MaxVerificationLevel = PRVerificationSettingsParsed.VerificationLevel;
                            purchaseReq.PermissionIdList = PRVerificationSettingsParsed.PermissionIds;
                            purchaseReq.RequestedByName = VerificationBL.GetNameByEmployeeId(purchaseReq.CreatedBy, inventoryDb);
                            purchaseReq.RequestFromStoreName = inventoryDb.StoreMasters.Find(purchaseReq.StoreId).Name;
                            purchaseReq.VendorName = GetInventoryVendorNameById(inventoryDb, purchaseReq.VendorId ?? 0);
                            if (purchaseReq.VerificationId != null)
                            {
                                purchaseReq.CurrentVerificationLevelCount = VerificationBL.GetNumberOfVerificationDone(inventoryDb, purchaseReq.VerificationId ?? 0);
                            }
                            else
                            {
                                purchaseReq.CurrentVerificationLevelCount = 0;
                            }



                        }
                        //Step 3: filter the requisition List based on Permission Id.
                        PurchaseRequests = PurchaseRequests.Where(req => req.PermissionIdList
                                                     .Any(p => RBAC.UserHasPermissionId(user.UserId, p) == true) == true)
                                                     .ToList();
                        PurchaseRequests.ForEach(req =>
                        {
                            req.isVerificationAllowed = false;
                            req.VerificationStatus = "pending";
                            // Verification should not be allowed in the level in which verification has already been done.
                            if (req.CurrentVerificationLevelCount <= req.MaxVerificationLevel)
                            {
                                //Algorithm for allowing verification sanjit: 6 April,2020
                                //1. Find out the permissions of store verifiers , i.e. req.PermissionIdList
                                //2. Find out the permission to which our user has access to. At this point, we should only view these requisition in the requisition list.
                                //3. Find the level associated with that permission.
                                //4. Find out if verification already exists at this level. If Not, verification is allowed.
                                for (int i = 0; i < req.PermissionIdList.Count(); i++)
                                {
                                    if (RBAC.UserHasPermissionId(user.UserId, req.PermissionIdList[i]) == true)
                                    {
                                        var authorizedPermissionId = req.PermissionIdList[i];
                                        req.CurrentVerificationLevel = i + 1;
                                        req.isVerificationAllowed = !CheckForVerificationExistAtThisLevel(inventoryDb, req.CurrentVerificationLevel, req.VerificationId);
                                        if (req.isVerificationAllowed == true)
                                        {
                                            if (req.IsPOCreated == true) { req.isVerificationAllowed = false; }
                                            break;
                                        }
                                        req.VerificationStatus = VerificationStatus;
                                    }

                                }
                            }
                        });
                        return PurchaseRequests;
                    }
                    else { return null; }
                }
                else
                {
                    return null;
                }
            }
            catch (Exception ex)
            {

                throw ex;
            }
        }
        public static VER_INV_PurchaseRequestParameterModel GetPurchaseRequestVerificationSetting(InventoryDbContext inventoryDb)
        {
            var PRVerificationSettings = inventoryDb.CfgParameters
                                       .Where(a => a.ParameterGroupName == "Inventory" && a.ParameterName == "PurchaseRequestVerificationSettings")
                                       .Select(Param => Param.ParameterValue).FirstOrDefault();

            var PRVerificationSettingJson = DanpheJSONConvert.DeserializeObject<VER_INV_PurchaseRequestParameterModel>(PRVerificationSettings);
            if (PRVerificationSettingJson.EnableVerification)
            {
                return PRVerificationSettingJson;
            }
            else
            {
                PRVerificationSettingJson.VerificationLevel = 0;
                PRVerificationSettingJson.EnableVerification = false;
                PRVerificationSettingJson.PermissionIds = null;
                return PRVerificationSettingJson;
            }

        }
        public static InventoryPurchaseRequestViewModel GetInventoryPurchaseRequestDetails(int PurchaseRequestId, InventoryDbContext inventoryDb, int? StoreId)
        {
            try
            {
                var requisitionVM = new InventoryPurchaseRequestViewModel();
                requisitionVM.RequestedItemList = inventoryDb.PurchaseRequestItems.Where(RI => RI.PurchaseRequestId == PurchaseRequestId).ToList();
                foreach (var item in requisitionVM.RequestedItemList)
                {
                    var itemDetails = inventoryDb.Items.Where(itm => itm.ItemId == item.ItemId)
                                                        .Select(itm => new { itm.ItemName, itm.Code, itm.UnitOfMeasurementId, itm.MSSNO, itm.StandardRate }).FirstOrDefault();
                    var itemUOMName = inventoryDb.UnitOfMeasurementMaster.Where(uom => uom.UOMId == itemDetails.UnitOfMeasurementId)
                                                                            .Select(uom => uom.UOMName).FirstOrDefault();
                    item.ItemName = itemDetails.ItemName;
                    item.Code = itemDetails.Code;
                    item.UOMName = itemUOMName;
                    item.MSSNO = itemDetails.MSSNO;
                    item.IsEdited = false;
                    item.StandardRate = itemDetails.StandardRate;
                    if (StoreId != null)
                    {
                        item.AvailableQuantity = inventoryDb.StoreStocks.Where(stk => stk.ItemId == item.ItemId && stk.StoreId == StoreId).Sum(stk => (double?)stk.AvailableQuantity);
                    }
                    else
                    {
                        item.AvailableQuantity = inventoryDb.StoreStocks.Where(stk => stk.ItemId == item.ItemId).Sum(stk => (double?)stk.AvailableQuantity);
                    }


                    item.POQuantity = inventoryDb.PurchaseOrders.Where(a => a.RequisitionId == item.PurchaseRequestId)
                                                            .Join(inventoryDb.PurchaseOrderItems, po => new { item.ItemId, po.PurchaseOrderId }, poI => new { poI.ItemId, poI.PurchaseOrderId }, (po, poI) => poI.Quantity)
                                                            .FirstOrDefault();
                }


                var requisition = inventoryDb.PurchaseRequest.Where(req => req.PurchaseRequestId == PurchaseRequestId)
                                                            .Select(req => new { req.CreatedBy, req.CreatedOn, req.VerificationId })
                                                            .FirstOrDefault();
                requisitionVM.RequestingUser.Name = GetNameByEmployeeId(requisition.CreatedBy, inventoryDb);
                requisitionVM.RequestingUser.Date = requisition.CreatedOn;
                if (requisition.VerificationId != null)
                {
                    int VerificationId = requisition.VerificationId ?? 0;
                    requisitionVM.Verifiers = GetVerifiersList(VerificationId, inventoryDb);
                }
                return requisitionVM;
            }
            catch (Exception ex)
            {

                throw ex;
            }
        }
        public static int? GetIMIRNo(InventoryDbContext inventoryDbContext, DateTime? DecidingDate = null)
        {
            DecidingDate = (DecidingDate == null) ? DateTime.Now.Date : DecidingDate;
            var selectedFiscalYear = inventoryDbContext.InventoryFiscalYears.Where(fsc => fsc.StartDate <= DecidingDate && fsc.EndDate >= DecidingDate).FirstOrDefault();

            int imirNo = (from invtxn in inventoryDbContext.GoodsReceipts
                          where selectedFiscalYear.StartDate <= invtxn.IMIRDate && selectedFiscalYear.EndDate >= invtxn.IMIRDate
                          select invtxn.IMIRNo ?? 0).DefaultIfEmpty(0).Max();
            return imirNo + 1;
        }
        public static string GetInventoryVendorNameById(InventoryDbContext inventoryDb, int VendorId)
        {
            return inventoryDb.Vendors.Where(V => V.VendorId == VendorId).Select(V => V.VendorName).FirstOrDefault();
        }
        public static string GetNameByEmployeeId(int EmployeeId, InventoryDbContext db)
        {
            try
            {
                var empId = db.Employees.Where(emp => emp.EmployeeId == EmployeeId)
                                           .Select(emp => emp.FullName).FirstOrDefault();
                return empId;
            }
            catch (Exception ex)
            {

                throw ex;
            }
        }
        public static List<VerificationActor> GetVerifiersList(int VerificationId, InventoryDbContext dbContext)
        {
            var VerificationList = new List<VerificationActor>();

            var verificationModel = dbContext.Verifications.Find(VerificationId);
            var verification = new VerificationActor();
            verification.Name = GetNameByEmployeeId(verificationModel.VerifiedBy, dbContext);
            verification.Date = verificationModel.VerifiedOn;
            verification.Status = verificationModel.VerificationStatus;
            verification.Remarks = verificationModel.VerificationRemarks;
            if (verificationModel.ParentVerificationId != null)
            {
                VerificationList = GetVerifiersList(verificationModel.ParentVerificationId ?? 0, dbContext);
            }
            VerificationList.Add(verification);
            return VerificationList;
        }
        public static int GetNumberOfVerificationDone(InventoryDbContext inventoryDb, int VerificationId)
        {
            return inventoryDb.Verifications.Where(V => V.VerificationId == VerificationId).Select(V => V.CurrentVerificationLevelCount).FirstOrDefault();
        }
        public static List<POVerifier> GetAllPOVerifiers(RbacDbContext db)
        {
            var VerifiersList = db.Roles
                                    .Where(R => R.IsActive == true)
                                    .Select(R => new POVerifier
                                    {
                                        Id = R.RoleId,
                                        Name = R.RoleName,
                                        Type = "role"
                                    }).ToList();
            VerifiersList.AddRange(db.Users.Where(U => U.IsActive == true)
                                    .Join(db.Employees, u => u.EmployeeId, e => e.EmployeeId,
                                    (u, e) => new { u, e })
                                    .Select(U => new POVerifier
                                    {
                                        Id = U.u.UserId,
                                        Name = U.e.FullName,
                                        Type = "user"
                                    }).ToList());
            return VerifiersList;

        }
        public static List<PurchaseOrderModel> GetInventoryPurchaseOrdersBasedOnUser(DateTime FromDate, DateTime ToDate, InventoryDbContext db, RbacDbContext rbac, RbacUser user)
        {
            var realToDate = ToDate.AddDays(1);
            var PurchaseOrderList = db.PurchaseOrders.Where(PO => PO.CreatedOn >= FromDate && PO.CreatedOn < realToDate && PO.IsVerificationEnabled == true && PO.POStatus != "withdrawn").OrderByDescending(a => a.PurchaseOrderId).ToList();
            var FilteredPurchaseOrderList = new List<PurchaseOrderModel>();
            //puchase order ko veriferIds field cha, role and userId check, cha bhane, show purchase order
            foreach (var purchaseOrder in PurchaseOrderList)
            {
                purchaseOrder.IsVerificationAllowed = false;
                purchaseOrder.VerificationStatus = "pending";
                purchaseOrder.CurrentVerificationLevel = 0;
                purchaseOrder.CurrentVerificationLevelCount = (purchaseOrder.VerificationId == null) ? 0 : GetNumberOfVerificationDone(db, purchaseOrder.VerificationId ?? 0);
                purchaseOrder.OrderFromStoreName = db.StoreMasters.Find(purchaseOrder.StoreId).Name;

                var VerifierIdsParsed = DanpheJSONConvert.DeserializeObject<List<dynamic>>(purchaseOrder.VerifierIds);

                if (IsUserAllowedToSeePo(db, user, purchaseOrder, VerifierIdsParsed))
                {
                    purchaseOrder.VendorName = GetInventoryVendorNameById(db, purchaseOrder.VendorId);
                    FilteredPurchaseOrderList.Add(purchaseOrder);
                }
            }
            return FilteredPurchaseOrderList;
        }

        private static Boolean IsUserAllowedToSeePo(InventoryDbContext db, RbacUser user, PurchaseOrderModel purchaseOrder, List<dynamic> VerifierIdsParsed)
        {
            bool isUserAllowToSeePO = false;
            for (int i = 0; i < VerifierIdsParsed.Count(); i++)
            {
                dynamic VerifierId = DanpheJSONConvert.DeserializeObject<int>(Convert.ToString(VerifierIdsParsed[i].Id));
                var VerifierType = VerifierIdsParsed[i].Type;
                if ((RBAC.UserIsSuperAdmin(user.UserId) || (VerifierType == "role" && RBAC.UserHasRoleId(user.UserId, VerifierId)) || (VerifierType == "user" && user.UserId == VerifierId)))
                {
                    isUserAllowToSeePO = true;
                    purchaseOrder.CurrentVerificationLevel = i + 1;
                    purchaseOrder.IsVerificationAllowed = !CheckForVerificationExistAtThisLevel(db, purchaseOrder.CurrentVerificationLevel, purchaseOrder.VerificationId);
                    purchaseOrder.MaxVerificationLevel = VerifierIdsParsed.Count();
                    if (purchaseOrder.IsVerificationAllowed == true)
                    {
                        break;
                    }
                    purchaseOrder.VerificationStatus = VerificationStatus;
                }
            }
            return isUserAllowToSeePO;
        }
        public static InventoryPurchaseOrderViewModel GetInventoryPurchaseOrderDetails(int PurchaseOrderId, InventoryDbContext db)
        {
            try
            {
                var PurchaseOrderVM = new InventoryPurchaseOrderViewModel();
                PurchaseOrderVM.OrderedItemList = db.PurchaseOrderItems.Where(OI => OI.PurchaseOrderId == PurchaseOrderId).ToList();
                foreach (var item in PurchaseOrderVM.OrderedItemList)
                {
                    var itemDetails = db.Items.Where(itm => itm.ItemId == item.ItemId)
                                                        .Select(itm => new { itm.ItemName, itm.Code, itm.UnitOfMeasurementId }).FirstOrDefault();
                    var itemUOMName = db.UnitOfMeasurementMaster.Where(uom => uom.UOMId == itemDetails.UnitOfMeasurementId)
                                                                            .Select(uom => uom.UOMName).FirstOrDefault();
                    item.ItemName = itemDetails.ItemName;
                    item.Code = itemDetails.Code;
                    item.UOMName = itemUOMName;
                    item.IsEdited = false;
                }


                var requisition = db.PurchaseOrders.Where(req => req.PurchaseOrderId == PurchaseOrderId)
                                                            .Select(req => new { req.CreatedBy, req.CreatedOn, req.VerificationId, req.PONumber })
                                                            .FirstOrDefault();
                PurchaseOrderVM.OrderingUser.Name = GetNameByEmployeeId(requisition.CreatedBy, db);
                PurchaseOrderVM.PONumber = requisition.PONumber;
                PurchaseOrderVM.OrderingUser.Date = requisition.CreatedOn ?? DateTime.Now;
                if (requisition.VerificationId != null)
                {
                    int VerificationId = requisition.VerificationId ?? 0;
                    PurchaseOrderVM.Verifiers = GetVerifiersList(VerificationId, db);
                }
                return PurchaseOrderVM;
            }
            catch (Exception ex)
            {

                throw ex;
            }
        }

        public static QuotationRatesVm GetQuotationRatesDetails(int PurchaseOrderId, InventoryDbContext db)
        {
            var quotationsAgainstPO = (from POI in db.PurchaseOrderItems
                                       from QCI in db.QuotationItems.Where(qi => qi.ItemId == POI.ItemId).DefaultIfEmpty()
                                       from QC in db.Quotations.Where(q => q.QuotationId == QCI.QuotationId).DefaultIfEmpty()
                                       where POI.PurchaseOrderId == PurchaseOrderId
                                       select new
                                       {
                                           ItemId = POI.ItemId,
                                           ItemName = (QCI != null) ? QCI.ItemName : "",
                                           VendorId = (QC != null) ? QC.VendorId : default(int?),
                                           VendorName = (QC != null) ? QC.VendorName : "",
                                           Price = (QCI != null) ? QCI.Price : default(int?),
                                           Status = (QC != null) ? QC.Status : ""
                                       }).ToList();
            var itemNameList = quotationsAgainstPO.Select(a => a.ItemName).Distinct().ToList();
            var quotationRates = quotationsAgainstPO.Where(q => q.VendorId != null).GroupBy(q => q.VendorId)
                                        .Select(q => new QuotationRatesDto()
                                        {
                                            VendorId = q.Key,
                                            VendorName = q.FirstOrDefault().VendorName,
                                            ItemDetails = q.Select(i => new QuotationRatesComparisionDTO()
                                            {
                                                ItemId = i.ItemId,
                                                ItemName = i.ItemName,
                                                Price = i.Price,
                                                Status = i.Status
                                            }).ToList()
                                        }).ToList();
            return new QuotationRatesVm()
            {
                ItemNameList = itemNameList,
                QuotationRates = quotationRates
            };
        }


        #region Inventory Goods Receipt Verification Methods

        public static List<GoodsReceiptModel> GetInventoryGRBasedOnUser(DateTime FromDate, DateTime ToDate, InventoryDbContext db, RbacDbContext rbac, RbacUser user)
        {
            var realToDate = ToDate.AddDays(1);
            var GoodsReceiptList = db.GoodsReceipts.Where(PO => PO.CreatedOn >= FromDate && PO.CreatedOn < realToDate && PO.IsVerificationEnabled == true).OrderByDescending(a => a.GoodsReceiptID).ToList();
            var FilteredGoodsReceiptList = new List<GoodsReceiptModel>();
            //puchase order ko veriferIds field cha, role and userId check, cha bhane, show purchase order
            foreach (var gR in GoodsReceiptList)
            {
                var FiscalYear = db.InventoryFiscalYears.FirstOrDefault(a => a.FiscalYearId == gR.FiscalYearId);
                gR.FiscalYear = (FiscalYear != null) ? FiscalYear.FiscalYearName : "";
                gR.GoodsReceiptDate = gR.GoodsReceiptDate != null ? gR.GoodsReceiptDate : null;
                gR.GoodsArrivalFiscalYearFormatted = db.InventoryFiscalYears.Where(f => f.StartDate <= gR.GoodsArrivalDate && f.EndDate >= gR.GoodsArrivalDate).Select(f => f.FiscalYearName).FirstOrDefault();
                gR.IsVerificationAllowed = false;
                gR.VerificationStatus = "pending";
                gR.CurrentVerificationLevel = 0;
                gR.CurrentVerificationLevelCount = (gR.VerificationId == null) ? 0 : GetNumberOfVerificationDone(db, gR.VerificationId ?? 0);

                var VerifierIdsParsed = DanpheJSONConvert.DeserializeObject<List<dynamic>>(gR.VerifierIds);

                if (IsUserAllowedToSeeGR(db, user, gR, VerifierIdsParsed))
                {
                    gR.VendorName = GetInventoryVendorNameById(db, gR.VendorId);
                    FilteredGoodsReceiptList.Add(gR);
                }
            }
            return FilteredGoodsReceiptList;
        }
        private static Boolean IsUserAllowedToSeeGR(InventoryDbContext db, RbacUser user, GoodsReceiptModel gR, List<dynamic> VerifierIdsParsed)
        {
            bool isUserAllowToSeePO = false;
            for (int i = 0; i < VerifierIdsParsed.Count(); i++)
            {
                dynamic VerifierId = DanpheJSONConvert.DeserializeObject<int>(Convert.ToString(VerifierIdsParsed[i].Id));
                var VerifierType = VerifierIdsParsed[i].Type;
                if ((RBAC.UserIsSuperAdmin(user.UserId) || (VerifierType == "role" && RBAC.UserHasRoleId(user.UserId, VerifierId)) || (VerifierType == "user" && user.UserId == VerifierId)))
                {
                    isUserAllowToSeePO = true;
                    gR.CurrentVerificationLevel = i + 1;
                    gR.IsVerificationAllowed = !CheckForVerificationExistAtThisLevel(db, gR.CurrentVerificationLevel, gR.VerificationId);
                    gR.MaxVerificationLevel = VerifierIdsParsed.Count();
                    if (gR.IsVerificationAllowed == true)
                    {
                        break;
                    }
                    gR.VerificationStatus = VerificationStatus;
                }
            }
            return isUserAllowToSeePO;
        }
        public static InventoryGoodsReceiptViewModel GetInventoryGRDetails(int GoodsReceiptId, InventoryDbContext db)
        {
            try
            {
                var GoodsReceiptVM = new InventoryGoodsReceiptViewModel();
                GoodsReceiptVM.ReceivedItemList = db.GoodsReceiptItems.Where(OI => OI.GoodsReceiptId == GoodsReceiptId).ToList();
                GoodsReceiptVM.ReceivedItemList.ForEach(item =>
                {
                    item.grItemCharges = (from grItems in db.GoodsReceiptItems
                                          join grItemCharges in db.GRItemCharges on grItems.GoodsReceiptItemId equals grItemCharges.GoodsReceiptItemId
                                          join otherCharges in db.OtherCharges on grItemCharges.ChargeId equals otherCharges.ChargeId
                                          where grItems.GoodsReceiptItemId == item.GoodsReceiptItemId
                                          select new GRItemChargesViewModel
                                          {
                                              Id = grItemCharges.Id,
                                              ChargeName = otherCharges.ChargeName,
                                              TotalAmount = grItemCharges.TotalAmount

                                          }).ToList();
                });
                foreach (var item in GoodsReceiptVM.ReceivedItemList)
                {
                    var itemDetails = db.Items.Where(itm => itm.ItemId == item.ItemId)
                                                        .Select(itm => new { itm.ItemName, itm.MSSNO, itm.Code, itm.UnitOfMeasurementId }).FirstOrDefault();
                    var itemUOMName = db.UnitOfMeasurementMaster.Where(uom => uom.UOMId == itemDetails.UnitOfMeasurementId)
                                                                            .Select(uom => uom.UOMName).FirstOrDefault();
                    item.ItemName = itemDetails.ItemName;
                    item.Code = itemDetails.Code;
                    item.MSSNO = itemDetails.MSSNO;
                    item.UOMName = itemUOMName;
                    item.IsEdited = false;
                }


                var goodsReceipt = db.GoodsReceipts.Where(gr => gr.GoodsReceiptID == GoodsReceiptId)
                                    .Join(db.Vendors, a => a.VendorId, b => b.VendorId, (gr, vendor) => new { gr, vendor })
                                    .GroupJoin(db.PurchaseOrders, a => a.gr.PurchaseOrderId, b => b.PurchaseOrderId, (grMain, po) => new { grMain.gr, grMain.vendor, po })
                                    .SelectMany(a => a.po.DefaultIfEmpty(), (grMain, poLJ) => new { grMain.gr, grMain.vendor, po = poLJ })
                                    .Select(a => new
                                    {
                                        a.gr.CreatedBy,
                                        a.gr.CreatedOn,
                                        a.gr.VerificationId,
                                        a.gr.MaterialCoaDate,
                                        a.gr.MaterialCoaNo,
                                        a.vendor.VendorName,
                                        a.vendor.ContactAddress,
                                        a.vendor.ContactNo,
                                        PurchaseOrderId = a.po != null ? a.po.PurchaseOrderId : 0,
                                        PoDate = a.po != null ? a.po.PoDate : null,
                                    }).FirstOrDefault();
                GoodsReceiptVM.ReceivingUser.Name = GetNameByEmployeeId(goodsReceipt.CreatedBy ?? 0, db);
                GoodsReceiptVM.ReceivingUser.Date = goodsReceipt.CreatedOn ?? DateTime.Now;
                if (goodsReceipt.VerificationId != null)
                {
                    GoodsReceiptVM.Verifiers = GetVerifiersList(goodsReceipt.VerificationId ?? 0, db);
                }
                var purchaseOrderDetails = db.PurchaseOrders.Where(p => p.PurchaseOrderId == goodsReceipt.PurchaseOrderId).FirstOrDefault();
                GoodsReceiptVM.OrderDetails = new VER_PODetailModel
                {
                    PurchaseOrderId = goodsReceipt.PurchaseOrderId,
                    PONumber = purchaseOrderDetails != null ? purchaseOrderDetails.PONumber : null,
                    PoDate = goodsReceipt.PoDate,
                    VendorName = goodsReceipt.VendorName,
                    ContactNo = goodsReceipt.ContactNo,
                    ContactAddress = goodsReceipt.ContactAddress
                };
                GoodsReceiptVM.grCharges = (from grCharges in db.GRCharges
                                            join otherChargesMst in db.OtherCharges on grCharges.ChargeId equals otherChargesMst.ChargeId
                                            where grCharges.GoodsReceiptID == GoodsReceiptId
                                            select new GRChargesViewModel
                                            {
                                                Id = grCharges.Id,
                                                ChargeName = otherChargesMst.ChargeName,
                                                TotalAmount = grCharges.TotalAmount

                                            }).ToList();
                return GoodsReceiptVM;
            }
            catch (Exception ex)
            {

                throw ex;
            }
        }
        #endregion



        #region Pharmacy Verification Methods

        #region Purchase Order Verification
        public static List<PharmacyPurchaseOrderVerification_DTO> GetPharmacyPurchaseOrdersBasedOnUser(DateTime FromDate, DateTime ToDate, PharmacyDbContext pharmacyDbContext, RbacUser currentUser)
        {
            var realToDate = ToDate.AddDays(1);
            var PurchaseOrderList = pharmacyDbContext.PHRMPurchaseOrder.Where(PO => PO.CreatedOn >= FromDate && PO.CreatedOn <= realToDate && PO.IsVerificationEnabled == true).OrderByDescending(a => a.PurchaseOrderId).ToList();

            var FilteredPurchaseOrderList = new List<PharmacyPurchaseOrderVerification_DTO>();

            foreach (var purchaseOrder in PurchaseOrderList)
            {
                var purchaseOrderDTO = DanpheJSONConvert.DeserializeObject<PharmacyPurchaseOrderVerification_DTO>(DanpheJSONConvert.SerializeObject(purchaseOrder));
                purchaseOrderDTO.PurchaseOrderId = purchaseOrder.PurchaseOrderId;
                purchaseOrderDTO.PurchaseOrderNo = (int)purchaseOrder.PurchaseOrderNo;
                purchaseOrderDTO.IsVerificationEnabled = purchaseOrder.IsVerificationEnabled;
                purchaseOrderDTO.POStatus = purchaseOrder.POStatus;
                purchaseOrderDTO.PODate = purchaseOrder.PODate;
                purchaseOrderDTO.IsVerificationAllowed = false;
                purchaseOrderDTO.VerificationStatus = "pending";
                purchaseOrderDTO.CurrentVerificationLevel = 0;
                purchaseOrderDTO.CurrentVerificationLevelCount = (purchaseOrder.VerificationId == null) ? 0 : GetNumberOfPharmacyVerificationDone(pharmacyDbContext, purchaseOrderDTO.VerificationId ?? 0);

                var VerifierIdsParsed = DanpheJSONConvert.DeserializeObject<List<dynamic>>(purchaseOrderDTO.VerifierIds);

                if (IsUserAllowedToSeePharmacyPo(pharmacyDbContext, currentUser, purchaseOrderDTO, VerifierIdsParsed))
                {
                    purchaseOrderDTO.SupplierName = GetPharmacySupplierNameById(pharmacyDbContext, purchaseOrder.SupplierId);
                    FilteredPurchaseOrderList.Add(purchaseOrderDTO);
                }
            }
            return FilteredPurchaseOrderList;
        }

        public static int GetNumberOfPharmacyVerificationDone(PharmacyDbContext pharmacyDbContext, int VerificationId)
        {
            return pharmacyDbContext.VerificationModels.Where(V => V.VerificationId == VerificationId).Select(V => V.CurrentVerificationLevelCount).FirstOrDefault();
        }

        public static string GetPharmacySupplierNameById(PharmacyDbContext pharmacyDbContext, int SupplierId)
        {
            return pharmacyDbContext.PHRMSupplier.Where(V => V.SupplierId == SupplierId).Select(V => V.SupplierName).FirstOrDefault();
        }

        private static Boolean IsUserAllowedToSeePharmacyPo(PharmacyDbContext pharmacyDbContext, RbacUser user, PharmacyPurchaseOrderVerification_DTO purchaseOrderDTO, List<dynamic> VerifierIdsParsed)
        {
            bool isUserAllowToSeePO = false;
            for (int i = 0; i < VerifierIdsParsed.Count(); i++)
            {
                dynamic VerifierId = DanpheJSONConvert.DeserializeObject<int>(Convert.ToString(VerifierIdsParsed[i].Id));
                var VerifierType = VerifierIdsParsed[i].Type;
                if ((RBAC.UserIsSuperAdmin(user.UserId) || (VerifierType == "role" && RBAC.UserHasRoleId(user.UserId, VerifierId)) || (VerifierType == "user" && user.UserId == VerifierId)))
                {
                    isUserAllowToSeePO = true;
                    purchaseOrderDTO.CurrentVerificationLevel = i + 1;
                    purchaseOrderDTO.IsVerificationAllowed = !CheckForPharmacyVerificationExistAtThisLevel(pharmacyDbContext, purchaseOrderDTO.CurrentVerificationLevel, purchaseOrderDTO.VerificationId);
                    purchaseOrderDTO.MaxVerificationLevel = VerifierIdsParsed.Count();
                    if (purchaseOrderDTO.IsVerificationAllowed == true)
                    {
                        break;
                    }
                    purchaseOrderDTO.VerificationStatus = VerificationStatus;
                }
            }
            return isUserAllowToSeePO;
        }

        private static bool CheckForPharmacyVerificationExistAtThisLevel(PharmacyDbContext pharmacyDbContext, int VerificationLevel, int? VerificationId)
        {
            if (VerificationLevel > 0 && VerificationId != null & VerificationId > 0)
            {
                var verification = pharmacyDbContext.VerificationModels.Where(v => v.VerificationId == VerificationId)
                                                            .Select(v => new { v.CurrentVerificationLevel, v.ParentVerificationId, v.VerificationStatus })
                                                            .FirstOrDefault();

                if (verification.VerificationStatus != "rejected" && verification.CurrentVerificationLevel != VerificationLevel)
                {
                    if (verification.ParentVerificationId > 0)
                    {
                        //call this function again;
                        //because it is possible that requisition at this level has been verified in the past.
                        return CheckForPharmacyVerificationExistAtThisLevel(pharmacyDbContext, VerificationLevel, verification.ParentVerificationId);
                    }
                    else
                    {
                        return false;
                    }
                }
                else
                {
                    VerificationStatus = verification.VerificationStatus;
                    return true;
                }
            }
            else
            {
                return false;
            }
        }


        public static List<VerificationActor> GetPharmacyVerifiersList(int? VerificationId, PharmacyDbContext pharmacyDbContext)
        {
            var VerificationList = new List<VerificationActor>();
            if (VerificationId != null)
            {
                var verificationModel = pharmacyDbContext.VerificationModels.Find(VerificationId);
                var verification = new VerificationActor();
                verification.Name = GetEmployeeNameByEmoloyeeId(verificationModel.VerifiedBy, pharmacyDbContext);
                verification.Date = verificationModel.VerifiedOn;
                verification.Status = verificationModel.VerificationStatus;
                verification.Remarks = verificationModel.VerificationRemarks;
                if (verificationModel.ParentVerificationId != null)
                {
                    VerificationList = GetPharmacyVerifiersList(verificationModel.ParentVerificationId ?? 0, pharmacyDbContext);
                }
                VerificationList.Add(verification);
            }

            return VerificationList;
        }


        public static string GetEmployeeNameByEmoloyeeId(int EmployeeId, PharmacyDbContext pharmacyDbContext)
        {
            try
            {
                var employeeName = pharmacyDbContext.Employees.Where(emp => emp.EmployeeId == EmployeeId)
                                           .Select(emp => emp.FullName).FirstOrDefault();
                return employeeName;
            }
            catch (Exception ex)
            {

                throw ex;
            }
        }

        public static object GetOrderInfo(int PurchaseOrderId, PharmacyDbContext pharmacyDbContext)
        {
            var OrderDetails = (from po in pharmacyDbContext.PHRMPurchaseOrder.Where(o => o.PurchaseOrderId == PurchaseOrderId)
                                join s in pharmacyDbContext.PHRMSupplier on po.SupplierId equals s.SupplierId
                                join fy in pharmacyDbContext.PharmacyFiscalYears on po.FiscalYearId equals fy.FiscalYearId
                                join emp in pharmacyDbContext.Employees on po.CreatedBy equals emp.EmployeeId
                                select new
                                {
                                    PurchaseOrderId = po.PurchaseOrderId,
                                    SupplierId = po.SupplierId,
                                    SupplierName = s.SupplierName,
                                    ContactAddress = s.ContactAddress,
                                    ContactNo = s.ContactNo,
                                    PANNumber = s.PANNumber,
                                    FiscalYearId = po.FiscalYearId,
                                    FiscalYearName = fy.FiscalYearName,
                                    PurchaseOrderNo = po.PurchaseOrderNo,
                                    ReferenceNo = po.ReferenceNo,
                                    PODate = po.PODate,
                                    POStatus = po.POStatus,
                                    DeliveryDays = po.DeliveryDays,
                                    DeliveryDate = po.DeliveryDate,
                                    DeliveryAddress = po.DeliveryAddress,
                                    InvoicingAddress = po.InvoicingAddress,
                                    Contact = po.Contact,
                                    Remarks = po.Remarks,
                                    TermsId = po.TermsId == null ? 0 : po.TermsId.Value,
                                    TermsConditions = po.TermsConditions,
                                    SubTotal = po.SubTotal,
                                    DiscountAmount = po.DiscountAmount,
                                    DiscountPercentage = po.DiscountPercentage,
                                    TaxableAmount = po.TaxableAmount,
                                    NonTaxableAmount = po.NonTaxableAmount,
                                    VATAmount = po.VATAmount,
                                    CCChargeAmount = po.CCChargeAmount,
                                    Adjustment = po.Adjustment,
                                    TotalAmount = po.TotalAmount,
                                    EmployeeName = emp.FullName,
                                    CreatedBy = po.CreatedBy,
                                    CreatedOn = po.CreatedOn,
                                    IsVerificationEnabled = po.IsVerificationEnabled,
                                    VerificationId = po.VerificationId,
                                    CancelledBy = po.CancelledBy,
                                    CancelledOn = po.CancelledOn,
                                }).FirstOrDefault();

            var OrderItemsDetails = (from oi in pharmacyDbContext.PHRMPurchaseOrderItems.Where(a => a.PurchaseOrderId == PurchaseOrderId)
                                     join item in pharmacyDbContext.PHRMItemMaster on oi.ItemId equals item.ItemId
                                     join g in pharmacyDbContext.PHRMGenericModel on oi.GenericId equals g.GenericId
                                     join uom in pharmacyDbContext.PHRMUnitOfMeasurement on item.UOMId equals uom.UOMId
                                     select new
                                     {
                                         PurchaseOrderId = oi.PurchaseOrderId,
                                         PurchaseOrderItemId = oi.PurchaseOrderItemId,
                                         ItemId = oi.ItemId,
                                         ItemName = item.ItemName,
                                         UOMName = uom.UOMName,
                                         Quantity = oi.IsPacking ? (double)oi.PackingQty : oi.Quantity,
                                         StandardRate = oi.IsPacking ? oi.StripRate : oi.StandardRate,
                                         ReceivedQuantity = oi.ReceivedQuantity,
                                         PendingQuantity = oi.PendingQuantity,
                                         SubTotal = oi.SubTotal,
                                         DiscountPercentage = oi.DiscountPercentage,
                                         DiscountAmount = oi.DiscountAmount,
                                         VATPercentage = oi.VATPercentage,
                                         VATAmount = oi.VATAmount,
                                         CCChargePercentage = oi.CCChargePercentage,
                                         CCChargeAmount = oi.CCChargeAmount,
                                         TotalAmount = oi.TotalAmount,
                                         AuthorizedRemark = oi.AuthorizedRemark,
                                         Remarks = oi.Remarks,
                                         POItemStatus = oi.POItemStatus,
                                         AuthorizedBy = oi.AuthorizedBy,
                                         AuthorizedOn = oi.AuthorizedOn,
                                         CreatedOn = oi.CreatedOn,
                                         IsCancel = oi.IsCancel,
                                         GenericId = oi.GenericId,
                                         GenericName = g.GenericName,
                                         FreeQuantity = oi.FreeQuantity,
                                         TotalQuantity = (float)((oi.IsPacking ? (double)oi.PackingQty : oi.Quantity) + (float)oi.FreeQuantity),
                                         CreatedBy = oi.CreatedBy,
                                         IsEdited = false,
                                         IsActive = oi.POItemStatus == "active" ? true : false,
                                         CancelledBy = oi.CancelledBy,
                                         CancelledOn = oi.CancelledOn
                                     }).ToList();
            return new
            {
                Order = OrderDetails,
                OrderItems = OrderItemsDetails,
                VerifierList = GetPharmacyVerifiersList(OrderDetails.VerificationId, pharmacyDbContext)
            };
        }

        public static int CreatePharmacyVerification(int EmployeeId, int CurrentVerificationLevel, int CurrentVerificationLevelCount, int MaxVerificationLevel, string VerificationStatus, string VerificationRemarks, int? ParentVerificationId, string TransactionType, PharmacyDbContext pharmacyDbContext)
        {
            PharmacyVerificationModel verification = new PharmacyVerificationModel();
            verification.VerifiedBy = EmployeeId;
            verification.VerifiedOn = DateTime.Now;
            verification.CurrentVerificationLevel = CurrentVerificationLevel;
            verification.CurrentVerificationLevelCount = CurrentVerificationLevelCount;
            verification.MaxVerificationLevel = MaxVerificationLevel;
            verification.VerificationStatus = VerificationStatus;
            verification.VerificationRemarks = VerificationRemarks;
            verification.ParentVerificationId = ParentVerificationId;
            verification.TransactionType = TransactionType;
            pharmacyDbContext.VerificationModels.Add(verification);
            pharmacyDbContext.SaveChanges();
            return verification.VerificationId;
        }

        public static object SaveVerification(PharmacyPurchaseOrder_DTO purchaseOrderDTO, RbacUser currentUser, PharmacyDbContext pharmacyDbContext)
        {
            var Status = "approved";
            var CurrentVerificationLevel = purchaseOrderDTO.CurrentVerificationLevel;
            var CurrentVerificationLevelCount = purchaseOrderDTO.CurrentVerificationLevelCount + 1;
            var MaxVerificationLevel = purchaseOrderDTO.MaxVerificationLevel;
            int? ParentVerificationId = purchaseOrderDTO.VerificationId;
            int VerificationId = CreatePharmacyVerification(currentUser.EmployeeId, CurrentVerificationLevel, CurrentVerificationLevelCount, MaxVerificationLevel, Status, purchaseOrderDTO.VerificationRemarks, ParentVerificationId, purchaseOrderDTO.TransactionType, pharmacyDbContext);
            if (CurrentVerificationLevelCount == MaxVerificationLevel)
            {
                purchaseOrderDTO.POStatus = ENUM_PharmacyPurchaseOrderStatus.Active;
            }
            UpdatePharmacyPurchaseOrderWithItems(pharmacyDbContext, purchaseOrderDTO, VerificationId, currentUser);
            return null;
        }


        public static void UpdatePharmacyPurchaseOrderWithItems(PharmacyDbContext pharmacyDbContext, PharmacyPurchaseOrder_DTO purchaseOrderDTO, int? VerificationId, RbacUser currentUser)
        {
            try
            {
                var checkStatus = true;
                var purchaseOrder = pharmacyDbContext.PHRMPurchaseOrder.Include("PHRMPurchaseOrderItems").Where(po => po.PurchaseOrderId == purchaseOrderDTO.PurchaseOrderId).FirstOrDefault();


                purchaseOrder.SubTotal = purchaseOrderDTO.SubTotal;
                purchaseOrder.DiscountAmount = purchaseOrderDTO.DiscountAmount;
                purchaseOrder.DiscountPercentage = purchaseOrderDTO.DiscountPercentage;
                purchaseOrder.VATAmount = purchaseOrderDTO.VATAmount;
                purchaseOrder.CCChargeAmount = purchaseOrderDTO.CCChargeAmount;
                purchaseOrder.TaxableAmount = purchaseOrderDTO.TaxableAmount;
                purchaseOrder.NonTaxableAmount = purchaseOrderDTO.NonTaxableAmount;
                purchaseOrder.TotalAmount = purchaseOrderDTO.TotalAmount;
                purchaseOrder.POStatus = purchaseOrderDTO.POStatus;
                purchaseOrder.VerificationId = VerificationId;


                var purchaseOrderItemsDict = purchaseOrderDTO.PurchaseOrderItems.ToDictionary(item => item.PurchaseOrderItemId);

                foreach (var item in purchaseOrder.PHRMPurchaseOrderItems)
                {
                    if (purchaseOrderItemsDict.TryGetValue(item.PurchaseOrderItemId, out var item1))
                    {
                        item.Quantity = item1.Quantity;
                        item.FreeQuantity = item1.FreeQuantity;
                        item.PendingFreeQuantity = item1.FreeQuantity;
                        item.StandardRate = item1.StandardRate;
                        item.SubTotal = item1.SubTotal;
                        item.DiscountPercentage = item1.DiscountPercentage;
                        item.DiscountAmount = item1.DiscountAmount;
                        item.VATPercentage = item1.VATPercentage;
                        item.VATAmount = item1.VATAmount;
                        item.CCChargePercentage = item1.CCChargePercentage;
                        item.CCChargeAmount = item1.CCChargeAmount;
                        item.TotalAmount = item1.TotalAmount;
                        item.POItemStatus = item1.POItemStatus;

                        if (VerificationId > 0)
                        {
                            if (item1.IsActive == false && item1.CancelledBy == null)
                            {
                                item.IsCancel = item1.IsActive;
                                item.CancelRemarks = "cancelled by" + currentUser.UserName;
                                item.CancelledOn = DateTime.Now;
                                item.CancelledBy = currentUser.EmployeeId;
                                item.ModifiedOn = DateTime.Now;
                                item.ModifiedBy = currentUser.EmployeeId;
                            }
                        }
                        else
                        {
                            checkStatus = false;
                        }
                    }
                }
                if (checkStatus)
                {
                    purchaseOrder.ModifiedBy = currentUser.EmployeeId;
                    purchaseOrder.ModifiedOn = DateTime.Now;
                }

                pharmacyDbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }


        public static bool SaveRejectedPurchaseOrder(int purchaseOrderId, int currentVerificationlevel, int currentVerificationLevelCount, int maxVerificationLevel, string VerificationRemarks, RbacUser currentUser, PharmacyDbContext pharmacyDbContext)
        {
            string CancelRemarks = "Rejected by " + currentUser.UserName;
            string VerificationStatus = "rejected";
            string TransactionType = "purchase-order";
            int? ParentVerificationId = null;
            if (currentVerificationLevelCount > 0)
            {
                ParentVerificationId = pharmacyDbContext.PHRMPurchaseOrder.Where(req => req.PurchaseOrderId == purchaseOrderId)
                    .Select(req => req.VerificationId).FirstOrDefault();
            }
            var VerificationId = VerificationBL.CreatePharmacyVerification(currentUser.EmployeeId, currentVerificationlevel, currentVerificationLevelCount, maxVerificationLevel, VerificationStatus, VerificationRemarks, ParentVerificationId, TransactionType, pharmacyDbContext);

            bool flag = VerificationBL.CancelPharmacyPurchaseOrderById(pharmacyDbContext, purchaseOrderId, CancelRemarks, currentUser, VerificationId);
            return flag;
        }


        public static bool CancelPharmacyPurchaseOrderById(PharmacyDbContext pharmacyDbContext, int purchaseOrderId, string CancelRemarks, RbacUser currentUser, int? VerificationId = null)
        {
            bool flag = true;
            using (var transaction = pharmacyDbContext.Database.BeginTransaction())
            {
                try
                {
                    var purchaseOrder = pharmacyDbContext.PHRMPurchaseOrder.Include("PHRMPurchaseOrderItems").Where(po => po.PurchaseOrderId == purchaseOrderId).FirstOrDefault();
                    purchaseOrder.CancelledBy = currentUser.EmployeeId;
                    purchaseOrder.CancelledOn = DateTime.Now;
                    purchaseOrder.POStatus = ENUM_PharmacyPurchaseOrderStatus.Cancel;
                    purchaseOrder.CancelRemarks = CancelRemarks;
                    purchaseOrder.VerificationId = (VerificationId != null && VerificationId > 0) ? VerificationId : null;
                    purchaseOrder.PHRMPurchaseOrderItems.ForEach(poi =>
                    {
                        poi.POItemStatus = ENUM_PharmacyPurchaseOrderStatus.Cancel;
                        poi.IsCancel = true;
                        poi.CancelledOn = DateTime.Now;
                        poi.CancelledBy = currentUser.EmployeeId;
                        poi.CancelRemarks = CancelRemarks;

                    });
                    pharmacyDbContext.SaveChanges();
                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    flag = false;
                    transaction.Rollback();
                    throw ex;
                }
            }
            return flag;
        }



        #endregion

        #region Purchase Requisition Verification
        public static List<PharmacyRequisitionVerification_DTO> GetPharmacyRequisitionsBasedOnUser(DateTime FromDate, DateTime ToDate, PharmacyDbContext pharmacyDbContext, RbacUser currentUser)
        {
            var RequisitionList = pharmacyDbContext.StoreRequisition.Where(req => DbFunctions.TruncateTime(req.CreatedOn) >= DbFunctions.TruncateTime(FromDate) && DbFunctions.TruncateTime(req.CreatedOn) <= DbFunctions.TruncateTime(ToDate) && req.IsVerificationEnabled == true).OrderByDescending(a => a.RequisitionId).ToList();

            var FilteredRequisitionList = new List<PharmacyRequisitionVerification_DTO>();

            foreach (var requisition in RequisitionList)
            {
                var requisitionDTO = DanpheJSONConvert.DeserializeObject<PharmacyRequisitionVerification_DTO>(DanpheJSONConvert.SerializeObject(requisition));
                requisitionDTO.RequisitionId = requisition.RequisitionId;
                requisitionDTO.RequisitionNo = requisition.RequisitionNo;
                requisitionDTO.IsVerificationEnabled = requisition.IsVerificationEnabled;
                requisitionDTO.RequisitionStatus = requisition.RequisitionStatus;
                requisitionDTO.RequisitionDate = requisition.RequisitionDate;
                requisitionDTO.IsVerificationAllowed = false;
                requisitionDTO.VerificationStatus = "pending";
                requisitionDTO.CurrentVerificationLevel = 0;
                requisitionDTO.CurrentVerificationLevelCount = (requisition.VerificationId == null) ? 0 : GetNumberOfPharmacyVerificationDone(pharmacyDbContext, (int)requisitionDTO.VerificationId);

                var VerifierIdsParsed = DanpheJSONConvert.DeserializeObject<List<dynamic>>(requisitionDTO.VerifierIds);

                if (IsUserAllowedToSeePharmacyRequisition(pharmacyDbContext, currentUser, requisitionDTO, VerifierIdsParsed))
                {
                    requisitionDTO.RequestedStoreName = GetSubStoreName(pharmacyDbContext, requisition.StoreId);
                    FilteredRequisitionList.Add(requisitionDTO);
                }
            }
            return FilteredRequisitionList;
        }

        private static string GetSubStoreName(PharmacyDbContext pharmacyDbContext, int StoreId)
        {
            return pharmacyDbContext.PHRMStore.FirstOrDefault(store => store.StoreId == StoreId).Name;
        }

        private static bool IsUserAllowedToSeePharmacyRequisition(PharmacyDbContext pharmacyDbContext, RbacUser user, PharmacyRequisitionVerification_DTO requisitionDTO, List<dynamic> VerifierIdsParsed)
        {
            bool isUserAllowToSeePO = false;
            for (int i = 0; i < VerifierIdsParsed.Count(); i++)
            {
                dynamic VerifierId = DanpheJSONConvert.DeserializeObject<int>(Convert.ToString(VerifierIdsParsed[i].Id));
                var VerifierType = VerifierIdsParsed[i].Type;
                if ((RBAC.UserIsSuperAdmin(user.UserId) || (VerifierType == "role" && RBAC.UserHasRoleId(user.UserId, VerifierId)) || (VerifierType == "user" && user.UserId == VerifierId)))
                {
                    isUserAllowToSeePO = true;
                    requisitionDTO.CurrentVerificationLevel = i + 1;
                    requisitionDTO.IsVerificationAllowed = !CheckForPharmacyVerificationExistAtThisLevel(pharmacyDbContext, requisitionDTO.CurrentVerificationLevel, requisitionDTO.VerificationId);
                    requisitionDTO.MaxVerificationLevel = VerifierIdsParsed.Count();
                    if (requisitionDTO.IsVerificationAllowed == true)
                    {
                        break;
                    }
                    requisitionDTO.VerificationStatus = VerificationStatus;
                }
            }
            return isUserAllowToSeePO;
        }

        public static object GetRequisitionInfo(int RequisitionId, PharmacyDbContext pharmacyDbContext)
        {
            var requisition = (from r in pharmacyDbContext.StoreRequisition.Where(r => r.RequisitionId == RequisitionId)
                               join s in pharmacyDbContext.PHRMStore on r.StoreId equals s.StoreId
                               join fy in pharmacyDbContext.PharmacyFiscalYears on r.FiscalYearId equals fy.FiscalYearId
                               join emp in pharmacyDbContext.Employees on r.CreatedBy equals emp.EmployeeId
                               select new
                               {
                                   RequisitionId = r.RequisitionId,
                                   RequisitionNo = r.RequisitionNo,
                                   RequisitionDate = r.RequisitionDate,
                                   RequisitionStatus = r.RequisitionStatus,
                                   RequestedStoreName = s.Name,
                                   RequsetedBy = emp.FullName,
                                   CancelledBy = r.CancelledBy,
                                   CancelledOn = r.CancelledOn,
                                   CancelRemarks = r.CancelRemarks,
                                   VerificationId = r.VerificationId,
                                   IsVerificationEnabled = r.IsVerificationEnabled,
                               }).FirstOrDefault();

            var requisitionItems = (from ri in pharmacyDbContext.StoreRequisitionItems.Where(a => a.RequisitionId == RequisitionId)
                                    join item in pharmacyDbContext.PHRMItemMaster on ri.ItemId equals item.ItemId
                                    join uom in pharmacyDbContext.PHRMUnitOfMeasurement on item.UOMId equals uom.UOMId
                                    select new
                                    {
                                        RequisitionId = ri.RequisitionId,
                                        RequisitionItemId = ri.RequisitionItemId,
                                        ItemId = ri.ItemId,
                                        ItemName = item.ItemName,
                                        Quantity = ri.Quantity,
                                        PendingQuantity = ri.PendingQuantity,
                                        Unit = uom.UOMName,
                                        RequisitionItemStatus = ri.RequisitionItemStatus,
                                        Remark = ri.Remark,
                                        IsEdited = false,
                                        IsActive = ri.RequisitionItemStatus == "active" ? true : false,
                                    }).ToList();
            return new
            {
                Requisition = requisition,
                RequisitionItems = requisitionItems,
                VerifierList = GetPharmacyVerifiersList(requisition.VerificationId, pharmacyDbContext)
            };
        }

        public static object SavePharmacyRequisitionVerification(PharmacySubStoreRequisitionVerification_DTO requisitionDTO, RbacUser currentUser, PharmacyDbContext pharmacyDbContext)
        {
            var Status = "approved";
            var CurrentVerificationLevel = requisitionDTO.CurrentVerificationLevel;
            var CurrentVerificationLevelCount = requisitionDTO.CurrentVerificationLevelCount + 1;
            var MaxVerificationLevel = requisitionDTO.MaxVerificationLevel;
            int? ParentVerificationId = requisitionDTO.VerificationId;
            int VerificationId = CreatePharmacyVerification(currentUser.EmployeeId, CurrentVerificationLevel, CurrentVerificationLevelCount, MaxVerificationLevel, Status, requisitionDTO.VerificationRemarks, ParentVerificationId, requisitionDTO.TransactionType, pharmacyDbContext);
            if (CurrentVerificationLevelCount == MaxVerificationLevel)
            {
                requisitionDTO.RequisitionStatus = ENUM_PharmacyRequisitionStatus.Active;
            }
            UpdatePharmacyRequisitionWithItems(pharmacyDbContext, requisitionDTO, VerificationId, currentUser);
            return null;
        }

        public static void UpdatePharmacyRequisitionWithItems(PharmacyDbContext pharmacyDbContext, PharmacySubStoreRequisitionVerification_DTO requisitionDTO, int? VerificationId, RbacUser currentUser)
        {
            try
            {
                var requisition = pharmacyDbContext.StoreRequisition.Include(a => a.RequisitionItems).Where(po => po.RequisitionId == requisitionDTO.RequisitionId).FirstOrDefault();
                requisition.RequisitionStatus = requisitionDTO.RequisitionStatus;
                requisition.VerificationId = VerificationId;


                var RequisitionItemsDict = requisitionDTO.RequisitionItems.ToDictionary(item => item.RequisitionItemId);

                foreach (var item in requisition.RequisitionItems)
                {
                    if (RequisitionItemsDict.TryGetValue(item.RequisitionItemId, out var item1))
                    {
                        item.Quantity = item1.Quantity;
                        item.PendingQuantity = item1.Quantity;
                        item.RequisitionItemStatus = item1.RequisitionItemStatus;

                        if (VerificationId > 0)
                        {
                            if (item1.CancelledBy == null)
                            {
                                item.CancelRemarks = "cancelled by" + currentUser.UserName;
                                item.CancelledOn = DateTime.Now;
                                item.CancelledBy = currentUser.EmployeeId;
                            }
                        }
                    }
                }

                pharmacyDbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }


        public static bool SaveRejectedRequisition(int RequisitionId, int currentVerificationlevel, int currentVerificationLevelCount, int maxVerificationLevel, string VerificationRemarks, RbacUser currentUser, PharmacyDbContext pharmacyDbContext)
        {
            string CancelRemarks = "Rejected by " + currentUser.UserName;
            string VerificationStatus = "rejected";
            string TransactionType = "requisition";
            int? ParentVerificationId = null;
            if (currentVerificationLevelCount > 0)
            {
                ParentVerificationId = pharmacyDbContext.StoreRequisition.Where(req => req.RequisitionId == RequisitionId)
                    .Select(req => req.VerificationId).FirstOrDefault();
            }
            var VerificationId = VerificationBL.CreatePharmacyVerification(currentUser.EmployeeId, currentVerificationlevel, currentVerificationLevelCount, maxVerificationLevel, VerificationStatus, VerificationRemarks, ParentVerificationId, TransactionType, pharmacyDbContext);

            bool flag = VerificationBL.CancelPharmacyRequisitionByRequisitionId(pharmacyDbContext, RequisitionId, CancelRemarks, currentUser, VerificationId);
            return flag;
        }


        public static bool CancelPharmacyRequisitionByRequisitionId(PharmacyDbContext pharmacyDbContext, int RequisitionId, string CancelRemarks, RbacUser currentUser, int? VerificationId = null)
        {
            bool flag = true;
            using (var transaction = pharmacyDbContext.Database.BeginTransaction())
            {
                try
                {
                    var requisition = pharmacyDbContext.StoreRequisition.Include(a => a.RequisitionItems).Where(po => po.RequisitionId == RequisitionId).FirstOrDefault();
                    requisition.CancelledBy = currentUser.EmployeeId;
                    requisition.CancelledOn = DateTime.Now;
                    requisition.RequisitionStatus = ENUM_PharmacyRequisitionStatus.Withdrawn;
                    requisition.CancelRemarks = CancelRemarks;
                    requisition.VerificationId = (VerificationId != null && VerificationId > 0) ? VerificationId : null;
                    requisition.RequisitionItems.ForEach(ri =>
                    {
                        ri.RequisitionItemStatus = ENUM_PharmacyRequisitionStatus.Cancel;
                        ri.CancelledOn = DateTime.Now;
                        ri.CancelledBy = currentUser.EmployeeId;
                        ri.CancelRemarks = CancelRemarks;

                    });
                    pharmacyDbContext.SaveChanges();
                    transaction.Commit();
                }
                catch (Exception ex)
                {
                    flag = false;
                    transaction.Rollback();
                    throw ex;
                }
            }
            return flag;
        }
        #endregion

        #endregion
    }
}
