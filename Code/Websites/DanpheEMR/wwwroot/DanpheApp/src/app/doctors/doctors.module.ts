import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

//import { PatientCanDeactivateGuard } from "./shared/patient-candeactivate-guard";

import { DoctorsRoutingConstant } from "./doctors-routing.constant";
//Dashboard components
import { DoctorsMainComponent } from "../doctors/doctors-main.component";
import { DoctorDashboardComponent } from "./dashboard/doctor-dashboard.component";

import { SharedModule } from "../shared/shared.module";
//to display visit lists in patient-visit-history. use the same doctor-dashboard.component as well--sudarshan 24march
import { VisitDLService } from "../appointments/shared/visit.dl.service";

import { DoctorsBLService } from "./shared/doctors.bl.service";
import { DoctorsDLService } from "./shared/doctors.dl.service";

import { ClinicalDLService } from "../clinical/shared/clinical.dl.service";
import { DoctorRevenueComponent } from "./summary/doctor-summary.component";

//import { Ng2AutoCompleteModule } from  'ng2-auto-complete'
import { DanpheAutoCompleteModule } from "../shared/danphe-autocomplete/danphe-auto-complete.module";

//moved Problems+History from Clinical to Doctors Module : sud-10June'18
//import { FamilyHistoryListComponent } from '../clinical/history/family-history-list.component';
//import { FamilyHistoryAddComponent } from '../clinical/history/family-history-add.component';
//import { SurgicalHistoryListComponent } from '../clinical/history/surgical-history-list.component';
//import { SurgicalHistoryAddComponent } from '../clinical/history/surgical-history-add.component';
//import { SocialHistoryListComponent } from '../clinical/history/social-history-list.component';
//import { SocialHistoryAddComponent } from '../clinical/history/social-history-add.component';
import { ProblemsMainComponent } from "../clinical/problems/problems-main.component";
import { HistoryBLService } from "../clinical/shared/history.bl.service";
import { IOAllergyVitalsBLService } from "../clinical/shared/io-allergy-vitals.bl.service";
import { ProblemsBLService } from "../clinical/shared/problems.bl.service";
import { DynTemplateModule } from "../core/dyn-templates/dyn-templates.module";
//import { MedicalProblemListComponent } from '../clinical/problems/medical-problem-list.component';
//import { ActiveMedicalAddComponent } from '../clinical/problems/active-medical-add.component';
//import { PastMedicalAddComponent } from '../clinical/problems/past-medical-add.component';
import { ADT_DLService } from "../adt/shared/adt.dl.service";
import { AppointmentDLService } from "../appointments/shared/appointment.dl.service";
import { ClinicalNewSharedModule } from "../clinical-new/clinical-new-shared.module";
import { ClinicalSharedModule } from "../clinical/clinical-shared-module";
import { NursingDLService } from "../nursing/shared/nursing.dl.service";
import { OrderService } from "../orders/shared/order.service";
import { PatientsBLService } from "../patients/shared/patients.bl.service";
import { DoctorSharedModule } from "./doctor-shared.module";
import { IPDMainComponent } from "./ipd/ipd-main.component";
import { OPNewPatientComponent } from "./opd/op-new-patient/op-new-patient.component";
import { OpdRecordComponent } from "./opd/opd-record/opd-record.component";
import { OutpatientMainComponent } from "./opd/outpatient-main.component";
import { ReferralSourceAddComponent } from "./referral-source/referral-source-add.component";
import { ReferralSourceListComponent } from "./referral-source/referral-source-list.component";
import { VisitSummaryComponent } from "./visit/visit-summary.component";

@NgModule({
  providers: [
    VisitDLService,
    DoctorsDLService,
    DoctorsBLService,
    ClinicalDLService,
    ProblemsBLService,
    HistoryBLService,
    IOAllergyVitalsBLService,
    OrderService,
    AppointmentDLService,
    ADT_DLService,
    PatientsBLService,
    NursingDLService
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forChild(DoctorsRoutingConstant),
    SharedModule,
    DanpheAutoCompleteModule,
    DynTemplateModule,
    ClinicalSharedModule,
    DoctorSharedModule,
    ClinicalNewSharedModule,
  ],

  declarations: [
    DoctorsMainComponent,
    DoctorDashboardComponent,
    DoctorRevenueComponent,
    ProblemsMainComponent,
    VisitSummaryComponent,
    //MedicalProblemListComponent,
    //ActiveMedicalAddComponent,
    //PastMedicalAddComponent,
    // PastMedicalComponent,
    // ClinicalHistoryComponent,
    //FamilyHistoryListComponent,
    //FamilyHistoryAddComponent,

    //SurgicalHistoryListComponent,
    //SurgicalHistoryAddComponent,
    //SocialHistoryListComponent,
    //SocialHistoryAddComponent,

    IPDMainComponent,
    ReferralSourceListComponent,
    ReferralSourceAddComponent,
    // InPatientDischargeSummaryComponent,
    OpdRecordComponent,
    OPNewPatientComponent,
    OutpatientMainComponent,
  ],
  bootstrap: [], //do we need anything here ? <sudarshan:2jan2017>
})
export class DoctorsModule { }
