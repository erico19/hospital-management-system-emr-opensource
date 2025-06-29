import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import * as moment from "moment/moment";
import { VisitBLService } from "../../appointments/shared/visit.bl.service";
import { VisitService } from "../../appointments/shared/visit.service";
import { BillingCounter } from "../../billing/shared/billing-counter.model";
import { BillingTransactionItem } from "../../billing/shared/billing-transaction-item.model";
import { CoreService } from "../../core/shared/core.service";
import { SecurityService } from "../../security/shared/security.service";
import { Department } from "../../settings-new/shared/department.model";
import { AddPatientVisitConsultants_DTO } from "../../shared/DTOs/add-patient-visit-consultants.dto";
import { NepaliCalendarService } from "../../shared/calendar/np/nepali-calendar.service";
import { NepaliDate } from "../../shared/calendar/np/nepali-dates";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { CommonFunctions } from "../../shared/common.functions";
import { DanpheCache, MasterType } from "../../shared/danphe-cache-service-utility/cache-services";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import {
  ENUM_BillingStatus,
  ENUM_BillingType,
  ENUM_DanpheHTTPResponses,
  ENUM_MessageBox_Status,
  ENUM_VisitType
} from "../../shared/shared-enums";
import { AdtAutoBillingItem_DTO } from "../shared/DTOs/adt-auto-billingItems.dto";
import { AdtBedFeatureSchemePriceCategoryMap_DTO } from "../shared/DTOs/adt-bedfeature-scheme-pricecategory-map.dto";
import { AdmissionMasterBlService } from "../shared/admission-master.bl.service";
import { ADT_BLService } from "../shared/adt.bl.service";
import { Bed } from "../shared/bed.model";
import { BedFeature } from "../shared/bedfeature.model";
import { PatientBedInfo } from "../shared/patient-bed-info.model";
import { Ward } from "../shared/ward.model";

@Component({
  selector: "danphe-bed-transfer",
  templateUrl: "./transfer.html",
  styles: [
    `
      .modelbox-div {
        display: flex;
      }
    `,
  ],
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class TransferComponent {
  //public showTransferPage: boolean = false;
  //@Input("selectedBedInfo")
  //public selectedBedInfo: {
  //  PatientAdmissionId;
  //  PatientId;
  //  PatientVisitId;
  //  MSIPAddressInfo;
  //  PatientCode;
  //  Name;
  //  AdmittingDoctor;
  //  AdmittingDoctorName;
  //  BedInformation: {
  //    BedId;
  //    PatientBedInfoId;
  //    Ward;
  //    BedFeature;
  //    BedCode;
  //    BedNumber;
  //    BedFeatureId;
  //    AdmittedDate;
  //    StartedOn;
  //    };
  //};
  public selectedBedInfo: any;
  @Output("transfer")
  transfer: EventEmitter<Object> = new EventEmitter<Object>();

  @Output("notify-adt")
  notifyAdt: EventEmitter<boolean> = new EventEmitter<boolean>();

  public newTransferDate: PatientBedInfo = new PatientBedInfo();
  public newBedInfo: PatientBedInfo = new PatientBedInfo();
  public bedChargeBilTxnItem: BillingTransactionItem = new BillingTransactionItem();
  public bedChargeItemInfo: any;
  public existingBedFeatures: Array<any> = [];
  public selectedPatBedInfo: any;
  public wardList: Array<Ward> = new Array<Ward>();
  public doctorList: any;

  public bedFeatureList: Array<BedFeature> = new Array<BedFeature>();
  public bedList: Array<Bed> = new Array<Bed>();

  public validDate: boolean = true;
  public loading: boolean;
  public disableBedType: boolean = true;
  public disableBed: boolean = true;

  public transferDateNep: NepaliDate;

  //public allDepartments: Array<any> = [];
  public selectedReqDept: any = null; //added yub 26th sept 2018

  public departmentlist: Department = new Department();
  public showAdmissionHistory: boolean = false;
  public showReceipt: boolean = false;
  public selectedDoctor: any = null;
  public filteredDocList: any;
  SelectedBedNum: string;
  SelectedWard: string;
  selectedDept: any;
  StartedOn: string;
  requestFrom: string;
  @Input("isPopUp") public isPopUp: boolean = true;
  @Input("currentModule") public currentModule: any = null;

  @Input("all-Departments")
  public allDepartments: Array<any> = [];

  @Input("selectedBedInfo")
  public set ObtainSelectedBedInfo(data: any) {
    this.selectedBedInfo = data;
    this.getDocts();
  }


  public patVisitId: any;

  public isTransferRemarksCompulsory: boolean = true;
  public priceCategoryId: number = 0;
  public SchemePriceCategoryFromVisit: SchemePriceCategoryCustomType = { SchemeId: 0, PriceCategoryId: 0 };
  public AdtAutoBillingItems = new Array<AdtAutoBillingItem_DTO>();
  public AdtBedFeatureSchemePriceCategoryMap = new Array<AdtBedFeatureSchemePriceCategoryMap_DTO>();
  public OriginalBedFeatureList = new Array<BedFeature>();
  counter: BillingCounter = new BillingCounter();

  public AddPatientVisitConsultants = new Array<AddPatientVisitConsultants_DTO>();
  public SelectedConsultant: any;
  constructor(
    public admissionBLService: ADT_BLService,
    public securityService: SecurityService,
    public msgBoxServ: MessageboxService,
    public coreService: CoreService,
    public visitService: VisitService,
    public visitBLService: VisitBLService,
    public changeDetector: ChangeDetectorRef,
    public npCalendarService: NepaliCalendarService,
    private _admissionMasterBlService: AdmissionMasterBlService
  ) {
    this.patVisitId = this.visitService.globalVisit.PatientVisitId;
    this.isTransferRemarksCompulsory = this.coreService.IsTransferRemarksMandatory();
    //this.LoadDepartments(); // this function has been called in getDocts() function
    //this.getDocts(); // this function has been called after getting data from @Input("selectedBedInfo")
  }

  ngOnInit() {
    if (this.currentModule && this.currentModule.trim() != "") {
      this.requestFrom = this.currentModule;
    } else {
      this.requestFrom = this.securityService.currentModule;
    }
    this.GetWards();
    this.LoadBedBilTxnItem();
    this.LoadConsultants(this.selectedBedInfo.PatientVisitId);
    this.validDate = true;
    this.newBedInfo = new PatientBedInfo();
    if (this.isTransferRemarksCompulsory) {
      this.newBedInfo.PatientBedInfoValidator.controls['Remarks'].setValidators([Validators.maxLength(100), Validators.required, this.noWhitespaceValidator]);
    }
    else {
      this.newBedInfo.PatientBedInfoValidator.controls['Remarks'].setValidators([Validators.maxLength(100)]);
    }
    this.GetAdmissionSchemePriceCategoryInfo(this.selectedBedInfo.PatientVisitId);

    this.newBedInfo.PatientId = this.selectedBedInfo.PatientId;
    this.newBedInfo.PatientVisitId = this.selectedBedInfo.PatientVisitId;
    this.newBedInfo.IsInsurancePatient = this.selectedBedInfo.IsInsurancePatient;
    this.newBedInfo.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
    this.newBedInfo.StartedOn = moment().format("YYYY-MM-DDTHH:mm:ss");
    this.selectedBedInfo.BedInformation.StartedOn = moment(
      this.selectedBedInfo.BedInformation.StartedOn
    ).format("YYYY-MM-DD HH:mm:ss");
    this.selectedReqDept = null;
    this.showAdmissionHistory = true;
    this.setFocusById("DepartmentName");

    this.GetRequestingDepartmentByVisitId();
  }
  LoadConsultants(patientVisitId: number) {
    if (patientVisitId) {
      this.admissionBLService.GetPatientVisitConsultants(patientVisitId)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            const consultants = res.Results;
            if (consultants) {
              this.AddPatientVisitConsultants = consultants.filter(c => !c.IsPrimaryConsultant);
            }
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Cannot load the consultants ${res.ErrorMessage}`]);
          }
        },
          err => {
            console.log(err.ErrorMessage);
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Failed to load consultants."]);
          });
    }
  }
  public SchemeName: string = "";
  public PriceCategoryName: string = "";
  GetAdmissionSchemePriceCategoryInfo(patientVisitId: number) {
    this.admissionBLService.GetAdmissionSchemePriceCategoryInfo(patientVisitId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
        this.SchemePriceCategoryFromVisit.SchemeId = res.Results.SchemeId;
        this.SchemePriceCategoryFromVisit.PriceCategoryId = res.Results.PriceCategoryId;
        this.priceCategoryId = this.SchemePriceCategoryFromVisit.PriceCategoryId;
        this.SchemeName = res.Results.SchemeName;
        this.PriceCategoryName = res.Results.PriceCategoryName;
        this.GetAdtBedFeatureSchemePriceCategoryMap();
      } else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Could not load Scheme and PriceCategory Information for current Visit`]);
      }
    });
  }

  private GetAdtBedFeatureSchemePriceCategoryMap(): void {
    this._admissionMasterBlService.GetBedFeatureSchemePriceCategoryMap(this.SchemePriceCategoryFromVisit.SchemeId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
        this.AdtBedFeatureSchemePriceCategoryMap = res.Results;
        if (this.OriginalBedFeatureList && this.OriginalBedFeatureList.length > 0) {
          this.FilterBedFeatureAsPerSelectedScheme();
        }
      } else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Could not load Auto Billing Items`]);
      }
    });
  }

  private FilterBedFeatureAsPerSelectedScheme() {
    // this.CurrentPatientBedInfo.BedFeatureId = null;
    if (this.AdtBedFeatureSchemePriceCategoryMap && this.AdtBedFeatureSchemePriceCategoryMap.length > 0) {
      const filteredBedFeatureList = this.OriginalBedFeatureList.filter(a => this.AdtBedFeatureSchemePriceCategoryMap.some(b => b.BedFeatureId === a.BedFeatureId));
      this.bedFeatureList = filteredBedFeatureList;
    } else {
      this.bedFeatureList = this.OriginalBedFeatureList;
    }
  }

  GetRequestingDepartmentByVisitId() {
    //this.newBedInfo.PatientVisitId
    this.visitBLService
      .GetRequestingDepartmentByVisitId(this.newBedInfo.PatientVisitId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          let selectedDept = this.allDepartments.find(d => d.DepartmentId == res.Results.DepartmentId);
          this.selectedReqDept = selectedDept.DepartmentName;
          this.AssignSelectedDepartment();
        } else {
          this.msgBoxServ.showMessage("error", ["Cannot load the requesting department."]);
        }
      });
  }


  public noWhitespaceValidator(control: FormControl) {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  }


  //above in ngOnInit
  //@Input("showTransferPage")
  //public set value(val: boolean) {
  //  this.showTransferPage = val;
  //  this.selectedReqDept = null;

  //  if (val) {
  //    this.GetWards();
  //    this.LoadBedBilTxnItem()
  //    this.validDate = true;
  //    this.newBedInfo = new PatientBedInfo();
  //    this.newBedInfo.PatientId = this.selectedBedInfo.PatientId;
  //    this.newBedInfo.PatientVisitId = this.selectedBedInfo.PatientVisitId;
  //    this.newBedInfo.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
  //    this.newBedInfo.StartedOn = moment().format('YYYY-MM-DDTHH:mm:ss');
  //    this.selectedBedInfo.BedInformation.StartedOn = moment(this.selectedBedInfo.BedInformation.StartedOn).format('YYYY-MM-DD HH:mm:ss');
  //    this.selectedReqDept = null;
  //    this.showAdmissionHistory = true;

  //  }
  //}

  getDocts() {
    this.visitBLService
      .GetVisitDoctors()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          this.visitService.ApptApplicableDoctorsList = res.Results;

          this.doctorList = this.visitService.ApptApplicableDoctorsList;

          // awaitting for doctors response data
          //this.LoadDepartments();
          //bikash:28May'20: awaitting for departments response data
          if (this.doctorList && this.doctorList.length > 0) {
            let primaryDoctor = this.doctorList.find(a => a.PerformerId == this.selectedBedInfo.AdmittingDoctorId);
            if (primaryDoctor) {
              let selectedDepartmentId = primaryDoctor.DepartmentId; // getting primary doctors department id
              if (this.allDepartments) {
                this.AssignDepartmentOnDocSectionBasis(selectedDepartmentId); // assigning department according to primary doctor
              }
            }
          }

        } else {
          // this.LoadDepartments();
        }
      });
  }
  public AssignDepartmentOnDocSectionBasis(docDepartmentId) {
    let dept = this.allDepartments.find(a => a.DepartmentId == docDepartmentId);
    if (dept) {
      this.selectedReqDept = dept.DepartmentName;
      this.AssignSelectedDepartment();
    }

  }
  public AssignSelectedDoctor() {
    //this.filteredDocList = this.doctorList = this.visitService.ApptApplicableDoctorsList;
    let doctor = null;
    if (this.selectedDoctor == "" || this.selectedDoctor == undefined) {
      this.filteredDocList = this.doctorList = this.visitService.ApptApplicableDoctorsList;
      //this.aptList = new Array<Appointment>();
      //this.CurrentAppointment.IsValidSelPerformer = true;

      //if (this.CurrentAppointment.DepartmentId == null) {
      //    this.departmentList = this.visitService.ApptApplicableDepartmentList;
      //    this.filteredDocList = this.doctorList = this.visitService.ApptApplicableDoctorsList;
      //}
      //if (this.CurrentAppointment.DepartmentId != null) {
      //    this.filteredDocList = this.doctorList = this.visitService.ApptApplicableDoctorsList;
      //    this.filteredDocList = this.doctorList.filter(doc => doc.DepartmentId == this.CurrentAppointment.DepartmentId);
      //}
      //this.CurrentAppointment.PerformerId = null;
      //this.CurrentAppointment.PerformerName = null;

      return;
    }

    if (this.selectedDoctor && this.doctorList && this.doctorList.length) {
      if (typeof this.selectedDoctor == "string") {
        doctor = this.doctorList.find(
          (a) =>
            a.PerformerName.toLowerCase() ==
            String(this.selectedDoctor).toLowerCase()
        );
      } else if (
        typeof this.selectedDoctor == "object" &&
        this.selectedDoctor.PerformerId
      )
        doctor = this.doctorList.find(
          (a) => a.PerformerId == this.selectedDoctor.PerformerId
        );
      if (doctor) {
        this.selectedDoctor = Object.assign(this.selectedDoctor, doctor);
        this.newBedInfo.SecondaryDoctorId = doctor.PerformerId; //this will give Performerid
        this.newBedInfo.SecondaryDoctorName = doctor.PerformerName;
        //this.CurrentAppointment.IsValidSelPerformer = true;
        //this.CurrentAppointment.IsValidSelDepartment = true;
        //this.CurrentAppointment.DepartmentId = doctor.DepartmentId;
      }
      //else {
      //    this.CurrentAppointment.IsValidSelPerformer = false;
      //}
      let selectedDepartmentId = this.selectedDoctor.DepartmentId;
      this.AssignDepartmentOnDocSectionBasis(selectedDepartmentId);
    } else {
      this.newBedInfo.SecondaryDoctorId = null;
      this.newBedInfo.SecondaryDoctorName = null;
    }
    //this.GetAppointmentList();
    //this.CurrentAppointment.IsValidTime();
  }
  DocListFormatter(data: any): string {
    let html = data["PerformerName"];
    return html;
  }
  //public SetItemProperties() {
  //    var dept = this.allDepartments.find(dept => Number(dept.DepartmentId) == Number(this.newBedInfo.RequestingDeptId));
  //    if (dept) {
  //        this.selectedReqDept = dept;
  //    }
  //}
  //GetAdmittedPatBedInfo($event)
  //{
  //    var selectedPatBedInfo = Object.create($event.Data);
  //    this.selectedBedInfo = selectedPatBedInfo;
  //}

  CheckTransferPrintReceipt() {
    this.showReceipt = this.coreService.CheckTransferPrintReceipt();
  }
  public compareDate() {
    if (
      moment(this.newBedInfo.StartedOn).diff(
        this.selectedBedInfo.BedInformation.StartedOn
      ) < 0 ||
      moment(this.newBedInfo.StartedOn).diff(
        moment().add(10, "minutes").format("YYYY-MM-DD HH:mm")
      ) > 0 ||
      !this.newBedInfo.StartedOn
    )
      this.validDate = false;
    else this.validDate = true;
  }
  public GetWards() {
    this.admissionBLService.GetWards().subscribe(
      (res) => {
        if (res.Status == "OK") {
          if (res.Results.length) {
            this.wardList = res.Results;
          }
        } else {
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
      (err) => {
        this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
      }
    );
  }
  public WardChanged(wardId: number) {
    if (wardId) {
      this.disableBedType = false;
      this.newBedInfo.BedFeatureId = null;
      this.wardList.forEach((a) => {
        if (a.WardId == wardId) {
          this.SelectedWard = a.WardName;
        }
      });
      this.bedList = null;
      this.newBedInfo.BedPrice = null;
      this.bedFeatureList = null;
      this.admissionBLService.GetWardBedFeatures(wardId, this.priceCategoryId).subscribe((res) => {
        if (res.Status == "OK") {
          if (res.Results.length) {
            this.bedFeatureList = res.Results;
            this.OriginalBedFeatureList = res.Results;
            this.FilterBedFeatureAsPerSelectedScheme();
          }
        }
      });
    }
  }
  GetPatientWardInfo(PatVisitId: number) {
    this.admissionBLService.GetAdmittedPatientInfo(PatVisitId).subscribe(
      (res) => {
        if (res.Status == "OK") {
          if (res.Results.length) {
            this.newTransferDate = res.Results;
            this.selectedBedInfo.BedInformation.StartedOn = this.newTransferDate[0].StartedOn;
          }
        } else {
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
      (err) => {
        this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
      }
    );
  }

  public GetAvailableBeds(wardId: number, bedFeatureId: number) {
    if (bedFeatureId && wardId) {
      const selectedFeature = this.bedFeatureList.find(
        (a) => a.BedFeatureId == bedFeatureId
      );
      const bedFeatureSchemePriceCategoryMap = this.AdtBedFeatureSchemePriceCategoryMap.find(a => a.BedFeatureId === +bedFeatureId);
      if (bedFeatureSchemePriceCategoryMap && bedFeatureSchemePriceCategoryMap.PriceCategoryId !== this.SchemePriceCategoryFromVisit.PriceCategoryId) {
        this.SchemePriceCategoryFromVisit.PriceCategoryId = bedFeatureSchemePriceCategoryMap.PriceCategoryId;
        this.GetAvailableBedAndBedFeaturePrice(selectedFeature, +wardId, +bedFeatureId, this.SchemePriceCategoryFromVisit.PriceCategoryId);
      } else {
        this.newBedInfo.BedPrice = selectedFeature.BedPrice;
        this.disableBed = false;
        this.admissionBLService.GetAvailableBeds(wardId, bedFeatureId).subscribe(
          (res) => {
            if (res.Status == "OK") {
              if (res.Results.availableBeds.length) {
                this.bedList = res.Results.availableBeds;
                this.InitializeBedBillItem(res.Results.BedbillItm);
              } else {
                this.msgBoxServ.showMessage("failed", [
                  "No beds are available for this type.",
                ]);
                this.newBedInfo.BedPrice = null;
                this.bedList = null;
                this.newBedInfo.BedId = 0;
              }
            } else {
              this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
            }
          },
          (err) => {
            this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
          }
        );

      }

    }
  }
  private GetAvailableBedAndBedFeaturePrice(selectedBedFeature: BedFeature, wardId: number, bedFeatureId: number, priceCategoryId: number): void {
    this.disableBed = false;
    this.admissionBLService.GetAvailableBedAndBedFeaturePrice(wardId, bedFeatureId, priceCategoryId).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.newBedInfo.BedPrice = res.Results.bedFeaturePrice;

          if (res.Results.availableBedsObj && res.Results.availableBedsObj.availableBeds.length) {
            this.bedList = res.Results.availableBedsObj.availableBeds;
            this.InitializeBedBillItem(res.Results.availableBedsObj.BedbillItm);
          } else {
            this.msgBoxServ.showMessage("failed", [
              "No beds are available for this type.",
            ]);
            this.newBedInfo.BedPrice = null;
            this.bedList = null;
            this.newBedInfo.BedId = 0;
          }
        } else {
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
      (err) => {
        this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
      }
    );

  }

  Transfer() {

    if (this.CheckSelectionFromAutoComplete()) {
      if (this.newBedInfo) {
        if (this.newBedInfo.Remarks) {
          this.newBedInfo.Remarks = this.newBedInfo.Remarks.trim();
        }

        this.compareDate();
        for (var i in this.newBedInfo.PatientBedInfoValidator.controls) {
          this.newBedInfo.PatientBedInfoValidator.controls[i].markAsDirty();
          this.newBedInfo.PatientBedInfoValidator.controls[i].updateValueAndValidity();
        }

        if (this.newBedInfo.IsValidCheck(undefined, undefined) && this.validDate) {
          this.bedList.forEach((a) => {
            if (a.BedId == this.newBedInfo.BedId) {
              this.SelectedBedNum = a.BedNumber;
            }
          });
          this.StartedOn = moment(this.newBedInfo.StartedOn).format(
            "YYYY-MM-DDTHH:mm:ss"
          );


          if (typeof this.selectedReqDept == 'string') {
            let dept = this.allDepartments.find(d => d.DepartmentName == this.selectedReqDept);
            this.selectedReqDept = dept;
          }

          this.InitializeBedBilItem();
          this.loading = true;

          if (this.AddPatientVisitConsultants && this.AddPatientVisitConsultants.length > 0) {
            const newConsultants = this.AddPatientVisitConsultants.filter(c => c.PatientVisitConsultantId == 0 && c.IsActive);
            if (newConsultants) {
              this.newBedInfo.AddPatientVisitConsultants = newConsultants;
            }
          }
          this.admissionBLService.TransferBed(this.newBedInfo, this.selectedBedInfo.BedInformation.PatientBedInfoId, this.bedChargeBilTxnItem,
            this.requestFrom)
            .subscribe((res) => {
              if (res.Status == "OK") {
                this.msgBoxServ.showMessage("success", [
                  "Patient transfered to new bed.",
                ]);
                this.transfer.emit({ newBedInfo: res.Results });
                this.notifyAdt.emit(false);
                // this.showReceipt = true;
                this.CheckTransferPrintReceipt();
                this.newBedInfo = new PatientBedInfo();
                this.wardList = new Array<Ward>();
                this.bedFeatureList = new Array<BedFeature>();
                this.loading = false;
              } else {
                this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
                this.loading = false;
              }
            },
              (err) => {
                this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
                this.loading = false;
              }
            );
        }
      } else this.msgBoxServ.showMessage("failed", ["Select bed."]);
    }
  }

  UpgradeStartedDate($event) {
    this.GetPatientWardInfo(this.selectedBedInfo.PatientVisitId);
    console.log(this.selectedBedInfo);
  }
  public CheckSelectionFromAutoComplete(): boolean {
    if (this.newBedInfo.IsValidReqDepartment) {
      return true;
    } else {
      this.msgBoxServ.showMessage("failed", [
        "Invalid Requesting Department. Please choose one from the list.",
      ]);
      this.loading = false;
      return false;
    }
  }

  Close() {
    //this.showTransferPage = false;
    this.transfer.emit();
    this.notifyAdt.emit(false);
    this.wardList = new Array<Ward>();
    this.bedFeatureList = new Array<BedFeature>();
    this.showReceipt = false;
  }

  //convert nepali date to english date and assign to english calendar
  NepCalendarOnDateChange() {
    let engDate = this.npCalendarService.ConvertNepToEngDate(
      this.transferDateNep
    );
    this.newBedInfo.StartedOn = engDate;
  }
  //this method fire when english calendar date changed
  //convert english date to nepali date and assign to nepali canlendar
  EngCalendarOnDateChange() {
    if (this.newBedInfo.StartedOn) {
      let nepDate = this.npCalendarService.ConvertEngToNepDate(
        this.newBedInfo.StartedOn
      );
      this.transferDateNep = nepDate;
    }
  }

  //sud: 20Jun'18
  // LoadDepartments() {
  //   this.admissionBLService
  //     .GetDepartments()
  //     .subscribe((res: DanpheHTTPResponse) => {
  //       this.allDepartments = res.Results;

  //       //bikash:28May'20: awaitting for departments response data
  //       if (this.doctorList && this.doctorList.length > 0) {
  //         let primaryDoctor = this.doctorList.find(a => a.PerformerId == this.selectedBedInfo.AdmittingDoctorId);
  //         if (primaryDoctor) {
  //           let selectedDepartmentId = primaryDoctor.DepartmentId; // getting primary doctors department id
  //           if (this.allDepartments) {
  //             this.AssignDepartmentOnDocSectionBasis(selectedDepartmentId); // assigning department according to primary doctor
  //           }
  //         }
  //       }

  //     });
  // }

  public InitializeBedBilItem() {
    //sud/krishna: 20Jan'23: We're sending the BedChargeItem regardless if it was already existing or not.
    //we'll manage whether to add new item (in case of BillCancelled) or not from Server side itself.

    this.bedChargeBilTxnItem = new BillingTransactionItem();
    this.bedChargeBilTxnItem = this.bedChargeItemInfo;
    this.bedChargeBilTxnItem.IsInsurance = this.newBedInfo.IsInsurancePatient;//sud:3-Oct'21--

    //let isPresent = false;
    // for (var i = 0; i < this.existingBedFeatures.length; i++) {
    //   if (
    //     this.existingBedFeatures[i].BedFeatureId == this.newBedInfo.BedFeatureId
    //   ) {
    //     this.newBedInfo.IsExistBedFeatureId = true;
    //     this.bedChargeBilTxnItem = null;
    //     isPresent = true;
    //     //break;
    //   }
    // }
    // if (!isPresent) {
    //   this.bedChargeBilTxnItem = this.bedChargeItemInfo;
    // }

  }
  //load bedcharge item and loads bedfeatureId (against patientId and patientVisitId)
  public LoadBedBilTxnItem() {
    this.admissionBLService
      .GetBedChargeBilItem(
        this.selectedBedInfo.PatientId,
        this.selectedBedInfo.PatientVisitId
      )
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          this.existingBedFeatures = res.Results;
        } else {
          this.msgBoxServ.showMessage("error", [
            "unable to load existing bed features for selected Patient visit. " +
            res.ErrorMessage,
          ]);
        }
      });
  }

  public InitializeBedBillItem(bedData) {
    if (bedData != null) {
      let bilItm = new BillingTransactionItem();
      bilItm.PatientId = this.newBedInfo.PatientId;
      bilItm.PatientVisitId = this.newBedInfo.PatientVisitId;
      bilItm.ServiceDepartmentId = bedData.ServiceDepartmentId;
      bilItm.ServiceDepartmentName = bedData.ServiceDepartmentName;
      bilItm.ItemId = bedData.ItemId;
      bilItm.ItemName = bedData.ItemName;
      bilItm.Price = CommonFunctions.parseAmount(bedData.Price);
      bilItm.Quantity = 1;
      bilItm.SubTotal = CommonFunctions.parseAmount(
        bilItm.Price * bilItm.Quantity
      );
      bilItm.NonTaxableAmount = CommonFunctions.parseAmount(bilItm.SubTotal);
      bilItm.TotalAmount = CommonFunctions.parseAmount(bilItm.SubTotal);
      bilItm.BillStatus = ENUM_BillingStatus.provisional; // "provisional";
      bilItm.CounterId = this.securityService.getLoggedInCounter().CounterId > 0 ? this.securityService.getLoggedInCounter().CounterId : this.LoadCounter();
      bilItm.CounterDay = moment().format("YYYY-MM-DD");
      bilItm.BillingType = ENUM_BillingType.inpatient; // "inpatient";
      bilItm.ProcedureCode = bedData.ProcedureCode;
      bilItm.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
      bilItm.VisitType = ENUM_VisitType.inpatient; // "inpatient";
      bilItm.IsInsurance = this.selectedBedInfo.IsInsurancePatient;//sud:3-Oct'21--check if this fix the issue or not..
      bilItm.ServiceItemId = bedData.ServiceItemId;
      bilItm.ItemCode = bedData.ItemCode;
      bilItm.ItemId = bilItm.IntegrationItemId = bedData.IntegrationItemId;
      bilItm.IntegrationItemId = bilItm.IntegrationItemId = bedData.IntegrationItemId;
      bilItm.PriceCategoryId = this.SchemePriceCategoryFromVisit.PriceCategoryId;
      this.bedChargeItemInfo = bilItm;
    }
  }

  deptListFormatter(data: any): string {
    let html = data["DepartmentName"];
    return html;
  }

  public AssignSelectedDepartment() {
    let reqDeptObj = null;
    // check if user has given proper input string for department name
    //or has selected object properly from the dropdown list.
    if (typeof this.selectedReqDept == "string") {
      if (
        this.allDepartments &&
        this.allDepartments.length &&
        this.selectedReqDept
      )
        reqDeptObj = this.allDepartments.find(
          (a) =>
            a.DepartmentName.toLowerCase() == this.selectedReqDept.toLowerCase()
        );
    } else if (typeof this.selectedReqDept == "object")
      reqDeptObj = this.selectedReqDept;
    //if selection of department from string or selecting object from the list is true
    //then assign proper department name
    if (reqDeptObj) {
      if (reqDeptObj.DepartmentId != this.newBedInfo.RequestingDeptId) {
        this.newBedInfo.RequestingDeptId = reqDeptObj.DepartmentId;
        this.selectedDept = reqDeptObj.DepartmentName;
      }

      this.newBedInfo.IsValidReqDepartment = true;
    }
    //else raise an invalid flag
    else {
      //this.newBedInfo.FilteredItem = this.allDepartments;
      this.newBedInfo.IsValidReqDepartment = false;
    }
  }

  public printReceipt() {
    let popupWinindow;
    var printContents = document.getElementById("Receipt").innerHTML;
    popupWinindow = window.open(
      "",
      "_blank",
      "width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no"
    );
    popupWinindow.document.open();
    let documentContent = "<html><head>";
    documentContent +=
      '<link rel="stylesheet" type="text/css" href="../../themes/theme-default/DanpheStyle.css"/>';
    /// documentContent += '<link rel="stylesheet" type="text/css" href="../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>';
    documentContent += "</head>";
    documentContent +=
      '<body onload="window.print()" style="margin:8px 0px 0px 50px !important;">' +
      printContents +
      "</body></html>";
    popupWinindow.document.write(documentContent);
    popupWinindow.document.close();
    //this.AfterPrintAction();
  }

  public BedChanged(bedId: any) {
    if (this.bedList)
      var bedRes = this.bedList.find(b => b.BedId == bedId && b.IsReserved);
    if (bedRes) {// && (this.reservedBedIdByPat != bedRes.BedId)
      this.msgBoxServ.showMessage("error", ['Cannot reserve this bed. This bed is already reserved by '
        + bedRes.ReservedByPatient + ' for date: ' + moment(bedRes.ReservedForDate).format('YYYY-MM-DD HH:mm')]);
      this.changeDetector.detectChanges();
      this.newBedInfo.BedId = null;
    }
  }

  public hotkeys(event) {
    if (event.keyCode == 27) {
      this.Close();
    }
  }

  //common function to focus on element dynamically
  public FocusNext(value: any, target: string, orElseTarget: string) {
    if (value) {
      if (typeof (value) == 'string' && value.trim() == '') {
        this.setFocusById(orElseTarget);
      }
      else {
        this.setFocusById(target);
      }
    }
    else {
      this.setFocusById(orElseTarget);
    }
  }


  //common function to set focus on  given Element.
  setFocusById(targetId: string, waitingTimeinMS: number = 10) {
    let timer = window.setTimeout(function () {
      let htmlObject = document.getElementById(targetId);
      if (htmlObject) {
        htmlObject.focus();
      }
      clearTimeout(timer);
    }, waitingTimeinMS);
  }
  public LoadCounter(): number {
    let allCounters: Array<BillingCounter>;
    allCounters = DanpheCache.GetData(MasterType.BillingCounter, null);
    this.counter = allCounters.find(c => c.CounterType == "NURSING");
    if (this.counter && this.counter.CounterId)
      return this.counter.CounterId;
  }

  AddConsultantDoctors(consultantId: number, isPrimaryConsultant: boolean = false, consultantName: string, department: string) {
    if (consultantId) {
      if (this.AddPatientVisitConsultants && this.AddPatientVisitConsultants.find(a => a.ConsultantId === consultantId)) {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`This Doctor is already added as consultant`]);
        return;
      }
      const consultant = new AddPatientVisitConsultants_DTO();
      consultant.ConsultantId = consultantId;
      consultant.IsPrimaryConsultant = isPrimaryConsultant;
      consultant.VisitType = ENUM_VisitType.inpatient;
      consultant.ConsultantName = consultantName;
      consultant.DepartmentName = department;
      consultant.IsActive = true;
      const alreadyPrimaryConsultant = this.AddPatientVisitConsultants.some(a => a.IsPrimaryConsultant);
      if (alreadyPrimaryConsultant && isPrimaryConsultant) {
        const index = this.AddPatientVisitConsultants.findIndex(a => a.IsPrimaryConsultant);
        this.AddPatientVisitConsultants.splice(index, 1);
      }
      this.AddPatientVisitConsultants.push(consultant);
    }
  }

  ConsultantDoctorChanged() {
    if (this.SelectedConsultant) {
      const doctorId = this.SelectedConsultant.PerformerId;
      const department = this.SelectedConsultant.DepartmentName;
      const doctorName = this.SelectedConsultant.PerformerName;
      this.AddConsultantDoctors(doctorId, false, doctorName, department);
    }
  }

  RemoveConsultant(index: number) {
    this.AddPatientVisitConsultants.splice(index, 1);
  }

  ClearConsultantInput() {
    this.SelectedConsultant = undefined;
    this.SelectedConsultant = null;
  }
}
