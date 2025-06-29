import * as moment from "moment/moment";

import { SecurityService } from '../../security/shared/security.service';
import VerificationGridColumns from "../../verification/shared/verification-grid-column";
import { CommonFunctions } from "../common.functions";
import { ENUM_AppointmentType, ENUM_ConsultationRequestStatus, ENUM_DateTimeFormat, ENUM_VisitType } from "../shared-enums";
export default class GridColumnSettings {
  static securityService;
  static currentUserId: number;
  static isAdmin: boolean;
  static ShowAddEditReportButton = false;
  static ShowAddEditFileButton = false;

  constructor(private _securityService: SecurityService) {
    GridColumnSettings.securityService = this._securityService;
    let loggedInUser = this._securityService.GetLoggedInUser();
    if (loggedInUser != null) {
      GridColumnSettings.currentUserId = loggedInUser.EmployeeId;
      GridColumnSettings.isAdmin = loggedInUser.IsSystemAdmin;
    }
  }
  static initialize(securityService: SecurityService): void {
    GridColumnSettings.securityService = securityService;
    let radiologyFlowParam = securityService.getRadiologyFlowParameter();
    if (radiologyFlowParam) {
      GridColumnSettings.ShowAddEditReportButton = radiologyFlowParam.ShowAddEditReportButton;
      GridColumnSettings.ShowAddEditFileButton = radiologyFlowParam.ShowAddEditFileButton;
    }
  }
  static ERPatientVisitsList = [
    { headerName: "Hospital No.", width: 80, field: "PatientCode" },
    { headerName: "Patient", field: "Name", width: 100 },
    {
      headerName: "Age/Gender",
      field: "",
      width: 60,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    {
      headerName: "Visit Date",
      field: "VisitDate",
      width: 100,
    },
    {
      headerName: "Visit Time",
      field: "VisitTime",
      width: 100,
    },
    {
      headerName: "Triage Status",
      field: "TriageStatus",
      width: 100,
    },
    {
      headerName: "Triaged On",
      width: 100,
      field: "TriagedOn",
    },
    { headerName: "Assigned Doctor", field: "Doctor", width: 100 },
    {
      headerName: "Actions",
      field: "",
      width: 50,
      cellRenderer: GridColumnSettings.PreviewPatientRenderer,
    },
  ];

  MapAnaesthesiaListGridColumns = [
    { headerName: "Anaesthesia Type", field: "AnaesthesiaType", width: 300 },
    { headerName: "Billing Item", field: "ItemName", width: 300 },
    { headerName: "IsActive", field: "IsActive", width: 120 },
    {
      headerName: "Actions", field: "", width: 150,
      cellRenderer: GridColumnSettings.MapAnaesthesiaListActions
    },
  ];
  private static MapAnaesthesiaListActions(params) {
    let template;
    if (params.data) {
      template = `<a danphe-grid-action="edit" class="grid-action"> <i class="fa fa-edit"></i>Edit</a>`;
    }
    return template;
  }

  AnaesthesiaTypeListGridColumns = [
    { headerName: "Anaesthesia Type", field: "AnaesthesiaType", width: 300 },
    { headerName: "IsActive", field: "IsActive", width: 120 },
    {
      headerName: "Actions", field: "", width: 150,
      cellRenderer: GridColumnSettings.AnaesthesiyaTypeListActions
    },
  ];
  private static AnaesthesiyaTypeListActions(params) {
    let template;
    if (params.data) {
      template = `<a danphe-grid-action="edit" class="grid-action"> <i class="fa fa-edit"></i>Edit</a>`;
    }
    return template;
  }

  static PatientVisitsList = [
    { headerName: "Hospital No.", width: 80, field: "PatientCode" },
    { headerName: "Patient", field: "Name", width: 100 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 60,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    {
      headerName: "Appointment Date",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.ApptDateOnlyRenderer,
    },
    {
      headerName: "Appointment Time",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.AppointmentTimeRenderer,

    },
    { headerName: "Department", field: "DepartmentName", width: 100 },
    { headerName: "Doctor", field: "Doctor", width: 120 },
    { headerName: "Appointment Type", field: "AppointmentType", width: 100 },
    {
      headerName: "Actions",
      field: "",
      width: 50,
      cellRenderer: GridColumnSettings.PreviewPatientRenderer,
    },
  ];

  static AdmittedPatientList = [
    {
      headerName: "Admission Date",
      width: 100,
      field: "AdmittedDate"
    },
    { headerName: "Hospital No.", width: 80, field: "PatientCode" },
    { headerName: "IP Number.", width: 80, field: "VisitCode" },
    { headerName: "Patient", field: "Name", width: 100 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "Admitting Doctor", field: "AdmittingDoctorName", width: 150 },
    { headerName: "Department", field: "DepartmentName", width: 100 },
    {
      headerName: "Ward/Bed",
      field: "WardBed",
      width: 100,
    },
    {
      headerName: "Actions",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.PreviewPatientRenderer,
    },
  ];

  static DischargedPatientList = [
    { headerName: "Hospital No.", width: 80, field: "PatientCode" },
    { headerName: "IP Number.", width: 80, field: "VisitCode" },
    { headerName: "Patient", field: "Name", width: 100 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    {
      headerName: "Admission Date",
      width: 160,
      field: "AdmittedDate"
    },
    { headerName: "Admitting Doctor", field: "AdmittingDoctorName", width: 150 },
    { headerName: "Department", field: "DepartmentName", width: 100 },
    {
      headerName: "Ward/Bed",
      field: "WardBed",
      width: 100,

    },
    {
      headerName: "Discharged Date", field: "DischargeDate", width: 150
    },
    {
      headerName: "Actions",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.PreviewPatientRenderer,
    },
  ];
  static LeaveRuleList = [
    { headerName: "Leave Category", field: "LeaveCategoryName", width: 110 },
    { headerName: "Days", field: "Days", width: 110 },
    {
      headerName: "Created Date",
      field: "CreatedOn",
      width: 110,
      cellRenderer: GridColumnSettings.ApptDateOnlyRenderer,
    },
    { headerName: "Pay (%)", field: "PayPercent", width: 110 },
    { headerName: "Is Active", field: "IsActive", width: 110 },
    { headerName: "Is Approved", field: "IsApproved", width: 110 },
    {
      headerName: "Action",
      field: "",
      width: 120,
      template: `<a danphe-grid-action="edit" class="grid-action">
        <i class="icon-pencil"></i>  Edit
             </a>`,
    },
  ];

  static EmployeeListwithStatus = [
    { headerName: "Employee Name", field: "EmpName", width: 100 },
    { headerName: "Leave Type", field: "leavetype", width: 100 },
    {
      headerName: "Leave Date",
      field: "RequestedLeaveDate",
      width: 100,
      cellRenderer: GridColumnSettings.LeaveEquestDateOnlyRenderer,
    },
    { headerName: "Requested To", field: "RequestedTo", width: 100 },
    { headerName: "Status", field: "LeaveStatus", width: 100 },
    {
      headerName: "Approved Date",
      field: "ApprovedDate",
      width: 100,
      cellRenderer: GridColumnSettings.ApprovedDateOnlyRenderer,
    },
    { headerName: "Approved By", field: "ApprovedBy", width: 100 },
    {
      headerName: "Cancelled Date",
      field: "CancelledDate",
      width: 100,
      cellRenderer: GridColumnSettings.CancelledDateOnlyRenderer,
    },
    { headerName: "Cancelled By", field: "CancelledBy", width: 100 },
    // {
    //   headerName: "Action",
    //   field: "",
    //   width: 100,
    //   // template:
    //   //   `<a danphe-grid-action="edit" class="grid-action">
    //   //           Edit
    //   //        </a>`
    // }
  ];

  static LeaveCategoryList = [
    { headerName: "Category Code", field: "CategoryCode", width: 125 },
    {
      headerName: "Leave Category Name",
      field: "LeaveCategoryName",
      width: 125,
    },
    { headerName: "Description", field: "Description", width: 125 },
    {
      headerName: "Action",
      field: "",
      template: `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];

  static AppointmentSearch = [
    {
      headerName: "Status",
      field: "AppointmentStatus",
      width: 110,
      cellRenderer: GridColumnSettings.GetApptStatus,
    },
    { headerName: "Date", field: "AppointmentDate", width: 80 },
    { headerName: "Time", field: "AppointmentTime", width: 75 },
    { headerName: "App. Id", field: "AppointmentId", width: 50 },
    { headerName: "Name", field: "FullName", width: 140 },
    { headerName: "Phone", field: "ContactNumber", width: 110 },
    { headerName: "Doctor", field: "PerformerName", width: 150 },
    { headerName: "Visit Type", field: "AppointmentType", width: 120 },
    {
      headerName: "Actions",
      field: "",
      width: 200,
      cellRenderer: GridColumnSettings.GetApptActions,

      //< /a><a danphe-grid-action="admit" class="grid-action">
      //   Admit
      //    </a >
    },
  ];
  static EmployeeInfoSearch = [
    { headerName: "Employee Name", field: "EmployeeName", width: 200 },
    { headerName: "Designation", field: "Designation", width: 110 },
    { headerName: "Department", field: "DepartmentName", width: 130 },
    { headerName: "Phone No.", field: "ContactNumber", width: 150 },
    { headerName: "Ext.", field: "Extension", width: 80 },
    { headerName: "SpeedDial", field: "SpeedDial", width: 80 },
    { headerName: "Room No.", field: "RoomNumber", width: 80 },
    {
      headerName: "Office Hours",
      field: "",
      width: 280,
      cellRenderer: GridColumnSettings.EmpOfficeHrsRenderer,
    },
  ];
  static DesignationList = [
    { headerName: "Designation Name", field: "DesignationName", width: 200 },
    { headerName: "Description", field: "Description", width: 200 },
    {
      headerName: "Created On",
      field: "CreatedOn",
      width: 200,
      cellRenderer: GridColumnSettings.CreatedDateTimeRenderer,
    },
    {
      headerName: "Action",
      field: "",
      width: 120,
      template: `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];

  //EyeHistoryList
  static EyeHistoryList = [
    { headerName: "Visit Id", field: "VisitId", width: 80 },
    {
      headerName: "Visit Date",
      field: "VisitDate",
      width: 80,
      cellRenderer: GridColumnSettings.ApptDateOnlyRenderer,
    },
    {
      headerName: "Action",
      field: "",

      width: 120,
      template: ` <a danphe-grid-action="view-detail" class="grid-action">
                <i class="fa fa-eye"></i>View Detail
             </a>
          <a danphe-grid-action="edit" class="grid-action">
                <i class="fa fa-pencil"></i>Edit
             </a>`,
    },
  ];
  static PrescriptionSlipList = [
    { headerName: "Visit Id", field: "VisitId", width: 80 },
    { headerName: "Visit Date", field: "VisitDate", width: 80 },
    {
      headerName: "Action",
      field: "",

      width: 120,
      template: ` <a danphe-grid-action="view-detail" class="grid-action">
                 <i class="fa fa-eye"></i>View Detail
             </a>
          <a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];
  static FractionApplicableItemList = [
    { headerName: "Item Name", field: "ItemName", width: 350 },
    { headerName: "Hospital Percent", field: "HospitalPercent", width: 150 },
    { headerName: "Doctor Percent", field: "DoctorPercent", width: 150 },
    { headerName: "Description", field: "Description", width: 300 },
    {
      headerName: "Action",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.parseTemplateForFractionApplicable,
    },
  ];
  static FractionReportByItem = [
    { headerName: "Item Name", field: "ItemName", width: 350 },
    {
      headerName: "Service Department Name",
      field: "ServiceDepartmentName",
      width: 150,
    },
    { headerName: "Price", field: "Price", width: 150 },
    {
      headerName: "Total Fraction Amount",
      field: "FractionAmount",
      width: 300,
    },
  ];
  static FractionReportByDoctor = [
    { headerName: "Doctor Name", field: "DoctorName", width: 200 },
    { headerName: "Item Name", field: "ItemName", width: 200 },
    { headerName: "Price", field: "Price", width: 100 },
    { headerName: "Fraction Amount", field: "FractionAmount", width: 100 },
    { headerName: "5% TDS", field: "TDS", width: 100 },
    { headerName: "Net Amount", field: "NetAmount", width: 100 },
  ];
  static BedInfoSearch = [
    { headerName: "Ward", field: "WardName", width: 200 },
    { headerName: "Bed No.", field: "BedNumber", width: 100 },
    { headerName: "Bed Feature", field: "BedFeatureName", width: 200 },
    { headerName: "Price", field: "BedPrice", width: 100 },
    {
      headerName: "Is Occupied",
      field: "IsOccupied",
      width: 100,
      cellRenderer: GridColumnSettings.TrueFalseViewer,
    },
  ];
  static WardInfoSearch = [
    { headerName: "Ward Name", field: "WardName", width: 200 },
    { headerName: "Total Beds", field: "Total", width: 180 },
    { headerName: "Available", field: "Vacant", width: 180 },
    { headerName: "Occupied", field: "Occupied", width: 180 },
    //{ headerName: "Maintainance", field: "", width: 180 }
  ];

  // static PendingLabResults = [
  //   { headerName: "Hospital No.", field: "PatientCode", width: 100 },
  //   { headerName: "Patient Name", field: "PatientName", width: 160 },
  //   { headerName: "Age/Sex", field: "", width: 70, cellRenderer: GridColumnSettings.AgeSexRendererPatient },
  //   { headerName: "Phone Number", field: "PhoneNumber", width: 100 },
  //   { headerName: "Test Name", field: "LabTestCSV", width: 200 },
  //   { headerName: "Category", field: "TemplateName", width: 180 },
  //   { headerName: "Requesting Dept.", field: "WardName", width: 90 },
  //   { headerName: "Run No.", width: 80, field: "SampleCodeFormatted" },
  //   { headerName: "Bar Code", width: 90, field: "BarCodeNumber" },
  //   {
  //     headerName: "Actions",
  //     field: "",
  //     width: 250,
  //     template:
  //       `<a danphe-grid-action="addresult" class="grid-action">
  //                   Add Result
  //                </a>
  //                <a danphe-grid-action="labsticker" class="grid-action"><i class="glyphicon glyphicon-print"></i> Sticker</a>
  //                <a danphe-grid-action="undo" class="grid-action">Undo</a>
  //               `
  //   }

  // ]

  PatientSearch = [
    { headerName: "Hospital Number", field: "PatientCode", width: 160 },
    { headerName: "Patient Name", field: "ShortName", width: 200 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.NewAgeSexRendererPatient,
    },
    {
      headerName: "Address", field: "SortedAddress", width: 110,
    },
    { headerName: "Phone", field: "PhoneNumber", width: 110 },
    {
      headerName: "Actions",
      field: "",
      resizable: true,
      cellRenderer: GridColumnSettings.GetPatientActions

    },
  ];






  static GetPatientActions(params) {
    let template = "";

    if (GridColumnSettings.securityService.HasPermission("btn-patient-edit-view")) {
      template += `<a danphe-grid-action="edit" class="grid-action">Edit</a>`;
    }
    template += `<a danphe-grid-action="showHistory" class="grid-action">History</a>
    <div class="dropdown" style="display:inline-block;">
     <button class="dropdown-toggle grid-btnCstm" type="button" data-toggle="dropdown">...
     <span class="caret"></span></button>
     <ul class="dropdown-menu grid-ddlCstm">
       <li><a danphe-grid-action="uploadfiles" >Upload Files</a></li>
       <li><a danphe-grid-action="showHealthCard" >Health Card</a></li>
       <li><a danphe-grid-action="showNeighbourCard" >Visitor Card</a></li>`;
    if (GridColumnSettings.securityService.HasPermission("patient-pat-sticker-button")) {
      template += `<li><a danphe-grid-action="showPatientSticker" >Patient Sticker</a></li>`;
    }
    if (GridColumnSettings.securityService.HasPermission("btn-patient-assign-member") && params.data.ISMedicareMember === 0) {
      template += `<li><a danphe-grid-action="assignMember">Assign Member</a></li>`;
    }
    +`</ul>
    </div>`;

    // if (
    //   GridColumnSettings.securityService.HasPermission("btn-patient-edit-view")
    // ) {
    //     template = (GridColumnSettings.securityService.HasPermission("patient-pat-sticker-button") == true) ? template + `<a danphe-grid-action="edit" class="grid-action">Edit</a>
    //     <a danphe-grid-action="showHistory" class="grid-action">History</a>
    //        <div class="dropdown" style="display:inline-block;">
    //         <button class="dropdown-toggle grid-btnCstm" type="button" data-toggle="dropdown">...
    //         <span class="caret"></span></button>
    //         <ul class="dropdown-menu grid-ddlCstm">
    //           <li><a danphe-grid-action="uploadfiles" >Upload Files</a></li>
    //           <li><a danphe-grid-action="showHealthCard" >Health Card</a></li>
    //           <li><a danphe-grid-action="showNeighbourCard" >Visitor Card</a></li>
    //           <li>
    //           <a danphe-grid-action="showPatientSticker" >Patient Sticker</a>
    //           </li>
    //         </ul>
    //        </div>` : template +  `<a danphe-grid-action="showHistory" class="grid-action">History</a>
    //        <div class="dropdown" style="display:inline-block;">
    //         <button class="dropdown-toggle grid-btnCstm" type="button" data-toggle="dropdown">...
    //         <span class="caret"></span></button>
    //         <ul class="dropdown-menu grid-ddlCstm">
    //           <li><a danphe-grid-action="uploadfiles" >Upload Files</a></li>
    //           <li><a danphe-grid-action="showHealthCard" >Health Card</a></li>
    //           <li><a danphe-grid-action="showNeighbourCard" >Visitor Card</a></li>
    //         </ul>
    //        </div>`
    //        ;
    // } else {
    //   template += `<a danphe-grid-action="showHistory" class="grid-action">History</a>
    //               <div class="dropdown" style="display:inline-block;">
    //                <button class="dropdown-toggle grid-btnCstm" type="button" data-toggle="dropdown">...
    //                <span class="caret"></span></button>
    //                <ul class="dropdown-menu grid-ddlCstm">
    //                  <li><a danphe-grid-action="uploadfiles" >Upload Files</a></li>
    //                  <li><a danphe-grid-action="showHealthCard" >Health Card</a></li>
    //                  <li><a danphe-grid-action="showNeighbourCard" >Visitor Card</a></li>
    //                </ul>
    //               </div>`;
    // }
    return template;
  }
  //this is same to that of PatientSearch with only few fields added.
  //needs review whether it is required or not--sudarshan

  //< a danphe-grid - action="deposit" class="grid-action color-red " >
  //Deposit
  //< /a>

  //static AdmissionSearchPatient = [

  //    { headerName: "Hospital Number", field: "PatientCode", width: 160 },
  //    { headerName: "Name", field: "ShortName", width: 200 },
  //    { headerName: "Age/Sex", field: "", width: 110, cellRenderer: GridColumnSettings.AgeSexRendererPatient },
  //    { headerName: "Phone", field: "PhoneNumber", width: 110 },
  //    { headerName: "Address", field: "Address", width: 110 },
  //    { headerName: "Actions", field: "", width: 100, cellRenderer: GridColumnSettings.ShowActionforADTPatientSearch }

  //]

  //static AdmittedList = [
  //    { headerName: "Admitted Date", field: "AdmittedDate", width: 150, cellRenderer: GridColumnSettings.AdmissionDateRenderer },
  //    { headerName: "Hospital Number", field: "PatientCode", width: 150 },
  //    { headerName: "IP Number", field: "VisitCode", width: 120 },
  //    { headerName: "Name", field: "Name", width: 200 },
  //    { headerName: "Age/Sex", field: "", width: 110, cellRenderer: GridColumnSettings.AgeSexRendererPatient },
  //    { headerName: "AdmittingDoctor", field: "AdmittingDoctorName", width: 200 },
  //    { headerName: "Bed Feature", field: "BedInformation.BedFeature", width: 100 },
  //    { headerName: "BedCode", field: "BedInformation.BedCode", width: 120 },
  //    {
  //        headerName: "Actions",
  //        field: "",
  //        width: 400,
  //        template:
  //            //   `<a danphe-grid-action="discharge" class="grid-action">
  //            //  Discharge
  //            //</a>
  //            `<a danphe-grid-action="transfer" class="grid-action">
  //           Transfer
  //         </a>
  //            <a danphe-grid-action="show-sticker"  title="Print Sticker" class="grid-action">
  //          <i class="glyphicon glyphicon-print"></i>&nbsp;sticker
  //         </a>
  //            <div class="dropdown" style="display:inline-block;">
  //              <button class="dropdown-toggle grid-btnCstm" style="background-color: #3598dc;" type="button" data-toggle="dropdown">...
  //              <span class="caret"></span></button>
  //                <ul class="dropdown-menu grid-ddlCstm">
  //                    <li><a danphe-grid-action="upgrade">Change Bed Feature</a></li>
  //                    <li><a danphe-grid-action="billdetail">Bill Details</a></li>

  //                    <li><a danphe-grid-action="generic-sticker" title="Generic Sticker"><i class="glyphicon glyphicon-print"></i>&nbsp;Patient Generic Sticker</a></li>
  //                    <li><a danphe-grid-action="cancel">Cancel</a> </li>
  //                     <li><a danphe-grid-action="ip-wrist-band" title="WristBand"><i class="glyphicon glyphicon-print"></i>&nbsp;Wrist-Band</a></li>
  //                </ul>
  //            </div>`
  //    }
  //]

  ////moved to adt-grid-column-settings inside adt module.:sud- 10Jan'19
  //static DischargedList = [
  //    { headerName: "Admitted On", field: "AdmittedDate", width: 120, cellRenderer: GridColumnSettings.AdmissionDateRenderer },
  //    { headerName: "Discharged On", field: "DischargedDate", width: 120, cellRenderer: GridColumnSettings.DischargeDateRenderer },
  //    { headerName: "Hospital No", field: "PatientCode", width: 120 },
  //    { headerName: "IP Number", field: "VisitCode", width: 100 },
  //    { headerName: "Name", field: "Name", width: 180 },
  //    { headerName: "Age/Sex", field: "", width: 100, cellRenderer: GridColumnSettings.AgeSexRendererPatient },
  //    { headerName: "Phone", field: "PhoneNumber", width: 110 },
  //    { headerName: "BillStatus", field: "BillStatusOnDischarge", width: 100 },
  //    {
  //        headerName: "Actions",
  //        field: "",
  //        width: 210,
  //        cellRenderer: GridColumnSettings.DischargeListActionRenderer
  //    }
  //]

  //replaced template in actions by cell-renderer, which will give us the html dynamically.. —
  static VisitSearch = [
    {
      headerName: "Date",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.VisitDateOnlyRenderer,
    },
    {
      headerName: "Time",
      field: "",
      width: 90,
      cellRenderer: GridColumnSettings.VisitTimeOnlyRenderer,
    },
    { headerName: "Hospital No.", field: "PatientCode", width: 140 },
    { headerName: "Name", field: "ShortName", width: 170 },
    { headerName: "Phone", field: "PhoneNumber", width: 125 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 90,
      cellRenderer: GridColumnSettings.VisitListAgeSexRenderer,
    },
    { headerName: "Department", field: "DepartmentName", width: 190 },
    { headerName: "Doctor", field: "PerformerName", width: 190 },
    { headerName: "VisitType", field: "VisitType", width: 120 },
    { headerName: "Appt. Type", field: "AppointmentType", width: 130 },
    {
      headerName: "Days-Passed",
      field: "",
      width: 90,
      cellRenderer: GridColumnSettings.VisitDaysPassedRenderer,
    },
    {
      headerName: "SchemeName",
      field: "SchemeName",
      width: 90,
    },
    {
      headerName: "Queue No.",
      field: "QueueNo",
      width: 90,
    },
    {
      headerName: "Actions",
      field: "",
      width: 320,
      cellRenderer: GridColumnSettings.VisitActionsRenderer,
    },
  ];

  static VisitDaysPassedRenderer(params) {
    let date: string = params.data.VisitDate;
    let daysPassed = moment().diff(moment(date), "days");

    return daysPassed;
  }

  static BillPatientSearch = [
    {
      headerName: "Type",
      field: "BillingType",
      width: 60,
      cellRenderer: GridColumnSettings.PatientTypeCellRenderer,
    },
    { headerName: "Hospital No.", field: "PatientCode", width: 120 },
    { headerName: "Patient Name", field: "ShortName", width: 200 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 90,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "Address", field: "Address", width: 120 },
    { headerName: "Phone", field: "PhoneNumber", width: 110 },
    {
      headerName: "Actions",
      field: "",
      width: 280,
      cellRenderer: GridColumnSettings.BillingSearchActionsRenderer,
    },
  ];

  static BillingSearchActionsRenderer(params) {
    let templateHtml = "";
    let patient = params.data;
    templateHtml += `<a danphe-grid-action="billingRequest" class="grid-action">
                <i class="fa fa-file-text-o"></i>&nbsp;Billing Request
             </a>
             <a danphe-grid-action="deposit" class="grid-action">
                 <i class="fa fa-file-text"></i>&nbsp;Deposit
             </a>
             <a danphe-grid-action="bill-history" class="grid-action">
                            <i class="fa fa-list"></i>&nbsp;Bill History
               </a>`;

    //if (patient.Insurance) {
    //  templateHtml += `<div class="dropdown" style="display:inline-block;">
    //             <button class="dropdown-toggle grid-btnCstm" style="background-color:#3598dc" data-toggle="dropdown">...
    //                    <span class="caret"></span>
    //                </button>
    //             <ul class="dropdown-menu grid-ddlCstm">
    //               <li><a danphe-grid-action="insurance-billing" class="grid-action">
    //                     Insurance Billing</a></li>
    //                </ul>
    //              </div>`
    //}
    return templateHtml;
  }



  // public static ManageDrCr(params) {
  //   let row = params.data;
  //   if (row.DrCr == true) {
  //     return `<b>Dr</b>`;
  //   }
  //   else {
  //     return `<b>Cr</b>`
  //   }
  // }

  static PatientTypeCellRenderer(params) {
    let row = params.data;

    if (row.BillingType == "IP") {
      return `<b class="badge-ip">IP</b>`;
    } else {
      return `<b class="badge-op">OP</b>`;
    }
  }

  //for gridview inside : Billing/BillOrderRequests
  static BillPendingOrderSearch = [
    { headerName: "Department", field: "ServiceDepartmentName", width: 110 },
    { headerName: "Hospital Number", field: "Patient.PatientCode", width: 100 },
    { headerName: "Patient Name.", field: "Patient.ShortName", width: 160 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 80,
      cellRenderer: GridColumnSettings.AgeSexRenderer_BillOrders,
    },
    { headerName: "Phone", field: "Patient.PhoneNumber", width: 110 },
    { headerName: "Total", field: "TotalAmount", width: 80 },
    { headerName: "RequestedBy", field: "RequestedBy", width: 120 },
    {
      headerName: "Last Req Date",
      field: "RequestDate",
      width: 130,
      cellRenderer: GridColumnSettings.BilPendingOrderDateTimeRenderer,
    },

    {
      headerName: "Actions",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="payOne" class="grid-action">
                Pay Request
             </a>
             <a danphe-grid-action="payAll" class="grid-action">
                Pay All
             </a>`,
    },
  ];

  static BillingProvisionalOutPatientErClearanceGridColumns = [
    {
      headerName: "Scheme",
      field: "SchemeName",
      width: 100,
    },
    {
      headerName: "Hospital Number",
      field: "PatientCode",
      width: 170
    },
    {
      headerName: "Patient Name",
      field: "ShortName",
      width: 160
    },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.NewAgeSexRendererPatient
    },
    {
      headerName: "Contact No.",
      field: "PhoneNumber",
      width: 100
    },

    {
      headerName: "Last Bill Date",
      field: "LastCreditBillDate",
      width: 180,
      cellRenderer: GridColumnSettings.BilProvisionalDateTimeRenderer
    },
    { headerName: "Total", field: "TotalCredit", width: 110 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>
             `
    },

  ];

  static BillCreditBillSearch = [
    {
      headerName: "Scheme",
      field: "SchemeName",
      width: 100
    },
    {
      headerName: "Hospital Number",
      field: "PatientCode",
      width: 170
    },
    {
      headerName: "Patient Name",
      field: "ShortName",
      width: 160
    },
    {
      headerName: "Visit Type",
      field: "VisitType",
      width: 130
    },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient
    },
    {
      headerName: "Contact No.",
      field: "ContactNo",
      width: 100
    },

    {
      headerName: "Last Bill Date",
      field: "VisitDate",
      width: 180,
      cellRenderer: GridColumnSettings.BilProvisionalDateTimeRenderer,
    },
    { headerName: "Total", field: "TotalCredit", width: 110 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>
             <a danphe-grid-action="view" class="grid-action">
                Print
             </a>
             `
    },

  ];
  static InsuranceBillCreditBillSearch = [
    {
      headerName: "Hospital Number",
      field: "PatientCode",
      width: 170
    },
    {
      headerName: "Patient Name",
      field: "ShortName",
      width: 160
    },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient
    },
    {
      headerName: "LastCreditBillDate",
      field: "LastCreditBillDate",
      width: 180,
      cellRenderer: GridColumnSettings.BilProvisionalDateTimeRenderer,
    },
    { headerName: "Total", field: "TotalCredit", width: 110 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>
              <a danphe-grid-action="view" class="grid-action">
                        Print
                     </a>`,
    },
  ];

  static BillSettlementBillSearch = [
    { headerName: "Hospital No.", field: "PatientCode", width: 120 },
    { headerName: "Patient Name", field: "PatientName", width: 150 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.NewAgeSexRendererPatient,
    },
    { headerName: "Credits", field: "CreditTotal", width: 110 },
    { headerName: "Provisional", field: "ProvisionalTotal", width: 110 },
    { headerName: "Deposits", field: "DepositBalance", width: 110 },
    {
      headerName: "Balance",
      field: "CreditTotal",
      width: 110,
      cellRenderer: GridColumnSettings.SettlementBalanceRenderer,
    },
    {
      headerName: "Last Transaction",
      field: "LastTxnDate",
      width: 160,
      cellRenderer: GridColumnSettings.BilCreditDateTimeRenderer,
    },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>`,
    },
  ];

  static IPBillItemGridCol = [
    { headerName: "Date", field: "CreatedOn", width: 90 },
    { headerName: "ReceiptNo", field: "ProvisionalReceiptNoFormatted", width: 90 },
    { headerName: "Department", field: "ServiceDepartmentName", width: 100 },
    { headerName: "ItemName", field: "ItemName", width: 160 },
    { headerName: "Qty.", field: "Quantity", width: 60 },
    { headerName: "Sub Total", field: "SubTotal", width: 85 },
    // { headerName: "DiscountPercent", field: "DiscountPercent", width: 85 },

    { headerName: "DiscAmt", field: "DiscountAmount", width: 85, cellRenderer: GridColumnSettings.DiscountAmountRenderer },
    // { headerName: "Disc%", field: "DiscountPercent", width: 70 },
    // { headerName: "Total Amount", field: "TotalAmount", width: 85 },
    { headerName: "Performer", field: "PerformerName", width: 100 },
    {
      headerName: "Action",
      field: "",
      width: 70,
      template: `<a danphe-grid-action="edit" class="grid-action fa fa-pencil" title="click to edit this item">
               Edit
             </a>
          `,
    },
    {
      headerName: "User",
      field: "CreatedBy",
      width: 70,
      cellRenderer: GridColumnSettings.IPBillItemRenderer_CreatedBy,
    },
    {
      headerName: "Modified By",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.IPBillItemRenderer_ModifiedBy,
    },
  ];
  static CancelledServicesGridCol = [
    { headerName: "Date", field: "CreatedOn", width: 90 },
    { headerName: "ReceiptNo", field: "CancellationReceiptNo", width: 90 },
    { headerName: "Ref. ReceiptNo", field: "ReferenceProvisionalReceiptNo", width: 90 },
    { headerName: "Department", field: "ServiceDepartmentName", width: 100 },
    { headerName: "ItemName", field: "ItemName", width: 160 },
    { headerName: "Qty.", field: "CancelledQty", width: 60 },
    { headerName: "Sub Total", field: "CancelledSubtotal", width: 85 },

    { headerName: "DiscAmt", field: "CancelledDiscountAmount", width: 85 },
    {
      headerName: "User",
      field: "User",
      width: 70,
    },
    {
      headerName: "Cancelled Remarks",
      field: "CancellationRemarks",
      width: 110,
    },
  ];

  static SettlementBalanceRenderer(params) {
    let data = params.data;
    let credit: number = data.CreditTotal;
    let depositBal: number = data.DepositBalance;
    let provBal: number = data.ProvisionalTotal;

    let balAmt: number = depositBal - credit - provBal;

    balAmt = CommonFunctions.parseAmount(balAmt);

    if (balAmt > 0) {
      return "(+)" + balAmt.toString() + "";
    } else {
      return "(-)" + (-balAmt).toString() + "";
    }

    //if (balAmt < 0) {
    //    balAmt = -balAmt;
    //    return `<label style="font-weight: bold;border: 2px solid red;background-color:red;color: white;padding:0px 4px;margin-left: 4px;">` + balAmt + `</label>`;
    //}
    //else
    //    return `<label style="font-weight: bold;border: 2px solid green;background-color:green;color: white;padding:0px 4px;margin-left: 4px;">` + balAmt + `</label>`;
  }

  static PHRMSettlementBillSearch = [
    { headerName: "Hospital No.", field: "PatientCode", width: 120 },
    { headerName: "Patient Name", field: "PatientName", width: 150 },
    {
      headerName: "Age/Sex",
      field: "Gender",
      width: 110,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "Deposit Amt", field: "DepositBalance", width: 120 },
    { headerName: "Credit Amt", field: "CreditTotal", width: 120 },
    {
      headerName: "Provisional Amt",
      field: "",
      width: 140,
      cellRenderer: GridColumnSettings.PHRMProvisionalTotal,
    },
    {
      headerName: "Balance Amt",
      field: "",
      width: 120,
      cellRenderer: GridColumnSettings.PHRMSettlementBalanceRenderer,
    },
    {
      headerName: "Last Credit",
      field: "CreditDate",
      width: 160,
      cellRenderer: GridColumnSettings.phrmCreditDateTimeRenderer,
    },
    {
      headerName: "Last Deposit",
      field: "DepositDate",
      width: 160,
      cellRenderer: GridColumnSettings.phrmDepositDateTimeRenderer,
    },
    {
      headerName: "Status",
      field: "BilStatus",
      width: 100,
      cellRenderer: GridColumnSettings.BillStatus,
    },
    {
      headerName: "Action",
      field: "",
      width: 200,
      cellRenderer: GridColumnSettings.settlementAction,
    },
  ];

  static PHRMSettlementDuplicate = [
    { headerName: "Hospital No.", field: "PatientCode", width: 120 },
    { headerName: "Patient Name", field: "PatientName", width: 150 },
    {
      headerName: "Age/Sex",
      field: "Gender",
      width: 110,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "Credits", field: "CreditTotal", width: 110 },
    {
      headerName: "Provisional",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.PHRMProvisionalTotal,
    },
    { headerName: "Deposits", field: "DepositBalance", width: 110 },
    {
      headerName: "Balance",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.PHRMSettlementBalanceRenderer,
    },
    {
      headerName: "Last Credit",
      field: "CreditDate",
      width: 160,
      cellRenderer: GridColumnSettings.phrmCreditDateTimeRenderer,
    },
    {
      headerName: "Last Deposit",
      field: "DepositDate",
      width: 160,
      cellRenderer: GridColumnSettings.phrmDepositDateTimeRenderer,
    },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="showDetails" class="grid-action">
               Details
             </a>`,
    },
  ];

  static phrmCreditDateTimeRenderer(params) {
    if (params.data.CreditDate == null) {
      return "--No sale--";
    }
    return moment(params.data.CreditDate).format("YYYY-MM-DD HH:mm");
  }
  static phrmDepositDateTimeRenderer(params) {
    if (params.data.DepositDate == null) {
      return "--No deposit--";
    }
    return moment(params.data.DepositDate).format("YYYY-MM-DD HH:mm");
  }
  static BillStatus(params) {
    if (params.data.BilStatus == "unpaid") {
      return `<span style="color: red;"><b><b>Unpaid</b></span>`;
    } else {
      return `<span style="color: green;"><b><b>Paid</b></span>`;
    }
  }

  static settlementAction(params) {
    if (params.data.DepositBalance > 0 || params.data.BilStatus == "unpaid") {
      let template = `<a danphe-grid-action="showDetails" class="grid-action">
                    Show Details
                    </a>
                    <a danphe-grid-action="print" class="grid-action">
                    Print
                    </a>
                    `;
      return template;
    } else {
      let template = `<a danphe-grid-action="print" class="grid-action">
                              Print
                              </a>`;
      return template;
    }
  }
  static PHRMProvisionalTotal(params) {
    let data = params.data;
    let provBal: number =
      data.ProvisionalTotal == null ? 0 : data.ProvisionalTotal;
    provBal = CommonFunctions.parseAmount(provBal);
    return provBal;
  }

  static PHRMSettlementBalanceRenderer(params) {
    let data = params.data;
    let credit: number = data.CreditTotal == null ? 0 : data.CreditTotal;
    let depositBal: number = data.DepositBalance;
    let provBal: number =
      data.ProvisionalTotal == null ? 0 : data.ProvisionalTotal;

    let balAmt: number = depositBal - credit - provBal;

    balAmt = CommonFunctions.parseAmount(balAmt);

    if (balAmt > 0) {
      return "(+)" + balAmt.toString() + "";
    } else {
      return "(-)" + (-balAmt).toString() + "";
    }
  }

  static BillCancelSearch = [
    { headerName: "Hospital Number", field: "PatientCode", width: 170 },
    { headerName: "Patient Name.", field: "ShortName", width: 160 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "Phone", field: "PhoneNumber", width: 110 },
    { headerName: "Total", field: "TotalAmount", width: 110 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>`,
    },
  ];

  static CreditCancelSearch = [
    { headerName: "Hospital Number", field: "PatientCode", width: 170 },
    { headerName: "Patient Name.", field: "ShortName", width: 160 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "Last Credit Date", field: "LastCreditBillDate", width: 110 },
    { headerName: "Total", field: "TotalCredit", width: 110 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="showCreditDetails" class="grid-action">
                Show Details
             </a>`,
    },
  ];

  static ProvisionalCancelSearch = [
    { headerName: "Hospital Number", field: "PatientCode", width: 70 },
    { headerName: "Patient Name.", field: "ShortName", width: 160 },
    { headerName: "Receipt No.", field: "ProvisionalReceiptNoFormatted", width: 80 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 80,
      cellRenderer: GridColumnSettings.NewAgeSexRendererPatient,
    },
    { headerName: "Requested On", field: "RequisitionDate", width: 130 },
    { headerName: "Item", field: "ItemName", width: 110 },
    { headerName: "Status", field: "OrderStatus", width: 80 },
    { headerName: "Total Amount", field: "TotalAmount", width: 75 },
    { headerName: "Billing Type", field: "VisitType", width: 80 },
    {
      headerName: "Performer",
      field: "PerformerName",
      cellRenderer: GridColumnSettings.DrRenderer,
      width: 110,
    },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="showCreditDetails" class="grid-action">
                Cancel
             </a>`,
    },
  ];

  static ImagingRequisitionListSearch = [
    {
      headerName: "Requested On",
      field: "CreatedOn",
      width: 100,
      sort: "desc",
      cellRenderer: GridColumnSettings.DateTimeRenderer,
    },
    { headerName: "Hospital Number", field: "Patient.PatientCode", width: 90 },
    { headerName: "Patient Name", field: "Patient.ShortName", width: 100 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 45,
      cellRenderer: GridColumnSettings.AgeSexCombineRenderer,
    },
    //{ headerName: "Phone", field: "Patient.PhoneNumber", width: 110 },
    { headerName: "Prescriber", field: "PrescriberName", width: 120 },
    { headerName: "Type", field: "ImagingTypeName", width: 80 },
    { headerName: "Imaging Name", field: "ImagingItemName", width: 150 },
    { headerName: "Requesting Department", field: "WardName", width: 150 },
    {
      headerName: "Insurance",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.IsUnderInsurance,
    },

    {
      headerName: "Action",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.parseTemplateForRADReportList,
    },
  ];

  static IsUnderInsurance(params) {
    if (params.data.HasInsurance) {
      return `<span style="color: green;"><b><b>Under Insurance</b></span>`;
    } else {
      return "";
    }
  }

  static parseTemplateForRADReportList(params) {
    console.log(params.data);
    if (params.data.IsScanned && !(params.data.IsReportSaved)) {
      let template = `<a danphe-grid-action="show-add-report" class="grid-action">
                Add Report
             </a>
            `;
      //  <a danphe-grid-action="upload-imging-files" class="grid-action">
      //  Attach Files   </a>
      return template;
    } else if (params.data.IsScanned && params.data.IsReportSaved) {
      let template = `<a danphe-grid-action="show-edit-report" class="grid-action">
      Edit Report
   </a>
  `;
      return template;
    }
    else {
      let template = `<a danphe-grid-action="scan-done" class="grid-action">
                Scan Done
             </a>
           `;
      return template;
    }
    //below part should be shown when PACS is enabled..sud:6sept'18

    //`<a danphe-grid-action="upload-imging-files" class="grid-action">
    //        Attach Files
    //     </a>`

    //if (params.data.IsShowButton) {
    //  let template = `<a danphe-grid-action="show-add-report" class="grid-action">
    //            Add Report
    //         </a>
    //        `;
    //  return template;
    //} else {
    //  let template = `<a danphe-grid-action="show-add-report" class="grid-action">
    //            Add Report
    //         </a>
    //       `;
    //  return template;
    //}
  }

  static parseTemplateForFractionApplicable(params) {
    //below part should be shown when PACS is enabled..sud:6sept'18

    //`<a danphe-grid-action="upload-imging-files" class="grid-action">
    //        Attach Files
    //     </a>`
    if (params.data.PercentSettingId) {
      let template = `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>
            `;
      return template;
    } else {
      let template = `<a danphe-grid-action="edit" class="grid-action">
                Add
             </a>
           `;
      return template;
    }
  }

  static ImagingReportListSearch = [
    {
      headerName: "S.No",
      width: 50,
      cellRenderer: GridColumnSettings.SerialNumberRenderer,
    },
    {
      headerName: "Date",
      field: "CreatedOn",
      width: 140,
      cellRenderer: GridColumnSettings.DateTimeRenderer,
    },
    { headerName: "Hospital Number", field: "PatientCode", width: 90 },
    { headerName: "Patient Name", field: "PatientName", width: 200 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 70,
      cellRenderer: GridColumnSettings.NewAgeSexRendererPatient,
    },
    { headerName: "Phone", field: "PhoneNumber", width: 110 },
    {
      headerName: "Reporting Doctor",
      field: "PerformerName",
      width: 140,
    },
    { headerName: "Imaging Type", field: "ImagingTypeName", width: 110 },
    {
      headerName: "Insurance",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.IsUnderInsurance,
    },
    { headerName: "Imaging Item", field: "ImagingItemName", width: 170 },
    {
      headerName: "Report",

      width: 200,
      cellRenderer: GridColumnSettings.ImagingReportViewActionRenderer,
    },
  ];

  // static LabRequsistionPatientSearch = [
  //   { headerName: "Requisition Date", field: "LastestRequisitionDate", width: 150, cellRenderer: GridColumnSettings.RequisitionDateTimeRenderer },
  //   { headerName: "Hospital Number", field: "PatientCode", width: 125 },
  //   { headerName: "Patient Name", field: "PatientName", width: 150 },
  //   { headerName: "Age/Sex", field: "", width: 75, cellRenderer: GridColumnSettings.AgeSexRendererPatient },
  //   { headerName: "Phone Number", field: "PhoneNumber", width: 100 },
  //   { headerName: "Requesting Dept.", field: "WardName", width: 120 },
  //   { headerName: "Visit Type", field: "IsAdmitted", width: 75, cellRenderer: GridColumnSettings.PatientTypeRenderer },
  //   { headerName: "Run Number Type", field: "RunNumberType", width: 100 },

  //   {
  //     headerName: "Action",
  //     field: "",
  //     width: 120,
  //     cellRenderer: GridColumnSettings.BtnByBillStatusRenderer
  //   }
  // ]

  static WardBilling = [
    { headerName: "Hospital No.", field: "PatientCode", width: 90 },
    { headerName: "Patient Name", field: "Name", width: 160 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 70,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "Contact", field: "PhoneNumber", width: 100 },
    {
      headerName: "Admitted Date",
      field: "AdmittedDate",
      width: 120,
      cellRenderer: GridColumnSettings.AdmissionDateRenderer,
    },
    {
      headerName: "Admitting Doctor",
      field: "AdmittingDoctorName",
      width: 140,
    },
    { headerName: "Inpatient No.", field: "VisitCode", width: 100 },
    {
      headerName: "Ward/Bed",
      field: "BedInformation.Ward",
      width: 90,
      cellRenderer: GridColumnSettings.WardBedRenderer,
    },
    {
      headerName: "Action",
      field: "",
      width: 100,
      template: `<a danphe-grid-action="ViewDetails" class="grid-action">
                 <i class="fa fa-eye"></i>View Detail
             </a>
                     `,
    },
  ];

  static RadiologyWardBillingColumns = [
    { headerName: "Hospital No.", field: "PatientCode", width: 90 },
    { headerName: "Patient Name", field: "Name", width: 160 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 70,
      cellRenderer: GridColumnSettings.NewAgeSexRendererPatient,
    },
    { headerName: "Contact", field: "PhoneNumber", width: 100 },
    {
      headerName: "Admitted Date",
      field: "AdmittedDate",
      width: 120,
      cellRenderer: GridColumnSettings.AdmissionDateRenderer,
    },
    {
      headerName: "Admitting Doctor",
      field: "AdmittingDoctorName",
      width: 140,
    },
    { headerName: "Inpatient No.", field: "VisitCode", width: 100 },
    {
      headerName: "Ward/Bed",
      field: "BedInformation.Ward",
      width: 90,
      cellRenderer: GridColumnSettings.WardBedRenderer,
    },
    {
      headerName: "Action",
      field: "",
      width: 100,
      template: `<a danphe-grid-action="ViewDetails" class="grid-action">
                 <i class="fa fa-eye"></i>View Details
             </a>
                     `,
    },
  ];

  static LabReportPatientSearch = [
    { headerName: "Patient Name", field: "PatientName", width: 150 },
    { headerName: "Hospital Number", field: "PatientCode", width: 160 },

    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="ViewDetails" class="grid-action">
                 <i class="fa fa-eye"></i>View Details
             </a>`,
    },
  ];

  // static LabTestPendingReportList = [
  //   { headerName: "Hospital No.", field: "PatientCode", width: 80 },
  //   { headerName: "Patient Name", field: "PatientName", width: 130 },
  //   { headerName: "Age/Sex", field: "", width: 90, cellRenderer: GridColumnSettings.AgeSexRendererPatient },
  //   { headerName: "Phone Number", field: "PhoneNumber", width: 100 },
  //   { headerName: "Test Name", field: "LabTestCSV", width: 170 },
  //   //ashim: 01Sep2018: We're now grouping by sample code only.
  //   //{ headerName: "Template", field: "TemplateName", width: 160 },
  //   { headerName: "Requesting Dept.", field: "WardName", width: 70 },
  //   { headerName: "Run Num", field: "SampleCodeFormatted", width: 60 },
  //   { headerName: "BarCode Num", field: "BarCodeNumber", width: 70 },
  //   {
  //     headerName: "Action",
  //     field: "",
  //     width: 200,
  //     cellRenderer: GridColumnSettings.VerifyRenderer
  //     //   template: `<a danphe-grid-action="ViewDetails" class="grid-action">
  //     //   View Details
  //     //   </a>
  //     //  <a danphe-grid-action="labsticker" class="grid-action"><i class="glyphicon glyphicon-print"></i> Sticker</a>
  //     //  <a danphe-grid-action="Verify" class="grid-action">
  //     //   Verify
  //     //   </a>
  //     //  `
  //   }
  // ]

  // static LabTestFinalReportList = [
  //   { headerName: "Hospital No.", field: "PatientCode", width: 100 },
  //   { headerName: "Patient Name", field: "PatientName", width: 140 },
  //   { headerName: "Age/Sex", field: "", width: 60, cellRenderer: GridColumnSettings.AgeSexRendererPatient },
  //   { headerName: "Phone Number", field: "PhoneNumber", width: 110 },
  //   { headerName: "Test Name", field: "LabTestCSV", width: 200 },
  //   //ashim: 01Sep2018: We're now grouping by sample code only.
  //   { headerName: "Report Generated By", field: "ReportGeneratedBy", width: 120 },
  //   { headerName: "Requesting Dept.", field: "WardName", width: 80 },
  //   { headerName: "Run Num", field: "SampleCodeFormatted", width: 80 },
  //   { headerName: "Is Printed", field: "", width: 70, cellRenderer: GridColumnSettings.LabReptIsPrintedRenderer },
  //   {
  //     headerName: "Action",
  //     field: "",

  //     width: 120,
  //     cellRenderer: GridColumnSettings.BillPaidRenderer
  //   }
  // ]

  static BillPaidRenderer(params) {
    let visitType = params.data.VisitType;
    let isBillPaid: boolean = false;

    if (visitType && visitType.toLowerCase() == "inpatient") {
      isBillPaid = true;
    } else {
      if (
        params.data.BillingStatus &&
        (params.data.BillingStatus.toLowerCase() == "paid" ||
          params.data.BillingStatus.toLowerCase() == "unpaid")
      ) {
        isBillPaid = true;
      } else {
        isBillPaid = false;
      }
    }

    if (isBillPaid) {
      return `<a danphe-grid-action="ViewDetails" class="grid-action">
                 <i class="fa fa-eye"></i>View Details
             </a>`;
    } else {
      return `<b style="color: red;">Bill Not Paid</b>`;
    }
  }

  static LabReptIsPrintedRenderer(params) {
    let isPrinted = params.data.IsPrinted;

    if (isPrinted) {
      return `<b style="color: green;">YES</b>`;
    } else {
      return `<b style="color: red;">NO</b>`;
    }
  }

  static ItemwiseRequisitionList = [
    { headerName: "ItemName", field: "ItemName", width: 150 },
    { headerName: "Quantity", field: "Quantity", width: 150 },
    { headerName: "Available Qty", field: "AvailableQuantity", width: 150 },
    {
      headerName: "Action",
      field: "",
      width: 120,
      template: `<a danphe-grid-action="itemDispatch" class="grid-action">
                Dispatch Item
             </a>`,
    },
  ];
  static DispatchList = [
    { headerName: "DispatchNo", field: "DispatchNo", width: 50 },
    {
      headerName: "Dispatch Date",
      field: "DispatchedDate",
      width: 100,
      cellRenderer: GridColumnSettings.DateTimeRenderer,
    },
    { headerName: "Req. No", field: "RequisitionNo", width: 100 },
    { headerName: "Received By", field: "ReceivedBy", width: 100 },
    { headerName: "Dispatched By", field: "DispatchedByName", width: 150 },
    {
      headerName: "Action",
      field: "",
      width: 120,
      template: `<a danphe-grid-action="view" class="grid-action">
               View
             </a>`,
    },
  ];

  static CancelList = [
    { headerName: "Item Name", field: "ItemName", width: 50 },
    {
      headerName: "Cancel Date",
      field: "CancelOn",
      width: 50,
      cellRenderer: GridColumnSettings.RequisitionDateOnlyRenderer,
    },
    { headerName: "Cancel By", field: "CancelByName", width: 50 },
    // { headerName: "Dispatched By", field: "DispatchedByName", width: 150 },
    // {
    //   headerName: "Action",
    //   field: "",
    //   width: 120,
    //   template:
    //     `<a danphe-grid-action="view" class="grid-action">
    //            View
    //          </a>`
    // }
  ];

  static PHRMDispatchList = [
    { headerName: "Dispatch Id", field: "DispatchId", width: 50 },
    {
      headerName: "Dispatch Date",
      field: "CreatedOn",
      cellRenderer: GridColumnSettings.DispatchDateRender,
      width: 100,
    },
    { headerName: "Received By", field: "ReceivedBy", width: 100 },
    { headerName: "Dispatched By", field: "DispatchedByName", width: 150 },
    {
      headerName: "Action",
      field: "",
      width: 120,
      template: `<a danphe-grid-action="view" class="grid-action">
               View
             </a>`,
    },
  ];
  static DispatchDateRender(params) {
    let dispatchDate: string = params.data.CreatedOn;
    if (dispatchDate) return moment(dispatchDate).format("YYYY-MM-DD");
    else return null;
  }

  //remove text-transform for username and email since those might be case sensitive.
  static UserGridCellStyle(params) {
    return { "text-transform": "none" };
  }

  static StockList = [
    { headerName: "Item Type", field: "ItemType", width: 150 },
    { headerName: "Sub Category", field: "SubCategoryName", width: 150 },
    {
      headerName: "",
      field: "",
      width: 22,
      cellRenderer: GridColumnSettings.ColdStorageIconRenderer,
    },
    { headerName: "", field: "", width: 50, cellRenderer: GridColumnSettings.FixedAssetCellIconRenderer },
    { headerName: "Item Name", field: "ItemName", width: 150 },
    { headerName: "Item Code", field: "ItemCode", width: 100 },
    { headerName: "Unit", field: "UOMName", width: 100 },
    // { headerName: "Batch No", field: "BatchNo", width: 100 },
    // {
    //   headerName: "Expiry Date",
    //   //field: "ExpiryDate",
    //   cellRenderer: GridColumnSettings.StockExpiryDateRender,
    //   width: 150,
    // },
    {
      headerName: "Available Quantity",
      field: "AvailQuantity",
      width: 100,
      cellRenderer: GridColumnSettings.ThresholdMargin,
    },
    { headerName: "Minimum Quantity", field: "MinQuantity", width: 100 },
    {
      headerName: "Action",
      field: "",
      width: 150,
      cellRenderer: GridColumnSettings.INV_STK_ActionRenderer,
    },
  ];
  static FixedAssetCellIconRenderer(params) {
    var template =
      params.data.IsFixedAssets == true
        ? `<b title="FixedAsset Item" style="background: #0773bc;border: 1px solid blue;border-radius: 60%;padding: 2px 4px;color: #f8f8f8;">F</b>`
        : "";
    return template;
  }
  static ColdStorageIconRenderer(params) {
    var template =
      params.data.IsColdStorageApplicable == true
        ? `<b title="Cold Storage Item" style="background: #0773bc;border: 1px solid blue;border-radius: 60%;padding: 2px 4px;color: #f8f8f8;">C</b>`
        : "";
    return template;
  }
  static INV_STK_ActionRenderer(params) {
    if (params.data.AvailQuantity >= 0) {
      var template = `<a danphe-grid-action="view" class="grid-action">View</a>`;
      if (params.data.canUserManageStock)
        template += `<a danphe-grid-action="manageStock" class="grid-action">Manage Stock</a >`;
    }
    return template;
  }
  static StockDetails = [
    { headerName: "GR No", field: "GoodsReceiptNo", width: 150 },
    { headerName: "Bill Date", field: "GoodsReceiptDate", width: 150 },
    { headerName: "Batch No", field: "BatchNo", width: 150 },
    { headerName: "Available Quantity", field: "AvailQuantity", width: 150 },
    { headerName: "Unit Price", field: "ItemRate", width: 150 },
    {
      headerName: "Expiry Date",
      // field: "ExpiryDate",
      cellRenderer: GridColumnSettings.StockExpiryDateRender,
      width: 150,
    },
    { headerName: "Remarks", field: "Remarks", width: 150 }
  ];
  static POlistVendorwise = [
    { headerName: "Name", field: "vName", width: 100 },
    { headerName: "Contact", field: "vContactNo", width: 100 },
    { headerName: "Address", field: "vAddress", width: 100 },
    {
      headerName: "Purchase Order Nos.",
      field: "POIds",
      width: 100,
      cellRenderer: GridColumnSettings.PurchaseOrderNosrenderer,
    },
    {
      headerName: "Actions",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="genGR" class="grid-action">Add Goods Receipt</a>`,
    },
  ];
  static POList = [
    { headerName: "PO Id", field: "PurchaseOrderId", width: 110 },
    { headerName: "PR No", field: "PRNumber", width: 110 },
    { headerName: "Vendor Name", field: "VendorName", width: 110 },
    { headerName: "Vendor Contact", field: "VendorContact", width: 110 },
    {
      headerName: "PO Date",
      field: "PoDate",
      width: 100,
      cellRenderer: GridColumnSettings.PurchaseOrderDateOnlyRenderer,
    },
    { headerName: "Total Amount", field: "TotalAmount", width: 80 },
    { headerName: "PO Status", field: "POStatus", width: 110 },
    {
      headerName: "Verification Status",
      width: 120,
      cellRenderer: VerificationGridColumns.VerificationStatusRenderer,
    },
    {
      headerName: "Actions",
      field: "",
      width: 200,
      ///this is used to action according to status
      cellRenderer: GridColumnSettings.ShowActionForPOList,
    },
  ];
  static VendorsList = [
    { headerName: "S.N", field: "Sno", width: 25 },
    { headerName: "Vendor Name", field: "VendorName", width: 150 },
    { headerName: "Vendor Contact", field: "ContactNo", width: 100 },
    { headerName: "GR Date", field: "GoodReceiptDate", width: 100 },
    { headerName: "Total Amount", field: "TotalAmount", width: 100 },
    {
      headerName: "Action",
      field: "",
      width: 100,
      template: '<a danphe-grid-action="view" class="grid-action">View</a>',
    },
  ];

  static GRList = [
    { headerName: "GR No.", field: "GoodsReceiptNo", width: 50 },
    {
      headerName: "Vendor Bill Date",
      field: "GoodReceiptDate",
      width: 60,
      cellRenderer: GridColumnSettings.GRDateTimeRenderer,
    },

    { headerName: "PO No.", field: "PurchaseOrderId", width: 40 },
    { headerName: "GR Category", field: "GRCategory", width: 60 },
    { headerName: "Vendor Name", field: "VendorName", width: 100 },
    { headerName: "Vendor Contact", field: "ContactNo", width: 80 },
    { headerName: "Bill No.", field: "BillNo", width: 50 },
    { headerName: "Total Amount", field: "TotalAmount", width: 75 },
    { headerName: "Pay. Mode", field: "PaymentMode", width: 60 }, //sud:4May'20--needed this to distinguish between cash and credit in frontend.
    { headerName: "Remarks", field: "Remarks", width: 100 },
    {
      headerName: "Entry Date",
      field: "CreatedOn",
      width: 60,
      cellRenderer: GridColumnSettings.CreatedOnDateRenderer,
    },
    {
      headerName: "Verification Status",
      width: 100,
      cellRenderer: VerificationGridColumns.VerificationStatusRenderer,
    },
    {
      headerName: "Action",
      field: "",
      width: 50,
      template: '<a danphe-grid-action="view" class="grid-action">View</a>',
    },
  ];

  static SubstoreRequisitionList = [
    { headerName: "Req.No", field: "RequisitionNo", width: 35 },
    { headerName: "Requested To", field: "StoreName", width: 80 },
    {
      headerName: "Date",
      field: "RequisitionDate",
      width: 80,
      cellRenderer: GridColumnSettings.RequisitionDateOnlyRenderer,
    },
    { headerName: "Status", field: "RequisitionStatus", width: 80 },
    {
      headerName: "Verification Status",
      width: 120,
      cellRenderer: VerificationGridColumns.VerificationStatusRenderer,
    },
    {
      headerName: "Action",
      field: "",
      width: 200,
      cellRenderer: GridColumnSettings.ShowActionForInventoryRequisitionList,
      //template: '<a danphe-grid-action="view" class="grid-action">View</a>'
    },
  ];
  DepartmentwiseRequisitionList = [
    { headerName: "Req.No", field: "RequisitionNo", width: 80 },
    { headerName: "StoreName", field: "StoreName", width: 160 },
    {
      headerName: "Req.Date",
      field: "RequisitionDate",
      width: 80,
      cellRenderer: GridColumnSettings.RequisitionDateOnlyRenderer,
    },
    { headerName: "Requested By", field: "RequestedBy", width: 120 },
    { headerName: "Received By", field: "ReceivedBy", width: 160 },
    { headerName: "Status", field: "RequisitionStatus", width: 80 },
    {
      headerName: "Verification Status",
      width: 120,
      cellRenderer: VerificationGridColumns.VerificationStatusRenderer,
    },
    {
      headerName: "Actions",
      field: "",
      width: 250,
      cellRenderer: GridColumnSettings.ShowActionForRequisitionList,
    },
  ];
  static PHRMStoreRequisitionList = [
    { headerName: "Req.No", field: "RequisitionNo", width: 50 },
    { headerName: "RequestedBy", field: "CreatedByName", width: 120 },
    { headerName: "RequestedFrom", field: "RequistingStore", width: 120 },
    {
      headerName: "Date",
      field: "RequisitionDate",
      width: 120,
      cellRenderer: GridColumnSettings.RequisitionDateOnlyRenderer,
    },
    { headerName: "Status", field: "RequisitionStatus", width: 120 },
    {
      headerName: "Actions",
      field: "",
      width: 230,
      cellRenderer: GridColumnSettings.PHRMStoreRequisitionActionRenderer,
    },
  ];
  static PHRMStoreRequisitionActionRenderer(params) {
    let template = ``;
    if (params.data.CanApproveTransfer == true) {
      template += `<a danphe-grid-action="approveTransfer" class="grid-action animated-btn blinking-btn-warning" title="Approve Dispensary to Dispensary Transfer">
                  Approve Transfer
                  </a>`;
    }
    if (
      ["active", "partial"].includes(params.data.RequisitionStatus) &&
      params.data.CanDispatchItem == true
    ) {
      template += `<a danphe-grid-action="requisitionDispatch" class="grid-action">
      Dispatch Requisition
      </a>`;
    }
    if (["partial", "complete"].includes(params.data.RequisitionStatus)) {
      template += `<a danphe-grid-action="dispatchList" class="grid-action">
                  Dispatch List
                </a>`;
    }
    template += `<a danphe-grid-action="view" class="grid-action">
                    Requisition View
                </a>`;
    return template;
  }
  static AppointmentPatientSearch = [
    { headerName: "Hospital Number", field: "PatientCode", width: 160 },
    { headerName: "Patient Name", field: "ShortName", width: 200 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "Address", field: "Address", width: 110 },
    { headerName: "Phone", field: "PhoneNumber", width: 110 },

    {
      headerName: "Actions",
      field: "",
      width: 180,
      template: `
             <a danphe-grid-action="appoint" class="grid-action">
                Check In
             </a>`,
    },
  ];


  static OutPatientVisitListGridCols = [
    { headerName: "Visit Date", field: "VisitDate", width: 100, },
    { headerName: "Visit Time", width: 100, cellRenderer: GridColumnSettings.VisitTimeOnlyRenderer },
    { headerName: "Visit Code", field: "VisitCode", width: 100 },
    { headerName: "Department", field: "Department", width: 100 },
    { headerName: "Doctor", field: "PerformerName", width: 100 },
    { headerName: "Visit Type", field: "VisitType", width: 100 },
    { headerName: "Appointment Type", field: "AppointmentType", width: 100 },
    { headerName: "Days Passed", field: "DaysPassed", width: 100 },
    { headerName: "Scheme", field: "SchemeName", width: 100 },
    { headerName: "Queue", field: "QueueNo", width: 100 },

    {
      headerName: "Actions",
      field: "",
      width: 180,
      cellRenderer: GridColumnSettings.ManageVisitActionsRenderer,
    },
  ];

  static InPatientVisitListGridCols = [
    { headerName: "Admission Date", field: "AdmittingDate", width: 100 },
    { headerName: "Discharge Date", field: "DischargeDate", width: 100 },
    { headerName: "IpNumber", field: "VisitCode", width: 100 },
    { headerName: "Department", field: "Department", width: 100 },
    { headerName: "Admitting Doctor", field: "PerformerName", width: 100 },
    { headerName: "Appointment Type", field: "AppointmentType", width: 100 },
    { headerName: "Days Passed", field: "DaysPassed", width: 100 },
    { headerName: "Scheme", field: "SchemeName", width: 100 },
    { headerName: "Queue", field: "QueueNo", width: 100 },

    {
      headerName: "Actions",
      field: "",
      width: 180,
      cellRenderer: GridColumnSettings.ManageVisitActionsRenderer,
    },
  ];
  static AppointmentAllPatientSearch = [
    { headerName: "Hospital Number", field: "PatientCode", width: 160 },
    { headerName: "Patient Name", field: "ShortName", width: 200 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.AgeSexAppointmentCombineRenderer,
    },
    { headerName: "Address", field: "Address", width: 110 },
    { headerName: "Phone", field: "PhoneNumber", width: 110 },

    {
      headerName: "Actions",
      field: "",
      width: 180,
      template:
        `
             <a danphe-grid-action="create" class="grid-action">
                Create Appointment
             </a>`
    }
  ];

  static TxnItemList = [
    {
      headerName: "Date",
      field: "Date",
      width: 90,
      cellRenderer: GridColumnSettings.FractionDateRenderer,
    },
    { headerName: "Billing", field: "BillingType", width: 90 },
    {
      headerName: "BillTransactionItemId",
      field: "BillTransactionItemId",
      width: 90,
    },
    //{ headerName: "Provider", field: "ProviderName", width: 90 },
    { headerName: "Patient Name", field: "FullName", width: 120 },
    { headerName: "Item Name", field: "ItemName", width: 100 },
    {
      headerName: "Service Department Name",
      field: "ServiceDepartmentName",
      width: 120,
    },
    { headerName: "TotalAmount", field: "TotalAmount", width: 120 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      cellRenderer: GridColumnSettings.ManageFractionTemplate,
    },
  ];

  static EditDoctorItemList = [
    {
      headerName: "Date",
      field: "Date",
      width: 80,
      cellRenderer: GridColumnSettings.EditDoctorDateRenderer,
    },
    { headerName: "Invoice No", field: "ReceiptNo", width: 85 },
    { headerName: "Hospital No", field: "PatientCode", width: 90 },
    { headerName: "Patient Name", field: "PatientName", width: 120 },
    {
      headerName: "Age/ Sex",
      field: "PatientName",
      width: 70,
      cellRenderer: GridColumnSettings.NewAgeSexRendererPatient,
    },
    //{ headerName: "Phone Number", field: "PhoneNumber", width: 100 },
    {
      headerName: "Service Department",
      field: "ServiceDepartmentName",
      width: 120,
    },
    { headerName: "Bill Item Name", field: "ItemName", width: 120 },
    {
      headerName: "Prescriber Name",
      width: 120,
      cellRenderer: GridColumnSettings.PrescriberRenderer,
    }, //field: "ReferredByName",
    {
      headerName: "Performer Name",
      width: 120,
      cellRenderer: GridColumnSettings.PerformerRenderer,
    }, //field: ProviderName

    { headerName: "BillStatus", field: "BillStatus", width: 80 },
    // { headerName: "TotalAmount", field: "Receipt", width: 120 },
    {
      headerName: "Action",
      field: "",
      width: 80,
      template: `
        <a danphe-grid-action="edit" class="grid-action">
          Edit Doctor(s)
        </a>`,
    },
  ];

  //Radiology edit doctor list
  static RadiologyEditDoctorItemList = [
    {
      headerName: "Date",
      field: "Date",
      width: 80,
    },
    { headerName: "Invoice No", field: "ReceiptNo", width: 60 },
    { headerName: "Hospital No", field: "PatientCode", width: 70 },
    { headerName: "Patient Name", field: "PatientName", width: 120 },
    {
      headerName: "Age/Sex",
      width: 60,
      cellRenderer: GridColumnSettings.NewAgeSexRendererPatient,
    },
    //{ headerName: "Phone Number", field: "PhoneNumber", width: 100 },
    {
      headerName: "Type",
      field: "ServiceDepartmentName",
      width: 60,
    },
    {
      headerName: "Imaging Name",
      field: "ItemName",
      width: 150,
      cellRenderer: GridColumnSettings.RadImagingNameRenderer,
    },
    {
      headerName: "Prescriber Name",
      width: 110,
      field: "PrescriberName",
      cellRenderer: GridColumnSettings.PrescriberRenderer,
    },
    {
      headerName: "Radiologist/Reporting Doctor",
      width: 150,
      field: "PerformerName",
      cellRenderer: GridColumnSettings.RadPerformerRenderer,
    }, //field: ProviderName

    { headerName: "BillStatus", field: "BillStatus", width: 80 },
    // { headerName: "TotalAmount", field: "Receipt", width: 120 },
    {
      headerName: "Action",
      field: "",
      width: 100,
      template: `
        <a danphe-grid-action="edit" class="grid-action">
          Edit Doctor(s)
        </a>`,
    },
  ];

  static PerformerRenderer(params) {
    let isDocMandatory = params.data.DoctorMandatory;
    let performer = params.data.PerformerName
      ? params.data.PerformerName.trim()
      : "";

    if (isDocMandatory && performer.length == 0) {
      //console.log(isDocMandatory, provider);
      return `<a class="empty-bg-a">
                 </a>`;
    } else {
      //console.log(isDocMandatory, provider);
      return performer;
    }
  }

  //sud:1June'20-ImagingName should be Highilghted for Radiology Module..
  static RadImagingNameRenderer(params) {
    return `<b>` + params.data.ItemName + `</b>`;
  }

  //sud:1June'20-RadiologistName should be Highilghted for Radiology Module.
  static RadPerformerRenderer(params) {
    let isDocMandatory = params.data.DoctorMandatory;
    let performer = params.data.PerformerName
      ? params.data.PerformerName.trim()
      : "";

    if (isDocMandatory && performer.length == 0) {
      //console.log(isDocMandatory, provider);
      return `<a class="empty-bg-a">
                 </a>`;
    } else {
      //console.log(isDocMandatory, provider);
      return `<b>` + performer + `</b>`;
    }
  }

  static PrescriberRenderer(params) {
    let refBy = params.data.PrescriberName;
    let retVal =
      refBy && refBy.trim().length > 0
        ? refBy
        : `<a class="empty-bg-a">
                 </a>`;
    return retVal;
  }

  static EditDoctorDateRenderer(params) {
    let date: string = params.data.Date;
    return moment(date).format("YYYY-MM-DD");
  }

  static TemplateListDateRenderer(params) {
    let date: string = params.data.CreatedOn;
    return moment(date).format("YYYY-MM-DD HH:mm");
  }

  static FractionDateRenderer(params) {
    let date: string = params.data.TransactionDate;
    return moment(date).format("YYYY-MM-DD HH:mm");
  }

  static EditDoctorDOBDateRenderer(params) {
    let date: string = params.data.DateOfBirth;
    return moment(date).format("YYYY-MM-DD");
  }

  static ExpiryDateRender(params) {
    let expiryDate: string = params.data.ExpiryDate;
    if (expiryDate) return moment(expiryDate).format("YYYY-MM-DD");
    else return null;
  }
  public static StockExpiryDateRender(params) {
    if (!params.data.ExpiryDate) {
      return "";
    }
    let expiryDate: Date = params.data.ExpiryDate;
    let expiryDate1 = new Date(params.data.ExpiryDate);
    let date = new Date();
    let datenow = date.setMonth(date.getMonth() + 0);
    let datePlusThreeMonth = date.setMonth(date.getMonth() + 3);
    let expDate = expiryDate1.setMonth(expiryDate1.getMonth() + 0);

    if (expDate <= datenow) {
      return (
        "<span style='background-color:red;color:white'>" +
        moment(expiryDate).format("YYYY-MM-DD") +
        "(" +
        "Exp" +
        ")"
      ); //Without moment it seperate Date and Time with Letter T
    }
    if (expDate < datePlusThreeMonth && expDate > datenow) {
      return (
        "<span style='background-color:yellow;color:black'>" +
        moment(expiryDate).format("YYYY-MM-DD") +
        "(" +
        "N. Exp" +
        ")"
      );
    }
    if (expDate > datePlusThreeMonth) {
      return (
        "<span style='background-color:white;color:black'>" +
        moment(expiryDate).format("YYYY-MM-DD") +
        "</span>"
      );
    }
  }
  // if(!params.data.ExpiryDate){
  //   return '';
  // }
  // let currentDate = moment();
  // let currentDatePlus6months = moment().add(6, 'M');
  // let expiryDate = moment(params.data.ExpiryDate);
  //   if (expiryDate < currentDate) {
  //     return (
  //       `<div style='width:70%;background-color:red;'>
  //       <b>${expiryDate.format('YYYY-MM-DD')}</b>
  //     </div>`
  //     );
  //   } else if (expiryDate <= currentDatePlus6months) {
  //     return (
  //       `<div style='width:70%;background-color:yellow;'>
  //       <b>${expiryDate.format('YYYY-MM-DD')}</b>
  //     </div>`
  //     );
  //   } else {
  //     return (
  //       `<b>${expiryDate.format('YYYY-MM-DD')}</b>`
  //     );
  //   }
  static returnToVendorItemList = [
    { headerName: "Vendor Name", field: "VendorName", width: 150 },
    { headerName: "Credit Note No", field: "CreditNoteNo", width: 150 },
    {
      headerName: "Returned On",
      field: "CreatedOn",
      width: 150,
      cellRenderer: GridColumnSettings.DateTimeRenderer,
    },
    {
      headerName: "Actions",
      field: "",
      width: 180,
      template: `
                 <a danphe-grid-action="view" class="grid-action">
                    View
                 </a>`,
    },
  ];

  static writeOffItemColumn = [
    { headerName: "Item Name", field: "ItemName", width: 150 },
    { headerName: "Write Off Qty", field: "WriteOffQuantity", width: 150 },
    { headerName: "Unit", field: "UOMName", width: 100 },
    { headerName: "Write Off Date", field: "WriteOffDate", width: 150, cellRenderer: GridColumnSettings.WriteOffDateRenderer },
    { headerName: "Rate", field: "ItemRate", width: 150 },
    { headerName: "Total Amount", field: "TotalAmount", width: 150 },
    { headerName: "Remark", field: "Remark" },
  ];
  static WriteOffDateRenderer(params) {
    let date: string = params.data.AdmittedDate;
    return moment(date).format('YYYY-MM-DD');
  }
  static vendorList = [
    { headerName: "Vendor Name", field: "VendorName", width: 150 },
    { headerName: "Vendor Code", field: "VendorCode", width: 150 },
    { headerName: "Contact Person", field: "ContactPerson", width: 120 },
    { headerName: "Contact Address", field: "ContactAddress", width: 120 },
    { headerName: "Contact Number", field: "ContactNo", width: 150 },
    { headerName: "Pan No", field: "PanNo", width: 150 },
    {
      headerName: "Email Address",
      field: "Email",
      width: 150,
      cellStyle: GridColumnSettings.UserGridCellStyle,
    },
    { headerName: "Is Active", field: "IsActive", width: 100 },
    { headerName: "Receive Donation", field: "ReceiveDonation", width: 100 },

    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];

  static TermsConditionsList = [
    { headerName: "ShortName", field: "ShortName", width: 100 },
    { headerName: "Text", field: "Text", width: 100 },
    { headerName: "Is Active", field: "IsActive", width: 100 },
    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];

  static ItemList = [
    { headerName: "Item Type", field: "ItemType", width: 120 },
    { headerName: "Subcategory Name", field: "SubCategoryName", width: 150 },
    { headerName: "Register Page No", field: "RegisterPageNumber", width: 100 }, // this is dynamically changed later in item-list, must be in-sync with item-list component
    { headerName: "Item Name", field: "ItemName", width: 150 },
    { headerName: "Item Code", field: "Code", width: 100 },
    { headerName: "Unit", field: "UOMName", width: 100 },
    { headerName: "Description", field: "Description", width: 150 },
    { headerName: "MinStock Qty", field: "MinStockQuantity", width: 100 },
    { headerName: "Standard Rate", field: "StandardRate", width: 100 },
    { headerName: "Is VAT Applicable", field: "IsVATApplicable", width: 100 },
    { headerName: "Is Active", field: "IsActive", width: 90 },
    { headerName: "Inventory", field: "StoreName", width: 90 },

    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];

  static CurrencyList = [
    { headerName: "Currency Code", field: "CurrencyCode", width: 150 },
    { headerName: "Description", field: "Description", width: 150 },
    { headerName: "Is Active", field: "IsActive", width: 100 },

    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];

  static CompanyList = [
    { headerName: "Name", field: "CompanyName", width: 150 },
    { headerName: "Code", field: "Code", width: 150 },
    { headerName: "Address", field: "ContactAddress", width: 150 },
    { headerName: "Contact", field: "ContactNo", width: 150 },
    { headerName: "Email", field: "Email", width: 150 },
    { headerName: "Description", field: "Description", width: 150 },
    {
      headerName: "Action",
      field: "",
      width: 120,
      template: `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];

  static ItemCategoryList = [
    { headerName: "Item Category Name", field: "ItemCategoryName", width: 150 },
    { headerName: "Description", field: "Description", width: 150 },
    { headerName: "Is Active", field: "IsActive", width: 100 },

    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];
  static ItemSubCategoryList = [
    { headerName: "Sub Category Name", field: "SubCategoryName", width: 150 },
    { headerName: "Code", field: "Code", width: 150 },
    {
      headerName: "Category",
      cellRenderer: GridColumnSettings.GetIsconsumableOrCapital,
      width: 150,
    },
    { headerName: "Description", field: "Description", width: 150 },
    { headerName: "Ledger Name", field: "LedgerName", width: 150 },
    { headerName: "Is Active", field: "IsActive", width: 100 },

    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];

  static AccountHeadList = [
    { headerName: "AccountHead Name", field: "AccountHeadName", width: 150 },
    { headerName: "Description", field: "Description", width: 150 },
    { headerName: "Is Active", field: "IsActive", width: 100 },

    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];
  // ------Start: Accounting Grid Data ----------------

  static companyList = [
    { headerName: "Company Name", field: "CompanyName", width: 150 },
    { headerName: "Contact Address", field: "ContactAddress", width: 120 },
    { headerName: "Contact Number", field: "ContactNo", width: 150 },
    { headerName: "Email Address", field: "Email", width: 150 },
    { headerName: "Is Active", field: "IsActive", width: 100 },

    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];

  static itemList = [
    { headerName: "Item Name", field: "ItemName", width: 150 },
    //{ headerName: "Ledger Name", field: "LedgerName", width: 120 },
    { headerName: "Available Qty", field: "AvailableQuantity", width: 100 },
    { headerName: "Description", field: "Description", width: 100 },
    { headerName: "IsActive", field: "IsActive", width: 100 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      cellRenderer: GridColumnSettings.ManageUsesActionTemplate,
    },
  ];

  static ledgerList = [
    { headerName: "Code", field: "Code", width: 150 },
    { headerName: "Ledger Name", field: "LedgerName", width: 150 },
    { headerName: "Primary Group", field: "PrimaryGroup", width: 100 },
    { headerName: "Chart Of Account", field: "COA", width: 100 },
    { headerName: "Ledger Group", field: "LedgerGroupName", width: 100 },
    { headerName: "Is Active", field: "IsActive", width: 100 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      cellRenderer: GridColumnSettings.ManageUserActionLedgerTemplate,
    },
  ];
  static sectionList = [
    { headerName: "SectionId", field: "SectionId", width: 150 },
    { headerName: "Section Name", field: "SectionName", width: 150 },
    { headerName: "Section Code", field: "SectionCode", width: 100 },
  ];
  static coaList = [
    { headerName: "COA Name", field: "ChartOfAccountName", width: 150 },
    { headerName: "COA Code", field: "COACode", width: 100 },
    { headerName: "Description", field: "Description", width: 200 },
    { headerName: "Is Active", field: "IsActive", width: 100 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="edit" class="grid-action">
                <i class="fa fa-pencil"></i>Edit
                  </a>`,
    },
  ];

  static subLedgerList = [
    { headerName: "Ledger Name", field: "LedgerName", width: 150 },
    { headerName: "SubLedger Name", field: "SubLedgerName", width: 150 },
    { headerName: "SubLedger Code", field: "SubLedgerCode", width: 100 },
    { headerName: "Opening Balance", field: "OpeningBalance", width: 110 },
    { headerName: "Description", field: "Description", width: 150 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      cellRenderer: GridColumnSettings.ManageUserActionSubLedgerTemplate
    },
  ];

  FiscalYearList = [
    { headerName: "Fiscal Year Name", field: "FiscalYearName", width: 150 },
    { headerName: "Start Date", field: "StartDate", width: 100 },
    { headerName: "End Date", field: "EndDate", width: 100 },
    { headerName: "Description", field: "Description", width: 100 },
    {
      headerName: "Closed Status",
      field: "IsClosed",
      width: 100,
      cellRenderer: GridColumnSettings.GetActiveFiscalYearClosedStatus,
    },
    {
      headerName: "Action",
      field: "showreopen",
      width: 100,
      cellRenderer: GridColumnSettings.GetActiveFiscalYear,
    },
  ];

  static AccDailyTxnReport = [
    { headerName: "Voucher No", field: "VoucherNumber", width: 80 },
    {
      headerName: "Transaction Date",
      field: "TransactionDate",
      width: 100,
      cellRenderer: GridColumnSettings.AccTxnDateRenderder,
    },
    { headerName: "Code", field: "Code", width: 50 },
    { headerName: "Ledger Name", field: "LedgerName", width: 120 },
    {
      headerName: "DrAmount",
      field: "DrAmount",
      width: 100,
      cellRenderer: GridColumnSettings.AccDrAmountRenderder,
    },
    {
      headerName: "CrAmount",
      field: "CrAmount",
      width: 100,
      cellRenderer: GridColumnSettings.AccCrAmountRenderder,
    },
    // {
    //   headerName: "Option",
    //   field: "",
    //   width: 100,
    //   cellRenderer: GridColumnSettings.AccDailyTxnActionTemplate,
    // },
  ];

  static CostCenterItemsList = [
    { headerName: "CostCenter ItemName", field: "CostCenterItemName", width: 150, },
    { headerName: "Description", field: "Description", width: 100 },
    { headerName: "IsActive", field: "IsActive", width: 100 },
    { headerName: "Action", field: "", width: 200, cellRenderer: GridColumnSettings.ManageUsesActionTemplate, },
  ];

  static costCenterList = [
    { headerName: "Cost Center", field: "CostCenterName", width: 150, },
    { headerName: "Parent Cost Center", field: "ParentCostCenterName", width: 150, },
    { headerName: "Description", field: "Description", width: 150, },
    { headerName: "Is Active", field: "IsActive", width: 150, },
    {
      headerName: "Action",
      field: "",

      width: 300,
      cellRenderer: GridColumnSettings.ActivateDeactivateTemplate,

    },
  ];

  static medicarePatientList = [
    { headerName: "Category", field: "Category", width: 120, },
    { headerName: "MedicareNo", field: "MedicareNo", width: 120, },
    { headerName: "Name", field: "Name", width: 200, },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "HospitalNo", field: "HospitalNo", width: 130, },
    { headerName: "Institution", field: "Institution", width: 150, },
    { headerName: "IsDependent", field: "IsDependent", width: 100, },
    { headerName: "Employee", field: "Employee", width: 150, },
    { headerName: "Department", field: "Department", width: 200, },
    { headerName: "Designation", field: "Designation", width: 200, },
    { headerName: "Relation", field: "Relation", width: 130, },
    { headerName: "Ins. No", field: "InsurancePolicyNo", width: 130, },
    { headerName: "Remarks", field: "Remarks", width: 150, },
    { headerName: "IsActive", field: "IsActive", width: 90, },
    {
      headerName: "Action",
      field: "",
      width: 150,
      cellRenderer: GridColumnSettings.ViewMedicarePatientList,

    },
  ];

  static medicarePatientModuleList = [
    { headerName: "MemberNo", field: "MedicareNo", width: 120, },
    { headerName: "Name", field: "Name", width: 200, },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "HospitalNo", field: "HospitalNo", width: 130, },
    { headerName: "Scheme", field: "SchemeName", width: 90, },
    { headerName: "Price Category", field: "PriceCategoryName", width: 130, },
    { headerName: "Ins. No", field: "InsurancePolicyNo", width: 130, },
    {
      headerName: "Member Start Date", field: "MedicareStartDate", width: 90,
      cellRenderer: GridColumnSettings.MemberStartDateRenderder,
    },
    {
      headerName: "Member End Date", field: "MedicareEndDate", width: 90,
      cellRenderer: GridColumnSettings.MemberEndDateRenderder,
    },
    { headerName: "IsDependent", field: "IsDependent", width: 100, },
    { headerName: "Category", field: "Category", width: 120, },
    { headerName: "IsActive", field: "IsActive", width: 90, },
    { headerName: "Remarks", field: "Remarks", width: 150, },
    {
      headerName: "Action",
      field: "",
      width: 150,
      cellRenderer: GridColumnSettings.ViewMedicarePatientList,

    },
  ];
  static MemberStartDateRenderder(params) {
    if (params.data)
      return moment(params.data.MedicareStartDate).format("YYYY-MM-DD");
    else return "";
  }
  static MemberEndDateRenderder(params) {
    if (params.data)
      return moment(params.data.MedicareEndDate).format("YYYY-MM-DD");
    else return "";
  }

  static ledgerGroupList = [
    { headerName: "Primary Group", field: "PrimaryGroup", width: 100 },
    { headerName: "Chart Of Account", field: "COA", width: 100 },
    { headerName: "Ledger Group", field: "LedgerGroupName", width: 100 },
    { headerName: "Description", field: "Description", width: 100 },
    { headerName: "Is Active", field: "IsActive", width: 100 },

    {
      headerName: "Action",
      field: "",
      width: 200,
      cellRenderer: GridColumnSettings.ManageUsesActionTemplate,
    },
  ];
  static ledgerGroupCategoryList = [
    {
      headerName: "Ledger GRP Category Name",
      field: "LedgerGroupCategoryName",
      width: 150,
    },
    {
      headerName: "Chart Of Account Name",
      field: "ChartOfAccountName",
      width: 150,
    },
    { headerName: "Description", field: "Description", width: 100 },
    { headerName: "Is Active", field: "IsActive", width: 100 },
    { headerName: "Is Debit", field: "IsDebit", width: 100 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      cellRenderer: GridColumnSettings.ManageUsesActionTemplate,
    },
  ];
  static voucherList = [
    { headerName: "Voucher Name", field: "VoucherName", width: 100 },
    { headerName: "Voucher Code", field: "VoucherCode", width: 100 },
    { headerName: "Description", field: "Description", width: 100 },
    { headerName: "Is Active", field: "IsActive", width: 100 },
    {
      headerName: "Is Copy Description",
      field: "ISCopyDescription",
      width: 100,
    },
    {
      headerName: "Cheque Number", field: "ShowChequeNumber", width: 100,
      cellRenderer: GridColumnSettings.ManageShowOrHideChequeNo
    },
    {
      headerName: "Payee name", field: "ShowPayeeName", width: 100,
      cellRenderer: GridColumnSettings.ManageShowOrHidePayeeName
    },

  ];

  static voucherHeadList = [
    { headerName: "Voucher Head Name", field: "VoucherHeadName", width: 150 },
    { headerName: "Description", field: "Description", width: 150 },
    {
      headerName: "Created On",
      field: "CreatedOn",
      width: 150,
      cellRenderer: GridColumnSettings.AccCreatedOnDateRenderer,
    },
    { headerName: "Is Active", field: "IsActive", width: 100 },
    { headerName: "Is Default", field: "IsDefault", width: 100 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      cellRenderer: GridColumnSettings.ManageVoucherHead,
    },
  ];

  static TransferRules = [
    { headerName: "Module Name", field: "SectionName", width: 100 },
    { headerName: "Voucher Name", field: "VoucherName", width: 100 },
    { headerName: "Custom Voucher Name", field: "customVoucherName", width: 100 },
    { headerName: "Rule Name", field: "ruleName", width: 100 },
    { headerName: "Is Active", field: "IsActive", width: 80 },
    {
      headerName: "Action",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.ManageTransferRules,
    },
  ];
  //START: System audit Reports
  static EditVoucherLogReport = [
    { headerName: "Fiscal Year Name", field: "FiscalYearName", width: 100 },
    { headerName: "Section Name", field: "SectionName", width: 100 },
    {
      headerName: "Transaction Date",
      field: "TransactionDate",
      width: 100,
      cellRenderer: GridColumnSettings.AccTransactionDateRenderer,
    },
    { headerName: "Voucher Number", field: "VoucherNumber", width: 100 },
    { headerName: "Reason", field: "Reason", width: 100 },
    {
      headerName: "Created Date",
      field: "CreatedOn",
      width: 100,
      cellRenderer: GridColumnSettings.AccCreatedOnDateRenderer,
    },
    { headerName: "Created By", field: "FullName", width: 100 },
  ];
  static BackDateEnrtyLogReport = [
    { headerName: "Section Name", field: "SectionName", width: 100 },
    {
      headerName: "Transaction Date",
      field: "TransactionDate",
      width: 100,
      cellRenderer: GridColumnSettings.AccTransactionDateRenderer,
    },
    { headerName: "Voucher Number", field: "VoucherNumber", width: 100 },
    {
      headerName: "Created Date",
      field: "CreatedOn",
      width: 100,
      cellRenderer: GridColumnSettings.AccCreatedOnDateRenderer,
    },
    { headerName: "Created By", field: "FullName", width: 100 },
  ];
  static VoucherReversalLogReport = [
    { headerName: "Section Name", field: "SectionName", width: 80 },
    { headerName: "Fiscal Year Name", field: "FiscalYearName", width: 80 },
    {
      headerName: "Transaction Date",
      field: "TransactionDate",
      width: 80,
      cellRenderer: GridColumnSettings.AccTransactionDateRenderer,
    },
    { headerName: "Reason", field: "Reason", width: 150 },
    {
      headerName: "Reversed Date",
      field: "CreatedOn",
      width: 100,
      cellRenderer: GridColumnSettings.AccCreatedOnDateRenderer,
    },
    { headerName: "Reversed By", field: "FullName", width: 100 },
    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="view-detail" class="grid-action">
                 <i class="fa fa-eye"></i>View Detail
             </a>`,
    },
  ];
  //END: System audit Reports

  static VoucherTransactionList = [
    { headerName: "Voucher No.", field: "VoucherNumber", width: 80 },
    { headerName: "Fiscal Year", field: "FiscalYear", width: 80 },
    {
      headerName: "TransactionDate",
      field: "TransactionDate",
      width: 80,
      cellRenderer: GridColumnSettings.AccTxnDateRenderder,
    },
    { headerName: "Voucher Type", field: "VoucherType", width: 120 },
    {
      headerName: "TotalAmount",
      field: "Amount",
      width: 100,
      cellRenderer: GridColumnSettings.AccAmountRenderder,
    },
    { headerName: "Narration", field: "Narration", width: 120 },
    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="view-detail" class="grid-action">
                 <i class="fa fa-eye"></i>View Detail
             </a>`,
    },
  ];
  static LedgerTransactionList = [
    { headerName: "Fiscal Year", field: "FiscalYear", width: 80 },
    { headerName: "Voucher No.", field: "VoucherNumber", width: 120 },
    {
      headerName: "Reference Voucher No.",
      cellRenderer: GridColumnSettings.AccTxnRefRenderer,
      width: 120,
    },
    {
      headerName: "Date",
      field: "TransactionDate",
      width: 80,
      cellRenderer: GridColumnSettings.AccTransactionDateRenderer,
    },
    { headerName: "Ledger", field: "LedgerName", width: 120 },
    {
      headerName: "Dr/Cr",
      field: "",
      width: 50,
      cellRenderer: GridColumnSettings.DrCrRenderer,
    },
    { headerName: "Amount", field: "Amount", width: 80 },
    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="view-detail" class="grid-action">
                 <i class="fa fa-eye"></i>View Detail
             </a>`,
    },
  ];
  static PurchaseRequestList = [
    { headerName: "PR No.", field: "PRNumber", width: 30 },
    {
      headerName: "Request Date",
      field: "RequestDate",
      width: 100,
      cellRenderer: GridColumnSettings.DateTimeRendererForPurchaseRequest,
    },
    { headerName: "Vendor", field: "VendorName", width: 100 },
    { headerName: "Status", field: "RequestStatus", width: 60 },
    {
      headerName: "Verification Status",
      width: 100,
      cellRenderer: VerificationGridColumns.VerificationStatusRenderer,
    },
    { headerName: "RequestedBy", field: "RequestedByName", width: 100 },
    {
      headerName: "PO Created",
      field: "IsPOCreated",
      width: 60,
      cellRenderer: VerificationGridColumns.YesNoViewerforPurchaseRequest,
    },
    {
      headerName: "Actions",
      field: "",
      width: 150,
      cellRenderer: GridColumnSettings.GetPOActions,
    },
  ];
  static InternalPRList = [
    { headerName: "PR No.", field: "PRNumber", width: 30 },
    {
      headerName: "Request Date",
      field: "RequestDate",
      width: 100,
      cellRenderer: GridColumnSettings.DateTimeRendererForPurchaseRequest,
    },
    { headerName: "Vendor", field: "VendorName", width: 100 },
    { headerName: "Status", field: "RequestStatus", width: 60 },
    {
      headerName: "Verification Status",
      width: 100,
      cellRenderer: VerificationGridColumns.VerificationStatusRenderer,
    },
    { headerName: "RequestedBy", field: "RequestedByName", width: 100 },
    {
      headerName: "PO Created",
      field: "IsPOCreated",
      width: 60,
      cellRenderer: VerificationGridColumns.YesNoViewerforPurchaseRequest,
    },
    {
      headerName: "Actions",
      field: "",
      width: 150,
      template: `<a danphe-grid-action="view" class="grid-action">View</a>`,
    },
  ];

  static AccTransactionDateRenderer(params) {
    let date: string = params.data.TransactionDate;
    return moment(date).format("YYYY-MM-DD");
  }

  static AccCreatedOnDateRenderer(params) {
    let date: string = params.data.CreatedOn;
    return moment(date).format("YYYY-MM-DD");
  }
  static AccTxnRefRenderer(params) {
    let refVno: number = params.data.ReferenceVoucherNumber;
    return refVno ? refVno : "";
  }
  static DrCrRenderer(params) {
    if (params.data.IsDebit) {
      return "Dr.";
    } else return "Cr.";
  }

  static GetIsconsumableOrCapital(params) {
    if (params.data.IsConsumable) {
      return "Consumable";
    } else {
      return "Capital";
    }
  }

  public static ManageUsesActionTemplate(params) {
    let template;

    if (params.data.IsActive == true) {

      template = `<a danphe-grid-action="activateDeactivateBasedOnStatus" class="grid-action">
              Deactivate
            </a>
          <a danphe-grid-action="edit" class="grid-action">Edit</a >`;
    } else {
      template = `<a danphe-grid-action="activateDeactivateBasedOnStatus" class="grid-action">
                Activate
               </a>`;
    }
    return template;
  }

  public static ManageFractionTemplate(params) {
    let template;
    if (params.data.BillTxnItemId) {
      template = `<a danphe-grid-action="view">
             View Fraction
            </a>`;
    } else {
      template = `<a danphe-grid-action="add">
                Add Fraction
               </a>`;
    }
    return template;
  }

  public static ManageUserActionLedgerTemplate(params) {
    if (params.data.IsActive == true) {
      let template = `
            <a danphe-grid-action="activateDeactivateBasedOnStatus" class="grid-action">Deactivate</a>
            <a danphe-grid-action="edit" class="grid-action">Edit</a >
            `;
      return template;
    } else {
      let template = `
            <a danphe-grid-action="activateDeactivateBasedOnStatus" class="grid-action">Activate</a>
            `;
      return template;
    }
  }

  public static ManageVoucherHead(params) {
    let template = `
            <a danphe-grid-action="edit" class="grid-action">Edit</a >
            `;
    return template;
  }
  public static ManageSection(params) {
    let template = `
            <a danphe-grid-action="edit" class="grid-action">Edit</a >
            `;
    return template;
  }
  public static ManageFiscalYearActionTemplate(params) {
    if (params.data.IsActive == true) {
      let template = `
            <a danphe-grid-action="endFiscalYear" class="grid-action">
              End Year
            </a>`;
      return template;
    } else {
      return null;
    }
  }
  public static ManageLedgerGrpVouchersTemplate(params) {
    if (params.data.IsActive == true) {
      let template = `
            <a danphe-grid-action="ManageLedgerGrpVouchers" class="grid-action">
              Manage Vouchers
            </a>

            <a danphe-grid-action="activateDeactivateBasedOnStatus" class="grid-action">
              Deactivate
            </a>`;
      return template;
    } else {
      let template = `<a danphe-grid-action="activateDeactivateBasedOnStatus" class="grid-action">
                Activate
               </a>`;
      return template;
    }
  }
  public static ManageTransferRules(params) {
    if (params.data.IsActive == true) {
      let template = `
            <a danphe-grid-action="ActivateDeactivateTransferRules" class="grid-action">Deactivate</a>
            `;
      return template;
    } else {
      let template = `
            <a danphe-grid-action="ActivateDeactivateTransferRules" class="grid-action">Activate</a>
            `;
      return template;
    }
  }
  // ------End: Accounting Grid Data ----------------
  static PackagingTypeList = [
    {
      headerName: "PackagingType Name",
      field: "PackagingTypeName",
      width: 150,
    },
    { headerName: "Description", field: "Description", width: 150 },
    { headerName: "Is Active", field: "IsActive", width: 100 },

    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];

  static UnitOfMeasurementList = [
    { headerName: "UnitOfMeasurement Name", field: "UOMName", width: 150 },
    { headerName: "Description", field: "Description", width: 150 },
    { headerName: "Is Active", field: "IsActive", width: 100 },

    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>`,
    },
  ];

  //start:nursing

  static NurOPDList = [
    {
      headerName: "Date",
      field: "VisitDate",
      width: 80,
      sort: "desc",
      //cellRenderer: GridColumnSettings.VisitDateOnlyRenderer,
    },
    {
      headerName: "Time",
      field: "",
      width: 80,
      cellRenderer: GridColumnSettings.VisitTimeOnlyRendererNurOPD,
    },
    { headerName: "Hospital Number", field: "PatientCode", width: 120 },
    {
      headerName: "Patient Name",
      field: "ShortName",
      width: 160,
      //cellRenderer: GridColumnSettings.NursingOpdPatNameRenderer,
    },
    {
      headerName: "Age/Sex",
      field: "",
      width: 90,
      cellRenderer: GridColumnSettings.AgeSexRendererNurOPD,
    },
    { headerName: "Phone", field: "PhoneNumber", width: 125 },

    { headerName: "Doctor Name", field: "ProviderName", width: 160 },
    {
      headerName: "Action",
      field: "",

      width: 160,
      template: `<i danphe-grid-action="patient-overview" class="fa fa-tv grid-action" style="padding: 3px;" title= "overview"></i>
              <a danphe-grid-action="clinical" class="grid-action">
                Clinical
             </a>
                <i danphe-grid-action="upload-files" class="fa fa-upload grid-action" style="padding: 3px;" title="upload files"></i>`,
    },
  ];

  static NursingOpdPatNameRenderer(params) {
    return `<b>` + params.data.Patient.ShortName + `</b>`;
    //let date: string = params.data.VisitDate;
    //return moment(date).format("YYYY-MM-DD");
  }

  public static DrRenderer(params) {
    if (params.data.PerformerName && params.data.PerformerName.trim().length) {
      return params.data.PerformerName;
    } else {
      return "";
    }
  }

  static NurNEPHList = [
    {
      headerName: "Request Date ", field: "RequisitionDate", width: 120,
      cellRenderer: GridColumnSettings.RequisitionDateRenderer,
    },
    { headerName: "Hospital Number", field: "PatientCode", width: 120 },
    { headerName: "DialysisCode", field: "DialysisCode", width: 120 },
    { headerName: "Patient Name", field: "ShortName", width: 160 },
    { headerName: "Phone", field: "PhoneNumber", width: 125 },
    { headerName: "Age", field: "Age", width: 90 },
    { headerName: "Sex", field: "Gender", width: 90 },
    { headerName: "Service Name", field: "ItemName", width: 125 },
    { headerName: "Performer Name", field: "PerformerName", width: 160 },
    {
      headerName: "Action",
      field: "",

      width: 160,
      template: `
              <a danphe-grid-action="add-report" class="grid-action">
                  Add Report
              </a>
              <a danphe-grid-action="show-report" class="grid-action">
                Show Report
             </a>`,
    },
  ];
  //end:nursing

  //  START: SCHEDULING

  static ShiftsMasterList = [
    { headerName: "Shifts Name", field: "ShiftName", width: 100 },
    { headerName: "Start Time", field: "StartTime", width: 100 },
    { headerName: "End Time", field: "EndTime", width: 100 },
    //Is Default will be true temporary.
    //{ headerName: "Is Default", field: "IsDefault", width: 100 },
    { headerName: "Total Hrs", field: "TotalHrs", width: 100 },
    {
      headerName: "Actions",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="edit" class="grid-action">Edit</a>`,
    },
  ];

  static WorkingHoursList = [
    { headerName: "Employee Id", field: "EmployeeId", width: 100 },
    { headerName: "Employee Name", field: "EmployeeName", width: 100 },
    { headerName: "Department Name", field: "DepartmentName", width: 100 },
    { headerName: "Role", field: "EmployeeRoleName", width: 100 },
    { headerName: "No Of Shifts", field: "NoOfShifts", width: 100 },
    { headerName: "Total Working Hrs", field: "TotalWorkingHrs", width: 100 },
    {
      headerName: "Actions",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="edit" class="grid-action">Edit Working Hours</a>`,
    },
  ];
  //  END: SCHEDULING

  //START: Inpatient Billing
  static IpBillPatientSearch = [
    { headerName: "Hospital No.", field: "PatientNo", width: 120 },
    { headerName: "Patient Name", field: "PatientName", width: 200 },
    { headerName: "IP Number", field: "IpNumber", width: 120 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "Contacts", field: "PhoneNumber", width: 100 },
    {
      headerName: "Admitted On",
      field: "AdmittedDate",
      width: 120,
      cellRenderer: GridColumnSettings.AdmissionDateRenderer,
    },
    {
      headerName: "Deposit Amount",
      field: "DepositAmount",
      width: 120,
      cellRenderer: GridColumnSettings.IpDepositRenderer,
    },
    {
      headerName: "Ward/Bed",
      field: "WardBedInfo",
      width: 180
    },
    { headerName: "Scheme Name", field: "SchemeName", width: 120 },
    {
      headerName: "Actions",
      field: "",
      width: 120,
      template: `<a danphe-grid-action="view-summary" class="grid-action">
                        <i class="fa fa-eye"></i>View Details
                 </a>`,
    },
  ];

  //Pramod
  //START: ins-Inpatient Billing
  static insIpBillPatientSearch = [
    { headerName: "Hospital No.", field: "PatientNo", width: 120 },
    { headerName: "Patient Name", field: "PatientName", width: 200 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 120,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "NSHI No", field: "Ins_NshiNumber", width: 120 },
    { hederName: "Claim Code", field: "ClaimCode", width: 120 },
    { headerName: "IP Number", field: "IpNumber", width: 120 },

    { headerName: "Contacts", field: "PhoneNumber", width: 120 },
    {
      headerName: "Admitted On",
      field: "AdmittedDate",
      width: 150,
      cellRenderer: GridColumnSettings.AdmissionDateRenderer,
    },

    {
      headerName: "Ward/Bed",
      field: "WardBedInfo",
      width: 150,
      // cellRenderer: GridColumnSettings.ADTBedRenderer,
    },
    {
      headerName: "Actions",
      field: "",
      width: 280,
      template: `<a danphe-grid-action="view-summary" class="grid-action">
                        <i class="fa fa-eye"></i>View Details
                 </a>`,
    },
  ];

  static IpDepositRenderer(params) {
    return params.data.DepositAdded - params.data.DepositReturned;
  }
  static ADTBedRenderer(params) {
    return (
      params.data.BedInformation.Ward + "/" + params.data.BedInformation.BedCode
    );
  }
  //END: Inpaient Billing

  //column setting for Database backup log
  static DataBaseBakupLog = [
    {
      headerName: "Date",
      field: "CreatedOn",
      cellRenderer: GridColumnSettings.DBBakupDateRender,
      width: 200,
    },
    { headerName: "File Name", field: "FileName", width: 200 },

    { headerName: "Database Name", field: "DatabaseName", Width: 120 },
    { headerName: "Database Version", field: "DatabaseVersion", Width: 50 },
    { headerName: "Action", field: "Action", Width: 20 },
    { headerName: "Status", field: "Status", Width: 20 },
    {
      headerName: "Action Detail",
      field: "MessageDetail",
      width: 400,
    },
  ];
  ////BillingInvoiceDetails
  ////Column setting for SystemAdmin module Billing Invoice details
  //static BillingInvoiceDetails = [
  //    { headerName: "Fiscal_Year", field: "Fiscal_Year", width: 150 },
  //    { headerName: "Bill_No", field: "Bill_No", width: 150 },

  //    { headerName: "Customer Name", field: "Customer_name", Width: 120 },
  //    { headerName: "Customer_PAN", field: "PANNumber", Width: 100 },
  //    { headerName: "BillDate", field: "BillDate", Width: 80 },
  //    { headerName: "Amount", field: "Amount", Width: 50 },
  //    { headerName: "DiscountAmount", field: "DiscountAmount", Width: 50 },
  //    { headerName: "Taxable_Amount", field: "Taxable_Amount", Width: 50 },
  //    { headerName: "Tax_Amount", field: "Tax_Amount", Width: 50 },
  //    { headerName: "Is_Printed", field: "Is_Printed", Width: 50 },
  //    { headerName: "Printed_Time", field: "Printed_Time", Width: 50 },
  //    { headerName: "Entered_by", field: "Entered_by", Width: 100 },
  //    { headerName: "Printed_by", field: "Printed_by", Width: 100 },
  //    { headerName: "Print_Count", field: "Print_Count", Width: 100 },
  //    { headerName: "Is_Active", field: "Is_Active", Width: 100 }
  //]

  public static BillingInvoiceDetailsColFilter(columnArr: Array<any>): Array<any> {
    var filteredColumns = [];
    if (columnArr && columnArr.length) {
      for (var i = 0; i < columnArr.length; i++) {
        var headername: string = columnArr[i];
        var ind = this.BillingInvoiceDetails.find((val) => val.headerName.toLowerCase().replace(/ +/g, "") == headername.toLowerCase().replace(/ +/g, ""));
        if (ind) {
          filteredColumns.push(ind);
        }
      }
      if (filteredColumns.length) {
        return filteredColumns;
      }
      else {
        return this.BillingInvoiceDetails;
      }
    }
    else {
      return this.BillingInvoiceDetails;
    }
  }

  //BillingInvoiceDetails
  //Column setting for SystemAdmin module Billing Invoice details--for
  static BillingInvoiceDetails = [
    { headerName: "Fiscal Year", field: "Fiscal_Year", width: 150 },
    { headerName: "Bill_no", field: "Bill_No", width: 150 },
    { headerName: "Customer_name", field: "Customer_name", Width: 120 },
    { headerName: "Customer_Pan", field: "PANNumber", Width: 100 },
    { headerName: "Bill_Date", field: "BillDate", Width: 80 },
    // { headerName: "BillDate(BS)", field: "BillDate_BS", Width: 80 },
    { headerName: "Amount", field: "Amount", Width: 50 },
    { headerName: "Discount", field: "DiscountAmount", Width: 50 },
    { headerName: "Taxable_Amount", field: "Taxable_Amount", Width: 50 },
    { headerName: "Tax_Amount", field: "Tax_Amount", Width: 50 },
    { headerName: "Total_Amount", field: "Total_Amount", Width: 50 },
    { headerName: "Sync with IRD", field: "SyncedWithIRD", Width: 50 },
    { headerName: "IS_Bill_Printed", field: "Is_Printed", Width: 50 },
    { headerName: "Is_bill_Active", field: "Is_Bill_Active", Width: 100 },
    { headerName: "Printed_Time", field: "Printed_Time", Width: 50 },
    { headerName: "Entered_By", field: "Entered_by", Width: 100 },
    { headerName: "Printed_by", field: "Printed_by", Width: 100 },
    // { headerName: "Print_Count", field: "Print_Count", Width: 100 },
    { headerName: "Is_realtime", field: "Is_Realtime", Width: 100 },
    { headerName: "Payment_Method", field: "Payment_Method", Width: 100 },
    { headerName: "VAT_Refund_Amount", field: "VAT_Refund_Amount", Width: 100 },
    { headerName: "Transaction Id", field: "TransactionId", Width: 100 }
  ];
  //This for createdOn date format rendering
  static DBBakupDateRender(params) {
    let createdDate: string = params.data.CreatedOn;
    if (createdDate) return moment(createdDate).format("DD-MMM-YYYY hh:mm A");
    else return null;
  }

  //Colum setting for SQL Audit log details
  static SqlAuditLog = [
    {
      headerName: "Event Time",
      field: "Event_Time",
      cellRenderer: GridColumnSettings.DBSqlAuditEventTimeRender,
      width: 180,
    },
    { headerName: "Server Name", field: "Server_Instance_Name", width: 120 },
    { headerName: "Action", field: "Action_Id", width: 100 },
    { headerName: "Statement", field: "Statement", width: 220 },
    { headerName: "Schema Name", field: "Schema_Name", width: 120 },
    { headerName: "Database Name", field: "Database_Name", width: 120 },
    {
      headerName: "Server Principal Name",
      field: "Server_Principal_Name",
      width: 150,
    },
    { headerName: "Object Name", field: "Object_Name", width: 150 },
    { headerName: "Session Id", field: "Session_Id", width: 150 },
    //event_time,server_instance_name,action_id,statement,schema_name,server_principal_name,database_name,object_name,session_id
  ];

  //start: doctor's module//
  static DoctorAppointmentList = [
    { headerName: "Hospital No.", width: 100, field: "Patient.PatientCode" },
    { headerName: "Name", field: "Patient.ShortName", width: 200 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.AgeSexRenderer,
    },
    { headerName: "VisitType", field: "VisitType", width: 100 },
    {
      headerName: "Admitted On",
      width: 120,
      field: "",
      cellRenderer: GridColumnSettings.DoctorAppointmentDateRenderer,
    },
    { headerName: "Performer Name", field: "PerformerName", width: 150 },
    {
      headerName: "Actions",
      field: "",
      width: 200,
      cellRenderer: GridColumnSettings.FavoritePatientRenderer,
    },
  ];
  //View Clinical-notes Template
  static ViewTemplateGridList = [
    {
      headerName: "Recorded On",
      field: "CreatedOn",
      width: 80,
      //cellRenderer: GridColumnSettings.TemplateListDateRenderer,
    },
    { headerName: "Primary Doctor", field: "PrimaryDoctor", width: 100 },
    { headerName: "Template Type", field: "TemplateName", width: 110 },
    { headerName: "Note Type", field: "NoteType", width: 110 },
    { headerName: "Written By", field: "WrittenBy", width: 110 },
    { headerName: "Visit Code", field: "VisitCode", width: 80 },
    {
      headerName: "Action",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.ShowActionForDoctorEditTemplate,
    },
  ];
  //start: doctor's module//
  static AdmittedAppointmentList = [
    { headerName: "Hospital No.", width: 80, field: "PatientCode" },
    { headerName: "Name", field: "Name", width: 100 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 80,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "Admission Status", field: "AdmissionStatus", width: 100 },
    {
      headerName: "Admitted On",
      width: 160,
      field: "",
      cellRenderer: GridColumnSettings.AdmittedAppointmentDateRenderer,
    },
    { headerName: "Ward-Bed", field: "BedInformation.BedCode", width: 80 },
    { headerName: "Dept", field: "Department", width: 100 },
    { headerName: "Provider Name", field: "AdmittingDoctorName", width: 150 },
    {
      headerName: "Actions",
      field: "",
      width: 140,
      cellRenderer: GridColumnSettings.FavoritePatientRenderer,
    },
  ];
  static FavoriteAppointmentList = [
    { headerName: "Hospital No.", width: 80, field: "PatientCode" },
    { headerName: "Name", field: "Name", width: 150 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 70,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "Admission Status", field: "AdmissionStatus", width: 100 },
    {
      headerName: "Admitted On",
      width: 200,
      field: "",
      cellRenderer: GridColumnSettings.AdmittedAppointmentDateRenderer,
    },
    { headerName: "Ward-Bed", field: "BedInformation.BedCode", width: 80 },
    { headerName: "Dept", field: "Department", width: 100 },
    { headerName: "Provider Name", field: "AdmittingDoctorName", width: 150 },
    {
      headerName: "Actions",
      field: "",
      width: 150,
      cellRenderer: GridColumnSettings.FavoritePatientRenderer,
    },
  ];
  static PendingList = [
    { headerName: "Name", field: "PatientName", width: 150 },
    {
      headerName: "CreatedOn",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.TemplateListDateRenderer,
    },
    { headerName: "Note Type", field: "NoteType", width: 150 },
    { headerName: "Template Type", width: 150, field: "TemplateName" },
    { headerName: "Written By", width: 100, field: "WrittenBy" },
    {
      headerName: "Status",
      field: "",
      width: 80,
      cellRenderer: GridColumnSettings.CheckStatus,
    },
    { headerName: "Provider Name", field: "PrimaryDoctor", width: 180 },
    {
      headerName: "Action",
      field: "",
      width: 150,
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>`,
    },
  ];

  //Colum setting for Audit Trail details
  static AuditTrailDetails = [
    { headerName: "AuditId", field: "AuditId", width: 50 },
    {
      headerName: "InsertedDate",
      field: "InsertedDate",
      width: 100,
      //cellRenderer: GridColumnSettings.InsertedDateRenderer,
    },
    //{ headerName: "DbContext", field: "DbContext", width: 150 },
    //{ headerName: "MachineUserName", field: "MachineUserName", width: 100 },
    //{ headerName: "MachineName", field: "MachineName", width: 150 },
    //{ headerName: "DomainName", field: "DomainName", width: 150 },
    //{ headerName: "CallingMethodName", field: "CallingMethodName", width: 250 },
    { headerName: "ChangedByUserId", field: "ChangedByUserId", width: 50 },
    { headerName: "ChangedByUserName", field: "ChangedByUserName", width: 100 },
    { headerName: "Table_Database", field: "Table_Database", width: 150 },
    { headerName: "ActionName", field: "ActionName", width: 100 },
    { headerName: "Table_Name", field: "Table_Name", width: 150 },
    { headerName: "PrimaryKey", field: "PrimaryKey", width: 200 },
    { headerName: "ColumnsValue", field: "ColumnValues", width: 350 },
  ];

  static CustomAuditTrailDetails = [
    { headerName: "Employee Id", field: "EmployeeId", width: 50 },
    { headerName: "UserName", field: "UserName", width: 200 },
    { headerName: "Action Name", field: "ActionName", width: 140 },
    { headerName: "DateTime", field: "CreatedOn", width: 180 },
  ];

  static DoctorDepartmentAppointmentList = [
    {
      headerName: "Date",
      width: 100,
      field: "",
      cellRenderer: GridColumnSettings.DoctorAppointmentDateRenderer,
    },
    { headerName: "Time", width: 100, field: "VisitTime" },
    { headerName: "Hospital No.", width: 100, field: "Patient.PatientCode" },
    { headerName: "Name", field: "Patient.ShortName", width: 180 },
    { headerName: "VisitType", field: "VisitType", width: 120 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.AgeSexRenderer,
    },
    { headerName: "Current Doctor", field: "ProviderName", width: 180 },
    {
      headerName: "Actions",
      field: "",
      width: 150,
      template: `<a danphe-grid-action="AssignToMe" class="grid-action">Assign to me</a>`,
    },
  ];

  // static InsertedDateRenderer(params) {
  //   return moment(params.data.InsertedDate).format("YYYY-MM-DD, h:mm:ss a");
  // }

  static DoctorAppointmentDateRenderer(params) {
    var tempdate = GridColumnSettings.DateRenderer(
      params.data.VisitDate,
      "YYYY-MM-DD"
    );
    return tempdate + " " + params.data.VisitTime;
  }
  static AdmittedAppointmentDateRenderer(params) {
    var tempdate = GridColumnSettings.DateRenderer(
      params.data.AdmittedDate,
      "MMMM Do YYYY, h:mm:ss a"
    );
    return tempdate;
  }

  //end: doctor's module

  //start: billing duplicate prints
  static DuplicateInvoiceList = [
    {
      headerName: "Date",
      field: "TransactionDate",
      cellRenderer: GridColumnSettings.BillingInvoiceDateTimeRenderer,
    },
    { headerName: "Hospital No.", field: "PatientCode" },
    { headerName: "Patient Name", field: "ShortName" },
    {
      headerName: "Age/Sex",
      field: "",
      width: 120,
      cellRenderer: GridColumnSettings.NewAgeSexRendererPatient,
    },
    //{ headerName: "Phone", field: "PhoneNumber", width: 110 },
    { headerName: "Total", field: "TotalAmount" },
    { headerName: "FiscalYear", field: "FiscalYear" },
    //{ headerName: "Invoice No.", field: "InvoiceNumber" },
    { headerName: "Invoice No.", width: 120, field: "InvoiceNumFormatted" },
    { headerName: "PayMode", width: 120, field: "PaymentMode" },
    {
      headerName: "Action",
      field: "",
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>`,
    },
  ];

  static DuplicateInvoiceReturnList = [
    { headerName: "Date", field: "CRNDate" },
    { headerName: "Ref. Invoice No.", field: "RefInvoiceNum" },
    { headerName: "Hospital No.", field: "PatientCode" },
    { headerName: "Patient Name", field: "ShortName" },
    {
      headerName: "Age/Sex",
      field: "",
      width: 120,
      cellRenderer: GridColumnSettings.NewAgeSexRendererPatient,
    },

    { headerName: "FiscalYear", field: "FiscalYear" },
    { headerName: "Credit Note No.", field: "CreditNoteNumber" },
    { headerName: "Return Amount", field: "TotalAmount" },
    {
      headerName: "Action",
      field: "",
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>`,
    },
  ];

  static BilProvisionalDate(params) {
    return moment(params.data.CreatedOn).format("YYYY-MM-DD HH:mm");
  }

  static ProvFiscalYearFormat(params) {
    let FiscalYear = params.data.FiscalYear;
    let ProvReceiptNo = params.data.ProvisionalReceiptNo;
    return FiscalYear + "/" + "PR" + "/" + ProvReceiptNo;
  }

  //start: billing provisional duplicate prints
  static DuplicateProvisionalReceiptList = [
    {
      headerName: "Last Billing Date",
      field: "LastBillDate",
      cellRenderer: GridColumnSettings.BillingProvisionalReceiptsDateTimeRenderer,
    },
    { headerName: "Hospital No.", field: "PatientCode" },
    { headerName: "Patient Name", field: "PatientName" },
    { headerName: "Total Amount", field: "TotalAmount" },
    { headerName: "ReceiptNo", field: "ProvisionalReceiptNo" },
    {
      headerName: "Action",
      field: "",
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>`,
    },
  ];
  static DupInv_InvCodeRenderer(params) {
    return params.data.InvoiceCode + params.data.InvoiceNumber;
  }

  //static DepositDateTimeRenderer(params) {
  //  return moment(params.data.CreatedOn).format("YYYY-MM-DD HH:mm");
  //}

  static DuplicateDepositReceiptList = [
    { headerName: "Hospital No.", field: "PatientCode" },
    { headerName: "Patient Name", field: "PatientName" },
    {
      headerName: "Age/Sex",
      field: "",
      width: 120,
      cellRenderer: GridColumnSettings.NewAgeSexRendererPatient,
    },
    {
      headerName: "DepositDate",
      field: "CreatedOn",
      cellRenderer: GridColumnSettings.BillingDepositeReceiptsDateTimeRenderer,
    },
    { headerName: "Phone", field: "PhoneNumber", width: 110 },
    {
      headerName: "Amount",
      field: "Amount",
      cellRenderer: GridColumnSettings.AmtRenderer_DepositDupPrint,
    },
    { headerName: "FiscalYear", field: "FiscalYear" },
    { headerName: "Receipt No.", field: "ReceiptNo" },
    {
      headerName: "Action",
      field: "",
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>`,
    },
  ];
  static DuplicateOrganizationDepositReceiptList = [
    { headerName: "Organization", field: "CreditOrganization" },
    {
      headerName: "DepositDate",
      field: "ReceiptDate",
      cellRenderer: GridColumnSettings.DepositDateTimeRenderer,
    },
    { headerName: "ReceiptNo", field: "DepositReceiptNo", width: 110 },
    {
      headerName: "Amount",
      field: "Amount",
      cellRenderer: GridColumnSettings.AmtRenderer_DepositDupPrint,
    },
    { headerName: "TransactionType", field: "TransactionType" },
    { headerName: "FiscalYear", field: "FiscalYear" },
    { headerName: "Representative", field: "Representative" },
    {
      headerName: "Action",
      field: "",
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>`,
    },
  ];

  static ReqQuotationList = [
    { headerName: "Subject", field: "Subject", width: 120 },
    { headerName: "Description", field: "Description", width: 200 },
    {
      headerName: "Requested Date",
      field: "RequestedOn",
      width: 100,
      cellRenderer: GridColumnSettings.DepositDateTimeRenderer,
    },
    { headerName: "Status", field: "Status", width: 100 },
    {
      headerName: "Action",
      field: "",
      width: 180,
      cellRenderer: GridColumnSettings.ShowActionForRFQList,
    },
  ];
  static ShowActionForInventoryRequisitionList(params) {
    let template = `<a danphe-grid-action="view" class="grid-action">
        View
      </a>`;
    if (
      ["partial", "complete"].includes(params.data.RequisitionStatus) &&
      (params.data.isReceiveItemsEnabled == true && params.data.EnableReceiveFeature == true)
    ) {
      template += `
        <a danphe-grid-action="receiveDispatchedItems" title="Receive Dispatched Items"
        class="grid-action ${params.data.NewDispatchAvailable
          ? "animated-btn blinking-btn-warning grid-action"
          : ""
        }">
          Receive Items
        </a>`;
    }
    template += `
      <div class="dropdown" style="display:inline-block;">
        <button class="dropdown-toggle grid-btnCstm" type="button" data-toggle="dropdown">...
          <span class="caret"></span>
        </button>
        <ul class="dropdown-menu grid-ddlCstm">
          <li>
            <a danphe-grid-action="CreateCopy" >Create copy</a>
          </li>
        </ul>
      </div> `;
    return template;
  }
  static ShowActionForRFQList(params) {
    if (params.data.Status == "active" || params.data.Status == "partial") {
      let template = `<a danphe-grid-action="View" class="grid-action">RFQ Details</a>
             <a danphe-grid-action="AttachQuotationDocuments" class="grid-action">Attach Quo Files</a>

                  <div class="dropdown" style="display:inline-block;">
                 <button class="dropdown-toggle grid-btnCstm" type="button" data-toggle="dropdown">...
                 <span class="caret"></span></button>
                 <ul class="dropdown-menu grid-ddlCstm">
                     <li><a danphe-grid-action="AddQuotationDetails" class="grid-action">Add Vendor Quot.</a></li>
                    <li><a danphe-grid-action="AnalyseQuotation" class="grid-action">Analyse Quotation</a></li>

                 </ul>
               </div>`;
      return template;
    } else {
      let template = `<a danphe-grid-action="View" class="grid-action">RFQ Details</a>
          <a danphe-grid-action="QuotationList" class="grid-action">Quotation List</a>
 <a danphe-grid-action="SelectedQuotation" class="grid-action"> Selected Quotation </a>`;
      return template;
    }
  }

  static ShowActionForDoctorEditTemplate(params) {
    if (
      params.data.CreatedBy == params.data.LoggedInEmployeeId &&
      params.data.IsPending == true
    ) {
      let template = `<a danphe-grid-action="view" class="grid-action" >
              View
            </a>
              <a danphe-grid-action="edit" class="grid-action">
              Edit
           </a>`;
      return template;
    } else {
      let template = `<a danphe-grid-action="view" class="grid-action" >
              View
            </a>`;
      return template;
    }
  }

  static QuotationList = [
    { headerName: "RFQ Subject", field: "Subject" },
    { headerName: "Vendor Name", field: "VendorName" },
    {
      headerName: "Created Date",
      field: "CreatedOn",
      cellRenderer: GridColumnSettings.DepositDateTimeRenderer,
    },
    { headerName: "Status", field: "Status" },
    {
      headerName: "Action",
      field: "",
      template: `<a danphe-grid-action="view" class="grid-action">
               View
             </a>`,
    },
  ];

  static DepositDateTimeRenderer(params) {
    return moment(params.data.ReceiptDate).format("YYYY-MM-DD HH:mm");
  }

  static AmtRenderer_DepositDupPrint(params) {
    return CommonFunctions.parseAmount(params.data.Amount);
  }

  static SettlementDuplicateColumns = [
    { headerName: "Hospital No.", field: "Patient.PatientCode" },
    { headerName: "Patient Name", field: "Patient.ShortName" },
    {
      headerName: "Age/Sex",
      field: "",
      width: 120,
      cellRenderer: GridColumnSettings.AgeSexRenderer_Settlmnt,
    },
    { headerName: "Phone", field: "Patient.PhoneNumber", width: 110 },
    {
      headerName: "SettlementDate",
      field: "CreatedOn",
      cellRenderer: GridColumnSettings.DateRenderer_Settlmnt,
    },

    { headerName: "Receipt No", field: "SettlementReceiptNo" },
    {
      headerName: "Action",
      field: "",
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>`,
    },
  ];
  static DaywiseVoucherTransactionList = [
    {
      headerName: "Voucher No.",
      field: "VoucherNumber",
      width: 120,
      cellRenderer: GridColumnSettings.LeadingZeroVoucherNumber,
    },
    { headerName: "Fiscal Year", field: "FiscalYear", width: 80 },
    {
      headerName: "TransactionDate",
      field: "TransactionDate",
      width: 80,
      cellRenderer: GridColumnSettings.AccTxnDateRenderder,
    },
    { headerName: "Voucher Type", field: "VoucherType", width: 120 },
    {
      headerName: "TotalAmount",
      field: "Amount",
      width: 100,
      cellRenderer: GridColumnSettings.AccAmountRenderder,
    },
    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="view-detail" class="grid-action">
                 <i class="fa fa-eye"></i>View Detail
             </a>`,
    },
  ];

  static fsyearactivity = [
    {
      headerName: "Sr No.",
      width: 100,
      cellRenderer: GridColumnSettings.SerialNumberRenderer,
    },
    { headerName: "Fiscal Year", field: "FiscalYearName", width: 150 },
    {
      headerName: "Date",
      field: "CreatedOn",
      width: 150,
      cellRenderer: GridColumnSettings.CreatedDateTimeRenderer,
    },
    { headerName: "Action", field: "LogType", width: 100 },
    { headerName: "By", field: "FirstName", width: 100 },
    { headerName: "Detail", field: "LogDetails", width: 200 },
  ];

  static DateRenderer_Settlmnt(params) {
    return moment(params.data.SettlementDate).format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
  }

  static BillingInvoiceDateTimeRenderer(params) {
    return moment(params.data.Date).format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
  }

  static BillingDepositeReceiptsDateTimeRenderer(params) {
    return moment(params.data.DepositDate).format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
  }

  static BillingProvisionalReceiptsDateTimeRenderer(params) {
    return moment(params.data.LastBillDate).format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
  }

  static BillingDischargeStatementDateTimeRenderer(params) {
    return moment(params.data.StatementDate).format(ENUM_DateTimeFormat.Year_Month_Day);
  }
  //Modified: 29thSep'24 Bikesh
  static AgeSexRenderer_Settlmnt(params) {
    let age = params.data.Patient.Age;
    let gender = params.data.Patient.Gender;
    if (age && gender) {
      let agesex = age + '/' + gender.charAt(0).toUpperCase();
      return agesex;
    }
    else
      return '';
  }

  //end : billing duplicate prints

  //This for Event_Time format rendering
  static DBSqlAuditEventTimeRender(params) {
    let eventTime: string = params.data.Event_Time;
    if (eventTime) return moment(eventTime).format("DD-MMM-YYYY hh:mm A");
    else return null;
  }
  static NameRenderer(params) {
    let mName = params.data.MiddleName != null ? params.data.MiddleName : "";

    var fullName =
      params.data.LastName + ", " + params.data.FirstName + " " + mName;
    return fullName;
  }

  static GenderRenderer(params) {
    let gender: string = params.data.Gender;
    return gender;
    //return gender.charAt(0).toUpperCase();
  }
  static EmpNameRenderer(params) {
    let sal: string = params.data.Salutation;
    let first: string = params.data.FirstName;
    let middle: string = params.data.MiddleName;
    let last: string = params.data.LastName;
    if (!middle) middle = "";
    if (sal) sal = sal + ".";
    else sal = "";
    return sal + first + " " + middle + " " + last;
  }

  static VisitTimeOnlyRendererNurOPD(params) {
    let time: string = params.data.VisitTime;
    return moment(time, "hhmm").format("hh:mm A");
  }

  static VisitTimeOnlyRenderer(params) {
    let time: string = params.data.VisitTime;
    return moment(time, "hhmm").format("hh:mm A");
  }
  static VisitDateOnlyRenderer(params) {
    let date: string = params.data.VisitDate;
    return moment(date).format("YYYY-MM-DD");
  }

  static AppointmentTimeRenderer(params) {
    let time = params.data.AppointmentTime;
    return moment(time, 'HH:mm:ss').format('hh:mm:ss A');
  }
  static AdmittingDateRenderer(params) {
    let date: string = params.data.AdmittingDate;
    return moment(date).format("YYYY-MM-DD");
  }
  static DischargeDateRenderer(params) {
    let date: string = params.data.DischargeDate;
    return moment(date).format("YYYY-MM-DD");
  }

  static AllDateFormatRenderer(params) {
    const dateFieldName = params.colDef.cellRendererParams.dateFieldName;
    const date = params.data[dateFieldName];
    if (date != null) {
      return moment(date).format("YYYY-MM-DD");
    }
  }
  //displays date and time in hour:minute
  static DateTimeRenderer(params) {
    return moment(params.data.DispatchedDate).format("YYYY-MM-DD");
  }
  //displays date and time in hour:minute
  static DateTimeRendererForPurchaseRequest(params) {
    return moment(params.data.RequestDate).format("YYYY-MM-DD HH:mm");
  }
  //displays date and time in hour:minute
  static RequisitionDateTimeRenderer(params) {
    return moment(params.data.LastestRequisitionDate).format(
      "YYYY-MM-DD HH:mm"
    );
  }

  //displays date and time in hour:minute
  static BilPendingOrderDateTimeRenderer(params) {
    return moment(params.data.RequestDate).format("YYYY-MM-DD HH:mm");
  }

  //displays date and time in hour:minute
  static BilCreditDateTimeRenderer(params) {
    return moment(params.data.LastTxnDate).format("YYYY-MM-DD HH:mm");
  }

  //displays date and time in hour:minute
  static BilProvisionalDateTimeRenderer(params) {
    return moment(params.data.LastCreditBillDate).format("YYYY-MM-DD HH:mm");
  }

  //displays date and time in hour:minute
  static BilCreditDateTimeRendererForPaidaDate(params) {
    //changed from data.PaidDate to data.TransactionDate: sud--1-OCT-18
    //since paid date will be null in case of CreditInvoices.
    return moment(params.data.TransactionDate).format("YYYY-MM-DD HH:mm");
  }
  //to format C# TimeSpan to 12 Hours format.
  //here input (AppointmentTime) would be
  static ApptTimeRenderer(params) {
    //splitting into array of hh, mm & ss
    let HHmmss = params.data.AppointmentTime.split(":");
    let appTimeHHmm = "";
    if (HHmmss.length > 1) {
      //add hours and then minute to 00:00 and then format to 12hrs hh:mm AM/PM format.
      //using 00:00:00 time so that time part won't have any impact after adding.
      appTimeHHmm = moment("2017-01-01 00:00:00")
        .add(HHmmss[0], "hours")
        .add(HHmmss[1], "minutes")
        .format("hh:mm A");
    }

    return appTimeHHmm;
  }
  static AdmissionDateRenderer(params) {
    let date: string = params.data.AdmittedDate;
    return moment(date).format("YYYY-MM-DD HH:mm");
  }

  static WardBedRenderer(params) {
    let wardBedInfo: string =
      params.data.BedInformation.Ward +
      "-" +
      params.data.BedInformation.BedNumber;
    return wardBedInfo;
  }

  ////moved to adt-grid-column-settings inside adt module.:sud- 10Jan'19
  //static DischargeDateRenderer(params) {
  //    let date: string = params.data.DischargedDate;
  //    return moment(date).format('YYYY-MM-DD HH:mm');
  //}

  static ApptDateOnlyRenderer(params) {
    let date: string = params.data.AppointmentDate;
    return moment(date).format("YYYY-MM-DD");
  }

  static GetApptActions(params) {
    let CreatedBy = params.data.CreatedByName;
    let ModifiedBy = params.data.ModifiedByName;
    let CancelledBy = params.data.CancelledByName;
    //     <a danphe-grid-action="details" class="grid-action" data-placement="top" data-toggle="tooltip" title="

    //     Created By: ${CreatedBy}
    // Modified By: ${ModifiedBy}
    // Cancelled By: ${CancelledBy}"> Details
    //        </a>
    // <a danphe-grid-action="checkin" class="grid-action">
    // CheckIn </a>
    if (
      params.data.AppointmentStatus == "checkedin" ||
      params.data.AppointmentStatus == "cancelled"
    ) {
      return `
             `;
    } else {
      return `
      <a danphe-grid-action="checkin" class="grid-action">
          CheckIn </a>
            <a danphe-grid-action="cancel" class="grid-action">
                Cancel</a>
            <a danphe-grid-action="edit" class="grid-action">
                Edit
                </a>
        `;
    }
  }
  static GetPOActions(params) {
    if (params.data.IsPOCreated) {
      return `<a danphe-grid-action="view" class="grid-action">
            View </a>`;
    } else {
      if (params.data.IsActive == true) {
        return `<a danphe-grid-action="view" class="grid-action">
            View </a>
            <a danphe-grid-action="addPO" class="grid-action">
            Add Purchase Order </a>`;
      }
    }
  }

  static GetApptStatus(params) {
    if (params.data.AppointmentStatus == "checkedin") {
      return `
                <p class="text-center" style="color:green;margin:0;font-weight:700;line-height: 20px;">CheckedIn</p>
                `;
    } else if (params.data.AppointmentStatus == "cancelled") {
      return `<p class="text-center" style="margin:0;color:red;font-weight:700;line-height: 20px;">Cancelled</p>`;
    } else {
      return `<p class="text-center" style="margin:0;color:blue;font-weight:700;line-height: 20px;">Initiated</p>`;
    }
  }
  static GetActiveFiscalYear(params) {
    if (
      params.data.showreopen == true &&
      GridColumnSettings.securityService.HasPermission(
        "accounting-fiscal-year-reopen-button-permission"
      )
    ) {
      return `<a danphe-grid-action="edit" class="grid-action"> Re-Open </a>`;
    }
  }
  static GetActiveFiscalYearClosedStatus(params) {
    if (params.data.IsClosed == true) {
      return `<span> Closed </span>`;
    } else {
      return `<span> Open </span>`;
    }
  }
  //makes use of commonfunction to get the formatted value.
  //output format will be: 21 D/F, 3 Y/M, 19 M/M, 24 Y/F, etc..
  static VisitListAgeSexRenderer(params) {
    let dob = params.data.DateOfBirth;
    let gender: string = params.data.Gender;
    return CommonFunctions.GetFormattedAgeSex(dob, gender);
  }

  static AgeSexRenderer(params) {
    let dob = params.data.Patient.DateOfBirth;
    let gender: string = params.data.Patient.Gender;
    return CommonFunctions.GetFormattedAgeSex(dob, gender);
  }

  static AgeSexRendererNurOPD(params) {
    let dob = params.data.DateOfBirth;
    let gender: string = params.data.Gender;
    return CommonFunctions.GetFormattedAgeSex(dob, gender);
  }

  static AgeSexCombineRenderer(params) {
    let age = params.data.Patient.Age;
    let gender = params.data.Patient.Gender;
    if (age && gender) {
      let agesex = age + '/' + gender.charAt(0).toUpperCase();
      return agesex;
    }
    else
      return '';
  }
  static AgeSexAppointmentCombineRenderer(params) {
    let Age = params.data.Age;
    let gender: string = params.data.Gender;
    return Age + " / " + gender[0].toUpperCase();
  }
  static AgeSexRendererPatient(params) {
    let dob = params.data.DateOfBirth;
    let gender: string = params.data.Gender;
    if (dob && gender) {
      return CommonFunctions.GetFormattedAgeSex(dob, gender);
    } else {
      return "";
    }
  }
  static NewAgeSexRendererPatient(params) {
    let age = params.data.Age;
    let gender = params.data.Gender;
    if (age && gender) {
      let agesex = age + '/' + gender.charAt(0).toUpperCase();
      return agesex;
    }
    else
      return '';
  }

  static AgeSexRendererPatientConsumption(params) {
    let age = params.data.Age;
    let gender: string = params.data.Sex;
    if (age && gender) {
      return CommonFunctions.GetFormattedAgeSexForPatientConsumption(age, gender);
    } else {
      return "";
    }
  }

  static VerifyRenderer(params) {
    let verification = params.data.verificationEnabled;
    if (verification) {
      return `<a danphe-grid-action="ViewDetails" class="grid-action">
                  <i class="fa fa-eye"></i>View Details
            </a>
                <a danphe-grid-action="labsticker" class="grid-action"><i class="glyphicon glyphicon-print"></i> Sticker</a>
                <a danphe-grid-action="verify" class="grid-action">Verify</a>
                `;
    } else {
      return `<a danphe-grid-action="ViewDetails" class="grid-action">
                  <i class="fa fa-eye"></i>View Details
            </a>
                <a danphe-grid-action="labsticker" class="grid-action"><i class="glyphicon glyphicon-print"></i> Sticker</a>
                `;
    }
  }
  static PatientTypeRenderer(params) {
    let type = params.data.VisitType;

    if (type) {
      if (type.toLowerCase() == "outpatient") {
        return "OP";
      } else if (type.toLowerCase() == "inpatient") {
        return "IP";
      } else {
        return "ER";
      }
    } else {
      return "OP"; //default is Outpatient
    }
  }

  static BtnByBillStatusRenderer(params) {
    let billingStatus = params.data.BillingStatus;

    if (billingStatus == "cancel") {
      return `<button class="grid-action" style="background-color: #ed6b75 !important;border: 2px solid #ed6b75; width:91px;text-align: center;">Cancelled</button>`;
    } else {
      return `<a danphe-grid-action="ViewDetails" class="grid-action">
                 <i class="fa fa-eye"></i>View Details
             </a>`;
    }
  }

  static CheckStatus(params) {
    let status = params.data.IsPending;

    if (status == true) {
      return (
        "<div  style='width:100%;background-color:yellow;'> " +
        "Pending" +
        "</div>"
      );
    } else {
      return (
        "<div style='width:100%;background-color:lightgreen;'> " +
        "Completed" +
        "</div>"
      );
    }
  }

  static AgeSexRenderer_BillOrders(params) {
    let dob = params.data.Patient.DateOfBirth;
    let gender: string = params.data.Patient.Gender;
    return CommonFunctions.GetFormattedAgeSex(dob, gender);
  }

  static FullNameRenderer(params) {
    return CommonFunctions.GetFullName(
      params.data.FirstName,
      params.data.MiddleName,
      params.data.LastName
    );
  }
  static HandoverFullNameRenderer(params) {
    return CommonFunctions.GetFullName(
      params.data.hFirstName,
      params.data.hMiddleName,
      params.data.hLastName
    );
  }
  static FullNameRendererPatient(params) {
    return CommonFunctions.GetFullName(
      params.data.Patient.FirstName,
      params.data.Patient.MiddleName,
      params.data.Patient.LastName
    );
  }
  //displays date and time in hour:minute
  static CreatedDateTimeRenderer(params) {
    return moment(params.data.CreatedOn).format("YYYY-MM-DD HH:mm");
  }
  //gets serial number of the rendered rows.
  //SerialNo =  RowIndex + 1
  static SerialNumberRenderer(params) {
    let serialNo = params.rowIndex + 1;
    return serialNo;
  }

  static ImagingReportViewActionRenderer(params): string {
    let retValue = '';
    if (GridColumnSettings.ShowAddEditFileButton && params.data.PatientFileId) {
      retValue += '<a danphe-grid-action="view-file" class="grid-action" title="View File" style="cursor:pointer; background-color:#008000 !important; margin-left: 10px;">&nbsp;&nbsp;View File</a>';
    }
    if (GridColumnSettings.ShowAddEditReportButton) {
      retValue += '<a danphe-grid-action="view-report" class="grid-action" title="View Report" style="cursor:pointer; margin-left: 10px;">&nbsp;&nbsp;View Report</a>';
    }
    return retValue;
  }
  static PurchaseOrderNosrenderer(params) {
    let POids = params.data.POIds;
    let string_POIds: string = POids[0];
    for (var i = 1; i < POids.length; i++) {
      string_POIds = string_POIds + "," + POids[i];
    }
    return string_POIds;
  }
  static PurchaseOrderDateOnlyRenderer(params) {
    let date: string = params.data.PoDate;
    return moment(date).format("YYYY-MM-DD");
  }
  //Inventory GR date renderer
  static GRDateTimeRenderer(params) {
    let date: string = params.data.GoodReceiptDate;
    return moment(date).format("YYYY-MM-DD");
  }
  static CreatedOnDateRenderer(params) {
    let date: string = params.data.CreatedOn;
    return moment(date).format("YYYY-MM-DD");
  }
  static RequisitionDateOnlyRenderer(params) {
    let date: string = params.data.RequisitionDate;
    return moment(date).format("YYYY-MM-DD");
  }
  static GetIRDCustomer_PAN(params) {
    return "";
  }

  static GetIRDIsActive(params) {
    return "True";
  }

  static ShowActionForPOList(params) {
    if (params.data.POStatus == "active" || params.data.POStatus == "partial") {
      let template = `</a>
                <a danphe-grid-action="view" class="grid-action">
                View
             </a>

<a  danphe-grid-action="genReceipt" class="grid-action">
                Add Goods Receipt</a>
             `;
      return template;
    } else {
      let template = `<a danphe-grid-action="view" class="grid-action">
                View
             </a> &nbsp;

             <div class="dropdown" style="display:inline-block;">
                            <button class="dropdown-toggle grid-btnCstm" type="button" data-toggle="dropdown">...
                            <span class="caret"></span></button>
                            <ul class="dropdown-menu grid-ddlCstm">
                            <li><a danphe-grid-action="CreateCopy" >Create copy from this PO</a></li>

                            </ul>
                        </div>
             `;
      return template;
    }
  }

  //template return for Department wise requisition list
  static ShowActionForRequisitionList(params) {
    let template = ``;
    if (params.data.CanApproveTransfer == true) {
      template += `<a danphe-grid-action="approveTransfer" class="grid-action animated-btn blinking-btn-warning" title="Approve Dispensary to Dispensary Transfer">
                  Approve Transfer
                  </a>`;
    }
    if (["active", "partial"].includes(params.data.RequisitionStatus) &&
      params.data.canDispatchItem == true && GridColumnSettings.securityService.HasPermission("inv-dispatch-req-button")
    ) {
      template += `<a danphe-grid-action="requisitionDispatch" class="grid-action">
      Dispatch Requisition
      </a>`;
    }
    if (["partial", "complete"].includes(params.data.RequisitionStatus) && GridColumnSettings.securityService.HasPermission("inv-dispatch-list-button")) {
      template += `<a danphe-grid-action="dispatchList" class="grid-action">
                  Dispatch List
                </a>`;
    }
    if (GridColumnSettings.securityService.HasPermission("inv-requisition-view-button")) {
      template += `<a danphe-grid-action="view" class="grid-action">
      Requisition View
                  </a>`;
    }

    return template;
  }

  //moved to adt-grid-column-settings inside adt module.:sud- 10Jan'19
  ////adds action buttons dynamically based on some rules.
  //static DischargeListActionRenderer(params) {
  //    let currDischarge = params.data;
  //    let templateHtml: string;
  //    //by default: ViewSummary action will be there
  //    if (currDischarge.IsSubmitted) {
  //        templateHtml = `<a danphe-grid-action="dischargeSummary" class="grid-action">
  //                        View Summary</a>`;
  //    }
  //    else {
  //        templateHtml = `<a danphe-grid-action="dischargeSummary" class="grid-action">
  //                        Add Summary</a>`;
  //    }
  //    //Show clearDue.
  //    if (currDischarge.BillStatusOnDischarge == "unpaid") {
  //        templateHtml += `<a danphe-grid-action="clear-due" class="grid-action">
  //                         Clear Due</a>`;
  //    }
  //    return templateHtml;
  //}

  //adds action buttons dynamically based on some rules.
  static VisitActionsRenderer(params) {
    let currVisit = params.data;
    let todaysdate = moment().format("YYYY-MM-DD");
    let visitdate = moment(currVisit.VisitDate).format("YYYY-MM-DD");
    //by default: print sticker wil be there in the action.
    let templateHtml = "";

    if (currVisit.VisitType != "emergency") {
      //Show transfer/referr button only for today's visits and followup for past visits.

      //Ashim: 6thJune'18
      //Req Changed: Only Today's visit can be transfered/referred to another doctor.
      //Transfer/Referr option is not available from previous doctor.
      const maxInternalReferralDays = +currVisit.MaxInternalReferralDays;
      const dateDiff = moment(todaysdate).diff(visitdate, 'days');
      if (dateDiff <= maxInternalReferralDays && !currVisit.IsFreeVisit) {
        //Sud:3May'21--Hiding Transfer Action from List Visit, after Credit Note is introduced in Billing.
        // //Transfer Option not required for Followup Visits.: Sud-26June'19:[EMR-450]
        // if (currVisit.AppointmentType != "followup") {
        //   templateHtml += `<a danphe-grid-action="transfer" class="grid-action">
        //                        transfer </a>`;
        // }

        templateHtml += `<a danphe-grid-action="referral" class="grid-action">
                               refer </a>`;
      }
      //show followup button only for past visits.
      //else {
      if ((moment(todaysdate).diff(visitdate) > 0) && !currVisit.IsFreeVisit) {
        //Ashim:31stOct2017- Commented the below condition as the requirement was changed.
        //New Req: Followup should be available to all the transfered/referred doctors.
        //if (!currVisit.IsVisitContinued)
        templateHtml += `<a danphe-grid-action="followup" class="grid-action">
                                followup </a>`;
      }
    }
    templateHtml += `<a danphe-grid-action="printsticker" class="grid-action" title="Print OPD-Sticker">
                                 <i class="glyphicon glyphicon-print" ></i>&nbsp;sticker </a>`;

    //sud:1June'19-commented below for MNK. un-comment it if needed for some other hospital.
    //templateHtml += `<a danphe-grid-action="generic-sticker" title="Generic Sticker" class="grid-action">
    //                     <i class="glyphicon glyphicon-print"></i>&nbsp;Generic Sticker</a>`;

    return templateHtml;
  }

  static PreviewPatientRenderer() {
    let templateHtml = `<a danphe-grid-action="preview" class="d-icon icon-user" title="Preview" style="display: inherit;"></a>`;
    return templateHtml;
  }
  static FavoritePatientRenderer(params) {
    let currPatient = params.data;
    //by default: print sticker wil be there in the action.
    let templateHtml = `<a danphe-grid-action="preview" class="d-icon icon-user" title="Preview" style="display: inherit; float:left;"></a>
             <a danphe-grid-action="notes" class="d-icon icon-note hidden" title="Notes""></a>
             <a danphe-grid-action="medication" class="d-icon icon-medication hidden" title="Medication""></a>
             <a danphe-grid-action="labs" class="d-icon icon-lab hidden" title="Labs""></a>
             <a danphe-grid-action="imaging" class="d-icon icon-imaging hidden" title="Imaging"></a>`;
    if (currPatient.VisitType === ENUM_VisitType.inpatient) {
      if (currPatient.DischargeSummaryId > 0) {
        templateHtml += '<a danphe-grid-action="viewDischargeSummary" class="grid-action" title="View DischargeSummary">View Summary</a>';
      }
      else {
        templateHtml += '<a danphe-grid-action="addDischargeSummary"  class="grid-action" title="Add DischargeSummary">Add Summary</a>';
      }
    }
    if (currPatient.IsFollowUp) {
      templateHtml +=
        '<a danphe-grid-action="removefollowup" class=" d-icon fa fa-file-text" style="font-size:15px;position:relative;top:-5px; margin-left:10px; margin-right:10px;;" title="remove follow up""></a>';
    } else {
      templateHtml +=
        '<a danphe-grid-action="addfollowup" class="d-icon fa fa-file-text-o" style="font-size:15px;position:relative;top:-5px; margin-left:10px; margin-right:10px;" title="add follow up""></a>';
    }

    if (currPatient.IsFavorite) {
      templateHtml +=
        '<a danphe-grid-action="removefavorite" class="fa fa-heart" style="font-size:17px;position:relative;top:-3px" title="remove favorite""></a>';
    } else {
      templateHtml +=
        '<a danphe-grid-action="addfavorite" class="fa fa-heart-o" style="font-size:17px;position:relative;top:-3px" title="add favorite""></a>';
    }

    return templateHtml;
  }

  //     templateHtml += ` <div class="dropdown" style="display:inline-block;">
  //     <button class="dropdown-toggle grid-btnCstm" style="background-color: #3598dc;" type="button" data-toggle="dropdown">...
  //     <span class="caret"></span></button>
  //     <ul class="dropdown-menu grid-ddlCstm">
  //           <li><a danphe-grid-action="generic-sticker" title="Generic Sticker">
  //            <i class="glyphicon glyphicon-print"></i>&nbsp;Patient Generic Sticker</a></li>
  //       </ul>
  //   </div>`;

  //need to display it such that office hours will apear as tool-tip.--pending--sud:16Aug
  static EmpOfficeHrsRenderer(params) {
    let officeHrs = params.data.OfficeHour;
    //by default: ViewSummary action will be there
    let templateHtml = `<div>` + officeHrs + `</div>`;
    return templateHtml;
  }

  static TrueFalseViewer(params) {
    if (params.data.IsOccupied == true) {
      let template = `
                    <span style="background-color:#F44336">&nbsp;&nbsp;&nbsp; True &nbsp;&nbsp;&nbsp;</span>
                `;
      return template;
    } else {
      let template = `
                    <span style="background-color:#4CAF50">&nbsp;&nbsp;&nbsp; False&nbsp;&nbsp;&nbsp;</span>
                `;
      return template;
    }
  }
  //ashim: 07Sep2018 : SampleCode Formatting Logic moved to server side
  //concatenate samplecode for pending lab results GRID eg: 171214-1
  //static ConcatenateSampleCode(params) {
  //    return CommonFunctions.ConcatenateSampleCode(params.data.SampleDate, params.data.SampleCode);
  //}

  //used in nursing Inpatient List
  static BedDetailRenderer(params) {
    return (
      params.data.BedInformation.BedFeature +
      "/" +
      params.data.BedInformation.BedCode
    );
  }

  static DateRenderer(value, dateFormat) {
    let currDate = moment().format(dateFormat);
    let diff = moment(currDate)
      .diff(moment(value).format(dateFormat), "days")
      .toString();

    if (parseInt(diff) == 0) {
      return "today";
    } else if (parseInt(diff) == 1) {
      return "yesterday";
    } else {
      return moment(value).format(dateFormat);
    }
  }

  //static ShowActionforADTPatientSearch(params) {
  //    if (params.data.IsAdmitted == true) {
  //        let template =
  //            `
  //            <label style="font-weight: bold;border: 2px solid red;background-color:red;color: white;padding:0px 4px;margin-left: 4px;">Admitted</label>

  //            `
  //        return template
  //    }
  //    else {
  //        let template =
  //            `<a danphe-grid-action="admit" class="grid-action">Admit</a>`
  //        return template;
  //    }
  //}

  static AccTxnDateRenderder(params) {
    if (params.data.TransactionDate)
      return moment(params.data.TransactionDate).format("YYYY-MM-DD");
    else return "";
  }
  static LeadingZeroVoucherNumber(params) {
    if (params.data.VoucherNumber)
      return ("00000" + params.data.VoucherNumber).slice(-6);
    else return "";
  }
  static AccDrCrAmountRenderer(params) {
    let str = "";
    if (params.data.DrCr)
      str = params.data.Amount + ' <b style="color:red">(Dr)</b>';
    else str = params.data.Amount + ' <b style="color:green">(Cr)</b>';
    return str;
  }

  static AccDailyTxnActionTemplate(params) {
    let template = "";
    if (params.data.showOptions) {
      if (params.data.SectionId != 4) {
        template = `<a danphe-grid-action="viewDetails" class="grid-action"> <i class="fa fa-eye"></i>View Details</a>`;
      }
    }
    return template;
  }

  static DiscountAmountRenderer(params) {
    let amt = "";
    if (params.data.DiscountAmount > 0) {
      amt = CommonFunctions.parseAmount(params.data.DiscountAmount);
    }
    return amt;
  }
  static AccDrAmountRenderder(params) {
    let amt = "";
    if (params.data.DrAmount > 0) {
      amt = CommonFunctions.parseAmount(params.data.DrAmount);
    }
    return amt;
  }
  static AccCrAmountRenderder(params) {
    let amt = "";
    if (params.data.CrAmount > 0) {
      amt = CommonFunctions.parseAmount(params.data.CrAmount);
    }
    return amt;
  }
  static AccAmountRenderder(params) {
    let amt = "";
    if (params.data.Amount > 0) {
      amt = CommonFunctions.parseAmount(params.data.Amount);
    }
    return amt;
  }

  static ThresholdMargin(params) {
    let thresholdmargin = params.data.MinQuantity;
    let availablequantity = params.data.AvailQuantity;
    if (availablequantity == 0) {
      return (
        "<div style='width:50%;background-color:red;'>" +
        availablequantity +
        "</div>"
      );
    } else if (availablequantity <= thresholdmargin) {
      return (
        "<div style='width:50%;background-color:#f36a5a61;'>" +
        availablequantity +
        "</div>"
      );
    } else {
      return "<div style='width:50%'>" + availablequantity + "</div>";
    }
  }

  static LeaveEquestDateOnlyRenderer(params) {
    let date: string = params.data.RequestedLeaveDate;
    return moment(date).format("YYYY-MM-DD");
  }
  static ApprovedDateOnlyRenderer(params) {
    let date: string = params.data.ApprovedDate;
    return moment(date).format("YYYY-MM-DD");
  }
  static CancelledDateOnlyRenderer(params) {
    let date: string = params.data.CancelledDate;
    return moment(date).format("YYYY-MM-DD");
  }

  //this formatter will useful for all report data
  //it's check is it number or not if number then it format with 2 decimal point value and send back
  //if values like 453.659865 , here after decimal we have 6 digit . it's not good for end user so this formatter will send
  // back 453.65 value
  static decimalValueFormatter(params) {
    let checkIsNum = isNaN(params.value);
    if (checkIsNum) {
      return params.value;
    } else {
      return CommonFunctions.parseAmount(params.value);
    }
  }

  static ItemSummaryReportGridCol = [
    {
      headerName: "Service Department",
      field: "ServiceDepartmentName",
      width: 150,
    },
    { headerName: "Item name ", field: "ItemName", width: 150 },
    { headerName: "Total Quantity", field: "TotalQty", width: 60 },
    { headerName: "Sub Total", field: "SubTotal", width: 85 },
    { headerName: "Discount Amount", field: "DiscountAmount", width: 60 },
    { headerName: "Total Amount", field: "TotalAmount", width: 85 },
  ];

  static IPBillItemRenderer_CreatedBy(params) {
    if (params.data) {
      let CreatedDocObj = params.data.CreatedByObj;
      if (CreatedDocObj) {
        return (
          `<span  title='` +
          CreatedDocObj.FullName +
          `
Department:` +
          CreatedDocObj.DepartmentName +
          `'>` +
          CreatedDocObj.FirstName +
          `</span>`
        );
      }
    }
  }

  static IPBillItemRenderer_ModifiedBy(params) {
    if (params.data) {
      let ModifiedDocObj = params.data.ModifiedByObj;
      if (ModifiedDocObj) {
        return (
          `<span style="background-color:yellow;"  title='` +
          ModifiedDocObj.FullName +
          `
Department:` +
          ModifiedDocObj.DepartmentName +
          `'>` +
          ModifiedDocObj.FirstName +
          `</span>`
        );
      }
    }
  }

  static InvoiceHeaderList = [
    { headerName: "Hospital Name", field: "HospitalName" },
    { headerName: "Address", field: "Address" },
    { headerName: "Telephone", field: "Telephone" },
    { headerName: "Email", field: "Email" },
    { headerName: "PAN", field: "PAN" },
    { headerName: "DDA", field: "DDA" },
    { headerName: "Header Description", field: "HeaderDescription" },
    {
      headerName: "Created Date",
      field: "CreatedOn",
      cellRenderer: GridColumnSettings.DateTimeRenderer,
    },
    { headerName: "Is Active", field: "IsActive" },
    {
      headerName: "Action",
      field: "",

      width: 200,
      template: `<a danphe-grid-action="view-logo" class="grid-action">
                  View Logo
               </a>
                  <a danphe-grid-action="edit" class="grid-action">
                  Edit
                </a>

              `,
    },
  ];

  static SSU_PatientSearch = [
    { headerName: "Hospital Number", field: "PatientCode", width: 160 },
    { headerName: "Patient Name", field: "ShortName", width: 200 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient,
    },
    { headerName: "Address", field: "Address", width: 110 },
    { headerName: "Phone", field: "PhoneNumber", width: 110 },
    {
      headerName: "Actions",
      field: "",
      resizable: true,
      cellRenderer: GridColumnSettings.PatientListActionTemplate,
    },
  ];

  static PatientListActionTemplate(params) {
    if (!params.data.IsActive) {
      let template = "";
      template += `<a danphe-grid-action="edit" class="grid-action">
               Edit
            </a>`;

      template += `<a danphe-grid-action="activateDeactivatePatient" class="grid-action"  style="background-color: #afb8af;color: black;">
              Activate
             </a>`;
      return template;
    } else {
      let template = "";
      template += `<a danphe-grid-action="edit" class="grid-action">
               Edit
            </a>`;
      template += `<a danphe-grid-action="activateDeactivatePatient" class="grid-action"  style="background-color: orange;color: black;">
             Deactivate
           </a>`;
      return template;
    }
  }

  static AssetsFixedStockList = [
    // { headerName: "S.N", field: "SN", cellRenderer: GridColumnSettings.SerialNumberRenderer,4072 width: 95 },
    // { headerName: "Item Code", field: "ItemCode" },
    { headerName: "Bar Code", field: "BarCodeNumber" },
    { headerName: "Asset Code", field: "AssetCode" },
    { headerName: "Item Name", field: "ItemName" },
    { headerName: "Total life In Year", field: "TotalLife" },
    { headerName: "Year Of Use", field: "YearOfUse" },
    {
      headerName: "Remaining Life",
      field: "",
      cellRenderer: GridColumnSettings.AssetRemainingLife,
    },
    { headerName: "Performance", field: "Performance" },
    {
      headerName: "Manufacture Date",
      field: "ManufactureDate",
      cellRenderer: GridColumnSettings.ManufactureDate,
    },
    {
      headerName: "Warranty",
      field: "WarrantyExpiryDate",
      cellRenderer: GridColumnSettings.WarrantyExpiryDateAsstestMaintence,
    },
    {
      headerName: "Remaining Days For Service",
      field: "RemainingDaysForService",
      cellRenderer: GridColumnSettings.RemainingDaysForServiceRenderer,
    },
    {
      headerName: "Action",
      width: 340,
      field: "",
      cellRenderer: GridColumnSettings.FixedAssetMaintenanceCellRenderer,
      //     template: `<a danphe-grid-action="edit" class="grid-action">
      //    Edit
      //  </a>
      //  <a danphe-grid-action="contract" class="grid-action">
      //               View Contract
      //              </a>
      //  <a danphe-grid-action="checkilst-view" class="grid-action">
      //  Checkilst View
      //  </a>
      //  <a danphe-grid-action="maintenance-view" class="grid-action">
      //  Maintenance View
      //  </a> `
    },
  ];

  static FixedAssetMaintenanceCellRenderer(params) {
    var action = `
    <a danphe-grid-action="edit" class="grid-action-icon fa fa-edit" title = "Edit"></a>
    <a danphe-grid-action="service" class="grid-action-icon fa fa-cogs" title ="Service History"> </a>
    <a danphe-grid-action="contract" class="grid-action-icon fa fa-file-text" title ="Contract Details"> </a>
    <a danphe-grid-action="checkilst-view" class="grid-action-icon fa fa-tasks" title ="Environment Condition Checkilst"></a>
    <a danphe-grid-action="vendor-details" class="grid-action-icon fa fa-book" title ="Vendor Contact Details"> </a>
    `;
    if (params.data.Performance == "Not Working") {
      return `${action}<a danphe-grid-action="fault-update" class="grid-action-icon fa fa-exclamation-circle" title ="Fault History"></a> `;
    } else {
      return action;
    }
  }

  static AssetDepreciationColumns = [
    // { headerName: "S.N", field: "SN", cellRenderer: GridColumnSettings.SerialNumberRenderer, width:95},
    { headerName: "Item Code", field: "ItemCode" },
    { headerName: "Bar Code", field: "BarCodeNumber" },
    { headerName: "Asset Code", field: "AssetCode" },
    { headerName: "Item Name", field: "ItemName" },
    // { headerName: "Depreciation Method", field: "DepreciationMethod" },
    // { headerName: "Rate", field: "Rate" },
    // // { headerName: "Started Date", field: "" }, // , cellRenderer: GridColumnSettings.DepreciationStartDateRenderer
    // { headerName: "Fiscal Year", field: "" },
    // { headerName: "Depreciation Amount", field: "DepreciationAmount" },
    // { headerName: "Expected Value After Useful Life", field: "" }, //ExpectedValueAfterUsefulLife
    {
      headerName: "Action",
      field: "",
      cellRenderer: GridColumnSettings.DepreciationActionRenderer,
      //  `<a danphe-grid-action="view" class="grid-action"> View </a>  `
    },
  ];

  static DepreciationActionRenderer(params) {
    var action = `<a danphe-grid-action="view-deprn" class="grid-action">
      View Depreciation
      </a>
    `;
    if (params.data.IsAssetScraped == false) {
      action = `${action}
                <a danphe-grid-action="scrap-asset" class="grid-action" style="background-color: #696969!important;">
                Scrap Asset
                </a>
              `;
    } else {
      action = `${action}
                <a danphe-grid-action="scrap-asset" class="grid-action" style="background-color: #FF8C00!important;">
                Undo Asset Scrap
                </a>
              `;
    }
    return action;
  }

  AssestGRlist = [
    { headerName: "Bar Code", field: "BarCodeNumber" },
    {
      headerName: "",
      field: "",
      width: 80,
      cellRenderer: GridColumnSettings.ColdStorageIconRenderer,
    },
    { headerName: "Item Name", field: "ItemName" },
    { headerName: "Vendor Name", field: "VendorName" },
    { headerName: "Specification", field: "StockSpecification" },
    { headerName: "Model No", field: "ModelNo" },
    {
      headerName: "Asset Location",
      field: "AssetsLocation",
      cellRenderer: GridColumnSettings.LocationHistory,
    },
    { headerName: "SubStore", field: "SubStoreName" },
    { headerName: "Asset Holder", field: "AssetHolderName" },
    {
      headerName: "Action",
      field: "",
      width: 380,
      cellRenderer: GridColumnSettings.FixedAssetCellRenderer,
    },
  ];

  static FixedAssetCellRenderer(params) {
    var asset = params.data;
    let template = `<a danphe-grid-action="print-barcode" class="grid-action-icon fixed-asset-action fa fa-barcode" title="Print Barcode"></a>`;
    if (
      GridColumnSettings.securityService.HasPermission(
        "fixed-asset-management-edit-button"
      )
    )
      template += ` <a danphe-grid-action="edit" class="grid-action-icon fixed-asset-action fa fa-edit" title="Edit"></a>`;
    if (
      GridColumnSettings.securityService.HasPermission(
        "fixed-asset-insurance-button"
      )
    )
      template += `<a danphe-grid-action="insurance-view" class="grid-action-icon fixed-asset-action fa fa-heartbeat" title="Insurance Details"></a>`;

    // var action: string = `
    //         <a danphe-grid-action="edit" class="grid-action-icon fa fa-edit" title="Edit"></a>
    //         <a danphe-grid-action="insurance-view" class="grid-action-icon fa fa-heartbeat" title="Insurance Details"></a>
    //         <a danphe-grid-action="print-barcode" class="grid-action-icon fa fa-barcode" title="Print Barcode"></a>
    //         `;

    if (
      asset.IsMaintenanceRequired &&
      GridColumnSettings.securityService.HasPermission(
        "fixed-asset-send-to-maintaineance-button"
      )
    ) {
      // template = `
      // <a danphe-grid-action="remove-from-maintenance" class="fa fa-wrench" title="Remove from Maintenance Secition" aria-hidden="true" style="color: Black!important; font-size: 18px;"></a>
      // ` + template;
      // <a danphe-grid-action="remove-from-maintenance" class="grid-action" style="background-color:White!important;">
      // </a>
    } else {
      template =
        `
      <a danphe-grid-action="send-to-maintenance" class="fa fa-wrench" title="Send to Maintenance Secition" aria-hidden="true" style="color: #0773bc!important; font-size: 18px;"></a>
      ` + template;
      // <a  class="grid-action" style="background-color:White!important;"></a>
    }
    if (asset.IsAssetDamaged == true && asset.IsAssetDamageConfirmed == false) {
      template = ` ${template}
                <a danphe-grid-action="confirm-damage" class="grid-action-icon fa fa-check-circle" title="Confirm Damage" style="background-color: #42ba96 !important;"></a>
                <a danphe-grid-action="undo-damage" class="grid-action-icon fa fa-times" title="Undo Damage" style="background-color: #FF8C00!important;"></a>
             `;
    }

    return template;
  }

  static GRSList = [
    { headerName: "GR No.", field: "GoodsReceiptNo", width: 50 },
    { headerName: "GR Date", field: "GoodsReceiptDate", width: 60 },
    { headerName: "PO No.", field: "PurchaseOrderId", width: 40 },
    { headerName: "Vendor Bill Date", field: "VendorBillDate", width: 60 },
    { headerName: "Vendor Name", field: "VendorName", width: 150 },
    { headerName: "Vendor Contact", field: "ContactNo", width: 60 },
    { headerName: "Bill No.", field: "BillNo", width: 80 },
    { headerName: "Total Amount", field: "TotalAmount", width: 90 },
    { headerName: "Pay. Mode", field: "PaymentMode", width: 60 }, //sud:4May'20--needed this to distinguish between cash and credit in frontend.
    { headerName: "Remarks", field: "ReceivedRemarks", width: 100 },
    {
      headerName: "Action",
      field: "",
      width: 80,
      cellRenderer: GridColumnSettings.ShowActionForGoodsReceiptList,
      //template: '<a danphe-grid-action="view" class="grid-action">View</a>',
    },
  ];
  static FixedAssetRequestList = [
    { headerName: "Req.No", field: "RequisitionNo", width: 45 },
    { headerName: "StoreName", field: "StoreName", width: 80 },
    { headerName: "Sub-StoreName", field: "SubStoreName", width: 80 },
    {
      headerName: "Request Date",
      field: "RequisitionDate",
      width: 80,
      cellRenderer: GridColumnSettings.RequisitionDateOnlyRenderer,
    },
    { headerName: "Request By", field: "EmpFullName", width: 100 },
    { headerName: "Status", field: "RequisitionStatus", width: 80 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      cellRenderer: GridColumnSettings.ShowActionRequisitionList,
      // template:
      //   `<a danphe-grid-action="view" class="grid-action">
      //   View
      // </a>
      // <a danphe-grid-action="dispatch" class="grid-action">
      //   Dispatch
      // </a>
      // <a danphe-grid-action="dispatchList" class="grid-action"> Dispatch List</a>
      // `
    },
  ];
  static ShowActionRequisitionList(params) {
    let template = `<a danphe-grid-action="view" class="grid-action">
    View
  </a>
  `;
    if (["active", "partial"].includes(params.data.RequisitionStatus)) {
      template += ` <a danphe-grid-action="dispatch"
        class="grid-action">
         Dispatch
        </a>
        <a danphe-grid-action="dispatchList" class="grid-action">
          Dispatch List
        </a>`;
    }
    return template;
  }
  static GRSDateTimeRenderer(params) {
    let date: string = params.data.GoodReceiptDate;
    return moment(date).format("YYYY-MM-DD");
  }

  static StockCreatedOnDateRenderer(params) {
    let date: string = params.data.CreatedOn;
    return moment(date).format("YYYY-MM-DD");
  }

  static ShowActionForGoodsReceiptList(params) {
    let template = `
        <a danphe-grid-action="view" title="View"
        class="grid-action ${params.data.GRStatus == "verified" && !params.data.IsReceived
        ? "animated-btn blinking-btn-warning grid-action"
        : ""
      }">
        ${params.data.GRStatus == "verified" && !params.data.IsReceived ? "(Receive)" : ""} View
        </a>`;
    if (params.data.canGRDispatch && params.data.ReceivedRemarks != null && params.data.IsQuantityAvailableToDispatchFromGR) {
      template += `<a danphe-grid-action="gr-dispatch" class="grid-action">GR Dispatch</a>`;
    }
    return template;
  }

  static AssetRemainingLife(params) {
    if (params.data.TotalLife && params.data.YearOfUse) {
      return params.data.TotalLife - params.data.YearOfUse;
    }
    return "";
  }

  static ManufactureDate(params) {
    if (params.data.ManufactureDate == null) {
      return "No Date";
    } else {
      let date: string = params.data.ManufactureDate;
      return moment(date).format("YYYY-MM-DD");
    }
  }

  static WarrantyExpiryDateAsstestMaintence(params) {
    let date: string = params.data.WarrantyExpiryDate;
    return moment(date).format("YYYY-MM-DD");
  }

  static InstallationOfDate(params) {
    let date: string = params.data.InstallationOfDate;
    return moment(date).format("YYYY-MM-DD");
  }
  static LocationHistory(params) {
    if (params.data.AssetsLocation == null) {
      return "No Location";
    } else {
      return params.data.AssetsLocation;
    }
  }

  static WarrantyExpiryDate(params) {
    if (params.data.WarrantyExpiryDate) {
      let expiryDate: any = new Date(params.data.WarrantyExpiryDate);
      let date: any = new Date();
      let datenow = date.setHours(0, 0, 0, 0);
      let datePlusThreeMonth = date.setMonth(date.getMonth() + 3);

      let stringExpiry: string = params.data.WarrantyExpiryDate;
      let formattedWExpiry = moment(stringExpiry).format("YYYY-MM-DD");
      // return expiryDate;

      if (expiryDate < datenow) {
        // if warraty expiry is less than today then asset is expired color will be red
        return `<span style="background-color:#FA8072;"> ${formattedWExpiry}</span>`;
      }
      // if warraty expiry is less than 3 months then asset is near expired and color will be yellow
      else if (expiryDate >= datenow && expiryDate <= datePlusThreeMonth) {
        return `<span style="background-color:yellow;"> ${formattedWExpiry} </span>`;
      }
      // if warraty expiry is more than 3 months then color will be white
      else if (expiryDate > datePlusThreeMonth) {
        return `<span style="background-color:white;"> ${formattedWExpiry} </span>`;
      } else {
        return "";
      }
    }
    return "";
  }

  static RemainingDaysForServiceRenderer(params) {
    let template: string;
    let periodicServiceDays: any = params.data.PeriodicServiceDays; // periodic service with this certain period (days)
    let installationDate: any;

    let CommingServiceDate: any;
    let LastServiceDate: any;
    let RemainingDaysForService: any;
    let today: any = new Date().setHours(0, 0, 0, 0);

    if (params.data.InstallationDate) {
      installationDate = new Date(params.data.InstallationDate);
    } else {
      installationDate = null;
    }
    if (params.data.ServiceDate) {
      LastServiceDate = new Date(params.data.ServiceDate);
    } else {
      LastServiceDate = null;
    }

    if (periodicServiceDays) {
      if (LastServiceDate) {
        //case: when service has been done earlier

        CommingServiceDate = LastServiceDate.setDate(
          LastServiceDate.getDate() + periodicServiceDays
        );
      } else if (installationDate) {
        // case: when no any service been done till date
        // refer Installation date for calcuating comming service date
        CommingServiceDate = installationDate.setDate(
          installationDate.getDate() + periodicServiceDays
        );
      }

      if (CommingServiceDate) {
        let diffTime = Math.abs(CommingServiceDate - today); // we get difference of two dates
        RemainingDaysForService = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // converting difference in Days
        if (today > CommingServiceDate) {
          // knowing, if difference day is negative or positive
          RemainingDaysForService = RemainingDaysForService * -1;
        }
      }
    }

    if (RemainingDaysForService) {
      if (RemainingDaysForService < 31 && RemainingDaysForService > 0) {
        template = `<span style="background-color:yellow;"> ${RemainingDaysForService}</span>`;
      } else if (RemainingDaysForService < 0) {
        template = `<span style="background-color:#FA8072;"> ${RemainingDaysForService}</span>`;
      } else if (RemainingDaysForService > 31) {
        template = RemainingDaysForService;
      }
    }

    return template;
  }
  static ReqDispatchList = [
    { headerName: "Dispatch Id", field: "DispatchId", width: 50 },
    { headerName: "Requisition No", field: "RequisitionId", width: 150 },
    { headerName: "Store Name", field: "StoreName", width: 150 },
    { headerName: "SubStore Name", field: "SubStoreName", width: 150 },
    {
      headerName: "Dispatch Date",
      field: "Dispatchdate",
      width: 150,
      cellRenderer: GridColumnSettings.DispatchDateRender,
    },
    { headerName: "Received By", field: "ReceivedBy", width: 100 },
    { headerName: "Dispatched By", field: "DispatcheBy", width: 150 },

    {
      headerName: "Action",
      field: "",
      width: 120,
      template: `<a danphe-grid-action="view" class="grid-action">
               View
             </a>`,
    },
  ];
  static VendorList = [
    { headerName: "GR Date", field: "GRDate", width: 150, cellRenderer: GridColumnSettings.PaymentDateRender },
    { headerName: "GR Number", field: "GRNo", width: 150 },
    { headerName: "Vendor Name", field: "VendorName", width: 200 },
    { headerName: "Total Amount", field: "TotalAmount", width: 150 },
    { headerName: "Paid Amount", field: "PaidAmount", width: 150 },
    { headerName: "Due Amount", field: "DueAmount", width: 150 },
    {
      headerName: "Action",
      field: "",
      width: 150,
      template: "<a danphe-grid-action='view' class='grid-action'> <i class='fa fa-credit-card'></i> Payment</a>"
    },
  ];
  static SupplierList = [
    { headerName: "GR Date", field: "GRDate", width: 150, cellRenderer: GridColumnSettings.PaymentDateRender },
    { headerName: "Invoice Number", field: "InvoiceNo", width: 150 },
    { headerName: "Supplier Name", field: "SupplierName", width: 200 },
    { headerName: "Total Amount", field: "TotalAmount", width: 150 },
    { headerName: "Paid Amount", field: "PaidAmount", width: 150 },
    { headerName: "Due Amount", field: "DueAmount", width: 150 },
    {
      headerName: "Action",
      field: "",
      width: 150,
      template: "<a danphe-grid-action='view' class='grid-action'> <i class='fa fa-credit-card'></i> Payment</a>"
    },
  ];
  static PaymentDateRender(params) {
    let paymentDate: string = params.data.GRDate;
    if (paymentDate) return moment(paymentDate).format("YYYY-MM-DD");
    else return null;
  }
  public static ManageShowOrHideChequeNo(params) {
    if (params.data.ShowChequeNumber == true) {
      let template = `
            <a danphe-grid-action="showorhideChequeNo" class="grid-action">Hide</a>
            `;
      return template;
    } else {
      let template = `
            <a danphe-grid-action="showorhideChequeNo" class="grid-action">Show</a>
            `;
      return template;
    }
  }
  public static ManageShowOrHidePayeeName(params) {
    if (params.data.ShowPayeeName == true) {
      let template = `
            <a danphe-grid-action="showorhidePayeeNameBasedOnStatus" class="grid-action">Hide</a>
            `;
      return template;
    } else {
      let template = `
            <a danphe-grid-action="showorhidePayeeNameBasedOnStatus" class="grid-action">Show</a>
            `;
      return template;
    }
  }

  static OnlineAppointmentList = [
    { headerName: "Status", field: "Status", width: 100 },
    { headerName: "Appointment Date", field: "VisitDate", width: 110, cellRenderer: GridColumnSettings.VisitDateTimeRenderer },
    { headerName: "Patient Name", field: "PatientName", width: 110 },
    { headerName: "Age/Gender", width: 100, cellRenderer: GridColumnSettings.OnlineApptAgeGender },
    { headerName: "Phone Number", field: "ContactNumber", width: 80 },
    { headerName: "Address", field: "Address", width: 110 },
    { headerName: "Department", field: "DepartmentName", width: 100 },
    { headerName: "Doctor", field: "DoctorName", width: 100 },
    { headerName: "Payment Status", field: "PaymentStatus", width: 100 },
    { headerName: "Payment Method", field: "PaymentMethod", width: 100 },
    {
      headerName: "Actions",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.OnlineApptPendingAction
    }
  ];

  public static OnlineApptAgeGender(param) {
    let dateString = param.data.DateOfBirth;
    let gender = param.data.Gender;
    return CommonFunctions.GetFormattedAgeSex(dateString, gender);
  }

  public static OnlineApptPendingAction(param) {
    let template = '';
    if (param.data.Status == "initiated") {
      template += "<a danphe-grid-action='checkin' class='grid-action'> <i class='fa-solid fa-circle-check'></i>Check In</a>";
    }
    return template;
  }

  public static VisitDateTimeRenderer(param) {
    return moment(param.data.VisitDate).format("YYYY-MM-DD HH:mm");
  }

  static DoctorOPNewPatientList = [
    { headerName: "Hospital No.", width: 100, field: "Patient.PatientCode" },
    { headerName: "Name", field: "Patient.ShortName", width: 200 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.AgeSexRenderer,
    },
    { headerName: "VisitType", field: "VisitType", width: 100 },
    {
      headerName: "Admitted On",
      width: 150,
      field: "",
      cellRenderer: GridColumnSettings.DoctorAppointmentDateRenderer,
    },
    { headerName: "Performer Name", field: "PerformerName", width: 150 },
    {
      headerName: "Actions",
      field: "",
      width: 170,
      cellRenderer: GridColumnSettings.OPDPatientActionRenderer,

    },
  ];
  static OPFollowUpPatientList = [
    { headerName: "OPD No.", width: 100, field: "Patient.PatientCode" },
    { headerName: "Name", field: "Patient.ShortName", width: 200 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.AgeSexRenderer,
    },
    { headerName: "VisitType", field: "VisitType", width: 100 },
    {
      headerName: "Visit Date",
      width: 120,
      field: "",
      cellRenderer: GridColumnSettings.DoctorAppointmentDateRenderer,
    },
    // { headerName: "Department Name", field: " ", width: 100 },
    { headerName: "Perfromer Name", field: "PerformerName", width: 150 },
    {
      headerName: "Actions",
      field: "",
      width: 200,
      cellRenderer: GridColumnSettings.OPFollowUpActionRenderer,

    },
  ];

  static OPFavoritePatientList = [
    { headerName: "Hospital No.", width: 100, field: "Patient.PatientCode" },
    { headerName: "Name", field: "Patient.ShortName", width: 200 },
    {
      headerName: "Age/Sex",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.AgeSexRenderer,
    },
    { headerName: "VisitType", field: "VisitType", width: 150 },
    {
      headerName: "Visit Date",
      width: 120,
      field: "",
      cellRenderer: GridColumnSettings.DoctorAppointmentDateRenderer,
    },
    // { headerName: "Department Name", field: "DepartmentName", width: 100 },
    { headerName: "Performer Name", field: "PerformerName", width: 130 },
    {
      headerName: "Actions",
      field: "",
      width: 170,
      cellRenderer: GridColumnSettings.OPFavoriteActionRenderer,

    },
  ];

  static ReturnFromSubstore = [
    { headerName: "Returned Date", field: "CreatedOn", width: 150 },
    { headerName: "Returned By", field: "EmployeeName", width: 150 },
    { headerName: "Substore From", field: "SourceStore", width: 200 },
    { headerName: "Status", field: "Status", width: 150 },
    { headerName: "Received By", field: "ReceivedByName", width: 150 },
    { headerName: "Received Date", field: "ReceivedOn", width: 150 },
    { headerName: "Remarks", field: "ReceivedRemarks", width: 150 },
    {
      headerName: "Action",
      field: "",
      width: 300,
      cellRenderer: GridColumnSettings.returnFromSubstore

    },
  ];
  static returnFromSubstore(params) {

    if (params.data.Status == "Pending") {
      let template = `
        <a danphe-grid-action="Receive" title="Receive Dispatched Items"
        class="grid-action ${(params.data.Status == "Pending") ? "animated-btn blinking-btn-warning grid-action" : ""}">
          Receive Items
        </a>`;
      return template;
    }
    // else if (params.data.Status == "Received") {
    else {
      let template =
        `<a danphe-grid-action="view" class="grid-action">
        View
      </a>`;
      return template;
    }

  }

  static OPDPatientActionRenderer(params) {
    let currPatient = params.data;

    //by default: print sticker wil be there in the action.
    let templateHtml = `<a danphe-grid-action="preview" class="d-icon icon-user" title="Preview" style="display: inherit; float:left;"></a>

    `;

    if (currPatient.IsFollowUp) {
      templateHtml +=
        '<a danphe-grid-action="removefollowup" class="fa fa-file-text" style="font-size:15px;position:relative;top:-5px; margin-right:10px;;" title="remove follow up""></a>';
    } else {
      templateHtml +=
        '<a danphe-grid-action="addfollowup" class="fa fa-file-text-o" style="font-size:15px;position:relative;top:-5px; margin-right:10px;" title="add follow up""></a>';
    }

    if (currPatient.IsFavorite) {
      templateHtml +=
        '<a danphe-grid-action="removefavorite" class="fa fa-heart" style="font-size:17px;position:relative;top:-3px;" title="remove favorite""></a>';
    } else {
      templateHtml +=
        '<a danphe-grid-action="addfavorite" class="fa fa-heart-o" style="font-size:17px;position:relative;top:-3px;" title="add favorite""></a>';
    }


    return templateHtml;
  }
  static OPFollowUpActionRenderer(params) {
    let currPatient = params.data;

    //by default: print sticker wil be there in the action.
    let templateHtml = `<a danphe-grid-action="preview" class="d-icon icon-user" title="Preview" style="display: inherit; float:left;"></a>

    `;

    if (currPatient.IsFollowUp) {
      templateHtml +=
        '<a danphe-grid-action="removefollowup" class="fa fa-file-text" style="font-size:15px;position:relative;top:-5px" title="remove follow up""></a>';
    } else {
      templateHtml +=
        '<a danphe-grid-action="addfollowup" class="fa fa-file-text-o" style="font-size:15px;position:relative;top:-5px" title="add follow up""></a>';
    }

    return templateHtml;
  }


  static OPFavoriteActionRenderer(params) {
    let currPatient = params.data;

    //by default: print sticker wil be there in the action.
    let templateHtml = `<a danphe-grid-action="preview" class="d-icon icon-user" title="Preview" style="display: inherit; float:left;"></a>
  `;

    if (currPatient.IsFavorite) {
      templateHtml +=
        '<a danphe-grid-action="removefavorite" class="fa fa-heart" style="font-size:17px;position:relative;top:-3px" title="remove favorite""></a>';
    } else {
      templateHtml +=
        '<a danphe-grid-action="addfavorite" class="fa fa-heart-o" style="font-size:17px;position:relative;top:-3px" title="add favorite""></a>';
    }

    return templateHtml;
  }

  public static ManageUserActionSubLedgerTemplate(params) {
    if (params.data.IsActive == true) {
      let template = `
            <a danphe-grid-action="activate/deactivate" class="grid-action">Deactivate</a>
            <a danphe-grid-action="edit" class="grid-action">Edit</a >
            `;
      return template;
    } else {
      let template = `
            <a danphe-grid-action="activate/deactivate" class="grid-action">Activate</a>
            `;
      return template;
    }
  }
  static RequisitionDateRenderer(params) {
    let date: string = params.data.RequisitionDate;
    return moment(date).format("YYYY-MM-DD HH:mm");
  }

  public static ActivateDeactivateTemplate(params) {
    let template;

    if (params.data.IsActive == true) {

      template = `<a danphe-grid-action="activate-deactivate" class="grid-action">
              Deactivate
            </a>
          <a danphe-grid-action="edit" class="grid-action">Edit</a >`;
    } else {
      template = `<a danphe-grid-action="activate-deactivate" class="grid-action">
                Activate
               </a>`;
    }
    return template;
  }

  // public static ViewMedicarePatientList(params) {
  //   let template;
  //   const isActive = params.data.IsActive;

  //   if (isActive) {
  //     template = `<a danphe-grid-action="view" class="grid-action">View</a>`;
  //   } else {
  //     template = `<a danphe-grid-action="view" class="grid-action">View</a>`;
  //   }

  //   return template;
  // }

  static ViewMedicarePatientList(params) {
    let template;
    template = `
        <a danphe-grid-action="medicarePatient" class="grid-action">View/Edit</a>`;
    return template;
  }



  static PatientConsumptionColumn = [
    {
      headerName: "Hospital Number",
      field: "HospitalNo",
      width: 140
    },
    {
      headerName: "Patient Name",
      field: "PatientName",
      width: 140
    },
    {
      headerName: "Age/Sex",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.AgeSexRendererPatientConsumption
    },
    {
      headerName: "Contact No.",
      field: "ContactNo",
      width: 100
    },
    { headerName: "Total Amt.", field: "TotalAmount", width: 110 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>
              <a danphe-grid-action="view" class="grid-action">
                        Show List
                     </a>`,
    },
  ];

  static PatientConsumptionListColumn = [
    {
      headerName: "Receipt No",
      field: "ConsumptionReceiptNo",
      width: 100
    },
    {
      headerName: "IP No.",
      field: "IpNo",
      width: 100
    },
    {
      headerName: "Consumption Date",
      field: "ConsumptionDate",
      width: 200,
      cellRenderer: GridColumnSettings.PatientConsumptionDateRenderer
    },
    {
      headerName: "Total Amount",
      field: "TotalAmount",
      width: 100
    },
    { headerName: "User", field: "UserName", width: 200 },
    {
      headerName: "Action",
      field: "",
      width: 150,
      template: `
              <a danphe-grid-action="view" class="grid-action">
                        View
                     </a>`,
    },
  ];

  static PatientConsumptionDateRenderer(params) {
    let date: string = params.data.ConsumptionDate;
    return moment(date).format("YYYY-MM-DD HH:mm a");
  }

  static InsurancePendingClaimGridSettings = [
    { headerName: "Claim Code", field: "ClaimCode", width: 80 },
    { headerName: "HospitalNo.", field: "HospitalNo", width: 80 },
    {
      headerName: "PatientName",
      field: "PatientName",
      width: 120,
    },
    { headerName: "Age/Sex", field: "AgeSex", width: 80 },
    {
      headerName: "Member No.",
      field: "MemberNumber",
      width: 80,
    },
    { headerName: "Scheme", field: "SchemeName", width: 100 },
    { headerName: "Total Bill Amount", field: "TotalBillAmount", width: 100 },
    { headerName: "Unclaimable Amount", field: "NonClaimableAmount", width: 100 },
    { headerName: "Claimable Amount", field: "ClaimableAmount", width: 100 },
    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="claim-review" class="grid-action">
                 <i class="fa fa-pencil"></i> Review Claim
             </a>`,
    },
  ];

  static InsurancePaymentPendingClaimListGridColumnsSettings = [
    { headerName: "Claim Code", field: "ClaimCode", width: 80, cellRenderer: GridColumnSettings.ClaimPreview },
    { headerName: "HospitalNo.", field: "HospitalNo", width: 80 },
    {
      headerName: "PatientName",
      field: "PatientName",
      width: 120,
    },
    {
      headerName: "Member No.",
      field: "MemberNumber",
      width: 80,
    },
    { headerName: "Claimed Amount", field: "ClaimedAmount", width: 100 },
    { headerName: "Approved Amount", field: "ApprovedAmount", width: 100 },
    { headerName: "Rejected Amount", field: "RejectedAmount", width: 100 },
    { headerName: "Received Amount", field: "TotalReceivedAmount", width: 100 },
    { headerName: "Pending Amount", field: "PendingAmount", width: 100 },
    {
      headerName: "Action",
      field: "",
      resizable: true,
      cellRenderer: GridColumnSettings.GetInsurancePendingClaimActions,
    }
  ];

  static ClaimPreview(params) {
    return `<a danphe-grid-action="claim-preview">
               ${params.data.ClaimCode}
             </a>`;
  }
  static PatientConsumptionReturnColumn = [
    {
      headerName: "Last Return Date",
      field: "CreatedOn",
      width: 140
    },
    {
      headerName: "ReturnReceiptNo",
      field: "ConsumptionReturnReceiptNo",
      width: 100
    },
    {
      headerName: "Hospital Number",
      field: "HospitalNo",
      width: 140
    },
    {
      headerName: "Patient Name",
      field: "PatientName",
      width: 140
    },
    {
      headerName: "Age/Sex",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.AgeSexRendererPatientConsumption
    },
    {
      headerName: "Contact No.",
      field: "ContactNo",
      width: 100
    },
    { headerName: "Total Amt.", field: "TotalAmount", width: 110 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template: `
              <a danphe-grid-action="view" class="grid-action">
                        Print
                     </a>`,
    },
  ];
  static PatientConsumptionFinalizeColumn = [

    {
      headerName: "Invoice No",
      field: "InvoicePrintNo",
      width: 140
    },
    {
      headerName: "Hospital Number",
      field: "HospitalNo",
      width: 140
    },
    {
      headerName: "Patient Name",
      field: "PatientName",
      width: 140
    },
    {
      headerName: "Age/Sex",
      field: "",
      width: 100,
      cellRenderer: GridColumnSettings.AgeSexRendererPatientConsumption
    },
    {
      headerName: "Contact No.",
      field: "ContactNo",
      width: 100
    },
    { headerName: "Total Amt.", field: "TotalAmount", width: 110 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template:
        ` <a danphe-grid-action="view" class="grid-action">
                        Print
                     </a>`,
    },
  ];
  static GetInsurancePendingClaimActions() {
    let template = "";
    template += ` <a danphe-grid-action="approve-reject-amount" class="grid-action">Approve/Reject Amount</a>
          <a danphe-grid-action="new-payment" class="grid-action"><i class="fa fa-plus"></i>Payments</a>
          <a danphe-grid-action="view-payments" class="grid-action">View</a>`;
    return template;
  }

  static VoucherVerificationList = [
    { headerName: "Voucher No.", field: "VoucherNumber", width: 80 },
    { headerName: "Fiscal Year", field: "FiscalYear", width: 80 },
    {
      headerName: "TransactionDate",
      field: "TransactionDate",
      width: 80,
      cellRenderer: GridColumnSettings.AccTxnDateRenderder,
    },
    { headerName: "Voucher Type", field: "VoucherType", width: 120 },
    {
      headerName: "TotalAmount",
      field: "Amount",
      width: 100,
      cellRenderer: GridColumnSettings.AccAmountRenderder,
    },
    { headerName: "Narration", field: "Narration", width: 120 },
    {
      headerName: "Action",
      field: "",

      width: 120,
      template: `<a danphe-grid-action="view-detail" class="grid-action">
                 <i class="fa fa-eye"></i>View Detail
             </a>`,
    },
  ];


  static DischargeStatementColumnList = [
    {
      headerName: "StatementDate",
      field: "StatementDate",
      cellRenderer: GridColumnSettings.BillingDischargeStatementDateTimeRenderer,
      width: 100,
    },
    { headerName: "StatementTime", field: "", width: 100, cellRenderer: GridColumnSettings.DischargeStatementTimeRenderer },
    { headerName: "Hospital No.", field: "PatientCode", width: 70 },
    { headerName: "Patient Name", field: "PatientName", width: 150 },
    {
      headerName: "Age/Sex", field: "", width: 150, cellRenderer: GridColumnSettings.NewAgeSexRendererPatient,
    },
    { headerName: "Phone", field: "PhoneNo", width: 150 },
    // { headerName: "StatementDate/Time", field: "", width: 100, cellRenderer: GridColumnSettings.DischargeStatementDateRenderer },
    { headerName: "ReceiptNo", field: "StatementNo", width: 50 },

    {
      headerName: "Action",
      field: "",
      template: `<a danphe-grid-action="show-statement-details" class="grid-action">
                Show Details
             </a>
             `
      //    <a danphe-grid-action="show-statement-summary" class="grid-action">
      //    Show Summary
      // </a>
    },
  ];

  static DischargeStatementTimeRenderer(params): string {
    if (params && params.data.StatemntTime) {
      let time: string = params.data.StatemntTime;

      let formattedTime: string = moment(time, "HH:mm").format("HH:mm A");
      return formattedTime;
    }
  }



  public SchemeRefundGridCols = [
    { headerName: "Refund Date", field: "RefundDate", width: 110 },
    { headerName: "Recipt No", field: "ReceiptNo", width: 140 },
    { headerName: "Scheme", field: "SchemeName", width: 140 },
    { headerName: "Hospital No", field: "HospitalNumber", width: 140 },
    { headerName: "Patient", field: "PatientName", width: 120 },
    { headerName: "Age/Sex", field: "Age", width: 120 },
    { headerName: "Inpatient No", field: "InpatientNumber", width: 120 },
    { headerName: "Refund Amount", field: "RefundAmount", width: 120 },
    { headerName: "Entered By", field: "EnteredBy", width: 120 },
    { headerName: "Remarks", field: "Remarks", width: 120 },
    {
      headerName: "Action",
      field: "",
      width: 250,
      template: `<a danphe-grid-action="Print" class="grid-action-edit" >
      Print
      </a>`
    }
  ];

  static IPPharmacyBillItemGridCol = [
    { headerName: "Date", field: "BillDate", width: 90 },
    { headerName: "ItemName", field: "ItemName", width: 160 },
    { headerName: "Batch", field: "BatchNo", width: 100 },
    { headerName: "Expiry", field: "ExpiryDate", width: 100 },
    { headerName: "Qty.", field: "Quantity", width: 60 },
    { headerName: "SalePrice", field: "SalePrice", width: 60 },
    { headerName: "DiscAmt", field: "DiscountAmount", width: 85 },
    { headerName: "Amount", field: "TotalAmount", width: 85 },
    { headerName: "User", field: "User", width: 150 },
  ];
  public InvoiceListGridCols = [
    { headerName: "Invoice Date", field: "CreatedOn", width: 110, cellRenderer: GridColumnSettings.InvoiceDateRenderer },
    { headerName: "Invoice No", field: "InvoiceNoFormatted", width: 140 },
    { headerName: "HospitalNo", field: "PatientCode", width: 140 },
    { headerName: "Patient Name", field: "ShortName", width: 140 },
    { headerName: "Age/Sex", field: "Age", width: 120 },
    { headerName: "Invoice Amount", field: "TotalAmount", width: 120, cellRenderer: GridColumnSettings.InvoiceTotalAmountRenderer },
    { headerName: "Return Amount", field: "ReturnCashAmount", width: 120 },
    { headerName: "Net Amount", field: "NetAmount", width: 120, cellRenderer: GridColumnSettings.InvoiceNetAmountRenderer },
    {
      headerName: "Entered ?",
      field: "ReferalCount",
      width: 250,
      cellRenderer: GridColumnSettings.InvoiceEnteredCellRenderer,
    }
  ];
  static InvoiceDateRenderer(params) {
    if (params.data.CreatedOn)
      return moment(params.data.CreatedOn).format("YYYY-MM-DD");
  }
  static InvoiceTotalAmountRenderer(params) {
    if (params.data.TotalAmount) {
      return (params.data.TotalAmount).toFixed(4);
    }
  }
  static InvoiceNetAmountRenderer(params) {
    if (params.data.NetAmount) {
      return (params.data.NetAmount).toFixed(4);
    }
  }
  static InvoiceEnteredCellRenderer(params) {

    let template;
    if (params.data.ReferralCount > 0) {

      template = `<a danphe-grid-action="Yes" class="grid-action">
              Yes(${params.data.ReferralCount})</a>`;
    } else {
      template = `<a danphe-grid-action="No" class="grid-action">
                No(${params.data.ReferralCount})
               </a>`;
    }
    return template;
  }
  public mktreferralReferringOrganizationListGridCols = [
    { headerName: "Organization Name", field: "ReferringOrganizationName", width: 140, },
    { headerName: "Address", field: "Address", width: 140 },
    { headerName: "Contact No", field: "ContactNo", width: 140 },
    { headerName: "Contact Person", field: "ContactPersons", width: 140 },
    { headerName: "IsActive?", field: "IsActive", width: 120 },
    {
      headerName: "Action",
      field: "",

      width: 200,
      cellRenderer: GridColumnSettings.ActivateDeactivateReferringOrganizationTemplate,

    },
  ];
  public static ActivateDeactivateReferringOrganizationTemplate(params) {
    let template;
    if (params.data.IsActive) {
      template = `<a danphe-grid-action="activateOrganization" class="grid-action">
    Deactivate
  </a>
<a danphe-grid-action="edit" class="grid-action">Edit</a >`;
    } else {
      template = `<a danphe-grid-action="DeactivateOrganization" class="grid-action">
      Activate
     </a>`;
    }
    return template;
  }
  public mktreferralReferringPartyListGridCols = [
    { headerName: "Party Name", field: "ReferringPartyName", width: 140, },
    { headerName: "Group Name", field: "GroupName", width: 140, },
    { headerName: "Organization Name", field: "ReferringOrganizationName", width: 140, },
    { headerName: "Address", field: "Address", width: 140 },
    { headerName: "Vehicle Number", field: "VehicleNumber", width: 140 },
    { headerName: "Contact No", field: "ContactNumber", width: 140 },
    { headerName: "Area Code", field: "AreaCode", width: 140 },
    { headerName: "PAN Number", field: "PANNumber", width: 140 },
    { headerName: "IsActive?", field: "IsActive", width: 120 },
    {
      headerName: "Action",
      field: "",

      width: 200,
      cellRenderer: GridColumnSettings.ActivateDeactivateReferringPartyTemplate,

    },
  ];
  public static ActivateDeactivateReferringPartyTemplate(params) {
    let template;
    if (params.data.IsActive) {
      template = `<a danphe-grid-action="activateOrganization" class="grid-action">
    Deactivate
  </a>
<a danphe-grid-action="edit" class="grid-action">Edit</a >`;
    } else {
      template = `<a danphe-grid-action="DeactivateOrganization" class="grid-action">
      Activate
     </a>`;
    }
    return template;
  }

  public MarketingReferralDetailedReportGridCols = [
    { headerName: "Invoice Date", field: "InvoiceDate", width: 140 },
    { headerName: "Invoice No", field: "InvoiceNoFormatted", width: 140 },
    { headerName: "HospitalNo", field: "HospitalNo", width: 140 },
    { headerName: "PatientName", field: "PatientName", width: 140 },
    { headerName: "Referring Party", field: "ReferringPartyName", width: 140 },
    { headerName: "Party Group", field: "GroupName", width: 120 },
    { headerName: "Area Code", field: "AreaCode", width: 90 },
    { headerName: "Referring Organization", field: "ReferringOrganizationName", width: 120 },
    { headerName: "Vehicle No.", field: "VehicleNumber", width: 120 },
    { headerName: "Referral Scheme", field: "ReferralSchemeName", width: 120 },
    { headerName: "Invoice Net Amount", field: "InvoiceNetAmount", width: 120 },
    { headerName: "Percentage", field: "Percentage", width: 120 },
    { headerName: "Referral Amount", field: "ReferralAmount", width: 120 },
    { headerName: "Remarks", field: "Remarks", width: 120 },
    { headerName: "EnteredBy", field: "EnteredBy", width: 120 },
    { headerName: "EnteredOn", field: "EnteredOn", width: 120 },

  ];


  public MarketingReferralSummaryReportGridCols = [
    { headerName: "Referring Party", field: "ReferringPartyName", width: 140 },
    { headerName: "Party Group", field: "GroupName", width: 120 },
    { headerName: "Area Code", field: "AreaCode", width: 90 },
    { headerName: "Referring Organization", field: "ReferringOrganizationName", width: 120 },
    { headerName: "Invoice Net Amount", field: "InvoiceNetAmount", width: 120 },
    { headerName: "Referral Amount", field: "ReferralAmount", width: 120 }

  ];
  static ProvisionalDischargeListGridColumns = [
    { headerName: "Ip Number", field: "IpNumber", width: 120 },
    { headerName: "Hospital No.", field: "HospitalNumber", width: 120 },
    { headerName: "Patient Name", field: "PatientName", width: 140 },
    { headerName: "Age/Sex", field: "AgeSex", width: 90, cellRenderer: GridColumnSettings.AgeSexRendererPatient },
    { headerName: "Contacts", field: "Contacts", width: 120 },
    { headerName: "Ward/Bed", field: "WardBed", width: 120 },
    { headerName: "Deposit Amt.", field: "DepositAmount", width: 90 },
    { headerName: "Admitted On", field: "AdmittedOn", width: 120 },
    { headerName: "Prov. Discharge On", field: "ProvisionalDischargedOn", width: 120 },
    { headerName: "Prov. Discharge By", field: "ProvisionalDischargedBy", width: 90 },
    { headerName: "Remarks", field: "Remarks", width: 90 },
    {
      headerName: "Actions", field: "", width: 140,
      cellRenderer: GridColumnSettings.ProvisionalDischargeListActions
    },
  ];

  private static ProvisionalDischargeListActions(params) {
    let template;
    if (params.data) {
      template = `<a danphe-grid-action="viewDetails" class="grid-action">  <i class="fa fa-eye"></i>View Details</a>`;
    }
    return template;
  }
  BloodSugar = [
    { headerName: "Date", field: "CreatedOn", width: 100, cellRenderer: GridColumnSettings.CreatedOnDate, },
    { headerName: "Time", field: "CreatedOn", width: 100, cellRenderer: GridColumnSettings.CreatedOnTime, },
    { headerName: "RBS", field: "RbsValue", width: 100 },
    { headerName: "Insulin", field: "Insulin", width: 100 },
    { headerName: "Entered By", field: "EnteredBy", width: 100 },
    { headerName: "Remarks", field: "Remarks", width: 100 },
    {
      headerName: "Action",
      field: "",
      width: 120,
      cellRenderer: (params) => {
        const CurrentUserId = GridColumnSettings.currentUserId;
        const isEditable = params.data.CreatedBy === CurrentUserId;
        return isEditable
          ? `
            <div>
              <a danphe-grid-action="edit" class="grid-action">Edit</a>
              <i class="fa fa-trash" style="margin-left: 10px; color: black; zoom: 1.5;" danphe-grid-action="delete"></i>
            </div>
          `
          : `
            <div>
              <a class="grid-action disabled" style="pointer-events: none; opacity: 0.5;">Edit</a>
              <i class="fa fa-trash" style="margin-left: 10px; color: grey; zoom: 1.5; pointer-events: none; opacity: 0.5;"></i>
            </div>
          `;
      },

    }
  ];
  static CreatedOnDate(params) {
    return moment(params.data.CreatedOn).format("YYYY-MM-DD");
  }
  static CreatedOnTime(params) {
    return moment(params.data.CreatedOn).format("h:mm A");
  }

  ConsultationRequest = [
    { headerName: "Requested On", field: "RequestedOn", width: 100, cellRenderer: GridColumnSettings.FormatRequestedOnDateTime, },
    { headerName: "Requesting Dept", field: "RequestingDepartmentName", width: 100, },
    { headerName: "Requesting Dr.", field: "RequestingConsultantName", width: 100 },
    { headerName: "Consulted On", field: "ConsultedOn", width: 100, cellRenderer: GridColumnSettings.FormatConsultedOnDateTime },
    { headerName: "Consulting Dept", field: "ConsultingDepartmentName", width: 100 },
    { headerName: "Consulting Dr.", field: "ConsultingDoctorName", width: 100 },
    { headerName: "Status", field: "Status", width: 100 },
    { headerName: "Action", field: "Status", width: 150, cellRenderer: GridColumnSettings.ConsultationRequestActionTemplate },
  ];

  static FormatRequestedOnDateTime(params) {
    return moment(params.data.RequestedOn).format("YYYY-MM-DD HH:mm A");
  }
  static FormatConsultedOnDateTime(params) {
    return params.data.ConsultedOn ? moment(params.data.ConsultedOn).format("YYYY-MM-DD HH:mm A") : 'Pending';
  }
  static ConsultationRequestActionTemplate(params) {
    let template = ``;
    const currentUserId = GridColumnSettings.currentUserId;
    const isAdmin = GridColumnSettings.isAdmin;

    const { RequestingConsultantId, ConsultingDoctorId, Status } = params.data;
    const status = Status ? Status.toLowerCase() : null;

    const canRespond = GridColumnSettings.securityService.HasPermission("btn-nursing-consultation-request-respond");
    const canView = GridColumnSettings.securityService.HasPermission("btn-nursing-consultation-request-view");

    if (status === ENUM_ConsultationRequestStatus.Requested.toLowerCase()) {
      if ((ConsultingDoctorId === currentUserId || isAdmin) && canRespond) {
        template += `
          <a danphe-grid-action="respond" class="grid-action">
            Respond
          </a>`;
      }
    }

    if ((RequestingConsultantId === currentUserId || isAdmin) && canView) {
      template += `
        <a danphe-grid-action="view" class="grid-action">
          View
        </a>`;
    }

    return template;
  }


  IntakeOutput = [
    { headerName: "Recorded On", field: "RecordedDate", width: 110 },
    { headerName: "Time", field: "RecordedTime", width: 80 },
    { headerName: "Entry", field: "IntakeOutputType", width: 70 },
    { headerName: "IntakeOutput Type", field: "", width: 130, cellRenderer: GridColumnSettings.FormatIntakeOutPutType },
    { headerName: "Quantity(ml)", field: "IntakeOutputValue", width: 90 },
    { headerName: "Color", field: "Color", width: 60 },
    { headerName: "Quality", field: "Quality", width: 60 },
    { headerName: "Remarks", field: "Remarks", width: 80 },
    { headerName: "Balance", field: "Balance", width: 50 },
    {
      headerName: "Action",
      field: "",
      width: 120,
      cellRenderer: (params) => {
        const CurrentUserId = GridColumnSettings.currentUserId;
        const isEditable = params.data.CreatedBy === CurrentUserId;
        return isEditable
          ? `
            <div>
              <a danphe-grid-action="edit" class="grid-action">Edit</a>
              <i class="fa fa-trash" style="margin-left: 10px; color: black; zoom: 1.5;" danphe-grid-action="delete"></i>
            </div>
          `
          : `
            <div>
              <a class="grid-action disabled" style="pointer-events: none; opacity: 0.5;">Edit</a>
              <i class="fa fa-trash" style="margin-left: 10px; color: grey; zoom: 1.5; pointer-events: none; opacity: 0.5;"></i>
            </div>
          `;
      },

    }
  ];
  private static FormatIntakeOutPutType(params) {
    let InatkeOutput;
    if (params.data.ParameterChildValue)
      InatkeOutput = `${params.data.ParameterMainValue}/${params.data.ParameterChildValue}`;
    else {
      InatkeOutput = params.data.ParameterMainValue;
    }
    return InatkeOutput;
  }
  OTMachineListGridColumns = [
    { headerName: "Machine Name", field: "MachineName", width: 300 },
    { headerName: "Machine Charge", field: "MachineCharge", width: 300 },
    { headerName: "IsActive", field: "IsActive", width: 120 },
    {
      headerName: "Actions", field: "", width: 150,
      cellRenderer: GridColumnSettings.OTMachineListActions
    },
  ];

  private static OTMachineListActions(params) {
    let template;
    if (params.data && GridColumnSettings.securityService.HasPermission("btn-ot-machine-edit")) {
      template = `<a danphe-grid-action="edit" class="grid-action"> <i class="fa fa-edit"></i>Edit</a>`;
    }
    return template;
  }

  PersonnelTypeListGridColumns = [
    { headerName: "Personnel Type", field: "PersonnelType", width: 300 },
    { headerName: "IsActive", field: "IsActive", width: 120 },
    {
      headerName: "Actions", field: "", width: 150,
      cellRenderer: GridColumnSettings.PersonnelTypeListActions
    },
  ];

  private static PersonnelTypeListActions(params) {
    let template;
    if (params.data && GridColumnSettings.securityService.HasPermission("btn-ot-personnel-type-edit")) {
      template = `<a danphe-grid-action="edit" class="grid-action"> <i class="fa fa-edit"></i>Edit</a>`;
    }
    return template;
  }

  OTSurgeryListGridColumns = [
    { headerName: "Sugery Name", field: "SurgeryName", width: 100 },
    { headerName: "Sugery Code", field: "SurgeryCode", width: 100 },
    { headerName: "Description", field: "Description", width: 200 },
    { headerName: "IsActive", field: "IsActive", width: 50 },
    {
      headerName: "Actions", field: "", width: 150,
      cellRenderer: GridColumnSettings.OTSurgeryListActions
    },
  ];

  private static OTSurgeryListActions(params): string {
    let template: string = ``;
    if (params.data && !params.data.IsSystemDefault && GridColumnSettings.securityService.HasPermission("btn-ot-surgery-edit")) {
      template = `<a danphe-grid-action="edit" class="grid-action"> <i class="fa fa-edit"></i>Edit</a>`;
    }
    if (params.data && params.data.IsActive && GridColumnSettings.securityService.HasPermission("ot-map-surgery-checklist-view")) {
      template += `<a danphe-grid-action="map-surgery-checklist" class="grid-action"> <i class="fa fa-edit"></i>Map SurgeryCheckList</a>`;
    }
    return template;
  }


  static ConsumptionTypeGridColumns = [
    { headerName: "Consumption Type Name", field: "ConsumptionTypeName", width: 150 },
    { headerName: "Is Active", field: "IsActive", width: 100 },
    { headerName: "Action", field: "", width: 100, cellRenderer: GridColumnSettings.ConsumptionTypeGridActionCellRenderer },
  ];
  static ConsumptionTypeGridActionCellRenderer(params) {
    let template = ``;
    if (params.data.IsActive) {
      template += `<a danphe-grid-action="edit" class="grid-action">
                Edit
             </a>
             <a danphe-grid-action="deActivate" class="grid-action">
                Deactivate
             </a>`;
    }
    else {
      template += `<a danphe-grid-action="activate" class="grid-action">
                Activate
             </a>`;
    }
    return template;
  }

  static ClaimSubmissionReportGridCol = [
    { headerName: "Transaction Date", field: "TransactionDate", width: 60 },
    { headerName: "VisitType", field: "VisitType", width: 60 },
    { headerName: "HospitalClaimCode", field: "ClaimCode", width: 60 },
    { headerName: "Claim Ref. No.", field: "ClaimReferenceNo", width: 60 },
    { headerName: "Policy No.", field: "PolicyNumber", width: 60 },
    { headerName: "Patient Name", field: "PatientName", width: 75 },
    { headerName: "Hospital No.", field: "HospitalNumber", width: 60 },
    { headerName: "Status", field: "Status", width: 60 },
    { headerName: "Invoice No.", field: "InvoiceNos", width: 45 },
    { headerName: "Cash Amount", field: "CashAmount", width: 50 },
    { headerName: "Credit Amount", field: "CreditAmount", width: 50 },
    { headerName: "Total Amount", field: "TotalBillAmount", width: 50 },
  ];

  public PatientVisitWiseReferralCommissionGridCols = [
    { headerName: "Visit Date", field: "VisitDate", width: 110, cellRenderer: GridColumnSettings.VisitDateOnlyRenderer },
    { headerName: "Visit Code", field: "VisitCode", width: 140 },
    { headerName: "HospitalNo", field: "PatientCode", width: 140 },
    { headerName: "Patient Name", field: "ShortName", width: 140 },
    { headerName: "Age/Sex", field: "Age", width: 120 },
    { headerName: "ReferralAmount", field: "ReferralAmount", width: 120 },
    {
      headerName: "Entered ?",
      field: "ReferalCount",
      width: 250,
      cellRenderer: GridColumnSettings.InvoiceEnteredCellRenderer,
    }
  ];

  public MarketingReferralSchemeGridCols = [
    { headerName: "ReferralScheme Name", field: "ReferralSchemeName", width: 140, },
    { headerName: "Description", field: "Description", width: 140 },
    { headerName: "ReferralPreference", field: "ReferralPreference", width: 140 },
    { headerName: "Referral %", field: "ReferralPercentage", width: 140 },
    { headerName: "ReferralAmount", field: "ReferralAmount", width: 120 },
    { headerName: "IsActive?", field: "IsActive", width: 120 },
    {
      headerName: "Action",
      field: "",

      width: 200,
      cellRenderer: GridColumnSettings.ActivateDeactivateReferralScheme,

    },
  ];

  public static ActivateDeactivateReferralScheme(params) {
    let template;
    if (params.data.IsActive) {
      template = `<a danphe-grid-action="activateReferralScheme" class="grid-action">
    Deactivate
  </a>
<a danphe-grid-action="edit" class="grid-action">Edit</a >`;
    } else {
      template = `<a danphe-grid-action="deactivateReferralScheme" class="grid-action">
      Activate
     </a>`;
    }
    return template;
  }

  public static ManageVisitActionsRenderer(params) {
    let template = '';
    if (params.data) {
      const visitType = params.data.VisitType;
      const appointmentType = params.data.AppointmentType;
      const daysPassed = params.data.DaysPassed;
      const maxAllowedFollowupDays = params.data.MaxAllowedFollowUpDays;
      const maxAllowedReferralDays = params.data.MaxAllowedReferralDays;
      const parentVisitId = params.data.ParentVisitId;

      const actionConditions = {
        ShowSticker: false,
        ShowFollowup: false,
        ShowRefer: false
      };

      switch (visitType) {
        case ENUM_VisitType.outdoor: {
          actionConditions.ShowSticker = true;
          actionConditions.ShowFollowup = false;
          actionConditions.ShowRefer = false;
          break;
        }
        case ENUM_VisitType.outpatient: {
          if ((appointmentType === ENUM_AppointmentType.new || appointmentType === ENUM_AppointmentType.revisit) && daysPassed === 0 && !parentVisitId) {
            actionConditions.ShowSticker = true;
            actionConditions.ShowFollowup = false;
            actionConditions.ShowRefer = true;
          } else if ((appointmentType === ENUM_AppointmentType.new || appointmentType === ENUM_AppointmentType.revisit)) {
            actionConditions.ShowSticker = true;
            actionConditions.ShowFollowup = (daysPassed > 0 && daysPassed <= maxAllowedFollowupDays) ? true : false;
            actionConditions.ShowRefer = (daysPassed > 0 && daysPassed <= maxAllowedReferralDays) ? true : false;
          } else if (appointmentType === ENUM_AppointmentType.followup && parentVisitId) {
            actionConditions.ShowSticker = true;
            actionConditions.ShowFollowup = false;
            actionConditions.ShowRefer = false;
          } else if (appointmentType === ENUM_AppointmentType.referral && parentVisitId) {
            actionConditions.ShowSticker = true;
            actionConditions.ShowFollowup = (daysPassed > 0 && daysPassed <= maxAllowedFollowupDays) ? true : false;
            actionConditions.ShowRefer = (daysPassed >= 0 && daysPassed <= maxAllowedReferralDays) ? true : false;
          }
          break;
        }
        case ENUM_VisitType.inpatient: {
          if ((appointmentType === ENUM_AppointmentType.new || appointmentType === ENUM_AppointmentType.revisit) && daysPassed === 0 && !parentVisitId) {
            actionConditions.ShowSticker = true;
            actionConditions.ShowFollowup = false;
            actionConditions.ShowRefer = false;
          } else if ((appointmentType === ENUM_AppointmentType.new || appointmentType === ENUM_AppointmentType.revisit) && (daysPassed > 0 && daysPassed <= maxAllowedFollowupDays)) {
            actionConditions.ShowSticker = true;
            actionConditions.ShowFollowup = true;
            actionConditions.ShowRefer = false;
          } else if ((appointmentType === ENUM_AppointmentType.new || appointmentType === ENUM_AppointmentType.revisit) && (daysPassed > 0 && daysPassed > maxAllowedFollowupDays)) {
            actionConditions.ShowSticker = true;
            actionConditions.ShowFollowup = false;
            actionConditions.ShowRefer = false;
          }
          break;
        }
        case ENUM_VisitType.emergency: {
          actionConditions.ShowSticker = true;
          actionConditions.ShowFollowup = false;
          actionConditions.ShowRefer = false;
          break;
        }
        default: {
          break;
        }
      }

      if (actionConditions.ShowSticker && actionConditions.ShowFollowup && actionConditions.ShowRefer) {
        template = `<a danphe-grid-action="referral" class="grid-action">refer </a>
                    <a danphe-grid-action="followup" class="grid-action">followup </a>
                    <a danphe-grid-action="printsticker" class="grid-action" title="Print OPD-Sticker">
                    <i class="glyphicon glyphicon-print" ></i>&nbsp;sticker </a>`;
      } else if (actionConditions.ShowSticker && actionConditions.ShowFollowup && !actionConditions.ShowRefer) {
        template = `<a danphe-grid-action="followup" class="grid-action">followup </a>
                    <a danphe-grid-action="printsticker" class="grid-action" title="Print OPD-Sticker">
                    <i class="glyphicon glyphicon-print" ></i>&nbsp;sticker </a>`;
      } else if (actionConditions.ShowSticker && !actionConditions.ShowFollowup && actionConditions.ShowRefer) {
        template = `<a danphe-grid-action="referral" class="grid-action">refer </a>
                    <a danphe-grid-action="printsticker" class="grid-action" title="Print OPD-Sticker">
                    <i class="glyphicon glyphicon-print" ></i>&nbsp;sticker </a>`;
      } else if (actionConditions.ShowSticker && !actionConditions.ShowFollowup && !actionConditions.ShowRefer) {
        template = `<a danphe-grid-action="printsticker" class="grid-action" title="Print OPD-Sticker">
                   <i class="glyphicon glyphicon-print" ></i>&nbsp;sticker </a>`;
      } else {
        template = ``;
      }
    }

    return template;
  }

  static PHRMCreditBillSearch = [
    {
      headerName: "Scheme",
      field: "SchemeName",
      width: 100
    },
    {
      headerName: "Hospital Number",
      field: "PatientCode",
      width: 170
    },
    {
      headerName: "Patient Name",
      field: "ShortName",
      width: 160
    },
    {
      headerName: "Visit Type",
      field: "VisitType",
      width: 130
    },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient
    },
    {
      headerName: "Contact No.",
      field: "PhoneNumber",
      width: 100
    },

    {
      headerName: "Visit Date",
      field: "VisitDate",
      width: 180,
      cellRenderer: GridColumnSettings.PHRMProvisionalDateTimeRenderer,
    },
    { headerName: "Total", field: "TotalCredit", width: 110 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>
             <a danphe-grid-action="view" class="grid-action">
                Print
             </a>
             `
    },

  ];

  static PHRMProvisionalDateTimeRenderer(params) {
    return moment(params.data.VisitDate).format("YYYY-MM-DD HH:mm A");
  }

  static PharmacyProvisionalBillColumns = [
    {
      headerName: "Scheme",
      field: "SchemeName",
      width: 100
    },
    {
      headerName: "Hospital Number",
      field: "PatientCode",
      width: 170
    },
    {
      headerName: "Patient Name",
      field: "ShortName",
      width: 160
    },
    {
      headerName: "Visit Type",
      field: "VisitType",
      width: 130
    },
    {
      headerName: "Age/Sex",
      field: "",
      width: 110,
      cellRenderer: GridColumnSettings.AgeSexRendererPatient
    },
    {
      headerName: "Contact No.",
      field: "ContactNo",
      width: 100
    },

    {
      headerName: "Last Bill Date",
      field: "VisitDate",
      width: 180,
      cellRenderer: GridColumnSettings.PharmacyProvisionalDateTimeRenderer,
    },
    { headerName: "Total", field: "TotalCredit", width: 110 },
    {
      headerName: "Action",
      field: "",
      width: 200,
      template: `<a danphe-grid-action="showDetails" class="grid-action">
                Show Details
             </a>
             <a danphe-grid-action="view" class="grid-action">
                Print
             </a>
             `
    },

  ];

  static PharmacyProvisionalDateTimeRenderer(params) {
    return moment(params.data.VisitDate).format("YYYY-MM-DD HH:mm A");
  }

  static ProcessedClaimColumn = [
    { headerName: "Submission Date", field: "ClaimedDate", width: 140, },
    { headerName: "Claim Code", field: "ClaimCode", width: 140, },
    { headerName: "Policy No", field: "PolicyNo", width: 140 },
    { headerName: "Patient Name", field: "ShortName", width: 140 },
    { headerName: "Gender", field: "Gender", width: 140 },
    { headerName: "Hospital No", field: "PatientCode", width: 140 },
    { headerName: "Claim Reference No", field: "ClaimReferenceNo", width: 120 },
    { headerName: "Action", field: "", width: 140, cellRenderer: GridColumnSettings.ProcessedClaimAction, },
  ];
  public static ProcessedClaimAction(params) {
    let template;
    if (params.data) {
      template = `<a danphe-grid-action="Upload" class="grid-action"> Upload </a>`;
    }
    return template;
  }
  static ClaimDocumentReceivedReportColumn = [
    { headerName: "Hospital No", field: "HospitalNo", width: 80 },
    { headerName: "Patient Name", field: "PatientName", width: 80 },
    { headerName: "Member No", field: "MemberNo", width: 80 },
    { headerName: "Claim Code", field: "ClaimCode", width: 80 },
    { headerName: "InvoiceNo", field: "InvoiceNo", width: 80 },
    { headerName: "InvoiceDate", field: "InvoiceDate", width: 80, cellRenderer: GridColumnSettings.FormatInvoiceDate },
    { headerName: "TotalAmount", field: "TotalAmount", width: 80 },
    { headerName: "Scheme", field: "Scheme", width: 80 },
    { headerName: "DocumentReceivedDate", field: "DocumentReceivedDate", width: 120, cellRenderer: GridColumnSettings.FormatDocumentReceivedDate },
    { headerName: "Remarks", field: "Remarks", width: 80 },
    { headerName: "User", field: "User", width: 80 }
  ];
  static FormatInvoiceDate(params) {
    if (params && params.data.InvoiceDate) {
      return moment(params.data.InvoiceDate).format("YYYY-MM-DD");
    }
  }
  static FormatDocumentReceivedDate(params) {
    if (params && params.data.DocumentReceivedDate) {
      return moment(params.data.DocumentReceivedDate).format("YYYY-MM-DD");
    }
  }
}
