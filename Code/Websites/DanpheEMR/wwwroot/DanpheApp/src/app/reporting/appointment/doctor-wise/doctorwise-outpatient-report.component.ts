import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import * as moment from 'moment/moment';
import { CoreService } from '../../../core/shared/core.service';
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText } from '../../../shared/shared-enums';
import { RPT_SchemeDTO } from '../../shared/dto/scheme.dto';
import { ReportingService } from "../../shared/reporting-service";
import { RPT_APPT_DoctorWiseOutPatientReportModel } from './doctorwise-outpatient-report.model';

@Component({
  templateUrl: "./doctorwise-outpatient-report.html"
})
export class RPT_APPT_DoctorwiseOutPatientReportComponent {
  public fromDate: string = null;
  public toDate: string = null;
  public calType: string = "";
  public currentDrPatReport: RPT_APPT_DoctorWiseOutPatientReportModel = new RPT_APPT_DoctorWiseOutPatientReportModel();
  public showReport: boolean = false;
  ReportData: Array<any> = new Array<any>();
  dlService: DLService = null;
  http: HttpClient = null;
  public headerDetail: any = null;
  public currentDate: string = "";
  public totalNewPatientCount: number = 0;
  public totalFollowUpPatientCount: number = 0;
  TotalRevisitPatientCount: number = 0;
  TotalReferralPatientCount: number = 0;
  Schemes = new Array<RPT_SchemeDTO>();
  SelectedScheme = new RPT_SchemeDTO();

  constructor(
    _http: HttpClient,
    _dlService: DLService,
    public msgBoxServ: MessageboxService,
    private _reportingService: ReportingService,
    public coreservice: CoreService) {
    this.http = _http;
    this.dlService = _dlService;
    this.LoadHeaderDetailsCalenderTypes();
    this.currentDrPatReport.fromDate = moment().format('YYYY-MM-DD');
    this.currentDrPatReport.toDate = moment().format('YYYY-MM-DD');
    this.currentDate = moment().format('YYYY-MM-DD');
    this.Schemes = this._reportingService.SchemeList;
  }

  Load() {
    if (this.currentDrPatReport.fromDate != null && this.currentDrPatReport.toDate != null) {
      this.dlService.Read("/Reporting/DoctorwiseOutPatientReport?FromDate="
        + this.currentDrPatReport.fromDate + "&ToDate=" + this.currentDrPatReport.toDate + "&SchemeId=" + this.currentDrPatReport.SchemeId)
        .map(res => res)
        .subscribe(res => this.Success(res),
          res => this.Error(res));
    } else {
      this.msgBoxServ.showMessage("error", ['Dates Provided is not Proper']);
    }
  }

  Error(err) {
    this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
  }

  Success(res) {
    this.totalFollowUpPatientCount = 0;
    this.totalNewPatientCount = 0;
    this.TotalReferralPatientCount = 0;
    this.TotalRevisitPatientCount = 0;
    this.ReportData = [];
    if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
      if (res.Results.length > 0) {
        this.ReportData = res.Results;
        this.showReport = true;
        this.ReportData.forEach(x => {
          this.totalFollowUpPatientCount += x.FOLLOWUP;
          this.totalNewPatientCount += x.NEW;
          this.TotalReferralPatientCount += x.REFERRAL;
          this.TotalRevisitPatientCount += x.REVISIT
        });
      }
      else {
        this.msgBoxServ.showMessage("notice-message", ['Data is Not Available Between Selected dates...Try Different Dates']);
      }
    }
    else {
      this.msgBoxServ.showMessage("failed", [res.ErrorMessage]);
    }
  }

  LoadHeaderDetailsCalenderTypes() {
    let allParams = this.coreservice.Parameters;
    if (allParams.length) {
      let CalParms = allParams.find(a => a.ParameterName == "CalendarTypes" && a.ParameterGroupName == "Common");
      if (CalParms) {
        let Obj = JSON.parse(CalParms.ParameterValue);
        this.calType = Obj.DoctorOutPatientReport;
      }
      let HeaderParms = allParams.find(a => a.ParameterGroupName == "Common" && a.ParameterName == "CustomerHeader");
      if (HeaderParms) {
        this.headerDetail = JSON.parse(HeaderParms.ParameterValue);
      }
    }
  }

  Print() {
    let popupWinindow;
    var printContents = document.getElementById("printPage").innerHTML;
    popupWinindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
    popupWinindow.document.open();
    let documentContent = "<html><head>";
    documentContent += '<link rel="stylesheet" type="text/css" media="print" href="../../../themes/theme-default/DanphePrintStyle.css"/>';
    documentContent += '<link rel="stylesheet" type="text/css" href="../../../themes/theme-default/DanpheStyle.css"/>';
    documentContent += '<link rel="stylesheet" type="text/css" href="../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>';
    documentContent += '</head>';
    documentContent += '<body onload="window.print()">' + printContents + '</body></html>'
    popupWinindow.document.write(documentContent);
    popupWinindow.document.close();
  }

  //Anjana:11June'20--reusable From-ToDate-In Reports..
  OnFromToDateChange($event) {
    this.fromDate = $event ? $event.fromDate : this.fromDate;
    this.toDate = $event ? $event.toDate : this.toDate;

    this.currentDrPatReport.fromDate = this.fromDate;
    this.currentDrPatReport.toDate = this.toDate;
  }

  SchemeFormatter(data: any): string {
    let html = data["SchemeName"];
    return html;
  }

  OnSchemeChange(): void {
    if (this.SelectedScheme && typeof (this.SelectedScheme) === "object" && this.SelectedScheme.SchemeId) {
      this.currentDrPatReport.SchemeId = this.SelectedScheme.SchemeId;
    }
    else {
      this.SelectedScheme = new RPT_SchemeDTO();
      this.currentDrPatReport.SchemeId = null;
    }
  }
}
