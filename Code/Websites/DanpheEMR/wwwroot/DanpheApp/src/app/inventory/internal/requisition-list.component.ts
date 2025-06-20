import { Component } from "@angular/core";
import { Router } from '@angular/router';
import * as moment from 'moment/moment';
import { CoreService } from "../../core/shared/core.service";
import { PHRMStoreModel } from "../../pharmacy/shared/phrm-store.model";
import { SecurityService } from "../../security/shared/security.service";
import { GeneralFieldLabels } from "../../shared/DTOs/general-field-label.dto";
import { ActivateInventoryService } from "../../shared/activate-inventory/activate-inventory.service";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../shared/danphe-grid/NepaliColGridSettingsModel";
import GridColumnSettings from '../../shared/danphe-grid/grid-column-settings.constant';
import { GridEmitModel } from "../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { RouteFromService } from '../../shared/routefrom.service';
import { DispatchItems } from "../shared/dispatch-items.model";
import { InventoryBLService } from "../shared/inventory.bl.service";
import { InventoryService } from '../shared/inventory.service';
import { RequisitionItems } from "../shared/requisition-items.model";
import { Requisition } from "../shared/requisition.model";

@Component({
  templateUrl: "./requisition-list.component.html",
  host: { '(window:keydown)': 'hotkeys($event)' }
}
)
export class RequisitionListComponent {
  public RequisitionGridData: Array<Requisition> = null;
  public RequisitionGridDataFiltered: Array<Requisition> = null;
  public RequisitionStatusFilter: string = "pending";
  public innerDispatchdetails: DispatchItems = new DispatchItems();
  public dispatchListbyId: Array<DispatchItems> = new Array<DispatchItems>();
  public requisitionItemsDetails: Array<RequisitionItems> = new Array<RequisitionItems>();
  public deptwiseGridColumns: Array<any> = null;
  public dispatchList: Array<{ CreatedByName, CreatedOn, RequisitionId, DispatchId, ReceivedBy, DispatchedByName, DepartmentName }> = new Array<{ CreatedByName, CreatedOn, RequisitionId, DispatchId, ReceivedBy, DispatchedByName, DepartmentName, DispatchNo }>();
  public cancelList: Array<{ CancelByName, CancelOn, RequisitionId, ItemName, DepartmentName }> = new Array<{ CancelByName, CancelOn, RequisitionId, ItemName, DepartmentName }>();
  public itemRequisitionList: Array<any> = null;
  public itemwiseGridColumns: Array<any> = null;
  DispatchListGridColumns: ({ headerName: string; field: string; width: number; template?: undefined; } | { headerName: string; field: string; width: number; template: string; })[];
  public CancelListGridColumns: ({ headerName: string; field: string; width: number; template?: undefined; } | { headerName: string; field: string; width: number; template: string; })[];
  public itemchecked: boolean = true;
  public showItemwise: boolean = false;
  public index: number = 0;
  public itemId: number = 0;
  public showDispatchList: boolean = false;
  public showCancelList: boolean = false;
  public showDetailsbyDispatchId: boolean = false;
  public itemName: string = null;
  public storeName: string = null;
  public requisitionId: number = 0;
  public requisitionDate: string = null;
  public ShowOutput: number = 0;
  public header: any = null;
  public createdby: string = "";
  public dispatchedby: string = "";
  public DispatchId: number = 0;
  public receivedby: string = "";
  departmentName: any;
  Amount: any;
  DispatchedQuantity: any;
  StandardRate: any;
  TotalAmount: any;
  Sum: number = 0;
  public requisition: Requisition;
  public fromDate: string = null;
  public toDate: string = null;
  public dateRange: string = null;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public NepaliDateInGridSettingsForDispatchList: NepaliDateInGridParams = new NepaliDateInGridParams();
  currentActiveInventory: PHRMStoreModel;
  showRequisitionDetailsPopup: boolean = false;
  showDispatchDetailsPopup: boolean = false;

  public GeneralFieldLabel = new GeneralFieldLabels();
  public VerificationLevel: number = 0;
  public MinimumDispatchLevel: number = 0;

  constructor(public coreService: CoreService, private _activeInvService: ActivateInventoryService, public InventoryBLService: InventoryBLService, public inventoryService: InventoryService, public router: Router, public routeFrom: RouteFromService, public messageBoxService: MessageboxService, public securityService: SecurityService) {
    var colSettings = new GridColumnSettings(this.securityService);
    this.deptwiseGridColumns = colSettings.DepartmentwiseRequisitionList;
    this.itemwiseGridColumns = GridColumnSettings.ItemwiseRequisitionList;
    this.DispatchListGridColumns = GridColumnSettings.DispatchList;
    this.CancelListGridColumns = GridColumnSettings.CancelList;
    this.dateRange = 'None';
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('RequisitionDate', true));
    this.NepaliDateInGridSettingsForDispatchList.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('DispatchedDate', false));
    this.GetInventoryBillingHeaderParameter();
    this.currentActiveInventory = _activeInvService.activeInventory;
    this.GeneralFieldLabel = coreService.GetFieldLabelParameter();
    this.GetSigningPanelConfiguration();
  }
  BackToGrid() {
    this.showItemwise = false;
    this.LoadDeptwiseList("pending");
  }

  LoadDeptwiseList(status): void {
    this.showItemwise = false;
    this.InventoryBLService.GetAllSubstoreRequistionList(this.fromDate, this.toDate)
      .subscribe(res => {
        if (res.Status == "OK") {
          this.RequisitionGridDataFiltered = [];
          this.RequisitionGridData = res.Results;
          if (this.RequisitionGridData.length == 0) {
            this.messageBoxService.showMessage("Notice", ["No Requisition Found. Please check the date."]);
          }
          else {
            this.RequisitionGridData.forEach(i => {
              i.canDispatchItem = true; //this is used in cellRenderer for actions.
            });
            this.LoadRequisitionListByStatus();
          }
        }
        else {
          this.messageBoxService.showMessage("failed", ['failed to get Requisitions.....please check log for details.']);
          ;
          console.log(res.ErrorMessage);
        }
      });
  }

  LoadRequisitionListByStatus() {
    switch (this.RequisitionStatusFilter) {
      case "pending": {
        this.RequisitionGridDataFiltered = this.RequisitionGridData.filter(R => ["pending", "active", "partial"].includes(R.RequisitionStatus));
        break;
      }
      case "complete": {
        this.RequisitionGridDataFiltered = this.RequisitionGridData.filter(R => R.RequisitionStatus == "complete");
        break;
      }
      case "cancelled": {
        this.RequisitionGridDataFiltered = this.RequisitionGridData.filter(R => R.RequisitionStatus == "cancelled");
        break;
      }
      default: {
        this.RequisitionGridDataFiltered = this.RequisitionGridData
      }
    }
  }

  DeptGridAction($event: GridEmitModel) {
    switch ($event.Action) {
      case "requisitionDispatch":
        {
          var data = $event.Data;
          this.RouteToDispatch(data);
          break;
        }
      case "view":
        {
          var data = $event.Data;
          //this.RouteToViewDetail(data);

          this.inventoryService.RequisitionId = data.RequisitionId;
          this.inventoryService.StoreName = data.StoreName;
          this.inventoryService.StoreId = data.StoreId;
          this.showRequisitionDetailsPopup = true;
          break;
        }
      case "cancelList":
        {
          var data = $event.Data;
          this.requisitionId = data.RequisitionId;
          this.departmentName = data.DepartmentName;
          this.requisitionDate = data.RequisitionDate;
          this.InventoryBLService.GetCancelDetails(this.requisitionId)
            .subscribe(res => this.ShoWCancelByuRequisitionId(res));
          this.showCancelList = true;
          break;
        }
      case "dispatchList":
        {
          var data = $event.Data;
          this.requisitionId = data.RequisitionId;
          this.departmentName = data.DepartmentName;
          this.requisitionDate = data.RequisitionDate;
          this.storeName = data.StoreName;
          this.InventoryBLService.GetDispatchDetails(this.requisitionId)
            .subscribe(res => this.ShoWDispatchbyRequisitionId(res));
          break;;
        }
      default:
        break;

    }
  }

  ShoWDispatchbyRequisitionId(res) {
    if (res.Status == "OK") {
      this.dispatchList = new Array<{ CreatedByName, CreatedOn, RequisitionId, DispatchId, ReceivedBy, DispatchedByName, DepartmentName }>();
      this.dispatchList = res.Results;

      //Check if there is requisition created without any Requisition Item then simply go to requisition List 
      //Because If there is no Items then we can't show anything.
      if (this.dispatchList.length > 0) {
        this.dispatchList.forEach(itm => {
          itm.DepartmentName = this.departmentName;
        });
        this.showDispatchList = true;

      }
      else {
        this.messageBoxService.showMessage("notice-message", ["Selected Requisition is without  Dispatch Items"]);
      }


    }
    else {
      this.messageBoxService.showMessage("notice-message", ["There is no Dispatch done !"]);
    }
  }

  ShoWCancelByuRequisitionId(res) {
    if (res.Status == "OK") {
      this.cancelList = res.Results;
      if (this.cancelList.length > 0) {
        this.cancelList.forEach(itm => {
          itm.DepartmentName = this.departmentName;
        });
      }
      else {
        this.messageBoxService.showMessage("notice-message", ["Selected  Requisition is without Cancel Items"]);
      }
    }
    else {
      this.messageBoxService.showMessage("notice-message", ["There is no Cancel Requisition details !"]);
    }

  }

  DispatchDetailsGridAction($event: GridEmitModel) {
    switch ($event.Action) {
      case "view": {
        if ($event.Data != null) {
          this.inventoryService.DispatchId = $event.Data.DispatchId;
          this.inventoryService.RequisitionId = this.requisitionId;
          this.inventoryService.StoreName = this.storeName;
          this.inventoryService.CreatedOn = $event.Data.DispatchedDate;
          this.showDispatchDetailsPopup = true;
        }
        break;
      }
      default:
        break;
    }
  }
  // This funcionality is no longer in use : 19Dec'22/Rohit
  // ShowbyDispatchId(DispatchId, RequisitionId) {
  //   this.InventoryBLService.GetDispatchItemByDispatchId(DispatchId, RequisitionId)
  //     .subscribe(res => {
  //       if (res.Status == "OK") {
  //         this.dispatchListbyId = res.Results;
  //         this.showDetailsbyDispatchId = true;
  //         for (var i = 0; i < this.dispatchListbyId.length; i++) {
  //           this.Sum += (this.dispatchListbyId[i].StandardRate * this.dispatchListbyId[i].DispatchedQuantity);

  //         }
  //       }
  //       else {
  //         this.messageBoxService.showMessage("failed", ['failed to get Dispatch List. ' + res.ErrorMessage]);
  //       }
  //     },
  //       err => {
  //         this.messageBoxService.showMessage("error", ['failed to get Dispatch List. ' + err.ErrorMessage]);
  //       }
  //     );
  // }

  RouteToDispatch(data) {
    //Pass the RequisitionId and DepartmentName to Next page for getting DispatchItems using inventoryService
    this.inventoryService.RequisitionId = data.RequisitionId;
    this.inventoryService.StoreName = data.StoreName;
    this.inventoryService.RequestedOn = data.RequisitionDate;
    this.inventoryService.isDispatchAllowed = this.CheckIfDispatchAllowed(data);
    this.routeFrom.RouteFrom = '/Inventory/InternalMain/Requisition/RequisitionList';
    this.router.navigate(['/Inventory/InternalMain/Requisition/Dispatch']);
  }

  private CheckIfDispatchAllowed(data: Requisition): boolean {
    return (data.MaxVerificationLevel != 0 && (data.CurrentVerificationLevelCount == this.MinimumDispatchLevel || data.MaxVerificationLevel == data.CurrentVerificationLevelCount)) ? true : false;
  }

  //route to dispatch all by Item
  ItemDispatch(item) {
    //Pass the ItemId and ItemName to Next page for getting DispatchAllItems using inventoryService
    this.inventoryService.ItemId = item.ItemId;//sud:3Mar'20
    this.inventoryService.ItemName = item.ItemName;//sud:3Mar'20-Property Rename in InventoryService
    this.router.navigate(['/Inventory/InternalMain/Requisition/DispatchAll']);
  }

  RouteToViewDetail(data) {
    //pass the Requisition Id to RequisitionView page for List of Details about requisition
    this.inventoryService.RequisitionId = data.RequisitionId;
    this.inventoryService.StoreName = data.StoreName;
    this.inventoryService.StoreId = data.StoreId;
    this.router.navigate(['/Inventory/InternalMain/Requisition/RequisitionDetails']);
  }
  //route to create Requisition page
  DirectDispatch() {
    this.router.navigate(['/Inventory/InternalMain/Requisition/DirectDispatch']);
  }
  gridExportOptions = {
    fileName: 'DispatchLists_' + moment().format('YYYY-MM-DD') + '.xls',
  };

  Close() {
    this.showDispatchList = false;
    this.showCancelList = false;
    this.showDetailsbyDispatchId = false;
    this.Sum = 0;
  }
  print() {
    let popupWinindow;
    var printContents = document.getElementById("printpage").innerHTML;
    popupWinindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
    popupWinindow.document.open();
    popupWinindow.document.write(`
    <html>
      <head>
        <style>
          .img-responsive{max-height: 70px; position: relative;left: -62px;top: 12px;} 
        </style>
        <link rel="stylesheet" type="text/css" href="../../themes/theme-default/ReceiptList.css" />
      </head>
      <style>
        .printStyle {border: dotted 1px;margin: 10px 100px;}
        .print-border-top {border-top: dotted 1px;}
        .print-border-bottom {border-bottom: dotted 1px;}
        .print-border {border: dotted 1px;}
        .center-style {text-align: center;}
        .border-up-down {border-top: dotted 1px;border-bottom: dotted 1px;}
        .no-print{display:none;visibility:hidden;}
      </style>
      <body onload="window.print()">` +
      printContents +
      '</html>');
    popupWinindow.document.close();
  }

  public headerDetail: { header1, header2, header3, header4, hospitalName, address, email, PANno, tel, DDA };

  //Get Pharmacy Billing Header Parameter from Core Service (Database) assign to local variable
  GetInventoryBillingHeaderParameter() {
    var paramValue = this.coreService.Parameters.find(a => a.ParameterName == 'Inventory Receipt Header').ParameterValue;
    if (paramValue)
      this.headerDetail = JSON.parse(paramValue);
    else
      this.messageBoxService.showMessage("error", ["Please enter parameter values for BillingHeader"]);
  }

  onDateChange($event) {
    this.fromDate = $event.fromDate;
    this.toDate = $event.toDate;
    if (this.fromDate != null && this.toDate != null) {
      if (moment(this.fromDate).isBefore(this.toDate) || moment(this.fromDate).isSame(this.toDate)) {
        this.LoadDeptwiseList("all");
      } else {
        this.messageBoxService.showMessage('failed', ['Please enter valid From date and To date']);
      }

    }
  }

  CallBackDispatchDetailsPopUpClose() {
    this.showDispatchDetailsPopup = false;
  }

  CloseRequisitionDetailsPopup() {
    this.showRequisitionDetailsPopup = false;
    this.inventoryService.RequisitionId = null;
    this.inventoryService.StoreName = null;
    this.inventoryService.StoreId = null;
  }
  hotkeys(event): void {
    if (event.keyCode === 27) {
      this.CloseRequisitionDetailsPopup();
      this.Close();
    }
  }
  GetSigningPanelConfiguration() {
    var signingPanelConfigurationParameter = this.coreService.Parameters.find(param => param.ParameterGroupName === 'Inventory' && param.ParameterName == "SigningPanelConfiguration")
    if (signingPanelConfigurationParameter) {
      let signingPanelConfigurationParameterValue = JSON.parse(signingPanelConfigurationParameter.ParameterValue);
      this.VerificationLevel = signingPanelConfigurationParameterValue.VerificationLevel;
      this.MinimumDispatchLevel = signingPanelConfigurationParameterValue.MinimumDispatchLevel;
    }
  }
}
