import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, Renderer2 } from "@angular/core";
import { Router } from "@angular/router";
import { PharmacyBLService } from "../../../../../pharmacy/shared/pharmacy.bl.service";
import { PharmacyService } from "../../../../../pharmacy/shared/pharmacy.service";
import PHRMGridColumns from "../../../../../pharmacy/shared/phrm-grid-columns";
import { PHRMStockManageModel } from "../../../../../pharmacy/shared/phrm-stock-manage.model";
import { PHRMStoreModel } from "../../../../../pharmacy/shared/phrm-store.model";
import { DanpheHTTPResponse } from "../../../../../shared/common-models";
import { GridEmitModel } from "../../../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from "../../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../../../shared/shared-enums";
import { DispensaryService } from "../../../../shared/dispensary.service";

@Component({
  selector: 'stock-list',
  templateUrl: "./stock-list-pop-up.html"
})
export class PHRMStockListComponent implements OnInit {

  public stockDetailsGridColumns: Array<any> = null;
  public stockDetailsList: any;
  loading: boolean = false;
  public rowIndex: number = null;
  public showStockList: boolean = true;
  public selectedItem: PHRMStockManageModel = new PHRMStockManageModel();

  public ESCAPE_KEYCODE = 27;//to close the window on click of ESCape.
  globalListenFunc: Function;

  @Output("on-closed")
  public onClose = new EventEmitter<object>();
  currentDispensary: PHRMStoreModel;
  isSelectedDispensaryInsurance: boolean = false;
  stockDetailsListCopy: any;
  showStockWithZeroQty: boolean = false;
  selectedStoreId: number = null;
  Stores: PHRMStoreModel[] = [];
  constructor(private _dispensaryService: DispensaryService, public pharmacyBLService: PharmacyBLService, public pharmacyService: PharmacyService,
    public changeDetector: ChangeDetectorRef, public router: Router,
    public msgBoxServ: MessageboxService,
    public renderer2: Renderer2) {
    this.isSelectedDispensaryInsurance = this._dispensaryService.isInsuranceDispensarySelected;
    this.stockDetailsGridColumns = this.isSelectedDispensaryInsurance ? PHRMGridColumns.PHRMInsuranceStockList : PHRMGridColumns.PHRMStockList;
    this.currentDispensary = this._dispensaryService.activeDispensary;
    this.selectedStoreId = this.currentDispensary.StoreId;
    this.GetPharmacyStores();
    this.getAllItemsStockDetailsList();
  }
  ngOnInit() {
    this.globalListenFunc = this.renderer2.listen('document', 'keydown', e => {
      if (e.keyCode == this.ESCAPE_KEYCODE) {
        this.onClose.emit({ CloseWindow: true, EventName: "close" });
      }
    });
  }
  public getAllItemsStockDetailsList() {
    this.pharmacyBLService.GetAllItemsStockDetailsList(this.selectedStoreId, this.showStockWithZeroQty)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.stockDetailsList = res.Results;
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get StockDetailsList. " + res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get StockDetailsList. " + err.ErrorMessage]);
        });
  }

  StockDetailsGridAction($event: GridEmitModel) {
    switch ($event.Action) {
      case "manage-stock": {
        this.rowIndex = $event.RowIndex;
        this.ManageStock($event.Data);
        break;
      }
      default:
        break;
    }
  }
  ManageStock(data) {
    try {
      if (data) {
        this.selectedItem = new PHRMStockManageModel();
        this.selectedItem = Object.assign(this.selectedItem, data);
        this.selectedItem.Quantity = data.AvailableQuantity;
        this.selectedItem.UpdatedQty = 0;
        this.selectedItem.InOut = null;
        this.showStockList = false;
      }
    } catch (ex) {
      this.ShowCatchErrMessage(ex);
    }
  }
  //update stockManage transaction
  //Post to StockManage table and post to stockTxnItem table 
  SaveManagedStock() {
    try {
      if (this.selectedItem) {
        for (var b in this.selectedItem.StockManageValidator.controls) {
          this.selectedItem.StockManageValidator.controls[b].markAsDirty();
          this.selectedItem.StockManageValidator.controls[b].updateValueAndValidity();
        }
        let flag = (this.selectedItem.InOut == "out") ? (this.selectedItem.Quantity < this.selectedItem.UpdatedQty) ? false : true : true;
        if ((this.selectedItem.IsValidCheck(undefined, undefined) == true) && flag) {
          this.loading = true;
          this.pharmacyBLService.PostManagedStockDetails(this.selectedItem).
            subscribe(res => {
              if (res.Status == 'OK') {
                if (res.Results) {
                  this.msgBoxServ.showMessage("success", ["stock adjustment saved"]);
                  this.changeDetector.detectChanges();
                  let tempItm = this.stockDetailsList[this.rowIndex];
                  if (this.selectedItem.InOut == 'in') {
                    this.stockDetailsList[this.rowIndex].AvailableQuantity = tempItm.AvailableQuantity + this.selectedItem.UpdatedQty;
                  } else if (this.selectedItem.InOut == 'out') {
                    this.stockDetailsList[this.rowIndex].AvailableQuantity = tempItm.AvailableQuantity - this.selectedItem.UpdatedQty;
                  }
                  this.Cancel();
                }
              }
              else {
                this.msgBoxServ.showMessage("failed", ['failed ,please check log for details.']);
                console.log(res);
                this.Cancel();
              }
            });
        } else {
          this.msgBoxServ.showMessage("notice", ['please see error message']);
          this.loading = false;
        }
      }
    } catch (ex) {
      this.ShowCatchErrMessage(ex);
    }
  }
  Cancel() {
    this.loading = true;
    try {
      this.selectedItem = new PHRMStockManageModel();
      this.showStockList = true;
      this.loading = false;
      this.rowIndex = null;
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }

  ////This function only for show catch messages in console 
  ShowCatchErrMessage(exception) {
    if (exception) {
      this.msgBoxServ.showMessage("error", ['error please check console lo for details'])
      this.showStockList = true;
      let ex: Error = exception;
      console.log("Error Messsage =>  " + ex.message);
      console.log("Stack Details =>   " + ex.stack);
      this.loading = false;
    }
  }

  GetPharmacyStores() {
    this._dispensaryService.GetAllPharmacyStores()
      .subscribe(res => {
        if (res.Status == 'OK' && res.Results.length > 0) {
          this.Stores = res.Results;
        }
        if (res.Status == 'OK' && res.Results.length == 0) {
          this.msgBoxServ.showMessage("Error", ["Stores are not available."]);
        }
      });
  }

  LoadStock() {
    this.getAllItemsStockDetailsList();
  }
}