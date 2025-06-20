﻿using DanpheEMR.ServerModel.BillingModels;
using DanpheEMR.ServerModel.PatientModels;
using DanpheEMR.ServerModel.ReportingModels;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel
{
    //VM stands for ViewModel, these are transition models, which doesn't exist in database.
    public class BillingItemVM
    {
        public string ProcedureCode { get; set; }
        public string ItemName { get; set; }
        public double ItemPrice { get; set; }
        public double? NormalPrice { get; set; } //added by Yubraj : 16th May '19
        public double? SAARCCitizenPrice { get; set; }
        public double? InsForeignerPrice { get; set; }
        public double? ForeignerPrice { get; set; }
        public int? IntegrationItemId { get; set; }
        public bool? TaxApplicable { get; set; }
        public string ServiceDepartmentName { get; set; }
        public int ServiceDepartmentId { get; set; }
        public int ServiceItemId { get; set;}
        public string ItemCode { get; set; }
    }

    public class PatientBillingContextVM
    {
        public int? PatientId { get; set; }
        public int? PatientVisitId { get; set; }
        public string BillingType { get; set; }//eg: inpatient/outpatient
        public DateTime? AdmissionDate { get; set; } // only for inpatients
        public string AdmissionCase { get; set; }
        public int? RequestingDeptId { get; set; }
        public InsuranceVM Insurance { get; set; }
        public PatientSchemeMapModel PatientSchemeMap { get; set; }
    }

    public class InsuranceVM
    {
        public int PatientId { get; set; }
        public int InsuranceProviderId { get; set; }
        public double InitialBalance { get; set; }
        public double CurrentBalance { get; set; }
        public double? InsuranceProvisionalAmount { get; set; } //For insurance Provisional Amount --Yubraj: 9th July '19
        public string InsuranceProviderName { get; set; }
        public string IMISCode { get; set; }
        public string InsuranceNumber { get; set; }
        public PatientInsurancePkgTxnVM PatientInsurancePkgTxn { get; set; }
        public double? Ins_InsuranceBalance { get; set; }
    }

    public class PatientInsurancePkgTxnVM
    {
        public int PatientInsurancePackageId { get; set; }
        public int PackageId { get; set; }
        public string PackageName { get; set; }
        public DateTime StartDate { get; set; }
    }

    public class AdditionalItemInfoVM
    {
        public int ServiceDepartmentId { get; set; }
        public int ItemId { get; set; }
    }
    public class AdditionalItemInfoListVM
    {
        public List<AdditionalItemInfoVM> ItemList { get; set; }
    }
    //ashim: 14Sep2018 --added for discharge bill receipts.
    //discharge bill view models

    public class AdmissionDetailVM
    {
        public DateTime AdmissionDate { get; set; }
        public DateTime DischargeDate { get; set; }
        public string AdmittingDoctor { get; set; }
        public string Department { get; set; }
        public float LengthOfStay { get; set; }
        public string RoomType { get; set; }
        public string ProcedureType { get; set; }
        public string CarePersonName { get; set; }
        public string CarePersonContact { get; set; }
        public string Relation { get; set; }
    }

    public class DepositDetailVM
    {
        public int DepositId { get; set; }
        public string ReceiptNo { get; set; }
        public int? ReceiptNum { get; set; } //yubraj 16th Jan '19 --to check receipt no for client side
        public DateTime? Date { get; set; }
        //public double? Amount { get; set; }
        public decimal InAmount { get; set; }
        public decimal OutAmount { get; set; }
        public decimal Balance { get; set; }
        public string TransactionType { get; set; }
        public string ReferenceInvoice { get; set; }
        public bool IsCurrent { get; set; }
        public bool IsActive { get; set; }
    }

    public class PatientDetailVM
    {
        public int PatientId { get; set; }
        public string PatientCode { get; set; }
        public string ShortName { get; set; }
        public string AgeFormatted { get; set; }
        public string HospitalNo { get; set; }
        public string InpatientNo { get; set; }
        public string PatientName { get; set; }
        public string Address { get; set; }
        public string CountrySubDivisionName { get; set; }
        public string CountryName { get; set; }
        public string MunicipalityName { get; set; }
        public Int16? WardNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string ContactNo { get; set; }
        public string Gender { get; set; }
        public string PANNumber { get; set; } // sud: 4Nov'19--needed for IpBilling Receipt.
        public string Ins_NshiNumber { get; set; }
        //sud:1-Oct'21--Changing Claimcode from String to Int64-- to use Incremental logic (max+1)
        //need nullable since ClaimCode is Non-Mandatory for normal visits.
        public Int64? ClaimCode { get; set; }
        public string MembershipTypeName { get; set; }
        public string SSFPolicyNo { get; set;}
        public string PolicyNo { get; set; }
        public string SchemeName { get; set; }
        public string FieldSettingsParamName { get; set; }
      
    }
    public class BillingTransactionDetailVM
    {
        public string FiscalYear { get; set; }
        public int? ReceiptNo { get; set; }
        public string InvoiceNumber { get; set; }
        public DateTime? BillingDate { get; set; }
        public string PaymentMode { get; set; }
        public double? DepositBalance { get; set; }
        //public double? DepositDeductAmount { get; set; }
        public double? DepositAvailable { get; set; }//sud:11May'21--New fields added in BillingTransactionTable.
        public double? DepositUsed { get; set; }//sud:11May'21--New fields added in BillingTransactionTable.
        public double? DepositReturnAmount { get; set; }//sud:11May'21--New fields added in BillingTransactionTable.
        public double? Discount { get; set; }
        public double? TotalAmount { get; set; }
        public double? SubTotal { get; set; }
        public double? Quantity { get; set; }
        public double? Tender { get; set; }//pratik: 3march'20--  For ip billing recipt
        public double? Change { get; set; }//pratik: 3march'20--  For ip billing recipt
        public int? CreatedBy { get; set; }
        public string User { get; set; }
        public string Remarks { get; set; }
        public int? PrintCount { get; set; }
        public bool? ReturnStatus { get; set; }

        //Yubraj: 22nd April '19 for credit organization 
        public int? OrganizationId { get; set; }
        public string OrganizationName { get; set; }
        public double? ExchangeRate { get; set; } //sanjit: 5-17-2019 for foreign exchange
        public bool? IsInsuranceBilling { get; set; }
        public string LabTypeName { get; set; }

    }

    public class BillItemVM
    {
        public DateTime BillDate { get; set; }
        public string ItemGroupName { get; set; }
        public string ItemName { get; set; }
        public string DoctorName { get; set; }
        public double Price { get; set; }
        public int Quantity { get; set; }
        public double SubTotal { get; set; }
        public double DiscountAmount { get; set; }
        public double TaxAmount { get; set; }
        public double TotalAmount { get; set; }
    }

    public class DischargeDetailVM
    {
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int? DiscountSchemeId { get; set; }
        public DateTime? DischargeDate { get; set; }
        public string BillStatus { get; set; }
        public string Remarks { get; set; }
        public string ProcedureType { get; set; }
        public int BillingTransactionId { get; set; }
        public double? DepositBalance { get; set; } //Krishna, 31stMarch'23, Adding this here as it is being used by DischargeBillingController
        public int CounterId { get; set; } //Krishna, 31stMarch'23, Adding this here as it is being used by DischargeBillingController

    }

    public class BedDetailVM
    {
        public int PatientBedInfoId { get; set; }
        public int BedFeatureId { get; set; }
        public string WardName { get; set; }
        public string BedCode { get; set; }
        public string BedFeature { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal BedPrice { get; set; }
        public string Action { get; set; }
        public double Days { get; set; }
        //only used in client side
        public bool? IsQuantityUpdated { get; set; }
    }

    public class BedDurationTxnDetailsVM
    {
        public int PatientVisitId { get; set; }
        public int BedFeatureId { get; set; }
        public double Days { get; set; }
        public double SubTotal { get; set; }
        public double TaxableAmount { get; set; }
        public double NonTaxableAmount { get; set; }
        public double TotalDays { get; set; }

    }

    public class BillingTxnItemsVM
    {
        public int BillTransactionItemId { get; set; }
        public int BillItemPriceId { get; set; }
        public string ItemName { get; set; }
        public string BillingType { get; set; }
        public int PatientId { get; set; }
        public string ProviderName { get; set; }
        public string ServiceDepartmentName { get; set; }
        public double? TotalAmount { get; set; }
        public string PatientName { get; set; }
        public DateTime? RequisitionDate { get; set; }

        public FractionCalculationModel FractionCalculation { set; get; }
    }

    public class EstimationDischargeBillItemVM
    {
        public DateTime? BillDate { get; set; }
        public int ServiceDepartmentId { get; set; }
        public string ServiceDepartmentName { get; set; }
        public int ServiceItemId { get; set; }
        public string ItemName { get; set; }
        public int? DoctorId { get; set; }
        public string DoctorName { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public decimal SubTotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal? Tax { get; set; }
        public decimal TotalAmount { get; set; }
        public string ItemCode { get; set; }

        public int? ServiceCategoryId { get; set; }
        public string ServiceCategoryName { get; set;}
        public int IntegrationItemId { get; set; }

        public string IntegrationName { get; set; }

    }

    public class EstimationDischareBillSummayVM
    {
        public string GroupName { get; set; }
        public decimal SubTotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public static class SeralizeBillingModelView {
        public static List<T> MapDataTableToObjectList<T>(object vmData)
        {
            List<T> retListObj = new List<T>();
            if (vmData != null)
            {
                string strDepItms = JsonConvert.SerializeObject(vmData);
                retListObj = JsonConvert.DeserializeObject<List<T>>(strDepItms);
            }
            return retListObj;
        }
    }
}
