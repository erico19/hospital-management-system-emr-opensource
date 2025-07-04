
import { PageNotFound } from './404-error/404-not-found.component';
import { UnAuthorizedAccessComponent } from './account/unauthorizes-access.component';
import { DashboardHomeComponent } from './dashboards/home/dashboard-home.component';
import { DynamicReportComponent } from './dynamic-report/dynamic-report.component';
import { AuthGuardService } from './security/shared/auth-guard.service';
import { ActivateInventoryComponent } from './shared/activate-inventory/activate-inventory.component';
export const AppRoutingConstant = [
  { path: "", component: DashboardHomeComponent },
  { path: "Home/Index", component: DashboardHomeComponent },
  {
    path: "Doctors",
    loadChildren: "./doctors/doctors.module#DoctorsModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "Patient",
    loadChildren: "./patients/patients.module#PatientsModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "Appointment",
    loadChildren: "./appointments/appointments.module#AppointmentsModule",
    canActivate: [AuthGuardService],
    data: { currentRoute: "Appointment" }
  },
  {
    path: "Billing",
    loadChildren: "./billing/billing.module#BillingModule",
    canActivate: [AuthGuardService],
    data: { currentRoute: "Billing" }
  },
  { path: "Lab", loadChildren: "./labs/labs.module#LabsModule" },
  {
    path: "Radiology",
    loadChildren: "./radiology/radiology.module#RadiologyModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "Employee",
    loadChildren: "./employee/employee.module#EmployeeModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "ADTMain",
    loadChildren: "./adt/adt.module#ADTModule",
    data: { currentRoute: "ADTMain" }
  },
  {
    path: "Settings",
    loadChildren: "./settings-new/settings.module#SettingsModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "Reports",
    loadChildren: "./reporting/reporting.module#ReportingModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "Helpdesk",
    loadChildren: "./helpdesk/helpdesk.module#HelpdeskModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "Inventory",
    loadChildren: "./inventory/inventory.module#InventoryModule",
    canActivate: [AuthGuardService],
    data: { currentRoute: "Inventory" },
  },
  {
    path: "Accounting",
    loadChildren: "./accounting/accounting.module#AccountingModule",
  },
  {
    path: "SystemAdmin",
    loadChildren: "./system-admin/system-admin.module#SystemAdminModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "Pharmacy",
    loadChildren: "./pharmacy/pharmacy.module#PharmacyModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "Nursing",
    loadChildren: "./nursing/nursing.module#NursingModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "Scheduling",
    loadChildren: "./scheduling/scheduling.module#SchedulingModule",
    canActivate: [AuthGuardService],
  },
  //{
  //  path: "Fraction",
  //  loadChildren: "./fraction/fraction.module#FractionModule",
  //},
  {
    path: "WardSupply",
    loadChildren: "./wardsupply/wardsupply.module#WardSupplyModule",
  },
  {
    path: "Emergency",
    loadChildren: "./emergency/emergency.module#EmergencyModule",
  },
  {
    path: "Incentive",
    loadChildren: "./incentive/incentive.module#IncentiveModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "Medical-records",
    loadChildren:
      "./medical-records/medical-records.module#MedicalRecordsModule",
  },
  {
    path: "PayrollMain",
    loadChildren: "./payroll-module/payroll-main.module#PayrollMainModule",
  },
  {
    path: "Verification",
    loadChildren: "./verification/verification.module#VerificationModule",
  },
  {
    path: "OperationTheatre",
    loadChildren: "./ot/ot.module#OperationTheatreModule",
  },
  {
    path: "Dispensary",
    loadChildren: "./dispensary/dispensary.module#DispensaryModule",
  },
  {
    path: "SSU",
    loadChildren: "./ssu/social-service-unit.module#SocialServiceUnitModule",
  },
  {
    path: 'GovInsurance',
    loadChildren: './insurance/nep-gov/gov-insurance.module#GovInsuranceModule',
    canActivate: [AuthGuardService]
  },
  {
    path: "FixedAssets",
    loadChildren: "./fixed-asset/fixed-assets.module#FixedAssetsModule",
    data: { currentRoute: "FixedAssets" },
  },
  {
    path: "ProcurementMain",
    loadChildren: "./procurement/procurement.module#ProcurementModule",
    canActivate: [AuthGuardService],
    data: { currentRoute: "ProcurementMain" },
  },
  {
    path: "CSSD",
    loadChildren: "./cssd/cssd.module#CssdModule",
    canActivate: [AuthGuardService],
  },
  { path: "ActivateInventory", component: ActivateInventoryComponent },
  {
    path: "Maternity",
    loadChildren: "./maternity/maternity.module#MaternityModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "Vaccination",
    loadChildren: "./vaccination/vaccination.module#VaccinationModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "QueueManagement",
    loadChildren:
      "./queue-management/queue-management.module#QueueManagementModule",
    canActivate: [AuthGuardService],
  },
  {
    path: "ClaimManagement",
    loadChildren:
      "./claim-management/claim-management.module#ClaimManagementModule"
    , canActivate: [AuthGuardService]
  },
  { path: "DynamicReport", component: DynamicReportComponent },
  { path: "UnAuthorized", component: UnAuthorizedAccessComponent },
  { path: "Utilities", loadChildren: "./utilities/utilities.module#UtilitiesModule", canActivate: [AuthGuardService], data: { currentRoute: 'Utilities' } },
  { path: "MktReferral", loadChildren: "./mktreferral/mktreferral.module#MktreferralModule" },
  {
    path: "Clinical", loadChildren: "./clinical-new/clinical-new.module#ClinicalNewModule", data: { currentRoute: "Clinical" },
  },
  {
    path: "Dashboard",
    // component: DanpheDashboardComponent,
    loadChildren: "./danphe-dashboard/danphe-dashboard.module#DanpheDashboardModule",
    canActivate: [AuthGuardService],
  },


  {
    path: "ClinicalSettings",
    loadChildren: "./clinical-settings/clinical-settings.module#ClinicalSettingsModule",
    canActivate: [AuthGuardService],
  },


  { path: "**", component: PageNotFound },
];
