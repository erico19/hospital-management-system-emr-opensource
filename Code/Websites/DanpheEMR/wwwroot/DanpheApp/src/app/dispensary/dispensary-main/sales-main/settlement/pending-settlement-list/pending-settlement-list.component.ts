import { ChangeDetectorRef, Component, HostListener } from "@angular/core";
import { Router } from "@angular/router";
import * as moment from "moment";
import { BillingService } from "../../../../../billing/shared/billing.service";
import { CoreService } from "../../../../../core/shared/core.service";
import { PatientService } from "../../../../../patients/shared/patient.service";
import { CreditOrganization } from "../../../../../pharmacy/shared/pharmacy-credit-organizations.model";
import { PHRMEmployeeCashTransaction } from "../../../../../pharmacy/shared/pharmacy-employee-cash-transaction";
import { PHRMSettlementModel } from "../../../../../pharmacy/shared/pharmacy-settlementModel";
import { PharmacyBLService } from "../../../../../pharmacy/shared/pharmacy.bl.service";
import { PharmacyService } from "../../../../../pharmacy/shared/pharmacy.service";
import { PHRMInvoiceModel } from "../../../../../pharmacy/shared/phrm-invoice.model";
import { PHRMStoreModel } from "../../../../../pharmacy/shared/phrm-store.model";
import { SecurityService } from "../../../../../security/shared/security.service";
import { CallbackService } from "../../../../../shared/callback.service";
import { DanpheHTTPResponse } from "../../../../../shared/common-models";
import { CommonFunctions } from "../../../../../shared/common.functions";
import { GridEmitModel } from "../../../../../shared/danphe-grid/grid-emit.model";
import { FewaPayService } from "../../../../../shared/fewa-pay/helpers/fewa-pay.service";
import { MessageboxService } from "../../../../../shared/messagebox/messagebox.service";
import { RouteFromService } from "../../../../../shared/routefrom.service";
import { ENUM_DanpheHTTPResponses, ENUM_FewaPayMessageTypes, ENUM_FewaPayTransactionFrom, ENUM_MessageBox_Status, ENUM_ModuleName, ENUM_POS_ResponseStatus } from "../../../../../shared/shared-enums";
import DispensaryGridColumns from "../../../../shared/dispensary-grid.column";
import { DispensaryService } from "../../../../shared/dispensary.service";

@Component({
  selector: 'pending-settlement-list',
  templateUrl: './pending-settlement-list.html',
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class PendingPHRMSettlementListComponent {

  public allPHRMPendingSettlements: Array<PHRMInvoiceModel> = [];//this contains settleme
  public patCrInvoicDetails: Array<PHRMInvoiceModel> = [];

  public PHRMSettlementGridCols: Array<any> = null;

  public selectAllInvoices: boolean = false;
  public showActionPanel: boolean = false;
  public showDetailView: boolean = false;
  public selInvoicesTotAmount: number = 0;

  public model: PHRMSettlementModel = new PHRMSettlementModel();
  public setlmntToDisplay = new PHRMSettlementModel();

  public showReceipt: boolean = false;//to show hide settlement grid+action panel   OR  SettlementReceipt
  public showGrid: boolean = true;
  public selectAll: boolean = true;

  public discountGreaterThanPayable: boolean = false;
  public PayableAmount: number = 0;
  public settelmentProceedEnable: boolean = true;
  public DepositInfo: any = { "Deposit_In": 0, "Deposit_Out": 0, "Deposit_Balance": 0 };
  public ProvisionalInfo: any = { "ProvisionalTotal": 0 };
  public PatientInfo: any = null;
  public showInvoiceDetail: boolean = false;
  public patientId: number = null;

  public SettlementId: number = 0;
  public creditOrganizationsList: Array<CreditOrganization> = new Array<CreditOrganization>();
  public OrganizationId: number = null;
  public OrganizationName: any = "";

  //     //sud: 13May'18--to display patient bill summary
  public patBillHistory = {
    IsLoaded: false,
    PatientId: null,
    CreditAmount: null,
    ProvisionalAmt: null,
    TotalDue: null,
    DepositBalance: null,
    BalanceAmount: null,
    SubtotalAmount: null,
    DiscountAmount: null
  };

  public loading: boolean = false;
  public currentCounter: number = 0;
  public billStatus: string = "All";
  public filteredPHRMPendingSettlements: Array<PHRMInvoiceModel> = [];
  public currentActiveDispensary: PHRMStoreModel;
  provisionalFromSettlement: boolean = false;
  public phrmEmpCashTxn: PHRMEmployeeCashTransaction = new PHRMEmployeeCashTransaction();
  public MstPaymentModes: any = [];
  public PatientVisitId: number = 0;
  SettlementToPostDTO = new PHRMSettlementModel();
  loadingScreen: boolean = false;
  public PatientDataList: Array<PatientInfo_DTO> = new Array<PatientInfo_DTO>();
  public SelectedPatient: PatientInfo_DTO = new PatientInfo_DTO();
  constructor(public pharmacyService: PharmacyService, private _dispensaryService: DispensaryService,
    public router: Router,
    public routeFromService: RouteFromService,
    public pharmacyBLService: PharmacyBLService,
    public securityService: SecurityService,
    public changeDetector: ChangeDetectorRef,
    public callbackservice: CallbackService,
    public patientService: PatientService,
    public msgBoxServ: MessageboxService,
    public coreService: CoreService,
    public billingService: BillingService,
    private _fewaPayService: FewaPayService) {
    this.MstPaymentModes = this.coreService.masterPaymentModes;
    this.currentCounter = this.securityService.getPHRMLoggedInCounter().CounterId;
    this.currentActiveDispensary = this._dispensaryService.activeDispensary;
    if (this.currentCounter < 1) {
      this.callbackservice.CallbackRoute = '/Dispensary/Sale/New'
      this.router.navigate(['/Dispensary/ActivateCounter']);
    }
    else {
      this.PHRMSettlementGridCols = DispensaryGridColumns.PHRMSettlementBillSearch;
      this.creditOrganizationsList = this._dispensaryService.BillingCreditOrganizationList && this._dispensaryService.BillingCreditOrganizationList.filter(a => !a.IsClaimManagementApplicable);//this.billingService.AllCreditOrganizationsList && this.billingService.AllCreditOrganizationsList.filter(a => !a.IsClaimManagementApplicable);
      let orgObj = this.creditOrganizationsList.find(a => a.IsDefault == true);
      if (orgObj) {
        this.OrganizationId = orgObj.OrganizationId;
        this.OrganizationName = orgObj.OrganizationName;
      }
      this.OrganizationId && this.GetBillsForSettlement(this.OrganizationId);
      this.showGrid = true;
      this.GetPatientInfo();
    }

  }
  ngOnInit(): void {
  }
  ngOnDestroy(): void {
    this.patientService.CreateNewGlobal();
  }

  GetBillsForSettlement(OrganizationId) {
    this.allPHRMPendingSettlements = [];
    this.filteredPHRMPendingSettlements = [];
    this.pharmacyBLService.GetPHRMPendingBillsForSettlement(this.currentActiveDispensary.StoreId, OrganizationId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK" && res.Results.length) {
          this.allPHRMPendingSettlements = res.Results;
          this.allPHRMPendingSettlements = this.allPHRMPendingSettlements.filter(p => p.CreditTotal > 0);
          this.filteredPHRMPendingSettlements = this.allPHRMPendingSettlements;
        }
      });
  }

  GetPatientInfo() {
    this.PatientDataList = [];
    this.pharmacyBLService.GetPatientInfoSettlement()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length) {
          this.PatientDataList = res.Results;
        }
      });
  }

  PHRMSettlementGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "showDetails":
        {
          this.showReceipt = false;
          var data = $event.Data;
          this.PatientVisitId = $event.Data.PatientVisitId;
          this.GetPatientCreditInvoices(data);

        }
        break;
      case "print":
        {
          var data = $event.Data;
          if (data.SettlementId > 0) {
            this.GetPaidSettlementsDetails(data);
          }
          else {
            this.GetUnPaidSettlementsDetails(data);
          }
        }
        break;
      default:
        break;
    }
  }

  GetPatientCreditInvoices(row): void {
    this.loading = true;
    this.showGrid = false;
    this.showActionPanel = true;
    this.showReceipt = false;
    //patient mapping later used in receipt print
    let patient = this.patientService.CreateNewGlobal();
    patient.ShortName = row.PatientName;
    patient.PatientCode = row.PatientCode;
    patient.DateOfBirth = row.DateOfBirth;
    patient.Gender = row.Gender;
    patient.PatientId = row.PatientId;
    patient.PhoneNumber = row.PhoneNumber;

    this.pharmacyBLService.GetCreditInvoicesByPatient(patient.PatientId, this.OrganizationId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
          this.patCrInvoicDetails = res.Results.CreditInvoiceInfo;
          this.PatientInfo = res.Results.PatientInfo;
          this.DepositInfo = res.Results.DepositInfo;
          this.ProvisionalInfo = res.Results.ProvisionalInfo;
          this.patientService.globalPatient = res.Results.PatientInfo;
          this.patientId = res.Results.PatientInfo.PatientId;
          var patient = this.patientService.globalPatient;
          patient.ShortName = `${patient.FirstName} ${patient.MiddleName ? patient.MiddleName : ''} ${patient.LastName}`;
          this.patCrInvoicDetails.forEach(function (inv) {
            inv.selectedPatient = res.Results.Patient;
            inv.CreateOn = moment(inv.CreateOn).format("YYYY-MM-DD HH:mm");
            //adding new field to manage checked/unchecked invoice.
            // inv.IsSelected = false;
          });

          if (this.ProvisionalInfo && this.ProvisionalInfo.ProvisionalTotal > 0) {
            this.settelmentProceedEnable = false;
            this.msgBoxServ.showMessage('warning', ["There are few items in provisional list,please generate their invoices and proceed for settlement"]);
          } else {
            this.settelmentProceedEnable = true;
          }


          if (this.selectAll) {
            this.patCrInvoicDetails.forEach(a => {
              a.isSelected = true;
            })
          }
          this.SelectAll();


          //by default selecting all items.
          this.selectAllInvoices = true;
          this.SelectAllChkOnChange();
          //this.LoadPatientPastBillSummary(patient.PatientId);
          this.loading = false;
        }
        else {
          this.msgBoxServ.showMessage("error", ["Couldn't fetch patient's credit details. Please try again later"], res.ErrorMessage);
        }
      });
  }


  //     //sud: 13May'18--to display patient's bill history
  LoadPatientPastBillSummary(patientId: number) {
    this.pharmacyBLService.GetPatientPastBillSummary(patientId)
      .subscribe(res => {
        if (res.Status == "OK") {
          this.patBillHistory = res.Results;
          this.patBillHistory.CreditAmount = CommonFunctions.parseAmount(this.patBillHistory.CreditAmount);
          //provisional amount should exclude itmes those are listed for payment in current window.
          this.patBillHistory.ProvisionalAmt = CommonFunctions.parseAmount(this.patBillHistory.ProvisionalAmt);
          this.patBillHistory.TotalDue = CommonFunctions.parseAmount(this.patBillHistory.CreditAmount + this.patBillHistory.ProvisionalAmt);
          this.patBillHistory.BalanceAmount = CommonFunctions.parseAmount(this.patBillHistory.DepositBalance - this.patBillHistory.TotalDue);
          //if balance is negative it'll be payableamt otherwise it'll be refundable amount.
          this.patBillHistory.BalanceAmount < 0 ? (this.model.PayableAmount = (-this.patBillHistory.BalanceAmount)) : (this.model.RefundableAmount = this.patBillHistory.BalanceAmount)
          this.patBillHistory.DepositBalance = CommonFunctions.parseAmount(this.patBillHistory.DepositBalance);
          this.patBillHistory.IsLoaded = true;
          this.patBillHistory.SubtotalAmount = CommonFunctions.parseAmount(this.patBillHistory.SubtotalAmount);           //add subtotal
          this.patBillHistory.DiscountAmount = CommonFunctions.parseAmount(this.patBillHistory.DiscountAmount);           // add total discount amount

          //this.model.DueAmount = this.patBillHistory.BalanceAmount;
          this.model.PaidAmount = this.model.PayableAmount;
          this.model.ReturnedAmount = this.model.RefundableAmount;

          if (this.patBillHistory.ProvisionalAmt > 0) {
            this.msgBoxServ.showMessage("warning", ["There are few items in provisional list, please generate their invoices and proceed for settlement"], null, true);
          }

        }
        else {
          this.msgBoxServ.showMessage("failed", [res.ErrorMessage]);
        }
      });
  }


  BackToGrid() {
    this.showGrid = true;
    this.showActionPanel = false;
    this.showReceipt = false;
    this.showDetailView = false;
    this.setlmntToDisplay = new PHRMSettlementModel()
    this.selectAll = true;
    //reset current patient value on back button..
    this.patientService.CreateNewGlobal();
    this.patCrInvoicDetails = [];
    this.model = new PHRMSettlementModel();
    this.GetBillsForSettlement(this.OrganizationId);
  }

  gridExportOptions = {
    fileName: 'SettlementLists_' + moment().format('YYYY-MM-DD') + '.xls',
  };


  SelectAllChkOnChange() {
    if (this.patCrInvoicDetails && this.patCrInvoicDetails.length) {
      if (this.selectAllInvoices) {
        this.patCrInvoicDetails.forEach(itm => {
          itm.IsSelected = true;
        });
        this.showActionPanel = true;
      }
      else {
        this.patCrInvoicDetails.forEach(itm => {
          itm.IsSelected = false;
        });
        this.showActionPanel = false;

      }

      this.CalculateTotalAmt();
    }
  }

  CalculateTotalAmt() {
    this.selInvoicesTotAmount = 0;
    this.patCrInvoicDetails.forEach(inv => {
      if (inv.IsSelected) {
        this.selInvoicesTotAmount += inv.TotalAmount;
      }
    });
    this.selInvoicesTotAmount = CommonFunctions.parseAmount(this.selInvoicesTotAmount);
  }

  PayProvisionalItems() {
    this.patientId = this.patientService.globalPatient.PatientId;
    this.provisionalFromSettlement = true;
    this.showReceipt = false;
    this.showActionPanel = false;
  }



  SettlePatientBills() {
    if (!this.settelmentProceedEnable) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Please clear all the provisional amount of this patient then come for settlement']);
      return;
    }
    this.loading = true;
    if (this.CheckIsDiscountApplied()) {
      this.model.PHRMInvoiceTransactions = this.patCrInvoicDetails;

      this.SettlementToPostDTO = this.GetSettlementInvoiceFormatted();
      this.HandlePaymentTransaction();
    }
    else {
      this.loading = false;
    }
  }


  /**This method is responsible to check whether FewaPay is applicable or not if not proceed with normal workflow else wait for the message sent by FewaPay Browser extension and decide after message is received*/
  private HandlePaymentTransaction() {
    if (this._fewaPayService.IsFewaPayApplicable(this.SettlementToPostDTO.PaymentDetails)) {
      this.loadingScreen = true;
      const transactionReqString = this._fewaPayService.CreateFewaPayTransactionRequest(this.SettlementToPostDTO.PaymentDetails, this.SettlementToPostDTO.PaidAmount, this.SettlementToPostDTO.Remarks);
      if (transactionReqString) {
        window.postMessage({
          type: ENUM_FewaPayMessageTypes.PaymentInfoRequest,
          data: transactionReqString,
        }, "*");
        console.log('Transaction Request is posted from Danphe.');
      } else {
        this.loadingScreen = false;
        this.loading = false;
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Transaction Request cannot be created due to missing mandatory data like paymentDetails, totalAmount and remarks`]);
      }
    } else {
      this.ClearPatientCredits();
    }
  }


  private ClearPatientCredits() {
    this.pharmacyBLService.PostSettlementInvoice(this.SettlementToPostDTO)
      .finally(() => { this.loading = false; })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Settled successfully']);
          this.setlmntToDisplay = res.Results;
          this.SettlementId = this.setlmntToDisplay.SettlementId;
          this.setlmntToDisplay.Patient = this.patientService.globalPatient;
          this.showReceipt = true;
          this.showActionPanel = false;
          this.loadingScreen = false;
        }
        else {
          this.loadingScreen = false;
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Settlement failed' + res.ErrorMessage]);
        }
      },
        err => {
          this.loadingScreen = false;
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [err.ErrorMessage]);
        }

      );
  }

  CheckRemarks() {
    if (this.model.DiscountPercentage != null) {
      this.model.IsDiscounted = true;
    }
    else {
      this.model.IsDiscounted = false;
    }
  }
  CheckIsDiscountApplied(): boolean {
    if (this.model.DiscountPercentage) {
      this.model.IsDiscounted = true;
    }
    else {
      this.model.IsDiscounted = false;
    }
    if (this.model.IsDiscounted && !this.model.Remarks) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["Remarks is mandatory in case of discount."]);
      return false;
    }
    else
      return true;
  }

  GetSettlementInvoiceFormatted(): PHRMSettlementModel {
    let retSettlModel = new PHRMSettlementModel();
    retSettlModel.PHRMInvoiceTransactions = this.patCrInvoicDetails.filter(a => a.isSelected == true);
    retSettlModel.PatientId = this.patientService.globalPatient.PatientId;
    retSettlModel.PayableAmount = this.model.PayableAmount;
    retSettlModel.RefundableAmount = this.model.RefundableAmount;
    retSettlModel.PaidAmount = this.model.PaidAmount;
    retSettlModel.ReturnedAmount = this.model.ReturnedAmount;
    retSettlModel.DepositDeducted = this.model.DepositDeducted;
    retSettlModel.DueAmount = this.model.DueAmount > 0 ? this.model.DueAmount : (-this.model.DueAmount);
    retSettlModel.PaymentMode = this.model.PaymentMode.toLowerCase() != 'credit' ? 'cash' : 'credit';
    retSettlModel.PaymentDetails = this.model.PaymentDetails;
    retSettlModel.CounterId = this.securityService.getPHRMLoggedInCounter().CounterId;
    retSettlModel.DiscountAmount = this.model.DiscountAmount == null ? 0 : this.model.DiscountAmount;
    retSettlModel.Remarks = this.model.Remarks;
    retSettlModel.CollectionFromReceivable = this.model.CollectionFromReceivable == null ? 0 : this.model.CollectionFromReceivable;
    retSettlModel.DiscountReturnAmount = this.model.DiscountReturnAmount == null ? 0 : this.model.DiscountReturnAmount;
    retSettlModel.StoreId = this._dispensaryService.activeDispensary.StoreId;
    retSettlModel.OrganizationId = this.OrganizationId;


    if (this.model.PayableAmount <= this.DepositInfo.Deposit_Balance && this.model.RefundableAmount && this.TempEmployeeCashTransactions.length == 0) {
      let empCashTxn = new PHRMEmployeeCashTransaction();
      let obj = this.MstPaymentModes.find(a => a.PaymentSubCategoryName.toLowerCase() === "deposit");
      empCashTxn.InAmount = retSettlModel.DepositDeducted;
      empCashTxn.ModuleName = ENUM_ModuleName.Dispensary;
      empCashTxn.OutAmount = 0;
      empCashTxn.TransactionType = "CollectionFromReceivable"
      empCashTxn.Remarks = "paid from deposit";
      empCashTxn.PaymentModeSubCategoryId = obj.PaymentSubCategoryId;
      this.TempEmployeeCashTransactions.push(empCashTxn);
    }
    if (this.model.PayableAmount > (this.DepositInfo.Deposit_Balance == null ? 0 : this.DepositInfo.Deposit_Balance) && this.TempEmployeeCashTransactions.length == 0) {
      if (this.DepositInfo.Deposit_Balance > 0) {
        let empCashTxn = new PHRMEmployeeCashTransaction();
        let obj = this.MstPaymentModes.find(a => a.PaymentSubCategoryName.toLowerCase() === "deposit");
        empCashTxn.InAmount = retSettlModel.DepositDeducted;
        empCashTxn.ModuleName = ENUM_ModuleName.Dispensary;
        empCashTxn.OutAmount = 0;
        empCashTxn.TransactionType = "CollectionFromReceivable"
        empCashTxn.Remarks = "";
        empCashTxn.PaymentModeSubCategoryId = obj.PaymentSubCategoryId;
        this.TempEmployeeCashTransactions.push(empCashTxn);
      }
      else {
        let empCashTxn = new PHRMEmployeeCashTransaction();
        let obj = this.MstPaymentModes.find(a => a.PaymentSubCategoryName.toLowerCase() === "cash");
        empCashTxn.InAmount = retSettlModel.PaidAmount;
        empCashTxn.ModuleName = ENUM_ModuleName.Dispensary;
        empCashTxn.OutAmount = 0;
        empCashTxn.Remarks = "";
        empCashTxn.TransactionType = "CollectionFromReceivable"
        empCashTxn.PaymentModeSubCategoryId = obj.PaymentSubCategoryId;
        this.TempEmployeeCashTransactions.push(empCashTxn);
      }
    }
    if (retSettlModel.DiscountAmount) {
      let empCashTxn = new PHRMEmployeeCashTransaction();
      let obj = this.MstPaymentModes.find(a => a.PaymentSubCategoryName.toLowerCase() === "cash");
      empCashTxn.InAmount = retSettlModel.DiscountAmount;
      empCashTxn.ModuleName = ENUM_ModuleName.Dispensary;
      empCashTxn.OutAmount = 0;
      empCashTxn.Remarks = "";
      empCashTxn.TransactionType = "CollectionFromReceivable"
      empCashTxn.PaymentModeSubCategoryId = obj.PaymentSubCategoryId;
      this.TempEmployeeCashTransactions.push(empCashTxn);
    }
    retSettlModel.PHRMEmployeeCashTransactions = this.TempEmployeeCashTransactions;

    this.patCrInvoicDetails.forEach(a => {
      if (a.isSelected == true && a.PHRMReturnIdsCSV) {
        if (a.PHRMReturnIdsCSV.includes(',')) {
          let phrmReturnIdsCSV: any[] = a.PHRMReturnIdsCSV.toString().split(",");
          phrmReturnIdsCSV.forEach(b => {
            retSettlModel.PHRMReturnIdsCSV.push(b);
          });
        } else {
          retSettlModel.PHRMReturnIdsCSV.push(a.PHRMReturnIdsCSV);
        }
      }
    });
    return retSettlModel;
  }
  PaidAmountOnChange() {
    if (this.model.PayableAmount < this.model.PaidAmount) {
      this.model.ReturnedAmount = CommonFunctions.parseAmount(this.model.PaidAmount - this.model.PayableAmount);
      this.model.IsDiscounted = false;
      this.model.DiscountAmount = 0;
      this.model.DiscountPercentage = 0;
    }

    else if (this.model.PayableAmount > this.model.PaidAmount) {
      this.model.DiscountAmount = CommonFunctions.parseAmount(this.model.PayableAmount - this.model.PaidAmount);
      this.model.IsDiscounted = true;
      this.model.ReturnedAmount = 0;
      this.model.DiscountPercentage = CommonFunctions.parseAmount((this.model.DiscountAmount / this.model.PayableAmount) * 100);

    }
  }
  DiscountAmountOnChange() {
    let disc = this.model.DiscountPercentage / 100;
    this.model.DiscountAmount = CommonFunctions.parseAmount(this.model.PayableAmount * disc);
    this.model.PaidAmount = CommonFunctions.parseFinalAmount(this.model.PayableAmount - this.model.DiscountAmount);
    this.model.IsDiscounted = true;
    this.model.ReturnedAmount = 0;

  }
  DiscountChkOnChange() {
    if (this.model.IsDiscounted) {
      this.model.DiscountAmount = this.model.DueAmount;
      this.model.DueAmount = 0;
    }
    else {
      this.model.DiscountAmount = 0;
      this.model.DueAmount = CommonFunctions.parseAmount(this.model.PayableAmount - this.model.PaidAmount);
    }
  }

  OnReceiptClosed($event) {
    this.showReceipt = false;
    this.setlmntToDisplay = new PHRMSettlementModel();
    this.GetBillsForSettlement(this.OrganizationId);
    this.BackToGrid();
    this.changeDetector.detectChanges();

  }
  showDetailedView(event: any) {
    console.log(event);
  }
  OnBillStatusChange() {
    if (this.billStatus == "All") {
      this.filteredPHRMPendingSettlements = this.allPHRMPendingSettlements;
    }
    else if (this.billStatus == "paid") {
      this.filteredPHRMPendingSettlements = this.allPHRMPendingSettlements.filter(p => p.BilStatus == "paid");
    }
    else if (this.billStatus == "unpaid") {
      this.filteredPHRMPendingSettlements = this.allPHRMPendingSettlements.filter(p => p.BilStatus == "unpaid");
    }
  }

  GetPaidSettlementsDetails(settlementData) {
    this.SettlementId = settlementData.SettlementId;
    this.showReceipt = true;
    this.showGrid = false;
  }

  GetUnPaidSettlementsDetails(row) {
    this.pharmacyBLService.GetCreditInvoicesByPatient(row.PatientId, this.OrganizationId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          this.patCrInvoicDetails = res.Results.CreditInvoiceInfo;
          this.patientService.globalPatient = res.Results.PatientInfo;
          this.setlmntToDisplay.PHRMInvoiceTransactions = this.patCrInvoicDetails;
          this.setlmntToDisplay.Patient = res.Results.PatientInfo;
          this.setlmntToDisplay.BillingUser = this.securityService.GetLoggedInUser().UserName;
          this.showReceipt = true;
          this.showGrid = false;
        }
        else {
          this.msgBoxServ.showMessage("error", ["Couldn't fetch patient's details. Please try again later"], res.ErrorMessage);
        }
      });
  }

  public SelectAll() {
    this.patCrInvoicDetails.forEach(a => {
      a.isSelected = true;
    })
    if (this.selectAll) {
      this.model.CollectionFromReceivable = CommonFunctions.parsePhrmAmount(this.patCrInvoicDetails.reduce(function (acc, itm) { return acc + itm.NetAmount; }, 0));
      if (this.ProvisionalInfo && this.ProvisionalInfo.ProvisionalTotal > 0) {
        this.settelmentProceedEnable = false;
      } else {
        this.settelmentProceedEnable = true;
      }
      this.CalculatePaidAmount();
    } else {
      this.patCrInvoicDetails.forEach(a => {
        a.isSelected = false;
      })
      this.model.CollectionFromReceivable = 0;
      this.CalculatePaidAmount();
    }
  }


  public CalculatePaidAmount() {
    if (this.model.DiscountAmount > this.model.CollectionFromReceivable || this.model.DiscountAmount < 0) {
      this.discountGreaterThanPayable = true;
      this.settelmentProceedEnable = false;
    } else {
      this.discountGreaterThanPayable = false;
      if (this.ProvisionalInfo.ProvisionalTotal <= 0) {
        if (this.patCrInvoicDetails.some(a => a.isSelected == true) || this.selectAll) {
          this.settelmentProceedEnable = true;
        } else {
          this.settelmentProceedEnable = false;
        }
      } else {
        this.settelmentProceedEnable = false;
      }
    }
    this.model.PayableAmount = Number((this.model.CollectionFromReceivable - this.model.DiscountAmount).toFixed(4));
    if (this.model.PayableAmount >= this.DepositInfo.Deposit_Balance) {
      this.model.PaidAmount = Number((this.model.PayableAmount - this.DepositInfo.Deposit_Balance).toFixed(4));
      this.model.DepositDeducted = this.DepositInfo.Deposit_Balance;
      this.model.RefundableAmount = 0;
    } else {

      this.model.DepositDeducted = Number((this.model.PayableAmount).toFixed(4));
      this.model.RefundableAmount = Number((this.DepositInfo.Deposit_Balance - this.model.PayableAmount).toFixed(4));
      this.model.PaidAmount = 0;
    }


  }
  public OnCheckboxChanged(indx) {
    let currentItem = this.patCrInvoicDetails[indx];
    if (currentItem) {
      this.CalculateTotalCredit(indx);
    }
    let selectedInvoices = this.patCrInvoicDetails.filter(a => a.isSelected == true);
    if (selectedInvoices.length > 0 && (this.ProvisionalInfo && this.ProvisionalInfo.ProvisionalTotal <= 0)) {
      this.settelmentProceedEnable = true;
    } else {
      this.settelmentProceedEnable = false;
    }

    if (this.patCrInvoicDetails.every(b => b.isSelected == true)) {
      this.selectAll = true;
    } else {
      this.selectAll = false;
    }

  }

  public CalculateTotalCredit(indx) {
    if (this.patCrInvoicDetails[indx].isSelected) {
      this.model.CollectionFromReceivable = Number((this.model.CollectionFromReceivable + this.patCrInvoicDetails[indx].NetAmount).toFixed(4));
      this.CalculatePaidAmount();
    }
    else {
      this.model.CollectionFromReceivable = Number((this.model.CollectionFromReceivable - this.patCrInvoicDetails[indx].NetAmount).toFixed(4));
      this.CalculatePaidAmount();
    }
  }

  public singleInvoiceId: number = 0;
  public ShowInvoiceDetail(indx) {
    this.showInvoiceDetail = true;
    let singleInvoiceId = this.patCrInvoicDetails.filter((_, index) => index == indx);
    this.singleInvoiceId = singleInvoiceId[0].InvoiceId;
  }

  public InvoiceDetailCallBack(event: any) {
    if (event) {
      if (event.close) {
        this.showInvoiceDetail = false;
      }
    }
  }

  public hotkeys(event) {
    if (event.keyCode == 27) {
      this.showInvoiceDetail = false;
      this.showReceipt = false;
      this.provisionalFromSettlement = false;

    }
  }
  PaymentModeChanges($event: any) {

    this.model.PaymentMode = $event.PaymentMode.toLowerCase();
    this.model.PaymentDetails = $event.PaymentDetails;
  }
  public TempEmployeeCashTransactions: Array<PHRMEmployeeCashTransaction> = new Array<PHRMEmployeeCashTransaction>();
  MultiplePaymentCallBack($event: any) {
    if ($event && $event.MultiPaymentDetail && this.model.PaymentMode.toLocaleLowerCase() == 'others') {
      this.TempEmployeeCashTransactions = new Array<PHRMEmployeeCashTransaction>();
      this.TempEmployeeCashTransactions = $event.MultiPaymentDetail;
      this.TempEmployeeCashTransactions.forEach(txn => {
        txn.TransactionType = "CollectionFromReceivable";
      })
    } else {
      this.TempEmployeeCashTransactions = [];
    }
    this.model.PaymentDetails = $event.PaymentDetail;
  }

  OrganizationBasedBillsForSettlement($event: any) {
    if ($event && $event.target.value) {
      this.OrganizationId = $event.target.value;
      let orgObj = this.creditOrganizationsList.find(a => a.OrganizationId == this.OrganizationId);
      this.OrganizationName = orgObj.OrganizationName;
      this.GetBillsForSettlement(this.OrganizationId);
    }
  }

  /**Below HostListener is responsible to catch the responses from FewaPay Browser Extension */
  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent): void {
    const result = this._fewaPayService.HandleEventsFromFewaPayBrowserExtension(event);
    if (result) {
      if (result.resultCode === ENUM_POS_ResponseStatus.Success) { //! Krishna, 10thDec'23 "000" is success status code sent from POS device.
        const transactionId = 'verifyTransId' in result && result.verifyTransId;
        if (transactionId) {
          this.SettlementToPostDTO.PaymentDetails = `${this.SettlementToPostDTO.PaymentDetails}; TransactionId: ${transactionId}`;
        }
        this._fewaPayService.SaveFewaPayTransactionLogs(result, this.SettlementToPostDTO.PatientId, ENUM_FewaPayTransactionFrom.DispensarySettlement);
        this.ClearPatientCredits();
      } else {
        this._fewaPayService.SaveFewaPayTransactionLogs(result, this.SettlementToPostDTO.PatientId, ENUM_FewaPayTransactionFrom.DispensarySettlement);
        this.loading = false;
        this.loadingScreen = false;
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`${result.message}`]);
      }
      return;
    }
  }
  PatientDataOnChanged($event) {
    if (this.allPHRMPendingSettlements && this.allPHRMPendingSettlements.length) {
      if ($event && typeof $event === 'object' && $event.PatientId > 0) {
        this.filteredPHRMPendingSettlements = this.allPHRMPendingSettlements.filter(p => p.PatientId === $event.PatientId);
      }
      else {
        this.filteredPHRMPendingSettlements = this.allPHRMPendingSettlements;
      }
    }
  }
  PatientListFormatter(data: any): string {
    return data["PatientName"] + "|" + data["HospitalNo"];
  }
}
export class PatientInfo_DTO {

  PatientId: number = 0;
  PatientName: string = '';
  HospitalNo: string = '';
  PhoneNumber: string = '';
}