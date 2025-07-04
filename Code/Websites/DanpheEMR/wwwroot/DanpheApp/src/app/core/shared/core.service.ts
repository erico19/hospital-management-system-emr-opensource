import { Injectable } from "@angular/core";
//import { ParameterModel } from './parameter.model'
import { Router } from "@angular/router";
import { KEYUTIL, KJUR, hextorstr, stob64 } from 'jsrsasign';
import * as qz from 'qz-tray';
import { BehaviorSubject } from "rxjs";
import { GovernmentItems } from "../../../app/labs/shared/lab-government-items.model";
import { BillingMembershipTypeVsPriceCategoryMapping } from "../../billing/shared/billing-membershipTypeVsPriceCategoryMapping.model";
import { Employee } from "../../employee/shared/employee.model";
import { LabTypesModel } from "../../labs/lab-selection/lab-type-selection.component";
import { DanpheRoute } from "../../security/shared/danphe-route.model";
import { BillingScheme_DTO } from "../../settings-new/billing/shared/dto/billing-scheme.dto";
import { PrinterSettingsModel } from "../../settings-new/printers/printer-settings.model";
import { Salutation } from "../../settings-new/shared/DTOs/Salutation.Model";
import { CFGParameterModel } from "../../settings-new/shared/cfg-parameter.model";
import { GeneralFieldLabels } from "../../shared/DTOs/general-field-label.dto";
import { InsuranceMasterItems_DTO } from "../../shared/DTOs/insurance-master-items.dto";
import { MasterFiscalYearDto } from "../../shared/DTOs/master-fiscal-year.dto";
import { PatientAddressDisplaySettings_DTO } from "../../shared/DTOs/patient-address-display-settings.dto";
import { NepaliCalendarService } from "../../shared/calendar/np/nepali-calendar.service";
import { CodeDetailsModel } from "../../shared/code-details.model";
import { CommonMaster } from "../../shared/common-masters.model";
import { DanpheAppSettings, DanpheHTTPResponse } from "../../shared/common-models";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../shared/shared-enums";
import { CoreBLService } from "./core.bl.service";
import { PharmacyPackageItem_DTO, PharmacyPackage_DTO } from "./dto/pharmacy-package.dto";


@Injectable()
export class CoreService {
  static GetFieldLabelParameter(): GeneralFieldLabels {
    throw new Error("Method not implemented.");
  }
  //the value of below property is getting assigned in the appcomponent (i.e: the first loaded component).

  public Parameters: Array<CFGParameterModel> = null; //sud:26Sept'19--Changed from parametermodel to CFGPrameterModel since it's a duplicate.
  public Masters: CommonMaster = new CommonMaster();
  public LookUps: Array<LookupsModel> = new Array<LookupsModel>();
  public loading: boolean = false;

  public AppSettings: DanpheAppSettings = null; //sud:25Dec'18
  public CodeDetails: Array<CodeDetailsModel> = new Array<CodeDetailsModel>(); //for accounting codes..
  public accFiscalYearList: Array<any> = new Array<any>();
  //sud:28Jan'20 // to cache referrer list for External-Referral component.
  //this will be get/set from that component itself.
  public AllReferrerList: Array<Employee> = null;

  //TAX PARAMETER
  public taxLabel: string = "";
  public currencyUnit: string = "";
  public currSelectedSecRoute: DanpheRoute = null;
  accountingSettingsBLService: any;
  public DatePreference: string = "np";
  public labTypes: Array<LabTypesModel>;
  public QzTrayObject: any;
  public billingDotMatrixPrinters: Array<any>;

  //vaiables to set and reset for SELECT html to work with enter key: Starts
  public selectEnterKeyCaptureEnabled: number;
  public nextFocusElemId: string;
  //vaiables to set and reset for SELECT html to work with enter key: End

  public allMunicipalities: Array<any>;
  public allPrintExportConfiguration: Array<any>;
  public paymentModeSettings: Array<any>;
  public masterPaymentModes: Array<any>;
  public singleLabType: boolean = false;
  public paymentPages: Array<any>;
  public membershipTypeVsPriceCategoryMapping = new Array<BillingMembershipTypeVsPriceCategoryMapping>();

  //START: Danphe App Level Configuration/preference variables here
  //By : NageshBB/MenkaChaugule On: 29 July 2021
  //Description: Please add all variable for project level configuration or preferences
  //We will use variables for whole project */
  public showCalendarADBSButton: boolean = true;
  public showLocalNameFormControl: boolean = true;
  public showCountryMapOnLandingPage: boolean = true;
  //END: Danphe App Level Configuration/preference variables here

  public allGovItems: Array<GovernmentItems> = new Array<GovernmentItems>();
  public SameDependentIdApplicableCount: number = 0;
  public SchemeList = new Array<BillingScheme_DTO>();
  // CurrentFiscalYearDetails: FiscalYearModel = new FiscalYearModel();
  CurrentFiscalYearDetails: MasterFiscalYearDto = new MasterFiscalYearDto();
  PatientAddressDisplaySettings = new PatientAddressDisplaySettings_DTO();
  Packages: PharmacyPackage_DTO[] = [];
  PackageItems: PharmacyPackageItem_DTO[] = [];
  InsuranceMasterItems = new Array<InsuranceMasterItems_DTO>();
  //SalutationData = new Array<Salutation>();
  salutationData = new Array<Salutation>();
  private salutationDataSubject = new BehaviorSubject<any[]>([]);

  constructor(
    public coreBlService: CoreBLService,
    public msgBoxServ: MessageboxService,
    // private settingsBLService: SettingsBLService,
    private _router: Router
  ) {
  }

  //Functions to set focus and remove focus and assign size to select html tag starts
  //with the help of these functions we make select html tag work with enter key
  public SetFocusOnCurrentSelect(
    currElmId: string,
    nextElmId: string,
    numOfElemToShow: string = "3"
  ) {
    this.selectEnterKeyCaptureEnabled = 1;
    this.nextFocusElemId = nextElmId;
    document.getElementById(currElmId) &&
      document.getElementById(currElmId).setAttribute("size", numOfElemToShow);
  }

  public GetIsPatientContactMandatory() {
    var phoneParameter = this.Parameters.find(
      (a) =>
        a.ParameterGroupName == "ClinicalPatientHeaderDisplay" &&
        a.ParameterName == "PatientContact"
    );
    let phoneNum = JSON.parse(phoneParameter.ParameterValue);

    return phoneNum;
  }
  public RemoveFocusFromCurrentSelect(currElmId: string) {
    this.selectEnterKeyCaptureEnabled = 0;
    this.nextFocusElemId = null;
    document.getElementById(currElmId) &&
      document.getElementById(currElmId).removeAttribute("size");
  }

  public SetFocusToNextSelectElement(nextElmId: string) {
    this.selectEnterKeyCaptureEnabled = 0;
    document.getElementById(nextElmId) &&
      document.getElementById(nextElmId).focus();
  }
  //Functions to set focus and remove focus and assign size to select html tag Ends

  public RemoveSelectedSecRoute() {
    this.currSelectedSecRoute = null;
  }

  //we're initializing parameters in the First component that will be loaded into the application.
  //i.e: appcomponent for now.
  public InitializeParameters() {
    return this.coreBlService.GetParametersList();
  }

  public GetAllLookUpDetails(type: number) {
    return this.coreBlService.GetAllLookUpDetails(type);
  }

  public GetMasterEntities() {
    return this.coreBlService.GetMasterEntities();
  }
  get SalutationData(): any[] {
    return this.salutationData;
  }

  set SalutationData(value: any[]) {
    this.salutationData = value;
    this.salutationDataSubject.next([...value]); // Notify all subscribers
  }
  AddSalutationData(newSalutation: any) {
    this.salutationData.push(newSalutation);
    this.salutationDataSubject.next([...this.salutationData]);
  }

  UpdateSalutationData(updatedSalutation: any) {
    const index = this.salutationData.findIndex(sal => sal.SalutationId === updatedSalutation.SalutationId);
    if (index !== -1) {
      this.salutationData[index] = updatedSalutation;
      this.salutationDataSubject.next([...this.salutationData]);
    }
  }
  public GetSalutations() {
    this.coreBlService.GetSalutationList().subscribe((res) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.SalutationData = res.Results;
      } else {
        this.msgBoxServ.showMessage("Failed", [
          "Failed to get SalutationList.",
        ]);
      }
    });
  }

  public SetMasterEntities(res) {
    if (res.Status == "OK") {
      let masters: CommonMaster = res.Results;
      this.Masters.ServiceDepartments = masters.ServiceDepartments;
      this.Masters.PriceCategories = masters.PriceCategories;
      this.Masters.Taxes = masters.Taxes;
      this.Masters.Departments = masters.Departments;
      this.Masters.UniqueDataList = masters.UniqueDataList;
      this.Masters.ICD10List = masters.ICD10List;
    }
  }

  public GetAllLookups() {
    return this.coreBlService.GetLookups();
  }

  public SetAllLookUps(res) {
    if (res.Status == "OK") {
      let allLookups: Array<LookupsModel> = res.Results;
      allLookups.forEach((lkp) => {
        this.LookUps.push({
          ModuleName: lkp.ModuleName,
          LookupName: lkp.LookupName,
          LookupDataJson: lkp.LookupDataJson,
        });
      });
    }
  }

  public GetModuleLookups(moduleName: string) {
    if (moduleName) {
      return this.LookUps.filter((a) => a.ModuleName == moduleName);
    }
  }
  public IsEnableEnglishCalendarOnly() {
    let IsEnglishCalendar = this.Parameters.find(
      (a) =>
        a.ParameterGroupName == "Common" &&
        a.ParameterName == "EnableEnglishCalendarOnly"
    );
    if (IsEnglishCalendar && IsEnglishCalendar.ParameterValue) {
      let EnglishCalendar = JSON.parse(IsEnglishCalendar.ParameterValue);
      return EnglishCalendar;
    }
  }

  public SetCurrencyUnit() {
    var currParameter = this.Parameters.find(
      (a) => a.ParameterName == "Currency"
    );
    if (currParameter)
      this.currencyUnit = JSON.parse(currParameter.ParameterValue).CurrencyUnit;
    else
      this.msgBoxServ.showMessage("error", [
        "Please set currency unit in parameters.",
      ]);
  }
  public GetHospitalDetail() {
    var currParameter = this.Parameters.find(
      (a) => a.ParameterName == "HospitalDetail"
    );
    if (currParameter) return JSON.parse(currParameter.ParameterValue);
    else
      this.msgBoxServ.showMessage("error", [
        "Please set hospital detail in parameters.",
      ]);
  }
  public SetTaxLabel() {
    var currParameter = this.Parameters.find(
      (a) => a.ParameterName == "TaxInfo"
    );
    if (currParameter) {
      this.taxLabel = JSON.parse(currParameter.ParameterValue).TaxLabel;
    } else
      this.msgBoxServ.showMessage("error", [
        "Please set Tax Info in parameters.",
      ]);
  }

  //public GetRadImgUploadConfig() {
  //  var currParameter = this.Parameters.find(a => a.ParameterGroupName=="Radiology" && a.ParameterName == "ImageUpload")
  //  if (currParameter)
  //    return JSON.parse(currParameter.ParameterValue).enableImgUpload;
  //  else
  //    this.msgBoxServ.showMessage("error", ["Please set radiology image upload configuration."]);
  //}

  public GetEnableHealthCard(): boolean {
    var currParameter = this.Parameters.find(
      (a) => a.ParameterName == "EnableHealthCard"
    );
    if (currParameter) {
      return JSON.parse(currParameter.ParameterValue).enableHealthCard;
    } else {
      console.log("Healthcard information is not set in parameters.");
      //this.msgBoxServ.showMessage("notice", ["Please set health card configuration."]);
      return false;
    }
  }

  public GetServiceIntegrationName(srvDeptName: string): string {
    let srvDepts = this.Masters.ServiceDepartments;
    let srvDept = srvDepts.find((a) => a.ServiceDepartmentName == srvDeptName);
    return srvDept ? srvDept.IntegrationName : null;
  }

  public GetServiceIntegrationNameById(srvDeptId: number): string {
    let srvDepts = this.Masters.ServiceDepartments;
    let srvDept = srvDepts.find((a) => a.ServiceDepartmentId == srvDeptId);
    return srvDept ? srvDept.IntegrationName : null;
  }

  //ashim: 22Aug2018: Used in visit-patient-info.component
  public GetDefaultCountry() {
    let countryJson = this.Parameters.find(
      (a) => a.ParameterName == "DefaultCountry"
    );
    if (countryJson) return JSON.parse(countryJson.ParameterValue);
  }
  public GetDefaultCountrySubDivision() {
    let subDivisionJSON = this.Parameters.find(
      (a) => a.ParameterName == "DefaultCountrySubDivision"
    );
    if (subDivisionJSON) return JSON.parse(subDivisionJSON.ParameterValue);
  }
  public GetLabReportHeaderSetting() {
    let labReportHeaderJSON = this.Parameters.find(
      (val) => val.ParameterName == "LabReportHeader"
    );
    if (labReportHeaderJSON) {
      return JSON.parse(labReportHeaderJSON.ParameterValue);
    }
  }
  //ashim: 06Sep2018 displaying default signatoire in lab
  public GetDefaultEmpIdForLabSignatories(): Array<number> {
    let empIdList = [];
    let empIdListJSON = this.Parameters.find(
      (val) =>
        val.ParameterGroupName.toLowerCase() == "lab" &&
        val.ParameterName == "DefaultSignatoriesEmpId"
    );
    if (empIdListJSON) {
      empIdList = JSON.parse(empIdListJSON.ParameterValue).empIdList;
    }
    return empIdList;
  }

  //anish: 28Nov2018 displaying default signatoire for histo/cyto in lab
  public GetDefaultHistoCytoEmpIdForLabSignatories(): Array<number> {
    let empIdList = [];
    let empIdListJSON = this.Parameters.find(
      (val) =>
        val.ParameterGroupName.toLowerCase() == "lab" &&
        val.ParameterName == "DefaultHistoCytoSignatoriesEmpId"
    );
    if (empIdListJSON) {
      empIdList = JSON.parse(empIdListJSON.ParameterValue).empIdList;
    }
    return empIdList;
  }

  public GetDefEmpIdForRadSignatories(): Array<number> {
    let empIdList = [];
    let empIdListJSON = this.Parameters.find(
      (val) =>
        val.ParameterGroupName.toLowerCase() == "radiology" &&
        val.ParameterName == "DefaultSignatoriesEmployeeId"
    );
    if (empIdListJSON) {
      empIdList = JSON.parse(empIdListJSON.ParameterValue).empIdList;
    }
    return empIdList;
  }

  //anish: 15 Sept 2019 for getting the name of Hospital for which it is made
  public GetHospitalName() {
    var hospitalName = this.Parameters.find(
      (val) =>
        val.ParameterName == "HospitalName" &&
        val.ParameterGroupName == "Common"
    );
    if (hospitalName) {
      let name = hospitalName.ParameterValue.toLowerCase();
      name = name.replace(/ +/g, "");
      return name;
    } else {
      this.msgBoxServ.showMessage("error", [
        "Please set Hospital Name in parameters.",
      ]);
    }
  }

  //anish: 17 Feb 2020 for getting the format of Vitals printing
  public GetVitalsPrintFormat() {
    var format = this.Parameters.find(
      (val) =>
        val.ParameterName == "VitalFormat" &&
        val.ParameterGroupName.toLowerCase() == "clinical"
    );
    if (format) {
      return format.ParameterValue.toLowerCase();
    } else {
      return "format1";
    }
  }

  public GetERDepartmentName() {
    var dept = this.Parameters.find(
      (val) =>
        val.ParameterName == "ERDepartmentName" &&
        val.ParameterGroupName.toLowerCase() == "common"
    );
    if (dept) {
      return dept.ParameterValue;
    } else {
      return null;
    }
  }

  public GetImmunizationDepartmentName() {
    var dept = this.Parameters.find(
      (val) =>
        val.ParameterName == "ImmunizationDeptName" &&
        val.ParameterGroupName.toLowerCase() == "common"
    );
    if (dept) {
      return dept.ParameterValue;
    } else {
      return "Immunization";
    }
  }

  public IsCareofPersonNoInAdmCreateMandatory() {
    let currParameter = this.Parameters.find(
      (a) =>
        a.ParameterName == "AdtNewAdmissionDisplaySettings" &&
        a.ParameterGroupName == "ADT"
    );
    if (currParameter && currParameter.ParameterValue) {
      let careofPersonNumberMandatory = JSON.parse(
        currParameter.ParameterValue
      );
      if (
        careofPersonNumberMandatory &&
        careofPersonNumberMandatory.IsCareOfPersonContactNoMandatory
      ) {
        return careofPersonNumberMandatory.IsCareOfPersonContactNoMandatory;
      }
      return false;
    } else {
      return true;
    }
  }

  public IsAdmittingDoctorInAdmCreateMandatory() {
    let currParameter = this.Parameters.find(
      (a) =>
        a.ParameterName == "AdtNewAdmissionDisplaySettings" &&
        a.ParameterGroupName == "ADT"
    );
    if (currParameter && currParameter.ParameterValue) {
      let careofPersonNumberMandatory = JSON.parse(
        currParameter.ParameterValue
      );
      if (
        careofPersonNumberMandatory &&
        careofPersonNumberMandatory.AdmittingDoctorMandatory
      ) {
        return careofPersonNumberMandatory.AdmittingDoctorMandatory;
      }
      return false;
    } else {
      return true;
    }
  }

  //Get customer Header Parameter from Core Service (Database) assign to local variable
  GetReportHeaderParameterHTML(fromDate, toDate, rptHeaderTxt): string {
    let headerDetail: {
      CustomerName;
      Address;
      Email;
      CustomerRegLabel;
      CustomerRegNo;
      Tel;
    };
    let header = "Report";
    var bilHeadparam = this.Parameters.find(
      (a) =>
        a.ParameterName == "BillingHeader" &&
        a.ParameterGroupName.toLowerCase() == "bill"
    );

    if (bilHeadparam) {
      headerDetail = JSON.parse(bilHeadparam.ParameterValue);
      let frmToTxt = "";
      let nepaliFromDate = "";
      let nepaliToDate = "";
      if (fromDate && toDate && fromDate.length && toDate.length) {
        nepaliFromDate =
          NepaliCalendarService.ConvertEngToNepaliFormatted_static(
            fromDate,
            "YYYY-MM-DD"
          );
        nepaliToDate = NepaliCalendarService.ConvertEngToNepaliFormatted_static(
          toDate,
          "YYYY-MM-DD"
        );
        frmToTxt =
          ` From: ` +
          fromDate +
          ` to ` +
          toDate +
          ` (B.S. From: ` +
          nepaliFromDate +
          ` to ` +
          nepaliToDate +
          `)`;
      }
      header =
        `<div class="bl-report-header text-center"><h3>` +
        headerDetail.CustomerName +
        `</h3><h3>` +
        headerDetail.Address +
        `</h3><h3>` +
        headerDetail.CustomerRegLabel +
        `</h3>` +
        `<h3 id="mainReportName">` +
        rptHeaderTxt +
        frmToTxt +
        `</h3></div>`;
    } else {
      this.msgBoxServ.showMessage("error", [
        "Please enter parameter values for BillingHeader",
      ]);
    }

    return header;
  }

  GetReportHeaderTextForProperty(headrPropName: string) {
    var repHead = this.Parameters.find(
      (val) =>
        val.ParameterName == "ReportHeaderText" &&
        val.ParameterGroupName.toLowerCase() == "reportingheader"
    );
    if (repHead) {
      var paramData = JSON.parse(repHead.ParameterValue);
      return paramData[headrPropName] ? paramData[headrPropName] : "Report";
    } else {
      return "Report";
    }
  }
  public ADTReservationBuffer() {
    var dept = this.Parameters.find(
      (val) =>
        val.ParameterName == "TimeBufferForReservation" &&
        val.ParameterGroupName.toLowerCase() == "adt"
    );
    if (dept) {
      return JSON.parse(dept.ParameterValue);
    } else {
      return { days: 30, minutes: 30 };
    }
  }

  public GetQryStrToGetLabItems() {
    var qrstr = this.Parameters.find(
      (val) =>
        val.ParameterName == "LabDepartmentNameInQuery" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (qrstr) {
      return qrstr.ParameterValue;
    } else {
      return "lab";
    }
  }

  public EnablePartialProvBilling() {
    var enable = this.Parameters.find(
      (val) =>
        val.ParameterName == "EnablePartialProvBilling" &&
        val.ParameterGroupName.toLowerCase() == "billing"
    );
    if (enable) {
      let val = enable.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public GetAllParametersDataForLabReport() {
    let verificationParmDefault = {
      EnableVerificationStep: "true",
      VerificationLevel: 2,
      PreliminaryReportSignature: "Preliminary Report",
      ShowVerifierSignature: "false",
      PreliminaryReportText: "This is preliminary text",
    };

    let allValuesDefault = {
      LoggedInUserSignatory: false,
      ReportDispatcherSignature: false,
      DisplayPrintInfo: false,
      LabBarCodeInReport: false,
      LabReportVerificationB4Print: {},
      HospitalCode: "",
      CultureIntermediateResults: false,
      HighLowNormalFlag: false,
      DigitalSignatureEnabled: false,
      CollectionSite: "",
      showGap: false,
      prescriberLabelInLabReport: ""
    };

    var paramName = [
      "ShowLoggedInUserSignatory",
      "ShowReportDispatcherSignature",
      "DisplayingPrintInfo",
      "ShowLabBarCodeInReport",
      "LabReportVerificationNeededB4Print",
      "HospitalCode",
      "ShowCultureIntermediateResults",
      "ShowHighLowNormalFlag",
      "EnableDigitalSignatureInLab",
      "CollectionSite",
      "LabReportHeader"
    ];
    var filteredData = this.Parameters.filter((val) => {
      if (
        (val.ParameterGroupName.toLowerCase() == "lab" ||
          val.ParameterGroupName.toLowerCase() == "common") &&
        paramName.indexOf(val.ParameterName) > -1
      ) {
        return true;
      }
    });
    if (filteredData) {
      let reportHeader = filteredData.find((val) =>
        val.ParameterName == "LabReportHeader"
      );
      let parsedHeader = JSON.parse(reportHeader.ParameterValue);
      allValuesDefault.showGap = parsedHeader && parsedHeader.showGap;
      allValuesDefault.prescriberLabelInLabReport = parsedHeader.prescriberLabelInLabReport;
    }
    if (filteredData) {
      let paramLGSignatory = filteredData.find(
        (val) => val.ParameterName == "ShowLoggedInUserSignatory"
      );
      allValuesDefault.LoggedInUserSignatory =
        this.GetBoolValueFromParam(paramLGSignatory);

      let paramDispatcherSignatory = filteredData.find(
        (val) => val.ParameterName == "ShowReportDispatcherSignature"
      );
      allValuesDefault.ReportDispatcherSignature = this.GetBoolValueFromParam(
        paramDispatcherSignatory
      );

      let paramDisplayPrintInfo = filteredData.find(
        (val) => val.ParameterName == "DisplayingPrintInfo"
      );
      allValuesDefault.DisplayPrintInfo = this.GetBoolValueFromParam(
        paramDisplayPrintInfo
      );

      let labBarCodeInReport = filteredData.find(
        (val) => val.ParameterName == "ShowLabBarCodeInReport"
      );
      allValuesDefault.LabBarCodeInReport =
        this.GetBoolValueFromParam(labBarCodeInReport);

      let cultureIntermediateResults = filteredData.find(
        (val) => val.ParameterName == "ShowCultureIntermediateResults"
      );
      allValuesDefault.CultureIntermediateResults = this.GetBoolValueFromParam(
        cultureIntermediateResults
      );

      let highLowNormalFlag = filteredData.find(
        (val) => val.ParameterName == "ShowHighLowNormalFlag"
      );
      allValuesDefault.HighLowNormalFlag =
        this.GetBoolValueFromParam(highLowNormalFlag);

      let digitalSignatureEnabled = filteredData.find(
        (val) => val.ParameterName == "EnableDigitalSignatureInLab"
      );
      allValuesDefault.DigitalSignatureEnabled = this.GetBoolValueFromParam(
        digitalSignatureEnabled
      );

      let collectionSite = filteredData.find(
        (val) => val.ParameterName == "CollectionSite"
      );
      allValuesDefault.CollectionSite = collectionSite
        ? collectionSite.ParameterValue
        : "";

      let hospitalCode = filteredData.find(
        (val) => val.ParameterName == "HospitalCode"
      );
      allValuesDefault.HospitalCode = hospitalCode
        ? hospitalCode.ParameterValue.toLowerCase()
        : "";

      let verificationParam = filteredData.find(
        (val) => val.ParameterName == "LabReportVerificationNeededB4Print"
      );
      allValuesDefault.LabReportVerificationB4Print = verificationParam
        ? JSON.parse(verificationParam.ParameterValue)
        : verificationParmDefault;
    }

    return allValuesDefault;
  }

  public GetBoolValueFromParam(parm: CFGParameterModel) {
    if (
      parm &&
      parm.ParameterValue &&
      parm.ParameterValue.trim() != "" &&
      (parm.ParameterValue.trim() == "true" ||
        parm.ParameterValue.trim() == "1" ||
        parm.ParameterValue.trim() == "false" ||
        parm.ParameterValue.trim() == "0")
    ) {
      return Boolean(JSON.parse(parm.ParameterValue.trim()));
    } else {
      return false;
    }
  }

  public ShowLoggedInUserSignatory() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "ShowLoggedInUserSignatory" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public ShowLabReportDispatcherSignatory() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "ShowReportDispatcherSignature" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public IsUnitEditApplicableWhileResultAdd() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "UnitEditInAddResult" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public ShowPrintInformationInLabReport() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "DisplayingPrintInfo" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public GetMaxNumberOfIsolatedOrganismCount() {
    var data = this.Parameters.find(
      (val) =>
        val.ParameterName == "MaxIsolatedOrganismCount" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (data) {
      let val = +data.ParameterValue;
      if (val) {
        return val;
      } else {
        return 5;
      }
    } else {
      return 5;
    }
  }

  //anish: for showing or hiding BarCode in LabReport
  public ShowBarCodeInLabReport() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "ShowLabBarCodeInReport" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public ShowEditResultButtonInLabFinalReport() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "ShowResultEditInFinalReport" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public ShowEmptyReportSheetPrint() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName === "LabEmptyPrintSheetConfig" &&
        val.ParameterGroupName.toLowerCase() === "lab"
    );
    if (show) {
      let val = JSON.parse(show.ParameterValue);
      return val;
    } else {
      return { "ShowEmptyReportSheet": false, "ShowReportTemplateWiseSegregation": false, "ShowCultureTestComponents": false };
    }
  }

  //anish: 10 May
  public EnableVerificationStep() {
    var parameter = this.Parameters.find(
      (val) =>
        val.ParameterName == "LabReportVerificationNeededB4Print" &&
        val.ParameterGroupName == "LAB"
    );
    if (parameter) {
      var verificationParam = JSON.parse(parameter.ParameterValue);
    }
    if (parameter && verificationParam) {
      let val = verificationParam.EnableVerificationStep;
      if (val == "true" || val == true) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public GetPreliminaryNoteText() {
    var parameter = this.Parameters.find(
      (val) =>
        val.ParameterName == "LabReportVerificationNeededB4Print" &&
        val.ParameterGroupName == "LAB"
    );
    if (parameter) {
      var verificationParam = JSON.parse(parameter.ParameterValue);
    }
    if (parameter && verificationParam) {
      let val = verificationParam.PreliminaryReportText;
      if (val && val != "" && val.length > 0) {
        return val;
      } else {
        return "";
      }
    } else {
      return "";
    }
  }

  public GetPreliminaryReportSignatureText() {
    var parameter = this.Parameters.find(
      (val) =>
        val.ParameterName == "LabReportVerificationNeededB4Print" &&
        val.ParameterGroupName == "LAB"
    );
    if (parameter) {
      var verificationParam = JSON.parse(parameter.ParameterValue);
    }
    if (parameter && verificationParam) {
      let val = verificationParam.PreliminaryReportSignature;
      if (val && val != "" && val.length > 0) {
        return val;
      } else {
        return "";
      }
    } else {
      return "";
    }
  }

  public EnableVerifierSignatureInLab() {
    var parameter = this.Parameters.find(
      (val) =>
        val.ParameterName == "LabReportVerificationNeededB4Print" &&
        val.ParameterGroupName == "LAB"
    );
    if (parameter) {
      var verificationParam = JSON.parse(parameter.ParameterValue);
    }
    if (parameter && verificationParam) {
      let val = verificationParam.ShowVerifierSignature;
      if (val == "true" || val == true) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public EnableDigitalSignatureInLabReport() {
    var enable = this.Parameters.find(
      (val) =>
        val.ParameterName == "EnableDigitalSignatureInLab" &&
        val.ParameterGroupName == "LAB"
    );
    if (enable) {
      let val = enable.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public AllowOutpatientWithProvisional() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "AllowLabReportToPrintOnProvisional" &&
        val.ParameterGroupName == "LAB"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public AllowPatientRegistrationFromBilling() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "AllowNewPatRegistrationFromBilling" &&
        val.ParameterGroupName.toLowerCase() == "billing"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  //sud:7Aug'19--We shouldn't use hospital code since it's used by PatientCode format and might impact in larger scale
  //it's against best practice, so revise it and make necessary corrections after checking the impacts.
  public GetHospitalCode() {
    var code = this.Parameters.find(
      (val) =>
        val.ParameterName == "HospitalCode" &&
        val.ParameterGroupName.toLowerCase() == "common"
    );
    if (code) {
      return code.ParameterValue.toLowerCase();
    } else {
      this.msgBoxServ.showMessage("error", ["Please set HospitalCode."]);
    }
  }

  public GetDotMatrixPrinterDimensions(param: number = 0) {
    let dotPrinterDimensions: any = {
      totalWidth: 50,
      totalHeight: 33,
      headerGap: 9,
      mh: 7, //changes fast
      ml: 95, //changes slow
    };

    let paramName = "";

    //0 is for main, 1 is for Insurance, 2 for insurance sticker

    switch (param) {
      case 1: {
        paramName = "DotMatrixPrinterDimensionSetting_InInsBilling";
        break;
      }
      case 2: {
        paramName = "DotMatrixPrinterDimension_Ins_Sticker";
        break;
      }
      case 3: {
        paramName = "DotMatrixPrinterDimension_Adt_Sticker";
        break;
      }
      case 4: {
        paramName = "DotMatrixPrinterDimension_Adt_DepositReceipt";
        break;
      }
      case 5: {
        paramName = "DotMatrixPrinterDimensionSetting_InInsDischarge";
        break;
      }
      case 6: {
        paramName = "DotMatrixPrinterDimensionSetting_InNormalDischargeBill";
        break;
      }
      default: {
        paramName = "DotMatrixPrinterDimensionSetting";
        break;
      }
    }

    let code = this.Parameters.find(
      (val) =>
        val.ParameterName == paramName &&
        val.ParameterGroupName.toLowerCase() == "printersetting"
    );
    if (code) {
      dotPrinterDimensions = JSON.parse(code.ParameterValue);
      for (let key in dotPrinterDimensions) {
        dotPrinterDimensions[key] = +dotPrinterDimensions[key];
      }
    } else {
      this.msgBoxServ.showMessage("error", ["Please set Printer Dimensions."]);
    }

    return dotPrinterDimensions;
  }

  public EnableDotMatrixPrintingInRegistration() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "PrintByDotMatrixInRegistrationSticker" &&
        val.ParameterGroupName.toLowerCase() == "printersetting"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public EnableDotMatrixPrintingInADT() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "PrintByDotMatrixInAdtSticker" &&
        val.ParameterGroupName.toLowerCase() == "printersetting"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public EnableDotMatrixPrintingInEmergencySticker() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "PrintByDotMatrixInEmergencySticker" &&
        val.ParameterGroupName.toLowerCase() == "printersetting"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  public EnableDotMatrixPrintingInGovInsSticker() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "PrintByDotMatrixInGovInsuranceSticker" &&
        val.ParameterGroupName.toLowerCase() == "printersetting"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  public EnableDotMatrixPrintingInVaccinationSticker() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "PrintByDotMatrixInVaccinationSticker" &&
        val.ParameterGroupName.toLowerCase() == "printersetting"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public GetDotMatrixPrinterRegStickerDimensions() {
    let dotPrinterDimensions: any = {
      totalWidth: 50,
      totalHeight: 8,
      headerGap: 0,
      mh: 2, //changes fast
      ml: 95, //changes slow
    };
    var code = this.Parameters.find(
      (val) =>
        val.ParameterName == "DotMatrixPrinterDimensionSetting_RegStickers" &&
        val.ParameterGroupName.toLowerCase() == "printersetting"
    );
    if (code) {
      dotPrinterDimensions = JSON.parse(code.ParameterValue);
      for (let key in dotPrinterDimensions) {
        dotPrinterDimensions[key] = +dotPrinterDimensions[key];
      }
    } else {
      this.msgBoxServ.showMessage("error", ["Please set Printer Dimensions."]);
    }
    return dotPrinterDimensions;
  }

  public GetPharmacyDotMatrixPrinterDimensions() {
    let dotPrinterDimensions: any = {
      totalWidth: 60,
      totalHeight: 33,
      headerGap: 0,
      mh: 2, //changes fast
      ml: 95, //changes slow
    };
    var code = this.Parameters.find(
      (val) =>
        val.ParameterName == "DotMatrixPrinterDimensionSetting_PhrmInvoice" &&
        val.ParameterGroupName.toLowerCase() == "printersetting"
    );
    if (code) {
      dotPrinterDimensions = JSON.parse(code.ParameterValue);
      for (let key in dotPrinterDimensions) {
        dotPrinterDimensions[key] = +dotPrinterDimensions[key];
      }
    } else {
      this.msgBoxServ.showMessage("error", ["Please set Printer Dimensions."]);
    }
    return dotPrinterDimensions;
  }

  public GetBillingDotMatrixPrinterSettings() {
    var code = this.Parameters.find(
      (val) =>
        val.ParameterName == "BillingPrinterSettings" &&
        val.ParameterGroupName.toLowerCase() == "printersetting"
    );
    if (code) {
      let val = JSON.parse(code.ParameterValue);
      return val;
    } else {
      this.msgBoxServ.showMessage("error", [
        "Please set Printer Settings for dot matrix printer in billing.",
      ]);
      return null;
    }
  }

  public GetHospitalNameForeHealthCard() {
    var code = this.Parameters.find(
      (val) =>
        val.ParameterName == "HospitalNameForHealthCard" &&
        val.ParameterGroupName.toLowerCase() == "common"
    );
    if (code) {
      return code.ParameterValue.toLowerCase();
    } else {
      return "default";
    }
  }

  public GetLabReportFormat() {
    var format = this.Parameters.find(
      (val) =>
        val.ParameterName == "LabReportFormat" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (format) {
      return format.ParameterValue.toLowerCase();
    } else {
      return "format1";
    }
  }

  public GetEmailSettings() {
    var param = this.Parameters.find(
      (val) =>
        val.ParameterName == "EmailSettings" &&
        val.ParameterGroupName.toLowerCase() == "radiology"
    );
    if (param) {
      var obj = JSON.parse(param.ParameterValue);
      return obj;
    } else {
      this.msgBoxServ.showMessage("error", [
        "Please set EmailSettingParameters",
      ]);
    }
  }

  public ShowIntermediateResultOfCulture() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "ShowCultureIntermediateResults" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      this.msgBoxServ.showMessage("error", [
        "Please set Value for showing/hiding Intermediate Result of Culture in Lab Report in parameters.",
      ]);
    }
  }

  public ShowHideAbnormalFlag() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "ShowHighLowNormalFlag" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public ShowLabStickerPrintOption() {
    let stickerOption = this.Parameters.find(
      (val) =>
        val.ParameterName == "LabStickerPrintOption" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (stickerOption) {
      return JSON.parse(stickerOption.ParameterValue);
    }
    return { enable: false, maximumPrintCount: 5 };
  }

  public IsReserveFeatureEnabled() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "ReservePreviousBedDuringTransferFromNursing" &&
        val.ParameterGroupName.toLowerCase() == "nursing"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public IsVaccRegNumAutoIncreamentEnabled() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "AutoIncreamentRegNumber" &&
        val.ParameterGroupName.toLowerCase() == "vaccination"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public IsTransferRemarksMandatory() {
    var remMandatory = this.Parameters.find(
      (val) =>
        val.ParameterName == "IsTransferRemarksMandatory" &&
        val.ParameterGroupName.toLowerCase() == "adt"
    );
    if (remMandatory) {
      let val = remMandatory.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public EnableRangeInRangeDescriptionStep() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "ShowRangeInRangeDescription" &&
        val.ParameterGroupName == "LAB"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      this.msgBoxServ.showMessage("error", [
        "Please set Value for using Range in Range Description in Lab Report in parameters.",
      ]);
    }
  }

  //Anish: 2 Oct for getting the time of Refreshment in Lab Requisition Page
  public GetRefreshmentTime() {
    var refreshtime = this.Parameters.find(
      (val) =>
        val.ParameterName == "LabRequisitionReloadTimeInSec" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (refreshtime) {
      let time = refreshtime.ParameterValue;
      return time;
    } else {
      //this.msgBoxServ.showMessage("error", ["Please set Refreshment time in parameters."]);
    }
  }

  public GetTimeFrameForPatReceiveVitalsEntry() {
    var bufferTime = this.Parameters.find(
      (val) =>
        val.ParameterName == "TimeFrameInMinForVitalsOfPatToBeReceived" &&
        val.ParameterGroupName.toLowerCase() == "nursing"
    );
    if (bufferTime) {
      let time = bufferTime.ParameterValue;
      return time;
    } else {
      return 480;
      //this.msgBoxServ.showMessage("error", ["Please set Refreshment time in parameters."]);
    }
  }

  public GetRadRequisitionListColmArr() {
    var colArray = this.Parameters.find(
      (val) =>
        val.ParameterName == "ImagingRequestGridColumns" &&
        val.ParameterGroupName.toLowerCase() == "radiology"
    );
    if (colArray) {
      return JSON.parse(colArray.ParameterValue);
    } else {
      return null;
      //this.msgBoxServ.showMessage("error", ["Please set Column array"]);
    }
  }

  public GetRadReportListColmArr() {
    var colArray = this.Parameters.find(
      (val) =>
        val.ParameterName == "ImagingReportGridColumns" &&
        val.ParameterGroupName.toLowerCase() == "radiology"
    );
    if (colArray) {
      return JSON.parse(colArray.ParameterValue);
    } else {
      return null;
      //this.msgBoxServ.showMessage("error", ["Please set Column array"]);
    }
  }

  public GetRequisitionListColumnArray() {
    var colArray = this.Parameters.find(
      (val) =>
        val.ParameterName == "ListRequisitionGridColumns" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (colArray) {
      return JSON.parse(colArray.ParameterValue);
    } else {
      return null;
      //this.msgBoxServ.showMessage("error", ["Please set Column array"]);
    }
  }

  public GetAddResultListColumnArray() {
    var colArray = this.Parameters.find(
      (val) =>
        val.ParameterName == "AddResultGridColumns" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (colArray) {
      return JSON.parse(colArray.ParameterValue);
    } else {
      return null;
      //this.msgBoxServ.showMessage("error", ["Please set Column array"]);
    }
  }

  public GetPendingReportListColumnArray() {
    var colArray = this.Parameters.find(
      (val) =>
        val.ParameterName == "PendingReportGridColumns" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (colArray) {
      return JSON.parse(colArray.ParameterValue);
    } else {
      return null;
      //this.msgBoxServ.showMessage("error", ["Please set Column array"]);
    }
  }

  public GetFinalReportListColumnArray() {
    var colArray = this.Parameters.find(
      (val) =>
        val.ParameterName == "FinalReportGridColumns" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (colArray) {
      return JSON.parse(colArray.ParameterValue);
    } else {
      return null;
      //this.msgBoxServ.showMessage("error", ["Please set Column array"]);
    }
  }

  public GetRouteNameAfterLabReportVerification() {
    var colArray = this.Parameters.find(
      (val) =>
        val.ParameterName == "RedirectPageAfterReportVerification" &&
        val.ParameterGroupName.toLowerCase() == "lab"
    );
    if (colArray) {
      return colArray.ParameterValue;
    } else {
      return null;
      //this.msgBoxServ.showMessage("error", ["Please set Column array"]);
    }
  }

  public GetBillingInvoiceDetailsColArray() {
    var colArray = this.Parameters.find(
      (val) =>
        val.ParameterName == "MaterializedViewGridColumns" &&
        val.ParameterGroupName.toLowerCase() == "systemadmin"
    );
    if (colArray) {
      return JSON.parse(colArray.ParameterValue);
    } else {
      return null;
      //this.msgBoxServ.showMessage("error", ["Please set Column array"]);
    }
  }

  //start: Sud:24Dec-to display application version in landing page..
  public InitializeAppSettings() {
    return this.coreBlService.GetAppSettings();
  }

  public appVersionNum: string = null;

  public SetAppVersionNum() {
    this.appVersionNum = null; //reset app version number before assigning the correct value.

    let appVerNum = this.AppSettings.ApplicationVersionNum;
    if (appVerNum) {
      this.appVersionNum = appVerNum;
    }

    //use below logic if we have to get the values from parameters.
    //let param = this.Parameters.find(a => a.ParameterGroupName == "Common" && a.ParameterName == 'ApplicationVersionNum');
    //if (param) {
    //    this.appVersionNum = param.ParameterValue;
    //}
  }
  //end: Sud:24Dec-to display application version in landing page..

  // get max number of item selection.
  public GetMaxNumberForTransferData() {
    var maxNumber = this.Parameters.find(
      (val) =>
        val.ParameterName == "MaximumTransferNumber" &&
        val.ParameterGroupName == "Accounting"
    );
    if (maxNumber) {
      let number = maxNumber.ParameterValue;
      return number;
    } else {
    }
  }
  // check manual accounting transfer.
  public CheckManualTransferData() {
    var check = false;
    var data = this.Parameters.find(
      (val) =>
        val.ParameterName == "AccountingTransfer" &&
        val.ParameterGroupName == "Accounting"
    );
    if (data) {
      check = JSON.parse(data.ParameterValue).ManualTransfer;
      return check;
    } else {
    }
  }
  //get Exchange Rate for Foreigner Patient
  public GetExchangeRate() {
    var rate;
    var data = this.Parameters.find(
      (val) =>
        val.ParameterName == "ExchangeRate" &&
        val.ParameterGroupName == "Billing"
    );
    if (data) {
      rate = JSON.parse(data.ParameterValue);
      return rate;
    } else {
    }
  }

  public AllowDuplicateItem() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "AllowDuplicateItemsEntryInBillingTransaction" &&
        val.ParameterGroupName.toLowerCase() == "billing"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public EnableDepartmentLevelAppointment(): boolean {
    var param = this.Parameters.find(
      (val) =>
        val.ParameterName == "EnableDepartmentLevelAppointment" &&
        val.ParameterGroupName.toLowerCase() == "visit"
    );
    if (param && param.ParameterValue.toLowerCase() == "true") {
      return true;
    } else {
      return false;
    }
  }
  // check death type
  public CheckDeathType() {
    var check = [];
    var data = this.Parameters.find(
      (val) =>
        val.ParameterName == "DeathDischargeType" &&
        val.ParameterGroupName == "ADT"
    );
    if (data) {
      check = JSON.parse(data.ParameterValue);
      return check;
    } else {
    }
  }

  public GetBirthType() {
    var check = [];
    var data = this.Parameters.find(
      (val) =>
        val.ParameterName == "BabyBirthType" && val.ParameterGroupName == "ADT"
    );
    if (data) {
      check = JSON.parse(data.ParameterValue);
      return check;
    } else {
    }
  }
  public GetHospital() {
    var currParameter = this.Parameters.find(
      (a) =>
        a.ParameterName == "CustomerHeader" && a.ParameterGroupName == "Common"
    );
    if (currParameter) return JSON.parse(currParameter.ParameterValue);
    else
      this.msgBoxServ.showMessage("error", [
        "Please set hospital detail in parameters.",
      ]);
  }
  public CheckTransferPrintReceipt() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "TransferPrintReceipt" &&
        val.ParameterGroupName == "ADT"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  public CheckReverseTransfer() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "ReverseTxnEnable" &&
        val.ParameterGroupName == "Accounting"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  //Start: pratik :18 Feb2020 --- for item search in IP/OP billing transaction by itemcode
  public UseItemCodeItemSearch(): boolean {
    var currParameter = this.Parameters.find(
      (a) =>
        a.ParameterName == "UseItemCodeInItemSearch" &&
        a.ParameterGroupName == "Billing"
    );
    if (currParameter) {
      let val = currParameter.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
  //End: pratik :18 Feb2020 --- for item search in IP/OP billing transaction by itemcode

  public SetShowProviderNameFlag() {
    var currval = this.Parameters.find(
      (a) =>
        a.ParameterGroupName == "Bill Print" &&
        a.ParameterName == "ShowAssignedDoctorInReceipt"
    ).ParameterValue;
    if (currval == "true") {
      return true;
    } else {
      return false;
    }
  }

  public LoadFooterNoteSettingsFromParameter() {
    let param = this.Parameters.find(
      (p) =>
        p.ParameterGroupName == "Billing" &&
        p.ParameterName == "ProvisionalSlipFooterNoteSettings"
    );
    if (param) {
      let paramValueStr = param.ParameterValue;
      if (paramValueStr) {
        var provSlipFooterParam = JSON.parse(paramValueStr);
        return provSlipFooterParam;
      }
    }
  }

  public LoadCreditOrganizationMandatory() {
    var currParameter = this.Parameters.find(
      (a) =>
        a.ParameterName == "CreditOrganizationMandatory" &&
        a.ParameterGroupName == "Billing"
    );
    if (currParameter) {
      let val = currParameter.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  public GetQueueNoSetting() {
    var currParameter = this.Parameters.find(
      (a) =>
        a.ParameterName == "QueueNoSetting" &&
        a.ParameterGroupName == "Appointment"
    );
    if (currParameter) {
      var val = JSON.parse(currParameter.ParameterValue);
      return val;
    }
  }

  public LoadOPBillRequestDoubleEntryWarningTimeHrs() {
    let param = this.Parameters.find(
      (p) =>
        p.ParameterGroupName == "Billing" &&
        p.ParameterName == "OPBillRequestDoubleEntryWarningTimeHrs"
    );
    if (param) {
      let paramValueStr = param.ParameterValue;
      if (paramValueStr) {
        var curParam = JSON.parse(paramValueStr);
        return curParam;
      }
    }
  }

  public LoadInsBillRequestDoubleEntryWarningTimeHrs() {
    let param = this.Parameters.find(
      (p) =>
        p.ParameterGroupName == "Insurance" &&
        p.ParameterName == "InsBillRequestDoubleEntryWarningTimeHrs"
    );
    if (param) {
      let paramValueStr = param.ParameterValue;
      if (paramValueStr) {
        var curParam = JSON.parse(paramValueStr);
        return curParam;
      }
    }
  }

  //to prevent scroll on number field, needed for Qty, Price, Discount etc in billing and related pages.
  //It can be re-used over all modules.
  public PreventNumberChangeOnScroll(evt) {
    evt.preventDefault();
  }

  public selectAutoCom(resTableWithAutoComHolder: HTMLInputElement) {
    if (
      resTableWithAutoComHolder.style.overflow &&
      resTableWithAutoComHolder.style.overflow === "inherit"
    ) {
      resTableWithAutoComHolder.style.overflow = "auto";
    } else {
      resTableWithAutoComHolder.style.overflow = "inherit";
    }
  }

  //start:mumbai team: 25Feb2020- for Accounting code details.
  public GetCodeDetails() {
    return this.coreBlService.GetCodeDetails();
  }

  public GetFiscalYearList() {
    return this.coreBlService.GetFiscalYearList();
  }
  public SetCodeDetails(res) {
    if (res.Status == "OK") {
      this.CodeDetails = res.Results;
    }
  }
  public SetFiscalYearList(res) {
    if (res.Status == "OK") {
      this.accFiscalYearList = res.Results;
    }
  }
  //End:mumbai team: 25Feb2020- for Accounting code details.

  // START:VIKAS: 22 Apr 2020: get user level date preference
  public getCalenderDatePreference() {
    return this.coreBlService.getCalenderDatePreference();
  }
  public SetCalenderDatePreference(res) {
    if (res.Status == "OK") {
      let data = res.Results;
      this.DatePreference = data != null ? data.PreferenceValue : "np"; //sud:8Aug'20--hardcoded for temporary purpose.. pls correct this later..
      //sud:29May'20-Re-writing the logic and adding null check on this.Parameters.
      //sometimes this.parameters is not yet loaded when this funciton is called..
      if (
        this.DatePreference == "" &&
        this.Parameters &&
        this.Parameters.length > 0
      ) {
        let param = this.Parameters.find(
          (p) =>
            p.ParameterName == "CalendarDatePreference" &&
            p.ParameterGroupName.toLowerCase() == "common"
        );
        if (param) {
          let paramValueObj = JSON.parse(param.ParameterValue);
          if (paramValueObj != null) {
            if (paramValueObj.np) {
              this.DatePreference = "np";
            } else {
              this.DatePreference = "en";
            }
          }
        }
      }
    }
  }
  //END:VIKAS : 22 Apr 2020: get user level date preference

  public GetExcludedOPpages(pageName: string) {
    let retVal = [];
    let param = this.Parameters.find(
      (p) =>
        p.ParameterName == "ExcludeInOp" &&
        p.ParameterGroupName.toLowerCase() == "nursing"
    );
    if (param) {
      let jsonData = JSON.parse(param.ParameterValue);
      if (pageName && pageName.length > 0 && jsonData) {
        if (jsonData[pageName]) {
          return jsonData[pageName];
        }
      }
    }
    return retVal;
  }

  public GetBufferTimeForReceivedOn() {
    let param = this.Parameters.find(
      (p) =>
        p.ParameterName == "ReceivedOnDateBufferTime" &&
        p.ParameterGroupName.toLowerCase() == "nursing"
    );
    if (param) {
      let min = +param.ParameterValue;
      return min;
    }
    return 10;
  }

  //sud:29May'20--for Calendar Settings.
  public GetSoftwareStartYear_Np(): number {
    let retValue = 2073; //this is the year our software was started.. (1st Version in MNK Hospital)
    if (this.Parameters) {
      let param = this.Parameters.find(
        (p) =>
          p.ParameterName == "SoftwareStartYearInBS" &&
          p.ParameterGroupName.toLowerCase() == "common"
      );
      if (param) {
        retValue = +param.ParameterValue; //it changes string to number
      }
    }
    return retValue;
  }

  public HoldRadIPBillBeforeScan() {
    var hold = this.Parameters.find(
      (val) =>
        val.ParameterName == "RadHoldIPBillBeforeScan" &&
        val.ParameterGroupName.toLowerCase() == "radiology"
    );
    if (hold) {
      let val = hold.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public GetRadiologyScanCondition() {
    var scan = this.Parameters.find(
      (val) =>
        val.ParameterName == "EnableRadScan" &&
        val.ParameterGroupName.toLowerCase() == "radiology"
    );
    if (scan) {
      let val = scan.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public GetIpBillCancellationRule() {
    var canclrule = this.Parameters.find(
      (val) =>
        val.ParameterName == "CancellationRules" &&
        val.ParameterGroupName.toLowerCase() == "common"
    );

    if (canclrule) {
      return JSON.parse(canclrule.ParameterValue);
    }
    return canclrule;
  }

  public GetOpBillCancellationRule() {
    var canclrule = this.Parameters.find(
      (val) =>
        val.ParameterName == "CancellationRules" &&
        val.ParameterGroupName.toLowerCase() == "common"
    );

    if (canclrule) {
      return JSON.parse(canclrule.ParameterValue);
    }
    return canclrule;
  }

  public GetBillItemsReturnRestrictionRules() {
    var restrictRule = this.Parameters.find(
      (val) =>
        val.ParameterName == "BillItemsReturnRestrictionRules" &&
        val.ParameterGroupName.toLowerCase() == "common"
    );

    if (restrictRule) {
      return JSON.parse(restrictRule.ParameterValue);
    }
    return restrictRule;
  }

  public GetIpBillOrderStatusSettingB4Discharge() {
    var DischargeRule = this.Parameters.find(
      (val) =>
        val.ParameterName == "OrderStatusSettingB4Discharge" &&
        val.ParameterGroupName == "Billing"
    );
    if (DischargeRule) {
      return JSON.parse(DischargeRule.ParameterValue);
    }

    return DischargeRule;
  }

  //sud: Copied from IpBilling-OrderStatus, this can be overwritten later after merging.
  public LoadIPBillRequestDoubleEntryWarningTimeHrs(): number {
    let param = this.Parameters.find(
      (p) =>
        p.ParameterGroupName == "Billing" &&
        p.ParameterName == "IPBillRequestDoubleEntryWarningTimeHrs"
    );
    if (param) {
      let paramValueStr = param.ParameterValue;
      if (paramValueStr) {
        var provSlipFooterParam = JSON.parse(paramValueStr);
        return parseInt(provSlipFooterParam);
      }
    } else {
      return 0;
    }
  }

  public UpdateAssignedToDoctorFromAddReportSignatory() {
    var show = this.Parameters.find(
      (val) =>
        val.ParameterName == "Rad_UpdateAssignedToDoctorOnAddReport" &&
        val.ParameterGroupName.toLowerCase() == "radiology"
    );
    if (show) {
      let val = show.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public AddReportWOSignatory() {
    var allow = this.Parameters.find(
      (val) =>
        val.ParameterName == "RadiologyReportAddWithOutSignatories" &&
        val.ParameterGroupName.toLowerCase() == "radiology"
    );

    if (allow) {
      let val = allow.ParameterValue.toLowerCase();
      if (val == "true") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public GetIsPhoneNumberMandatory() {
    var phoneParameter = this.Parameters.find(
      (a) =>
        a.ParameterGroupName == "Patient" &&
        a.ParameterName == "PhoneNumberMandatory"
    );
    let phoneNum = JSON.parse(phoneParameter.ParameterValue);

    return phoneNum;
  }
  public GetLabTypes() {
    return this.coreBlService.GetLabTypes();
  }

  public SetLabTypes(res) {
    // let PermName = ['erlab', 'oplab'];
    let i = 0;
    if (res.Status == "OK") {
      this.labTypes = res.Results;
      if (res.Results.length == 1) {
        this.singleLabType = true;
      }
      //our permission name is in format: 'lab-type-erlab' 'lab-type-oplab'...
      this.labTypes.forEach(W => {
        W.PermName = W.LabTypeName.replace('-', '');
        i++;
      });
    }
  }

  public ShowMunicipality() {
    var showMun = this.Parameters.find(
      (a) =>
        a.ParameterGroupName == "Common" && a.ParameterName == "AddressSettings"
    );
    let param = JSON.parse(showMun.ParameterValue);
    return param;
  }

  public GetBillingRequestDisplaySettings() {
    var StrParam = this.Parameters.find(
      (a) =>
        a.ParameterGroupName == "Billing" &&
        a.ParameterName == "BillingRequestDisplaySettings"
    );
    if (StrParam && StrParam.ParameterValue) {
      let currParam = JSON.parse(StrParam.ParameterValue);
      return currParam;
    }
  }

  // /** gets the core params for the BillingPackageInvoiceColumnSelection*/
  // public GetBillingPackageInvoiceColumnSelection() {
  //   var StrParam = this.Parameters.find(a => a.ParameterGroupName == "Billing" && a.ParameterName == "BillingPackageInvoiceColumnSelection");
  //   if (StrParam && StrParam.ParameterValue) {
  //     let currParam = JSON.parse(StrParam.ParameterValue);
  //     return currParam;
  //   }
  // }

  // // end of GetBillingPackageInvoiceColumnSelection

  public GetInsBillRequestDisplaySettings() {
    var StrParam = this.Parameters.find(
      (a) =>
        a.ParameterGroupName == "Insurance" &&
        a.ParameterName == "InsBillRequestDisplaySettings"
    );
    if (StrParam && StrParam.ParameterValue) {
      let currParam = JSON.parse(StrParam.ParameterValue);
      return currParam;
    }
  }

  public GetMaternityAncNumberOfAllowedVisits() {
    var StrParam = this.Parameters.find(
      (a) =>
        a.ParameterGroupName == "Maternity" &&
        a.ParameterName == "MaternityAncVisit"
    );
    if (StrParam && StrParam.ParameterValue) {
      let currParam = JSON.parse(StrParam.ParameterValue);
      return currParam;
    }
  }

  public GetInvoiceDisplaySettings() {
    var StrParam = this.Parameters.find(
      (a) =>
        a.ParameterGroupName == "Billing" &&
        a.ParameterName == "InvoiceDisplaySettings"
    );
    if (StrParam && StrParam.ParameterValue) {
      let currParam = JSON.parse(StrParam.ParameterValue);
      return currParam;
    }
  }
  public GetInvoiceFooterNoteSettings() {
    var StrParam = this.Parameters.find(
      (a) =>
        a.ParameterGroupName == "Billing" &&
        a.ParameterName == "BillingInvoiceFooterNoteSettings"
    );
    if (StrParam && StrParam.ParameterValue) {
      let currParam = JSON.parse(StrParam.ParameterValue);
      return currParam;
    }
  }

  public GetAdditionalBillItemsInAdmission() {
    var param = this.Parameters.find(
      (val) =>
        val.ParameterName == "AdditionalBillItemsInAdmission" &&
        val.ParameterGroupName.toLowerCase() == "admission"
    );
    if (param) {
      var obj = JSON.parse(param.ParameterValue);
      return obj || [];
    } else {
      this.msgBoxServ.showMessage("error", [
        "Please set Additional BillItems settings in Admission",
      ]);
      return [];
    }
  }

  public GetNewAdmissionSettings(moduleName: string) {
    let defData = {
      IsBillingEnabled: false,
      IsDepositEnabled: false,
      IsDiscountSchemeEnabled: false,
    };
    var param = this.Parameters.find(
      (val) =>
        val.ParameterName == "NewAdmissionSettings" &&
        val.ParameterGroupName.toLowerCase() == "admission"
    );
    if (param) {
      var obj = JSON.parse(param.ParameterValue);
      let dataToReturn = obj.find(
        (o) => o.Module.toLowerCase() == moduleName.toLowerCase()
      );
      return dataToReturn ? dataToReturn : defData;
    } else {
      this.msgBoxServ.showMessage("error", [
        "Please set New Admission Settings",
      ]);
      return defData;
    }
  }

  public SetQZTrayObject() {
    //Alternate method 2 - direct
    this.QzTrayObject = qz;
    this.QzTrayObject.security.setCertificatePromise(function (
      resolve,
      reject
    ) {
      resolve(
        "-----BEGIN CERTIFICATE-----\n" +
        "MIID/zCCAuegAwIBAgIUHLAudnma7zysXlSYT2CMFZS5kkYwDQYJKoZIhvcNAQEL\n" +
        "BQAwgY0xCzAJBgNVBAYTAklOMRQwEgYDVQQIDAtNQUhBUkFTSFRSQTEPMA0GA1UE\n" +
        "BwwGTVVNQkFJMRQwEgYDVQQKDAtURVNUQ09NUEFOWTELMAkGA1UECwwCSVQxDDAK\n" +
        "BgNVBAMMA05CQjEmMCQGCSqGSIb3DQEJARYXc3VwcG9ydEB0ZXN0Y29tcGFueS5j\n" +
        "b20wIBcNMjEwNDA4MTAxODU1WhgPMjA1MjEwMDExMDE4NTVaMIGNMQswCQYDVQQG\n" +
        "EwJJTjEUMBIGA1UECAwLTUFIQVJBU0hUUkExDzANBgNVBAcMBk1VTUJBSTEUMBIG\n" +
        "A1UECgwLVEVTVENPTVBBTlkxCzAJBgNVBAsMAklUMQwwCgYDVQQDDANOQkIxJjAk\n" +
        "BgkqhkiG9w0BCQEWF3N1cHBvcnRAdGVzdGNvbXBhbnkuY29tMIIBIjANBgkqhkiG\n" +
        "9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsS1DLcb43EHRGbih1jy8j5wShq9yNrOntM+0\n" +
        "1jjKecSjI6y0FezpILFOFBf5sdE3oOs/lJt7Ff46cAgTIAJw2d3izj/oHpoz6rwx\n" +
        "qfr1bYg9g/fLREpwfmntJ2F7S3jmQbFtM7Sfrrfvr0CKxIBzo4fn8JRoy9hmBql7\n" +
        "2jNUlFeVtF9ybThqN0g8tL2GqdtVtx5KSSQSf9r/9xDck/eys6AUTM1LVcdUUnMj\n" +
        "F+RpQVX305YwWq56/HBQkOYm37IEBcQAunag6t6mQLHZeOz/TVs86Vqo0oIQ2TKe\n" +
        "/Hqekhq3Ms4bRTxxzMv8kl0aZ1OoaaU0JlKFvKlQQX6tV/IiBQIDAQABo1MwUTAd\n" +
        "BgNVHQ4EFgQUNRcOZDPjkDwTqywU4STm+jBRu24wHwYDVR0jBBgwFoAUNRcOZDPj\n" +
        "kDwTqywU4STm+jBRu24wDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOC\n" +
        "AQEADmP9auCyaGNHtajFsvlWQ+J+35YswO4nLaYnWyeCIVIqRJmAoVmdUoE5ZozG\n" +
        "qgyd7+qxw3hHqUNjRM+MZ3CdiKObsga0LTgVh4l0hePt1ASfrk6xpRTGGeNAayCy\n" +
        "RaRzhqRyTKmVEF1Q0aL5vEuU53VXVLJVwC3rlVcfMOADkhgi880w5sQyI+KB62Lo\n" +
        "vnGwZlq2MlfloLt0SR5ibkQw+GEac/9e+ttyRtIZral+hqJxlKnJXpmNQN3FUrhH\n" +
        "rT2yb8HlWzUfdhV5qB8ZDvC8NbzSzOULE//juouAUOAm78e+/1LQDTbYsh3oeHwF\n" +
        "ewTnjiY2eE/gY695iRMfZGjm/g==\n" +
        "-----END CERTIFICATE-----\n"
      );
    });
    var privateKey =
      "-----BEGIN PRIVATE KEY-----\n" +
      "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCxLUMtxvjcQdEZ\n" +
      "uKHWPLyPnBKGr3I2s6e0z7TWOMp5xKMjrLQV7OkgsU4UF/mx0Teg6z+Um3sV/jpw\n" +
      "CBMgAnDZ3eLOP+gemjPqvDGp+vVtiD2D98tESnB+ae0nYXtLeOZBsW0ztJ+ut++v\n" +
      "QIrEgHOjh+fwlGjL2GYGqXvaM1SUV5W0X3JtOGo3SDy0vYap21W3HkpJJBJ/2v/3\n" +
      "ENyT97KzoBRMzUtVx1RScyMX5GlBVffTljBarnr8cFCQ5ibfsgQFxAC6dqDq3qZA\n" +
      "sdl47P9NWzzpWqjSghDZMp78ep6SGrcyzhtFPHHMy/ySXRpnU6hppTQmUoW8qVBB\n" +
      "fq1X8iIFAgMBAAECggEAedkF/WJ8XYXKFyVZ72tfxmfweb4JD0Ooj3nVBQqTfQDV\n" +
      "rUAlrXp7raciakE+0KJw3nNLC5mOIcbwS4HSHU5wa/Tj+TIMIZetIr8AbMURqp1q\n" +
      "qOpuWW3URav1lAK/d10TBZTO5CNROih3ZxA9Hvy0Cn/57AM0uxP8vpIqghqRDV60\n" +
      "/bQaZ0N7lFhQIojON0nBQ9EH2z8iZLxHgNELLrxV51VLWsEhkQtCXw7zvavoYxw2\n" +
      "zmDa0qHjPe4mhw1Bfl8aKr7eluKY08dDX+k2UfgUWTFOp591Aq1rPCyK1EOwXyt4\n" +
      "nz883BKEgIO+/nzZH5R7NP2UMOhvmEL4lTyQFgDYwQKBgQDk22fkmRLMUUgE2zH+\n" +
      "oqlAXoq+uXgokrT2gKVXn8cj/NoS9X6E6tw/L9FKpWgWd9whhKAj98nOtbv5lFJi\n" +
      "FNMz8z86rJfdIaZMlhrsdiNuK+yzRkKqDfG3Nb4LOK/0F2TYrjCV/WyfRKNZiv1d\n" +
      "gH5rFLhNeTi1pwc553ZCqfN8EQKBgQDGMLuSyQJeOMT07gQOHopRYqDN0OTp9Jux\n" +
      "/zCFnqK7U3QADp5yEdozD56hvYOH59TrwhbpSv5nW2N18OrlTQFmherirrI90S7Q\n" +
      "EydXo54wAJYzkc2rdDI2JxJpN7LxZN87S6nZ5INffBlNxwbn8oqii5zqUeZ96LaM\n" +
      "G1TSPobKtQKBgQCpLaSEsb/auG9z35H6ucZCZmFMkpDH9YO/AeS4fM3axa1z/HTV\n" +
      "z0SXlUKzWskyatKZGJDFZgSSQXg/DK1GAj0LF1NzjWkKODjWPtSSXtbcN65X7KWV\n" +
      "To+ULy9Y3kP8Plr3bvVNu7TTnArhQ8T+nOFXSU7hPq50YpAN9xROPZJX8QKBgGna\n" +
      "P2S/nVcrpO5YbawI3cFoFxC2QH1AWyPvcz/6oVnB0dPx+uhb5pmc/xHNwYGF7e/Z\n" +
      "YxlJJ6WWZwHoId1EirnyTqixu5tOrV0OzdV+Gw/yUEbM2fd4ARVxOuEdkaJiSORH\n" +
      "njk1VoFaK72hzmt13FvCi5WPFrcq4szkECKWqLF9AoGABWVfGh8dFTkq6F4I+TlI\n" +
      "nRnnYg0H5rXc+rOaiz6+ccAlpFc8PhkZfcfyiPg9WgbRo+za+pbCP/AvZMdCFJ7r\n" +
      "ls/piOCFCmqNPc1FnEB7M7pZVhS0ayWuLNy1zRzz4bXZNiYb1StAmmZmzTkkTNQv\n" +
      "yBStj7Ka0FRa+Q7X+utUJ3I=\n" +
      "-----END PRIVATE KEY-----\n";

    this.QzTrayObject.security.setSignatureAlgorithm("SHA512"); // Since 2.1
    this.QzTrayObject.security.setSignaturePromise(function (toSign) {
      return function (resolve, reject) {
        try {
          var pk = KEYUTIL.getKey(privateKey);
          var sig = new KJUR.crypto.Signature({ alg: "SHA512withRSA" }); // Use "SHA1withRSA" for QZ Tray 2.0 and older
          //var sig = new KJUR.crypto.Signature({"alg": "SHA1withRSA"});
          sig.init(pk);
          sig.updateString(toSign);
          var hex = sig.sign();
          resolve(stob64(hextorstr(hex)));
        } catch (err) {
          console.error(err);
          reject(err);
        }
      };
    });
  }

  public GetAdmissionCases() {
    var StrParam = this.Parameters.find(
      (a) =>
        a.ParameterGroupName == "ADT" && a.ParameterName == "AdmissionCases"
    );
    let currParm = JSON.parse(StrParam.ParameterValue);
    return currParm;
  }

  //function to focus and select.
  //We need to pass the targetId and waitTime in milliseconds before focus jumps into the given html control.
  //Internally we decide whether to select the content or not.
  public FocusInputById(targetId: string, waitTimeInMs: number = 100) {
    let timer = window.setTimeout(function () {
      let htmlObject: any = document.getElementById(targetId);
      if (htmlObject) {
        htmlObject.focus();
        let elemType = htmlObject.type;
        //content selection is applied for below content types. Not applicable For other only focus is applied.
        if (
          elemType == "text" ||
          elemType == "number" ||
          elemType == "tel" ||
          elemType == "password"
        ) {
          htmlObject.select();
        }
      }
      clearTimeout(timer);
    }, waitTimeInMs);
  }

  //pratik:May:27,2021
  public AllPrinterSettings: Array<PrinterSettingsModel> = [];
  public GetPrinterSettings() {
    return this.coreBlService.GetPrinterSettingList();
  }
  public SetPrinterSettings(res) {
    //this.AllPrinterSettings = PrinterSettingsModel.GetAllPrinterSettings();
    if (res.Status == "OK") {
      this.AllPrinterSettings = res.Results;
    }
  }

  //Anjana: May27, 2021: Get all municipalities based on CountrySubDivisionId

  public GetAllMunicipalities() {
    this.coreBlService.GetAllMunicipalities().subscribe((res) => {
      if (res.Status == "OK") {
        this.allMunicipalities = res.Results;
      } else {
        this.msgBoxServ.showMessage("Failed", [
          "Failed to get municipalities.",
        ]);
      }
    });
  }

  public GetPrintExportConfiguration() {
    this.coreBlService.GetPrintExportConfiguration().subscribe((res) => {
      if (res.Status == "OK") {
        this.allPrintExportConfiguration = res.Results;
      } else {
        this.msgBoxServ.showMessage("Failed", [
          "Failed to get printexportconfiguration.",
        ]);
      }
    });
  }

  public GetPaymentModeSettings() {
    this.coreBlService.GetPaymentModeSettings().subscribe((res) => {
      if (res.Status == "OK") {
        this.paymentModeSettings = res.Results;
      }
    });
  }

  public GetPaymentModes() {
    this.coreBlService.GetPaymentModes().subscribe((res) => {
      if (res.Status == "OK") {
        this.masterPaymentModes = res.Results;
      }
    });
  }

  public GetPaymentPages() {
    this.coreBlService.GetPaymentPages().subscribe((res) => {
      if (res.Status == "OK") {
        this.paymentPages = res.Results;
      }
    });
  }

  public GetMembershipTypeVsPriceCategoryMapping() {
    this.coreBlService.GetMembershipTypeVsPriceCategoryMapping().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.membershipTypeVsPriceCategoryMapping = res.Results;
      }
    });
  }

  public GetMunicipalityByCountryAndSubDivisionId(id) {
    if (id > 0 && this.allMunicipalities && this.allMunicipalities.length) {
      return this.allMunicipalities.find((m) => m.CountrySubDivisionId == id);
    }
  }

  public SetCalendarADBSButton() {
    var calParameter = this.Parameters.find(
      (a) => a.ParameterName == "ShowCalendarADBSButton"
    );
    if (calParameter)
      this.showCalendarADBSButton = JSON.parse(calParameter.ParameterValue);
    else
      this.msgBoxServ.showMessage("error", [
        "Please set showCalendarADBSButton in parameters.",
      ]);
  }

  public SetLocalNameFormControl() {
    var localNameParameter = this.Parameters.find(
      (a) => a.ParameterName == "ShowLocalNameFormControl"
    );
    if (localNameParameter)
      this.showLocalNameFormControl = JSON.parse(
        localNameParameter.ParameterValue
      );
    else
      this.msgBoxServ.showMessage("error", [
        "Please set showLocalNameFormControl in parameters.",
      ]);
  }

  public SetCountryMapOnLandingPage() {
    var mapParameter = this.Parameters.find(
      (a) => a.ParameterName == "ShowCountryMapOnLandingPage"
    );
    if (mapParameter) {
      this.showCountryMapOnLandingPage = JSON.parse(
        mapParameter.ParameterValue
      );
    } else
      this.msgBoxServ.showMessage("error", [
        "Please set showCountryMapOnLandingPage in parameters.",
      ]);
  }


  public GetAllGovLabComponents() {
    this.coreBlService.GetAllGovLabComponents().subscribe(
      (res) => {
        if (res.Status == "OK") {
          this.allGovItems = res.Results;
        } else {
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
      (err) => {
        this.msgBoxServ.showMessage("error", [
          "Failed to get ReportTemplate List",
        ]);
      }
    );
  }
  public GetCommonEmailSettings() {
    var email = this.Parameters.find(
      (val) =>
        val.ParameterName === "EmailSettings" &&
        val.ParameterGroupName === "Common"
    );
    if (email) {
      var obj = JSON.parse(email.ParameterValue);
      return obj;
    } else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [
        "Please set EmailSettingParameters",
      ]);
    }
  }

  public GetPharmacySubstoreAndSubcategory() {
    var format = this.Parameters.find(
      (val) =>
        val.ParameterName == "AccountingInventoryConsumptionLevel" &&
        val.ParameterGroupName.toLowerCase() == "accounting"
    );
    if (format) {
      return format.ParameterValue.toLowerCase();
    } else {
      return "inventorysubstore";
    }
  }
  public GetFieldLabelParameter(): GeneralFieldLabels {
    if (this.Parameters) {
      const param = this.Parameters.find(a => a.ParameterGroupName === 'Employeelabel' && a.ParameterName === 'FieldLabels');
      if (param) {
        const paramValue = JSON.parse(param.ParameterValue);
        let obj = new GeneralFieldLabels();
        obj.NMCNo = paramValue.NMCNo;
        obj.NNCNo = paramValue.NNCNo;
        obj.NHPCNo = paramValue.NHPCNo;
        obj.PANNo = paramValue.PANNo;
        obj.TDS = paramValue.TDS;
        obj.NSHINo = paramValue.NSHINo;
        obj.Municipality = paramValue.Municipality;
        obj.showNam_Thar = paramValue.showNam_Thar;
        obj.DistrictState = paramValue.DistrictState;
        obj.NTSCNo = paramValue.NTSCNo;
        obj.NSSINo = paramValue.NSSINo;
        obj.IMISCode = paramValue.IMISCode;
        obj.Caste = paramValue.Caste;
        return obj;
      }

    }
  }
  //public AllMembershipTypes: Array<Membership> = [];
  public AllMembershipTypes = [];// /*Manipal-RevisionNeeded*/ sud:29Mar'23--Need to change the type to Array<BillingScheme>
  public SetAllMembershipTypes(results) {
    this.AllMembershipTypes = results;
  }

  SetSameDependentIdApplicableCount(SameDependentIdApplicableCount: number) {
    this.SameDependentIdApplicableCount = SameDependentIdApplicableCount;
  }

  public GetSchemeList(billingContext: string) {
    this.coreBlService.GetBillingSchemesDtoList(billingContext).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.setSchemeList(res.Results);
      }
    });
  }
  public setSchemeList(schemes: Array<BillingScheme_DTO>) {
    this.SchemeList = schemes;
  }

  public GetInsuranceMasterItems() {
    this.coreBlService.GetInsuranceMasterItems().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.setInsuranceMasterItems(res.Results);
      }
    });
  }

  public setInsuranceMasterItems(masterItems: Array<InsuranceMasterItems_DTO>) {
    this.InsuranceMasterItems = masterItems;
  }
  FocusButtonById(id: string) {
    const button = document.getElementById(id) as HTMLButtonElement;
    if (button) {
      button.focus();
    }
  }
  // check if isDemoEnvironment ? --incase of demo environment use this to hide certain features
  public isDemoEnvironment: boolean = false;
  public CheckIfIsDemo() {
    this.isDemoEnvironment = null;

    let isDemo = this.AppSettings.DemoEnvironment;
    if (isDemo) {
      this.isDemoEnvironment = isDemo.IsDemoEnvironment;
    }
  }

  public EnableFewaPay: boolean = false;
  public SetFewaPayConfig() {
    this.EnableFewaPay = this.AppSettings.EnableFewaPay;
  }

  public EnableDirectFonePay: boolean = false;
  public SetDirectFonePayConfig() {
    this.EnableDirectFonePay = this.AppSettings.EnableDirectFonePay;
  }

  public GetCurrentFiscalYear() {
    this.coreBlService.GetCurrentFiscalYear().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.CurrentFiscalYearDetails = res.Results;
      }
    });
  }


  GetActivePharmacyPackages() {
    this.Packages = [];
    this.coreBlService.GetActivePharmacyPackages()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.Packages = res.Results;

        }
        else {
          console.log('Failed to get Packages' + res.ErrorMessage);
        }
      },
        err => {
          console.log('Failed to get Packages' + err.ErrorMessage);
        });
  }

  GetActivePharmacyPackageItems() {
    this.PackageItems = [];
    this.coreBlService.GetActivePharmacyPackageItems()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.PackageItems = res.Results;
        }
        else {
          console.log('Failed to get Package Items' + res.ErrorMessage);
        }
      },
        err => {
          console.log('Failed to get Package items' + err.ErrorMessage);
        });
  }

  ParsePatientAddressDisplayParam(parameterValue: string, addressOf: string = ""): void {
    const parsedSettings = JSON.parse(parameterValue);

    let patientAddress = parsedSettings.find(f => f.ShowPatientAddress);
    if (patientAddress) {
      if (addressOf === 'global_patient_address') {
        this.PatientAddressDisplaySettings.ShowPatientAddress = patientAddress.ShowPatientAddress;
      }
      else {
        this.PatientAddressDisplaySettings.ShowPatientAddress = true;
      }
    }

    let country = parsedSettings.find(f => f.ShowCountry);
    if (country) {
      this.PatientAddressDisplaySettings.ShowCountry = country.ShowCountry;
      this.PatientAddressDisplaySettings.CountryDisplaySequence = parseInt(country.CountryDisplaySequence) || 0;
    }

    let countrySubDivision = parsedSettings.find(f => f.ShowCountrySubDivision);
    if (countrySubDivision) {
      this.PatientAddressDisplaySettings.ShowCountrySubDivision = countrySubDivision.ShowCountrySubDivision;
      this.PatientAddressDisplaySettings.CountrySubDivisionDisplaySequence = parseInt(countrySubDivision.CountrySubDivisionDisplaySequence) || 0;
    }

    let municipality = parsedSettings.find(f => f.ShowMunicipality);
    if (municipality) {
      this.PatientAddressDisplaySettings.ShowMunicipality = municipality.ShowMunicipality;
      this.PatientAddressDisplaySettings.MunicipalityDisplaySequence = parseInt(municipality.MunicipalityDisplaySequence) || 0;
    }

    let wardNumber = parsedSettings.find(f => f.ShowWardNumber);
    if (wardNumber) {
      this.PatientAddressDisplaySettings.ShowWardNumber = wardNumber.ShowWardNumber;
      this.PatientAddressDisplaySettings.WardNumberDisplaySequence = parseInt(wardNumber.WardNumberDisplaySequence) || 0;
    }

    let address = parsedSettings.find(f => f.ShowAddress);
    if (address) {
      this.PatientAddressDisplaySettings.ShowAddress = address.ShowAddress;
      this.PatientAddressDisplaySettings.AddressDisplaySequence = parseInt(address.AddressDisplaySequence) || 0;
    }
  }

  GetCurrentModule(): string {
    const regex = /^\/([^\/]*)/;
    const url = this._router.url;
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    else {
      return "";
    }
  }

  SortPatientAddress(patient: any, addressOf: string = ""): string { //! Sanjeev : This method will be called from different component, those component have different patient object types. That's why here, receiving patient as type `any` instead of type `Patient`
    if (!patient) {
      console.error("Patient object is null. So address can't be sorted.");
      return '';
    }
    let patientAddress = {
      Address: patient.Address ? patient.Address : null,
      MunicipalityName: patient.MunicipalityName ? patient.MunicipalityName : null,
      CountrySubDivisionName: patient.CountrySubDivisionName ? patient.CountrySubDivisionName : null,
      CountryName: patient.CountryName ? patient.CountryName : null,
      WardNumber: patient.WardNumber ? patient.WardNumber : null
    };
    //! Sanjeev : Get PatientAddressDisplaySettings parameter values.
    let patientAddressDisplayParam = this.Parameters.find(a => a.ParameterGroupName === 'Billing' && a.ParameterName === 'PatientAddressDisplaySettings');

    if (patientAddressDisplayParam && patientAddressDisplayParam.ParameterValue) {
      this.ParsePatientAddressDisplayParam(patientAddressDisplayParam.ParameterValue, addressOf);
    }
    else {
      console.error("Unable to get parameter for ParameterName : 'PatientAddressDisplaySettings'.");
      return '';
    }

    const displaySettings = this.PatientAddressDisplaySettings;

    //! Sanjeev : Create an array with the address properties and their display sequences
    let addressProperties = [
      { name: 'CountryName', sequence: displaySettings.CountryDisplaySequence, show: displaySettings.ShowCountry },
      { name: 'CountrySubDivisionName', sequence: displaySettings.CountrySubDivisionDisplaySequence, show: displaySettings.ShowCountrySubDivision },
      { name: 'MunicipalityName', sequence: displaySettings.MunicipalityDisplaySequence, show: displaySettings.ShowMunicipality },
      { name: 'WardNumber', sequence: displaySettings.WardNumberDisplaySequence, show: displaySettings.ShowWardNumber },
      { name: 'Address', sequence: displaySettings.AddressDisplaySequence, show: displaySettings.ShowAddress },
    ];

    //! Sanjeev : Filter properties based on the show property being true and then sort based on sequence
    let sortedAddressProperties = addressProperties
      .filter(property => property.show)
      .sort((a, b) => a.sequence - b.sequence);

    //! Sanjeev : Construct the sorted address string
    let sortedAddressParts = sortedAddressProperties
      .filter(property => patientAddress[property.name] !== undefined) // Filter out undefined properties
      .map(property => patientAddress[property.name]); // Map properties to their values

    //! Sanjeev : Find indexes of null values in sortedAddressParts
    let nullIndexes = sortedAddressParts.reduce((acc, currentValue, index) => {
      if (currentValue === null || currentValue === '' || currentValue === undefined) {
        acc.push(index);
      }
      return acc;
    }, []);

    //! Sanjeev : Remove items from sortedAddressParts and sortedAddressProperties at null indexes
    sortedAddressParts = sortedAddressParts.filter((_, index) => !nullIndexes.includes(index));
    sortedAddressProperties = sortedAddressProperties.filter((_, index) => !nullIndexes.includes(index));

    const wardNumberIndex = sortedAddressProperties.findIndex(property => property.name === 'WardNumber');

    if (wardNumberIndex !== -1) {
      //! Sanjeev : If display sequence of WardNumber is other than first then, append between the previous address part and ward number and then remove ward number part from sortedAddressParts
      if (wardNumberIndex > 0 && wardNumberIndex < sortedAddressParts.length) {
        sortedAddressParts[wardNumberIndex - 1] = `${sortedAddressParts[wardNumberIndex - 1]}-${sortedAddressParts[wardNumberIndex]}`;
        sortedAddressParts.splice(wardNumberIndex, 1); // Remove WardNumber from sortedAddressParts
        sortedAddressProperties.splice(wardNumberIndex, 1); // Remove WardNumber from sortedAddressProperties
      }
    }

    //! Sanjeev : Join the values with a comma and space
    const sortedAddress = sortedAddressParts
      .filter(part => part !== null && part !== '' && part !== undefined)
      .join(', ');

    return sortedAddress;
  }

  //! Bikesh: Common method to calculate the Age from Date of BIrth to maintain the consistency in overall Danphe Moudule.
  CalculateAge(dateOfBirth: string): string {
    const today = new Date();

    // Convert the dateOfBirth string to a Date object
    const dob = new Date(dateOfBirth);

    // Calculate the differences
    const years = today.getFullYear() - dob.getFullYear();
    const months = today.getMonth() - dob.getMonth();
    const days = today.getDate() - dob.getDate();

    let yearsDiff = years;
    let monthsDiff = months;
    let daysDiff = days;

    // Adjust for cases where the current month/day is earlier than the birth month/day
    if (monthsDiff < 0 || (monthsDiff === 0 && daysDiff < 0)) {
      yearsDiff--;
      monthsDiff += 12;
    }

    if (daysDiff < 0) {
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of the previous month
      daysDiff += lastMonth.getDate();
      monthsDiff--;
    }

    // Construct age string based on conditions
    if (yearsDiff > 1) {
      return `${yearsDiff}Y`; // Show years in the format "XY"
    } else if (yearsDiff === 1) {
      return `1Y`; // Show "1Y" for exactly one year
    } else {
      // Less than one year; return the month and day format
      return monthsDiff > 0 || daysDiff > 0 ? `${monthsDiff}M-${daysDiff}D` : '0D'; // Show in format "XM-XD" or "0D"
    }
  }
  FormateAgeSex(age: string, gender: string): string {
    if (age && gender) {
      let agesex = age + '/' + gender.charAt(0).toUpperCase();
      return agesex;
    }
    else
      return '';
  }


}


export class LookupsModel {
  public ModuleName: string = null;
  public LookupName: string = null;
  public LookupDataJson: string = null;
}

export class FiscalYearModel {
  public FiscalYearId: number = 0;
  public FiscalYearName: string = null;
  public StartDate: string = null;
  public EndDate: string = null;
}
