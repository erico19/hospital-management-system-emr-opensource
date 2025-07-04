import { ChangeDetectorRef, Component } from '@angular/core';
import * as moment from 'moment/moment';
import { CoreService } from '../../../core/shared/core.service';
import { SecurityService } from '../../../security/shared/security.service';
import { CommonFunctions } from '../../../shared/common.functions';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_DateTimeFormat, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { Hospital_DTO } from '../../settings/shared/dto/hospitals.dto';
import { FiscalYearModel } from '../../settings/shared/fiscalyear.model';
import { AccountingService } from '../../shared/accounting.service';
import { AccountingReportsBLService } from "../shared/accounting-reports.bl.service";
@Component({
    selector: 'my-app',
    templateUrl: "./cashflow-report.html"
})
export class CashFlowReportComponent {
    public fromDate: string = null;
    public toDate: string = null;
    public cashflowData: any;
    public fiscalYears: Array<FiscalYearModel> = new Array<FiscalYearModel>();
    public selFiscalYear: number = 0;
    public InflowData: any;
    public OutflowData: any;
    public showResult: boolean = false;
    public IsLedgerLevel: boolean = true;
    public showExportbtn: boolean = false;
    //public data = new ModelData();
    btndisabled = false;
    public showPrint: boolean = false;
    public printDetaiils: any;
    public dateRange: string = null;
    public OpeningData: number = 0;
    public SelectedHospital: number = 0;
    public HospitalList: Array<Hospital_DTO> = new Array<Hospital_DTO>();
    public HospitalId: number = 1;
    public ActiveHospital: number = 0;

    constructor(
        public coreservice: CoreService,
        public accountingService: AccountingService,
        public securityService: SecurityService,
        public messageBoxService: MessageboxService,
        public accReportBLService: AccountingReportsBLService,
        private changeDetector: ChangeDetectorRef) {
        this.fromDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
        this.toDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
        this.loadFiscalYearList();
        this.showExport();
        //this.LoadCalendarTypes();         
        this.calType = this.coreservice.DatePreference;
        this.accountingService.getCoreparameterValue();
        this.CheckAndAssignHospital();

    }
    CheckAndAssignHospital() {
        this.ActiveHospital = this.securityService.AccHospitalInfo.ActiveHospitalId;
        this.HospitalList = this.accountingService.accCacheData.Hospitals ? this.accountingService.accCacheData.Hospitals : [];
        if (this.HospitalList.length === 1) {
            this.SelectedHospital = this.HospitalList[0].HospitalId;
        } else {
            this.SelectedHospital = this.ActiveHospital;
        }
    }
    public fiscalYearId: number = null;
    public validDate: boolean = true;
    selectDate(event) {
        if (event) {
            this.fromDate = event.fromDate;
            this.toDate = event.toDate;
            this.fiscalYearId = event.fiscalYearId;
            this.validDate = true;
            this.dateRange = "<b>Date:</b>&nbsp;" + this.fromDate + "&nbsp;<b>To</b>&nbsp;" + this.toDate;
        }
        else {
            this.validDate = false;
        }
    }
    public calType: string = "";
    //loads CalendarTypes from Paramter Table (database) and assign the require CalendarTypes to local variable.
    LoadCalendarTypes() {
        let Parameter = this.coreservice.Parameters;
        Parameter = Parameter.filter(parms => parms.ParameterName == "CalendarTypes");
        let calendarTypeObject = JSON.parse(Parameter[0].ParameterValue);
        this.calType = calendarTypeObject.AccountingModule;
    }
    //Load cash flow data
    LoadData() {
        this.btndisabled = true;
        this.HospitalId = this.SelectedHospital;
        if (this.ValidDateCheck()) {
            try {
                this.accReportBLService.GetCashFlowReportData(this.fromDate, this.toDate, this.fiscalYearId, this.HospitalId)
                    .subscribe(res => {
                        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                            this.btndisabled = false;
                            this.OpeningData = res.Results.OpeningData;
                            this.cashflowData = res.Results.TxnData;
                            let str = "";
                            for (let value of Object.values(this.cashflowData)) {
                                str += Object.values(value);
                            }
                            if (str !== "" && str !== null) {
                                this.cashflowData = JSON.parse(str);
                            }
                            this.CalculateTotalAmounts();
                            this.formatDataforDisplay();
                            this.showResult = true;
                        }
                        else {
                            this.btndisabled = false;
                            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${res.ErrorMessage}`])
                        }
                    }
                    );
            }
            catch (exception) {
                this.ShowCatchErrMessage(exception);
            }
        }
        else {
            this.btndisabled = false;
        }

    }
    OutputMethod(res: any) {
        let result = res.Results;
    }

    //this is temporary solution for check valid date
    //need to check proper
    ValidDateCheck(): boolean {
        if (this.fromDate.toString().length <= 0) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['From Date required']);
            return false;
        }
        if (this.toDate.toString().length <= 0) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['To Date required']);
            return false;
        }
        if (!this.HospitalId) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ['Please select Account Section']);
            return false;
        }
        return true;
    }
    //Export data grid options for excel file
    gridExportOptions = {
        fileName: 'AccountingCashFlowReport_' + moment().format(ENUM_DateTimeFormat.Year_Month_Day) + '.xls',
    };

    //This function only for show catch messages
    ShowCatchErrMessage(exception) {
        if (exception) {
            let ex: Error = exception;
            this.messageBoxService.showMessage("error", ["Check error in Console log !"]);
            console.log("Error Messsage =>  " + ex.message);
            console.log("Stack Details =>   " + ex.stack);
        }
    }

    CalculateTotalAmounts() {
        let InTotal = 0;
        let OutTotal = 0;
        let OpeningBal = 0;
        let CloseBal = 0;
        let NetInflow = 0;
        for (var i = 0; i < this.cashflowData.length; i++) {
            for (var j = 0; j < this.cashflowData[i].COAList.length; j++) {
                var TypeInAmt = 0;
                var TypeOutAmt = 0;
                var OpBal = 0;
                //var ClBal = 0;
                for (var k = 0; k < (this.cashflowData[i].COAList[j].LedgerGroupList ? this.cashflowData[i].COAList[j].LedgerGroupList.length : 0); k++) {
                    if (this.cashflowData[i].COAList[j].LedgerGroupList[k].LedgersList) {
                        for (var l = 0; l < this.cashflowData[i].COAList[j].LedgerGroupList[k].LedgersList.length; l++) {
                            TypeInAmt += this.cashflowData[i].COAList[j].LedgerGroupList[k].LedgersList[l].Amountdr;
                            TypeOutAmt += this.cashflowData[i].COAList[j].LedgerGroupList[k].LedgersList[l].Amountcr;
                            // OpBal += this.cashflowData[i].COAList[j].LedgerGroupList[k].LedgersList[l].OpenBal;
                            // ClBal += this.cashflowData[i].COAList[j].LedgersList[k].CloseBal;
                        }
                    }
                    this.cashflowData[i].COAList[j]["TypeLedgerGroupDrTotal"] = CommonFunctions.parseAmount(TypeInAmt);
                    this.cashflowData[i].COAList[j]["TypeLedgerGroupCrTotal"] = CommonFunctions.parseAmount(TypeOutAmt);
                }
                this.cashflowData[i].COAList[j]["TypeDrTotal"] = CommonFunctions.parseAmount(TypeInAmt);
                this.cashflowData[i].COAList[j]["TypeCrTotal"] = CommonFunctions.parseAmount(TypeOutAmt);
                InTotal += TypeInAmt;
                OutTotal += TypeOutAmt;
                OpeningBal += OpBal;
                // CloseBal += ClBal;               
            }
        }
        OpeningBal = this.OpeningData && this.OpeningData[0].OpeningBalance;
        NetInflow = InTotal - OutTotal;
        CloseBal = OpeningBal + NetInflow;
        this.cashflowData["Netinflow"] = CommonFunctions.parseAmount(NetInflow);
        this.cashflowData["OpeningBalance"] = CommonFunctions.parseAmount(OpeningBal);
        this.cashflowData["ClosingBalance"] = CommonFunctions.parseAmount(CloseBal);
        this.cashflowData["InTotalAmt"] = CommonFunctions.parseAmount(InTotal);
        this.cashflowData["OutTotalAmt"] = CommonFunctions.parseAmount(OutTotal);

    }

    loadFiscalYearList() {
        if (!!this.accountingService.accCacheData.FiscalYearList && this.accountingService.accCacheData.FiscalYearList.length > 0) {//mumbai-team-june2021-danphe-accounting-cache-change
            this.fiscalYears = this.accountingService.accCacheData.FiscalYearList;//mumbai-team-june2021-danphe-accounting-cache-change
            this.fiscalYears = this.fiscalYears.slice();//mumbai-team-june2021-danphe-accounting-cache-change
        }
    }

    formatDataforDisplay() {
        this.OutflowData = [];
        this.InflowData = [];
        this.cashflowData.forEach(a => {
            a.COAList.forEach(b => {
                if (b.TypeCrTotal > 0) {
                    this.OutflowData = this.pushToList(this.OutflowData, b.COA, b.TypeCrTotal, "BoldCategory", 0);
                    b.LedgerGroupList.forEach(b => {
                        this.OutflowData = this.pushToList(this.OutflowData, b.LedgerGroupName, b.TypeLedgerGroupCrTotal, "LedgerGroup", 0);
                        if (b.LedgersList) {
                            b.LedgersList.forEach(c => {
                                //  if (c.LedgerGroupName != "Cash" && c.Amountcr > 0)
                                this.OutflowData = this.pushToList(this.OutflowData, c.LedgerName, CommonFunctions.parseAmount(c.Amountcr), "LedgerLevel", c.Code);
                            });
                        }
                    });
                }
            });
            a.COAList.forEach(b => {
                if (b.TypeDrTotal > 0) {
                    this.InflowData = this.pushToList(this.InflowData, b.COA, b.TypeDrTotal, "BoldCategory", 0);
                    b.LedgerGroupList.forEach(b => {
                        this.InflowData = this.pushToList(this.InflowData, b.LedgerGroupName, b.TypeLedgerGroupDrTotal, "LedgerGroup", 0);
                        if (b.LedgersList) {
                            b.LedgersList.forEach(c => {
                                // if (c.LedgerGroupName != "Cash" && c.Amountdr > 0)
                                this.InflowData = this.pushToList(this.InflowData, c.LedgerName, CommonFunctions.parseAmount(c.Amountdr), "LedgerLevel", c.Code);

                            });
                        }
                    });
                }
            });
        });
        this.cashflowData = this.pushToList(this.cashflowData, "Net Inflow", this.cashflowData.Netinflow, "BoldCategory", 0);
        this.cashflowData = this.pushToList(this.cashflowData, "Opening Balance", this.cashflowData.OpeningBalance, "BoldCategory", 0);
        this.cashflowData = this.pushToList(this.cashflowData, "Closing Balance", this.cashflowData.ClosingBalance, "BoldCategory", 0);
        this.InflowData = this.pushToList(this.InflowData, "Total", this.cashflowData.InTotalAmt, "BoldTotal", 0);
        this.OutflowData = this.pushToList(this.OutflowData, "Total", this.cashflowData.OutTotalAmt, "BoldTotal", 0);

    }
    Print(tableId) {

        // var printContents = '<b>Report Date Range: ' + this.fromDate + ' To ' + this.toDate + '</b>';
        // printContents += document.getElementById("printpage").innerHTML;
        // this.showPrint = false;
        // this.printDetaiils = null;
        // this.changeDetector.detectChanges();
        // this.showPrint = true;
        // this.printDetaiils =  printContents ; //document.getElementById("printpage");
        this.accountingService.Print(tableId, this.dateRange);
    }

    ExportToExcel(tableId) {
        // if (tableId) {
        //     let workSheetName = 'Cash Flow Report';
        //     let Heading = 'Cash Flow Report';
        //     let filename = 'CashFlowReport';
        //     //NBB-send all parameters for now 
        //     //need enhancement in this function 
        //     //here from date and todate for show date range for excel sheet data
        //     CommonFunctions.ConvertHTMLTableToExcel(tableId, this.fromDate, this.toDate, workSheetName,
        //         Heading, filename);
        // }
        this.accountingService.ExportToExcel(tableId, this.dateRange);
    }
    //common function for foramtting
    //it takes source list, name, amount and style string then return by attaching obj to it.
    pushToList(list, name, amt, style, code) {
        let Obj = new Object();
        Obj["Name"] = name;
        Obj["Amount"] = amt;
        Obj["Style"] = style;
        Obj["Code"] = code;
        list.push(Obj);

        return list;
    }

    showExport() {

        let exportshow = this.coreservice.Parameters.find(a => a.ParameterName == "AllowOtherExport" && a.ParameterGroupName == "Accounting").ParameterValue;
        if (exportshow == "true") {
            this.showExportbtn = true;
        }
        else {
            this.showExportbtn = false;
        }
    }


}
