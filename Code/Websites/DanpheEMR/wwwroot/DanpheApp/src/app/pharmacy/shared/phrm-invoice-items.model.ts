
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { PHRMGenericModel } from './phrm-generic.model';
import { PHRMGoodsReceiptItemsModel } from "./phrm-goods-receipt-items.model";
import { PHRMItemMasterModel } from "./phrm-item-master.model";
import { PHRMNarcoticRecordModel } from './phrm-narcotic-record';
import { InsurancePackageBillServiceItem_DTO } from '../../dispensary/shared/DTOs/insurance-package-bill-service-item.dto';

export class PHRMInvoiceItemsModel {
  public InvoiceItemId: number = 0;
  public InvoiceId: number = 0;
  public StoreId: number = 0;
  public CompanyId: number = null;
  public StockId: number = 0;
  public ItemId: number = 0;
  public ItemName: string = "";
  /**
   * Display the ItemName in the receipts based on core cfg parameter "PharmacyItemNameDisplaySettings"
   * @description created by Sanjit, Ramesh, Rohit on 4th Oct, 2021
   */
  public ItemDisplayName: string = '';
  public BatchNo: string = "";
  public RequestedQuantity: number = 0;
  public Quantity: number = 0;
  public Price: number = 0;
  public SalePrice: number = 0;
  public NormalSalePrice: number = 0;
  public GrItemPrice: number = 0;
  public FreeQuantity: number = 0;
  public SubTotal: number = 0;
  public VATPercentage: number = 0;
  public VATAmount: number = 0;
  public DiscountPercentage: number = 0;
  public TotalDisAmt: number = 0;
  public TotalAmount: number = 0;
  public BilItemStatus: string = "";
  public Remark: string = "";
  public CreatedBy: number = 0;
  public CreatedOn: string = "";
  public PrescriptionItemId: number = null;
  public ExpiryDate: string = null;
  public GoodReceiptItemId: number = 0;
  public GenericId: number = 0;
  public GenericName: string = "";
  public CounterId: number = 0;
  public RackNo: string = "";
  public NarcoticsRecord: PHRMNarcoticRecordModel = new PHRMNarcoticRecordModel();
  //for local usage
  public ItemTypeId: number = 0;
  public TotalQty: number = null;//for show total available quantity
  public Items: Array<PHRMItemMasterModel> = [];// new Array<PHRMItemMasterModel>();
  public selectedItem: any;// PHRMItemMasterModel ;// new PHRMItemMasterModel();
  public GRItems: Array<PHRMGoodsReceiptItemsModel> = new Array<PHRMGoodsReceiptItemsModel>();
  public SelectedGRItems: Array<PHRMGoodsReceiptItemsModel> = new Array<PHRMGoodsReceiptItemsModel>();
  public selectedGeneneric: PHRMGenericModel;
  public CompanyName: string = "";
  public InvoiceItemsValidator: FormGroup = null;
  public enableItmSearch: boolean = true;
  public Dosage: string = null;
  public Frequency: number = 0;
  public Duration: number = 0;
  public PatientId: number = 0;
  public VisitType: string = "";
  public DiscountAmount: number = 0;//Rajesh22Aug : Only in client side
  public Tax: number = 0;//Rajesh22Aug : Only in client side
  public DiscountedAmount: number;
  public IsSelected: boolean = false;//sud: 4sept: Only for use in Client Side
  public CancelRemarks: string = "";//sud: 4Sept'18: For cancellation.
  public ReturnQty: number = 0;
  public ReturnedQty: number = 0;//for return invoice
  public DispatchQty: number = 0;
  public WardName: string = ""; // only for use in client side
  public WardUser: string = ""; // only for use in client side

  public DiscountPer: number = 0;

  public IsDuplicate: boolean = false;
  public CreditNoteId: number; //for view only
  public ItemFieldMinChars: number = 1;  //dynamically control ItemList dropdown open close
  FiscalYearName: string; // for view only

  // public ProviderId:number = null; //Krishna, 28thApril,22, This is to add ProviderId in Item Level...
  public PrescriberId: number = null; // Krishna, 17th,jun'22, changed ProviderId to PrescriberId...
  public disableDiscountField: boolean = false;
  public PriceCategoryId: number = null;
  IsCoPayment: boolean = false;
  CoPaymentCashAmount: number = 0;
  CoPaymentCreditAmount: number = 0;
  SchemeId: number = 0;
  PatientVisitId: number = null;
  CoPaymentCashPercent: number = 0;
  CoPaymentCreditPercent: number = 0;
  ReceiptNo: number = null;
  ItemCode: string = '';
  IsPackageItemQuantityRemaining: boolean = false;
  IsPackageItemNearlyExpire: boolean = false;
  IsNarcotic: boolean = false;
  HideRow: boolean = false;
  Index: number = 0;
  CappingQuantity: number = 0;
  PreviouslySalesQuantity: number = 0;
  QuantityRemainingToBeSale: number = 0;
  IsCappingEnable: boolean = false;
  CappingDaysLimit: number = 0;
  IsPharmacySalePriceEditable: boolean = false;
  PreviousSalePrice: number = 0;
  BillServiceItem: InsurancePackageBillServiceItem_DTO = new InsurancePackageBillServiceItem_DTO();
  BillServiceItemId: number = null;
  BillServiceItemName: string = '';
  TempSalePrice: number = 0;
  ClaimCode: number = null;


  //Constructor of class
  constructor() {
    var _formBuilder = new FormBuilder();
    this.InvoiceItemsValidator = _formBuilder.group({
      'ItemName': ['', Validators.compose([this.ItemNameValidator()])],
      'Quantity': [0, Validators.compose([this.integerValidator, this.wholeNumberValidator])],
      'Price': [0, Validators.compose([this.positiveNumberValdiator])],
      'DiscountPercentage': [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      'VATPercentage': [0, [Validators.required, Validators.min(0), Validators.max(100)]]

      // 'ItemTypeId': ['', Validators.required]
    });
  }
  public IsDirty(fieldName): boolean {
    if (fieldName == undefined)
      return this.InvoiceItemsValidator.dirty;
    else
      return this.InvoiceItemsValidator.controls[fieldName].dirty;
  }

  public IsValid(): boolean { if (this.InvoiceItemsValidator.valid) { return true; } else { return false; } }
  public IsValidCheck(fieldName, validator): boolean {

    if (fieldName == undefined)
      return this.InvoiceItemsValidator.valid;
    else
      return !(this.InvoiceItemsValidator.hasError(validator, fieldName));
  }
  public InvoiceItemsValidatortest() {
    var _formBuilder = new FormBuilder();
    _formBuilder.group({
      'Quantity': [0, Validators.compose([this.positiveNumberValdiatortest])]
    });
  }
  positiveNumberValdiator(control: FormControl): { [key: string]: boolean } {
    if (control) {
      if (control.value <= 0)
        return { 'invalidNumber': true };
    }
  }
  wholeNumberValidator(control: FormControl): { [key: string]: boolean } {
    if (control.value) {
      if (control.value % 1 != 0)
        return { 'wrongDecimalValue': true };
    }
    else
      return { 'wrongDecimalValue': true };
  }
  integerValidator(control: FormControl): { [key: string]: boolean } {
    if (control) {
      if (control.value <= 0)
        return { 'invalidNumber': true };
    }
  }
  positiveNumberValdiatortest(): { [key: string]: boolean } {

    return { 'invalidNumber': true };
  }


  ItemNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {

      const value = control.value;

      if (typeof (value) == "object") {
        return null;
      }
      return { invalidItem: true };
    }
  }
}
