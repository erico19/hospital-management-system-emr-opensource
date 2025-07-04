import { ChangeDetectorRef, Component } from '@angular/core';
import { CoreService } from '../../../core/shared/core.service';
import { SecurityService } from '../../../security/shared/security.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { Hospital_DTO } from '../../settings/shared/dto/hospitals.dto';
import { AccountingService } from '../../shared/accounting.service';
import { AccountingReportsBLService } from "../shared/accounting-reports.bl.service";
import { TrialBalanceReportVM } from "../shared/trial-balance-reportvm.model";

@Component({
  selector: 'my-app',
  templateUrl: "./trail-balance-report.html"
})

export class TrailBalanceReportComponent {

  public reportData: Array<TrialBalanceReportVM> = new Array<TrialBalanceReportVM>();
  public TotalDrCr: Array<any> = [];
  public fromDate: string = null;
  public toDate: string = null;
  public IsDetailsView: boolean = false;
  public showLedgerDetail: boolean = false;
  public ledgerId: number = 0;
  public ledgerName: string = '';
  public IsShowReport: boolean = false;
  // public dateRange: string = null;
  public IsDataLoaded: boolean = false;
  public showExportbtn: boolean = false;
  public ledgerCode: any;
  public showPrint: boolean = false;
  public printDetaiils: any;
  public fiscalYearId: number = 0;
  public showDrCrValuesForTxn = false;
  btndisabled = false;
  public IsZeroAmountRecords: boolean = false;
  public dateRange: string = '';
  public SelectedHospital: number = 0;
  public HospitalList: Array<Hospital_DTO> = new Array<Hospital_DTO>();
  public HospitalId: number = 0;
  public ActiveHospital: number = 0;
  public Format: string = "1";
  public Format2TotalDrCr: Array<number> = Array(6).fill(0);

  constructor(
    public msgBoxServ: MessageboxService,
    public accountingService: AccountingService,

    public coreservice: CoreService,
    public securityService: SecurityService,
    public accReportBLServ: AccountingReportsBLService, private changeDetector: ChangeDetectorRef,
    public accService: AccountingService) {
    //this.dateRange = "today";
    this.showExport();
    this.showDrCrValues();
    this.getCoreParameters();
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
  //event onDateChange
  onDateChange($event) {
    this.IsShowReport = false;
    this.fromDate = $event.fromDate;
    this.toDate = $event.toDate;
    var type = $event.type;
    this.checkDateValidation();
    this.reportData = new Array<TrialBalanceReportVM>();
    if (type != "custom") {
      this.GetTrialBalanceRpt();
    }
  }

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

  GetTrialBalanceRpt() {
    this.btndisabled = true;
    this.HospitalId = this.SelectedHospital;
    if (this.checkDateValidation()) {
      this.accReportBLServ.GetTrailBalanceReport(this.fromDate, this.toDate, this.fiscalYearId, this.HospitalId).subscribe(res => {
        if (res.Status == "OK") {
          this.btndisabled = false;
          this.IsShowReport = true;
          this.MapAndMakeTrialReport(res.Results);
        }
        else {
          this.btndisabled = false;
          this.msgBoxServ.showMessage("failed", [res.ErrorMessage]);
        }
      });
    }
    else {
      this.btndisabled = false;
      this.IsShowReport = false;
    }
  }
  checkDateValidation() {
    let flag = true;
    if (!this.validDate) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Select proper date.']);
      flag = false;
    }
    if (!this.HospitalId) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Please select Account Section']);
      flag = false;
    }
    return flag;
  }

  MapAndMakeTrialReport(trialReportData) {
    for (let i = 0; i < 6; i++) {
      this.TotalDrCr[i] = 0;
    }
    this.Format2TotalDrCr.fill(0);
    try {
      let rowData = trialReportData;
      this.reportData = new Array<TrialBalanceReportVM>();
      if (rowData.length > 0) {
        rowData.forEach(row => {
          let parent = new TrialBalanceReportVM();
          //parent level is COA
          parent.level = "COA";
          parent.Particulars = row.Particulars;
          parent.OpeningCr = parent.OpeningDr = parent.OpeningTotal = 0;
          parent.CurrentCr = parent.CurrentDr = 0;
          parent.TotalDr = parent.TotalCr = 0;
          parent.Balance = 0;
          this.reportData.push(parent);//push parent to list

          row.LedgerGroupList.forEach(ledgerGroup => {
            let child = new TrialBalanceReportVM();
            //child level is LedgerGroup
            child.level = "LedgerGroup";
            child.Particulars = ledgerGroup.Particulars;
            child.OpeningCr = child.OpeningDr = child.OpeningTotal = 0;
            child.CurrentCr = child.CurrentDr = 0;
            child.TotalDr = child.TotalCr = 0;
            child.Balance = 0;
            this.reportData.push(child);//push child to list

            ledgerGroup.LedgerList.forEach(ledger => {
              let subChild = new TrialBalanceReportVM();
              //subchild Level is Ledger
              subChild.level = "Ledger";
              subChild.Particulars = ledger.Particulars;
              subChild.Code = ledger.Code;
              subChild.LedgerId = ledger.LedgerId;
              subChild.Balance = 0;
              ledger.OpeningDr = ledger.OpeningDr + ledger.OpeningBalDr;
              ledger.OpeningCr = ledger.OpeningCr + ledger.OpeningBalCr;
              //calculate opening Debit/Credit balance (upto fromDate)
              if (ledger.OpeningDr >= ledger.OpeningCr) {
                subChild.OpeningDr = ledger.OpeningDr - ledger.OpeningCr;
                subChild.OpeningCr = 0;
                subChild.OpeningBalType = "Dr";
                subChild.OpeningTotal = subChild.OpeningDr;
              } else {
                subChild.OpeningCr = ledger.OpeningCr - ledger.OpeningDr;
                subChild.OpeningDr = 0;
                subChild.OpeningBalType = "Cr";
                subChild.OpeningTotal = subChild.OpeningCr;
              }
              if (subChild.OpeningTotal > 0 && subChild.OpeningTotal < 1) {
                subChild.OpeningTotal = 0;
              }

              //calculate current Debit/Credit balance (fromDate to toDate)
              //NageshBB:20May2021-changes as per charak requirement to show both debit and credit amount for transaction             
              if (this.showDrCrValuesForTxn == true) {
                subChild.CurrentDr = ledger.CurrentDr;
                subChild.CurrentCr = ledger.CurrentCr;
              } else {
                if (ledger.CurrentDr >= ledger.CurrentCr) {
                  subChild.CurrentDr = ledger.CurrentDr - ledger.CurrentCr;
                  subChild.CurrentCr = 0;
                } else {
                  subChild.CurrentCr = ledger.CurrentCr - ledger.CurrentDr;
                  subChild.CurrentDr = 0;
                }
              }


              //calculate total of subChild Dr/Cr
              subChild.TotalDr = subChild.CurrentDr + subChild.OpeningDr;
              subChild.TotalCr = subChild.CurrentCr + subChild.OpeningCr;

              //calculate balance of subChild Dr and Cr
              if (subChild.TotalDr >= subChild.TotalCr) {
                subChild.Balance = subChild.TotalDr - subChild.TotalCr;
                subChild.BalanceType = "Dr";
              } else {
                subChild.Balance = subChild.TotalCr - subChild.TotalDr;
                subChild.BalanceType = "Cr";
              }

              subChild.ClosingDr = subChild.TotalDr;
              subChild.ClosingCr = subChild.TotalCr;
              if (subChild.Balance > 0 && subChild.Balance < 1) {
                subChild.Balance = 0;
              }

              if (ledger.Details.length > 0) {
                for (let i = 0; i < ledger.Details.length; i++) {
                  if (ledger.Details[i].Dr >= ledger.Details[i].Cr) {
                    ledger.Details[i].Dr = ledger.Details[i].Dr - ledger.Details[i].Cr;
                    ledger.Details[i].Cr = 0;
                  }
                  else {
                    ledger.Details[i].Cr = ledger.Details[i].Cr - ledger.Details[i].Dr;
                    ledger.Details[i].Dr = 0;
                  }
                }
                subChild.Details = ledger.Details;
              }
              // if (subChild.OpeningCr != subChild.OpeningDr || subChild.CurrentCr != subChild.CurrentDr) {
              //   this.reportData.push(subChild);//push subchild
              // }
              this.reportData.push(subChild)

              //add current Dr/Cr of subchild to current Dr/Cr of child
              child.CurrentDr = child.CurrentDr + subChild.CurrentDr;
              child.CurrentCr = child.CurrentCr + subChild.CurrentCr;
              //calculate opening Debit/Credit balance (upto fromDate)
              child.OpeningDr = child.OpeningDr + subChild.OpeningDr;
              child.OpeningCr = child.OpeningCr + subChild.OpeningCr;
              if (child.OpeningDr > child.OpeningCr) {
                child.OpeningTotal = child.OpeningDr - child.OpeningCr;
                child.OpeningBalType = "Dr";
              } else {
                child.OpeningTotal = child.OpeningCr - child.OpeningDr;
                child.OpeningBalType = "Cr";
              }
              if (child.OpeningTotal > 0 && child.OpeningTotal < 1) {
                child.OpeningTotal = 0;
              }
            });
            //calculate total of child Dr/Cr
            child.TotalDr = child.OpeningDr + child.CurrentDr;
            child.TotalCr = child.OpeningCr + child.CurrentCr;

            //calculate total balance of child Dr and Cr            
            if (child.TotalDr >= child.TotalCr) {
              child.Balance = child.TotalDr - child.TotalCr;
              child.BalanceType = "Dr";
            } else {
              child.Balance = child.TotalCr - child.TotalDr;
              child.BalanceType = "Cr";
            }
            child.ClosingDr = child.TotalDr;
            child.ClosingCr = child.TotalCr;
            if (child.Balance > 0 && child.Balance < 1) {
              child.Balance = 0;
            }

            //add current Dr/Cr of child to current Dr/Cr of parent
            parent.CurrentDr = parent.CurrentDr + child.CurrentDr;
            parent.CurrentCr = parent.CurrentCr + child.CurrentCr;
            //calculate opening Debit/Credit balance (upto fromDate)
            parent.OpeningDr = parent.OpeningDr + child.OpeningDr;
            parent.OpeningCr = parent.OpeningCr + child.OpeningCr;
            if (parent.OpeningDr > parent.OpeningCr) {
              parent.OpeningTotal = parent.OpeningDr - parent.OpeningCr;
              parent.OpeningBalType = "Dr";
            } else {
              parent.OpeningTotal = parent.OpeningCr - parent.OpeningDr;
              parent.OpeningBalType = "Cr";
            }
            if (parent.OpeningTotal > 0 && parent.OpeningTotal < 1) {
              parent.OpeningTotal = 0;
            }

          });
          //calculate total of parent Dr/Cr
          parent.TotalDr = parent.OpeningDr + parent.CurrentDr;
          parent.TotalCr = parent.OpeningCr + parent.CurrentCr;

          //calculate total balance  of parent Dr and Cr
          if (parent.TotalDr >= parent.TotalCr) {
            parent.Balance = parent.TotalDr - parent.TotalCr;
            parent.BalanceType = "Dr";
          } else {
            parent.Balance = parent.TotalCr - parent.TotalDr;
            parent.BalanceType = "Cr";
          }
          parent.ClosingDr = parent.TotalDr;
          parent.ClosingCr = parent.TotalCr;

          if (parent.Balance > 0 && parent.Balance < 1) {
            parent.Balance = 0;
          }

          //add all Debit and Substract all Credit.
          if (parent.OpeningBalType == "Dr") {

            this.TotalDrCr[0] = this.TotalDrCr[0] + parent.OpeningTotal;
          }
          else {
            this.TotalDrCr[0] = this.TotalDrCr[0] - parent.OpeningTotal;
          }

          this.Format2TotalDrCr[0] = this.Format2TotalDrCr[0] + parent.OpeningDr;
          this.Format2TotalDrCr[1] = this.Format2TotalDrCr[1] + parent.OpeningCr;

          //grandtotal for current Dr/Cr
          this.TotalDrCr[2] = this.TotalDrCr[2] + parent.CurrentDr;
          this.TotalDrCr[3] = this.TotalDrCr[3] + parent.CurrentCr;

          this.Format2TotalDrCr[2] = this.TotalDrCr[2];
          this.Format2TotalDrCr[3] = this.TotalDrCr[3];

          //add all Debit and Substract all Credit.
          if (parent.BalanceType == "Dr") {
            this.TotalDrCr[4] = this.TotalDrCr[4] + parent.Balance;
          }
          else {
            this.TotalDrCr[4] = this.TotalDrCr[4] - parent.Balance;
          }
          this.Format2TotalDrCr[4] = this.Format2TotalDrCr[4] + parent.ClosingDr;
          this.Format2TotalDrCr[5] = this.Format2TotalDrCr[5] + parent.ClosingCr;

        });


        if (this.TotalDrCr[4]) {

          //if total is positive then it's Dr, else it's Cr
          if (this.TotalDrCr[4] > 0) {
            this.TotalDrCr[5] = "Dr";
          }
          else {
            this.TotalDrCr[4] = -(this.TotalDrCr[4]);
            this.TotalDrCr[5] = "Cr";
          }
        }

        if (this.TotalDrCr[0]) {

          //if total is positive then it's Dr, else it's Cr
          if (this.TotalDrCr[0] > 0) {
            this.TotalDrCr[1] = "Dr";
          }
          else {
            this.TotalDrCr[0] = -(this.TotalDrCr[0]);
            this.TotalDrCr[1] = "Cr";
          }
        }
        if (this.TotalDrCr[4] > 0 && this.TotalDrCr[4] < 1) {
          this.TotalDrCr[4] = 0;
        }

        if (this.TotalDrCr[0] > 0 && this.TotalDrCr[0] < 1) {
          this.TotalDrCr[0] = 0;
        }

      } else {
        this.msgBoxServ.showMessage("notice", ['NO RECORD FOUND']);
      }
    } catch (ex) {
      console.log(ex);
    }
  }
  Print(tableId) {
    // let popupWinindow;
    // var headerContent = document.getElementById("headerForPrint").innerHTML;
    // var printContents = '<b>Report Date Range: ' + this.fromDate + ' To ' + this.toDate + '</b>';
    // printContents += '<style> table { border-collapse: collapse; border-color: black; } th { color:black; background-color: #599be0; } </style>';
    // printContents += document.getElementById("printpage").innerHTML;  
    // this.showPrint = false;
    // this.printDetaiils = null;
    // this.changeDetector.detectChanges();
    // this.showPrint = true;
    // this.printDetaiils = headerContent + printContents ; //document.getElementById("printpage");
    this.accService.Print(tableId, this.dateRange);

  }

  ExportToExcel(tableId) {
    // if (tableId) {
    //   let workSheetName = 'Trial Balance Report';
    //   let Heading = 'Trial Balance Report';
    //   let filename = 'TrialBalanceReport';
    //   //NBB-send all parameters for now 
    //   //need enhancement in this function 
    //   //here from date and todate for show date range for excel sheet data
    //   CommonFunctions.ConvertHTMLTableToExcel(tableId, this.fromDate, this.toDate, workSheetName,
    //     Heading, filename);
    // }
    this.accService.ExportToExcel(tableId, this.dateRange);
  }
  SwitchViews(row) {
    this.ledgerId = row.LedgerId;
    this.ledgerName = row.Particulars;
    this.ledgerCode = row.Code;
    this.showLedgerDetail = true;
  }
  ShowReport($event) {
    this.showLedgerDetail = false;
  }
  showChild(row, level) {
    let flag = 1;
    for (let i = 0; i < this.reportData.length; i++) {
      if (flag == 0) {
        if (level == 'COA') {
          this.reportData[i].ShowLedgerGroup = (this.reportData[i].ShowLedgerGroup == true) ? false : true;
          if (this.reportData[i].ShowLedgerGroup == false) {
            this.reportData[i + 1].ShowLedger = false;
          }
          if (this.reportData[i].level == 'COA') {
            break;
          }
        }
        else {
          this.reportData[i].ShowLedger = (this.reportData[i].ShowLedger == true) ? false : true;
          if (this.reportData[i].level == 'LedgerGroup') {
            break;
          }
        }
      }
      if (this.reportData[i] == row) {
        flag = 0;
      }
    }
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
  showDrCrValues() {
    let flag = this.coreservice.Parameters.find(a => a.ParameterName == "ShowCurrentDrCrBothInTrialBalRpt" && a.ParameterGroupName == "Accounting").ParameterValue;
    if (flag == "true") {
      this.showDrCrValuesForTxn = true;
    }
    else {
      this.showDrCrValuesForTxn = false;
    }
  }
  getCoreParameters() {
    this.accService.getCoreparameterValue();
  }

  OnHospitalChange() {
    this.reportData = [];
    this.TotalDrCr = [];
    this.IsShowReport = false;
  }
}
