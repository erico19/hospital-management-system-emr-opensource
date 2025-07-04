
import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as moment from 'moment/moment';
import { CoreService } from '../../core/shared/core.service';
import { SecurityService } from '../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_AppointmentType, ENUM_BillingStatus, ENUM_VisitStatus, ENUM_VisitType } from '../../shared/shared-enums';
import { VisitBLService } from '../shared/visit.bl.service';
import { Visit } from '../shared/visit.model';
import { VisitService } from '../shared/visit.service';

@Component({
  selector: "danphe-free-referal-visit",
  templateUrl: "./free-referal-visit.html"
})
export class FreeReferalVisitComponent {
  public showReferalPage: boolean = false;
  @Input("visit")
  public selectedVisit: Visit;
  @Output("add-referal")
  addreferal: EventEmitter<Object> = new EventEmitter<Object>();


  public doctorList: Array<{ DepartmentId: number, DepartmentName: string, PerformerId: number, PerformerName: string, ItemName: string, Price: number, IsTaxApplicable: boolean, SAARCCitizenPrice: number, ForeignerPrice: number }> = [];
  public filteredDocList: Array<{ DepartmentId: number, DepartmentName: string, PerformerId: number, PerformerName: string, ItemName: string, Price: number, IsTaxApplicable: boolean, SAARCCitizenPrice: number, ForeignerPrice: number }>;
  public selectedDoctor = { DepartmentId: 0, DepartmentName: "", PerformerId: 0, PerformerName: "", ItemName: "", Price: 0, IsTaxApplicable: false, DepartmentLevelAppointment: false };
  public selectedDepartment = { DepartmentId: 0, DepartmentName: "" };
  public departmentList: any;

  public departmentId: number = 0;




  public showmsgbox: boolean = false;
  public status: string = null;
  public message: string = null;
  public loading: boolean = false;//to restrict double click
  public deptLevelAppt: boolean = false;

  constructor(public visitBLService: VisitBLService,
    public msgBoxServ: MessageboxService, public securityService: SecurityService,
    public visitService: VisitService, public coreService: CoreService) {

    this.departmentList = this.visitService.ApptApplicableDepartmentList;
    this.doctorList = this.visitService.ApptApplicableDoctorsList;
    //All doctors will be shown at first..
    this.filteredDocList = this.visitService.ApptApplicableDoctorsList;
    this.deptLevelAppt = this.coreService.EnableDepartmentLevelAppointment();
  }


  //load doctor  list according to department.
  //does a get request in employees table using departmentId.
  FilterDoctorList(): void {
    //erases previously selected doctor and clears respective schedule list

    if (this.departmentId != 0) {
      this.filteredDocList = this.doctorList.filter(d => d.DepartmentId == this.departmentId);
    }
    else {
      this.filteredDocList = this.doctorList;
    }


    //this.visitBLService.GetDoctorList(this.departmentId)
    //  .subscribe(res => this.CallBackGenerateDoctor(res));
  }


  myListFormatter(data: any): string {
    let html = data["Value"];
    return html;
  }


  public AssignSelectedDoctor() {
    let doctor = null;

    if (this.selectedDoctor.PerformerId > 0 && this.doctorList && this.doctorList.length) {
      if (typeof (this.selectedDoctor) == 'string') {
        doctor = this.doctorList.find(a => a.PerformerName.toLowerCase() == String(this.selectedDoctor).toLowerCase());
      }
      else if (typeof (this.selectedDoctor) == 'object' && this.selectedDoctor.PerformerId)
        doctor = this.doctorList.find(a => a.PerformerId == this.selectedDoctor.PerformerId);



      this.departmentId = doctor.DepartmentId;

    }
  }

  CheckExistingPatientsAndSubmit() {
    if (this.departmentId > 0 && (this.deptLevelAppt ? true : this.selectedDoctor.PerformerId > 0)) {
      if (this.loading) {
        this.visitBLService.GetApptForDeptOnSelectedDate(this.departmentId, this.selectedDoctor.PerformerId, this.selectedVisit.VisitDate, this.selectedVisit.PatientId)
          .subscribe(res => {
            if ((res.Status == "OK") && res.Results) {
              this.msgBoxServ.showMessage("failed", ['Patient has already appointment for this department or doctor on selected date.']);
              this.loading = false;
            } else {
              this.AddReferralVisit();
            }
          });
      }
    }
    else {
      this.msgBoxServ.showMessage("error", ["Please provide all input fields."]);
      this.loading = false;
    }
  }

  AddReferralVisit() {
    let refVis = new Visit();
    refVis.PerformerId = this.selectedDoctor.PerformerId;
    refVis.PerformerName = this.selectedDoctor.PerformerName;
    refVis.PatientId = this.selectedVisit.PatientId;
    refVis.DepartmentId = this.departmentId;

    refVis.VisitDate = moment().format("YYYY-MM-DD");
    refVis.VisitTime = moment().add(5, 'minute').format("HH:mm");//by default we add 5 minutes to the new visit.
    refVis.VisitType = ENUM_VisitType.outpatient;// "outpatient";
    refVis.VisitStatus = ENUM_VisitStatus.initiated;// "Initiated";
    refVis.BillingStatus = ENUM_BillingStatus.paid;// "paid";
    refVis.ReferredBy = this.selectedVisit.PerformerId ? this.selectedVisit.PerformerId.toString() : null;
    refVis.AppointmentType = ENUM_AppointmentType.referral;// "Referral";
    refVis.ParentVisitId = this.selectedVisit.PatientVisitId;
    refVis.SchemeId = this.selectedVisit.SchemeId;
    refVis.PriceCategoryId = this.selectedVisit.PriceCategoryId;
    refVis.CreatedBy = this.securityService.loggedInUser.EmployeeId;
    refVis.CreatedOn = moment().format("YYYY-MM-DD HH:mm:ss");
    refVis.IsActive = true;


    this.visitBLService.PostFreeReferralVisit(refVis)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {

          this.addreferal.emit({ action: "free-referral", data: res.Results });
          this.msgBoxServ.showMessage("success", ["Patient is successfully referred."]);
          this.loading = false;//enable Refer button once function completed
        }
        else {
          this.msgBoxServ.showMessage("error", ["Failed to add referral visit. Please try again.", res.ErrorMessage]);
          this.loading = false;
        }

      });

    // this.loading = false;//enable Refer button once function completed
  }

  Close() {
    this.addreferal.emit({ action: "close" });
  }


  ProviderListFormatter(data: any): string {
    let html = data["FullName"];//FullName is a property in the Employee Model.
    //let html = data["Salutation"] + "." + data["FirstName"] + "  " + data["LastName"];
    return html;
  }

  //used to format the display of item in ng-autocomplete.
  DocListFormatter(data: any): string {
    let html = data["PerformerName"];
    return html;
  }

}
