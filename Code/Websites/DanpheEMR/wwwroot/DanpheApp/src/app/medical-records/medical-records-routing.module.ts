import { NgModule } from '@angular/core';
import { RouterModule } from "@angular/router";
import { PageNotFound } from '../404-error/404-not-found.component';
import { AuthGuardService } from '../security/shared/auth-guard.service';
import { ResetPatientcontextGuard } from '../shared/reset-patientcontext-guard';
import { BirthListComponent } from './birth-list/birth-list.component';
import { DeathListComponent } from './death-list/death-list.component';
import { EmergencyPatientListComponent } from './emergencypatient-list/emergency-patient-list.component';
import { MRInpatientListComponent } from './inpatient-list/inpatient-list.component';
import { MedicalRecordsMainComponent } from './medical-records-main.component';
import { DiseaseWiseReportComponent } from './mr-reports/disease-wise-report';
import { EmergencyPatientMorbidityReportComponent } from './mr-reports/government/emergency-patient-morbidity/emergency-patient-morbidity-report.component';
import { EthnicGroupStatisticsReportComponent } from './mr-reports/government/ethnic-group-statistics/ethnic-group-statistics.component';
import { HospitalMortalityComponent } from './mr-reports/government/hospital-mortaltiy/hospital-mortality.component';
import { InpatientMorbidityReportComponent } from './mr-reports/government/inpatient-morbidity/mr-inpatient-morbidity-report';
import { GovInpatientOutcomeReportComponent } from './mr-reports/government/inpatient-outcome/gov-inpatient-outcome-report.component';
import { GovLaboratoryServicesReportComponent } from './mr-reports/government/lab-services/gov-laboratory-services.component';
import { NonCommunicableDiseaseReportComponent } from './mr-reports/government/non-communicable-disease/non-communicable-disease-report';
import { OutpatientMorbidityReportComponent } from './mr-reports/government/outpatient-morbidity/mr-outpatient-morbidity-report';
import { GovSummaryReportComponent } from './mr-reports/government/summary/govt-summary-report.component';
import { OutpatientServicesReportComponent } from './mr-reports/mr-outpatient-services-report';
import { MedicalRecordReportsMainComponent } from './mr-reports/mr-report-main';
import { MROutpatientListComponent } from './outpatient-list/outpatient-list.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: MedicalRecordsMainComponent, canDeactivate: [ResetPatientcontextGuard],
        children: [
          { path: '', redirectTo: 'InpatientList', pathMatch: 'full' },
          { path: 'OutpatientList', component: MROutpatientListComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
          { path: 'InpatientList', component: MRInpatientListComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
          { path: 'BirthList', component: BirthListComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
          { path: 'DeathList', component: DeathListComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
          { path: 'EmergencyPatientList', component: EmergencyPatientListComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
          // { path: 'ReportList', loadChildren:"./mr-reports/mr-reports.module#",canActivate: [AuthGuardService, ResetPatientcontextGuard]}, // 7th-July'21 - lazy loading added for mr reports section
          {
            path: 'ReportList',
            canActivate: [AuthGuardService, ResetPatientcontextGuard],
            children: [
              { path: "", component: MedicalRecordReportsMainComponent },
              { path: 'InpatientServicesReport', component: GovInpatientOutcomeReportComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
              { path: 'LabServicesReport', component: GovLaboratoryServicesReportComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
              { path: 'DiseaseWiseReport', component: DiseaseWiseReportComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
              { path: 'OutpatientServicesReport', component: OutpatientServicesReportComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
              { path: 'OutpatientMorbidityReport', component: OutpatientMorbidityReportComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
              { path: 'InpatientMorbidityReport', component: InpatientMorbidityReportComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
              { path: 'HospitalServiceSummary', component: GovSummaryReportComponent }, // canActivate: [AuthGuardService, ResetPatientcontextGuard] 
              { path: 'HospitalMortalityReport', component: HospitalMortalityComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
              { path: 'EmergencyPatientMorbidityReport', component: EmergencyPatientMorbidityReportComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
              { path: 'EthnicGroupStatisticsReport', component: EthnicGroupStatisticsReportComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },
              { path: 'NonCommunicableDiseaseReport', component: NonCommunicableDiseaseReportComponent, canActivate: [AuthGuardService, ResetPatientcontextGuard] },

              { path: "**", component: PageNotFound }
            ]
          },
          { path: "**", component: PageNotFound }
        ]
      },
      { path: "**", component: PageNotFound }
    ])
  ],
  exports: [
    RouterModule
  ]
})
export class MedecialRecordsRoutingModule {

}
