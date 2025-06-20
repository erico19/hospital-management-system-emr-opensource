﻿using DanpheEMR.Services.Accounting.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel
{
    public class AccountClosureVM
    {
        public virtual AccountingFiscalYear_DTO nextFiscalYear { get; set; }
        public virtual TransactionModel TnxModel { get; set; }
    }

    public class AccountingTxnSyncVM
    {
        public virtual List<SyncBillingAccountingModel> billingSyncs { get; set; }
        public virtual List<TransactionModel> txnModels { get; set; }
        //public virtual List<TransactionLinkModel> txnLinks { get; set; }
    }

    //sud-nagesh:21June-To reuse this from session and other places.
    public class AccHospitalInfoVM
    {
        public int? ActiveHospitalId { get; set; }
        public List<AccountingFiscalYear_DTO> FiscalYearList { get; set; }
        public List<AccSectionModel> SectionList { get; set; }
        public DateTime TodaysDate { get; set; }

        public string HospitalShortName { get; set; }
        public string HospitalLongName { get; set; }
        public AccountingFiscalYear_DTO CurrFiscalYear { get; set; }

    }

    public class InventoryHospitalInfoVM
    {
        public int? ActiveHospitalId { get; set; }
        public List<FiscalYearModel> FiscalYearList { get; set; }
        public List<AccSectionModel> SectionList { get; set; }
        public DateTime TodaysDate { get; set; }

        public string HospitalShortName { get; set; }
        public string HospitalLongName { get; set; }
        public FiscalYearModel CurrFiscalYear { get; set; }

    }
    //Bibek:12March '24 To reuse this from session and other places.

    public class CommonHospitalInfoVM
    {
        public int? ActiveHospitalId { get; set; }
        public List<FiscalYearModel> FiscalYearList { get; set; }
        public DateTime TodaysDate { get; set; }

        public FiscalYearModel CurrFiscalYear { get; set; }
    }
}