import { ChangeDetectorRef, Component, Input } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import * as moment from 'moment/moment';
import { CoreService } from "../../../core/shared/core.service";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { IGridFilterParameter } from "../../../shared/danphe-grid/grid-filter-parameter.interface";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import { PharmacyService } from "../../shared/pharmacy.service";
import { PHRMGoodsReceiptModel } from "../../shared/phrm-goods-receipt.model";
import PHRMGridColumns from '../../shared/phrm-grid-columns';
import { PHRMSupplierModel } from "../../shared/phrm-supplier.model";

@Component({
      selector: 'good-receipt',
      templateUrl: "./phrm-goods-receipt-list.html"
})
export class PHRMGoodsReceiptListComponent {
      currentGRdetails: PHRMGoodsReceiptModel = new PHRMGoodsReceiptModel();
      goodsReceiptList: Array<PHRMGoodsReceiptModel> = new Array<PHRMGoodsReceiptModel>();
      filterGoodsReceiptList: Array<PHRMGoodsReceiptModel> = new Array<PHRMGoodsReceiptModel>();
      newGoodsReceiptList: Array<PHRMGoodsReceiptModel> = new Array<PHRMGoodsReceiptModel>();
      supplierList: Array<PHRMSupplierModel> = new Array<PHRMSupplierModel>();
      goodsreceiptsGridColumns: Array<any> = null;
      fromDate: string = moment().format('YYYY-MM-DD ');
      toDate: string = moment().format('YYYY-MM-DD ');

      fromDay: number = 0;
      toDay: number = 0;
      supplierId: number = null;
      totalAmount: number = null;
      subTotal: number = null;
      discountTotal: number = null;
      vatTotal: number;
      currentSupplier: PHRMSupplierModel = new PHRMSupplierModel();
      showNepaliReceipt: boolean;
      IsitemlevlDis: boolean = false;
      IsPkgitem: boolean = false;
      showPopUp: boolean = false;
      dateRange: string = null;
      NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
      headerDetail: { hospitalName, address, email, PANno, tel, DDA };
      gridExportOptions = { fileName: 'PharmacyGoodReceiptLists_' + moment().format('YYYY-MM-DD') + '.xls', };
      goodReceiptStatus: string = "all";
      @Input("showHeader")
      public showHeader: boolean = true;
      showGoodReceiptAddEditPage: boolean = false;
      FilterParameters: IGridFilterParameter[] = [];
      public footerContent = '';
      EnableAdjustmentEdit: boolean = false;

      constructor(public coreService: CoreService,
            public pharmacyBLService: PharmacyBLService,
            public pharmacyService: PharmacyService,
            public changeDetector: ChangeDetectorRef,
            public msgBoxServ: MessageboxService,
            public router: Router, public route: ActivatedRoute) {
            this.dateRange = 'last1Week';
            this.NepaliDateInGridSettings.NepaliDateColumnList.push(...[new NepaliDateInGridColumnDetail('GoodReceiptDate', false), new NepaliDateInGridColumnDetail('SupplierBillDate', false)]);
            this.GetPharmacyHeaderParameter();
            this.goodsreceiptsGridColumns = PHRMGridColumns.PHRMGoodsReceiptList;
            this.GetSupplierData();
            this.showitemlvldiscount();
            this.showpacking();
            this.CheckReceiptSettings();
            this.fromDay = 0;
            this.toDay = 10;
            this.EnablePharmacyGoodReceiptAdjustment();
      }
      onDateChange($event) {
            if ($event) {
                  this.fromDate = $event.fromDate;
                  this.toDate = $event.toDate;
            }
      }
      LoadGoodReceipts() {
            if (!this.fromDate && !this.toDate) {
                  this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Please enter valid From date and To date']);
                  return
            }
            this.GetDateFilteredGoodsReceiptList();
      }


      CheckReceiptSettings() {
            //check for english or nepali receipt style
            let receipt = this.coreService.Parameters.find(lang => lang.ParameterName == 'NepaliReceipt' && lang.ParameterGroupName == 'Common').ParameterValue;
            this.showNepaliReceipt = (receipt == "true");
      }



      //this function load all suppliers details
      GetSupplierData() {
            try {
                  this.pharmacyBLService.GetSupplierList()
                        .subscribe(
                              res => {
                                    if (res.Status == "OK") {
                                          this.supplierList = res.Results;
                                    } else {
                                          this.msgBoxServ.showMessage("failed", ['Failed to get supplier list.' + res.ErrorMessage]);
                                    }
                              },
                              err => {
                                    this.msgBoxServ.showMessage("error", ['Failed to get supplier list.' + err.ErrorMessage]);
                              }
                        );
            }
            catch (exception) {
                  console.log(exception);
                  this.msgBoxServ.showMessage("error", ['error details see in console log']);
            }
      }

      //show or hide GR item level discount
      showitemlvldiscount() {
            this.IsitemlevlDis = true;
            let discountParameter = this.coreService.Parameters.find((p) => p.ParameterName == "PharmacyDiscountCustomization" && p.ParameterGroupName == "Pharmacy").ParameterValue;
            discountParameter = JSON.parse(discountParameter);
            this.IsitemlevlDis = (discountParameter.EnableItemLevelDiscount == true);
      }
      // for show and hide packing feature
      showpacking() {
            this.IsPkgitem = true;
            let pkg = this.coreService.Parameters.find((p) => p.ParameterName == "PharmacyGRpacking" && p.ParameterGroupName == "Pharmacy").ParameterValue;
            if (pkg == "true") {
                  this.IsPkgitem = true;
            } else {
                  this.IsPkgitem = false;
                  //this.goodReceiptItems.GoodReceiptItemValidator.controls["PackingQuantity"].disable();
            }

      }

      //used to format display item in ng-autocomplete
      myListFormatter(data: any): string {
            let html = data["SupplierName"];
            return html;
      }
      public GetDateFilteredGoodsReceiptList() {
            this.FilterParameters = [
                  { DisplayName: "Supplier: ", Value: this.currentSupplier.SupplierName },
                  { DisplayName: "DateRange:", Value: "<b>From:</b>&nbsp;" + this.fromDate + "&nbsp;<b>To</b>&nbsp;" + this.toDate }
            ]
            this.newGoodsReceiptList = new Array<PHRMGoodsReceiptModel>();
            this.pharmacyBLService.GetDateFilteredGoodsReceiptList(this.fromDate, this.toDate)
                  .subscribe(res => {
                        if (res.Status == "OK" && res.Results.length > 0) {
                              this.newGoodsReceiptList = res.Results;
                              this.goodsReceiptList = res.Results;

                              for (let i = 0; i < this.goodsReceiptList.length; i++) {
                                    var date2 = new Date(this.goodsReceiptList[i].GoodReceiptDate);
                                    var date1 = new Date(moment().format('YYYY-MM-DD'));
                                    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
                                    this.goodsReceiptList[i].AgingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                              }
                              this.filterGoodsReceiptList = new Array<PHRMGoodsReceiptModel>();
                              this.filterGoodsReceiptList = this.goodsReceiptList.filter(s => s.IsCancel == false);

                              this.totalAmount = this.goodsReceiptList.filter(s => s.IsCancel == false).map(c => c.TotalAmount).reduce((sum, current) => sum + current);
                              this.subTotal = this.goodsReceiptList.filter(s => s.IsCancel == false).map(c => c.SubTotal).reduce((sum, current) => sum + current);
                              this.discountTotal = this.goodsReceiptList.filter(s => s.IsCancel == false).map(c => c.DiscountAmount).reduce((sum, current) => sum + current);
                              this.vatTotal = this.goodsReceiptList.filter(s => s.IsCancel == false).map(c => c.VATAmount).reduce((sum, current) => sum + current);
                              this.FilterGoodReceipts();
                              const tableContent = `
                                                <table class="table table-striped table-hover table-responsive">
                                                      <tr>
                                                            <td colspan="12" style="text-align: right">
                                                            <b>Total Amount: ${this.totalAmount}</b>
                                                            </td>
                                                      </tr>
                                                      <tr>
                                                            <td colspan="4" style="text-align: center"><b>Forwarded By</b></td>
                                                            <td colspan="4" style="text-align: center"><b>Approved By</b></td>
                                                            <td colspan="4" style="text-align: center"><b>Prepared By</b></td>
                                                      </tr>
                                                </table>
                                                `;

                              const tempElement = document.createElement('div');
                              tempElement.innerHTML = tableContent;

                              this.footerContent = tempElement.innerHTML;

                              // update grid export option
                              this.updateGridExportOptions();
                        }
                  },
                        err => {
                              this.msgBoxServ.showMessage("error", ["Failed to get GoodsReceiptList. " + err.ErrorMessage]);
                        });
      }
      GoodsReceiptGridAction($event: GridEmitModel) {
            switch ($event.Action) {
                  case "view": {
                        //changing datetime format to date only for view
                        $event.Data.GoodReceiptDate = moment($event.Data.GoodReceiptDate).format("YYYY-MM-DD");
                        this.currentGRdetails = $event.Data;
                        this.currentGRdetails.GoodReceiptId = $event.Data.GoodReceiptId;
                        this.currentGRdetails.IsCancel = $event.Data.IsCancel;
                        this.showPopUp = true;
                        break;
                  }
                  default:
                        break;
            }
      }
      SupplierChange($event) {
            if ($event && $event.SupplierId > 0) {
                  this.supplierId = $event.SupplierId;
            }
            else {
                  this.supplierId = null;
            }
      }
      public FilterGoodReceipts() {
            this.supplierId = this.currentSupplier.SupplierId;
            this.filterGoodsReceiptList = [];
            if (this.fromDay && this.toDay) {
                  this.goodsReceiptList.forEach(gr => {
                        let date2 = new Date(gr.GoodReceiptDate);
                        let date1 = new Date(moment().format('YYYY-MM-DD'));
                        var timeDiff = Math.abs(date2.getTime() - date1.getTime());
                        gr.AgingDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                  });
                  this.goodsReceiptList = this.goodsReceiptList.filter(gr => gr.AgingDays >= this.fromDay && gr.AgingDays <= this.toDay);

            }
            if (this.filterGoodsReceiptList.length == 0) {
                  this.filterGoodsReceiptList = this.goodsReceiptList;
            }
            this.filterGoodsReceiptList = this.filterGoodsReceiptList.filter(a => a.SupplierId == this.supplierId || this.supplierId == 0 || this.supplierId == undefined);

            if (this.goodReceiptStatus == 'cancelled') {
                  this.filterGoodsReceiptList = this.filterGoodsReceiptList.filter(s => s.IsCancel == true);
            } else if (this.goodReceiptStatus == 'complete') {
                  this.filterGoodsReceiptList = this.filterGoodsReceiptList.filter(s => s.IsCancel != true);
            } else { this.filterGoodsReceiptList = this.filterGoodsReceiptList; }

            this.newGoodsReceiptList = this.filterGoodsReceiptList;

            if (this.newGoodsReceiptList.length > 0) {
                  this.totalAmount = this.newGoodsReceiptList.map(c => c.TotalAmount).reduce((sum, current) => sum + current);
                  this.subTotal = this.newGoodsReceiptList.map(c => c.SubTotal).reduce((sum, current) => sum + current);
                  this.discountTotal = this.newGoodsReceiptList.map(c => c.DiscountAmount).reduce((sum, current) => sum + current);
                  this.vatTotal = this.newGoodsReceiptList.map(c => c.VATAmount).reduce((sum, current) => sum + current);
            }
            else {
                  this.totalAmount = 0; this.subTotal = 0; this.discountTotal = 0; this.vatTotal = 0;
            }

      }
      //Get customer Header Parameter from Core Service (Database) assign to local variable -- Narayan 08 July 2019
      GetPharmacyHeaderParameter() {
            var paramValue = this.coreService.Parameters.find(a => a.ParameterName == 'Pharmacy Receipt Header').ParameterValue;
            if (paramValue) {
                  this.headerDetail = JSON.parse(paramValue);
            }
            else
                  this.msgBoxServ.showMessage("error", ["Please enter parameter values for BillingHeader"]);
      }

      grCancelEventHandler($event) {
            let selectedGR = this.goodsReceiptList.find(a => a.GoodReceiptId == $event.goodsReceiptId);
            if (selectedGR != null) { selectedGR.IsCancel = true; }
            this.FilterGoodReceipts();
      }
      popUpCloseEventHandler() {
            this.showPopUp = false;
      }
      // Grid Export Function

      _gridExportOptions = { fileName: 'PharmacyGoodReceiptLists_' + moment().format('YYYY-MM-DD') + '.xls', customHeader: 'Purchase Reports', customFooter: '' };
      updateGridExportOptions() {
            this._gridExportOptions.fileName = 'PharmacyGoodReceiptLists_' + moment().format('YYYY-MM-DD') + '.xls'
            this._gridExportOptions.customHeader = `${this.headerDetail.hospitalName}\n${this.headerDetail.address}\nPharamcy Purchase List (${moment(this.fromDate).format('YYYY-MM-DD')}-${moment(this.toDate).format('YYYY-MM-DD')})\n`
            this._gridExportOptions.customFooter = `\n\nSubTotal, ${this.subTotal}\nDiscount, ${this.discountTotal}\nTotalAmount, ${this.totalAmount}`
      }

      OpenGoodReceiptItemAddEditPage() {
            this.showGoodReceiptAddEditPage = true;
      }

      CloseGoodReceiptItemAddEditPage() {
            this.showGoodReceiptAddEditPage = false;
            this.GetDateFilteredGoodsReceiptList();
      }
      ngAfterViewChecked() {
            this.footerContent = document.getElementById("phrm-gr-print_summary").innerHTML;
      }
      EnablePharmacyGoodReceiptAdjustment() {
            let adjust = this.coreService.Parameters.find((p) => p.ParameterName == "EnableEditPHRMGRAdjustment" && p.ParameterGroupName == "Pharmacy");
            if (adjust && adjust.ParameterValue) {
                  if (adjust.ParameterValue == "true") {
                        this.EnableAdjustmentEdit = true;
                  } else {
                        this.EnableAdjustmentEdit = false;
                  }

            }
      }
}

