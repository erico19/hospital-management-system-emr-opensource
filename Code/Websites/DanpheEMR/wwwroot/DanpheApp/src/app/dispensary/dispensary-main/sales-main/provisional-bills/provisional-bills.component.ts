import { ChangeDetectorRef, Component, HostListener, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from "lodash";
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { BillingFiscalYear } from '../../../../billing/shared/billing-fiscalyear.model';
import { BillingTransactionItem } from '../../../../billing/shared/billing-transaction-item.model';
import { PatientBillingContextVM } from '../../../../billing/shared/patient-billing-context-vm';
import { CoreService } from '../../../../core/shared/core.service';
import { Patient } from '../../../../patients/shared/patient.model';
import { PatientService } from '../../../../patients/shared/patient.service';
import { PharmacyProvisionalEstimationBillReceipt_DTO } from '../../../../pharmacy/receipt/pharmacy-provisional-estimation-bill-print/pharmacy-provisional-estimation-bill-receipt.dto';
import { PharmacySchemePriceCategory_DTO } from '../../../../pharmacy/shared/dtos/pharmacy-scheme-pricecategory.dto';
import { PHRMEmployeeCashTransaction } from '../../../../pharmacy/shared/pharmacy-employee-cash-transaction';
import { PharmacyReceiptModel } from '../../../../pharmacy/shared/pharmacy-receipt.model';
import { PharmacyBLService } from '../../../../pharmacy/shared/pharmacy.bl.service';
import { PharmacyService } from '../../../../pharmacy/shared/pharmacy.service';
import { PHRMInvoiceItemsModel } from '../../../../pharmacy/shared/phrm-invoice-items.model';
import { PHRMInvoiceModel } from '../../../../pharmacy/shared/phrm-invoice.model';
import { PHRMPatient } from '../../../../pharmacy/shared/phrm-patient.model';
import { PHRMStoreModel } from '../../../../pharmacy/shared/phrm-store.model';
import { SecurityService } from '../../../../security/shared/security.service';
import { GeneralFieldLabels } from '../../../../shared/DTOs/general-field-label.dto';
import { CallbackService } from '../../../../shared/callback.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { CommonFunctions } from '../../../../shared/common.functions';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../../shared/danphe-grid/NepaliColGridSettingsModel';
import GridColumnSettings from '../../../../shared/danphe-grid/grid-column-settings.constant';
import { GridEmitModel } from '../../../../shared/danphe-grid/grid-emit.model';
import { FewaPayService } from '../../../../shared/fewa-pay/helpers/fewa-pay.service';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { RouteFromService } from '../../../../shared/routefrom.service';
import { ENUM_BillPaymentMode, ENUM_BillingStatus, ENUM_DanpheHTTPResponses, ENUM_FewaPayMessageTypes, ENUM_FewaPayTransactionFrom, ENUM_MessageBox_Status, ENUM_POS_ResponseStatus } from '../../../../shared/shared-enums';
import { DispensaryService } from '../../../shared/dispensary.service';
import { PatientVisitWiseProvisionalBillsInfo_DTO } from './dtos/patient-visit-wise-provisional-bills-info.dto';

@Component({
  selector: 'provisional-bills',
  templateUrl: './provisional-bills.component.html',
  styleUrls: ['./provisional-bills.component.css'],
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class ProvisionalBillsComponent implements OnInit {
  BillMode: "FinalizeInvoice" | "UpdateInvoice" = "FinalizeInvoice";
  @Input("patientId") patientId: number;
  @Input("patient-visit-id") patientVisitId: number;
  @Input("provisionalFromSettlement") provisionalFromSettlement = false;
  public counterId: number = 0;
  public allCreditItems: Array<PHRMInvoiceItemsModel> = new Array<PHRMInvoiceItemsModel>();
  public PatientVisitWiseProvisionalBillsInfo: PatientVisitWiseProvisionalBillsInfo_DTO[] = [];

  public creditBillGridColumns: Array<any> = null;
  //declare boolean loading variable for disable the double click event of button
  loading: boolean = false;
  //added: sud:12May'18
  public selectAllItems: boolean = false;
  public currentPatient: PHRMPatient = new PHRMPatient();
  public showActionPanel: boolean = false;
  public selectedItemsTotAmount: number = 0;
  public remarks: string = null;
  public showCancelSummaryPanel: boolean = false;
  public checkDeductfromDeposit: boolean = false;
  public deductDeposit: boolean = false;
  public cancelledItems: Array<BillingTransactionItem> = [];
  public highlightRemark: boolean = false;
  public currBillingContext: PatientBillingContextVM;
  public admissionDetail;
  public selectedSaleCreditData: PHRMPatient = new PHRMPatient();
  //sud: 31May'18--to display patient bill summary
  public showPatBillHistory: boolean = false;
  public userName: any;
  public isPrint: boolean = false;
  public showSaleItemsPopup: boolean = false;
  //for show and hide item level discount features
  IsitemlevlDis: boolean = false;
  public allFiscalYrs: Array<BillingFiscalYear> = new Array<BillingFiscalYear>();
  public pharmacyReceipt: PharmacyReceiptModel = new PharmacyReceiptModel();
  public patSummary = { IsLoaded: false, PatientId: 0, CreditAmount: 0, ProvisionalAmt: 0, TotalDue: 0, DepositBalance: 0, BalanceAmount: 0, GeneralCreditLimit: 0, IpCreditLimit: 0, OpCreditLimit: 0, OpBalance: 0, IpBalance: 0 };


  public currentCounter: number = null;
  public total: number = 0;
  public today = new Date();
  public isSubStoreCall: boolean = false;
  public currentActiveDispensary: PHRMStoreModel;
  public fromDate: string = moment().format('YYYY-MM-DD');
  public toDate: string = moment().format('YYYY-MM-DD');
  public dateRange: string = "last1Week";
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public isItemLevelVATApplicable: boolean;
  public isMainVATApplicable: boolean;
  selectedPatientId: number = 0;
  saleDetails: PHRMInvoiceItemsModel;
  saleReturnDetails: Array<PHRMInvoiceItemsModel> = new Array<PHRMInvoiceItemsModel>();
  MstPaymentModes: any[] = [];
  public phrmEmpCashTxn: PHRMEmployeeCashTransaction = new PHRMEmployeeCashTransaction();
  newCurrSaleItems: Array<PHRMInvoiceItemsModel> = new Array<PHRMInvoiceItemsModel>();
  SchemePriceCategory: PharmacySchemePriceCategory_DTO = new PharmacySchemePriceCategory_DTO();
  TempcurrSaleItems: PHRMInvoiceItemsModel[];
  ReturnReceiptNo: number = 0;
  ShowProvisionalReturnReceipt: boolean = false;
  InvoiceId: number = 0;
  DisablePaymentModeDropDown: boolean = false;
  showSaleInvoice: boolean = false;
  public confirmationTitle: string = "Confirm !";
  public confirmationMessage: string = "Are you sure you want to Print Invoice ?";
  public confirmationMessageForProvisionalInvoiceUpdate: string = "Are you sure you want to update provisional invoice ?";
  ClearPaymentDetail: boolean = false;
  IsOtherProvisionalRemaining: boolean = false;
  IsReturnDepositChecked: boolean = false;
  DepositRefundAmount: number = 0;
  IsPendingSettlements: boolean = false;
  ShowDepositReturnCheckbox: boolean = true;
  ShowEstimationBillInvoice: boolean = false;
  SearchProperty: string = 'PatientCode';
  public SelectedPatient: Patient = null;
  loadingScreen: boolean = false;
  FiscalYearId: number = 0;
  ShowProvisionalGrid: boolean = false;
  ShowProvisionalDetails: boolean = false;
  public GeneralFieldLabel = new GeneralFieldLabels();
  constructor(private _dispensaryService: DispensaryService,
    public routeFromService: RouteFromService,
    public router: Router,
    public pharmacyService: PharmacyService,
    public patientService: PatientService,
    public securityService: SecurityService,
    public callbackservice: CallbackService,
    public messageboxService: MessageboxService,
    public pharmacyBLService: PharmacyBLService,
    public changeDetectorRef: ChangeDetectorRef,
    public coreService: CoreService,
    private _fewaPayService: FewaPayService) {
    this.MstPaymentModes = this.coreService.masterPaymentModes;
    this.currentCounter = this.securityService.getPHRMLoggedInCounter().CounterId;
    this.currentActiveDispensary = this._dispensaryService.activeDispensary;
    // this.fromDate = moment().format('YYYY-MM-DD');
    let currentDate = moment();
    this.fromDate = currentDate.subtract(7, 'days').format('YYYY-MM-DD');
    this.toDate = moment().format('YYYY-MM-DD');
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('VisitDate', false));
    if (this.currentCounter < 1) {
      if (this.routeFromService.RouteFrom != "") {
        this.currentCounter = 1;
      } else {
        // this.callbackservice.CallbackRoute = 'Dispensary/Sale/CreditBills'
        this.router.navigate(['/Dispensary/ActivateCounter']);
      }
    }
    else {
      this.router.navigate(['/Dispensary/Sale/CreditBills']);
      this.creditBillGridColumns = GridColumnSettings.PharmacyProvisionalBillColumns;
      this.GetAllFiscalYrs();
      this.GetUnpaidTotalBills();
      //this.LoadPatientInvoiceSummary(this.patientService.getGlobal().PatientId);
      this.checkProvisionalBillsCustomization();
    }
    this.GeneralFieldLabel = coreService.GetFieldLabelParameter();

  }

  ngOnInit() {
  }
  ngAfterContentChecked(): void {
    this.changeDetectorRef.detectChanges();
  }
  onGridDateChange($event) {

    this.fromDate = $event.fromDate;
    this.toDate = $event.toDate;
    if (this.fromDate != null && this.toDate != null) {
      if (moment(this.fromDate).isBefore(this.toDate) || moment(this.fromDate).isSame(this.toDate)) {
        this.GetUnpaidTotalBills();
      } else {
        this.messageboxService.showMessage('failed', ['Please enter valid From date and To date']);
      }
    }
  }
  // SetFromGlobalPatient() {
  //   var gPatientId = this.patientService.getGlobal().PatientId;
  //   if (gPatientId) {
  //     var data = this.patientService.getGlobal();
  //     this.ShowPatientProvisionalItems(data);
  //     this.LoadPatientInvoiceSummary(gPatientId);
  //   }
  // }
  fromSubStore() {
    //used to get global patient id sent from substore patient consumption and show the provisional consumption items of respective patient
    if (this.routeFromService.RouteFrom == "/WardSupply/Pharmacy/Consumption") this.isSubStoreCall = true;
  }
  ngOnDestroy() {
    this.patientService.CreateNewGlobal();
    this.showCancelSummaryPanel = false;
    this.showActionPanel = false;
    this.allCreditItems = [];
    this.cancelledItems = [];
    this.showPatBillHistory = false;
  }

  //gets summary of all patients
  GetUnpaidTotalBills() {
    this.loading = true;
    this.PatientVisitWiseProvisionalBillsInfo = [];
    this.pharmacyBLService.GetAllCreditSummary(this.fromDate, this.toDate, this.currentActiveDispensary.StoreId)
      .finally(() => this.loading = false)
      .subscribe((res: DanpheHTTPResponse) => {
        this.ShowProvisionalDetails = false;
        this.PatientVisitWiseProvisionalBillsInfo = res.Results;
        this.ShowProvisionalGrid = true;
      });
  }
  //gets credit items of single patient.
  GetPatientProvisionalItems(patientId: number, PatientVisitId?: number) {
    this.loading = true;
    this.pharmacyBLService.GetPatientCreditItems(patientId, this.currentActiveDispensary.StoreId, PatientVisitId)
      .finally(() => this.loading = false)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          this.allCreditItems = res.Results.PatientCreditItems;
          this.SchemePriceCategory = res.Results.SchemePriceCategory;
          this.currSale.CoPaymentMode = this.SchemePriceCategory.DefaultPaymentMode;
          this.currSale.PatientVisitId = PatientVisitId;
          this.LoadPatientInvoiceSummary(patientId, this.SchemePriceCategory.SchemeId, PatientVisitId)
          this.currSaleItems = this.allCreditItems;
          this.TempcurrSaleItems = _.cloneDeep(this.allCreditItems);
          this.currSaleItems.forEach(itm => {
            itm.DiscountPer = itm.DiscountPercentage;
          });
          if (this.isPrint == true) {
            if (this.allCreditItems) {
              this.AssignAllValues();
              this.AllCalculation();
            }
            this.ProvisionalDataReceipt(res);
          }
          else {
            this.allCreditItems.forEach((item) => {
              item.DispatchQty = item.Quantity;
              item.IsSelected = true;
              this.selectAllItems = true;
            });
            this.AllCalculation();
          }
          this.ShowProvisionalGrid = false;
          this.ShowProvisionalDetails = true;
        }
      });
  }



  ShowPatientProvisionalItems(row): void {
    //patient mapping later used in receipt print
    this.currentPatient.ShortName = row.ShortName;
    this.currentPatient.FirstName = row.FirstName;
    this.currentPatient.LastName = row.LastName;
    this.currentPatient.PatientCode = row.PatientCode;
    this.currentPatient.DateOfBirth = row.DateOfBirth;
    this.currentPatient.Gender = row.Gender;
    this.currentPatient.Address = row.Address;
    this.currentPatient.CountrySubDivisionName = row.CountrySubDivisionName
    this.currentPatient.PANNumber = row.PANNumber;
    this.currentPatient.PatientId = row.PatientId;
    this.currentPatient.PhoneNumber = row.PhoneNumber;
    this.currentPatient.CreatedOn = row.LastCreditBillDate;
    this.currentPatient.CreatedOn = row.LastCreditBillDate;
    var patient = this.patientService.CreateNewGlobal();
    patient.ShortName = row.ShortName;
    patient.PatientCode = row.PatientCode;
    patient.DateOfBirth = row.DateOfBirth;
    patient.Age = row.Age;
    patient.Gender = row.Gender;
    patient.PatientId = row.PatientId;
    patient.PhoneNumber = row.PhoneNumber;
    this.currBillingContext = null;
    this.admissionDetail = null;
    this.GetPatientProvisionalItems(patient.PatientId, row.PatientVisitId);
  }

  CreditBillGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "showDetails":
        {
          let data = $event.Data;
          var patient = this.patientService.CreateNewGlobal();
          patient.ShortName = data.ShortName;
          patient.PatientCode = data.PatientCode;
          patient.DateOfBirth = data.DateOfBirth;
          patient.Age = data.Age;
          patient.Gender = data.Gender;
          patient.PatientId = data.PatientId;
          patient.PhoneNumber = data.PhoneNumber;
          patient.Address = data.Address;
          patient.WardNumber = data.WardNumber;
          patient.MunicipalityName = data.MunicipalityName;
          patient.CountrySubDivisionName = data.CountrySubDivisionName;
          patient.CountryName = data.CounterName;
          // this.ShowPatientProvisionalItems(data);
          //this.LoadPatientInvoiceSummary(this.patientService.getGlobal().PatientId);
          this._dispensaryService.SetPatientIdAndVisitIdForProvisionalView(data.PatientId, data.PatientVisitId, data.PatientCode);
          this.ShowProvisionalDetails = true;
          break;
        }
      case "view": {
        if ($event.Data != null) {
          let data = $event.Data;
          this.GetPatientProvisionalEstimationBill(data.PatientId, data.PatientVisitId, this.currentActiveDispensary.StoreId);
        }
        break;
      }
      default:
        break;
    }
  }

  BackToGrid() {
    // if (this.routeFromService.RouteFrom == null || this.routeFromService.RouteFrom != "") {
    //   this.router.navigate([this.routeFromService.RouteFrom]);
    // }
    // else {
    this.ShowProvisionalDetails = false;
    this.ShowProvisionalGrid = true;
    //reset current patient value on back button..
    this.patientService.CreateNewGlobal();
    this.showCancelSummaryPanel = false;
    this.showActionPanel = false;
    this.allCreditItems = [];
    this.cancelledItems = [];
    this.currSaleItems = [];
    this.currSale = new PHRMInvoiceModel();
    this.showPatBillHistory = false;
    this.BillMode = "FinalizeInvoice";
    this.router.navigate(['Dispensary/Sale/CreditBills']);
    // }
  }


  onBillModeChanged() {

    if (this.BillMode === "FinalizeInvoice") {
      this.currSaleItems.forEach(item => {
        item.ReturnQty = 0;
        item.IsSelected = true;
        item.Quantity = item.DispatchQty;
        if (item.FreeQuantity == undefined || item.FreeQuantity == null) {
          item.FreeQuantity = 0;
        }
        let subtotal = (item.Quantity - item.FreeQuantity) * item.SalePrice;
        item.SubTotal = CommonFunctions.parseAmount(subtotal, 4);
        item.TotalDisAmt = CommonFunctions.parseAmount(item.SubTotal * (item.DiscountPercentage) / 100, 4);
        item.VATAmount = CommonFunctions.parseAmount((((item.SubTotal - item.TotalDisAmt) * item.VATPercentage) / 100), 4);
        item.TotalAmount = CommonFunctions.parseAmount(item.SubTotal - item.TotalDisAmt + item.VATAmount, 4);
        if (this.SchemePriceCategory && this.SchemePriceCategory.IsCoPayment) {
          item.CoPaymentCashAmount = CommonFunctions.parseAmount(item.TotalAmount * item.CoPaymentCashPercent / 100, 4);
          item.CoPaymentCreditAmount = CommonFunctions.parseAmount(item.TotalAmount - item.CoPaymentCreditAmount, 4);
        }
      });
      this.AllCalculation();
      this.selectAllItems = true;
      // this.SelectAllChkOnChange();
    }
    else {
      this.currSaleItems.forEach(item => {
        item.Quantity = item.DispatchQty;
        item.IsSelected = false;
        item.ReturnQty = 0;
        item.SubTotal = 0;
        item.DiscountPercentage = item.DiscountPer;
        item.TotalDisAmt = 0;
        item.VATAmount = 0;
        item.TotalAmount = 0;
      });
      this.currSale.SubTotal = 0;
      this.currSale.DiscountAmount = 0;
      this.currSale.DiscountPer = 0;
      this.currSale.TotalAmount = 0;
      this.currSale.PaidAmount = 0;
      this.currSale.CoPaymentCashAmount = 0;
      this.currSale.CoPaymentCreditAmount = 0;
      this.selectAllItems = false;
      this.setFocusById(`ReturnQty0`)
    }
    this.CheckIfOtherProvisionalAreAvailable();
  }

  //Sets the component's check-unchecked properties on click of Component-Level Checkbox.
  SelectItemChkOnChange(index) {
    //if every item is selected one by one, then select all checkbox must be selected.
    this.selectAllItems = this.currSaleItems.every(item => item.IsSelected == true);
    if (this.currSaleItems[index].IsSelected == true && this.BillMode !== 'FinalizeInvoice') {
      this.currSaleItems[index].ReturnQty = this.currSaleItems[index].Quantity;
    }
    else {
      this.currSaleItems[index].ReturnQty = 0;
    }
    this.ItemRowValueChanged(index);
  }


  SelectAllChkOnChange(event) {
    const checked = event.target.checked;
    this.currSaleItems.forEach(item => item.IsSelected = checked);
    if (checked == true) {
      this.currSaleItems.forEach((item, index) => { item.ReturnQty = item.Quantity }
      );
    }
    else {
      this.currSaleItems.forEach(item => { item.ReturnQty = 0 })
    }

    this.currSaleItems.forEach(item => {
      item.Quantity = item.DispatchQty - item.ReturnQty;
      let subtotal = (item.ReturnQty) * item.SalePrice;
      item.SubTotal = CommonFunctions.parseAmount(subtotal, 4);
      item.TotalDisAmt = CommonFunctions.parseAmount(item.SubTotal * (item.DiscountPercentage) / 100, 4);
      item.VATAmount = CommonFunctions.parseAmount((((item.SubTotal - item.TotalDisAmt) * item.VATPercentage) / 100), 4);
      item.TotalAmount = CommonFunctions.parseAmount(item.SubTotal - item.TotalDisAmt + item.VATAmount, 4);
      //this.currSale.Tender = CommonFunctions.parseAmount(this.currSale.TotalAmount, 4);
    });
    this.AllCalculation();

  }

  CancelItems() {
    if (this.remarks && this.remarks != "") {

      var a = window.confirm("are you sure you want to cancel?")
      if (a) {
        let selectedBilItems = this.allCreditItems.filter(b => b.IsSelected);
        let txnItemsToCancel = selectedBilItems.map(bil => {
          bil.CancelRemarks = this.currSale.Remark;//we should use same remarks for both payment and cancellation.
        });

      }
      else {

      }
    }
    else {
      this.messageboxService.showMessage("error", ["Remarks is mandatory for cancellation."]);


    }
  }



  //start: Changes for Pharmacy : sud--4Sept'18
  public currSale: PHRMInvoiceModel = new PHRMInvoiceModel();
  public currSaleItems: Array<PHRMInvoiceItemsModel> = new Array<PHRMInvoiceItemsModel>();
  public currSaleItemsRetOnly: Array<PHRMInvoiceItemsModel> = new Array<PHRMInvoiceItemsModel>();

  //end: Changes for Pharmacy : sud--4Sept'18

  OnDiscountChange(index, disper, disamt) {
    if (disper == null) {
      disper = 0;
    }
    if (disamt == null) {
      disamt = 0;
    }
    this.currSaleItems[index].DiscountPercentage = disper;
    this.currSaleItems[index].TotalDisAmt = disamt;
  }
  OnQuantityChange(index) {
    this.currSaleItems[index].TotalDisAmt = 0;
    if (this.currSaleItems[index].ReturnQty > 0) {
      this.currSaleItems[index].IsSelected = true;
    }
    else {
      this.currSaleItems[index].IsSelected = false;
    }
    this.ItemRowValueChanged(index);
  }

  ItemRowValueChanged(index) {
    try {
      let item = this.currSaleItems[index];
      if (this.BillMode == 'FinalizeInvoice') {
        item.ReturnQty = 0;
        let subtotal = this.currSaleItems[index].Quantity * item.SalePrice;
        item.SubTotal = CommonFunctions.parseAmount(subtotal, 4);
      }
      else {
        //this.currSaleItems[index].Quantity = item.DispatchQty - item.ReturnQty;
        if (item.ReturnQty > 0) {
          item.IsSelected = true;
        }
        else {
          item.IsSelected = false;
          item.ReturnQty = 0;
        }
        let subtotal = item.ReturnQty * item.SalePrice;
        item.SubTotal = CommonFunctions.parseAmount(subtotal, 4);

      }

      if (this.currSaleItems[index].DiscountPercentage > 0 && this.currSaleItems[index].TotalDisAmt == 0) {
        item.TotalDisAmt = CommonFunctions.parseAmount(item.SubTotal * (item.DiscountPercentage) / 100, 4);
      }
      if (this.currSaleItems[index].DiscountPercentage == 0 && this.currSaleItems[index].TotalDisAmt > 0) {
        item.DiscountPercentage = CommonFunctions.parseAmount((item.TotalDisAmt / item.SubTotal) * 100, 4);
      }

      if (this.currSaleItems[index].DiscountPercentage == 0 && this.currSaleItems[index].TotalDisAmt == 0) {
        item.TotalDisAmt = 0;
        item.DiscountPercentage = 0;
      }
      if (this.currSaleItems[index].DiscountPercentage > 0 && this.currSaleItems[index].TotalDisAmt > 0) {
        item.TotalDisAmt = CommonFunctions.parseAmount(item.SubTotal * item.DiscountPercentage / 100, 4);
      }

      item.VATAmount = CommonFunctions.parseAmount((((item.SubTotal - item.TotalDisAmt) * item.VATPercentage) / 100), 4);
      item.TotalAmount = CommonFunctions.parseAmount(item.SubTotal - item.TotalDisAmt + item.VATAmount, 4);

      if (this.SchemePriceCategory && this.SchemePriceCategory.IsCoPayment) {
        item.CoPaymentCashAmount = CommonFunctions.parseAmount(item.TotalAmount * item.CoPaymentCashPercent / 100, 4);
        item.CoPaymentCreditAmount = CommonFunctions.parseAmount(item.TotalAmount - item.CoPaymentCashAmount, 4);
      }
      //this.currSale.Tender = CommonFunctions.parseAmount(this.currSale.TotalAmount, 4);
      this.AllCalculation();
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  AllCalculation(discPer?, discAmt?) {
    try {
      if (this.currSaleItems.length > 0) {
        this.currSale.SubTotal = 0;
        this.currSale.TotalAmount = 0;
        this.currSale.VATAmount = 0;
        this.currSale.DiscountAmount = 0;
        this.currSale.CoPaymentCashAmount = 0;
        this.currSale.CoPaymentCreditAmount = 0;
        this.currSale.DiscountAmount = 0;
        this.currSale.DiscountPer = 0;
        this.currSale.TaxableAmount = 0;



        for (var i = 0; i < this.currSaleItems.length; i++) {
          if (this.currSaleItems[i].IsSelected) {
            this.currSale.SubTotal = CommonFunctions.parseAmount(this.currSale.SubTotal + this.currSaleItems[i].SubTotal, 4);
            this.currSale.DiscountAmount = CommonFunctions.parseAmount(this.currSale.DiscountAmount + this.currSaleItems[i].TotalDisAmt, 4);
            this.currSale.DiscountPer = CommonFunctions.parseAmount((this.currSale.DiscountAmount / this.currSale.SubTotal) * 100, 4);
            this.currSale.TaxableAmount = CommonFunctions.parseAmount(this.currSale.SubTotal - this.currSale.DiscountAmount, 4);
            this.currSale.VATAmount = CommonFunctions.parseAmount(this.currSale.VATAmount + this.currSaleItems[i].VATAmount, 4);
            this.currSale.VATPercentage = CommonFunctions.parseAmount(this.currSale.VATAmount / this.currSale.TaxableAmount * 100, 4);
            this.currSale.TotalAmount = CommonFunctions.parseAmount(this.currSale.TotalAmount + this.currSaleItems[i].TotalAmount, 4);
            if (this.SchemePriceCategory && this.SchemePriceCategory.IsCoPayment) {
              this.currSale.CoPaymentCashAmount = CommonFunctions.parseAmount(this.currSale.CoPaymentCashAmount + this.currSaleItems[i].CoPaymentCashAmount, 4);
              this.currSale.CoPaymentCreditAmount = CommonFunctions.parseAmount(this.currSale.CoPaymentCreditAmount + this.currSaleItems[i].CoPaymentCreditAmount, 4);
            }
          }
        }

        //for bulk discount calculation and conversion of percentage into amount and vice versa
        if (discPer == 0 && discAmt > 0) {
          this.currSale.TotalAmount = this.currSale.SubTotal - discAmt;
          this.currSale.DiscountAmount = discAmt;
          discPer = (discAmt / this.currSale.SubTotal) * 100;
          this.currSale.DiscountPer = CommonFunctions.parseAmount(discPer, 4);
        }
        if (discPer > 0 && discAmt == 0) {
          discAmt = CommonFunctions.parseAmount(this.currSale.SubTotal * (discPer) / 100, 4)
          this.currSale.TotalAmount = this.currSale.SubTotal - discAmt;
          this.currSale.DiscountAmount = discAmt;
          this.currSale.DiscountPer = discPer;
        }
        if (discPer == 0 && discAmt == 0) {
          this.currSale.SubTotal = this.currSale.SubTotal;
          this.currSale.TotalAmount = this.currSale.TotalAmount;
          this.currSale.DiscountAmount = discAmt;
          this.currSale.DiscountPer = discPer;
        }
        if (discPer >= 0 && discAmt >= 0) {
          this.currSaleItems.forEach(a => {
            a.DiscountPercentage = this.currSale.DiscountPer;
            a.TotalDisAmt = 0;
            a.VATAmount = 0;
            this.updateCalculationsForSalesItemOnDiscountPercentageChange(a);
          });
        }
        //this.currSale.DiscountAmount = CommonFunctions.parseAmount(this.currSale.SubTotal * (this.currSale.DiscountPer) / 100);
        this.currSale.TotalAmount = CommonFunctions.parseAmount(this.currSale.SubTotal - this.currSale.DiscountAmount + this.currSale.VATAmount, 4);

        this.currSale.SubTotal = CommonFunctions.parseAmount(this.currSale.SubTotal, 4);
        this.currSale.DiscountAmount = CommonFunctions.parseAmount(this.currSale.DiscountAmount, 4);
        this.currSale.DiscountPer = CommonFunctions.parseAmount(this.currSale.DiscountPer, 4);
        this.currSale.VATAmount = CommonFunctions.parseAmount(this.currSale.VATAmount, 4);
        this.currSale.TotalAmount = CommonFunctions.parseAmount(this.currSale.TotalAmount, 4);

        this.currSale.CoPaymentCashAmount = CommonFunctions.parseAmount(this.currSale.CoPaymentCashAmount, 4);
        this.currSale.CoPaymentCreditAmount = CommonFunctions.parseAmount(this.currSale.CoPaymentCreditAmount, 4);

        if (this.SchemePriceCategory.IsCoPayment) {
          if (this.currSale.CoPaymentMode === ENUM_BillPaymentMode.credit) {
            this.currSale.ReceivedAmount = this.currSale.CoPaymentCashAmount;
            this.currSale.CreditAmount = this.currSale.CoPaymentCreditAmount;
          }
        }
        else {
          if (this.currSale.PaymentMode === ENUM_BillPaymentMode.credit) {
            this.currSale.CreditAmount = this.currSale.TotalAmount;
            this.currSale.ReceivedAmount = 0;
            this.currSale.PaidAmount = 0;
          }
          else {
            this.currSale.ReceivedAmount = this.currSale.TotalAmount;
            this.currSale.CreditAmount = 0;
            this.currSale.PaidAmount = CommonFunctions.parseAmount(this.currSale.ReceivedAmount, 4);
          }
        }

        this.currSale.Tender = CommonFunctions.parseAmount(this.currSale.PaidAmount, 4);
        this.currSale.Change = CommonFunctions.parseAmount(this.currSale.Tender - this.currSale.ReceivedAmount, 4);

        this.ChangeTenderAmount();
        // if (this.checkDeductfromDeposit) {
        //   this.CalculateDepositBalance();
        // }
      }
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }

  }

  ChangeTenderAmount() {
    this.currSale.Change = CommonFunctions.parseAmount(this.currSale.Tender - this.currSale.PaidAmount, 4);
  }

  OnMainDiscountPercentChange() {
    //Recalculate DIscount for each item level.
    this.currSaleItems.forEach(itm => {
      itm.DiscountPercentage = this.currSale.DiscountPer;
      itm.TotalDisAmt = CommonFunctions.parseAmount((itm.SubTotal * itm.DiscountPercentage) / 100, 4);
      itm.TotalAmount = itm.SubTotal - itm.TotalDisAmt + itm.VATAmount;
    })
    //Then call AllCalculation once again.
    this.AllCalculation(this.currSale.DiscountPer, 0)
  }
  OnMainDiscountAmountChange() {
    if (this.currSale.DiscountAmount > 0) {
      this.currSale.DiscountPer = CommonFunctions.parseAmount((this.currSale.DiscountAmount / this.currSale.SubTotal) * 100, 4);
      this.currSaleItems.forEach(itm => {
        itm.DiscountPercentage = this.currSale.DiscountPer;
        itm.TotalDisAmt = itm.SubTotal * itm.DiscountPercentage;
        itm.TotalAmount = itm.SubTotal - itm.TotalDisAmt + itm.VATAmount;
      });
      this.AllCalculation(this.currSale.DiscountPer, 0)

    }
    else {
      this.currSale.DiscountAmount = 0;
      this.currSale.DiscountPer = 0;
      this.AllCalculation(this.currSale.DiscountPer, this.currSale.DiscountAmount)
    }

  }

  updateCalculationsForSalesItemOnDiscountPercentageChange(currSaleItems: PHRMInvoiceItemsModel) {
    let itemQty = currSaleItems.Quantity;
    let itemMRP = currSaleItems.SalePrice;
    let subtotal = currSaleItems.SubTotal ? currSaleItems.SubTotal : 0;
    let disPer = currSaleItems.DiscountPercentage ? currSaleItems.DiscountPercentage : 0;
    let disAmt = currSaleItems.TotalDisAmt ? currSaleItems.TotalDisAmt : 0;
    let vatPer = currSaleItems.VATPercentage ? currSaleItems.VATPercentage : 0;
    let vatAmt = currSaleItems.VATAmount ? currSaleItems.VATAmount : 0;
    let coPayCashAmt = currSaleItems.CoPaymentCashAmount ? currSaleItems.CoPaymentCashAmount : 0;
    let coPayCreditAmt = currSaleItems.CoPaymentCreditAmount ? currSaleItems.CoPaymentCreditAmount : 0;

    subtotal = itemQty * itemMRP;
    if (disPer > 0) {
      disAmt = (subtotal * disPer) / 100;
    }
    let taxAbleAmt = subtotal - disAmt;
    if (vatPer > 0) {
      vatAmt = (taxAbleAmt * vatPer) / 100;
    }
    let totalAmount = subtotal - disAmt + vatAmt;

    currSaleItems.SubTotal = subtotal;
    currSaleItems.DiscountPercentage = disPer;
    currSaleItems.TotalDisAmt = CommonFunctions.parseAmount(disAmt, 4);
    currSaleItems.VATPercentage = CommonFunctions.parseAmount(vatPer, 4);
    currSaleItems.VATAmount = CommonFunctions.parseAmount(vatAmt, 4);
    currSaleItems.TotalAmount = CommonFunctions.parseAmount(totalAmount, 4);
    currSaleItems.CoPaymentCashAmount = CommonFunctions.parseAmount(coPayCashAmt, 4);
    currSaleItems.CoPaymentCreditAmount = CommonFunctions.parseAmount(coPayCreditAmt, 4);
  }

  //This function only for show catch messages
  ShowCatchErrMessage(exception) {
    if (exception) {
      let ex: Error = exception;
      this.routeFromService.RouteFrom = null;
      this.messageboxService.showMessage("error", ["Check error in Console log !"]);
      console.log("Error Messsage =>  " + ex.message);
      console.log("Stack Details =>   " + ex.stack);
    }
  }

  ProvisionalDataReceipt(res) {
    try {
      if (res.Status == "OK") {

        this.loading = true;
        this.currSale.InvoiceItems = this.currSaleItems;
        let invoicedetails = this.currSale;
        let txnReceipt = PharmacyReceiptModel.GetReceiptForTransaction(this.currSale);

        txnReceipt.ReceiptDate = moment().format("YYYY-MM-DD HH:mm");
        txnReceipt.IsValid = true;
        txnReceipt.ReceiptType = "Credit Receipt";
        txnReceipt.BillingUser = this.userName;
        txnReceipt.Patient = this.currentPatient;
        txnReceipt.StoreId = this.currentActiveDispensary.StoreId;
        this.pharmacyService.globalPharmacyReceipt = txnReceipt;
        this.router.navigate(['/Dispensary/Sale/ReceiptPrint']);
        this.currSale = new PHRMInvoiceModel();
        this.currSaleItems = new Array<PHRMInvoiceItemsModel>();
        //this.messageboxService.showMessage("success", ["Succesfully. "]);
        this.loading = false;
      }
      else {
        this.messageboxService.showMessage("failed", [res.ErrorMessage]);
        this.loading = false;
      }
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }

  }
  PrintReceipt(): void {
    try {
      //this.currSale.OrganizationId = this.SchemePriceCategory.DefaultCreditOrganizationId;

      this.newCurrSaleItems = this.currSaleItems.filter(a => a.IsSelected == true);
      if (this.newCurrSaleItems.some(a => a.DiscountPercentage < 0 || a.DiscountPercentage > 100)) {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, ['Discount % must between [0-100%]']);
        return;
      }
      if (this.newCurrSaleItems.some(a => a.TotalDisAmt < 0)) {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, ['Discount Amount% should not be negative.']);
        return;
      }

      if (this.currSale.PaymentMode !== ENUM_BillPaymentMode.credit) {
        this.currSale.PaymentMode = ENUM_BillPaymentMode.cash
      }
      else {
        this.currSale.PaymentMode = ENUM_BillPaymentMode.credit;
      }

      if (this.currSale.PaymentMode === ENUM_BillPaymentMode.credit && this.currSale.OrganizationId == null) {
        return this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, ['Credit Organization is mandatory.']);
      }

      this.currSale.PatientId = this.currentPatient.PatientId;
      this.currSale.CounterId = this.currentCounter;
      this.currSale.InvoiceItems = this.currSaleItems;
      this.currSale.PrescriberId = this.currSaleItems[0].PrescriberId;
      this.currSale.VisitType = this.currSaleItems[0].VisitType;
      this.currSale.DepositDeductAmount = this.depositDeductAmount;
      this.currSale.DepositBalance = this.newdepositBalance;
      this.currSale.DepositAmount = this.depositDeductAmount;
      this.currSale.StoreId = this.currentActiveDispensary.StoreId;
      this.currSale.SchemeId = this.SchemePriceCategory.SchemeId;
      this.currSale.IsCoPayment = this.SchemePriceCategory.IsCoPayment;
      this.currSale.PaymentMode = this.currSale.IsCoPayment ? this.currSale.CoPaymentMode : this.currSale.PaymentMode;
      if (this.IsReturnDepositChecked) {
        if (this.currSale.PaymentMode.toLowerCase() === "cash" && this.DepositRefundAmount == 0) {
          this.DepositRefundAmount = this.patSummary.DepositBalance;
        }
        if (this.DepositRefundAmount > 0) {
          this.currSale.DepositReturnAmount = this.DepositRefundAmount;
        }
      }
      this.loading = true;
      this.currSale.InvoiceItems = this.newCurrSaleItems;

      this.HandlePaymentTransaction();

    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }

  }

  /**This method is responsible to check whether FewaPay is applicable or not if not proceed with normal workflow else wait for the message sent by FewaPay Browser extension and decide after message is received*/
  private HandlePaymentTransaction() {
    if (this._fewaPayService.IsFewaPayApplicable(this.currSale.PaymentDetails)) {
      this.loadingScreen = true;
      const transactionReqString = this._fewaPayService.CreateFewaPayTransactionRequest(this.currSale.PaymentDetails, this.currSale.TotalAmount, this.currSale.Remark);

      if (transactionReqString) {
        window.postMessage({
          type: ENUM_FewaPayMessageTypes.PaymentInfoRequest,
          data: transactionReqString,
        }, "*");
        console.log('Transaction Request is posted from Danphe.');
      } else {
        this.loadingScreen = false;
        this.loading = false;
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, [`Transaction Request cannot be created due to missing mandatory data like paymentDetails, totalAmount and remarks`]);
      }

    } else {
      this.ClearProvisionalItems();
    }
  }


  private ClearProvisionalItems() {
    this.pharmacyBLService.AddInvoiceForCreditItems(this.currSale)
      .finally(() => {
        this.loading = false;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.InvoiceId = res.Results;
          this.showSaleInvoice = true;
          this.GetUnpaidTotalBills();
          this.BillMode = 'FinalizeInvoice';
          this.ClearPaymentDetail = true;
          this.currSale = new PHRMInvoiceModel();
        }
        else {
          this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to save invoice. <br>' + res.ErrorMessage]);
        }
      },
        err => {
          this.loading = false;
          this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to save invoice. <br>' + err.ErrorMessage]);
        });
  }

  update(): void {
    try {
      let check: boolean = true;
      if (check) {
        this.newCurrSaleItems = this.currSaleItems.filter(a => a.ReturnQty > 0);
        if (this.newCurrSaleItems.some(a => a.ReturnQty < 0)) {
          this.messageboxService.showMessage("failed", ['Quantity should not be negative.']);
          return;
        }
        if (this.newCurrSaleItems.some(a => a.DispatchQty < a.ReturnQty)) {
          this.messageboxService.showMessage("failed", ['ReturnQty should be less than or equals to DispatchQty.']);
          return;
        }
        if (this.newCurrSaleItems.some(a => a.DiscountPercentage < 0 || a.DiscountPercentage > 100)) {
          this.messageboxService.showMessage("failed", ['Discount % must between [0-100%]']);
          return;
        }
        if (this.newCurrSaleItems.some(a => a.TotalDisAmt < 0)) {
          this.messageboxService.showMessage("failed", ['Discount Amount% should not be negative.']);
          return;
        }

        let isInvalid: boolean = this.currSaleItems.some(item => !Number.isInteger(item.ReturnQty))
        if (isInvalid) {
          this.messageboxService.showMessage("error", ['Please verify ReturnQty should not be in decimal.']);
          return;
        }

        this.newCurrSaleItems.forEach(a => a.StoreId == this.currentActiveDispensary.StoreId);
        if (this.newCurrSaleItems.length <= 0 || this.newCurrSaleItems == undefined) {
          this.messageboxService.showMessage('notification', ['Return Quantity should be greater than ZERO.']);
          return;
        }
        this.loading = true;
        this.pharmacyBLService.updateInvoiceForCreditItems(this.newCurrSaleItems).finally(() => {
          this.loading = false;
        }).subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results) {
              this.ReturnReceiptNo = res.Results.ReturnReceiptNo;
              this.FiscalYearId = res.Results.FiscalYearId;
              this.GetUnpaidTotalBills();
              this.ShowProvisionalDetails = false;
              this.ShowProvisionalGrid = true;
              this.ShowProvisionalReturnReceipt = true;
              this.BillMode = 'FinalizeInvoice';
              this.messageboxService.showMessage(ENUM_MessageBox_Status.Success, ['Provisional Returned Successfully.']);
            }
            else {
              this.messageboxService.showMessage("error", ['Unable to show receipt.']);
            }

          }
          else if (res.Status == "Failed") {
            this.messageboxService.showMessage("error", ['Failed to update provisional bill. <br>' + res.ErrorMessage]);
          }
        },
          err => {
            this.messageboxService.showMessage("error", [err.ErrorMessage]);
          });

      }
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
      this.loading = false;
    }

  }


  //This method make all invoice property value initialization
  AssignAllValues() {
    try {
      //Initialize  invoice details for Post to db
      this.currSale.BilStatus = (this.currSale.TotalAmount == this.currSale.PaidAmount) ? "paid" : (this.currSale.PaidAmount > 0) ? "partial" : "unpaid";
      this.currSale.CreditAmount = CommonFunctions.parseAmount(this.currSale.TotalAmount - this.currSale.PaidAmount, 4);

      //Initialize Invoice Items  details for post to database
      //Initialize Invoice IteCheckValidaitonms  details for post to database
      for (var i = 0; i < this.currSaleItems.length; i++) {
        //lots of workaround here--need to revise and update properly--sud:8Feb18
        //assign value from searchTbx selected item only if searchTbx is enabled, else we already have other values assigned to the model.
        this.currSaleItems[i].ItemId = this.currSaleItems[i].ItemId;
        this.currSaleItems[i].ItemName = this.currSaleItems[i].ItemName;
      }


    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }

  // for cancel the credit bill.
  Cancel() {
    if (confirm("All the Items will be Cancelled and Cannot be Revert Back !!! Are You Sure to Cancel these Provisional items?")) {
      try {
        this.loading = true;
        this.pharmacyBLService.CancelCreditBill(this.allCreditItems)
          .finally(() => this.loading = false)
          .subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results != null) {
              this.ReturnReceiptNo = res.Results.ReturnReceiptNo;
              this.FiscalYearId = res.Results.FiscalYearId;
              this.ShowProvisionalReturnReceipt = true;
              this.GetUnpaidTotalBills();
              this.ShowProvisionalDetails = false;
              this.ShowProvisionalGrid = true;
              this.BillMode = 'FinalizeInvoice';
              this.messageboxService.showMessage(ENUM_MessageBox_Status.Success, ['Provisional Cancelled Successfully.']);
            }
            else {
              this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to cancel provisional. <br>' + res.ErrorMessage]);
            }
          },
            err => {
              this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to cancel provisional.<br>' + err]);
            });
      }
      catch (exception) {
        this.ShowCatchErrMessage(exception);
      }
    }
  }
  Close() {
    this.showSaleItemsPopup = false;
    this.currSaleItemsRetOnly = new Array<PHRMInvoiceItemsModel>();
    this.currSale = new PHRMInvoiceModel();
    this.currSaleItems = new Array<PHRMInvoiceItemsModel>();
    this.GetUnpaidTotalBills();
    this.total = 0;
    this.ShowProvisionalDetails = false;
    this.ShowProvisionalGrid = true;
    this.showActionPanel = false;
    this.BillMode = 'FinalizeInvoice';
  }
  print() {
    let popupWinindow;
    var printContents = document.getElementById("printpage").innerHTML;
    popupWinindow = window.open('', '_blank', 'width=1600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
    popupWinindow.document.open();
    //popupWinindow.document.write('<html><head><link href="../assets/global/plugins/bootstrap/css/bootstrap.min.css" rel="stylesheet" type="text/css" /><link rel="stylesheet" type="text/css" href="../../themes/theme-default/DanpheStyle.css" /></head><body onload="window.print()">' + printContents + '</body></html>');
    popupWinindow.document.write('<html><head><link rel="stylesheet" type="text/css" href="../../themes/theme-default/DanpheStyle.css" /></head><body onload="window.print()">' + printContents + '</body></html>');

    popupWinindow.document.close();
    this.showSaleItemsPopup = false;
    this.GetUnpaidTotalBills();
    this.ShowProvisionalDetails = false;
    this.ShowProvisionalGrid = true;
    this.showActionPanel = false;
  }

  LoadPatientInvoiceSummary(patientId: number, SchemeId?: number, PatientVisitId?: number) {
    if (patientId > 0) {
      this.pharmacyBLService.GetPatientSummary(patientId, SchemeId, PatientVisitId)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.patSummary = res.Results;
            this.patSummary.CreditAmount = CommonFunctions.parseAmount(this.patSummary.CreditAmount);
            this.patSummary.ProvisionalAmt = CommonFunctions.parseAmount(this.patSummary.ProvisionalAmt);
            this.patSummary.BalanceAmount = CommonFunctions.parseAmount(this.patSummary.BalanceAmount);
            this.patSummary.DepositBalance = CommonFunctions.parseAmount(this.patSummary.DepositBalance);
            this.patSummary.TotalDue = CommonFunctions.parseAmount(this.patSummary.TotalDue);
            this.patSummary.IpCreditLimit = CommonFunctions.parseAmount(this.patSummary.IpCreditLimit);
            this.patSummary.OpCreditLimit = CommonFunctions.parseAmount(this.patSummary.OpCreditLimit);
            this.patSummary.IsLoaded = true;
            this.CheckIfOtherProvisionalAreAvailable();
          }
          else {
            this.messageboxService.showMessage("Select Patient", [res.ErrorMessage]);
            this.loading = false;
          }
        });
    }
  }
  //Change the Checkbox value and call Calculation logic from here.
  DepositDeductCheckBoxChanged() {
    this.checkDeductfromDeposit = true;
    this.CalculateDepositBalance();
  }
  public newdepositBalance: number = 0;
  public depositDeductAmount: number = 0;

  GetAllFiscalYrs() {
    this.pharmacyBLService.GetAllFiscalYears()
      .subscribe(res => {
        if (res.Status == "OK") {
          this.allFiscalYrs = res.Results;
        }
      });
  }

  //show or hide  item level discount
  checkProvisionalBillsCustomization() {
    let provisionalParameterString = this.coreService.Parameters.find(p => p.ParameterName == "SalesFormCustomization" && p.ParameterGroupName == "Pharmacy");
    if (provisionalParameterString != null) {
      let provisionalParameter = JSON.parse(provisionalParameterString.ParameterValue);
      this.isItemLevelVATApplicable = (provisionalParameter.EnableItemLevelVAT == true);
      this.isMainVATApplicable = (provisionalParameter.EnableMainVAT == true);
    }
  }

  CalculateDepositBalance() {
    if (this.deductDeposit) {
      if (this.patSummary.DepositBalance > 0) {
        this.newdepositBalance = this.patSummary.DepositBalance - this.currSale.PaidAmount;
        this.newdepositBalance = CommonFunctions.parseAmount(this.newdepositBalance, 4);
        if (this.newdepositBalance >= 0) {
          this.depositDeductAmount = this.currSale.PaidAmount;
          this.currSale.Tender = this.currSale.PaidAmount;
          this.currSale.Change = 0;
          this.DepositRefundAmount = this.patSummary.DepositBalance - this.currSale.TotalAmount;
        }
        else {
          this.currSale.Tender = -(this.newdepositBalance);//Tender is set to positive value of newDepositBalance.
          this.depositDeductAmount = this.patSummary.DepositBalance;//all deposit has been returned.
          this.newdepositBalance = 0;//reset newDepositBalance since it's all Used NOW.
          this.currSale.Change = 0;//Reset Change since we've reset Tender above.
        }
      }
      else {
        this.messageboxService.showMessage("Failed", ["Deposit balance is zero, Please add deposit to use this feature."]);
        this.deductDeposit = !this.deductDeposit;
      }
    }
    else {
      //reset all required properties..
      this.currSale.Tender = this.currSale.ReceivedAmount;
      this.newdepositBalance = this.patSummary.DepositBalance;
      this.depositDeductAmount = 0;
      this.currSale.Change = 0;
    }
  }
  setFocusById(id: string, waitingTimeInms = 0) {
    var Timer = setTimeout(() => {
      if (document.getElementById(id)) {
        let nextEl = <HTMLInputElement>document.getElementById(id);
        nextEl.focus();
        nextEl.select();
        clearTimeout(Timer);
      }
    }, waitingTimeInms);
  }
  FindNextFocusElementByIndex(index) {
    let indx = index + 1;
    if (this.allCreditItems.length <= indx) {
      window.setTimeout(function () {
        document.getElementById('btnUpdate').focus();
      }, 0);
    }
    else {
      window.setTimeout(function () {
        document.getElementById('ReturnQty' + indx).focus();
      }, 0);
    }
  }
  PaymentModeChanges($event: any) {

    this.currSale.PaymentMode = $event.PaymentMode.toLowerCase();
    this.currSale.PaymentDetails = $event.PaymentDetails;
    this.currSale.IsRemarksMandatory = $event.IsRemarksMandatory;
    this.OnPaymentModeChange();
    if (this.currSale.PaymentMode.toLowerCase() == "credit") {
      this.ShowDepositReturnCheckbox = false;
    }
    else {
      if (this.currSale.PaymentMode.toLowerCase() == "cash") {
        this.depositDeductAmount = 0;
        this.DepositRefundAmount = 0;
      }

      this.ShowDepositReturnCheckbox = true;
    }

  }
  OnPaymentModeChange() {
    if (this.currSale.PaymentMode.toLowerCase() == "credit") {
      this.currSale.PaidAmount = 0;
      this.currSale.CreditAmount = this.currSale.TotalAmount;
      this.currSale.ReceivedAmount = 0;
      this.currSale.BilStatus = "unpaid";
      this.currSale.CreateOn = moment().format("YYYY-MM-DD HH:mm:ss");
      this.currSale.CounterId = this.securityService.getLoggedInCounter().CounterId;
      this.currSale.Tender = 0;
      this.currSale.Change = 0;
      if (this.currSale.InvoiceItems) {
        this.currSale.InvoiceItems.forEach(txnItm => {
          txnItm.BilItemStatus = ENUM_BillingStatus.unpaid;
          txnItm.CreatedOn = moment().format("YYYY-MM-DD HH:mm:ss");
        });
      }
      this.deductDeposit = false;
      this.DepositDeductCheckBoxChanged();
    }
    else {
      if (!this.SchemePriceCategory.IsCoPayment) {
        this.currSale.OrganizationId = null;
        this.currSale.CreditOrganizationName = null;
      }
      this.currSale.PaidAmount = this.currSale.Tender - this.currSale.Change;
      this.currSale.BilStatus = "paid";
      this.currSale.CreateOn = moment().format("YYYY-MM-DD HH:mm:ss");//default paiddate.
      this.currSale.CounterId = this.securityService.getLoggedInCounter().CounterId;//sud:29May'18
      if (this.TempEmployeeCashTransaction && !this.TempEmployeeCashTransaction.length && !this.deductDeposit) {
        let obj = this.MstPaymentModes.find(a => a.PaymentSubCategoryName.toLowerCase() == this.currSale.PaymentMode.toLocaleLowerCase());
        let empCashTxnObj = new PHRMEmployeeCashTransaction();
        empCashTxnObj.InAmount = this.currSale.TotalAmount;
        empCashTxnObj.OutAmount = 0;
        empCashTxnObj.PaymentModeSubCategoryId = obj.PaymentSubcategoryId;
        empCashTxnObj.ModuleName = "Pharmacy";
        this.TempEmployeeCashTransaction.push(empCashTxnObj);
      }
      if (this.TempEmployeeCashTransaction && !this.TempEmployeeCashTransaction.length && this.deductDeposit) {
        let obj = this.MstPaymentModes.find(a => a.PaymentSubCategoryName.toLowerCase() == this.currSale.PaymentMode.toLocaleLowerCase());
        let empCashTxnObj = new PHRMEmployeeCashTransaction();
        empCashTxnObj.InAmount = this.currSale.DepositUsed;
        empCashTxnObj.OutAmount = 0;
        empCashTxnObj.PaymentModeSubCategoryId = obj.PaymentSubcategoryId;
        empCashTxnObj.ModuleName = "Pharmacy";
        this.TempEmployeeCashTransaction.push(empCashTxnObj);

        if ((this.currSale.TotalAmount - this.currSale.DepositUsed) > 0) {
          let empCashTxnObj = new PHRMEmployeeCashTransaction();
          let obj = this.MstPaymentModes[0];
          empCashTxnObj.InAmount = this.currSale.TotalAmount - this.currSale.DepositUsed;
          empCashTxnObj.OutAmount = 0;
          empCashTxnObj.PaymentModeSubCategoryId = obj.PaymentSubcategoryId;
          empCashTxnObj.ModuleName = "Pharmacy";
          this.TempEmployeeCashTransaction.push(empCashTxnObj);
        }
      }
      if (this.currSale.InvoiceItems) {
        this.currSale.InvoiceItems.forEach(txnItm => {
          txnItm.BilItemStatus = ENUM_BillingStatus.paid;
          txnItm.CreatedOn = moment().format("YYYY-MM-DD HH:mm:ss");
        });
      }
      this.currSale.PHRMEmployeeCashTransactions = this.TempEmployeeCashTransaction;
    }
  }
  CreditOrganizationChanges($event: any) {
    this.currSale.OrganizationId = $event.OrganizationId;
    this.currSale.CreditOrganizationName = $event.OrganizationName;
  }
  public TempEmployeeCashTransaction: Array<PHRMEmployeeCashTransaction> = new Array<PHRMEmployeeCashTransaction>();

  MultiplePaymentCallBack($event: any) {
    if ($event && $event.MultiPaymentDetail.length) {
      this.TempEmployeeCashTransaction = new Array<PHRMEmployeeCashTransaction>();
      if ((this.phrmEmpCashTxn != null || this.phrmEmpCashTxn != undefined) && this.phrmEmpCashTxn.PaymentModeSubCategoryId > 0) {
        this.TempEmployeeCashTransaction = $event.MultiPaymentDetail;
        this.TempEmployeeCashTransaction.push(this.phrmEmpCashTxn);
      } else {
        this.TempEmployeeCashTransaction = $event.MultiPaymentDetail;
      }
      var isDepositUsed = this.TempEmployeeCashTransaction.find(a => a.PaymentSubCategoryName.toLocaleLowerCase() === 'deposit');
      if (isDepositUsed) {
        this.deductDeposit = true;
        this.CalculateDepositBalance();
      }
      else {
        this.DepositRefundAmount = 0;
      }
      // else {
      //   this.deductDeposit = false;
      //   this.CalculateDepositBalance();
      // }
    }
    this.currSale.PaymentDetails = $event.PaymentDetail;
    this.currSale.PHRMEmployeeCashTransactions = $event.MultiPaymentDetail;
  }

  OnPopUpClose() {
    this.ShowProvisionalReturnReceipt = false;
    this.ShowEstimationBillInvoice = false;
  }
  OnInvoicePopUpClose() {
    this.showSaleInvoice = false;
    this.ClearPaymentDetail = false;
    this.IsReturnDepositChecked = false;
  }
  handleCancel() {
    this.loading = false;
  }
  public hotkeys(event) {
    if (this.loading) {
      return;
    }
    if (event.keyCode === 27) {
      //For ESC key => close the pop up
      this.OnInvoicePopUpClose();
      this.OnPopUpClose();
    }
  }

  CheckIfOtherProvisionalAreAvailable() {
    this.IsOtherProvisionalRemaining = false;
    const provisionalBills = this.PatientVisitWiseProvisionalBillsInfo.filter(b => b.PatientCode === this.currentPatient.PatientCode);
    if (provisionalBills && provisionalBills.length > 1 && this.BillMode === 'FinalizeInvoice') {
      this.IsOtherProvisionalRemaining = true;
    }
    else {
      this.IsOtherProvisionalRemaining = false;

    }
  }

  OnQuickFilterChanged($event) {
    if ($event && $event.target.value) {
      let filterValue = $event.target.value.trim().toLowerCase();

      this.currSaleItems.filter(item => {
        if (item.ItemName.trim().toLowerCase().startsWith(filterValue)) {
          item.HideRow = false;
        }
        else {
          item.HideRow = true;
        }
      });
    }
    else {
      this.currSaleItems.forEach(item => {
        item.HideRow = false;
      });
    }
  }

  ProvisionalEstimationBillInvoice: PharmacyProvisionalEstimationBillReceipt_DTO = new PharmacyProvisionalEstimationBillReceipt_DTO();

  GetPatientProvisionalEstimationBill(PatientId: number, PatientVisitId: number, DispensaryId: number) {
    this.pharmacyBLService.GetPatientProvisionalEstimationBill(PatientId, DispensaryId, PatientVisitId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ProvisionalEstimationBillInvoice.PatientInfo = res.Results.PatientInfo;
          this.ProvisionalEstimationBillInvoice.ProvisionalEstimationBillInvoiceItems = res.Results.ProvisionalEstimationBillInvoiceItems;
          const provisionalEstimationBillItems = this.ProvisionalEstimationBillInvoice.ProvisionalEstimationBillInvoiceItems;
          let subTotal: number = 0;
          let discountAmount: number = 0;
          let discountPercentage: number = 0;
          let vatAmount: number = 0;
          let vatPercentage: number = 0;
          let coPayCashAmount: number = 0;
          let coPayCreditAmount: number = 0;
          let totalAmount: number = 0;

          subTotal = provisionalEstimationBillItems.reduce((a, b) => a + b.SubTotal, 0);
          discountAmount = provisionalEstimationBillItems.reduce((a, b) => a + b.DiscountAmount, 0);
          discountPercentage = CommonFunctions.parseAmount((discountAmount / subTotal) * 100, 4);
          vatAmount = provisionalEstimationBillItems.reduce((a, b) => a + b.VATAmount, 0);
          vatPercentage = CommonFunctions.parseAmount((vatAmount / (subTotal - discountAmount)) * 100, 4);
          coPayCashAmount = provisionalEstimationBillItems.reduce((a, b) => a + b.CoPayCashAmount, 0);
          coPayCashAmount = provisionalEstimationBillItems.reduce((a, b) => a + b.CoPayCashAmount, 0);
          coPayCreditAmount = provisionalEstimationBillItems.reduce((a, b) => a + b.CoPayCreditAmount, 0);
          totalAmount = provisionalEstimationBillItems.reduce((a, b) => a + b.TotalAmount, 0);
          this.ProvisionalEstimationBillInvoice.SubTotal = subTotal;
          this.ProvisionalEstimationBillInvoice.DiscountAmount = discountAmount;
          this.ProvisionalEstimationBillInvoice.VATAmount = vatAmount;
          this.ProvisionalEstimationBillInvoice.CoPaymentCashAmount = coPayCashAmount;
          this.ProvisionalEstimationBillInvoice.CoPaymentCreditAmount = coPayCreditAmount;
          this.ProvisionalEstimationBillInvoice.TotalAmount = CommonFunctions.parseAmount(totalAmount, 4);
          this.ShowEstimationBillInvoice = true;
        }
      })
  }

  public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
    return this.pharmacyBLService.GetPatients(keyword, false);
  }

  OnPatientSelect() {
    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      this.patientId = this.SelectedPatient.PatientId;
    }
    else {
      this.patientId = null;
    }
    if (this.SelectedPatient && !this.SelectedPatient.PatientId) {
      this.SelectedPatient = null;
      this.messageboxService.showMessage(ENUM_MessageBox_Status.Notice, ['Please select a Patient from dropdown']);
    }
  }

  LoadProvisionalInformation() {
    this.PatientVisitWiseProvisionalBillsInfo = [];
    if (this.patientId) {
      this.pharmacyBLService.GetPatientsProvisionalInfoByPatientId(this.currentActiveDispensary.StoreId, this.patientId)
        .subscribe((res: DanpheHTTPResponse) => {
          this.PatientVisitWiseProvisionalBillsInfo = res.Results;
        });
    }
    else {
      this.GetUnpaidTotalBills();
    }
  }

  PatientListFormatterByPatientCode(data: any): string {
    let html = `[${data['PatientCode']}] | ${data["ShortName"]}`;
    return html;
  }

  PatientListFormatterByPatientName(data: any): string {
    let html = `[${data['PatientCode']}] | ${data["ShortName"]}`;
    return html;
  }

  PatientListFormatterByPhoneNumber(data: any): string {
    let html = `[PH No. ${data["PhoneNumber"]}] | ${data["ShortName"]} | `;
    return html;
  }


  /**Below HostListener is responsible to catch the responses from FewaPay Browser Extension */
  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent): void {
    const result = this._fewaPayService.HandleEventsFromFewaPayBrowserExtension(event);
    if (result) {
      if (result.resultCode === ENUM_POS_ResponseStatus.Success) { //! Krishna, 10thDec'23 "000" is success status code sent from POS device.
        // console.log(result);
        const transactionId = 'verifyTransId' in result && result.verifyTransId;
        if (transactionId) {
          this.currSale.PaymentDetails = `${this.currSale.PaymentDetails}; TransactionId: ${transactionId}`;
        }
        this._fewaPayService.SaveFewaPayTransactionLogs(result, this.currSale.PatientId, ENUM_FewaPayTransactionFrom.DispensaryProvisionalClearance);
        this.ClearProvisionalItems();
      } else {
        this._fewaPayService.SaveFewaPayTransactionLogs(result, this.currSale.PatientId, ENUM_FewaPayTransactionFrom.DispensaryProvisionalClearance);
        this.loading = false;
        this.loadingScreen = false;
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, [`${result.message}`]);
      }
      return;
    }
  }
  CheckReturnDepositCheckbox($event) {
    if ($event && this.IsReturnDepositChecked && this.patSummary.CreditAmount > 0) {
      this.IsPendingSettlements = true;
    }
  }

  CloseProvisionalBillActionPage() {
    this.ShowProvisionalDetails = false;
    this.LoadProvisionalInformation();
  }

}

