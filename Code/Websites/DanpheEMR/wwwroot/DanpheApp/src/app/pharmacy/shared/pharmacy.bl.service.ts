import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment/moment';

import { PHRMDepositModel } from '../../dispensary/dispensary-main/patient-main/patient-deposit-add/phrm-deposit.model';
import { PHRMGenericModel } from '../shared/phrm-generic.model';
import { PharmacyDLService } from "./pharmacy.dl.service";
import { PHRMCategoryModel } from "./phrm-category.model";
import { PHRMCompanyModel } from "./phrm-company.model";
import { PHRMGoodsReceiptItemsModel } from "./phrm-goods-receipt-items.model";
import { PHRMGoodsReceiptViewModel } from "./phrm-goods-receipt-vm.model";
import { PHRMGoodsReceiptModel } from "./phrm-goods-receipt.model";
import { PHRMInvoiceItemsModel } from "./phrm-invoice-items.model";
import { PHRMInvoiceModel } from "./phrm-invoice.model";
import { PHRMItemMasterModel } from "./phrm-item-master.model";
import { PHRMItemTypeModel } from "./phrm-item-type.model";
import { PHRMPatient } from "./phrm-patient.model";
import { PHRMPrescription } from "./phrm-prescription.model";
import { PHRMPurchaseOrder } from "./phrm-purchase-order.model";
import { PHRMReportsModel } from "./phrm-reports-model";
import { PHRMReturnToSupplierModel } from "./phrm-return-to-supplier.model";
import { PHRMSupplierModel } from "./phrm-supplier.model";
import { PHRMTAXModel } from "./phrm-tax.model";
import { PHRMUnitOfMeasurementModel } from "./phrm-unit-of-measurement.model";
import { PHRMWriteOffModel } from "./phrm-write-off.model";

import { FreeVisit_DTO } from '../../billing/shared/dto/free-visit.dto';
import { DispensaryReportModel } from '../../dispensary/dispensary-main/reports-main/dispensary-reports.model';
import { PrescriptionItemQuantityUpdate_DTO } from '../../dispensary/dispensary-main/sales-main/new-sales/new-sales.component';
import { InvoiceItemSalePriceUpdate_DTO } from '../../dispensary/dispensary-main/sales-main/provisional-bills/dtos/invoice-item-saleprice-update.dto';
import { InvoiceDetailToBeReturn } from '../../dispensary/dispensary-main/sales-main/sales-return/model/invoice-detail-tobe-return.model';
import { DrugsRequistionItemModel } from "../../nursing/shared/drugs-requistion-items.model";
import { PatientsDLService } from '../../patients/shared/patients.dl.service';
import { CFGParameterModel } from '../../settings-new/shared/cfg-parameter.model';
import { WardispatchModel } from '../../wardsupply/shared/ward-dispatch.model';
import { PHRMPatientConsumptionItem } from '../patient-consumption/shared/phrm-patient-consumption-item.model';
import { PHRMPatientConsumption } from '../patient-consumption/shared/phrm-patient-consumption.model';
import { PharmacyOpPatientVM } from '../sale/op-patient-add/phrm-op-patient.model';
import { PHRMUpdatedStockVM } from '../setting/expiry-batch/phrm-update-exp-batch.component ';
import { IMRPUpdatedStock } from '../setting/mrp/phrm-update-mrp.component';
import { CreditOrganization } from '../shared/pharmacy-credit-organizations.model';
import { ReturnToSupplier_DTO } from '../store/return-to-supplier-new/return-to-supplier.dto';
import { DispatchItemModel } from '../substore-requisition-dispatch/dispensary-dispatch/phrm-requisition-for-dispatch-vm.model';
import { PHRMPackageModel } from './pharmacy-package.model';
import { PHRMInvoiceReturnModel } from './phrm-invoice-return.model ';
import { PHRMPackingTypeModel } from './phrm-packing-type.model';
import { PHRMStoreDispatchItems } from './phrm-store-dispatch-items.model';
import { PHRMStoreRequisition } from './phrm-store-requisition.model';
import { PHRMMapItemToRack } from './rack/Phrm_Map_ItemToRack';
@Injectable()
export class PharmacyBLService {

  constructor(public pharmacyDLService: PharmacyDLService, public patientDLService: PatientsDLService) {

  }
  public GetSettlementSummaryReport(FromDate, ToDate, StoreId) {
    return this.pharmacyDLService.GetSettlementSummaryReport(FromDate, ToDate, StoreId)
      .map(res => { return res });
  }

  public GetPatientWiseSettlementSummaryReport(FromDate, ToDate, PatientId) {
    return this.pharmacyDLService.GetPatientWiseSettlementSummaryReport(FromDate, ToDate, PatientId)
      .map(res => { return res });
  }

  public GetPHRMPendingBillsForSettlement(storeId, organizationId) {
    return this.pharmacyDLService.GetPHRMPendingBillsForSettlement(storeId, organizationId)
      .map(res => { return res });
  }
  public GetPHRMSettlements(storeId, FromDate, ToDate) {
    return this.pharmacyDLService.GetPHRMSettlements(storeId, FromDate, ToDate)
      .map(res => { return res });
  }
  // get pharmacy settlement duplicate records. 
  public GetPHRMSettlementDuplicatePrints() {
    return this.pharmacyDLService.GetPHRMSettlementDuplicatePrints()
      .map(res => { return res });
  }
  // get pharmacy settlement duplicate details using settlement id. 
  public GetPHRMSettlementDuplicateDetails(settlementId) {
    return this.pharmacyDLService.GetPHRMSettlementDuplicateDetails(settlementId)
      .map(res => { return res });
  }
  public GetCreditInvoicesByPatient(patientId: number, organizationId: number) {
    return this.pharmacyDLService.GetCreditInvoicesByPatient(patientId, organizationId)
      .map((responseData) => {
        return responseData;
      })
  }
  public GetCreditOrganizationList() {
    return this.pharmacyDLService.GetCreditOrganizationList()
      .map(res => { return res });
  }
  public GetPatientPastBillSummary(patientId: number) {
    return this.pharmacyDLService.GetPatientPastBillSummary(patientId)
      .map((responseData) => {
        return responseData;
      })
  }

  public GetProvisionalItemsByPatientIdForSettle(patientId: number) {
    return this.pharmacyDLService.GetProvisionalItemsByPatientIdForSettle(patientId)
      .map((responseData) => {
        return responseData;
      })
  }

  //GET: setting-supplier manage : list of suppliers
  public GetSupplierList() {
    return this.pharmacyDLService.GetSupplierList()
      .map(res => { return res });
  }
  public GetAllSupplierList() {
    return this.pharmacyDLService.GetAllSupplierList()
      .map(res => { return res });
  }

  ///GET: Get SupplierDetails by SupplierId for Create Order purpose
  public GetSupplierDetailsBySupplierId(SupplierId) {
    return this.pharmacyDLService.GetSupplierDetailsBySupplierId(SupplierId)
      .map((responseData) => {
        return responseData;
      });
  }
  ///GET: setting-Itemtype and  getting ItemTypelist in Create order
  public GetItemTypeList() {
    return this.pharmacyDLService.GetItemTypeList()
      .map((responseData) => {
        return responseData;
      });
  }
  ///GET: setting-Packettype and  getting PacketTypelist in Create order
  public GetPackingTypeList() {
    return this.pharmacyDLService.GetPackingTypeList()
      .map((responseData) => {
        return responseData;
      });
  }
  public GetItemTypeListManage() {
    return this.pharmacyDLService.GetItemTypeListManage()
      .map((responseData) => {
        return responseData;
      });
  }
  // GET: Get the counters available in pharmacy 
  public GetAllPharmacyCounters() {
    return this.pharmacyDLService.GetCounter()
      .map((responseDate) => {
        return responseDate;
      });
  }

  public DeActivateCounter() {
    return this.pharmacyDLService.DeActivatePharmacyCounter()
      .map(res => {
        return res;
      });
  }


  public ActivateCounter(counterId: number, counterName: string) {
    return this.pharmacyDLService.ActivatePharmacyCounter(counterId, counterName)
      .map(res => {
        return res;
      });
  }

  //GET: Get ItemType List with all List of Item Master data
  // //sud:2Feb'23--Use another dlFunction which is returning same data with same inputs
  // public GetItemTypeListWithItems(dispensaryId?) {
  //   try {
  //     return this.pharmacyDLService.GetItemTypeListWithItems(dispensaryId)
  //       .map((responseData) => {
  //         return responseData;
  //       });
  //   }
  //   catch (ex) {
  //     throw ex;
  //   }
  // }

  //GET: Get ItemType List with Rack No
  public GetRackByItem(itemId) {
    try {
      return this.pharmacyDLService.GetRackByItem(itemId)
        .map((responseData) => {
          return responseData;
        });
    }
    catch (ex) {
      throw ex;
    }
  }




  //GET: Get Itemlist by ItemType id
  public GetItemListByItemTypeId(itemTypeId) {
    return this.pharmacyDLService.GetItemListByItemTypeId(itemTypeId)
      .map((responseData) => {
        return responseData;
      });
  }
  //Get: Get all Items in pharmacy
  public GetStockForItemDispatch() {
    return this.pharmacyDLService.GetStockForItemDispatch()
      .map((responseData) => {
        return responseData;
      });
  }

  //GET: setting-company manage : list of companies
  public GetCompanyList() {
    return this.pharmacyDLService.GetCompanyList()
      .map(res => { return res });
  }
  //GET: setting-category manage : list of categories
  public GetCategoryList() {
    return this.pharmacyDLService.GetCategoryList()
      .map(res => { return res });
  }
  //GET: setting-unit of measurement manage : list of unit of measurements
  public GetUnitOfMeasurementList() {
    return this.pharmacyDLService.GetUnitOfMeasurementList()
      .map(res => { return res });
  }
  //GET: setting-item manage : list of items
  public GetItemList() {
    return this.pharmacyDLService.GetItemList()
      .map(res => { return res });
  }
  //GET: item-master list only
  public GetItemMasterList() {
    return this.pharmacyDLService.GetItemMasterList()
      .map(res => { return res });
  }
  // GET: Get active store list
  public GetActiveStore() {
    return this.pharmacyDLService.GetActiveStore()
      .map(res => { return res });
  }
  //GET: setting-tax manage : list of tax
  public GetTAXList() {
    return this.pharmacyDLService.GetTAXList()
      .map(res => { return res });
  }
  public GetGenericList() {
    return this.pharmacyDLService.GetGenericList()
      .map(res => { return res });
  }
  public GetGenericListWithoutPriceCategory() {
    return this.pharmacyDLService.GetGenericListWithoutPriceCategory()
      .map(res => { return res });
  }
  //GET: Patient List
  public GetPatients(searchTxt: string, isInsurance: boolean) {
    return this.pharmacyDLService.GetPatients(searchTxt, isInsurance)
      .map(res => { return res })
  }
  public GetPatientsListForSaleItems(isCurrentDispensaryInsurance: boolean = false) {
    return this.pharmacyDLService.GetPatientsListForSaleItems(isCurrentDispensaryInsurance)
      .map(res => { return res })
  }
  //GET: Get Matching Patient List for checking patient is already registered or not
  public GetExistedMatchingPatientList(firstName, lastName, phoneNumber) {
    try {
      return this.pharmacyDLService.GetExistedMatchingPatientList(firstName, lastName, phoneNumber)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  //GET: Order->OrderList : getting List of All PurchaseOrder
  public GetPHRMPurchaseOrderList(Status: string, fromDate: string, toDate: string) {
    return this.pharmacyDLService.GetPHRMPurchaseOrderList(Status, fromDate, toDate)
      .map(res => { return res });
  }
  ///GET: All POItems By POID
  public GetPHRMPOItemsByPOId(PurchaseOrderId) {
    return this.pharmacyDLService.GetPHRMPOItemsByPOId(PurchaseOrderId)
      .map(res => { return res }
      );
  }
  //////GET: All POItems For GoodsReceipt
  public GetPHRMPOItemsForGR(PurchaseOrderId) {
    return this.pharmacyDLService.GetPHRMPOItemsForGR(PurchaseOrderId)
      .map(res => { return res });
  }

  //GET: To get provisional Items List
  public GetPHRMProvisionalItemList(Status: string) {
    return this.pharmacyDLService.GetPHRMProvisionalItemList(Status)
      .map(res => { return res });
  }

  //GET: To get provisional Items List
  public GetAllPHRMProvisionalItemList() {
    return this.pharmacyDLService.GetAllPHRMProvisionalItemList()
      .map(res => { return res });
  }

  //GET: Requsted drug-list by patientId and VisitId(used in Emergency)--added by Anish 25 Feb Anish
  public GetAllDrugOrderOfERPatient(patientId: number, visitId: number) {
    return this.pharmacyDLService.GetAllDrugOrderOfERPatient(patientId, visitId)
      .map(res => { return res });
  }


  //GET: To get provisional Items List.
  public GetPHRMDrugsItemList(requisitionID) {
    return this.pharmacyDLService.GetPHRMDrugsItemList(requisitionID)
      .map(res => { return res });
  }

  public GetPHRMDrugsDispatchList(requisitionId) {
    return this.pharmacyDLService.GetPHRMDrugDispatchList(requisitionId)
      .map(res => { return res });
  }

  /////GET: All Return TO Supplier Item list By ReturnToSupplierID
  public GetReturnDetailByRetSuppId(ReturnToSupplierId) {
    return this.pharmacyDLService.GetReturnDetailByRetSuppId(ReturnToSupplierId)
      .map(res => { return res }
      );
  }



  /////GET: All WriteOff Items By WriteOff ID
  public GetWriteOffItemsByWriteOffId(writeOffId) {
    try {
      return this.pharmacyDLService.GetWriteOffItemsByWriteOffId(writeOffId)
        .map(res => { return res }
        );
    }
    catch (ex) {
      throw ex;
    }
  }
  //GET: order-goods receipt list
  public GetGoodsReceiptList() {
    return this.pharmacyDLService.GetGoodsReceiptList()
      .map(res => { return res });
  }
  //Get GR List filtered with Date
  GetDateFilteredGoodsReceiptList(fromDate: string, toDate: string) {
    return this.pharmacyDLService.GetDateFilteredGoodsReceiptList(fromDate, toDate)
      .map(res => { return res });
  }
  //GET: Supplier account detail list
  public GetSuppliersLedgerInfo(FromDate, ToDate) {
    return this.pharmacyDLService.GetSuppliersLedgerInfo(FromDate, ToDate)
      .map(res => { return res });
  }
  public GetEachAccountDetailsList(SupplierID, FromDate, ToDate) {
    return this.pharmacyDLService.GetEachAccountDetailsList(SupplierID, FromDate, ToDate)
      .map(res => { return res });
  }
  public GetMainStore() {
    return this.pharmacyDLService.GetMainStore()
      .map(res => { return res });
  }
  //GET: Main Store Stock
  GetMainStoreStock(showAllStock: boolean = false) {
    return this.pharmacyDLService.GetMainStoreStock(showAllStock).map(res => { return res; });
  }
  GetMainStoreIncomingStock() {
    return this.pharmacyDLService.GetMainStoreIncomingStock().map(res => { return res; });
  }
  ReceiveIncomingStock(dispatchId: number, receivingRemarks: string) {
    return this.pharmacyDLService.ReceiveIncomingStock(dispatchId, receivingRemarks).map(res => { return res; });
  }
  //GET: Return To Supplier 
  public GetGoodsReceiptsInfo(suppId?, grNo?, invcId?, fromDate?, toDate?) {
    return this.pharmacyDLService.GetGoodsReceiptsInfo(suppId, grNo, invcId, fromDate, toDate)
      .map(res => { return res });
  }
  //GET: Return Items To Supplier list
  public GetReturnedList(fromDate, toDate) {
    return this.pharmacyDLService.GetReturnedList(fromDate, toDate)
      .map(res => { return res });
  }


  //GET: WriteOff List With SUM of Toatal WriteOff Qty
  public GetWriteOffList() {
    try {
      return this.pharmacyDLService.GetWriteOffList()
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  ///GET:GET Stock Detail List
  public GetDispensaryAvailabeStockDetails(dispensaryId?: number) {
    return this.pharmacyDLService.GetDispensaryAvailabeStockDetails(dispensaryId)
      .map(res => { return res });
  }
  /// Get Narcotics Stock Details List(sales)
  public GetNarcoticsStockDetailsList() {
    return this.pharmacyDLService.GetNarcoticsStockDetailsList()
      .map(res => { return res });
  }
  public GetNarcoticsLedger(GenericId: number, SupplierId: number, CompanyId: number, fromDate: string, toDate: string) {
    return this.pharmacyDLService.GetNarcoticsLedger(GenericId, SupplierId, CompanyId, fromDate, toDate)
      .map(res => { return res });
  }
  public GetAllGenericItemsList() {
    return this.pharmacyDLService.GetAllGenericItemsList()
      .map(res => { return res });
  }
  public GetAllCompanyList() {
    return this.pharmacyDLService.GetAllCompanyList()
      .map(res => { return res });
  }
  public GetAllSupplier() {
    return this.pharmacyDLService.GetAllSupplier()
      .map(res => { return res });
  }
  ///GET:GET Sales Detail List
  public GetSalesDetailsList() {
    return this.pharmacyDLService.GetSalesDetailsList()
      .map(res => { return res });
  }

  // Get Items List
  public GetItemsList() {
    return this.pharmacyDLService.GetItemsList()
      .map(res => { return res });
  }
  //get ItemName only
  public getOnlyItemNameList() {
    return this.pharmacyDLService.getOnlyItemNameList()
      .map(res => { return res });
  }
  public getItemListForManualReturn() {
    return this.pharmacyDLService.getItemListForManualReturn()
      .map(res => { return res });
  }
  public getAvailableBatchesByItemId(itemId: number) {
    return this.pharmacyDLService.getAvailableBatchesByItemId(itemId)
      .map(res => { return res });
  }


  //GET: order-goods receipt items-view  by GR-Id
  public GetGRItemsByGRId(GoodsReceiptId) {
    return this.pharmacyDLService.GetGRItemsByGRId(GoodsReceiptId)
      .map(res => { return res });
  }
  public GetGRReturnItemsByGRId(GoodsReceiptId, CreditNotePrintId) {
    return this.pharmacyDLService.GetGRRetItemsByGRId(GoodsReceiptId, CreditNotePrintId)
      .map(res => { return res });
  }
  //Get:order items view by PO-ID
  GetPODetailsByPOID(purchaseOrderId) {
    return this.pharmacyDLService.GetPODetailsByPOID(purchaseOrderId)
      .map(res => { return res });
  }
  //GET: order-goods receipt items-view  by GR-Id
  public GetGRItemsForEdit(GoodsReceiptId) {
    return this.pharmacyDLService.GetGRItemsForEdit(GoodsReceiptId)
      .map(res => { return res });
  }
  //////GET: Get All Batch No By Item Id 
  // public GetBatchNoByItemId(ItemId) {
  //   try {
  //     return this.pharmacyDLService.GetBatchNoByItemId(ItemId)
  //       .map(res => { return res });
  //   }
  //   catch (ex) {
  //     throw ex;
  //   }
  // }
  /////GET: Get All Item Details By Batch No
  // public GetItemDetailsByBatchNo(BatchNo, ItemId) {
  //   try {
  //     return this.pharmacyDLService.GetItemDetailsByBatchNo(BatchNo, ItemId)
  //       .map(res => { return res });
  //   }
  //   catch (ex) {
  //     throw ex;
  //   }
  // }

  ////GET: Get Purchase Order Report 
  public GetPHRMPurchaseOrderReport(phrmReports: PHRMReportsModel) {
    return this.pharmacyDLService.GetPHRMPurchaseOrderReport(phrmReports)
      .map((responseData) => {
        return responseData;
      });
  }

  //GET : Get Userwise Report
  public GetPHRMUserWiseCollectionReport(phrmReports: PHRMReportsModel | DispensaryReportModel) {
    return this.pharmacyDLService.GetPHRMUserWiseCollectionReport(phrmReports)
      .map((responseData) => {
        return responseData;
      });
  }
  public GetPHRMCashCollectionSummaryReport(phrmReports: PHRMReportsModel | DispensaryReportModel) {
    return this.pharmacyDLService.GetPHRMCashCollectionSummaryReport(phrmReports)
      .map((responseData) => {
        return responseData;
      });
  }

  //GET : Get Sale Return Report
  public GetPHRMSaleReturnReport(phrmReports: PHRMReportsModel) {
    return this.pharmacyDLService.GetSaleReturnReport(phrmReports)
      .map((responseData) => {
        return responseData;
      });
  }

  //GET : Get Counterwise Report
  public GetPHRMCounterwiseCollectionReport(phrmReports: PHRMReportsModel) {
    return this.pharmacyDLService.GetPHRMCounterwiseCollectionReport(phrmReports)
      .map((responseData) => {
        return responseData;
      });
  }

  // GET : Get Breakage Item details Report
  public GetPHRMBreakageItemReport(phrmReports: PHRMReportsModel) {
    return this.pharmacyDLService.GetPHRMBreakageItemReport(phrmReports)
      .map((responseData) => {
        return responseData;
      });
  }

  // GET : Get Return To Supplier Report
  public GetPHRMReturnToSupplierReport(phrmReports: PHRMReportsModel, suppId) {
    return this.pharmacyDLService.GetPHRMReturnToSupplierReport(phrmReports, suppId)
      .map((responseData) => {
        return responseData;
      });
  }
  //GET: Get Return TO Store Report
  public GetPHRMTransferToStoreReport(phrmReports: PHRMReportsModel) {
    return this.pharmacyDLService.GetPHRMTransferToStoreReport(phrmReports)
      .map((responseData) => {
        return responseData;
      });
  }
  //GET: Get Return TO Dispensary Report
  public GetPHRMTransferToDispensaryReport(phrmReports: PHRMReportsModel) {
    return this.pharmacyDLService.GetPHRMTransferToDispensaryReport(phrmReports)
      .map((responseData) => {
        return responseData;
      });
  }
  //GET : Get stock manage details report
  public GetPHRMStockManageDetailReport(phrmReports: PHRMReportsModel) {
    return this.pharmacyDLService.GetPHRMStockManageDetailReport(phrmReports)
      .map((responseData) => {
        return responseData;
      });
  }

  //GET : Get deposit balance report
  public GetPHRMDepositBalanceReport() {
    return this.pharmacyDLService.GetPHRMDepositBalanceReport()
      .map((responseData) => {
        return responseData;
      });
  }
  // GET : Get Goods Receipt Product Report
  public GetPHRMGoodsReceiptProductReport(phrmReports: PHRMReportsModel, itemId) {
    return this.pharmacyDLService.GetPHRMGoodsReceiptProductReport(phrmReports, itemId)
      .map((responseData) => {
        return responseData;
      });
  }

  // GET : Get Drug Category Wise Report
  public GetPHRMDrugCategoryWiseReport(phrmReports: PHRMReportsModel, category) {
    return this.pharmacyDLService.GetPHRMDrugCategoryWiseReport(phrmReports, category)
      .map((responseData) => {
        return responseData;
      });
  }

  ///GET: Get Item wise Stock Report  
  public GetPHRMDispensaryStoreReport(phrmReports: PHRMReportsModel) {
    return this.pharmacyDLService.GetPHRMDispensaryStoreReport(phrmReports)
      .map((responseData) => {
        return responseData;
      });
  }

  //Get Narcotics Stock Report
  public GetNarcoticsStoreReport() {
    return this.pharmacyDLService.GetPHRMNarcoticsStoreReport()
      .map((responseData) => {
        return responseData;
      });
  }
  ////GET: GET ItemList  Whose Available Qty is greater then zero
  // public GetItemListWithTotalAvailableQty() {
  //   try {
  //     return this.pharmacyDLService.GetItemListWithTotalAvailableQty()
  //       .map((responseData) => {
  //         return responseData;
  //       });
  //   }
  //   catch (ex) {
  //     throw ex;
  //   }
  // }

  //GET: STOCK : get stock manage by ItemId
  public GetStockManageByItemId(ItemId) {
    try {
      return this.pharmacyDLService.GetStockManageByItemId(ItemId)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //GET: Return to supplier items of existing gr
  public GetReturnToSupplierItemsofExistingGR() {
    try {
      return this.pharmacyDLService.GetReturnToSupplierItemsofExistingGR()
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //GET: Doctor details list
  //get doctors list
  public GetDoctorList() {
    return this.pharmacyDLService.GetDoctorList()
      .map(res => res);
  }

  public GetPatientSummary(patientId: number, SchemeId?: number, PatientVisitId?: number) {
    return this.pharmacyDLService.GetPatientSummary(patientId, SchemeId, PatientVisitId)
      .map((responseData) => {
        return responseData;
      })
  }

  //GET: Prescription List group by PatientName, DoctorName and CreatedDate
  public GetPrescriptionList() {
    try {
      return this.pharmacyDLService.GetPrescriptionList()
        .map(res => res);
    }
    catch (ex) {
      throw ex;
    }
  }
  //GET: Prescription Items list by PatientId && ProviderId for sale purpose
  public GetPrescriptionItems(PatientId: number, PrescriberId: number, PrescriptionId: number) {
    try {
      return this.pharmacyDLService.GetPrescriptionItems(PatientId, PrescriberId, PrescriptionId)
        .map(res => res);
    }
    catch (ex) {
      throw ex;
    }
  }
  //GET: sale invoice list data
  public GetSaleInvoiceList(fromDate, toDate, dispensaryId) {
    try {
      return this.pharmacyDLService.GetSaleInvoiceList(fromDate, toDate, dispensaryId)
        .map(res => res);
    }
    catch (ex) {
      throw ex;
    }
  }

  public GetSaleReturnList(fromDate, toDate, dispensaryId) {
    try {
      return this.pharmacyDLService.GetSaleReturnList(fromDate, toDate, dispensaryId)
        .map(res => res);
    }
    catch (ex) {
      throw ex;
    }
  }

  //GET: Sale Invoice Items data by Invoice Id
  public GetSaleInvoiceItemsByInvoiceId(invoiceId: number) {
    try {
      return this.pharmacyDLService.GetSaleInvoiceItemsByInvoiceId(invoiceId)
        .map(res => res);
    }
    catch (ex) {
      throw ex;
    }
  }
  //GET: Sale Return Invoice Items data by InvoiceId
  // public GetSaleInvoiceRetItemsByInvoiceId(invoiceId: number) {
  //   try {
  //     return this.pharmacyDLService.GetSaleInvoiceRetItemsByInvoiceId(invoiceId)
  //       .map(res => res);
  //   }
  //   catch (ex) {
  //     throw ex;
  //   }
  // }
  //GET: Sale Return Invoice Items data by InvoiceReturnId
  public GetSaleReturnInvoiceItemsByInvoiceRetId(invoiceReturnId: number) {
    try {
      return this.pharmacyDLService.GetSaleReturnInvoiceItemsByInvoiceRetId(invoiceReturnId)
        .map(res => res);
    }
    catch (ex) {
      throw ex;
    }
  }
  //GET: Get GR Items as Stock details by ItemId 
  //Only get GR Items details with fullfill condition => AvailableQty > 0
  public GetGRItemsByItemId(itemId) {
    try {
      return this.pharmacyDLService.GetGRItemsByItemId(itemId)
        .map(res => res);
    }
    catch (ex) {
      throw ex;
    }
  }
  //GET: Get ReturnFromCustomer Invoice Model data for Return from customer functionality fulfill
  //passing Invoice Id and getting InvoiceReturnItemsModel
  //this for return from customer to pharmacy                
  public GetReturnFromCustomerModelDataByInvoiceId(invoicePrintId: number, fiscYrId, storeId: number) {
    try {
      return this.pharmacyDLService.GetReturnFromCustomerModelDataByInvoiceId(invoicePrintId, fiscYrId, storeId)
        .map(res => res);
    }
    catch (ex) {
      throw ex;
    }
  }
  public GetAllFiscalYears() {
    return this.pharmacyDLService.GetAllFiscalYears()
      .map(res => res);
  }
  public GetCreditOrganization() {
    return this.pharmacyDLService.GetPharmacyCreditOrganizations()
      .map(res => res);
  }
  //GET: Patient - Patient Details by Patient Id
  public GetPatientByPatId(patientId: number) {
    try {
      return this.pharmacyDLService.GetPatientByPatId(patientId)
        .map(res => res);
    }
    catch (ex) {
      throw ex;
    }
  }
  //Get: User for Return From Customer Report
  public getPharmacyUsers() {
    try {
      return this.pharmacyDLService.getPharmacyUsers()
        .map(res => res);
    }
    catch (ex) {
      throw ex;
    }
  }
  //Get: return from Customer Report;
  public getReturnFromCustomerReport(userId: number, dispensaryId: number, fromDate, toDate) {
    try {
      return this.pharmacyDLService.getReturnFromCustomerReport(userId, dispensaryId, fromDate, toDate)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  //Get: sales statement report
  public getSalesStatementReport(fromDate, toDate) {
    try {
      return this.pharmacyDLService.getSalesStatementReport(fromDate, toDate)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //Get: sales summary report
  public getSalesSummaryReport(fromDate, toDate) {
    try {
      return this.pharmacyDLService.getSalesSummaryReport(fromDate, toDate)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //Get: Purchase summary report
  public getPurchaseSummaryReport(fromDate, toDate) {
    try {
      return this.pharmacyDLService.getPurchaseSummaryReport(fromDate, toDate)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //Get: Stock summary second report
  public getStockSummarySecondReport(tillDate) {
    try {
      return this.pharmacyDLService.getStockSummarySecondReport(tillDate)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }

  //Get: sales statement report
  public getInsPatientBimaReport(fromDate, toDate, counterId, userId, claimCode, nshiNumber) {
    try {
      return this.pharmacyDLService.getInsPatientBimaReport(fromDate, toDate, counterId, userId, claimCode, nshiNumber)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }

  //Get: sales statement report
  public getPatientSalesDetailReport(fromDate, toDate, patientId, counterId, userId, storeId) {
    try {
      return this.pharmacyDLService.getPatientSalesDetailReport(fromDate, toDate, patientId, counterId, userId, storeId)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //Get: stock transfers report
  public getStockTransfersReport(fromDate, toDate, itemId, sourceStoreId, targetStoreId, notReceivedStocks) {
    try {
      return this.pharmacyDLService.getStockTransfersReport(fromDate, toDate, itemId, sourceStoreId, targetStoreId, notReceivedStocks)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //Get: supplier wise Stock report
  public getSupplierWiseStockReport(fromDate, toDate, itemId, storeId, supplierId) {
    try {
      return this.pharmacyDLService.getSupplierWiseStockReport(fromDate, toDate, itemId, storeId, supplierId)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }

  /////Get Supplier Information For Reporting
  public GetSupplierInformationReportList() {
    try {
      return this.pharmacyDLService.GetSupplierInformationReportList()
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }

  ////Get: Get All Patient List BAsed on PAtient Type
  public GetInOutPatientDetails(value) {
    try {
      return this.pharmacyDLService.GetInOutPatientDetails(value)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  ////Get: Get All Credit Report For In/OUT Patient 
  public GetCreditInOutPatReportList(phrmReports: PHRMReportsModel, VisitType) {
    try {
      return this.pharmacyDLService.GetCreditInOutPatReportList(phrmReports, VisitType)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }

  ////Get: Get Stock Item Report Data 
  public GetStockItemsReport(itemId, location) {
    try {
      return this.pharmacyDLService.GetStockItemsReport(itemId, location)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }

  ////Get: Get Supplier Stock Summary Report Data
  public GetSupplierStockSummaryReport(supplierName) {
    try {
      return this.pharmacyDLService.GetSupplierStockSummaryReport(supplierName)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  ////Get: Get Batch Stock Report Data
  public GetBatchStockReport(itemName) {
    try {
      return this.pharmacyDLService.GetBatchStockReport(itemName)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  ////Get: Get Expiry Report Data
  public GetExpiryReport(itemId: number, genericId: number, storeId: number, fromDate: string, toDate: string) {
    try {
      return this.pharmacyDLService.GetExpiryReport(itemId, genericId, storeId, fromDate, toDate)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  ////Get: Get Minimum Stock Report Data
  public GetMinStockReport(itemName) {
    try {
      return this.pharmacyDLService.GetMinStockReport(itemName)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  ////Get: Get Daily Stock Summary Report Data
  public GetDailyStockSummaryReport(phrmReports: PHRMReportsModel) {
    try {
      return this.pharmacyDLService.GetDailyStockSummaryReport(phrmReports)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  ////Get: Get  Stock Summary Report Data
  public GetStockSummaryReport(phrmReports: PHRMReportsModel) {
    try {
      return this.pharmacyDLService.GetStockSummaryReport(phrmReports)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  ////Get:  Item Wise Transaction Stock Summary Report Data
  public GetItemTxnSummaryReport(fromDate: string, toDate: string, itemId: number) {
    try {
      return this.pharmacyDLService.GetItemTxnSummaryReport(fromDate, toDate, itemId)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  ////Get: Get Daily Sales Summary Report Data
  public GetDailySalesSummaryReport(FromDate, ToDate, itemId, storeId: number, counterId, userId, genericId, salesType) {
    try {
      return this.pharmacyDLService.GetDailySalesSummaryReport(FromDate, ToDate, itemId, storeId, counterId, userId, genericId, salesType)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }

  public GetItemWiseSalesSummaryReport(FromDate, ToDate, itemId, storeId: number, counterId, userId, genericId) {
    try {
      return this.pharmacyDLService.GetItemWiseSalesSummaryReport(FromDate, ToDate, itemId, storeId, counterId, userId, genericId)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  //GET: Get Item Wise Purchase Report Data
  public GetItemWisePurchaseReport(FromDate, ToDate, itemId, invoiceNo?, grNo?, supplierId?, genericId?) {
    try {
      return this.pharmacyDLService.GetItemWisePurchaseReport(FromDate, ToDate, itemId, invoiceNo, grNo, supplierId, genericId)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }

  // Get Daily Salse Report for Narcotics
  public GetNarcoticsDailySalesReport(FromDate, ToDate, itemId, storeId) {
    try {
      return this.pharmacyDLService.GetNarcoticsDailySalesReport(FromDate, ToDate, itemId, storeId)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }


  ////Get: Get ABC/VED Stock Report Data
  public GetPHRMABCVEDStockReport(Status) {
    try {
      return this.pharmacyDLService.GetPHRMABCVEDStockReport(Status)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }

  public GetPharmacyBillingReport(phrmReports, invoiceNumber, patientId, StoreId, VisitType, transactionType, SchemeId) {
    try {
      return this.pharmacyDLService.GetPharmacyBillingReport(phrmReports, invoiceNumber, patientId, StoreId, VisitType, transactionType, SchemeId)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  ////Get: Get Rack Stock Report Data
  public GetRackStockDistributionReport(rackIds: string, locationId: number) {
    try {
      return this.pharmacyDLService.GetRackStockDistributionReport(rackIds, locationId)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  ////Get: Get Stock Movement Report Data
  public GetStockMovementReport(itemName) {
    try {
      return this.pharmacyDLService.GetStockMovementReport(itemName)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }

  ////Get: Get Supplier Stock Report Data
  public GetSupplierStockReport(fromDate, toDate, supplierId) {
    try {
      return this.pharmacyDLService.GetSupplierStockReport(fromDate, toDate, supplierId)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //GET: Get Date Wise Purchase Report Data
  public GetDateWisePurchaseReport(fromDate, toDate, supplierId) {
    try {
      return this.pharmacyDLService.GetDateWisePurchaseReport(fromDate, toDate, supplierId)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //Get: Get store items list
  public GetStoreRequestedItemList(Status) {
    try {
      return this.pharmacyDLService.GetStoreRequestedItemList(Status)
        .map(res => { return res });
    }
    catch (ex) { throw ex; }
  }
  public PostSalesCategoryDetails(salescategory) {
    try {
      var temp = _.omit(salescategory, ['SalesCategoryValidator']);
      return this.pharmacyDLService.PostSalesCategoryDetails(temp)
        .map(res => { return res });
    }
    catch (ex) { throw ex; }
  }
  public GetSalesCategoryList() {
    try {
      return this.pharmacyDLService.GetSalesCategoryList()
        .map(res => { return res });
    }
    catch (ex) { throw ex; }
  }
  ////Get: Get Ending Stock Summary Report Data
  public GetEndingStockSummaryReport(itemName) {
    try {
      return this.pharmacyDLService.GetEndingStockSummaryReport(itemName)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }

  //GET: Get Stock Txn Items
  public GetStockTxnItems() {
    try {
      return this.pharmacyDLService.GetStockTxnItems()
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  // GET: Stock Details with 0, null or > 0 Quantity
  //this stock details with all unique (by ItemId,ExpiryDate,BatchNo)  records with sum of Quantity
  //items with 0 quantity or more than 0 showing in list
  public GetAllItemsStockDetailsList(StoreId: number, ShowZeroQuantity: boolean) {

    try {
      return this.pharmacyDLService.GetAllItemsStockDetailsList(StoreId, ShowZeroQuantity)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  // GET: Stock Details with 0, null or > 0 Quantity
  public GetWardStockDetailsList() {

    try {
      return this.pharmacyDLService.GetWardStockDetailsList()
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  // GET: Stock without 0, null or > 0 Quantity
  //this stock details is not unique (by ExpiryDate,BatchNo)  records with sum of Quantity

  public GetAllItemsStockList() {

    try {
      return this.pharmacyDLService.GetAllItemsStockList()
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  // get rack list
  public GetRackList() {
    return this.pharmacyDLService.GetRackList()
      .map(res => { return res });
  }

  //GET: To get ward requested Items List
  public GetWardRequestedItemList(FromDate: string, ToDate: string) {
    return this.pharmacyDLService.GetWardRequestedItemList(FromDate, ToDate)
      .map(res => { return res });
  }

  //Get deposit data of patient
  public GetDepositFromPatient(patientId: number) {
    return this.pharmacyDLService.GetDepositFromPatient(patientId)
      .map((responseData) => {
        return responseData;
      })
  }
  //Get pharmacy requisition list
  public GetItemwiseRequistionList() {
    return this.pharmacyDLService.GetItemwiseRequistionList()
      .map(res => { return res })
  }

  //GET: Get All Requisition Items details for View requisition Items by Requisition ID
  GetRequisitionItemsByRID(RequisitionId: number) {
    return this.pharmacyDLService.GetRequisitionItemsByRID(RequisitionId)
      .map((responseData) => {
        return responseData;
      });
  }
  //GET:Get All Requision with Requisition Items for Dispatch purpose
  GetRequisitionDetailsForDispatch(RequisitionId: number) {

    return this.pharmacyDLService.GetRequisitionDetailsForDispatch(RequisitionId)
      .map((responseData) => {
        return responseData;
      });
  }
  GetDispatchDetails(RequisitionId: number) {
    return this.pharmacyDLService.GetDispatchDetails(RequisitionId)
      .map((responseData) => {
        return responseData;
      });
  }
  GetMainStoreIncomingStockById(DispatchId: number) {
    return this.pharmacyDLService.GetMainStoreIncomingStockById(DispatchId)
      .map((responseData) => {
        return responseData;
      });
  }
  GetDispatchItemByDispatchId(DispatchId: number) {
    return this.pharmacyDLService.GetDispatchItemByDispatchId(DispatchId)
      .map((responseData) => {
        return responseData;
      });
  }
  GetTermsList(TermApplicationId: number) {
    return this.pharmacyDLService.GetTermsList(TermApplicationId)
      .map((responseData) => {
        return responseData;
      });
  }
  GetStoreRackNameByItemId(itemId: number) {
    return this.pharmacyDLService.GetStoreRackNameByItemId(itemId)
      .map((responseData) => {
        return responseData;
      });
  }
  //POST : setting-supplier manage
  public AddSupplier(supplier: PHRMSupplierModel) {
    var temp = _.omit(supplier, ['SupplierValidator']);
    return this.pharmacyDLService.PostSupplier(temp)
      .map(res => { return res });
  }
  //POST : setting-company manage
  public AddCompany(company: PHRMCompanyModel) {
    var temp = _.omit(company, ['CompanyValidator']);
    return this.pharmacyDLService.PostCompany(temp)
      .map(res => { return res });
  }
  //POST : setting-category manage
  public AddCategory(category: PHRMCategoryModel) {
    var temp = _.omit(category, ['CategoryValidator']);
    return this.pharmacyDLService.PostCategory(temp)
      .map(res => { return res });
  }
  //POST : send sms message
  public sendSMS(text: string) {
    return this.pharmacyDLService.sendSMS(text)
      .map(res => { return res });
  }
  //POST : setting-unit of measurement manage
  public AddUnitOfMeasurement(uom: PHRMUnitOfMeasurementModel) {
    var temp = _.omit(uom, ['UnitOfMeasurementValidator']);
    return this.pharmacyDLService.PostUnitOfMeasurement(temp)
      .map(res => { return res });
  }
  //POST : setting-item type manage
  public AddItemType(itemtype: PHRMItemTypeModel) {
    var temp = _.omit(itemtype, ['ItemTypeValidator']);
    return this.pharmacyDLService.PostItemType(temp)
      .map(res => { return res });
  }
  //POST : setting-packing type manage
  public AddPackingType(packingtype: PHRMPackingTypeModel) {
    var temp = _.omit(packingtype, ['PackingTypeValidator']);
    return this.pharmacyDLService.PostPackingType(temp)
      .map(res => { return res });
  }
  //POST : setting-item manage
  public AddItem(item: PHRMItemMasterModel) {
    var temp = _.omit(item, ['ItemValidator', 'RackValidator']);
    return this.pharmacyDLService.PostItem(temp)
      .map(res => { return res });
  }
  //POST : setting-tax manage
  public AddTAX(tax: PHRMTAXModel) {
    var temp = _.omit(tax, ['TAXValidator']);
    return this.pharmacyDLService.PostTAX(temp)
      .map(res => { return res });
  }

  //POST : Generic Name
  public AddGenericName(genericName: PHRMGenericModel) {
    var temp = _.omit(genericName, ['GenericValidator']);
    return this.pharmacyDLService.PostGenericName(temp)
      .map(res => { return res });
  }
  //POST: Credit Organizations
  public AddCreditOrganization(creditOrganization: CreditOrganization) {
    var temp = _.omit(creditOrganization, ['CreditOrganizationValidator']);
    return this.pharmacyDLService.PostCreditOrganization(temp)
      .map(res => { return res });
  }
  //POST: Patient
  //POST: Patient- Registration of Outdoor patient
  public PostPatientRegister(patient: PHRMPatient) {
    try {
      var patTempData = _.omit(patient, ['PHRMPatientValidator']);
      return this.pharmacyDLService.PostPatientRegister(patTempData)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  ///POST: Posting New Order 
  public PostToPurchaseOrder(PO: PHRMPurchaseOrder) {
    //omiting the validators during post because it causes cyclic error during serialization in server side.
    //omit validator from inputPO (this will give us object)
    let newPO: any = _.omit(PO, ['PurchaseOrderValidator']);

    let newPoItems = PO.PHRMPurchaseOrderItems.map(item => {
      item.PHRMItemMaster = null;
      return _.omit(item, ['PurchaseOrderItemValidator']);
    });
    //assign items to above 'newPO' with exact same propertyname : 'PurchaseOrderItems'
    newPO.PHRMPurchaseOrderItems = newPoItems;

    //let data = JSON.stringify(newPO);
    return this.pharmacyDLService.PostToPurchaseOrder(newPO)
      .map(res => { return res })
  }

  UpdatePurchaseOrder(currentPO: PHRMPurchaseOrder) {
    let newPO: any = _.omit(currentPO, ['PurchaseOrderValidator']);
    let newPoItems = currentPO.PHRMPurchaseOrderItems.map(item => {
      return _.omit(item, ['PurchaseOrderItemValidator', 'PHRMItemMaster']);
    });
    newPO.PHRMPurchaseOrderItems = newPoItems;
    return this.pharmacyDLService.UpdatePurchaseOrder(newPO).map(res => { return res });
  }
  ////POST: GoodsReceipt 
  public PostGoodReceipt(phrmGRVM: PHRMGoodsReceiptViewModel, isPOOrder: boolean) {
    let newRequisitionSVM: any = Object.assign({}, phrmGRVM);

    let grModel = Object.assign({}, phrmGRVM)

    let newGR: any = _.omit(grModel.goodReceipt, ['GoodReceiptValidator']);
    let newGrItems = grModel.goodReceipt.GoodReceiptItem.map(item => {
      return _.omit(item, ['GoodReceiptItemValidator']);
    });
    newGR.GoodReceiptItem = newGrItems;
    newRequisitionSVM.goodReceipt = newGR;

    let newPO: any = _.omit(grModel.purchaseOrder, ['PurchaseOrderValidator', 'Item', 'Supplier']);
    let newPoItems = grModel.purchaseOrder.PHRMPurchaseOrderItems.map(item => {
      return _.omit(item, ['PurchaseOrderItemValidator', 'SelectedItem', 'PHRMItemMaster', 'Item', 'ItemType', '']);
    });
    //assign items to above 'newPO' with exact same propertyname : 'PurchaseOrderItems'
    newPO.PHRMPurchaseOrderItems = newPoItems;
    newRequisitionSVM.purchaseOrder = newPO;
    let data: any;
    data = JSON.stringify(newRequisitionSVM);
    return this.pharmacyDLService.PostToGoodReceipt(data)
      .map(res => { return res })
  }
  ///POST: Posting New return To Supplier Order 
  public PostReturnToSupplierItems(retSuppl: PHRMReturnToSupplierModel) {
    //omiting the validators during post because it causes cyclic error during serialization in server side.
    //omit validator from retSuppl (this will give us object)
    let newretSuppl: any = _.omit(retSuppl, ['ReturnToSupplierValidator']);

    let newretSupplItems = retSuppl.returnToSupplierItems.map(item => {
      //item.SelectedGRItems[0].GoodReceiptItemValidator = null;
      return _.omit(item, ['ReturnToSupplierItemValidator', 'GoodReceiptItemValidator']);
    });
    //assign items to above 'newretSuppl' with exact same propertyname : 'returnToSupplierItems'
    newretSuppl.returnToSupplierItems = newretSupplItems;

    let data = JSON.stringify(newretSuppl);
    return this.pharmacyDLService.PostReturnToSupplierItems(data)
      .map(res => { return res })
  }



  ///POST: Posting New Write off and WriteOffItem Order 
  public PostWriteOffItems(writeoff: PHRMWriteOffModel) {
    try {
      //omiting the validators during post because it causes cyclic error during serialization in server side.
      //omit validator from writeoff (this will give us object)
      let newwrtOff: any = _.omit(writeoff, ['WriteOffValidator']);

      let newwrtOffItem = writeoff.phrmWriteOffItem.map(item => {
        item.SelectedItem = null;
        return _.omit(item, ['WriteOffItemValidator', 'positiveNumberValdiator', 'BatchNoList', 'TempBatchNoList']);
      });
      //assign items to above 'newwrtOffItem' with exact same propertyname : 'phrmWriteOffItem'
      newwrtOff.phrmWriteOffItem = newwrtOffItem;

      let data = JSON.stringify(newwrtOff);
      return this.pharmacyDLService.PostWriteOffItems(data)
        .map(res => { return res })
    }
    catch (ex) {
      throw ex;
    }
  }



  //POST: Save Prescription with Prescription Items
  public PostPrescription(prescription: PHRMPrescription) {
    let newPrescription: any = _.omit(prescription, ['PHRMPrescriptionValidator']);
    //remove other data 
    prescription.PHRMPrescriptionItems.map(itm => {
      itm.ItemListByItemType = null;
      itm.SelectedItem = null;
      return itm;
    });
    let newPrescriptionItems = prescription.PHRMPrescriptionItems.map(item => {
      return _.omit(item, ['PHRMPrescriptionItemsValidator']);
    });
    newPrescription.PHRMPrescriptionItems = newPrescriptionItems;
    let data = JSON.stringify(newPrescription);
    return this.pharmacyDLService.PostPrescription(data)
      .map(res => { return res });
  }

  //POST: Save Invoice details(sale) with Invoice Items
  //This Post for Invoice table,InvoiceItems table,StockTransaction table, 
  //Update on GRItems, update stock
  public postInvoiceData(invoiceData: PHRMInvoiceModel) {
    try {
      let newInvoice: any = _.omit(invoiceData, ['selectedPatient.PHRMPatientValidator', 'InvoiceValidator']);
      let newInvoiceItems = invoiceData.InvoiceItems.map(item => {
        return _.omit(item, ['positiveNumberValdiator', 'InvoiceItemsValidator', 'positiveNumberValdiatortest', 'InvoiceItemsValidatortest', 'GRItems', 'Items']);
      });
      newInvoice.InvoiceItems = newInvoiceItems;
      let data = JSON.stringify(newInvoice);
      return this.pharmacyDLService.PostInvoiceDetails(data)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //POST: Save Invoice details(sale) with Invoice Items
  //This Post for Invoice table,InvoiceItems table,StockTransaction table, 
  //Update on GRItems, update stock
  public AddInvoiceForCreditItems(invoiceData: PHRMInvoiceModel) {
    try {
      let newInvoice: any = _.omit(invoiceData, ['selectedPatient.PHRMPatientValidator', 'InvoiceValidator']);
      let newInvoiceItems = invoiceData.InvoiceItems.map(item => {
        return _.omit(item, ['positiveNumberValdiator', 'InvoiceItemsValidator', 'InvoiceValidator', 'positiveNumberValdiatortest', 'InvoiceItemsValidatortest', 'GRItems', 'Items']);
      });
      newInvoice.InvoiceItems = newInvoiceItems;
      let data = JSON.stringify(newInvoice);
      return this.pharmacyDLService.AddInvoiceForCreditItems(data)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }

  public updateInvoiceForCreditItems(invoiceItemsData: Array<PHRMInvoiceItemsModel>) {
    try {
      let newInvoiceItems = invoiceItemsData.map(item => {
        return _.omit(item, ['positiveNumberValdiator', 'InvoiceItemsValidator', 'positiveNumberValdiatortest', 'InvoiceItemsValidatortest', 'GRItems', 'Items']);
      });
      let data = JSON.stringify(newInvoiceItems);
      return this.pharmacyDLService.updateInvoiceForCreditItems(data)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //Update credit billing on GRItems, update stock
  public PostCreditItemsDetails(invoiceData: PHRMInvoiceModel, requisitionId: number = 0) {
    try {
      let newInvoice: any = _.omit(invoiceData, ['selectedPatient.PHRMPatientValidator', 'InvoiceValidator']);
      let newInvoiceItems = invoiceData.InvoiceItems.map(item => {
        return _.omit(item, ['selectedPatient.PHRMPatientValidator', 'positiveNumberValdiator', 'InvoiceItemsValidator', 'positiveNumberValdiatortest', 'InvoiceItemsValidatortest', 'GRItems', 'Items']);
      });
      newInvoice.InvoiceItems = newInvoiceItems;
      let data = JSON.stringify(newInvoice);
      return this.pharmacyDLService.PostCreditItemsDetails(data, requisitionId)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }

  // get the drug dispatched list as per the nurse requistion
  public GetDrugDispatchListByRequistionId() {

  }

  //POSt: post data to server of Retuned invoice items from customer 
  PostReturnFromCustomerData(invoiceReturnData: PHRMInvoiceReturnModel) {

    let newretCust: any = _.omit(invoiceReturnData, ['selectedPatient.PHRMPatientValidator', 'InvoiceReturnValidator']);

    let newretCustItems = invoiceReturnData.InvoiceReturnItems.map(item => {
      return _.omit(item, ['InvoiceItemsReturnValidator']);
    });
    newretCust.InvoiceReturnItems = newretCustItems;
    let data = JSON.stringify(newretCust);
    return this.pharmacyDLService.PostReturnFromCustomerData(data)
      .map(res => { return res });
  }
  postManualReturn(invoiceReturn: PHRMInvoiceReturnModel) {

    let newretCust: any = _.omit(invoiceReturn, ['selectedPatient.PHRMPatientValidator', 'InvoiceReturnValidator']);

    let newretCustItems = invoiceReturn.InvoiceReturnItems.map(item => {
      return _.omit(item, ['InvoiceItemsReturnValidator']);
    });
    newretCust.InvoiceReturnItems = newretCustItems;
    let data = JSON.stringify(newretCust);
    return this.pharmacyDLService.postManualReturn(data)
      .map(res => { return res });
  }

  //POST:update stockManage transaction
  //Post to StockManage table and post to stockTxnItem table 
  PostManagedStockDetails(selectedData) {
    try {
      let newItem: any = _.omit(selectedData, ['StockManageValidator']);
      let data = JSON.stringify(newItem);
      return this.pharmacyDLService.PostManagedStockDetails(data)
        .map(res => { return res });
    } catch (ex) {
      throw ex;
    }
  }
  //POST: update Store Stock and transfer stock to Dispensary
  TransferToDispensary(selectedData) {
    try {
      let newItem: any = _.omit(selectedData, ['StoreManageValidator']);
      let data = JSON.stringify(newItem);
      return this.pharmacyDLService.TransferToDispensary(data)
        .map(res => { return res; });
    } catch (ex) {
      throw ex;
    }
  }
  //Post: update Dispensary Stock and transfer it to Store
  TransferToStore(selectedData, StoreId) {
    try {
      let newItem: any = _.omit(selectedData, ['StockManageValidator']);
      let data = JSON.stringify(newItem);
      return this.pharmacyDLService.TransferToStore(data, StoreId)
        .map(res => { return res; });
    } catch (ex) {
      throw ex;
    }
  }

  //POST:update storeManage transaction
  //Post to StoreStock table
  PostManagedStoreDetails(selectedData) {
    try {
      let newItem: any = _.omit(selectedData, ['StoreManageValidator']);
      let data = JSON.stringify(newItem);
      return this.pharmacyDLService.PostManagedStoreDetails(data)
        .map(res => { return res });
    } catch (ex) {
      throw ex;
    }
  }

  //POST:update goods receipt cancelation
  //post to stock transaction items
  PostGoodsReceiptCancelDetail(selectedGrId, cancelRemarks: string) {
    try {
      return this.pharmacyDLService.PostGoodsReceiptCancelDetail(selectedGrId, cancelRemarks)
        .map(res => { return res });
    } catch (ex) {
      throw ex;
    }
  }
  // Post drugs request data from nursing to pharmacy invoice item table.
  PostProvisonalItems(proItem: Array<DrugsRequistionItemModel>) {
    try {

      let ProvsionalInvoiceItems = proItem.map(item => {
        return _.omit(item, ['positiveNumberValdiator', 'DrugsRequestValidator', 'positiveNumberValdiatortest', 'DrugsRequestValidatortest', 'GRItems', 'Items']);
      });
      let data = JSON.stringify(ProvsionalInvoiceItems);
      return this.pharmacyDLService.PostProvisonalItems(data)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  // Post Deposit Amount Data to pharmacy deposit table
  public PostPharmacyDeposit(depositData: PHRMDepositModel) {
    try {

      var temp: any = _.omit(depositData, ['DepositValidator']);
      return this.pharmacyDLService.PostPharmacyDeposit(temp)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //post ward request from wards to pharmacy
  PostWardRequisitionItems(wardItem: WardispatchModel) {
    try {
      //   return _.omit(item, ['positiveNumberValdiator', 'WardRequestValidator', 'positiveNumberValdiatortest', 'WardRequestValidatortest', 'selectedItem']);

      let newWardReq: any = _.omit(wardItem, ['DispatchValidator']);
      let newWardReqItems = wardItem.WardDispatchedItemsList.map(item => {
        return _.omit(item);
      });
      newWardReq.WardRequisitionItemsList = newWardReqItems;
      let data = JSON.stringify(newWardReq);
      return this.pharmacyDLService.PostWardRequisitionItems(data)
        .map((res) => { return res });

    }
    catch (ex) {
      throw ex;
    }

  }


  public PostSettlementInvoice(settlement) {

    let stlmntToPost: any = _.omit(settlement, ["Patient"]);


    //omit BillingTransactionItem and Patient from each of BillingTransactions objects
    let txns: Array<PHRMInvoiceModel> = settlement.PHRMInvoiceTransactions.map(bil => {
      return _.omit(bil, ["selectedPatient", "InvoiceItems"]);
    });

    stlmntToPost.PHRMInvoiceTransactions = txns;


    return this.pharmacyDLService.PostBillSettlement(stlmntToPost)
      .map((responseData) => {
        return responseData;
      });
  }
  public AddNewOutpatienPatient(outPatient: PharmacyOpPatientVM) {
    let newPatObject = _.omit(outPatient, ['OutPatientValidator'])
    let patString = JSON.stringify(newPatObject);
    return this.pharmacyDLService.PostPharmacyOutPatient(patString);
  }

  //Posting the Requisiton and requisitionItems table
  PostToRequisition(requisition: PHRMStoreRequisition) {
    let newRequ: any = _.omit(requisition, ['RequisitionValidator']);

    let newRequItems = requisition.RequisitionItems.map(item => {
      return _.omit(item, ['RequisitionItemValidator']);
    });


    newRequ.RequisitionItems = newRequItems;
    let data = JSON.stringify(newRequ);
    return this.pharmacyDLService.PostToRequisition(data)
      .map(res => { return res })
  }
  //POST: Posting Dispatched Items
  PostDispatch(dispatchItems: DispatchItemModel[]) {
    return this.pharmacyDLService.PostDispatch(dispatchItems)
      .map(res => { return res })

  }
  //PUT : setting-supplier manage
  public UpdateSupplier(supplier: PHRMSupplierModel) {
    //to fix serializaiton problem in server side
    if (supplier.CreatedOn)
      supplier.CreatedOn = moment(supplier.CreatedOn).format('YYYY-MM-DD HH:mm');
    //if (supplier.ModifiedOn)
    //    employee.ModifiedOn = moment(employee.ModifiedOn).format('YYYY-MM-DD HH:mm');
    var temp = _.omit(supplier, ['SupplierValidator']);
    return this.pharmacyDLService.PutSupplier(temp)
      .map(res => { return res });
  }

  //PUT:Setting-Stock Items Expiry Date and BatchNo change
  public UpdateStockExpiryDateandBatchNo(stockitem: PHRMUpdatedStockVM) {
    try {
      return this.pharmacyDLService.UpdateStockExpiryDateandBatchNo(stockitem)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //PUT : setting-company manage
  public UpdateCompany(company: PHRMCompanyModel) {
    if (company.CreatedOn)
      company.CreatedOn = moment(company.CreatedOn).format('YYYY-MM-DD HH:mm');
    var temp = _.omit(company, ['CompanyValidator']);
    return this.pharmacyDLService.PutCompany(temp)
      .map(res => { return res });
  }
  //PUT : setting-category manage
  public UpdateCategory(category: PHRMCategoryModel) {
    if (category.CreatedOn)
      category.CreatedOn = moment(category.CreatedOn).format('YYYY-MM-DD HH:mm');
    var temp = _.omit(category, ['CategoryValidator']);
    return this.pharmacyDLService.PutCategory(temp)
      .map(res => { return res });
  }
  //PUT : setting-unit of measurement manage
  public UpdateUnitOfMeasurement(uom: PHRMUnitOfMeasurementModel) {
    if (uom.CreatedOn)
      uom.CreatedOn = moment(uom.CreatedOn).format('YYYY-MM-DD HH:mm');
    var temp = _.omit(uom, ['UnitOfMeasurementValidator']);
    return this.pharmacyDLService.PutUnitOfMeasurement(temp)
      .map(res => { return res });
  }
  //PUT : setting-item type manage
  public UpdateItemType(itemtype: PHRMItemTypeModel) {
    if (itemtype.CreatedOn)
      itemtype.CreatedOn = moment(itemtype.CreatedOn).format('YYYY-MM-DD HH:mm');
    var temp = _.omit(itemtype, ['ItemTypeValidator']);
    return this.pharmacyDLService.PutItemType(temp)
      .map(res => { return res });
  }
  //PUT : setting-packing type manage
  public UpdatePackingType(packingtype: PHRMPackingTypeModel) {
    if (packingtype.CreatedOn)
      packingtype.CreatedOn = moment(packingtype.CreatedOn).format('YYYY-MM-DD HH:mm');
    var temp = _.omit(packingtype, ['PackingTypeValidator']);
    return this.pharmacyDLService.PutPackingType(temp)
      .map(res => { return res });
  }
  //PUT : setting-item manage
  public UpdateItem(item: PHRMItemMasterModel) {
    if (item.CreatedOn)
      item.CreatedOn = moment(item.CreatedOn).format('YYYY-MM-DD HH:mm');
    if (item.ModifiedOn)
      item.ModifiedOn = moment(item.ModifiedOn).format('YYYY-MM-DD HH:mm');
    var temp = _.omit(item, ['ItemValidator', 'RackValidator']);
    return this.pharmacyDLService.PutItem(temp)
      .map(res => { return res });
  }
  //PUT : setting-tax manage
  public UpdateTAX(tax: PHRMTAXModel) {
    if (tax.CreatedOn)
      tax.CreatedOn = moment(tax.CreatedOn).format('YYYY-MM-DD HH:mm');
    var temp = _.omit(tax, ['TAXValidator']);
    return this.pharmacyDLService.PutTAX(temp)
      .map(res => { return res });
  }

  //PUT : CCCharge in core parameter
  public AddCCcharge(CurrentItem: CFGParameterModel) {
    var temp = _.omit(CurrentItem, ['ItemValidator']);
    return this.pharmacyDLService.PutCCcharge(temp)
      .map(res => { return res });
  }
  //PUT Generic Name
  public UpdateGenericName(genericName: PHRMGenericModel) {
    if (genericName.CreatedOn) {
      genericName.CreatedOn = moment(genericName.CreatedOn).format('YYYY-MM-DD HH:mm');
    }
    var temp = _.omit(genericName, ['GenericValidator']);
    return this.pharmacyDLService.PutGenericName(temp)
      .map(res => { return res });
  }
  //PUT Credit Organizations
  public UpdateCreditOrganization(creditOrganization: CreditOrganization) {
    //to fix serializaiton problem in server side
    if (creditOrganization.CreatedOn)
      creditOrganization.CreatedOn = moment(creditOrganization.CreatedOn).format('YYYY-MM-DD HH:mm');
    if (creditOrganization.ModifiedOn)
      creditOrganization.ModifiedOn = moment(creditOrganization.ModifiedOn).format('YYYY-MM-DD HH:mm');
    var temp = _.omit(creditOrganization, ['CreditOrganizationValidator']);
    return this.pharmacyDLService.PutCreditOrganization(temp)
      .map(res => { return res });
  }
  //PUT : Stock Manage
  public UpdateStock(stkManageData: Array<PHRMGoodsReceiptItemsModel>) {
    try {
      let temp = stkManageData.map(item => {
        return _.omit(item, ['GoodReceiptItemValidator']);
      });
      return this.pharmacyDLService.PutStock(temp)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  public UpdateNMCNo(EmployeeId, MedCertificationNo) {
    try {
      return this.pharmacyDLService.UpdateNMCNo(EmployeeId, MedCertificationNo)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //PUT : Stock Manage
  public UpdateGoodsReceipt(GoodReceipt: PHRMGoodsReceiptModel) {
    try {

      let temp = _.omit(GoodReceipt, ['GoodReceiptValidator', 'dateValidator']);
      let goodReceiptItems = GoodReceipt.GoodReceiptItem.map(item => {
        return _.omit(item, ['GoodReceiptItemValidator', 'SelectedItem']);
      });
      temp.GoodReceiptItem = goodReceiptItems;
      return this.pharmacyDLService.UpdateGoodsReceipt(temp)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }

  //PUT : DepositPrintcount
  public UpdateDepositPrintCount(data) {
    try {
      return this.pharmacyDLService.PutDepositPrintCount(data)
        .map(res => { return res });
    } catch (ex) {
      throw ex;
    }
  }

  //PUT: Sale -Credit Bill Payment
  public putPayInvoiceItemsCredit(selectedItems: Array<PHRMInvoiceItemsModel>) {
    try {
      let data = selectedItems.map(item => {
        return _.omit(item, ['InvoiceItemsValidator']);
      });
      return this.pharmacyDLService.putPayInvoiceItemsCredit(data)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  //PUT: Setting- Stock Txn Items SalePrice change
  public UpdateStockMRP(stockTxnItem: IMRPUpdatedStock) {
    try {
      return this.pharmacyDLService.UpdateStockMRP(stockTxnItem)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }

  // for cancel the credit bill.
  public CancelCreditBill(creditItems: any) {
    try {

      return this.pharmacyDLService.CancelCreditBill(creditItems)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }



  public GetAllCreditSummary(fromDate, toDate, dispensaryId) {
    return this.pharmacyDLService.GetAllCreditSummary(fromDate, toDate, dispensaryId)
      .map((responseData) => {
        return responseData;
      });
  }
  public GetPatientsProvisionalInfoByPatientId(dispensaryId, patientId: number) {
    return this.pharmacyDLService.GetPatientsProvisionalInfoByPatientId(dispensaryId, patientId)
      .map((responseData) => {
        return responseData;
      });
  }

  public GetAllProvisionalReturn(fromDate, toDate, dispensaryId) {
    return this.pharmacyDLService.GetAllProvisionalReturn(fromDate, toDate, dispensaryId)
      .map((responseData) => {
        return responseData;
      });
  }
  public GetAllProvisionalReturnDuplicatePrint(PatientId) {
    return this.pharmacyDLService.GetAllProvisionalReturnDuplicatePrint(PatientId)
      .map((responseData) => {
        return responseData;
      });
  }
  public GetPatientCreditItems(patientId: number, storeId: number, PatientVisitId?: number) {
    return this.pharmacyDLService.GetPatientCreditItems(patientId, storeId, PatientVisitId)
      .map((responseData) => {
        return responseData;
      });
  }

  //update PrintCount for print on Billingtransaction
  public PutPrintCount(printCount: number, invoiceId: number) {
    return this.pharmacyDLService.PutPrintCount(printCount, invoiceId)
      .map((responseData) => {
        return responseData;
      })
  }

  //PUT : setting-item add to rack
  public addtoRack(itemId: number, dispensarRackId: number, storeRackId: number) {
    return this.pharmacyDLService.PutAddItemToRack(itemId, dispensarRackId, storeRackId)
      .map((responseData) => {
        return responseData;
      })
  }

  public UpdateSettlementPrintCount(settlementId: number) {
    return this.pharmacyDLService.PutSettlementPrintCount(settlementId)
      .map(res => res);
  }

  //GET GR history
  GetGoodReceiptHistory() {
    return this.pharmacyDLService.GetGoodReceiptHistory().map(res => res);
  }
  GetGRDetailsByGRId(goodsReceiptId: number, isGRCancelled: boolean) {
    return this.pharmacyDLService.GetGRDetailsByGRId(goodsReceiptId, isGRCancelled).map(res => res);
  }
  GetInvoiceReceiptByInvoiceId(invoiceId: number) {
    return this.pharmacyDLService.GetInvoiceReceiptByInvoiceId(invoiceId).map(res => res);
  }
  //Post Direct Dispatch
  public PostDirectDispatch(dispatchItems: Array<PHRMStoreDispatchItems>) {
    try {
      let tempArray = [];
      dispatchItems.forEach(item => {
        let temp = _.omit(item, ['DispatchItemValidator']);
        tempArray.push(temp);
      })
      return this.pharmacyDLService.PostDirectDispatch(tempArray)
        .map(res => { return res });
    }
    catch (ex) { throw ex; }
  }
  //get Pharmacy Item Rate History
  getItemRateHistory() {
    return this.pharmacyDLService.getItemRateHistory()
      .map(res => { return res });
  }
  getMRPHistory() {
    return this.pharmacyDLService.getMRPHistory()
      .map(res => { return res });
  }
  getItemFreeQuantityHistory() {
    return this.pharmacyDLService.FreeQuantityHistory()
      .map(res => { return res });
  }

  public GetSettlementSingleInvoicePreview(InvoiceId: number) {
    return this.pharmacyDLService.GetSettlementSingleInvoicePreview(InvoiceId)
      .map((responseData) => {
        return responseData;
      })
  }
  public GetGRDetailWithAvailableStock(goodsReceiptId) {
    return this.pharmacyDLService.GetGRDetailWithAvailableStock(goodsReceiptId)
      .map((responseData) => {
        return responseData;
      })
  }

  ExportStocksForReconciliationToExcel() {
    return this.pharmacyDLService.ExportStocksForReconciliationToExcel()
      .map(res => { return res })
  }
  UpdateReconciledStockFromExcelFile(ChangedStockList: any) {
    let data = JSON.stringify(ChangedStockList);
    return this.pharmacyDLService.UpdateReconciledStockFromExcelFile(data)
      .map(res => { return res })

  }

  //Get Return On Investment Report
  public GetReturnOnInvestmentReport(FromDate, ToDate) {
    try {
      return this.pharmacyDLService.GetReturnOnInvestmentReport(FromDate, ToDate)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  public GetItemListWithStoreId(dispensaryId) {
    return this.pharmacyDLService.GetItemListFromStoreId(dispensaryId)
      .map(res => { return res });
  }
  public GetPaymentWiseReportData(fromDate: string, toDate: string, PaymentMode: string, Type: string, UserId: number, StoreId: number) {
    return this.pharmacyDLService.GetPaymentWiseReportData(fromDate, toDate, PaymentMode, Type, UserId, StoreId)
      .map(res => { return res });
  }
  AddPriceCategory(rowToAdd: any) {
    return this.pharmacyDLService.AddPriceCategory(rowToAdd).map(res => { return res });
  }
  UpdatePriceCategory(rowToAdd: any) {
    return this.pharmacyDLService.UpdatePriceCategory(rowToAdd).map(res => { return res });
  }
  GetPriceCategories() {
    return this.pharmacyDLService.GetPriceCategories().map(res => { return res });
  }
  public IsClaimed(latestClaimCode: number, patientId: number) {
    return this.pharmacyDLService.IsClaimed(latestClaimCode, patientId).map(res => {
      return res;
    });
  }
  PostSubStoreDispatch(dispatchItems: DispatchItemModel[]) {
    return this.pharmacyDLService.PostSubStoreDispatch(dispatchItems)
      .map(res => { return res })

  }
  GetFiscalYearList() {
    return this.pharmacyDLService.GetFiscalYearList()
      .map(res => { return res })
  }
  public GetPharmacyDashboardCardSummaryCalculation(FromDate, ToDate) {
    try {
      return this.pharmacyDLService.GetPharmacyDashboardCardSummaryCalculation(FromDate, ToDate)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }

  public GetPharmacyDashboardSubstoreWiseDispatchValue(FromDate, ToDate) {
    try {
      return this.pharmacyDLService.GetPharmacyDashboardSubstoreWiseDispatchValue(FromDate, ToDate)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  public GetPharmacyDashboardMembershipWiseMedicineSale(FromDate, ToDate) {
    try {
      return this.pharmacyDLService.GetPharmacyDashboardMembershipWiseMedicineSale(FromDate, ToDate)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  public GetPharmacyDashboardMostSoldMedicine(FromDate, ToDate) {
    try {
      return this.pharmacyDLService.GetPharmacyDashboardMostSoldMedicine(FromDate, ToDate)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  public GetRankMembershipwiseSalesData(fromDate: string, toDate: string, rank: string, membership: string) {
    return this.pharmacyDLService.GetRankMembershipwiseSalesData(fromDate, toDate, rank, membership)
      .map(res => { return res });
  }
  public GetAllMembership() {
    try {
      return this.pharmacyDLService.GetAllMembership()
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }
  public GetAllRankList() {
    try {
      return this.pharmacyDLService.GetAllRankList()
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  GetAllPharmacyStore() {
    return this.pharmacyDLService.GetAllPharmacyStore().map(res => { return res });
  }
  public GetParentRackList() {
    return this.pharmacyDLService.GetParentRackList()
      .map(res => {
        return res;
      });
  }
  public AddItemToRack(data: Array<PHRMMapItemToRack>) {
    return this.pharmacyDLService.AddItemToRack(data).map(res => { return res });
  }
  public GetAllRackItem(selectedItemId, StoreId) {
    return this.pharmacyDLService.GetAllRackItem(selectedItemId, StoreId).map(res => { return res });
  }
  public GetItemRackAllocationData(ItemId?: number) {
    return this.pharmacyDLService.GetItemRackAllocationData(ItemId).map(res => { return res });
  }
  public GetAllRackList() {
    return this.pharmacyDLService.GetAllRackList().map(res => {
      return res
    });
  }
  public GetRackNoByItemIdAndStoreId(itemId: number, StoreId?: number) {
    return this.pharmacyDLService.GetRackNoByItemIdAndStoreId(itemId, StoreId).map(res => { return res });
  }
  public PostItemToRack(data: Array<PHRMMapItemToRack>) {
    return this.pharmacyDLService.PostItemToRack(data).map(res => { return res });
  }
  public GetReturnFromCustomerModelDataByHospitalNo(HospitalNo: string, PaymentMode: string, FromDate: string, ToDate: string, StoreId: number, SchemeId: number) {
    try {
      return this.pharmacyDLService.GetReturnFromCustomerModelDataByHospitalNo(HospitalNo, PaymentMode, FromDate, ToDate, StoreId, SchemeId)
        .map(res => res);
    }
    catch (ex) {
      throw ex;
    }
  }
  public PostMultipleInvoiceItemReturnFromCustomer(InvoicesToBeReturn: InvoiceDetailToBeReturn[]) {
    return this.pharmacyDLService.PostMultipleInvoiceItemReturnFromCustomer(InvoicesToBeReturn).map(res => res);
  }

  public GetMultipleInvoiceItemsReturnFromCustomerByInvoiceReturnId(InvoiceReturnId: number) {
    return this.pharmacyDLService.GetMultipleInvoiceItemsReturnDetailFromCustomerByInvoiceReturnId(InvoiceReturnId).map(res => res);
  }
  public PostPatientConsumption(patientConsumption: PHRMPatientConsumption) {
    let patientConsumptionItems = patientConsumption.PatientConsumptionItems.map(item => {
      return _.omit(item, ['PatientConsumptionValidator']);
    });
    patientConsumption.PatientConsumptionItems = patientConsumptionItems;
    return this.pharmacyDLService.PostPatientConsumption(patientConsumption).map(res => { return res });
  }
  public GetPatientConsumptions() {
    return this.pharmacyDLService.GetPatientConsumptions().map(res => { return res });
  }
  public PostPatientConsumptionInvoiceItems(patientConsumptionInvoice: PHRMPatientConsumption) {
    let patientConsumption = _.omit(patientConsumptionInvoice, ['InvoiceValidator', 'selectedPatient.PHRMPatientValidator']);
    return this.pharmacyDLService.PostPatientConsumptionInvoiceItems(patientConsumption).map(res => { return res });
  }

  public GetPatientConsumption(PatientId: number, PatientVisitId: number) {
    return this.pharmacyDLService.GetPatientConsumptionForReturn(PatientId, PatientVisitId).map(res => { return res });
  }

  public SavePatientConsumptionReturn(ConsumptionItems: Array<PHRMPatientConsumptionItem>) {
    return this.pharmacyDLService.SavePatientConsumptionReturn(ConsumptionItems).map(res => { return res });
  }
  public GetPatientConsumptionReturnList() {
    return this.pharmacyDLService.GetPatientConsumptionReturnList().map(res => { return res });
  }
  public GetPatientConsumptionReturnInfo(ConsumptionReturnReceiptNo: number) {
    return this.pharmacyDLService.GetPatientConsumptionReturnInfo(ConsumptionReturnReceiptNo).map(res => { return res });
  }
  public GetFinalizePatientConsumptions() {
    return this.pharmacyDLService.GetFinalizePatientConsumptions().map(res => { return res });
  }

  public GetPatientConsumptionFinalizeInvoice(InvoicePrintNo?: number) {
    return this.pharmacyDLService.GetPatientConsumptionFinalizeInvoice(InvoicePrintNo).map(res => { return res });
  }

  public GetVerifiers() {
    return this.pharmacyDLService.GetVerifiers().map(res => { return res });
  }

  public GetStores() {
    return this.pharmacyDLService.GetStores().map(res => { return res });
  }

  public GetDispensaryAvailableStock(dispensaryId: number, priceCategoryId?: number) {
    return this.pharmacyDLService.GetDispensaryAvailableStock(dispensaryId, priceCategoryId)
      .map(res => { return res });
  }
  public GetPatientConsumptionInfo(patientConsumptionId: number) {
    return this.pharmacyDLService.GetPatientConsumptionInfo(patientConsumptionId).map(res => { return res });
  }

  public GetIPPatientList(searchTxt: string) {
    return this.patientDLService.GetIpdPatientsWithVisitsInfo(searchTxt).map(res => { return res });
  }

  public GetPatientConsumptionsOfPatient(PatientId: number, PatientVisitId: number) {
    return this.pharmacyDLService.GetPatientConsumptionsOfPatient(PatientId, PatientVisitId).map(res => { return res });
  }

  public GetWardSubStoreMapDetails(WardId: number) {
    return this.pharmacyDLService.GetWardSubStoreMapDetails(WardId).map(res => { return res });
  }

  public GetPatientConsumptionsOfNursingWard(StoreIds: string) {
    return this.pharmacyDLService.GetPatientConsumptionsOfNursingWard(StoreIds).map(res => { return res });
  }
  public GetPatientConsumptionsFromNursingWard(PatientId: number, PatientVisitId: number, StoreIds: string) {
    return this.pharmacyDLService.GetPatientConsumptionsFromNursingWard(PatientId, PatientVisitId, StoreIds).map(res => { return res });
  }

  public GetPharmacyIpBillingScheme(SchemeId: number) {
    return this.pharmacyDLService.GetPharmacyIpBillingScheme(SchemeId).map(res => { return res });
  }
  public GetSubStores() {
    return this.pharmacyDLService.GetSubStores().map(res => { return res });
  }
  public GetItemWiseWardSupplyReport(FromDate: string, ToDate: string, WardId: number, ItemId: number) {
    return this.pharmacyDLService.GetItemWiseWardSupplyReport(FromDate, ToDate, WardId, ItemId).map(res => { return res });
  }
  public GetDefaultScheme(ServiceBillingContext: string) {
    return this.pharmacyDLService.GetDefaultScheme(ServiceBillingContext).map(res => { return res });
  }
  public GetPharmacyItems() {
    return this.pharmacyDLService.GetPharmacyItems().map(res => { return res });
  }

  public SaveProvisional(provisionalItems: PHRMInvoiceItemsModel[]) {
    try {
      const updatedItems = provisionalItems.map(itm => {
        return { ...(_.omit(itm, ['positiveNumberValdiator', 'InvoiceItemsValidator', 'positiveNumberValdiatortest', 'InvoiceItemsValidatortest', 'GRItems', 'Items'])) };
      });

      let data = JSON.stringify(updatedItems);

      return this.pharmacyDLService.SaveProvisional(data)
        .map(res => { return res });
    } catch (ex) {
      throw ex;
    }
  }
  public GetProvisionalReturnReceipt(ReturnReceiptNo: number, FiscalYearId: number) {
    return this.pharmacyDLService.GetProvisionalReturnReceipt(ReturnReceiptNo, FiscalYearId).map(res => { return res });
  }

  public GetProvisionalReturns(FromDate: string, ToDate: string, StoreId: number) {
    return this.pharmacyDLService.GetProvisionalReturns(FromDate, ToDate, StoreId).map(res => { return res });
  }
  public UpdatePrescriptionItemStatus(PatientId: number) {
    try {
      return this.pharmacyDLService.UpdatePrescriptionItemStatus(PatientId)
        .map(res => res);
    }
    catch (ex) {
      throw ex;
    }
  }

  public GetGenericWisePurchaseSummaryReport(FromDate: string, ToDate: string, GenericId: number, SupplierId: number) {
    return this.pharmacyDLService.GetGenericWisePurchaseSummaryReport(FromDate, ToDate, GenericId, SupplierId).map(res => { return res });
  }

  public GetStockTransferSummaryReport(FromDate: string, ToDate: string, GenericId: number, SourceStoreId: number, TargetStoreId: number) {
    return this.pharmacyDLService.GetStockTransferSummaryReport(FromDate, ToDate, GenericId, SourceStoreId, TargetStoreId).map(res => { return res });
  }

  public AddNewOutdoorPatientAndCreateFreeVisit(freeVisit: FreeVisit_DTO) {
    let freeVisitObj = _.cloneDeep(freeVisit);

    let visitData = _.omit(freeVisitObj, [
      'QuickAppointmentValidator',
      'Patient.PatientValidator',
      'Visit.VisitValidator',
      'Patient.PatientScheme.PatientSchemeValidator',
      'Patient.Guarantor',
      'Patient.CountrySubDivision',
    ]);

    return this.pharmacyDLService.AddNewOutDoorPatientAndCreateFreeVisit(visitData);

  }
  GetStoreStocksToDispatch(showAllStock: boolean = false) {
    return this.pharmacyDLService.GetStoreStocksToDispatch(showAllStock).map(res => { return res; });
  }
  GetActivePharmacyPackages() {
    return this.pharmacyDLService.GetActivePharmacyPackages().map(res => { return res; });
  }
  GetActivePharmacyPackageItems() {
    return this.pharmacyDLService.GetActivePharmacyPackageItems().map(res => { return res; });
  }
  GetMedicinePackageList() {
    return this.pharmacyDLService.GetMedicinePackage().map(res => {
      return res;
    });
  }
  GerItemListWithGenericId() {
    return this.pharmacyDLService.GerItemListWithGenericId().map(res => {
      return res;
    });
  }
  PostPharmacyPackageBilling(PackageBilling: PHRMPackageModel) {
    let phrmPackageBilling: PHRMPackageModel = _.omit(PackageBilling, ['PackageValidator']);

    let phrmPackageBillingItems = PackageBilling.PackageItems.map(item => {
      return _.omit(item, ['PackageItemsValidator']);
    });
    phrmPackageBilling.PackageItems = phrmPackageBillingItems;
    return this.pharmacyDLService.PostPharmacyPackageBilling(phrmPackageBilling).map(res => { return res });
  }
  ActivateDeactivatePackage(pharmacyPackageId: number, flag: boolean) {
    return this.pharmacyDLService.ActivateDeactivatePackage(pharmacyPackageId, flag).map(res => { return res });
  }
  GetPackageById(pharmacyPackageId: number) {
    return this.pharmacyDLService.GetPackageById(pharmacyPackageId).map(res => { return res });
  }
  UpdatePackage(packageBilling: PHRMPackageModel) {

    let phrmPackageBilling: PHRMPackageModel = _.omit(packageBilling, ['PackageValidator']);

    let phrmPackageBillingItems = packageBilling.PackageItems.map(item => {
      return _.omit(item, ['PackageItemsValidator']);
    });
    phrmPackageBilling.PackageItems = phrmPackageBillingItems;
    return this.pharmacyDLService.UpdatePackage(phrmPackageBilling).map(res => { return res });
  }

  GetDepositHead() {
    return this.pharmacyDLService.GetDepositHead().map(res => { return res });
  }
  GetDeposits(fromDate: string, toDate: string, dispensaryId: number) {
    return this.pharmacyDLService.GetDeposits(fromDate, toDate, dispensaryId).map(res => { return res });
  }

  public GetPatientProvisionalEstimationBill(patientId: number, storeId: number, PatientVisitId?: number) {
    return this.pharmacyDLService.GetPatientProvisionalEstimationBill(patientId, storeId, PatientVisitId)
      .map((responseData) => {
        return responseData;
      });
  }
  GetPatientInfoSettlement() {
    return this.pharmacyDLService.GetPatientInfoSettlement()
      .map((responseData) => {
        return responseData;
      });
  }
  public GetPhrmDepositBalanceReport() {
    try {
      return this.pharmacyDLService.GetPhrmDepositBalanceReport()
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }
  }
  ////Get: Get Doctorwise sales Report Data
  public GetDoctorwiseSalesReport(fromdate, todate, prescriberId, itemId) {
    try {
      return this.pharmacyDLService.GetDoctorwiseSalesReport(fromdate, todate, prescriberId, itemId)
        .map(res => { return res });
    }
    catch (ex) {
      throw ex;
    }

  }

  public GetPreviousSaleQuantityWithInCappingDays(patientId: number, cappingDaysLimit: number, itemId: number) {
    return this.pharmacyDLService.GetPreviousSaleQuantityWithInCappingDays(patientId, cappingDaysLimit, itemId)
      .map((responseData) => {
        return responseData;
      })
  }

  public IsClaimed_HIB(latestClaimCode: number) {
    return this.pharmacyDLService.IsClaimed_HIB(latestClaimCode).map(res => {
      return res;
    });
  }
  public IsClaimed_ECHS(latestClaimCode: number) {
    return this.pharmacyDLService.IsClaimed_ECHS(latestClaimCode).map(res => {
      return res;
    });
  }
  public GetVisitWiseBillsSummaryReport(patientId: number, visitType: string, ShowDischargeStatementBill: boolean) {
    return this.pharmacyDLService.GetVisitWiseBillsSummaryReport(patientId, visitType, ShowDischargeStatementBill)
      .map((responseData) => {
        return responseData;
      })
  }
  public GetVisitWiseBillsDetailSummaryReport(PaymentMode: string, PatientVisitId: number) {
    return this.pharmacyDLService.GetVisitWiseBillsDetailSummaryReport(PaymentMode, PatientVisitId)
      .map((responseData) => {
        return responseData;
      })
  }

  public UpdateInvoiceItemsSalePrice(invoiceItems: InvoiceItemSalePriceUpdate_DTO[]) {
    return this.pharmacyDLService.UpdateInvoiceItemsSalePrice(invoiceItems)
      .map((responseData) => {
        return responseData;
      })
  }

  public GetInsurancePackageBillServiceItems() {
    return this.pharmacyDLService.GetInsurancePackageBillServiceItems().map((res) => {
      return res;
    });
  }
  public GetMasterItemPriceCategories(ItemId: number) {
    return this.pharmacyDLService.GetMasterItemPriceCategories(ItemId).map((res) => {
      return res;
    });
  }
  public GetProvisionalSalesReport(PatientId: number, VisitType: string, StoreId?: number) {
    return this.pharmacyDLService.GetProvisionalSalesReport(PatientId, VisitType, StoreId).map((res) => {
      return res;
    });
  }
  public GetPatientsWithProvisional() {
    return this.pharmacyDLService.GetPatientsWithProvisional().map((res) => {
      return res;
    });
  }

  public GetProvisionalSalesDetailReport(PatientId: number, VisitType: string, SchemeId: number, StoreId?: number) {
    return this.pharmacyDLService.GetProvisionalSalesDetailReport(PatientId, VisitType, SchemeId, StoreId).map((res) => {
      return res;
    });
  }

  GetPatientPrescriptionAvailability(PatientId: number) {
    return this.pharmacyDLService.GetPatientPrescriptionAvailability(PatientId).map((res) => {
      return res;
    });
  }

  GetPatientPrescription(PatientId: number) {
    return this.pharmacyDLService.GetPatientPrescription(PatientId).map((res) => {
      return res;
    });
  }
  GetPatientPrescriptionItems(PrescriptionId: number) {
    return this.pharmacyDLService.GetPatientPrescriptionItems(PrescriptionId).map((res) => {
      return res;
    });
  }
  UpdatePrescriptionItemQuantity(prescriptionItems: PrescriptionItemQuantityUpdate_DTO[]) {
    return this.pharmacyDLService.UpdatePrescriptionItemQuantity(prescriptionItems).map((res) => {
      return res;
    });
  }
  DiscardPrescriptionItem(prescriptionItemId: number) {
    return this.pharmacyDLService.DiscardPrescriptionItem(prescriptionItemId).map((res) => {
      return res;
    });
  }
  DiscardPrescription(prescriptionItemId: number) {
    return this.pharmacyDLService.DiscardPrescription(prescriptionItemId).map((res) => {
      return res;
    });
  }

  GetSupplierWiseAvailableStock() {
    return this.pharmacyDLService.GetSupplierWiseAvailableStock().map((res) => {
      return res;
    });
  }
  SaveReturnToSupplier(ReturnToSupplier: ReturnToSupplier_DTO) {
    let tempReturnToSupplier = _.omit(ReturnToSupplier, ['ReturnValidator']);

    let returnSupplierItems = tempReturnToSupplier.ReturnToSupplierItems.map(item => {
      return _.omit(item, ['ReturnItemsValidator']);
    });
    tempReturnToSupplier.ReturnToSupplierItems = returnSupplierItems;
    return this.pharmacyDLService.SaveReturnToSupplier(tempReturnToSupplier).map((res) => {
      return res;
    });
  }
}
