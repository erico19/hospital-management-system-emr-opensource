import { ChangeDetectorRef, Component } from "@angular/core";

import { PatientService } from '../../../patients/shared/patient.service';
import { LabsBLService } from '../../shared/labs.bl.service';

import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import LabGridColumnSettings from '../../shared/lab-gridcol-settings';

import * as moment from 'moment/moment';
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { LabCategoryModel } from "../../shared/lab-category.model";
import { LabSticker } from '../../shared/lab-sticker.model';
import { LabPendingResultVM } from "../../shared/lab-view.models";

@Component({
  selector: "danphe-lab-pending-results",
  templateUrl: "./lab-tests-pending-results.html",
  host: { '(window:keydown)': 'hotkeys($event)' }
})

export class LabTestsPendingResultsComponent {
  public showAddEditResult: boolean = false;
  public showlabsticker: boolean = false;
  public showReport: boolean = false;
  public showGrid: boolean = true;
  public showUndoOption: boolean = false;
  public showWorkList: boolean = false;
  public requisitionIdList = [];
  public pendingResults: Array<LabPendingResultVM>;
  pendingLabResultsGridColumns: Array<any> = null;
  public PatientLabInfo: LabSticker = new LabSticker();
  //@ViewChild('searchBox') someInput: ElementRef;

  public verificationRequired: boolean = false;
  public showPrintEmptySheet: boolean = false;
  public showEmptySheet: boolean = false;
  public allReqIdListForPrint: Array<number> = [];
  public fromDate: string = null;
  public toDate: string = null;
  public dateRange: string = "today";

  public timeId: any = null;
  public catIdList: Array<number> = [];
  public isInitialLoad: boolean = true;
  public labGridCols: LabGridColumnSettings = null;
  public categoryList: Array<LabCategoryModel> = null;
  public enableResultEdit: boolean = true;

  public loading: boolean = false;
  public selectedBarCodeNumber: number = 0;

  constructor(public patientService: PatientService, public coreService: CoreService,
    public msgBoxServ: MessageboxService,
    public changeDetector: ChangeDetectorRef,
    public labBLService: LabsBLService,
    public securityService: SecurityService) {

    this.labGridCols = new LabGridColumnSettings(this.securityService);
    this.pendingLabResultsGridColumns = this.labGridCols.AddResultColumnFilter(this.coreService.GetAddResultListColumnArray());

  }

  ngAfterViewInit() {
    document.getElementById('quickFilterInput') && document.getElementById('quickFilterInput').focus();
  }


  OnDateRangeChange($event) {
    if ($event) {
      this.fromDate = $event.fromDate;
      this.toDate = $event.toDate;
    }
  }

  BackToGrid() {
    this.showGrid = true;
    //reset patient on header;
    this.patientService.CreateNewGlobal();
    this.pendingResults = [];
    this.requisitionIdList = [];
    this.GetPendingLabResults(this.fromDate, this.toDate, this.catIdList);
  }

  GetPendingLabResults(frmdate, todate, categoryIdList): void {
    this.pendingResults = [];
    this.labBLService.GetPendingLabResults(frmdate, todate, categoryIdList)
      .finally(() => { this.loading = false })//re-enable button after response comes back.
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results.length) {
            this.pendingResults = res.Results;
            if (!this.changeDetector['destroyed']) {
              this.changeDetector.detectChanges();
            }
            this.pendingResults = this.pendingResults.slice();
          }
          else {
            this.pendingResults = null;
            if (!this.changeDetector['destroyed']) {
              this.changeDetector.detectChanges();
            }
          }

        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to get lab test of patient.. please check log for details."]);
          console.log(res.ErrorMessage);
        }
      });
  }


  PendingResultGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "addresult":
        {

          this.patientService.setGlobal($event.Data);

          this.patientService.getGlobal().PatientId = $event.Data.PatientId;
          this.patientService.getGlobal().ShortName = $event.Data.PatientName;
          this.patientService.getGlobal().PatientCode = $event.Data.PatientCode;
          this.patientService.getGlobal().DateOfBirth = $event.Data.DateOfBirth;
          this.patientService.getGlobal().Gender = $event.Data.Gender;
          this.patientService.getGlobal().WardName = $event.Data.WardName;
          this.patientService.getGlobal().Ins_HasInsurance = $event.Data.HasInsurance;
          //this is removed because it didnt show the two diff. RequisitionID of same TestName of single patient Twice
          //this.requisitionIdList = $event.Data.Tests.map(test => { return test.RequisitionId });
          let reqs = $event.Data.RequisitionIdCSV.split(',');
          reqs.forEach(reqId => {
            if (this.requisitionIdList && this.requisitionIdList.length) {
              if (!this.requisitionIdList.includes(+reqId)) {
                this.requisitionIdList.push(+reqId);
              }
            }
            else {
              this.requisitionIdList.push(+reqId);
            }
          });

          this.verificationRequired = this.coreService.EnableVerificationStep();
          this.showGrid = false;
          this.selectedBarCodeNumber = $event.Data.BarCodeNumber;
          this.showAddEditResult = true;
          this.showReport = false;
        }
        break;

      case "undo":
        {

          this.requisitionIdList = [];
          this.PatientLabInfo.HospitalNumber = $event.Data.PatientCode;

          let dob = $event.Data.DateOfBirth;
          let gender: string = $event.Data.Gender;
          this.PatientLabInfo.Age = this.coreService.CalculateAge(dob);
          if (this.PatientLabInfo.Age) {
            this.PatientLabInfo.AgeSex = this.coreService.FormateAgeSex(this.PatientLabInfo.Age, gender);
          }
          this.PatientLabInfo.Sex = gender;
          this.PatientLabInfo.PatientName = $event.Data.PatientName;
          this.PatientLabInfo.RunNumber = $event.Data.SampleCode;
          this.PatientLabInfo.SampleCodeFormatted = $event.Data.SampleCodeFormatted;
          this.PatientLabInfo.VisitType = $event.Data.VisitType;
          this.PatientLabInfo.BarCodeNumber = $event.Data.BarCodeNumber;
          this.PatientLabInfo.TestName = $event.Data.LabTestCSV;

          let reqs = $event.Data.RequisitionIdCSV.split(',');
          reqs.forEach(reqId => {
            if (this.requisitionIdList && this.requisitionIdList.length) {
              if (!this.requisitionIdList.includes(+reqId)) {
                this.requisitionIdList.push(+reqId);
              }
            }
            else {
              this.requisitionIdList.push(+reqId);
            }
          });

          this.showUndoOption = false;
          this.changeDetector.detectChanges();
          this.showUndoOption = true;

        }
        break;

      case "print-empty-sheet":
        {

          this.requisitionIdList = [];
          let reqs = $event.Data.RequisitionIdCSV.split(',');
          reqs.forEach(reqId => {
            if (this.requisitionIdList && this.requisitionIdList.length) {
              if (!this.requisitionIdList.includes(+reqId)) {
                this.requisitionIdList.push(+reqId);
              }
            }
            else {
              this.requisitionIdList.push(+reqId);
            }
          });

          this.showEmptySheet = false;
          this.changeDetector.detectChanges();
          this.showEmptySheet = true;

        }
        break;


      case "labsticker":
        {
          this.requisitionIdList = [];
          this.PatientLabInfo.HospitalNumber = $event.Data.PatientCode;

          let dob = $event.Data.DateOfBirth;
          let gender: string = $event.Data.Gender;
          this.PatientLabInfo.Age = this.coreService.CalculateAge(dob);
          if (this.PatientLabInfo.Age) {
            this.PatientLabInfo.AgeSex = this.coreService.FormateAgeSex(this.PatientLabInfo.Age, gender);
          }
          this.PatientLabInfo.Sex = gender;
          this.PatientLabInfo.PatientName = $event.Data.PatientName;
          this.PatientLabInfo.RunNumber = $event.Data.SampleCode;
          this.PatientLabInfo.SampleCodeFormatted = $event.Data.SampleCodeFormatted;
          this.PatientLabInfo.VisitType = $event.Data.VisitType;
          this.PatientLabInfo.BarCodeNumber = $event.Data.BarCodeNumber;
          this.PatientLabInfo.TestName = $event.Data.LabTestCSV;
          this.PatientLabInfo.SampleCollectedOnDateTime = moment().format("YYYY-MM-DD HH:mm");

          let reqs = $event.Data.RequisitionIdCSV.split(',');
          reqs.forEach(reqId => {
            if (this.requisitionIdList && this.requisitionIdList.length) {
              if (!this.requisitionIdList.includes(+reqId)) {
                this.requisitionIdList.push(+reqId);
              }
            }
            else {
              this.requisitionIdList.push(+reqId);
            }
          });
          if (this.PatientLabInfo.VisitType.toLocaleLowerCase() == 'inpatient') {
            this.PatientLabInfo.VisitType = 'IP';
          } else {
            this.PatientLabInfo.VisitType = 'OP';
          }

          this.showlabsticker = false;
          this.changeDetector.detectChanges();
          this.showlabsticker = true;


        }
      default:
        break;
    }

  }

  CloseSticker() {
    this.PatientLabInfo = new LabSticker();
    this.requisitionIdList = [];
    this.showlabsticker = false;
  }

  CloseUndoBox() {
    this.PatientLabInfo = new LabSticker();
    this.requisitionIdList = [];
    this.GetPendingLabResults(this.fromDate, this.toDate, this.catIdList);
    this.showUndoOption = false;
  }

  ExitOutCall($event) {
    if ($event.exit) {
      this.PatientLabInfo = new LabSticker();
      this.requisitionIdList = [];
      this.showlabsticker = false;
    }
  }

  ExitOutUndoCall($event) {
    if ($event.exit) {
      if ($event.exit == 'exitonsuccess') {
        this.PatientLabInfo = new LabSticker();
        this.requisitionIdList = [];
        this.GetPendingLabResults(this.fromDate, this.toDate, this.catIdList);
        this.showUndoOption = false;
      }
      else if ($event.exit == 'close') {
        this.CloseUndoBox();
      }

    }
  }

  CancelAction($event) {
    if ($event.cancel) {
      this.BackToGrid();
    }
  }

  public CloseEmptyReportSheetPopUp($event) {
    if ($event.close) { this.CloseEmptySheet(); }
  }

  public CloseWorkListPopUp($event) {
    if ($event.close) { this.CloseWorkSheet(); }
  }

  public CloseEmptySheet() {
    this.showEmptySheet = false;
  }

  public CloseWorkSheet() {
    this.showWorkList = false;
  }

  public GetTestListFilterByCategories() {
    if ((this.fromDate != null) && (this.toDate != null) && (this.catIdList.length > 0)) {
      if (moment(this.fromDate).isBefore(this.toDate) || moment(this.fromDate).isSame(this.toDate)) {
        this.GetPendingLabResults(this.fromDate, this.toDate, this.catIdList);
      } else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Please enter valid From date and To date']);
      }
    }
  }

  public LabCategoryOnChange($event) {
    // this.isInitialLoad = false;
    this.catIdList = [];
    // this.pendingResults = [];
    this.categoryList = [];
    if ($event && $event.length) {
      $event.forEach(v => {
        this.catIdList.push(v.TestCategoryId);
        this.categoryList.push(v);
      })
    }
    if (this.timeId) {
      window.clearTimeout(this.timeId);
      this.timeId = null;
    }
    this.timeId = window.setTimeout(() => {
      if (this.isInitialLoad) {
        this.GetTestListFilterByCategories();
        this.isInitialLoad = false;
      }
    }, 300);
  }

  public ShowWorkList() {
    this.showWorkList = true;
  }

  hotkeys(event) {
    if (event.keyCode == 27) {
      this.CloseSticker();
    }
  }

  ngOnDestroy(): void {
    this.patientService.CreateNewGlobal();
  }
}
