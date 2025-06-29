import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CoreService } from '../../../core/shared/core.service';
import { GeneralFieldLabels } from '../../../shared/DTOs/general-field-label.dto';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { PharmacyBLService } from '../../shared/pharmacy.bl.service';
import { PharmacyService } from '../../shared/pharmacy.service';
import { PHRMGoodsReceiptModel } from '../../shared/phrm-goods-receipt.model';
@Component({
      selector: "goods-receipt-view",
      templateUrl: "./phrm-goods-receipt-view.html",
      styleUrls: ["./phrm-goods-receipt-view.css"],
      host: { '(window:keydown)': 'hotkeys($event)' }
})
export class PHRMGoodReceiptViewComponent implements OnInit {
      @Input('goodsReceiptId') goodsReceiptId: number;
      @Input("showPopUp") showPopUp: boolean;
      @Input("canUserModify") canUserModify: boolean;
      @Input("isGRCancelled") isGRCancelled: boolean = false;
      @Output("popup-close-event") popUpCloseEvent: EventEmitter<any> = new EventEmitter();
      @Output('gr-cancel-event') grCancelEvent: EventEmitter<Object> = new EventEmitter<Object>();
      currentGR: PHRMGoodsReceiptModel = new PHRMGoodsReceiptModel();
      headerDetail: { hospitalName, address, email, PANno, tel, DDA };

      public IsItemLevelDiscountEnabled: boolean = false;
      isPackingEnabled: boolean;
      showFreeQty: boolean = false;
      showCCCharge: boolean = false;
      printDetaiils: any;
      showPrint: boolean;
      cancelRemarks: string;
      cancelForm = new FormGroup({ CancelRemarks: new FormControl('', Validators.required) });
      showConfirmationPopUp: boolean = false;
      CancelRemarks: string = '';
      GoodReceiptInfo: string = '';

      @Input("EnableAdjustmentEdit")
      EnableAdjustmentEdit: boolean = false;

      public GeneralFieldLabel = new GeneralFieldLabels();

      constructor(public coreService: CoreService,
            public pharmacyBLService: PharmacyBLService,
            public pharmacyService: PharmacyService,
            public changeDetector: ChangeDetectorRef,
            public msgBox: MessageboxService,
            public router: Router) {
            this.GetPharmacyReceiptHeaderParameter();
            this.showItemLevelDiscount();
            this.ShowPacking();
            this.checkGRCustomization();
            this.GeneralFieldLabel = coreService.GetFieldLabelParameter();
      }
      ngOnInit(): void {
            this.GetGoodsReceiptDetail();
            this.SetFocusById("printButton");
      }
      GetGoodsReceiptDetail() {
            this.pharmacyBLService.GetGRDetailsByGRId(this.goodsReceiptId, this.isGRCancelled)
                  .subscribe(res => {
                        if (res.Status == "OK") {
                              this.currentGR = res.Results.goodReceipt;
                              this.canUserModify = (this.canUserModify && (this.currentGR.IsCancel == false));
                              this.SetDataToQRCode();
                        }
                        else {
                              this.msgBox.showMessage("Failed", ["Failed to load data."]);
                        }
                  }, err => {
                        console.log(err);
                        this.msgBox.showMessage("Failed", ["Failed to load data."]);
                  })
      }

      SetDataToQRCode() {
            let grItemsDetails = '';
            this.currentGR.GoodReceiptItem.forEach(item => {
                  grItemsDetails += `ItemName : ${item.ItemName}  BatchNo: ${item.BatchNo}  SalePrice: ${item.SalePrice}  ReceivedQuantity: ${item.ReceivedQuantity} \n`;
            });

            this.GoodReceiptInfo =
                  `GRNo: ${this.currentGR.FiscalYearFormatted}- ${this.currentGR.GoodReceiptPrintId}\n` +
                  `Supplier: ${this.currentGR.SupplierName}\n` +
                  `InvoiceNo: ${this.currentGR.InvoiceNo}\n` +
                  `SupplierBillDate: ${this.currentGR.SupplierBillDate}\n` +
                  `GoodReceiptDate: ${this.currentGR.GoodReceiptDate}\n` +
                  `Credit Period: ${this.currentGR.CreditPeriod}\n` +
                  `Items:\n` +
                  `[\n` +
                  `${grItemsDetails.substring(0, grItemsDetails.length - 2)}\n` +
                  `]\n` +
                  `TotalAmount: ${this.currentGR.TotalAmount}\n`;
      }

      GetPharmacyReceiptHeaderParameter() {
            var paramValue = this.coreService.Parameters.find(a => a.ParameterName == 'Pharmacy Receipt Header').ParameterValue;
            if (paramValue) {
                  this.headerDetail = JSON.parse(paramValue);
            }
            else {
                  this.msgBox.showMessage("error", ["Please enter parameter values for BillingHeader"]);
            }
      }
      Close() {
            this.showPopUp = false;
            this.popUpCloseEvent.emit();
      }
      print(idToBePrinted = 'print-good-reciept') {
            this.printDetaiils = document.getElementById(idToBePrinted);
            this.showPrint = true;
      }
      callBackPrint() {
            this.printDetaiils = null;
            this.showPrint = false;
      }

      //show or hide GR item level discount
      showItemLevelDiscount() {
            this.IsItemLevelDiscountEnabled = true;
            let discountParameter = this.coreService.Parameters.find((p) => p.ParameterName == "PharmacyDiscountCustomization" && p.ParameterGroupName == "Pharmacy").ParameterValue;
            discountParameter = JSON.parse(discountParameter);
            this.IsItemLevelDiscountEnabled = (discountParameter.EnableItemLevelDiscount == true);
      }
      // for show and hide packing feature
      ShowPacking() {
            this.isPackingEnabled = true;
            let pkg = this.coreService.Parameters.find((p) => p.ParameterName == "PharmacyGRpacking" && p.ParameterGroupName == "Pharmacy").ParameterValue;
            if (pkg == "true") {
                  this.isPackingEnabled = true;
            } else {
                  this.isPackingEnabled = false;
            }
      }
      // Confirmation for Good Receipt Cancel
      CancelGoodsReceipt() {
            this.showConfirmationPopUp = true;
      }
      //Good Receipt Cancellation Method
      cancelGR() {
            for (var b in this.cancelForm.controls) {
                  this.cancelForm.controls[b].markAsDirty();
                  this.cancelForm.controls[b].updateValueAndValidity();
            }
            if (this.cancelForm.invalid) {
                  this.msgBox.showMessage("Failed", ["Remarks is required for cancelling."])
            }
            else {
                  this.cancelRemarks = this.cancelForm.get('CancelRemarks').value;
                  this.pharmacyBLService.PostGoodsReceiptCancelDetail(this.goodsReceiptId, this.cancelRemarks)
                        .subscribe(
                              res => {
                                    if (res.Status == "OK") {
                                          this.currentGR.IsCancel = true;
                                          this.showConfirmationPopUp = false;
                                          this.msgBox.showMessage("success", ["Goods Receipt Canceled."]);
                                          this.grCancelEvent.emit({ event: 'grCancel', goodsReceiptId: this.goodsReceiptId });
                                          this.isGRCancelled = true;
                                          this.GetGoodsReceiptDetail();
                                    } else {
                                          this.msgBox.showMessage("error", ["Goods Receipt Cancelation Failed!!...Some items are already comsumed."]);
                                    }
                              },
                              err => {
                                    this.msgBox.showMessage("error", [err.ErrorMessage]);
                              });
            }
      }
      editReceipt(flag: boolean) {
            if (flag) {
                  this.msgBox.showMessage("Access Denied", ["This receipt has been transfered to accounting.", "Further editing is forbidden."]);
            }
            else {
                  this.pharmacyService.GRId = this.goodsReceiptId;
                  this.router.navigate(['/Pharmacy/Order/GoodsReceiptItems']);
            }
      }
      checkGRCustomization() {
            let GRParameterStr = this.coreService.Parameters.find(p => p.ParameterName == "GRFormCustomization" && p.ParameterGroupName == "Pharmacy");
            if (GRParameterStr != null) {
                  let GRParameter = JSON.parse(GRParameterStr.ParameterValue);
                  if (GRParameter.showFreeQuantity == true) {
                        this.showFreeQty = true;
                  }
                  if (GRParameter.showCCCharge == true) {
                        this.showCCCharge = true;
                  }
            }
      }
      public hotkeys(event) {
            //For ESC key => close the pop up
            if (event.keyCode == 27) {
                  this.Close();
            }
      }
      SetFocusById(IdToBeFocused: string) {
            window.setTimeout(function () {
                  let elemToFocus = document.getElementById(IdToBeFocused);
                  if (elemToFocus != null && elemToFocus != undefined) {
                        elemToFocus.focus();
                  }
            }, 20);
      }


}
