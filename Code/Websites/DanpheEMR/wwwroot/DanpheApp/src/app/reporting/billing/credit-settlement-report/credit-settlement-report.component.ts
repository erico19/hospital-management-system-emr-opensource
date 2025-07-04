import { Component } from "@angular/core";
import * as moment from "moment";
import { CommonFunctions } from "../../../shared/common.functions";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponseText } from "../../../shared/shared-enums";
import { ReportingService } from "../../shared/reporting-service";

@Component({
  selector: 'my-app',
  templateUrl: "./credit-settlement-report.html"
})

// App Component class
export class RPT_BIL_CreditSettlementReport {
  public TodayDate: string = null;
  public toDate: string = null;
  public fromDate: string = null;
  public loading: boolean = false;
  public dateRange: string = "";

  public creditSettlementReportColumns: Array<any> = null;
  public creditSettlementReportData: Array<any> = new Array<any>();
  public SettlementDetail: any = null;

  //   public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();

  public showCreditSettlementDetails: boolean = false;
  gridExportOptions = {
    fileName: 'creditSettlementReport' + moment().format('YYYY-MM-DD') + '.xls'
  };

  constructor(
    public dlService: DLService,
    public msgBoxServ: MessageboxService,
    public reportServ: ReportingService
  ) {
    this.fromDate = this.toDate = this.TodayDate = moment().format('DD-MM-YYYY');
    this.creditSettlementReportColumns = this.reportServ.reportGridCols.BillCreditSettlementReportColumns;

  }

  ngOnInit() {

  }

  public LoadReport() {

    this.dlService.Read("/BillingReports/CreditSettlementReport?FromDate=" + this.fromDate + "&ToDate=" + this.toDate)
      .map(res => res)
      .finally(() => { this.loading = false; })
      .subscribe(res => this.Success(res),
        res => this.Error(res));
  }

  Success(res: any) {
    if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
      this.creditSettlementReportData = res.Results;

      this.creditSettlementReportData.forEach(row => {
        row.CollnFromReceivable = CommonFunctions.parseAmount(row.CollnFromReceivable);
        row.CashDiscountGiven = CommonFunctions.parseAmount(row.CashDiscountGiven);
        row.CashDiscReturn = CommonFunctions.parseAmount(row.CashDiscReturn);
      });

    }
    else {
      this.msgBoxServ.showMessage("failed", [res.ErrorMessage]);
    }
  }

  Error(err: any) {
    this.msgBoxServ.showMessage("error", [err]);
  }

  public CreditSettlementReportGridActions(event: GridEmitModel) {
    if (event) {
      switch (event.Action) {
        case "credit-settlement-view": {
          this.showCreditSettlementDetails = true;
          this.SettlementDetail = event.Data;
          break;
        }
      }
    }
  }
  public OnFromToDateChange(event: any) {
    this.fromDate = event ? event.fromDate : this.fromDate;
    this.toDate = event ? event.toDate : this.toDate;
    this.dateRange = "<b>Date:</b>&nbsp;" + this.fromDate + "&nbsp;<b>To</b>&nbsp;" + this.toDate;
  }

  public SettlementViewDetailCallBack(event: any) {
    if (event) {
      if (event.close == true) {
        this.showCreditSettlementDetails = false;
      }
    }
  }

}