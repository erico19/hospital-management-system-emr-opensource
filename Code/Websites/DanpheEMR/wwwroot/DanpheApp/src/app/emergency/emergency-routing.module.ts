import { NgModule } from '@angular/core';
import { RouterModule } from "@angular/router";
import { PageNotFound } from '../404-error/404-not-found.component';
import { ClinicalOverviewWrapperComponent } from '../clinical-new/clinical-overview-wrapper/clinical-overview-wrapper.component';
import { EmergencyDashboardComponent } from '../dashboards/emergency/emergency-dashboard.component';
import { InPatientDischargeSummaryComponent } from '../doctors/patient/in-patient-discharge-summary.component';
import { PatientOverviewMainComponent } from '../doctors/patient/patient-overview-main.component';
import { PatientOverviewComponent } from '../doctors/patient/patient-overview.component';
import { DrugsRequestComponent } from '../nursing/drugs-request/drugs-request.component';
import { AuthGuardService } from '../security/shared/auth-guard.service';
import { ResetEmergencyContextGuard } from '../shared/reset-emergencycontext-guard';
import { SelectVisitCanActivateGuard } from '../shared/select-visit-canactivate-guard';
import { ERWardBillingComponent } from './ER-ward-billing/er-wardbilling.component';
import { BedInformationsComponent } from './bed-informations/bed-informations.component';
import { EmergencyMainComponent } from './emergency-main.component';
import { ERAdmittedPatientListComponent } from './finalized-patients/er-admitted-patient-list.component';
import { ERDeathPatientListComponent } from './finalized-patients/er-death-patient-list.component';
import { ERDischargedPatientListComponent } from './finalized-patients/er-discharged-patient-list.component';
import { ERDorPatientListComponent } from './finalized-patients/er-dor-patient-list.component';
import { ERFinalizedComponent } from './finalized-patients/er-finalized-patients.component';
import { ERLamaPatientListComponent } from './finalized-patients/er-lama-patient-list.component';
import { ERTransferredPatientListComponent } from './finalized-patients/er-transferred-patient-list.component';
import { NewFinalizedPatientsComponent } from './new-finalized-patients/new-finalized-patients.component';
import { ERPatientListComponent } from './patients-list/er-patient-list.component';
import { ERTriagePatientListComponent } from './triage/er-triage-patient-list.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: EmergencyMainComponent,
        canActivate: [AuthGuardService],
        children: [
          { path: '', redirectTo: 'Dashboard', pathMatch: 'full' },
          { path: 'Dashboard', component: EmergencyDashboardComponent, canActivate: [AuthGuardService], },
          { path: 'NewPatients', component: ERPatientListComponent, canActivate: [AuthGuardService], },
          { path: 'TriagePatients', component: ERTriagePatientListComponent, canActivate: [AuthGuardService], },
          { path: 'NewFinalizedPatients', component: NewFinalizedPatientsComponent, canActivate: [AuthGuardService], },
          {
            path: 'FinalizedPatients', component: ERFinalizedComponent, canActivate: [AuthGuardService],
            children: [
              { path: '', redirectTo: 'Lama-Patients', pathMatch: 'full' },
              { path: 'Lama-Patients', component: ERLamaPatientListComponent, canActivate: [AuthGuardService], },
              { path: 'Transferred-Patients', component: ERTransferredPatientListComponent, canActivate: [AuthGuardService], },
              { path: 'Discharged-Patients', component: ERDischargedPatientListComponent, canActivate: [AuthGuardService], },
              { path: 'Admitted-Patients', component: ERAdmittedPatientListComponent, canActivate: [AuthGuardService], },
              { path: 'Death-Patients', component: ERDeathPatientListComponent, canActivate: [AuthGuardService], },
              { path: 'Dor-Patients', component: ERDorPatientListComponent, canActivate: [AuthGuardService], },
              { path: "**", component: PageNotFound }
            ]
          },
          { path: 'BedInformations', component: BedInformationsComponent, canActivate: [AuthGuardService], },
          {
            path: 'Clinical-Overview',
            component: ClinicalOverviewWrapperComponent,
          },
          {
            path: "PatientOverviewMain",
            component: PatientOverviewMainComponent,
            canDeactivate: [ResetEmergencyContextGuard],
            canActivate: [ResetEmergencyContextGuard, AuthGuardService],
            children: [
              {
                path: "",
                redirectTo: "PatientOverview",
                pathMatch: "full",
              },
              {
                path: "PatientOverview",
                component: PatientOverviewComponent,
                canActivate: [AuthGuardService],
              },
              {
                path: "Clinical",
                loadChildren: "../clinical/clinical.module#ClinicalModule",
                canActivate: [AuthGuardService, SelectVisitCanActivateGuard],
              },
              {
                path: "WardBilling",
                component: ERWardBillingComponent,
                canActivate: [AuthGuardService],
              },
              {
                path: "DrugsRequest",
                component: DrugsRequestComponent,
                canActivate: [AuthGuardService],
              },
              {
                path: "DischargeSummary",
                component: InPatientDischargeSummaryComponent,
                canActivate: [AuthGuardService],
              },
              {
                path: "Notes",
                loadChildren: "../clinical-notes/notes.module#NotesModule",
                canActivate: [SelectVisitCanActivateGuard],
              },
              { path: "**", component: PageNotFound },
            ],
          },

          { path: "**", component: PageNotFound },
        ]
      }
    ])
  ],
  exports: [
    RouterModule
  ]
})
export class EmergencyRoutingModule {

}
