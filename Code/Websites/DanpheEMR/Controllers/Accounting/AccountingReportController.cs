﻿using DanpheEMR.AccTransfer;
using DanpheEMR.CommonTypes;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.AccountingModels;
using DanpheEMR.ServerModel.AccountingModels.DTOs;
using DanpheEMR.Services.Accounting.DTOs;
using DanpheEMR.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;
// For more information on enabling MVC for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace DanpheEMR.Controllers
{
    [DanpheDataFilter()]
    [Route("api/[controller]")]
    public class AccountingReportController : CommonController
    {

        private AccountingDbContext _accountingDbContext;
        private IncentiveDbContext _incentiveDbContext;
        private InventoryDbContext _inventoryDbContext;
        private PharmacyDbContext _pharmacyDbContext;
        public AccountingReportController(IOptions<MyConfiguration> _config) : base(_config)
        {
            //connString = _config.Value.Connectionstring;
            _accountingDbContext = new AccountingDbContext(connString);
            _incentiveDbContext = new IncentiveDbContext(connString);
            _inventoryDbContext = new InventoryDbContext(connString);
            _pharmacyDbContext = new PharmacyDbContext(connString);
        }
        /// <summary>
        /// This API is used to get Data for Accounting Ageing Report.
        /// </summary>
        /// <param name="NumberOfInterval">Count of Date Interval to show in report.</param>
        /// <param name="IntervalDuration">The Day count between the interval.</param>
        /// <param name="SectionIds">The section Ids in CSV format will be received from client.</param>
        /// <param name="IsVendorBillWiseTxn">Either user wants ageing based upon good receipt date or vendor bill date.</param>
        /// <returns></returns>
        [HttpGet]
        [Route("AgeingReport")]
        public string AgeingReport(int NumberOfInterval, int IntervalDuration, string SectionIds, bool IsVendorBillWiseTxn)
        {
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            List<SqlParameter> paramList = new List<SqlParameter>()
                {
                    new SqlParameter("@CounterInterval", IntervalDuration),
                    new SqlParameter("@NumIntervals", NumberOfInterval),
                    new SqlParameter("@SectionIds",SectionIds),
                    new SqlParameter("@ShowVendorBillWiseTxn", IsVendorBillWiseTxn)
                };
            DataTable result = DALFunctions.GetDataTableFromStoredProc("SP_ACC_RPT_GetAgeingReport", paramList, _accountingDbContext);
            responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.OK;
            responseData.Results = result;
            return DanpheJSONConvert.SerializeObject(responseData);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="SectionId">SectionId may be the Id for pharmacy=3 or Inventory=1 modules.</param>
        /// <param name="FromDate">Start date for the report.</param>
        /// <param name="ToDate">End data for the report. </param>
        /// <param name="SupplierId">Supplier Identifier.</param>
        /// <param name="IsVendorBillWiseTxn">Either user wants ageing based upon good receipt date or vendor bill date.</param>
        /// <returns></returns>
        [HttpGet]
        [Route("AgeingReportDetail")]
        public string AgeingReportDetailView(int SectionId, DateTime? FromDate, DateTime? ToDate,int SupplierId, bool IsVendorBillWiseTxn)
        {
            if (FromDate == DateTime.MinValue)
            {
                FromDate = null;
            }

            if (ToDate == DateTime.MinValue)
            {
                ToDate = null;
            }

            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            List<SqlParameter> paramList = new List<SqlParameter>()
                {
                    new SqlParameter("@SectionId",SectionId),
                    new SqlParameter("@FromDate",FromDate),
                    new SqlParameter("@ToDate",ToDate),
                    new SqlParameter("@SupplierId",SupplierId),
                    new SqlParameter("@ShowVendorBillWiseTxn", IsVendorBillWiseTxn)
                };
            DataTable result = DALFunctions.GetDataTableFromStoredProc("SP_ACC_RPT_GetAgeingReportDetail", paramList, _accountingDbContext);
            responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.OK;
            responseData.Results = result;
            return DanpheJSONConvert.SerializeObject(responseData);
        }

        [HttpGet]
        [Route("TransactionWiseAgeingReport")]
        public string TransactionWiseAgeingReport()
        {
            int currentHospitalId = HttpContext.Session.Get<int>(ENUM_SessionValues.CurrentHospitalId);
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            List<SqlParameter> paramList = new List<SqlParameter>()
                {
                new SqlParameter("@HospitalId",currentHospitalId)
                };
            DataTable result = DALFunctions.GetDataTableFromStoredProc("SP_ACC_RPT_GetLedgerAgingSummaryWithLedgerFilter", paramList, _accountingDbContext);
            responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.OK;
            responseData.Results = result;
            return DanpheJSONConvert.SerializeObject(responseData);
        }

        [HttpPost]
        [Route("LedgerListReport")]
        public string LedgerListReport([FromBody] LedgerReportRequest_DTO clientData)
        {
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            if (clientData != null)
            {
                int AllCostCenterAliasId = -2;
                List<int> ledgerIds = clientData.LedgerIds;

                int currentHospitalId = clientData.HospitalId;
                AccountingDbContext accountingDBContext = new AccountingDbContext(connString);

                var showTxnItemLevelPar = (from p in accountingDBContext.CFGParameters
                                           where p.ParameterGroupName.ToLower() == "accounting" && p.ParameterName == "ShowLedgerReportTxnItemLevel"
                                           select p).FirstOrDefault();
                var showTxnItemLevel = (showTxnItemLevelPar != null) ? Convert.ToBoolean(showTxnItemLevelPar.ParameterValue) : true;
                var fYearId = AccountingTransferData.GetFiscalYearIdForOpeningBalance(accountingDBContext, clientData.FiscalYearId, currentHospitalId);
                //NBB-09 june 202
                //issue resolved using below code lines
                //if we don't have ledger txn data within selected date then LedgerData count in 0
                //and here we are not considering Ledger Opening balance, so we will get and add ledger Opening balance here into dataList balance
                //here we have added logic in datalist AmountDr and AmountCr with + on condition
                var led = (from l in accountingDBContext.Ledgers
                           join lbh in accountingDBContext.LedgerBalanceHistory on l.LedgerId equals lbh.LedgerId
                           where ledgerIds.Contains(lbh.LedgerId)
                           && lbh.HospitalId == currentHospitalId && lbh.FiscalYearId == fYearId && l.HospitalId == currentHospitalId
                           select new
                           {
                               OpeningBalance = (clientData.CostCenterId == AllCostCenterAliasId) ? lbh.OpeningBalance : 0,
                               DrCr = lbh.OpeningDrCr == null ? true : lbh.OpeningDrCr,
                               lbh.LedgerId,
                               l.LedgerName
                           }).ToList();

                var LedgerData = (from t in accountingDBContext.Transactions
                                  join ti in accountingDBContext.TransactionItems on t.TransactionId equals ti.TransactionId
                                  join l in accountingDBContext.Ledgers on ti.LedgerId equals l.LedgerId
                                  join v in accountingDBContext.Vouchers on t.VoucherId equals v.VoucherId
                                  join lbh in accountingDBContext.LedgerBalanceHistory on l.LedgerId equals lbh.LedgerId
                                  where
                                  ti.HospitalId == currentHospitalId
                                  && l.HospitalId == currentHospitalId && l.HospitalId == currentHospitalId && lbh.HospitalId == currentHospitalId && v.HospitalId == currentHospitalId &&
                                  (ledgerIds.Contains(ti.LedgerId)) && (DbFunctions.TruncateTime(t.TransactionDate) >= clientData.FromDate && DbFunctions.TruncateTime(t.TransactionDate) <= clientData.ToDate)
                                  && lbh.FiscalYearId == fYearId && (ti.CostCenterId == clientData.CostCenterId || clientData.CostCenterId == AllCostCenterAliasId)
                                  && t.IsVerified == true
                                  select new
                                  {
                                      t.TransactionId,
                                      t.TransactionDate,
                                      t.VoucherNumber,
                                      l.LedgerName,
                                      l.Code,
                                      OpeningBalance = lbh.OpeningBalance,
                                      OpeningBalanceType = lbh.OpeningDrCr == null ? true : lbh.OpeningDrCr,
                                      t.FiscalyearId,
                                      v.VoucherName,
                                      t.SectionId,
                                      ti.Amount,
                                      ti.DrCr,
                                      Description = (t.SectionId == 4) ? ti.Description : "",//get description only for manual voucher entry, 4 Id for Manual section
                                      ti.LedgerId,
                                      Narration = t.Remarks
                                  }).ToList();

                List<DataListDTOModel> dataList = new List<DataListDTOModel>();


                var openingBalanceFiscalYear = (from f in accountingDBContext.FiscalYears
                                                join map in accountingDBContext.MapFiscalYears
                                                on f.FiscalYearId equals map.FiscalYearId
                                                where map.FiscalYearId == fYearId && map.HospitalId == currentHospitalId
                                                select f).FirstOrDefault();
                var dataList1 = (from t in accountingDBContext.Transactions
                                 join ti in accountingDBContext.TransactionItems on t.TransactionId equals ti.TransactionId
                                 join l in accountingDBContext.Ledgers on ti.LedgerId equals l.LedgerId
                                 where
                                 ti.HospitalId == currentHospitalId
                                 && l.HospitalId == currentHospitalId &&
                                 (ledgerIds.Contains(ti.LedgerId)) && (DbFunctions.TruncateTime(t.TransactionDate) >= DbFunctions.TruncateTime(openingBalanceFiscalYear.StartDate) && DbFunctions.TruncateTime(t.TransactionDate) <= clientData.ToDate)
                                 && (ti.CostCenterId == clientData.CostCenterId || clientData.CostCenterId == AllCostCenterAliasId)
                                 && t.IsVerified == true
                                 group new { t, ti, l } by new
                                 {
                                     l.LedgerId,
                                 }
                                into x
                                 select new
                                 {
                                     FiscalYearId = fYearId,
                                     LedgerId = x.Key.LedgerId,
                                     AmountDr = x.Where(b => b.ti.DrCr == true && DbFunctions.TruncateTime(b.t.TransactionDate) < clientData.FromDate).Select(a => a.ti.Amount).DefaultIfEmpty(0).Sum(),// + (led.Where(a=> a.LedgerId == x.Key.LedgerId && a.DrCr == true).Select(a=>a.OpeningBalance).Sum()),
                                     AmountCr = x.Where(b => b.ti.DrCr == false && DbFunctions.TruncateTime(b.t.TransactionDate) < clientData.FromDate).Select(a => a.ti.Amount).DefaultIfEmpty(0).Sum()// + (led.Where(a => a.LedgerId == x.Key.LedgerId && a.DrCr == false).Select(a => a.OpeningBalance).Sum()),
                                 }).ToList();

                dataList1 = (
                             from l in led
                             join data in dataList1 on l.LedgerId equals data.LedgerId into da
                             from dat in da.DefaultIfEmpty()
                             select new
                             {
                                 FiscalYearId = fYearId,
                                 LedgerId = l.LedgerId,
                                 AmountDr = dat == null ? (l.DrCr == true ? l.OpeningBalance : 0) : dat.AmountDr + (l.DrCr == true ? l.OpeningBalance : 0),
                                 AmountCr = dat == null ? (l.DrCr == false ? l.OpeningBalance : 0) : dat.AmountCr + (l.DrCr == false ? l.OpeningBalance : 0)
                             }).ToList();

                //if (LedgerData.Count == 0 && dataList1.Count == 0)
                //{
                //    var dToday = DateTime.Now.Date;
                //    var fYId = AccountingTransferData.GetFiscalYearIdByDate(accountingDBContext, dToday, currentHospitalId);
                //    dataList.Add(new DataListDTOModel
                //    {
                //        FiscalYearId = fYId,
                //        LedgerId = dataList1[0].LedgerId, 
                //        AmountDr = ((led.DrCr == true) ? led.OpeningBalance : 0),
                //        AmountCr = ((led.DrCr == false) ? led.OpeningBalance : 0)
                //    });

                //}
                if (dataList1.Count > 0)
                {
                    dataList1.ForEach(ss =>
                    {
                        dataList.Add(
                            new DataListDTOModel
                            {
                                FiscalYearId = ss.FiscalYearId,
                                LedgerId = ss.LedgerId,
                                AmountDr = ss.AmountDr,
                                AmountCr = ss.AmountCr
                            });
                    });

                }
                var result = (from itm in LedgerData.AsEnumerable()
                              join data in dataList.AsEnumerable() on itm.LedgerId equals data.LedgerId
                              select new
                              {
                                  itm.TransactionId,
                                  itm.TransactionDate,
                                  itm.VoucherNumber,
                                  itm.LedgerName,
                                  itm.Code,
                                  itm.VoucherName,
                                  LedgerDr = (itm.DrCr == true) ? itm.Amount : 0,
                                  LedgerCr = (itm.DrCr == false) ? itm.Amount : 0,
                                  itm.Amount,
                                  itm.DrCr,
                                  data.AmountCr,
                                  data.AmountDr,
                                  Balance = 0,
                                  BalanceType = true,
                                  OpeningBalance = itm.OpeningBalanceType == true ? (data.AmountDr - data.AmountCr) : (data.AmountCr - data.AmountDr),
                                  itm.OpeningBalanceType,
                                  DepartmentName = "TempTest",
                                  itm.Description,
                                  itm.LedgerId,
                                  itm.Narration,
                                  TransactionItems = (showTxnItemLevel == true) ? null :
                                                                                    (from txnItm in accountingDBContext.TransactionItems
                                                                                     where txnItm.HospitalId == currentHospitalId
                                                                                     join ledger in accountingDBContext.Ledgers on txnItm.LedgerId equals ledger.LedgerId
                                                                                     join txn in accountingDBContext.Transactions on txnItm.TransactionId equals itm.TransactionId
                                                                                     join v in accountingDBContext.Vouchers on txn.VoucherId equals v.VoucherId
                                                                                     where
                                                                                     ledger.HospitalId == currentHospitalId &&
                                                                                     txnItm.TransactionId == txn.TransactionId && txn.IsActive == true && v.VoucherName == itm.VoucherName
                                                                                     && (DbFunctions.TruncateTime(txn.TransactionDate) >= clientData.FromDate && DbFunctions.TruncateTime(txn.TransactionDate) <= clientData.ToDate)
                                                                                     && ledger.LedgerName != itm.LedgerName && txn.TransactionDate == itm.TransactionDate
                                                                                     && txn.IsVerified == true
                                                                                     select new
                                                                                     {
                                                                                         txnItm.TransactionItemId,
                                                                                         LedgerName = ledger.LedgerName,
                                                                                         Code = ledger.Code,
                                                                                         DrCr = txnItm.DrCr,
                                                                                         LedAmount = txnItm.Amount,
                                                                                         Description = (txn.SectionId == 4) ? txnItm.Description : "",//get description only for manual voucher entry, 4 Id for Manual section
                                                                                         Details = (from txnitm in accountingDBContext.TransactionItems
                                                                                                    where txnitm.HospitalId == currentHospitalId
                                                                                                    join txndetail in accountingDBContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
                                                                                                    join pat in accountingDBContext.PatientModel on txndetail.ReferenceId equals pat.PatientId
                                                                                                    where txnItm.TransactionItemId == txnitm.TransactionItemId && txn.VoucherNumber == itm.VoucherNumber && txndetail.ReferenceType == "Patient"
                                                                                                    group new { txnitm, pat, txndetail } by new
                                                                                                    {
                                                                                                        txndetail.ReferenceId,
                                                                                                        txnitm.DrCr
                                                                                                    } into x1
                                                                                                    select new
                                                                                                    {
                                                                                                        Id = x1.Key.ReferenceId,
                                                                                                        Name = x1.Select(a => a.pat.FirstName + a.pat.LastName).FirstOrDefault(),
                                                                                                        DrCr = x1.Key.DrCr,
                                                                                                        Amount = x1.Select(a => a.txndetail.Amount).Sum(),
                                                                                                    }).ToList(),
                                                                                         CapitalsGoods = (from txnitm in accountingDBContext.TransactionItems
                                                                                                          where txnitm.HospitalId == currentHospitalId
                                                                                                          join txndetail in accountingDBContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
                                                                                                          join pat in accountingDBContext.InventoryItems on txndetail.ReferenceId equals pat.ItemId
                                                                                                          where txnItm.TransactionItemId == txnitm.TransactionItemId && txn.VoucherNumber == itm.VoucherNumber && txndetail.ReferenceType == "Capital Goods Items"
                                                                                                          group new { txnitm, pat, txndetail } by new
                                                                                                          {
                                                                                                              txndetail.ReferenceId,
                                                                                                              txnitm.DrCr
                                                                                                          } into x1
                                                                                                          select new
                                                                                                          {
                                                                                                              Id = x1.Key.ReferenceId,
                                                                                                              Name = x1.Select(a => a.pat.ItemName).FirstOrDefault(),
                                                                                                              DrCr = x1.Key.DrCr,
                                                                                                              Amount = x1.Select(a => a.txndetail.Amount).Sum(),
                                                                                                          }).ToList(),
                                                                                     }).OrderByDescending(a => a.DrCr == true).ToList(),
                              }).ToList();
                result.ForEach(itm =>
                {
                    if (itm.TransactionItems != null)
                    {
                        itm.TransactionItems.ForEach(txn =>
                        {
                            foreach (var det in txn.CapitalsGoods)
                            {
                                txn.Details.Add(det);
                            }
                        });
                    }

                });
                //var modifiedResult = new {
                //    for(int i=0; i < dataList.Count(), i++)
                //    {
                //        LedgerId = dataList[i].LedgerId
                //    }
                //};

                var FinalData = new
                {
                    result,
                    dataList
                };
                responseData.Status = ENUM_DanpheHttpResponseText.OK;
                responseData.Results = FinalData;
            }
            else
            {
                responseData.Status = ENUM_DanpheHttpResponseText.Failed;
                responseData.ErrorMessage = "Invalid data received from client.";
            }
            return DanpheJSONConvert.SerializeObject(responseData);
        }

        #region Cash/Bank Book Report
        [HttpGet]
        [Route("CashBankBookReport")]
        public string CashBankBookReport(DateTime fromDate, DateTime toDate, int fiscalYearId, string ledgerIds,int HospitalId)
        {
            AccountingDbContext accountingDBContext = new AccountingDbContext(connString);
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            List<SqlParameter> paramList = new List<SqlParameter>()
                {
                    new SqlParameter("@FromDate", fromDate),
                    new SqlParameter("@ToDate", toDate),
                    new SqlParameter("@OpeningFiscalYearId",fiscalYearId),
                    new SqlParameter("@LedgerIds",ledgerIds),
                    new SqlParameter("@HospitalId", HospitalId)
                };
            DataSet result = DALFunctions.GetDatasetFromStoredProc("SP_ACC_RPT_Cash_BankBookReport", paramList, accountingDBContext);
            var OpeningData = DataTableToList.ToDynamic(result.Tables[0]);
            var TransactionData = DataTableToList.ToDynamic(result.Tables[1]);
            var FinalData = new
            {
                OpeningData,
                TransactionData
            };
            responseData.Status = "OK";
            responseData.Results = FinalData;
            return DanpheJSONConvert.SerializeObject(responseData);
        }
        #endregion Cash/Bank Book Report

        #region Day Book Report
        [HttpGet]
        [Route("DayBookReport")]
        public string DayBookReport(DateTime fromDate, DateTime toDate, int fiscalYearId, int ledgerId, int HospitalId)
        {
            AccountingDbContext accountingDBContext = new AccountingDbContext(connString);
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            List<SqlParameter> paramList = new List<SqlParameter>()
                {
                    new SqlParameter("@FromDate", fromDate),
                    new SqlParameter("@ToDate", toDate),
                    new SqlParameter("@LedgerId",ledgerId),
                    new SqlParameter("@HospitalId", HospitalId),
                    new SqlParameter("@OpeningFiscalYearId",fiscalYearId)
                };
            DataSet result = DALFunctions.GetDatasetFromStoredProc("SP_ACC_RPT_Day_Book_Report", paramList, accountingDBContext);
            var OpeningData = DataTableToList.ToDynamic(result.Tables[0]);
            var TransactionData = DataTableToList.ToDynamic(result.Tables[1]);
            var FinalData = new
            {
                OpeningData,
                TransactionData
            };
            responseData.Status = "OK";
            responseData.Results = FinalData;
            return DanpheJSONConvert.SerializeObject(responseData);
        }
        #endregion Day Book Report

        #region Bank Reconciliation Report
        [HttpGet]
        [Route("BankReconciliationReport")]
        public string BankReconciliationReport(int ledgerId, DateTime fromDate, DateTime toDate, int fiscalYearId, int voucherTypeId, int status, int subLedgerId)
        {
            AccountingDbContext accountingDBContext = new AccountingDbContext(connString);
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            int currentHospitalId = HttpContext.Session.Get<int>(ENUM_SessionValues.CurrentHospitalId);
            List<SqlParameter> paramList = new List<SqlParameter>()
                {
                    new SqlParameter("@FromDate", fromDate),
                    new SqlParameter("@ToDate", toDate),
                    new SqlParameter("@LedgerId",ledgerId),
                    new SqlParameter("@VoucherTypeId",voucherTypeId),
                    new SqlParameter("@Status",status),
                    new SqlParameter("@SubLedgerId",subLedgerId),
                    new SqlParameter("@HospitalId",currentHospitalId)
                };
            DataSet result = DALFunctions.GetDatasetFromStoredProc(ENUM_StoredProcedures.BankReconciliationReport, paramList, accountingDBContext);
            var TransactionData = DataTableToList.ToDynamic(result.Tables[0]);
            var ReconcileOpening = DataTableToList.ToDynamic(result.Tables[1]);
            var FinalData = new
            {
                TransactionData,
                ReconcileOpening
            };
            responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.OK;
            responseData.Results = FinalData;
            return DanpheJSONConvert.SerializeObject(responseData);
        }
        #endregion Bank Reconciliation Report

        // GET: api/values

        #region Sub Ledger Report
        [HttpPost]
        [Route("SubLedgerReport")]
        public string SubLedgerReport([FromBody] SubLedgerReportRequest_DTO clientDTO)
        {
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            try
            {
                AccountingDbContext accountingDBContext = new AccountingDbContext(connString);
                int currentHospitalId = HttpContext.Session.Get<int>(ENUM_SessionValues.CurrentHospitalId);
                List<SqlParameter> paramList = new List<SqlParameter>()
                {
                    new SqlParameter("@FromDate", clientDTO.FromDate),
                    new SqlParameter("@ToDate", clientDTO.ToDate),
                    new SqlParameter("@OpeningFiscalYearId",clientDTO.FiscalYearId),
                    new SqlParameter("@HospitalId", currentHospitalId),
                    new SqlParameter("@SubLedgerIds",string.Join(",", clientDTO.SubLedgerIds))
                };
                DataSet result = DALFunctions.GetDatasetFromStoredProc(ENUM_StoredProcedures.SubLedgerReport, paramList, accountingDBContext);
                var OpeningData = DataTableToList.ToDynamic(result.Tables[0]);
                var TransactionData = DataTableToList.ToDynamic(result.Tables[1]);
                var FinalData = new
                {
                    OpeningData,
                    TransactionData
                };
                responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.OK;
                responseData.Results = FinalData;
                return DanpheJSONConvert.SerializeObject(responseData);
            }
            catch (Exception ex)
            {
                responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                responseData.ErrorMessage = ex.Message;
                return DanpheJSONConvert.SerializeObject(responseData);
            }
        }
        #endregion Sub Ledger Report

        [HttpGet]
        [Route("VoucherReport")]
        public IActionResult VoucherReport(DateTime FromDate, DateTime ToDate, int sectionId, int hospitalId)
        {
            //if (reqType == "voucher-report")
            Func<object> func = () => GetVoucherReport(FromDate, ToDate, sectionId, hospitalId);
            return InvokeHttpGetFunction<object>(func);

        }   

        [HttpGet]
        [Route("LedgerReport")]
        public IActionResult LedgerReport(int ledgerId, DateTime FromDate, DateTime ToDate, int FiscalYearId, int HospitalId)
        {
            //if (reqType == "ledger-report")
            Func<object> func = () => GetLedgerReport(ledgerId, FromDate, ToDate, FiscalYearId, HospitalId);
            return InvokeHttpGetFunction<object>(func);
        }  

        [HttpGet]
        [Route("TrailBalanceReport")]
        public IActionResult TrailBalanceReport(DateTime FromDate, DateTime ToDate, int FiscalYearId, int HospitalId)
        { //if (reqType == "trailBalanceReport")
            Func<object> func = () => GetTrailBalanceReport(FromDate, ToDate, FiscalYearId, HospitalId);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("GroupStatementReport")]
        public IActionResult GroupStatementReport(DateTime FromDate, DateTime ToDate, int FiscalYearId, int LedgerGroupId, int HospitalId)
        {
            //if (reqType == "groupStatementReport")
            Func<object> func = () => GetGroupStatementReport(FromDate, ToDate, FiscalYearId, LedgerGroupId, HospitalId);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("ProfitAndLossReport")]
        public IActionResult ProfitAndLossReport(DateTime FromDate, DateTime ToDate, int FiscalYearId, int HospitalId)
        {
            //  if (reqType == "profitLossReport")
            Func<object> func = () => GetProfitLossReport(FromDate, ToDate, FiscalYearId, HospitalId);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("BalanceSheetReport")]
        public IActionResult BalanceSheetReport(DateTime selectedDate, int FiscalYearId, int HospitalId)
        {
            // else if (reqType == "balanceSheetReportData")
            Func<object> func = () => GetBalanceSheet(selectedDate, FiscalYearId, HospitalId);
            return InvokeHttpGetFunction<object>(func);

        }
        [HttpGet]
        [Route("DailyTransactionReport")]
        public IActionResult DailyTransactionReport(DateTime FromDate, DateTime ToDate, int HospitalId)
        {
            //else if (reqType == "daily-txn-report")
            int currentHospitalId = HospitalId;
            Func<object> func = () => (from txn in _accountingDbContext.Transactions
                                       where txn.HospitalId == currentHospitalId 
                                       && (DbFunctions.TruncateTime(txn.TransactionDate) >= FromDate && DbFunctions.TruncateTime(txn.TransactionDate) <= ToDate)
                                       && txn.IsVerified == true
                                       group new { txn } by new { txn.TransactionDate, txn.VoucherNumber, txn.SectionId } into x
                                       select new
                                       {
                                           TransactionId = x.Select(a => a.txn.TransactionId),
                                           x.Key.VoucherNumber,
                                           x.Key.TransactionDate,
                                           TransactionType = x.Select(a => a.txn.TransactionType),
                                           SectionId = x.Key.SectionId,
                                           txnItems = (from itm in _accountingDbContext.TransactionItems
                                                       where itm.HospitalId == currentHospitalId
                                                       join l in _accountingDbContext.Ledgers on itm.LedgerId equals l.LedgerId
                                                       join newtxn in x on itm.TransactionId equals newtxn.txn.TransactionId
                                                       where l.HospitalId == currentHospitalId
                                                       group new { itm, l } by new { l.LedgerId } into y
                                                       select new
                                                       { 
                                                           LedgerName = y.Select(a => a.l.LedgerName).FirstOrDefault(),
                                                           DrAmount = y.Where(a => a.itm.DrCr == true).Sum(a => (decimal?)a.itm.Amount),
                                                           CrAmount = y.Where(a => a.itm.DrCr == false).Sum(a => (decimal?)a.itm.Amount),
                                                           Code = y.Select(a => a.l.Code).FirstOrDefault()
                                                       }).ToList()
                                       }).OrderBy(a => a.TransactionDate).ToList();
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("TransactionOriginDetail")]
        public IActionResult TransactionOriginDetail(string transactionIds)
        {
            //else if (reqType == "txn-Origin-details")
            Func<object> func = () => GetTransactionOriginDetail(transactionIds);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("CashFlowReport")]
        public IActionResult CashFlowReport(DateTime FromDate, DateTime ToDate, int FiscalYearId, int HospitalId)
        {
            //else if (reqType == "cashflowReportData")
            Func<object> func = () => GetCashFlowReport(FromDate, DateTime.Today, FiscalYearId, HospitalId);
            return InvokeHttpGetFunction<object>(func);
        }
        [HttpGet]
        [Route("DayWiseVoucherReport")]
        public IActionResult DayWiseVoucherReport(DateTime FromDate, DateTime ToDate, int sectionId, int FiscalYearId)
        {
            // else if (reqType == "daywise-voucher-report")
            Func<object> func = () => GetDayWiseVoucherReport(FromDate, ToDate, sectionId, FiscalYearId);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("DayWiseVoucherDetailsByVoucherNo")]
        public IActionResult DayWiseVoucherDetailsByVoucherNo(int DayVoucherNumber, int voucherId, int sectionId)
        {
            Func<object> func = () => GetDayWiseVoucherDetailsByVoucherNo(DayVoucherNumber, voucherId, sectionId);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("SystemAuditReport")]
        public IActionResult SystemAuditReport(DateTime FromDate, DateTime ToDate, string voucherReportType, int sectionId, int HospitalId)
        {
            //if (reqType == "system-aduit-report")
            Func<object> func = () => GetSystemAuditReport(FromDate, ToDate, voucherReportType, sectionId, HospitalId);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("ReverseTransactionDetail")]
        public IActionResult ReverseTransactionDetail(int ReverseTransactionId)
        {
            // if (reqType == "reverse-transaction-detail")
            Func<object> func = () => GetReverseTransactionDetail(ReverseTransactionId);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("BankReconcilationReport")]
        public IActionResult BankReconcilationReport(DateTime FromDate, DateTime ToDate, int ledgerId, int FiscalYearId)
        {
            Func<object> func = () => GetBankReconcilationReport(FromDate, ToDate, ledgerId, FiscalYearId);
            return InvokeHttpGetFunction<object>(func);
        }

        [HttpGet]
        [Route("BankReconciliationHistory")]
        public IActionResult BankReconciliationHistory(string VoucherNumber,int FiscalYearId)
        {


            // else if (reqType == "Bank-Reconciliation-history")
            int currentHospitalId = HttpContext.Session.Get<int>(ENUM_SessionValues.CurrentHospitalId);

            Func<object> func = () => (from bank in _accountingDbContext.BankReconciliationModel
                                       join emp in _accountingDbContext.Emmployees on bank.CreatedBy equals emp.EmployeeId
                                       where bank.HospitalId == currentHospitalId && bank.VoucherNumber == VoucherNumber
                                       && bank.FiscalyearId == FiscalYearId

                                       select new
                                       {
                                           bank.LedgerId,
                                           bank.VoucherNumber,
                                           bank.TransactionId,
                                           bank.TransactionDate,
                                           bank.BankBalance,
                                           bank.BankTransactionDate,
                                           bank.Id,
                                           bank.CategoryId,
                                           bank.Remark,
                                           Balance = 0,
                                           User = emp.FullName,
                                       }).ToList();
            return InvokeHttpGetFunction<object>(func);

        }

        [HttpGet]
        [Route("VoucherVerification")]
        public IActionResult VoucherForVerification(DateTime FromDate, DateTime ToDate, int sectionId)
        {
            int currentHospitalId = HttpContext.Session.Get<int>(ENUM_SessionValues.CurrentHospitalId);
            Func<object> func = () => GetVoucherForVerification(currentHospitalId, FromDate, ToDate, sectionId);
            return InvokeHttpGetFunction<object>(func);
        }



        [HttpGet]
        [Route("AccountHeadDetailReport")]
        public object AccountHeadDetailReport(int HospitalId)
        {
            AccountingDbContext accountingDBContext = new AccountingDbContext(connString);
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            List<SqlParameter> paramList = new List<SqlParameter>()
                        { new SqlParameter("@HospitalId", HospitalId)};
            DataTable accountHeadDetailReport = DALFunctions.GetDataTableFromStoredProc("SP_ACC_AccountHeadDetailReport", paramList, accountingDBContext);

            responseData.Status = ENUM_Danphe_HTTP_ResponseStatus.OK;

            var result = (from row in accountHeadDetailReport.AsEnumerable()
                          group row by new { PrimaryGroupName = row.Field<string>("PrimaryGroupName") } into group1
                          select new
                          {
                              PrimaryGroupName = group1.Key.PrimaryGroupName,
                              COAList = (from row in group1
                                         group row by new { ChartOfAccountName = row.Field<string>("ChartOfAccountName"), COACode = row.Field<string>("COACode")} into group2
                                         select new
                                         {
                                             ChartOfAccountName = group2.Key.ChartOfAccountName,
                                             COACode = group2.Key.COACode,
                                             LedgerGroupList = (from row in group2
                                                                group row by new { LedgerGroupName = row.Field<string>("LedgerGroupName"), LedgerGroupCode = row.Field<string>("LedgerGroupCode") } into group3
                                                                select new
                                                                {
                                                                    LedgerGroupName = group3.Key.LedgerGroupName,
                                                                    LedgerGroupCode = group3.Key.LedgerGroupCode,
                                                                    LedgerList = (from row in group3
                                                                                  group row by new { LedgerName = row.Field<string>("LedgerName"), LedgerCode = row.Field<string>("LedgerCode") } into group4
                                                                                  select new
                                                                                  {
                                                                                     LedgerName = group4.Key.LedgerName,
                                                                                     LedgerCode = group4.Key.LedgerCode,
                                                                                     SubLedgerList = (from row in group4
                                                                                                      select new
                                                                                                      {
                                                                                                          PrimaryGroupId = row.Field<int>("PrimaryGroupId"),
                                                                                                          PrimaryGroupName = row.Field<string>("PrimaryGroupName"),
                                                                                                          ChartOfAccountId = row.Field<int>("ChartOfAccountId"),
                                                                                                          ChartOfAccountName = row.Field<string>("ChartOfAccountName"),
                                                                                                          COACode = row.Field<string>("COACode"),
                                                                                                          LedgerGroupId = row.Field<int>("LedgerGroupId"),
                                                                                                          LedgerGroupName = row.Field<string>("LedgerGroupName"),
                                                                                                          LedgerGroupCode = row.Field<string>("LedgerGroupCode"),
                                                                                                          LedgerId = row.Field<int>("LedgerId"),
                                                                                                          LedgerName = row.Field<string>("LedgerName"),
                                                                                                          LedgerCode = row.Field<string>("LedgerCode"),
                                                                                                          SubLedgerId =  row.Field<int>("SubLedgerId"),
                                                                                                          SubLedgerName = row.Field<string>("SubLedgerName"),
                                                                                                          SubLedgerCode = row.Field<string>("SubLedgerCode"),

                                                                                                      }).ToList()


                                                                                  }).ToList()
                                                                }).ToList()
                                         }).ToList()
                          }).ToList();

            responseData.Results = result;
            return responseData;
        }







        #region comment section migrate to api
        // GET: api/values
        //[HttpGet]
        //public string Get(string reqType, int ledgerId, DateTime FromDate, DateTime ToDate, /*int transactionId*/ string transactionIds, int DayVoucherNumber, int voucherId, int sectionId, int FiscalYearId, string selectedDate, string voucherReportType, int ReverseTransactionId, int LedgerGroupId, string VoucherNumber)
        //{
        //    DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
        //    AccountingDbContext accountingDBContext = new AccountingDbContext(connString);
        //    BillingDbContext billingDbContext = new BillingDbContext(connString);
        //    PharmacyDbContext pharmacyDbContext = new PharmacyDbContext(connString);
        //    InventoryDbContext inventoryDbContext = new InventoryDbContext(connString);
        //    IncentiveDbContext incentiveDbContext = new IncentiveDbContext(connString);
        //    //sud-nagesh: 20June'20-- for Acc-Hospital Separation.
        //    int currentHospitalId = HttpContext.Session.Get<int>("AccSelectedHospitalId");

        //    //try
        //    //{
        //        #region comment section migrate to api
        //if (reqType == "voucher-report")
        //{
        //    var SectionList = AccountingBL.GetSections(accountingDBContext, currentHospitalId);
        //    var OpeningBalanceData = (from t in accountingDBContext.Transactions
        //                              where t.HospitalId == currentHospitalId
        //                              join ti in accountingDBContext.TransactionItems on t.TransactionId equals ti.TransactionId
        //                              join fisc in accountingDBContext.FiscalYears on t.FiscalyearId equals fisc.FiscalYearId
        //                              where
        //                              ti.HospitalId == currentHospitalId && fisc.HospitalId == currentHospitalId &&
        //                              (DbFunctions.TruncateTime(t.TransactionDate) == FromDate) && (t.FiscalyearId == fisc.FiscalYearId)
        //                              group new { fisc, ti, t } by new
        //                              {
        //                                  fisc.FiscalYearId,
        //                                  t.TransactionDate,
        //                              } into x
        //                              select new
        //                              {
        //                                  Amountdr = x.Where(b => b.ti.DrCr == true && (DbFunctions.TruncateTime(b.t.TransactionDate) >= b.fisc.StartDate && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate)).Select(a => (int?)a.ti.Amount).DefaultIfEmpty(0).Sum(),
        //                                  Amountcr = x.Where(b => b.ti.DrCr == false && (DbFunctions.TruncateTime(b.t.TransactionDate) >= b.fisc.StartDate && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate)).Select(a => (int?)a.ti.Amount).DefaultIfEmpty(0).Sum(),
        //                                  x.Key.FiscalYearId,
        //                              }).ToList();

        //    var txnList = (from txn in accountingDBContext.Transactions
        //                   where txn.HospitalId == currentHospitalId
        //                   join voucher in accountingDBContext.Vouchers on txn.VoucherId equals voucher.VoucherId
        //                   join fiscal in accountingDBContext.FiscalYears on txn.FiscalyearId equals fiscal.FiscalYearId
        //                   where
        //                   fiscal.HospitalId == currentHospitalId &&
        //                   txn.IsActive == true && (DbFunctions.TruncateTime(txn.TransactionDate) >= FromDate && DbFunctions.TruncateTime(txn.TransactionDate) <= ToDate)
        //                    && txn.SectionId == sectionId
        //                   select new
        //                   {
        //                       TransactionId = txn.TransactionId,
        //                       FiscalYear = fiscal.FiscalYearName,
        //                       VoucherNumber = txn.VoucherNumber,
        //                       VoucherType = voucher.VoucherName,
        //                       SectionId = txn.SectionId,
        //                       TransactionDate = DbFunctions.TruncateTime(txn.TransactionDate),// txn.TransactionDate.ToString("dd/mm/yyyy"),                                       
        //                       Amount = (from txnItm in accountingDBContext.TransactionItems
        //                                 where txnItm.TransactionId == txn.TransactionId
        //                                 && txnItm.DrCr == true
        //                                 group txnItm by new
        //                                 {
        //                                     txnItm.DrCr
        //                                 } into g
        //                                 select g.Sum(x => x.Amount)
        //                                 ).FirstOrDefault(),
        //                       Narration = txn.Remarks
        //                   }).OrderByDescending(a => a.TransactionId).ToList();
        //    //below query as per new requirement if wants old one result then please comment below and take txnList as result
        //    var finalData = (from t in txnList
        //                     group new { t } by new
        //                     {
        //                         t.VoucherNumber,
        //                         t.FiscalYear,
        //                         t.VoucherType,
        //                         t.TransactionDate,
        //                         t.SectionId,
        //                         t.Narration
        //                     }
        //                    into x
        //                     select new
        //                     {
        //                         FiscalYear = x.Key.FiscalYear,
        //                         VoucherNumber = x.Key.VoucherNumber,
        //                         VoucherType = x.Key.VoucherType,
        //                         TransactionDate = x.Key.TransactionDate,
        //                         Amount = x.Sum(y => y.t.Amount),
        //                         SectionId = x.Key.SectionId,
        //                         SectionName = SectionList.Where(s => s.SectionId == x.Key.SectionId).Select(a => a.SectionName).FirstOrDefault(),
        //                         Narration = x.Key.Narration
        //                     }).OrderByDescending(a => a.TransactionDate).ToList();

        //    responseData.Status = "OK";
        //    responseData.Results = finalData;
        //}
        //#endregion
        //else
        //#region Ledger Report

        //if (reqType == "ledger-report")
        //{
        //    //in core parameter we have added one value for show or hide ledger group on txn item level or voucher level
        //    /*
        //     We have 2 option for ledger report 
        //    1- ShowLedgerReportTxnItemLevel value false means here we are showing single record for one voucher number. 
        //     - we will calculate dr/cr and show balance amount for report
        //    2-ShowLedgerReportTxnItemLevel value true means you need to show each and every record for selected ledger 
        //    ex-
        //    one voucher with ABCBank-Dr-1000 and ABCBank-Cr-250  && ShowLedgerReportTxnItemLevel is false
        //    then show only one record with Dr-Cr=>1000-250=750 Dr amount

        //    if ShowLedgerReportTxnItemLevel is true
        //    show only one record

        //    1000 Dr
        //    250 Cr

        //     */
        //    var showTxnItemLevelPar = (from p in accountingDBContext.CFGParameters
        //                               where p.ParameterGroupName.ToLower() == "accounting" && p.ParameterName == "ShowLedgerReportTxnItemLevel"
        //                               select p).FirstOrDefault();
        //    var showTxnItemLevel = (showTxnItemLevelPar != null) ? Convert.ToBoolean(showTxnItemLevelPar.ParameterValue) : true;
        //    var fYearId = AccountingTransferData.GetFiscalYearIdForOpeningBalance(accountingDBContext, FiscalYearId, currentHospitalId);
        //    //NBB-09 june 2020
        //    //issue resolved using below code lines
        //    //if we don't have ledger txn data within selected date then LedgerData count in 0
        //    //and here we are not considering Ledger Opening balance, so we will get and add ledger Opening balance here into dataList balance
        //    //here we have added logic in datalist AmountDr and AmountCr with + on condition
        //    var led = (from l in accountingDBContext.Ledgers
        //               join lbh in accountingDBContext.LedgerBalanceHistory on l.LedgerId equals lbh.LedgerId
        //               where lbh.LedgerId == ledgerId
        //               && lbh.HospitalId == currentHospitalId && lbh.FiscalYearId == fYearId
        //               select new
        //               {
        //                   lbh.OpeningBalance,
        //                   DrCr = lbh.OpeningDrCr == null ? true : lbh.OpeningDrCr,
        //                   lbh.LedgerId,
        //                   l.LedgerName
        //               }).FirstOrDefault();

        //    var LedgerData = (from t in accountingDBContext.Transactions
        //                      join ti in accountingDBContext.TransactionItems on t.TransactionId equals ti.TransactionId
        //                      join l in accountingDBContext.Ledgers on ti.LedgerId equals l.LedgerId
        //                      join v in accountingDBContext.Vouchers on t.VoucherId equals v.VoucherId
        //                      where
        //                      ti.HospitalId == currentHospitalId
        //                      && l.HospitalId == currentHospitalId &&
        //                      (ti.LedgerId == ledgerId) && (DbFunctions.TruncateTime(t.TransactionDate) >= FromDate && DbFunctions.TruncateTime(t.TransactionDate) <= ToDate)
        //                      select new
        //                      {
        //                          t.TransactionId,
        //                          t.TransactionDate,
        //                          t.VoucherNumber,
        //                          l.LedgerName,
        //                          l.Code,
        //                          OpeningBalance = led.OpeningBalance,
        //                          OpeningBalanceType = led.DrCr,
        //                          t.FiscalyearId,
        //                          v.VoucherName,
        //                          t.SectionId,
        //                          ti.Amount,
        //                          ti.DrCr,
        //                          Description = (t.SectionId == 4) ? ti.Description : "",//get description only for manual voucher entry, 4 Id for Manual section
        //                      }).ToList();

        //    List<DataListDTOModel> dataList = new List<DataListDTOModel>();


        //    var openingBalanceFiscalYear = (from f in accountingDBContext.FiscalYears
        //                                    where f.FiscalYearId == fYearId
        //                                    select f).FirstOrDefault();
        //    var dataList1 = (from t in accountingDBContext.Transactions
        //                     join ti in accountingDBContext.TransactionItems on t.TransactionId equals ti.TransactionId
        //                     join l in accountingDBContext.Ledgers on ti.LedgerId equals l.LedgerId
        //                     where
        //                     ti.HospitalId == currentHospitalId
        //                     && l.HospitalId == currentHospitalId &&
        //                     (ti.LedgerId == ledgerId) && (DbFunctions.TruncateTime(t.TransactionDate) >= DbFunctions.TruncateTime(openingBalanceFiscalYear.StartDate) && DbFunctions.TruncateTime(t.TransactionDate) <= ToDate)
        //                     group new { t, ti, l } by new
        //                     {
        //                         l.LedgerId,
        //                     }
        //                    into x
        //                     select new
        //                     {
        //                         FiscalYearId = fYearId,
        //                         AmountDr = x.Where(b => b.ti.DrCr == true && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate).Select(a => (double?)a.ti.Amount).DefaultIfEmpty(0).Sum() + ((LedgerData.Count == 0 && led.LedgerId > 0 && led.DrCr == true) ? led.OpeningBalance : 0),
        //                         AmountCr = x.Where(b => b.ti.DrCr == false && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate).Select(a => (double?)a.ti.Amount).DefaultIfEmpty(0).Sum() + ((LedgerData.Count == 0 && led.LedgerId > 0 && led.DrCr == false) ? led.OpeningBalance : 0),
        //                     }).ToList();

        //    if (LedgerData.Count == 0 && dataList1.Count == 0)
        //    {
        //        var dToday = DateTime.Now.Date;
        //        var fYId = AccountingTransferData.GetFiscalYearIdByDate(accountingDBContext, dToday, currentHospitalId);
        //        dataList.Add(new DataListDTOModel
        //        {
        //            FiscalYearId = fYId,
        //            AmountDr = ((led.DrCr == true) ? led.OpeningBalance : 0),
        //            AmountCr = ((led.DrCr == false) ? led.OpeningBalance : 0)
        //        });

        //    }
        //    else if (dataList1.Count > 0)
        //    {
        //        dataList1.ForEach(ss =>
        //        {
        //            dataList.Add(
        //                new DataListDTOModel
        //                {
        //                    FiscalYearId = dataList1[0].FiscalYearId,
        //                    AmountDr = (LedgerData.Count == 0 && led.DrCr == true) ? dataList1[0].AmountDr : dataList1[0].AmountDr,
        //                    AmountCr = (LedgerData.Count == 0 && led.DrCr == false) ? dataList1[0].AmountCr : dataList1[0].AmountCr
        //                });
        //        });

        //    }
        //    var result = (from itm in LedgerData
        //                  select new
        //                  {
        //                      itm.TransactionId,
        //                      itm.TransactionDate,
        //                      itm.VoucherNumber,
        //                      itm.LedgerName,
        //                      itm.Code,
        //                      itm.VoucherName,
        //                      LedgerDr = (itm.DrCr == true) ? itm.Amount : 0,
        //                      LedgerCr = (itm.DrCr == false) ? itm.Amount : 0,
        //                      itm.Amount,
        //                      itm.DrCr,
        //                      dataList[0].AmountCr,
        //                      dataList[0].AmountDr,
        //                      Balance = 0,
        //                      BalanceType = true,
        //                      itm.OpeningBalance,
        //                      itm.OpeningBalanceType,
        //                      DepartmentName = "TempTest",
        //                      itm.Description,
        //                      TransactionItems = (showTxnItemLevel == true) ? null :
        //                                                                        (from txnItm in accountingDBContext.TransactionItems
        //                                                                         where txnItm.HospitalId == currentHospitalId
        //                                                                         join ledger in accountingDBContext.Ledgers on txnItm.LedgerId equals ledger.LedgerId
        //                                                                         join txn in accountingDBContext.Transactions on txnItm.TransactionId equals itm.TransactionId
        //                                                                         join v in accountingDBContext.Vouchers on txn.VoucherId equals v.VoucherId
        //                                                                         where
        //                                                                         ledger.HospitalId == currentHospitalId &&
        //                                                                         txnItm.TransactionId == txn.TransactionId && txn.IsActive == true && v.VoucherName == itm.VoucherName
        //                                                                         && (DbFunctions.TruncateTime(txn.TransactionDate) >= FromDate && DbFunctions.TruncateTime(txn.TransactionDate) <= ToDate)
        //                                                                         && ledger.LedgerName != itm.LedgerName && txn.TransactionDate == itm.TransactionDate
        //                                                                         select new
        //                                                                         {
        //                                                                             txnItm.TransactionItemId,
        //                                                                             LedgerName = ledger.LedgerName,
        //                                                                             Code = ledger.Code,
        //                                                                             DrCr = txnItm.DrCr,
        //                                                                             LedAmount = txnItm.Amount,
        //                                                                             Description = (txn.SectionId == 4) ? txnItm.Description : "",//get description only for manual voucher entry, 4 Id for Manual section
        //                                                                             Details = (from txnitm in accountingDBContext.TransactionItems
        //                                                                                        where txnitm.HospitalId == currentHospitalId
        //                                                                                        join txndetail in accountingDBContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
        //                                                                                        join pat in accountingDBContext.PatientModel on txndetail.ReferenceId equals pat.PatientId
        //                                                                                        where txnItm.TransactionItemId == txnitm.TransactionItemId && txn.VoucherNumber == itm.VoucherNumber && txndetail.ReferenceType == "Patient"
        //                                                                                        group new { txnitm, pat, txndetail } by new
        //                                                                                        {
        //                                                                                            txndetail.ReferenceId,
        //                                                                                            txnitm.DrCr
        //                                                                                        } into x1
        //                                                                                        select new
        //                                                                                        {
        //                                                                                            Id = x1.Key.ReferenceId,
        //                                                                                            Name = x1.Select(a => a.pat.FirstName + a.pat.LastName).FirstOrDefault(),
        //                                                                                            DrCr = x1.Key.DrCr,
        //                                                                                            Amount = x1.Select(a => a.txndetail.Amount).Sum(),
        //                                                                                        }).ToList(),
        //                                                                             CapitalsGoods = (from txnitm in accountingDBContext.TransactionItems
        //                                                                                              where txnitm.HospitalId == currentHospitalId
        //                                                                                              join txndetail in accountingDBContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
        //                                                                                              join pat in accountingDBContext.InventoryItems on txndetail.ReferenceId equals pat.ItemId
        //                                                                                              where txnItm.TransactionItemId == txnitm.TransactionItemId && txn.VoucherNumber == itm.VoucherNumber && txndetail.ReferenceType == "Capital Goods Items"
        //                                                                                              group new { txnitm, pat, txndetail } by new
        //                                                                                              {
        //                                                                                                  txndetail.ReferenceId,
        //                                                                                                  txnitm.DrCr
        //                                                                                              } into x1
        //                                                                                              select new
        //                                                                                              {
        //                                                                                                  Id = x1.Key.ReferenceId,
        //                                                                                                  Name = x1.Select(a => a.pat.ItemName).FirstOrDefault(),
        //                                                                                                  DrCr = x1.Key.DrCr,
        //                                                                                                  Amount = x1.Select(a => a.txndetail.Amount).Sum(),
        //                                                                                              }).ToList(),
        //                                                                         }).OrderByDescending(a => a.DrCr == true).ToList(),
        //                  }).ToList();
        //    result.ForEach(itm =>
        //    {
        //        if (itm.TransactionItems != null)
        //        {
        //            itm.TransactionItems.ForEach(txn =>
        //            {
        //                foreach (var det in txn.CapitalsGoods)
        //                {
        //                    txn.Details.Add(det);
        //                }
        //            });
        //        }

        //    });
        //    var FinalData = new
        //    {
        //        result,
        //        dataList
        //    };
        //    responseData.Status = "OK";
        //    responseData.Results = FinalData;
        //}
        //else
        //#region Trial Balance Report
        //if (reqType == "trailBalanceReport")
        //{

        //    List<SqlParameter> paramList = new List<SqlParameter>()
        //                {
        //                        new SqlParameter("@FromDate", FromDate),
        //                        new SqlParameter("@ToDate", ToDate),
        //                        new SqlParameter("@HospitalId", currentHospitalId),
        //                         new SqlParameter("@OpeningFiscalYearId", AccountingTransferData.GetFiscalYearIdForOpeningBalance(accountingDBContext,FiscalYearId,currentHospitalId))
        //                };
        //    var spDataTable = DALFunctions.GetDataTableFromStoredProc("SP_ACC_RPT_GetTrialBalanceData", paramList, accountingDBContext);
        //    var resultStr = JsonConvert.SerializeObject(spDataTable, new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
        //    var TransactionWithItems = JsonConvert.DeserializeObject<List<dynamic>>(resultStr);

        //    var trialBalance = (from txnwithitms in TransactionWithItems
        //                        group new { txnwithitms } by new { txnwithitms.COA }
        //                        into x
        //                        select new
        //                        {
        //                            //Level COA
        //                            Particulars = x.Key.COA,
        //                            LedgerGroupList = (
        //                                               from txnwithitms in TransactionWithItems
        //                                               where txnwithitms.COA == x.Key.COA
        //                                               group new { txnwithitms } by new
        //                                               { txnwithitms.LedgerGroupName }
        //                                                into x1
        //                                               select new
        //                                               {
        //                                                   //Level LedgerGroup
        //                                                   Particulars = x1.Key.LedgerGroupName,
        //                                                   LedgerList = (from
        //                                                                txnwithitms in TransactionWithItems
        //                                                                 where txnwithitms.COA == x.Key.COA && txnwithitms.LedgerGroupName == x1.Key.LedgerGroupName

        //                                                                 select new
        //                                                                 {

        //                                                                     LedgerId = txnwithitms.LedgerId,
        //                                                                     Particulars = txnwithitms.LedgerName,
        //                                                                     Code = txnwithitms.Code,
        //                                                                     OpeningDr = txnwithitms.OpeningDr,
        //                                                                     OpeningCr = txnwithitms.OpeningCr,
        //                                                                     OpeningBalDr = txnwithitms.OpeningBalDr,
        //                                                                     OpeningBalCr = txnwithitms.OpeningBalCr,
        //                                                                     CurrentDr = txnwithitms.CurrentDr,
        //                                                                     CurrentCr = txnwithitms.CurrentCr,
        //                                                                     Details = "",
        //                                                                     InventoryItems = "",

        //                                                                 }).ToList()
        //                                               }).ToList()
        //                        }).ToList();

        //    //take this as reference if we need later to show Patient details or supplier details, vendor detail in voucher/ledger etc.. 
        //    //var VendorDetail = (from itemdetail in accountingDBContext.TransactionItemDetails
        //    //                     join patient in accountingDBContext.InvVendors on itemdetail.ReferenceId equals patient.VendorId
        //    //                     where itemdetail.ReferenceType == "Vendor"
        //    //                    select new
        //    //                     {
        //    //                        VendorId = patient.VendorId,
        //    //                        VendorName = patient.VendorName,
        //    //                         Amount = itemdetail.Amount,
        //    //                         TransactionItemId = itemdetail.TransactionItemId
        //    //                     }).ToList();


        //    trialBalance.ForEach(itm =>
        //    {
        //        itm.LedgerGroupList.ForEach(txn =>
        //        {
        //            txn.LedgerList.ForEach(ledgr =>
        //            {

        //            });
        //        });
        //    });
        //    responseData.Status = "OK";
        //    responseData.Results = trialBalance;
        //}


        //#region Group Statement report 
        //if (reqType == "groupStatementReport")
        //{
        //    List<SqlParameter> paramList = new List<SqlParameter>()
        //                {
        //                        new SqlParameter("@FromDate", FromDate),
        //                        new SqlParameter("@ToDate", ToDate),
        //                        new SqlParameter("@HospitalId", currentHospitalId),
        //                        new SqlParameter("@OpeningFiscalYearId", AccountingTransferData.GetFiscalYearIdForOpeningBalance(accountingDBContext,FiscalYearId,currentHospitalId)),
        //                        new SqlParameter("@LedgerGroupId", LedgerGroupId),
        //                };
        //    var spDataTable = DALFunctions.GetDataTableFromStoredProc("SP_ACC_RPT_GetGroupStatementData", paramList, accountingDBContext);
        //    var resultStr = JsonConvert.SerializeObject(spDataTable, new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
        //    var reportDataList = JsonConvert.DeserializeObject<List<dynamic>>(resultStr);

        //    var groupStatementReport = (from row in reportDataList
        //                                select new
        //                                {
        //                                    Particular = row.Particular,
        //                                    LedgerId = row.LedgerId,
        //                                    Code = row.Code,
        //                                    OpeningDr = row.OpeningDr,
        //                                    OpeningCr = row.OpeningCr,
        //                                    TransactionDr = row.TransactionDr,
        //                                    TransactionCr = row.TransactionCr,
        //                                    OpeningTotal = (row.OpeningDr > row.OpeningCr || row.OpeningCr == row.OpeningDr) ? (row.OpeningDr - row.OpeningCr) : (row.OpeningCr - row.OpeningDr),
        //                                    OpeningType = (row.OpeningDr > row.OpeningCr || row.OpeningCr == row.OpeningDr) ? "Dr" : "Cr",
        //                                    ClosingDr = row.ClosingDr,
        //                                    ClosingCr = row.ClosingCr,
        //                                    ClosingTotal = (row.ClosingDr > row.ClosingCr || row.ClosingDr == row.ClosingCr) ? (row.ClosingDr - row.ClosingCr) : (row.ClosingCr - row.ClosingDr),
        //                                    ClosingType = (row.ClosingDr > row.ClosingCr || row.ClosingDr == row.ClosingCr) ? "Dr" : "Cr",

        //                                }).ToList();



        //    responseData.Status = "OK";
        //    responseData.Results = groupStatementReport;


        //}
        //#endregion
        //#region Profit and Loss Report
        //if (reqType == "profitLossReport")
        //{
        //    //profit and loss report only consider for Revenue and Expense type ledgers
        //    //No need to consider opening balance

        //    List<SqlParameter> paramList = new List<SqlParameter>()
        //                {
        //                        new SqlParameter("@FromDate", FromDate),
        //                        new SqlParameter("@ToDate", ToDate),
        //                        new SqlParameter("@HospitalId", currentHospitalId)
        //                };
        //    var spDataTable = DALFunctions.GetDataTableFromStoredProc("SP_ACC_RPT_GetProfitAndLossData", paramList, accountingDBContext);
        //    var resultStr = JsonConvert.SerializeObject(spDataTable, new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
        //    var txnPnLData = JsonConvert.DeserializeObject<List<dynamic>>(resultStr);


        //    var result = (from l in txnPnLData

        //                  group l by new { l.PrimaryGroup } into x
        //                  select new
        //                  {
        //                      x.Key.PrimaryGroup,
        //                      COAList = (from l in txnPnLData

        //                                 where l.PrimaryGroup == x.Key.PrimaryGroup && l.COA != "Inventory"
        //                                 group l by new
        //                                 {
        //                                     l.PrimaryGroup,
        //                                     l.COA
        //                                 } into x2
        //                                 select new
        //                                 {
        //                                     x2.Key.COA,
        //                                     LedgerGroupList = (from l in txnPnLData

        //                                                        where l.COA == x2.Key.COA && l.PrimaryGroup == x.Key.PrimaryGroup
        //                                                        group l by new
        //                                                        {
        //                                                            l.PrimaryGroup,
        //                                                            l.COA,
        //                                                            l.LedgerGroupName,
        //                                                        } into x3
        //                                                        select new
        //                                                        {
        //                                                            x3.Key.LedgerGroupName,
        //                                                            LedgerList = (from l in txnPnLData

        //                                                                          where l.COA == x2.Key.COA && l.PrimaryGroup == x.Key.PrimaryGroup && l.LedgerGroupName == x3.Key.LedgerGroupName

        //                                                                          select new
        //                                                                          {
        //                                                                              l.LedgerId,
        //                                                                              l.LedgerName,
        //                                                                              l.Code,
        //                                                                              DrAmount = l.DRAmount,
        //                                                                              CrAmount = l.CRAmount,
        //                                                                          }).ToList()
        //                                                        }).ToList()
        //                                 }).ToList()
        //                  }).ToList();
        //    responseData.Status = (result.Count > 0) ? "OK" : "Failed";
        //    responseData.ErrorMessage = "No data found.";
        //    responseData.Results = result;
        //}
        //    #endregion
        //    #region Balance sheet report
        //else if (reqType == "balanceSheetReportData")
        //{
        //    //NageshBB - 03 Jul 2020
        //    //Balance sheet will send FiscalYear Id and toDate only                   

        //    List<SqlParameter> paramList = new List<SqlParameter>()
        //                {  new SqlParameter("@ToDate", selectedDate),
        //                    new SqlParameter("@HospitalId", currentHospitalId),
        //                    new SqlParameter("@FiscalYearId", AccountingTransferData.GetFiscalYearIdForOpeningBalance(accountingDBContext,FiscalYearId,currentHospitalId)) };

        //    var spDataset = DALFunctions.GetDatasetFromStoredProc("SP_ACC_RPT_GetBalanceSheetData", paramList, accountingDBContext);

        //    var balanceSheetStr = JsonConvert.SerializeObject(spDataset.Tables[0], new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
        //    var TransactionWithItems = JsonConvert.DeserializeObject<List<dynamic>>(balanceSheetStr);
        //    var netProfit = spDataset.Tables[1].Rows[0][0];

        //    var result = (from l in TransactionWithItems
        //                  group l by new { l.PrimaryGroup } into x
        //                  select new
        //                  {
        //                      x.Key.PrimaryGroup,
        //                      COAList = (from l in TransactionWithItems
        //                                 where l.PrimaryGroup == x.Key.PrimaryGroup
        //                                 group l by new
        //                                 {
        //                                     l.PrimaryGroup,
        //                                     l.COA
        //                                 } into x2
        //                                 select new
        //                                 {
        //                                     x2.Key.COA,
        //                                     LedgerGroupList = (from l in TransactionWithItems
        //                                                        where l.COA == x2.Key.COA && l.PrimaryGroup == x.Key.PrimaryGroup
        //                                                        group l by new
        //                                                        {
        //                                                            l.PrimaryGroup,
        //                                                            l.COA,
        //                                                            l.LedgerGroupName,
        //                                                        } into x3
        //                                                        select new
        //                                                        {
        //                                                            x3.Key.LedgerGroupName,
        //                                                            LedgerList = (from l in TransactionWithItems
        //                                                                          where l.COA == x2.Key.COA && l.PrimaryGroup == x.Key.PrimaryGroup && x3.Key.LedgerGroupName == l.LedgerGroupName
        //                                                                          select new
        //                                                                          {
        //                                                                              l.LedgerId,
        //                                                                              l.PrimaryGroup,
        //                                                                              l.LedgerName,
        //                                                                              l.Code,
        //                                                                              l.OpeningBalanceDr,
        //                                                                              l.OpeningBalanceCr,
        //                                                                              l.DRAmount,//= x4.Where(a => a.l.TxnItmDrCr == true && a.l.Amount !=null).Select(a => a.l.Amount).Sum(),
        //                                                                              l.CRAmount, //= x4.Where(a => a.l.TxnItmDrCr == false && a.l.Amount != null).Select(a => a.l.Amount).Sum(),
        //                                                                              Details = "",
        //                                                                              InventoryItems = ""
        //                                                                          }).ToList()
        //                                                        }).ToList()
        //                                 }).ToList()
        //                  }).ToList();

        //    var FinalData = new
        //    {
        //        result,
        //        netProfit
        //    };
        //    responseData.Status = "OK";
        //    responseData.Results = FinalData;

        //}
        //    #endregion
        //    #region Daily Transaction Report
        //else if (reqType == "daily-txn-report")
        //{
        //    var result = (from txn in accountingDBContext.Transactions
        //                  where txn.HospitalId == currentHospitalId
        //                  && (DbFunctions.TruncateTime(txn.TransactionDate) >= FromDate && DbFunctions.TruncateTime(txn.TransactionDate) <= ToDate)
        //                  group new { txn } by new { txn.TransactionDate, txn.VoucherNumber, txn.SectionId } into x
        //                  select new
        //                  {
        //                      TransactionId = x.Select(a => a.txn.TransactionId),
        //                      x.Key.VoucherNumber,
        //                      x.Key.TransactionDate,
        //                      TransactionType = x.Select(a => a.txn.TransactionType),
        //                      SectionId = x.Key.SectionId,
        //                      txnItems = (from itm in accountingDBContext.TransactionItems
        //                                  where itm.HospitalId == currentHospitalId
        //                                  join l in accountingDBContext.Ledgers on itm.LedgerId equals l.LedgerId
        //                                  join newtxn in x on itm.TransactionId equals newtxn.txn.TransactionId
        //                                  where l.HospitalId == currentHospitalId
        //                                  group new { itm, l } by new { l.LedgerId } into y
        //                                  select new
        //                                  {
        //                                      LedgerName = y.Select(a => a.l.LedgerName).FirstOrDefault(),
        //                                      DrAmount = y.Where(a => a.itm.DrCr == true).Sum(a => a.itm.Amount),
        //                                      CrAmount = y.Where(a => a.itm.DrCr == false).Sum(a => a.itm.Amount),
        //                                      Code = y.Select(a => a.l.Code).FirstOrDefault()
        //                                  }).ToList()
        //                  }).OrderBy(a => a.TransactionDate).ToList();


        //    responseData.Status = "OK";
        //    responseData.Results = result;
        //}

        //else if (reqType == "txn-Origin-details")
        //{
        //    List<int> referanceIdList = new List<int>();
        //    List<int> transactionIdList = transactionIds.Split(',').Select(int.Parse).ToList();


        //    (from txnId in transactionIdList
        //     join txnLinks in accountingDBContext.TransactionLinks on txnId equals txnLinks.TransactionId
        //     select new
        //     {
        //         idList = txnLinks.ReferenceId.Split(',').Select(int.Parse).ToList(),
        //         txnid = txnLinks.TransactionId
        //     }).ToList().ForEach(a =>
        //     {
        //         a.idList.ForEach(newid => referanceIdList.Add((int)newid));
        //     });

        //    var txnModel = (from txn in accountingDBContext.Transactions
        //                    where txn.HospitalId == currentHospitalId
        //                    join Ids in transactionIdList on txn.TransactionId equals Ids
        //                    join txnlink in accountingDBContext.TransactionLinks on txn.TransactionId equals txnlink.TransactionId
        //                    select new
        //                    {
        //                        TransactionId = txn.TransactionId,
        //                        TransactionType = txn.TransactionType,
        //                        SectionId = txn.SectionId,
        //                        Remarks = txn.Remarks,
        //                        referIds = txnlink.ReferenceId.ToString(),
        //                        VocuherNumber = txn.VoucherNumber
        //                    }).ToList();

        //    if (txnModel.Count > 0)
        //    {
        //        /* * Start Inventory Section */
        //        if (txnModel.Where(a => a.SectionId == 1).ToList().Count > 0)
        //        {
        //            if (txnModel.Where(a => a.TransactionType.Contains("GoodReceipt")).ToList().Count > 0)
        //            {
        //                var goodsReceipt = (from gr in inventoryDbContext.GoodsReceipts.AsEnumerable()

        //                                    join vendor in inventoryDbContext.Vendors on gr.VendorId equals vendor.VendorId
        //                                    join gritm in inventoryDbContext.GoodsReceiptItems.AsEnumerable() on gr.GoodsReceiptID equals gritm.GoodsReceiptId
        //                                    join id in referanceIdList on gritm.GoodsReceiptItemId equals id
        //                                    join itm in inventoryDbContext.Items on gritm.ItemId equals itm.ItemId
        //                                    select new
        //                                    {
        //                                        itm = new
        //                                        {
        //                                            gr.PaymentMode,
        //                                            gritm.TotalAmount,
        //                                            VAT = gr.VATTotal,
        //                                            gritm.SubTotal,
        //                                            gritm.DiscountAmount,
        //                                            gr.BillNo
        //                                        },
        //                                        vendor.VendorName,
        //                                        TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault(),
        //                                        ItemName = itm.ItemName,
        //                                    }).ToList();
        //                responseData.Results = goodsReceipt;
        //            }
        //            else if (txnModel.Where(a => a.TransactionType.Contains("WriteOff")).ToList().Count > 0)
        //            {
        //                var writeOff = (from wr in inventoryDbContext.WriteOffItems.AsEnumerable()
        //                                join id in referanceIdList on wr.WriteOffId equals id
        //                                join itm in inventoryDbContext.Items on wr.ItemId equals itm.ItemId
        //                                select new
        //                                {
        //                                    itm = new
        //                                    {
        //                                        BatchNo = wr.BatchNO,
        //                                        TotalAmount = wr.TotalAmount
        //                                    },
        //                                    itm.ItemName,
        //                                    TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                                }).ToList();
        //                responseData.Results = writeOff;
        //            }
        //            else if (txnModel.Where(a => a.TransactionType.Contains("ReturnToVendor")).ToList().Count > 0)
        //            {
        //                var returnTOVendor = (from rv in inventoryDbContext.ReturnToVendorItems.AsEnumerable()
        //                                      join id in referanceIdList on rv.ReturnToVendorItemId equals id
        //                                      join itm in inventoryDbContext.Items on rv.ItemId equals itm.ItemId
        //                                      join vendor in inventoryDbContext.Vendors on rv.VendorId equals vendor.VendorId
        //                                      select new
        //                                      {
        //                                          itm = new
        //                                          {
        //                                              BatchNo = rv.BatchNo,
        //                                              TotalAmount = rv.TotalAmount,
        //                                              VAT = rv.VAT
        //                                          },
        //                                          itm.ItemName,
        //                                          vendor.VendorName,
        //                                          TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                                      }).ToList();
        //                responseData.Results = returnTOVendor;
        //            }
        //            else if (txnModel.Where(a => a.TransactionType.Contains("DispatchToDept")).ToList().Count > 0)
        //            {
        //                var DispatchToDept = (from wr in inventoryDbContext.StockTransactions.AsEnumerable()
        //                                      join id in referanceIdList on wr.StockTransactionId equals id
        //                                      join st in inventoryDbContext.StoreStocks.Include(x => x.StockMaster) on wr.StockId equals st.StockId
        //                                      join itm in inventoryDbContext.Items on st.ItemId equals itm.ItemId
        //                                      //EMR_LPH_MERGE: NageshBB- 18-June-2021 -commented below line for temporary build error solution
        //                                      ///later we need to discuss table and column with inventory team and do chagnes as per requirement
        //                                      //join gr in inventoryDbContext.GoodsReceiptItems on st.GoodsReceiptItemId equals gr.GoodsReceiptItemId

        //                                      select new
        //                                      {
        //                                          itm = new
        //                                          {
        //                                              BatchNo = st.StockMaster.BatchNo,
        //                                              TotalAmount = wr.CostPrice //Math.Truncate((decimal)wr.Quantity) * gr.ItemRate, //EMR_MERGE_LPH
        //                                              //gr.VAT,//EMR_MERGE_LPH
        //                                              //gr.DiscountAmount, //EMR_MERGE_LPH
        //                                          },
        //                                          itm.ItemName,
        //                                          TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                                      }).ToList();
        //                responseData.Results = DispatchToDept;
        //            }
        //            else if (txnModel.Where(a => a.TransactionType.Contains("INVDeptConsumedGoods")).ToList().Count > 0)
        //            {
        //                //var ConsumedGoodsItems = (from csm in inventoryDbContext.WardInventoryTransactionModel.AsEnumerable()
        //                //                          join id in referanceIdList on csm.TransactionId equals id
        //                //                          join itm in inventoryDbContext.Items on csm.ItemId equals itm.ItemId
        //                //                          join gr in inventoryDbContext.GoodsReceiptItems on csm.GoodsReceiptItemId equals gr.GoodsReceiptItemId
        //                //                          where (csm.TransactionType == "consumption-items")
        //                //                          select new
        //                //                          {
        //                //                              itm = new
        //                //                              {
        //                //                                  BatchNo = gr.BatchNO,
        //                //                                  TotalAmount = Math.Truncate((decimal)csm.Quantity) * csm.Price,
        //                //                                  gr.VAT,
        //                //                                  gr.DiscountAmount,
        //                //                              },
        //                //                              itm.ItemName,
        //                //                              TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()


        //                //                          }).ToList();
        //                //responseData.Results = ConsumedGoodsItems;
        //                //NageshBB: 13July2021- after lph changes we have done below change we need to verify this 
        //                var ConsumedGoodsItems = (from csm in inventoryDbContext.StockTransactions.AsEnumerable()
        //                                          join id in referanceIdList on csm.StockTransactionId equals id
        //                                          join stock in inventoryDbContext.StockMasters on csm.StockId equals stock.StockId
        //                                          join itm in inventoryDbContext.Items on csm.ItemId equals itm.ItemId
        //                                          join gr in inventoryDbContext.GoodsReceiptItems on csm.StockId equals gr.StockId into grJ
        //                                          from grLJ in grJ.DefaultIfEmpty()
        //                                          where (csm.TransactionType == "consumption-items")
        //                                          select new
        //                                          {
        //                                              itm = new
        //                                              {
        //                                                  BatchNo = stock.BatchNo,
        //                                                  TotalAmount = Math.Truncate((decimal)csm.OutQty) * csm.CostPrice,
        //                                                  VAT = grLJ == null ? 0 : grLJ.VAT,
        //                                                  DiscountAmount = grLJ == null ? 0 : grLJ.DiscountAmount,
        //                                              },
        //                                              itm.ItemName,
        //                                              TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()


        //                                          }).ToList();
        //                responseData.Results = ConsumedGoodsItems;

        //            }
        //            else if (txnModel.Where(a => a.TransactionType.Contains("INVStockManageOut")).ToList().Count > 0)
        //            {
        //                //var stkTxn1 = (from wr in inventoryDbContext.StockTransactions.AsEnumerable()
        //                //               join id in referanceIdList on wr.StockTxnId equals id
        //                //               join st in inventoryDbContext.Stock on wr.StockId equals st.StockId
        //                //               join itm in inventoryDbContext.Items on st.ItemId equals itm.ItemId
        //                //               //EMR_LPH_MERGE: NageshBB- 18-June-2021 -commented below line for temporary build error solution
        //                //               ///later we need to discuss table and column with inventory team and do chagnes as per requirement
        //                //               //join gr in inventoryDbContext.GoodsReceiptItems on st.GoodsReceiptItemId equals gr.GoodsReceiptItemId
        //                //               select new
        //                //               {
        //                //                   itm = new
        //                //                   {
        //                //                       BatchNo = st.BatchNO,
        //                //                       //TotalAmount = Math.Truncate((decimal)wr.Quantity) * gr.ItemRate, //EMR_LPH_MERGE
        //                //                       //gr.VAT, //EMR_LPH_MERGE
        //                //                       //gr.DiscountAmount, //EMR_LPH_MERGE
        //                //                   },
        //                //                   itm.ItemName,
        //                //                   TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                //               }).ToList();
        //                //responseData.Results = stkTxn1;
        //                var stkTxn1 = (from wr in inventoryDbContext.StockTransactions.AsEnumerable()
        //                               join id in referanceIdList on wr.StockTransactionId equals id
        //                               join storestock in inventoryDbContext.StoreStocks.Include(s => s.StockMaster) on wr.StoreStockId equals storestock.StoreStockId
        //                               join st in inventoryDbContext.StoreStocks on wr.StockId equals st.StockId
        //                               join itm in inventoryDbContext.Items on st.ItemId equals itm.ItemId
        //                               join gr in inventoryDbContext.GoodsReceiptItems on st.StockId equals gr.StockId into grJ
        //                               from grLJ in grJ.DefaultIfEmpty()
        //                               select new
        //                               {
        //                                   itm = new
        //                                   {
        //                                       BatchNo = storestock.StockMaster.BatchNo,
        //                                       TotalAmount = Math.Truncate((decimal)storestock.AvailableQuantity) * storestock.StockMaster.CostPrice,
        //                                       VAT = grLJ == null ? 0 : grLJ.VAT,
        //                                       DiscountAmount = grLJ == null ? 0 : grLJ.DiscountAmount,
        //                                   },
        //                                   itm.ItemName,
        //                                   TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                               }).ToList();
        //                responseData.Results = stkTxn1;
        //            }
        //            responseData.Status = "OK";
        //        }
        //        /* * End Inventory Section */

        //        /* * Start Billing Section */
        //        if (txnModel.Where(a => a.SectionId == 2).ToList().Count > 0)
        //        {
        //            List<dynamic> depData = new List<dynamic>();
        //            List<dynamic> BillData = new List<dynamic>();
        //            List<dynamic> ReturnBillData = new List<dynamic>();

        //            DataSet txnData = accountingDBContext.DailyTransactionReportDetails(txnModel[0].VocuherNumber, currentHospitalId);

        //            var deposits = txnModel.Where(c => c.TransactionType == "DepositAdd" || c.TransactionType == "DepositReturn").ToList();
        //            if (deposits.Count > 0)
        //            {
        //                depData = DataTableToList.ToDynamic(txnData.Tables[0]);
        //            }
        //            var bills = txnModel.Where(c => c.TransactionType == "CashBill" || c.TransactionType == "CreditBill").ToList();
        //            if (bills.Count > 0)
        //            {

        //                BillData = DataTableToList.ToDynamic(txnData.Tables[0]);
        //            }
        //            var returnBill = txnModel.Where(c => c.TransactionType == "CashBillReturn" || c.TransactionType == "CreditBillReturn").ToList();
        //            if (returnBill.Count > 0)
        //            {

        //                ReturnBillData = DataTableToList.ToDynamic(txnData.Tables[0]);
        //            }

        //            var result = new
        //            {
        //                DepositData = (from dep in depData.AsEnumerable()
        //                               select new
        //                               {
        //                                   PatientName = dep.PatientName,
        //                                   ReceiptNo = dep.ReceiptNo,
        //                                   PaymentMode = dep.PaymentMode,
        //                                   TotalAmount = dep.TotalAmount
        //                               }).ToList(),
        //                BillData = (from itm in BillData.AsEnumerable()
        //                            select new
        //                            {
        //                                itm,
        //                                InvoiceNo = itm.InvoiceNo,
        //                                PatientName = itm.PatientName
        //                            }).ToList(),
        //                ReturnBillData = (from itm in ReturnBillData.AsEnumerable()
        //                                  select new
        //                                  {
        //                                      itm,
        //                                      InvoiceNo = itm.InvoiceNo,
        //                                      PatientName = itm.PatientName
        //                                  }).ToList()
        //            };

        //            responseData.Results = result;
        //            responseData.Status = "OK";

        //        }
        //        /* * End Billing Section */

        //        /* * Start Pharmacy Section */
        //        if (txnModel.Where(a => a.SectionId == 3).ToList().Count > 0)
        //        {
        //            if (txnModel.Where(a => a.TransactionType.Contains("CashInvoice") && !a.TransactionType.Contains("CashInvoiceReturn")).ToList().Count > 0)
        //            {
        //                var InvoiceData = (from itm in pharmacyDbContext.PHRMInvoiceTransactionItems.AsEnumerable()
        //                                   join detail in pharmacyDbContext.PHRMInvoiceTransaction.AsEnumerable() on itm.InvoiceId equals detail.InvoiceId
        //                                   join id in referanceIdList on detail.InvoiceId equals id
        //                                   join pat in pharmacyDbContext.PHRMPatient on detail.PatientId equals pat.PatientId
        //                                   group new { itm, detail, pat } by new { id } into x
        //                                   select new
        //                                   {
        //                                       InvoiceNo = x.Select(a => a.detail.InvoiceId).FirstOrDefault(),
        //                                       DiscountAmount = x.Select(a => a.detail.DiscountAmount).FirstOrDefault(),
        //                                       VATAmount = x.Select(a => a.detail.VATAmount).FirstOrDefault(),
        //                                       TotalAmount = x.Select(a => a.detail.TotalAmount).FirstOrDefault(),
        //                                       //ItemName = x.Select(a => a.itm.ItemName),
        //                                       ItemList = x.Select(a => new { a.itm.ItemName, a.itm.TotalAmount }).ToList(),
        //                                       PatientName = x.Select(a => a.pat.FirstName + "" + a.pat.LastName).FirstOrDefault(),
        //                                       TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                                   }).ToList();
        //                responseData.Results = InvoiceData;
        //            }
        //            else
        //            if (txnModel.Where(a => a.TransactionType.Contains("ReturnToSupplier")).ToList().Count > 0)
        //            {
        //                var ReturnToSupplierData = (from itm in pharmacyDbContext.PHRMReturnToSupplierItem.AsEnumerable()
        //                                            join detail in pharmacyDbContext.PHRMReturnToSupplier.AsEnumerable() on itm.ReturnToSupplierId equals detail.ReturnToSupplierId
        //                                            join id in referanceIdList on detail.ReturnToSupplierId equals id
        //                                            join gritm in pharmacyDbContext.PHRMGoodsReceiptItems on itm.GoodReceiptItemId equals gritm.GoodReceiptItemId
        //                                            join sup in pharmacyDbContext.PHRMSupplier on detail.SupplierId equals sup.SupplierId
        //                                            group new { itm, detail, sup, gritm } by new { id } into x
        //                                            select new
        //                                            {
        //                                                SupplierName = x.Select(a => a.sup.SupplierName).FirstOrDefault(),
        //                                                DiscountAmount = x.Select(a => a.detail.DiscountAmount).FirstOrDefault(),
        //                                                VATAmount = x.Select(a => a.detail.VATAmount).FirstOrDefault(),
        //                                                TotalAmount = x.Select(a => a.detail.TotalAmount).FirstOrDefault(),
        //                                                ItemList = x.Select(a => new { a.gritm.ItemName, a.itm.TotalAmount }).ToList(),
        //                                                TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                                            }).ToList();
        //                responseData.Results = ReturnToSupplierData;
        //            }
        //            else
        //            if (txnModel.Where(a => a.TransactionType.Contains("CashInvoiceReturn")).ToList().Count > 0)
        //            {
        //                var CashInvoiceReturnData = (from invReturn in pharmacyDbContext.PHRMInvoiceReturnModel.AsEnumerable()
        //                                             join id in referanceIdList on invReturn.InvoiceReturnId equals id
        //                                             join detail in pharmacyDbContext.PHRMInvoiceReturnItemsModel.AsEnumerable() on invReturn.InvoiceReturnId equals detail.InvoiceReturnId
        //                                             join pat in pharmacyDbContext.PHRMPatient on invReturn.PatientId equals pat.PatientId
        //                                             join invitm in pharmacyDbContext.PHRMInvoiceTransactionItems on detail.InvoiceItemId equals invitm.InvoiceItemId
        //                                             group new { invitm, invReturn, pat, detail, id } by new { invReturn.PatientId, id } into x
        //                                             select new
        //                                             {
        //                                                 InvoiceNo = x.Select(a => a.invReturn.InvoiceReturnId).FirstOrDefault(),
        //                                                 PatientName = x.Select(a => a.pat.FirstName + "" + a.pat.LastName).FirstOrDefault(),
        //                                                 DiscountAmount = x.Select(a => a.detail.DiscountAmount).FirstOrDefault(),
        //                                                 VATAmount = x.Select(c => (((decimal)c.invReturn.SubTotal - (((decimal)c.invReturn.SubTotal * Convert.ToDecimal((decimal)c.invReturn.DiscountAmount)))) * Convert.ToDecimal((decimal)c.detail.VATPercentage)) / 100).Sum(),
        //                                                 TotalAmount = x.Select(a => a.detail.TotalAmount).FirstOrDefault(),
        //                                                 //  ItemName = x.Select(a => a.invitm.ItemName).FirstOrDefault(),
        //                                                 ItemList = x.Select(a => new { a.invitm.ItemName, a.invitm.TotalAmount }).ToList(),
        //                                                 TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                                             }).ToList();
        //                responseData.Results = CashInvoiceReturnData;
        //            }
        //            else
        //            if (txnModel.Where(a => a.TransactionType.Contains("GoodReceipt")).ToList().Count > 0)
        //            {
        //                var GoodsData = (from itm in pharmacyDbContext.PHRMGoodsReceiptItems.AsEnumerable()
        //                                 join id in referanceIdList on itm.GoodReceiptId equals id
        //                                 join detail in pharmacyDbContext.PHRMGoodsReceipt.AsEnumerable() on itm.GoodReceiptId equals detail.GoodReceiptId
        //                                 group new { itm, detail, id } by new { id } into x
        //                                 select new
        //                                 {
        //                                     // GoodReceiptId = x.Select(a => a.id).FirstOrDefault(),
        //                                     InvoiceNo = x.Select(a => a.detail.InvoiceNo).FirstOrDefault(),
        //                                     //SupplierName = x.Select(a => a.itm.SupplierName).FirstOrDefault(), //Since it can't be set into database, we can't get SupplierName
        //                                     DiscountAmount = x.Select(a => a.detail.DiscountAmount).FirstOrDefault(),
        //                                     VATAmount = x.Select(a => a.detail.VATAmount).FirstOrDefault(),
        //                                     TotalAmount = x.Select(a => a.detail.TotalAmount).FirstOrDefault(),
        //                                     //ItemName = x.Select(a => a.itm.ItemName),
        //                                     //TotalAmount = x.Select(a => a.detail.TotalAmount),
        //                                     ItemList = x.Select(a => new { a.itm.ItemName, a.itm.TotalAmount }).ToList(),
        //                                     TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                                 }).ToList();
        //                responseData.Results = GoodsData;
        //            }
        //            else if (txnModel.Where(a => a.TransactionType.Contains("PHRMDispatchToDeptReturn")).ToList().Count > 0)
        //            {
        //                //EMR_LPH_MERGE: NageshBB- 18-June-2021 -commented below line for temporary build error solution
        //                ///later we need to discuss table and column with pharmacy team and do chagnes as per requirement
        //                //var Data = (from stk in pharmacyDbContext.StockTransactions.AsEnumerable()
        //                //            join itm in pharmacyDbContext.PHRMItemMaster.AsEnumerable() on stk.ItemId equals itm.ItemId

        //                //            join id in referanceIdList on stk.StockTxnItemId equals id
        //                //            group new { stk, id, itm } by new { id } into x
        //                //            select new
        //                //            {
        //                //                ItemList = x.Select(a => new { a.itm.ItemName, a.stk.TotalAmount }).ToList(),
        //                //                TotalAmount = x.Select(a => a.stk.SubTotal).FirstOrDefault(),
        //                //                TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                //            }).ToList();

        //                //responseData.Results = Data;

        //                //sanjit: this condition has been changed beacuse of Stock tables redesign in LPH
        //                var Data = (from stk in pharmacyDbContext.StockTransactions.AsEnumerable()
        //                            join itm in pharmacyDbContext.PHRMItemMaster.AsEnumerable() on stk.ItemId equals itm.ItemId
        //                            join id in referanceIdList on stk.StockTransactionId equals id
        //                            group new { stk, id, itm } by new { id } into x
        //                            select new
        //                            {
        //                                ItemList = x.Select(a => new { a.itm.ItemName, TotalAmount = a.stk.CostPrice * Convert.ToDecimal(a.stk.InQty) }).ToList(),
        //                                TotalAmount = x.Select(a => Convert.ToDecimal(a.stk.InQty) * a.stk.CostPrice).FirstOrDefault(),
        //                                TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                            }).ToList();

        //                responseData.Results = Data;
        //            }
        //            else if (txnModel.Where(a => a.TransactionType.Contains("PHRMDispatchToDept")).ToList().Count > 0)
        //            {
        //                //EMR_LPH_MERGE: NageshBB- 18-June-2021 -commented below line for temporary build error solution
        //                ///later we need to discuss table and column with pharmacy team and do chagnes as per requirement
        //                //var Data = (from stk in pharmacyDbContext.StockTransactions.AsEnumerable()
        //                //            join id in referanceIdList on stk.StockTxnItemId equals id
        //                //            join wdc in pharmacyDbContext.WardConsumption.AsEnumerable() on stk.ReferenceNo equals wdc.InvoiceItemId
        //                //            join pat in pharmacyDbContext.PHRMPatient.AsEnumerable() on wdc.PatientId equals pat.PatientId
        //                //            group new { stk, pat, id, wdc } by new
        //                //            {
        //                //                id,
        //                //                PatientName = pat.FirstName + " " + (string.IsNullOrEmpty(pat.MiddleName) ? "" : pat.MiddleName + " ") + pat.LastName,

        //                //            } into x
        //                //            select new
        //                //            {
        //                //                PatientName = x.Key.PatientName,
        //                //                ItemList = x.Select(a => new { a.wdc.ItemName, a.stk.TotalAmount }).ToList(),
        //                //                TotalAmount = x.Select(a => a.wdc.SubTotal).FirstOrDefault(),
        //                //                TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                //            }).ToList();

        //                //responseData.Results = Data;
        //                //sanjit: this condition has been changed beacuse of Stock tables redesign in LPH
        //                var Data = (from stk in pharmacyDbContext.StockTransactions.AsEnumerable()
        //                            join id in referanceIdList on stk.StockTransactionId equals id
        //                            join wdc in pharmacyDbContext.WardConsumption.AsEnumerable() on stk.ReferenceNo equals wdc.InvoiceItemId
        //                            join pat in pharmacyDbContext.PHRMPatient.AsEnumerable() on wdc.PatientId equals pat.PatientId
        //                            group new { stk, pat, id, wdc } by new
        //                            {
        //                                id,
        //                                PatientName = pat.FirstName + " " + (string.IsNullOrEmpty(pat.MiddleName) ? "" : pat.MiddleName + " ") + pat.LastName,

        //                            } into x
        //                            select new
        //                            {
        //                                PatientName = x.Key.PatientName,
        //                                ItemList = x.Select(a => new { a.wdc.ItemName, TotalAmount = Convert.ToDecimal(a.stk.OutQty) * a.stk.CostPrice }).ToList(),
        //                                TotalAmount = x.Select(a => a.wdc.SubTotal).FirstOrDefault(),
        //                                TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                            }).ToList();

        //                responseData.Results = Data;
        //            }
        //            else
        //            {
        //                var Data = (from detail in pharmacyDbContext.PHRMWriteOff.AsEnumerable()
        //                            join itm in pharmacyDbContext.PHRMWriteOffItem.AsEnumerable() on detail.WriteOffId equals itm.WriteOffId
        //                            join mstItm in pharmacyDbContext.PHRMItemMaster.AsEnumerable() on itm.ItemId equals mstItm.ItemId
        //                            //join gr in pharmacyDbContext.PHRMGoodsReceiptItems.AsEnumerable() on itm.GoodReceiptItemId equals gr.GoodReceiptItemId
        //                            join id in referanceIdList on detail.WriteOffId equals id
        //                            group new { detail, itm, mstItm } by new { detail.WriteOffId } into x
        //                            select new
        //                            {
        //                                //there is no link between writeoff table and good receipt table, so we cannot  get the supplier name 
        //                                //so here I am sending null 
        //                                //SupplierName = x.Select(a => a.gr.SupplierName).FirstOrDefault(),
        //                                SupplierName = "",
        //                                DiscountAmount = x.Select(a => a.detail.DiscountAmount).FirstOrDefault(),
        //                                VATAmount = x.Select(a => a.detail.VATAmount).FirstOrDefault(),
        //                                TotalAmount = x.Select(a => a.detail.TotalAmount).FirstOrDefault(),
        //                                ItemList = x.Select(a => new { a.mstItm.ItemName, a.itm.TotalAmount }).ToList(),
        //                                TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
        //                            }).ToList();
        //                responseData.Results = Data;
        //            }
        //            responseData.Status = "OK";
        //        }
        //        /* * End Pharmacy Section */

        //        /* * Start Incetive Section */
        //        if (txnModel.Where(a => a.SectionId == 5).ToList().Count > 0)
        //        {

        //            if (txnModel.Where(a => a.TransactionType.Contains("ConsultantIncentive")).ToList().Count > 0)
        //            {
        //                var incetiveData = (from invt in incentiveDbContext.IncentiveFractionItems.AsEnumerable()
        //                                    join id in referanceIdList on invt.InctvTxnItemId equals id
        //                                    join emp in accountingDBContext.Emmployees.AsEnumerable() on invt.IncentiveReceiverId equals emp.EmployeeId
        //                                    group new { invt, emp } by new { emp } into x
        //                                    select new
        //                                    {
        //                                        EmployeeName = x.Select(a => a.emp.FullName).FirstOrDefault(),
        //                                        TotalAmount = x.Select(a => a.invt.TotalBillAmount).FirstOrDefault(),
        //                                        ItemList = x.Select(a => new { a.invt.ItemName, a.invt.IncentiveAmount, a.invt.IncentiveReceiverId }).ToList(),
        //                                        TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()

        //                                    }).ToList();

        //                responseData.Results = incetiveData;
        //            }

        //            responseData.Status = "OK";
        //        }
        //        /* * End Incetive Section */
        //    }


        //}
        //    #endregion
        //    #region Cash Flow Report
        //else if (reqType == "cashflowReportData")
        //{
        //    List<SqlParameter> paramList = new List<SqlParameter>()
        //        {
        //            new SqlParameter("@FromDate", FromDate),
        //            new SqlParameter("@ToDate", ToDate),
        //            new SqlParameter("@FiscalYearId", FiscalYearId),
        //            new SqlParameter("@HospitalId", currentHospitalId)
        //        };
        //    DataSet result = DALFunctions.GetDatasetFromStoredProc("SP_ACC_RPT_CashFlowReport", paramList, accountingDBContext);
        //    var OpeningData = DataTableToList.ToDynamic(result.Tables[0]);
        //    var TxnData = DataTableToList.ToDynamic(result.Tables[1]);
        //    var FinalData = new
        //    {
        //        OpeningData,
        //        TxnData
        //    };
        //    responseData.Status = "OK";
        //    responseData.Results = FinalData;
        //    return DanpheJSONConvert.SerializeObject(responseData);

        //    //var result = (from l in accountingDBContext.LedgerGroups
        //    //              where l.HospitalId == currentHospitalId
        //    //              group l by new { l.PrimaryGroup } into x
        //    //              select new
        //    //              {
        //    //                  x.Key.PrimaryGroup,
        //    //                  COAList = (from l in accountingDBContext.LedgerGroups
        //    //                             where l.PrimaryGroup == x.Key.PrimaryGroup && l.HospitalId == currentHospitalId
        //    //                             group l by new
        //    //                             {
        //    //                                 l.PrimaryGroup,
        //    //                                 l.COA
        //    //                             } into x2
        //    //                             select new
        //    //                             {
        //    //                                 x2.Key.COA,
        //    //                                 LedgerGroupList = (from l in accountingDBContext.Ledgers
        //    //                                                    where l.HospitalId == currentHospitalId
        //    //                                                    join lg in accountingDBContext.LedgerGroups on l.LedgerGroupId equals lg.LedgerGroupId
        //    //                                                    where lg.HospitalId == currentHospitalId &&
        //    //                                                    lg.COA == x2.Key.COA && lg.PrimaryGroup == x.Key.PrimaryGroup
        //    //                                                    group lg by new
        //    //                                                    {
        //    //                                                        lg.PrimaryGroup,
        //    //                                                        lg.COA,
        //    //                                                        lg.LedgerGroupName,
        //    //                                                    } into x3
        //    //                                                    select new
        //    //                                                    {
        //    //                                                        x3.Key.LedgerGroupName,
        //    //                                                        LedgersList = (from ti in accountingDBContext.TransactionItems
        //    //                                                                       join l in accountingDBContext.Ledgers on ti.LedgerId equals l.LedgerId
        //    //                                                                       join lgroup in accountingDBContext.LedgerGroups on l.LedgerGroupId equals lgroup.LedgerGroupId
        //    //                                                                       join t in accountingDBContext.Transactions on ti.TransactionId equals t.TransactionId
        //    //                                                                       where lgroup.COA == x2.Key.COA && lgroup.PrimaryGroup == x.Key.PrimaryGroup && lgroup.LedgerGroupName == x3.Key.LedgerGroupName //&& (DbFunctions.TruncateTime(t.TransactionDate) >= FromDate && DbFunctions.TruncateTime(t.TransactionDate) <= ToDate)
        //    //                                                                       group new { lgroup, ti, t, l } by new
        //    //                                                                       {
        //    //                                                                           lgroup.PrimaryGroup,
        //    //                                                                           lgroup.COA,
        //    //                                                                           lgroup.LedgerGroupName,
        //    //                                                                           l.LedgerName,
        //    //                                                                           ti.DrCr,
        //    //                                                                           l.Code
        //    //                                                                       } into x4
        //    //                                                                       select new
        //    //                                                                       {
        //    //                                                                           x4.Key.LedgerName,
        //    //                                                                           x4.Key.LedgerGroupName,
        //    //                                                                           x4.Key.Code,
        //    //                                                                           OpenBal = x4.Where(b => b.lgroup.LedgerGroupName == "Cash In Hand" && (DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate)).Select(a => (int?)a.ti.Amount).DefaultIfEmpty(0).Sum(),
        //    //                                                                           Amountdr = x4.Where(b => b.ti.DrCr == true && (DbFunctions.TruncateTime(b.t.TransactionDate) >= FromDate && DbFunctions.TruncateTime(b.t.TransactionDate) <= ToDate)).Select(a => (int?)a.ti.Amount).DefaultIfEmpty(0).Sum(),
        //    //                                                                           Amountcr = x4.Where(b => b.ti.DrCr == false && (DbFunctions.TruncateTime(b.t.TransactionDate) >= FromDate && DbFunctions.TruncateTime(b.t.TransactionDate) <= ToDate)).Select(a => (int?)a.ti.Amount).DefaultIfEmpty(0).Sum(),
        //    //                                                                       }).ToList()
        //    //                                                    }).ToList()
        //    //                             }).ToList()
        //    //              }).ToList();
        //    //responseData.Status = "OK";
        //    //responseData.Results = result;

        //}
        //    #endregion
        //    #region Daywise Voucher Report
        //else if (reqType == "daywise-voucher-report")
        //{

        //    var SectionList = AccountingBL.GetSections(accountingDBContext, currentHospitalId);
        //    var OpeningBalanceData = (from t in accountingDBContext.Transactions
        //                              join ti in accountingDBContext.TransactionItems on t.TransactionId equals ti.TransactionId
        //                              join fisc in accountingDBContext.FiscalYears on t.FiscalyearId equals fisc.FiscalYearId
        //                              where
        //                              ti.HospitalId == currentHospitalId && fisc.HospitalId == currentHospitalId &&
        //                              (DbFunctions.TruncateTime(t.TransactionDate) == FromDate) && (t.FiscalyearId == fisc.FiscalYearId)
        //                              group new { fisc, ti, t } by new
        //                              {
        //                                  fisc.FiscalYearId,
        //                                  t.TransactionDate,
        //                              } into x
        //                              select new
        //                              {
        //                                  Amountdr = x.Where(b => b.ti.DrCr == true && (DbFunctions.TruncateTime(b.t.TransactionDate) >= b.fisc.StartDate && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate)).Select(a => (int?)a.ti.Amount).DefaultIfEmpty(0).Sum(),
        //                                  Amountcr = x.Where(b => b.ti.DrCr == false && (DbFunctions.TruncateTime(b.t.TransactionDate) >= b.fisc.StartDate && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate)).Select(a => (int?)a.ti.Amount).DefaultIfEmpty(0).Sum(),
        //                                  x.Key.FiscalYearId,
        //                              }).ToList();

        //    var txnList = (from txn in accountingDBContext.Transactions
        //                   where txn.HospitalId == currentHospitalId
        //                   join voucher in accountingDBContext.Vouchers on txn.VoucherId equals voucher.VoucherId
        //                   join fiscal in accountingDBContext.FiscalYears on txn.FiscalyearId equals fiscal.FiscalYearId
        //                   where
        //                   fiscal.HospitalId == currentHospitalId &&
        //                   txn.IsActive == true && (DbFunctions.TruncateTime(txn.TransactionDate) >= FromDate && DbFunctions.TruncateTime(txn.TransactionDate) <= ToDate)
        //                   && txn.SectionId == sectionId && txn.FiscalyearId == FiscalYearId
        //                   select new
        //                   {
        //                       TransactionId = txn.TransactionId,
        //                       FiscalYear = fiscal.FiscalYearName,
        //                       //VoucherNumber = txn.VoucherNumber,
        //                       VoucherNumber = txn.DayVoucherNumber,
        //                       VoucherType = voucher.VoucherName,
        //                       VoucherId = txn.VoucherId,
        //                       SectionId = txn.SectionId,
        //                       TransactionDate = DbFunctions.TruncateTime(txn.TransactionDate),// txn.TransactionDate.ToString("dd/mm/yyyy"),                                       
        //                       Amount = (from txnItm in accountingDBContext.TransactionItems
        //                                 where txnItm.TransactionId == txn.TransactionId
        //                                 && txnItm.DrCr == true
        //                                 group txnItm by new
        //                                 {
        //                                     txnItm.DrCr
        //                                 } into g
        //                                 select g.Sum(x => x.Amount)
        //                                 ).FirstOrDefault()
        //                   }).OrderByDescending(a => a.TransactionId).ToList();
        //    //below query as per new requirement if wants old one result then please comment below and take txnList as result
        //    var finalData = (from t in txnList
        //                     group new { t } by new
        //                     {
        //                         t.VoucherNumber,
        //                         t.FiscalYear,
        //                         t.VoucherType,
        //                         t.TransactionDate,
        //                         t.SectionId
        //                     }
        //                    into x
        //                     select new
        //                     {
        //                         FiscalYear = x.Key.FiscalYear,
        //                         VoucherNumber = x.Key.VoucherNumber,
        //                         VoucherType = x.Key.VoucherType,
        //                         TransactionDate = x.Key.TransactionDate,
        //                         Amount = x.Sum(y => y.t.Amount),
        //                         SectionId = x.Key.SectionId,
        //                         SectionName = SectionList.Where(s => s.SectionId == x.Key.SectionId).Select(a => a.SectionName).FirstOrDefault(),
        //                         VoucherId = x.Select(a => a.t.VoucherId).FirstOrDefault()
        //                     }).OrderByDescending(a => a.TransactionDate).ToList();

        //    responseData.Status = "OK";
        //    responseData.Results = finalData;
        //}
        //#endregion

        //#region DayWise Voucher details by DayWise Voucher Number                
        //else if (reqType == "daywise-voucher-detail-by-dayVoucherNO")
        //{
        //    //getting uniqueid and sectionid of transaction 
        //    var txnids = (from txn in accountingDBContext.Transactions
        //                  where
        //                  txn.HospitalId == currentHospitalId &&
        //                  txn.DayVoucherNumber == DayVoucherNumber && txn.IsActive == true && txn.VoucherId == voucherId && txn.SectionId == sectionId
        //                  select new
        //                  {
        //                      txn.SectionId,
        //                      txn.TUId,
        //                      txn.VoucherNumber
        //                  }).FirstOrDefault();


        //    if (txnids.VoucherNumber.Contains("SV") && txnids.SectionId == 2)
        //    {//Ajay 15Feb Here we only getting records for Billing Sales Voucher
        //        //getting single transaction with multiple vouchers
        //        var alltransactions = (from txn in accountingDBContext.Transactions
        //                               where
        //                               txn.HospitalId == currentHospitalId &&
        //                               txn.TUId == txnids.TUId
        //                               select txn).ToList();
        //        var alltransactionitems = (from txnitm in accountingDBContext.TransactionItems.AsEnumerable()
        //                                   join txn in alltransactions on txnitm.TransactionId equals txn.TransactionId
        //                                   select txnitm).ToList();
        //        //getting only single sales voucher records
        //        var transactions = (from txn in alltransactions
        //                            where
        //                            txn.HospitalId == currentHospitalId &&
        //                            txn.DayVoucherNumber == DayVoucherNumber && txn.IsActive == true
        //                            select txn).ToList();
        //        //getting transaction items for selected trasnaction
        //        var transactionitems = (from ti in alltransactionitems
        //                                where ti.HospitalId == currentHospitalId
        //                                join t in transactions on ti.TransactionId equals t.TransactionId
        //                                select ti).ToList();
        //        //getting vouchers
        //        var vouchers = (from v in accountingDBContext.Vouchers select v).ToList();
        //        //getting voucher heads
        //        var voucherheads = (from head in accountingDBContext.VoucherHeads select head).ToList();
        //        //fiscal year
        //        var fiscalYear = (from fiscal in accountingDBContext.FiscalYears
        //                          where fiscal.HospitalId == currentHospitalId
        //                          select fiscal).ToList();
        //        //getting ledgers
        //        var ledgers = (from l in accountingDBContext.Ledgers
        //                       where l.HospitalId == currentHospitalId
        //                       select l).ToList();
        //        //getting ledgergroups
        //        var ledgergroup = (from lg in accountingDBContext.LedgerGroups
        //                           where lg.HospitalId == currentHospitalId
        //                           select lg).ToList();
        //        //getting trasnaction items details for supplier patient and for user
        //        var transactionitemdetails = (from d in accountingDBContext.TransactionItemDetails
        //                                      select d).ToList();
        //        //getting patient
        //        var patients = (from pat in accountingDBContext.PatientModel.AsEnumerable()
        //                        join txndetail in transactionitemdetails on pat.PatientId equals txndetail.ReferenceId
        //                        join txnitm in alltransactionitems on txndetail.TransactionItemId equals txnitm.TransactionItemId
        //                        where txndetail.ReferenceType == "Patient"
        //                        select new
        //                        {
        //                            txndetail.ReferenceId,
        //                            txnitm.LedgerId,
        //                            txnitm.DrCr,
        //                            Name = pat.FirstName + pat.LastName,
        //                            txndetail.Amount
        //                        }).ToList();
        //        //getting suppliers
        //        var supplier = (from sup in accountingDBContext.PHRMSupplier select sup).ToList();
        //        //getting user details
        //        var userDetails = (from txn in alltransactions
        //                           join txnitm in alltransactionitems on txn.TransactionId equals txnitm.TransactionId
        //                           join txndetail in transactionitemdetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
        //                           join emp in accountingDBContext.Emmployees.AsEnumerable() on txndetail.ReferenceId equals emp.EmployeeId
        //                           where txndetail.ReferenceType == "User"
        //                           select new
        //                           {
        //                               LedgerId = txnitm.LedgerId,
        //                               DrCr = txnitm.DrCr,
        //                               Name = emp.FirstName + " " + (string.IsNullOrEmpty(emp.LastName) ? "" : emp.LastName),
        //                               txndetail.ReferenceId,
        //                               txndetail.Amount,
        //                               txn.VoucherNumber,
        //                           }).ToList();
        //        //getting amount of credit note voucher and payment voucher
        //        var Amounts = (from txn in alltransactions
        //                       join txnItm in alltransactionitems on txn.TransactionId equals txnItm.TransactionId
        //                       join led in ledgers on txnItm.LedgerId equals led.LedgerId
        //                       group new { txn, txnItm, led } by new { txn.VoucherId } into x
        //                       select new
        //                       {
        //                           ReturnAmount = x.Where(a => a.txn.VoucherNumber.Contains("CN") && a.txnItm.DrCr == true /*&& a.txn.TransactionType.StartsWith("Cash")*/).Sum(a => a.txnItm.Amount),
        //                           PaymentAmount = x.Where(a => a.txn.VoucherNumber.Contains("PMTV") && a.txnItm.DrCr == true).Sum(a => a.txnItm.Amount),
        //                           ReturnDiscount = x.Where(a => a.led.Name == "EIE_ADMINISTRATION_EXPENSES_TRADE_DISCOUNT" && a.txnItm.DrCr == false).Sum(a => a.txnItm.Amount),
        //                           ReceivablesAmount = x.Where(a => a.led.Name == "ACA_SUNDRY_DEBTORS_RECEIVABLES" && a.txnItm.DrCr == true).Sum(a => a.txnItm.Amount)
        //                                        - x.Where(a => a.led.Name == "ACA_SUNDRY_DEBTORS_RECEIVABLES" && a.txnItm.DrCr == false).Sum(a => a.txnItm.Amount)
        //                       }).ToList();
        //        //getting user cash collection
        //        var UserCashCollection = (from user in userDetails
        //                                  group new { user } by new { user.ReferenceId } into x
        //                                  select new
        //                                  {
        //                                      UserName = x.Select(a => a.user.Name).FirstOrDefault(),
        //                                      SalesDr = x.Where(a => a.user.DrCr == true && a.user.VoucherNumber.Contains("SV")).Sum(a => a.user.Amount),
        //                                      SalesCr = x.Where(a => a.user.DrCr == false && a.user.VoucherNumber.Contains("SV")).Sum(a => a.user.Amount),
        //                                      DepositDr = x.Where(a => a.user.DrCr == true && !a.user.VoucherNumber.Contains("SV")).Sum(a => a.user.Amount),
        //                                      DepositCr = x.Where(a => a.user.DrCr == false && !a.user.VoucherNumber.Contains("SV")).Sum(a => a.user.Amount),
        //                                  }).ToList();
        //        //getting record for selected sales voucher
        //        var temp = (from txn in transactions
        //                    join voucher in vouchers on txn.VoucherId equals voucher.VoucherId
        //                    join costCenter in accountingDBContext.CostCenters on txn.CostCenterId equals costCenter.CostCenterId
        //                    join fiscal in fiscalYear on txn.FiscalyearId equals fiscal.FiscalYearId
        //                    select new
        //                    {
        //                        txn.VoucherNumber,
        //                        fiscal.FiscalYearName,
        //                        costCenter.CostCenterName,
        //                        txn.TransactionDate,
        //                        voucher.VoucherName,
        //                        txn.Remarks,
        //                        txn.DayVoucherNumber
        //                    }).ToList();
        //        //formatting data for sales voucher
        //        var txnList = (from temptxn in temp
        //                       select new
        //                       {
        //                           VoucherNumber = temptxn.VoucherNumber,
        //                           DayVoucherNumber = temptxn.DayVoucherNumber,
        //                           FiscalYear = temptxn.FiscalYearName,
        //                           CostCenterName = temptxn.CostCenterName,
        //                           TransactionDate = temptxn.TransactionDate,
        //                           VoucherType = temptxn.VoucherName,
        //                           Remarks = temptxn.Remarks,
        //                           TransactionItems = (from txnItm in alltransactionitems
        //                                               join ledger in ledgers on txnItm.LedgerId equals ledger.LedgerId
        //                                               join txn in alltransactions on txnItm.TransactionId equals txn.TransactionId
        //                                               join ledgp in ledgergroup on ledger.LedgerGroupId equals ledgp.LedgerGroupId
        //                                               group new { ledger, ledgp, txnItm, txn } by new
        //                                               {
        //                                                   ledgp.LedgerGroupName,
        //                                                   ledger.LedgerName,
        //                                                   txnItm.DrCr,
        //                                                   ledger.LedgerId,
        //                                                   txn.TransactionType,
        //                                                   //txn.VoucherNumber
        //                                                   txn.DayVoucherNumber,
        //                                                   ledger.Code
        //                                               }
        //                                               into x
        //                                               select new
        //                                               {
        //                                                   LedgerId = x.Key.LedgerId,
        //                                                   LedgerGroupName = x.Key.LedgerGroupName,
        //                                                   LedgerName = x.Key.LedgerName,
        //                                                   Code = x.Key.Code,
        //                                                   DrCr = x.Key.DrCr,
        //                                                   VoucherNumber = x.Key.DayVoucherNumber,
        //                                                   TransactionType = x.Select(a => a.txn.TransactionType).ToList(),
        //                                                   Name = x.Select(a => a.ledger.Name).FirstOrDefault(),
        //                                                   Amount = x.Select(a => a.txnItm.Amount).Sum(),
        //                                                   Remarks = x.Select(a => a.txn.Remarks),
        //                                                   Details = (from pat in patients
        //                                                              where pat.LedgerId == x.Key.LedgerId && pat.DrCr == x.Key.DrCr
        //                                                              group new { pat } by new
        //                                                              {
        //                                                                  pat.ReferenceId,
        //                                                                  pat.DrCr
        //                                                              } into x1
        //                                                              select new
        //                                                              {
        //                                                                  Name = x1.Select(a => a.pat.Name).FirstOrDefault(),
        //                                                                  Dr = x1.Where(a => a.pat.DrCr == true).Sum(a => a.pat.Amount),
        //                                                                  Cr = x1.Where(a => a.pat.DrCr == false).Sum(a => a.pat.Amount),
        //                                                              }).ToList(),
        //                                                   SupplierDetails = (from txnitm in transactionitems
        //                                                                      join txndetail in transactionitemdetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
        //                                                                      join sup in supplier on txndetail.ReferenceId equals sup.SupplierId
        //                                                                      where txnitm.LedgerId == x.Key.LedgerId && txnitm.DrCr == x.Key.DrCr && txndetail.ReferenceType == "Supplier"
        //                                                                      group new { txnitm, sup, txndetail } by new
        //                                                                      {
        //                                                                          txndetail.ReferenceId,
        //                                                                          txnitm.DrCr
        //                                                                      } into x1
        //                                                                      select new
        //                                                                      {
        //                                                                          Name = x1.Select(a => a.sup.SupplierName).FirstOrDefault(),
        //                                                                          Dr = x1.Where(a => a.txnitm.DrCr == true).Sum(a => a.txndetail.Amount),
        //                                                                          Cr = x1.Where(a => a.txnitm.DrCr == false).Sum(a => a.txndetail.Amount),
        //                                                                      }).ToList(),
        //                                               }).OrderByDescending(a => a.DrCr).ToList()
        //                       }).FirstOrDefault();
        //        //merging supplier details and patient details, user details
        //        txnList.TransactionItems.ForEach(data =>
        //        {
        //            //foreach (var det in data.UserDetails)
        //            //{
        //            //    data.Details.Add(det);
        //            //}
        //            foreach (var det in data.SupplierDetails)
        //            {
        //                data.Details.Add(det);
        //            }
        //        });
        //        //combining final result with credit not amount, payment amount, UserCashCollection and sales voucher transaction details
        //        var res = new
        //        {
        //            Amounts = new
        //            {
        //                ReturnAmount = Amounts.Sum(a => a.ReturnAmount),
        //                PaymentAmount = Amounts.Sum(a => a.PaymentAmount),
        //                RetrunDiscount = Amounts.Sum(a => a.ReturnDiscount),
        //                ReceivableAmount = Amounts.Sum(a => a.ReceivablesAmount),
        //            },
        //            txnList,
        //            SectionId = txnids.SectionId,
        //            UserCashCollection
        //        };
        //        responseData.Results = res;
        //    }
        //    else
        //    {
        //        var txnList = (from txn in accountingDBContext.Transactions
        //                       where txn.HospitalId == currentHospitalId
        //                       join voucher in accountingDBContext.Vouchers on txn.VoucherId equals voucher.VoucherId
        //                       join costCenter in accountingDBContext.CostCenters on txn.CostCenterId equals costCenter.CostCenterId
        //                       join fiscal in accountingDBContext.FiscalYears on txn.FiscalyearId equals fiscal.FiscalYearId
        //                       where
        //                       //head.HospitalId == currentHospitalId &&
        //                       fiscal.HospitalId == currentHospitalId &&
        //                       txn.DayVoucherNumber == DayVoucherNumber && txn.IsActive == true && txn.VoucherId == voucherId
        //                       select new
        //                       {
        //                           // TransactionId = txn.TransactionId,
        //                           VoucherNumber = txn.VoucherNumber,
        //                           DayVoucherNumber = txn.DayVoucherNumber,
        //                           FiscalYear = fiscal.FiscalYearName,
        //                           CostCenterName = costCenter.CostCenterName,
        //                           TransactionDate = txn.TransactionDate,
        //                           VoucherType = voucher.VoucherName,
        //                           Remarks = txn.Remarks,
        //                           TransactionItems = (from txnItm in accountingDBContext.TransactionItems
        //                                               where txnItm.HospitalId == currentHospitalId
        //                                               join ledger in accountingDBContext.Ledgers on txnItm.LedgerId equals ledger.LedgerId
        //                                               join txnp in accountingDBContext.Transactions on txnItm.TransactionId equals txnp.TransactionId
        //                                               join ledgp in accountingDBContext.LedgerGroups on ledger.LedgerGroupId equals ledgp.LedgerGroupId
        //                                               where
        //                                               ledger.HospitalId == currentHospitalId && ledgp.HospitalId == currentHospitalId &&
        //                                               txnp.DayVoucherNumber == DayVoucherNumber && txnp.VoucherId == voucherId
        //                                               group new { ledger, ledgp, txnItm, txnp } by new
        //                                               {
        //                                                   ledgp.LedgerGroupName,
        //                                                   ledger.LedgerName,
        //                                                   txnItm.DrCr,
        //                                                   ledger.LedgerId,
        //                                                   ledger.Code
        //                                               }
        //                                               into x
        //                                               select new
        //                                               {
        //                                                   LedgerId = x.Key.LedgerId,
        //                                                   LedgerGroupName = x.Key.LedgerGroupName,
        //                                                   LedgerName = x.Key.LedgerName,
        //                                                   Code = x.Key.Code,
        //                                                   DrCr = x.Key.DrCr,
        //                                                   Amount = x.Select(a => a.txnItm.Amount).Sum(),
        //                                                   Remarks = x.Select(a => a.txnp.Remarks),
        //                                                   Details = (from txnitm in accountingDBContext.TransactionItems
        //                                                              where txnitm.HospitalId == currentHospitalId
        //                                                              join txndetail in accountingDBContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
        //                                                              join pat in accountingDBContext.PatientModel on txndetail.ReferenceId equals pat.PatientId
        //                                                              join txn in accountingDBContext.Transactions on txnitm.TransactionId equals txn.TransactionId
        //                                                              where txn.HospitalId == currentHospitalId &&
        //                                                              txn.DayVoucherNumber == DayVoucherNumber && txnitm.LedgerId == x.Key.LedgerId && txnitm.DrCr == x.Key.DrCr && txndetail.ReferenceType == "Patient" && txn.VoucherId == voucherId
        //                                                              group new { txnitm, pat, txndetail } by new
        //                                                              {
        //                                                                  txndetail.ReferenceId,
        //                                                                  txnitm.DrCr
        //                                                              } into x1
        //                                                              select new
        //                                                              {
        //                                                                  Name = x1.Select(a => a.pat.FirstName + a.pat.LastName).FirstOrDefault(),
        //                                                                  Dr = x1.Where(a => a.txnitm.DrCr == true).Sum(a => a.txndetail.Amount),
        //                                                                  Cr = x1.Where(a => a.txnitm.DrCr == false).Sum(a => a.txndetail.Amount),
        //                                                              }).ToList(),
        //                                                   SupplierDetails = (from txnitm in accountingDBContext.TransactionItems
        //                                                                      where txnitm.HospitalId == currentHospitalId
        //                                                                      join txndetail in accountingDBContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
        //                                                                      join sup in accountingDBContext.PHRMSupplier on txndetail.ReferenceId equals sup.SupplierId
        //                                                                      join txn in accountingDBContext.Transactions on txnitm.TransactionId equals txn.TransactionId
        //                                                                      where
        //                                                                      txn.HospitalId == currentHospitalId &&
        //                                                                      txn.DayVoucherNumber == DayVoucherNumber && txnitm.LedgerId == x.Key.LedgerId && txnitm.DrCr == x.Key.DrCr && txndetail.ReferenceType == "Supplier" && txn.VoucherId == voucherId
        //                                                                      group new { txnitm, sup, txndetail } by new
        //                                                                      {
        //                                                                          txndetail.ReferenceId,
        //                                                                          txnitm.DrCr
        //                                                                      } into x1
        //                                                                      select new
        //                                                                      {
        //                                                                          Name = x1.Select(a => a.sup.SupplierName).FirstOrDefault(),
        //                                                                          Dr = x1.Where(a => a.txnitm.DrCr == true).Sum(a => a.txndetail.Amount),
        //                                                                          Cr = x1.Where(a => a.txnitm.DrCr == false).Sum(a => a.txndetail.Amount),
        //                                                                      }).ToList(),
        //                                                   UserDetails = (from txnitm in accountingDBContext.TransactionItems
        //                                                                  where txnitm.HospitalId == currentHospitalId
        //                                                                  join txndetail in accountingDBContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
        //                                                                  join emp in accountingDBContext.Emmployees on txndetail.ReferenceId equals emp.EmployeeId
        //                                                                  join txn in accountingDBContext.Transactions on txnitm.TransactionId equals txn.TransactionId
        //                                                                  where
        //                                                                  txn.HospitalId == currentHospitalId &&
        //                                                                  txn.DayVoucherNumber == DayVoucherNumber && txn.VoucherId == voucherId && txnitm.LedgerId == x.Key.LedgerId && txnitm.DrCr == x.Key.DrCr && txndetail.ReferenceType == "User" && txn.TUId == txnids.TUId
        //                                                                  group new { txnitm, emp, txndetail } by new
        //                                                                  {
        //                                                                      txndetail.ReferenceId,
        //                                                                      txnitm.DrCr
        //                                                                  } into x1
        //                                                                  select new
        //                                                                  {
        //                                                                      Name = x1.Select(a => a.emp.FirstName + " " + (string.IsNullOrEmpty(a.emp.LastName) ? "" : a.emp.LastName)).FirstOrDefault(),
        //                                                                      Dr = x1.Where(a => a.txnitm.DrCr == true).Sum(a => a.txndetail.Amount),
        //                                                                      Cr = x1.Where(a => a.txnitm.DrCr == false).Sum(a => a.txndetail.Amount),
        //                                                                  }).ToList(),
        //                                                   VendorDetails = (from txnitm in accountingDBContext.TransactionItems
        //                                                                    where txnitm.HospitalId == currentHospitalId
        //                                                                    join txndetail in accountingDBContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
        //                                                                    join ven in accountingDBContext.InvVendors on txndetail.ReferenceId equals ven.VendorId
        //                                                                    join txn in accountingDBContext.Transactions on txnitm.TransactionId equals txn.TransactionId
        //                                                                    where
        //                                                                    txn.HospitalId == currentHospitalId &&
        //                                                                    txn.DayVoucherNumber == DayVoucherNumber && txn.VoucherId == voucherId && txnitm.LedgerId == x.Key.LedgerId && txnitm.DrCr == x.Key.DrCr && txndetail.ReferenceType == "Vendor"
        //                                                                    group new { txnitm, ven, txndetail } by new
        //                                                                    {
        //                                                                        txndetail.ReferenceId,
        //                                                                        txnitm.DrCr
        //                                                                    } into x1
        //                                                                    select new
        //                                                                    {
        //                                                                        Name = x1.Select(a => a.ven.VendorName).FirstOrDefault(),
        //                                                                        Dr = x1.Where(a => a.txnitm.DrCr == true).Sum(a => a.txndetail.Amount),
        //                                                                        Cr = x1.Where(a => a.txnitm.DrCr == false).Sum(a => a.txndetail.Amount),
        //                                                                    }).ToList(),
        //                                               }).OrderByDescending(a => a.DrCr).ToList()
        //                       }).FirstOrDefault();
        //        txnList.TransactionItems.ForEach(data =>
        //        {
        //            foreach (var det in data.UserDetails)
        //            {
        //                data.Details.Add(det);
        //            }
        //            foreach (var det in data.SupplierDetails)
        //            {
        //                data.Details.Add(det);
        //            }
        //            foreach (var det in data.VendorDetails)
        //            {
        //                data.Details.Add(det);
        //            }
        //        });
        //        var res = new
        //        {
        //            SectionId = txnids.SectionId,
        //            txnList
        //        };
        //        responseData.Results = res;
        //    }
        //    responseData.Status = "OK";
        //}
        //    #endregion

        //    #region System Audit Report
        //else if (reqType == "system-aduit-report")
        //{
        //    List<SqlParameter> paramList = new List<SqlParameter>()
        //                {
        //                        new SqlParameter("@FromDate", FromDate),
        //                        new SqlParameter("@ToDate", ToDate),
        //                        new SqlParameter("@voucherReportType", voucherReportType),
        //                        new SqlParameter("@SectionId", sectionId)
        //                };
        //    var spDataTable = DALFunctions.GetDataTableFromStoredProc("SP_ACC_RPT_GetSystemAduitReport", paramList, accountingDBContext);
        //    var resultStr = JsonConvert.SerializeObject(spDataTable, new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
        //    var TransactionWithItems = JsonConvert.DeserializeObject<List<dynamic>>(resultStr);
        //    responseData.Status = "OK";
        //    responseData.Results = TransactionWithItems;
        //}
        //    #endregion
        //    #region Get reverse transaction detail by ReverseTransactionId
        //else if (reqType == "reverse-transaction-detail")
        //{
        //    List<SqlParameter> paramList = new List<SqlParameter>()
        //                {
        //                        new SqlParameter("@ReverseTransactionId", ReverseTransactionId),
        //                };
        //    var spDataTable = DALFunctions.GetDatasetFromStoredProc("SP_ACC_RPT_GetReverseTranactionDetail", paramList, accountingDBContext);
        //    var resultStr = JsonConvert.SerializeObject(spDataTable.Tables[0], new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
        //    var RevereTransactionDetailList = JsonConvert.DeserializeObject<List<dynamic>>(resultStr);
        //    var txnRecordsStr = JsonConvert.SerializeObject(spDataTable.Tables[1], new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
        //    var txnRecordList = JsonConvert.DeserializeObject<List<dynamic>>(txnRecordsStr);
        //    responseData.Status = "OK";
        //    responseData.Results = new
        //    {
        //        RevereTransactionDetailList,
        //        txnRecordList
        //    };
        //}
        //    #endregion
        //    #region Bank-Reconcilation-report
        //else if (reqType == "bank-reconcilation-report")
        //{
        //    var fYearId = AccountingTransferData.GetFiscalYearIdForOpeningBalance(accountingDBContext, FiscalYearId, currentHospitalId);

        //    var Ledgers = accountingDBContext.Ledgers.AsQueryable();
        //    var led = (from l in Ledgers
        //               join lbh in accountingDBContext.LedgerBalanceHistory on l.LedgerId equals lbh.LedgerId
        //               where lbh.LedgerId == ledgerId && lbh.HospitalId == currentHospitalId && lbh.FiscalYearId == fYearId
        //               select new
        //               {
        //                   lbh.OpeningBalance,
        //                   DrCr = lbh.OpeningDrCr == null ? true : lbh.OpeningDrCr,
        //                   lbh.LedgerId,
        //                   l.LedgerName
        //               }).FirstOrDefault();

        //    var transactionRecords = (from t in accountingDBContext.Transactions
        //                              join ti in accountingDBContext.TransactionItems on t.TransactionId equals ti.TransactionId
        //                              join l in Ledgers on ti.LedgerId equals l.LedgerId
        //                              join v in accountingDBContext.Vouchers on t.VoucherId equals v.VoucherId
        //                              where
        //                              ti.HospitalId == currentHospitalId
        //                              && l.HospitalId == currentHospitalId &&
        //                              (ti.LedgerId == ledgerId) && (DbFunctions.TruncateTime(t.TransactionDate) >= FromDate && DbFunctions.TruncateTime(t.TransactionDate) <= ToDate)
        //                              select new
        //                              {
        //                                  t.TransactionId,
        //                                  t.TransactionDate,
        //                                  t.VoucherNumber,
        //                                  l.LedgerName,
        //                                  l.Code,
        //                                  OpeningBalance = led.OpeningBalance,
        //                                  OpeningBalanceType = led.DrCr,
        //                                  t.FiscalyearId,
        //                                  v.VoucherName,
        //                                  t.SectionId,
        //                                  ti.Amount,
        //                                  ti.DrCr,
        //                                  Description = (t.SectionId == 4) ? ti.Description : "",
        //                                  l.LedgerId,
        //                                  t.HospitalId
        //                              }).ToList();

        //    List<DataListDTOModel> dataList = new List<DataListDTOModel>();

        //    var openingBalanceFiscalYear = (from f in accountingDBContext.FiscalYears where f.FiscalYearId == fYearId select f).FirstOrDefault();
        //    var dataList1 = (from t in accountingDBContext.Transactions
        //                     join ti in accountingDBContext.TransactionItems on t.TransactionId equals ti.TransactionId
        //                     join l in Ledgers on ti.LedgerId equals l.LedgerId
        //                     where
        //                     ti.HospitalId == currentHospitalId
        //                     && l.HospitalId == currentHospitalId &&
        //                     (ti.LedgerId == ledgerId) && (DbFunctions.TruncateTime(t.TransactionDate) >= DbFunctions.TruncateTime(openingBalanceFiscalYear.StartDate) && DbFunctions.TruncateTime(t.TransactionDate) <= ToDate)
        //                     group new { t, ti, l } by new
        //                     {
        //                         l.LedgerId,
        //                     }
        //                    into x
        //                     select new
        //                     {
        //                         FiscalYearId = fYearId,
        //                         AmountDr = x.Where(b => b.ti.DrCr == true && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate).Select(a => (double?)a.ti.Amount).DefaultIfEmpty(0).Sum() + ((transactionRecords.Count == 0 && led.LedgerId > 0 && led.DrCr == true) ? led.OpeningBalance : 0),
        //                         AmountCr = x.Where(b => b.ti.DrCr == false && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate).Select(a => (double?)a.ti.Amount).DefaultIfEmpty(0).Sum() + ((transactionRecords.Count == 0 && led.LedgerId > 0 && led.DrCr == false) ? led.OpeningBalance : 0),
        //                     }).ToList();

        //    if (transactionRecords.Count == 0)// && dataList1.Count == 0)
        //    {
        //        var dToday = DateTime.Now.Date;
        //        var fYId = AccountingTransferData.GetFiscalYearIdByDate(accountingDBContext, dToday, currentHospitalId);
        //        dataList.Add(new DataListDTOModel
        //        {
        //            FiscalYearId = fYId,
        //            AmountDr = ((led.DrCr == true) ? led.OpeningBalance : 0),
        //            AmountCr = ((led.DrCr == false) ? led.OpeningBalance : 0)
        //        });

        //    }
        //    else if (dataList1.Count > 0)
        //    {
        //        dataList1.ForEach(ss =>
        //        {
        //            dataList.Add(
        //                new DataListDTOModel
        //                {
        //                    FiscalYearId = dataList1[0].FiscalYearId,
        //                    AmountDr = (transactionRecords.Count == 0 && led.DrCr == true) ? dataList1[0].AmountDr : dataList1[0].AmountDr,
        //                    AmountCr = (transactionRecords.Count == 0 && led.DrCr == false) ? dataList1[0].AmountCr : dataList1[0].AmountCr
        //                });
        //        });

        //    }


        //    var recnsRecords = (from t in transactionRecords
        //                        join r in accountingDBContext.BankReconciliationModel on
        //                 t.LedgerId equals r.LedgerId
        //                        where t.HospitalId == r.HospitalId && t.VoucherNumber == r.VoucherNumber && t.FiscalyearId == r.FiscalyearId
        //                        select r).ToList();

        //    var VouchersWithReconciliation = (from itm in transactionRecords

        //                                      select new
        //                                      {
        //                                          TransactionDate = itm.TransactionDate,
        //                                          VoucherNumber = itm.VoucherNumber,
        //                                          VoucherName = itm.VoucherName,
        //                                          LedgerDr = (itm.DrCr == true) ? itm.Amount : 0,
        //                                          LedgerCr = (itm.DrCr == false) ? itm.Amount : 0,
        //                                          Amount = itm.Amount,
        //                                          DrCr = itm.DrCr,
        //                                          AmountCr = dataList[0].AmountCr,
        //                                          AmountDr = dataList[0].AmountDr,
        //                                          Balance = 0,
        //                                          BalanceType = true,
        //                                          OpeningBalance = itm.OpeningBalance,
        //                                          OpeningBalanceType = itm.OpeningBalanceType,
        //                                          DepartmentName = "TempTest",
        //                                          Description = itm.Description,
        //                                          SectionId = itm.SectionId,
        //                                          FiscalYearId = itm.FiscalyearId,
        //                                          BankReconciliationTxn = (from b in recnsRecords
        //                                                                   where b.HospitalId == itm.HospitalId && b.FiscalyearId == itm.FiscalyearId
        //                                                 && b.VoucherNumber == itm.VoucherNumber && b.LedgerId == itm.LedgerId
        //                                                                   select b).OrderByDescending(t => t.Id).FirstOrDefault(),
        //                                          TransactionId = itm.TransactionId,
        //                                          ledgerId = itm.LedgerId,
        //                                      }).ToList();


        //    var FinalData = new
        //    {
        //        VouchersWithReconciliation,
        //        dataList
        //    };
        //    responseData.Status = "OK";
        //    responseData.Results = FinalData;
        //}
        //else if (reqType == "Bank-Reconciliation-history")
        //{

        //    var history = (from bank in accountingDBContext.BankReconciliationModel
        //                   join emp in accountingDBContext.Emmployees on bank.CreatedBy equals emp.EmployeeId
        //                   where bank.HospitalId == currentHospitalId && bank.VoucherNumber == VoucherNumber
        //                   && bank.FiscalyearId == FiscalYearId

        //                   select new
        //                   {
        //                       bank.LedgerId,
        //                       bank.VoucherNumber,
        //                       bank.TransactionId,
        //                       bank.TransactionDate,
        //                       bank.BankBalance,
        //                       bank.BankTransactionDate,
        //                       bank.Id,
        //                       bank.CategoryId,
        //                       bank.Remark,
        //                       Balance = 0,
        //                       User = emp.FullName,
        //                   }).ToList();
        //    responseData.Status = "OK";
        //    responseData.Results = history;
        //}

        //else
        //{
        //    responseData.Status = "failed";
        //    responseData.ErrorMessage = "Invalid request type.";
        //}
        //#endregion


        //}
        //catch (Exception ex)
        //{
        //    string str = ex.InnerException.Message.ToString();
        //    responseData.Status = "Failed";
        //    responseData.ErrorMessage = ex.Message;
        //}
        //return DanpheJSONConvert.SerializeObject(responseData);

        //}
        #endregion
        // POST api/values
        // DevN : 2 Feb 2023 : For Reporting we actually use GET APIs. However, this API is an exception case.
        // In fact we perform both Get and Post actions from Same Reporting page, Therefore we have one POST API here inside AccountingReport Controller.
        [HttpPost]
        [Route("PostReconciliation")]
        public string PostReconciliation()
        {
            //if reqtype=employee, then use masterdbcontext.employee.add  and so on for others.

            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();//type 'object' since we have variable return types
            responseData.Status = ENUM_DanpheHttpResponseText.OK;//by default status would be OK, hence assigning at the top
            //AccountingDbContext accountingDBContext = new AccountingDbContext(connString);
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            int currentHospitalId = HttpContext.Session.Get<int>(ENUM_SessionValues.CurrentHospitalId);
            using(var dbTransaction = _accountingDbContext.Database.BeginTransaction())
            {
                try
                {

                    //string reqType = this.ReadQueryStringData("reqType");
                    string companyName = this.ReadQueryStringData("companyName");
                    //if (reqType == "post-reconciliation")
                    //{
                    string str = this.ReadPostData();
                    BankReconciliationVM bankReconciliationVm = DanpheJSONConvert.DeserializeObject<BankReconciliationVM>(str);
                    var txnClient = bankReconciliationVm.BankReconciliation;
                    var extraTxns = bankReconciliationVm.AdditionalTransaction;
                    if (txnClient != null)
                    {
                        txnClient.ForEach(itm =>
                        {
                            var bankObj = new BankReconciliationModel();
                            bankObj.BankTransactionDate = itm.BankTransactionDate;
                            bankObj.TransactionDate = itm.TransactionDate;
                            bankObj.VerifiedBy = currentUser.EmployeeId;
                            bankObj.IsVerified = itm.IsVerified;
                            bankObj.VerifiedOn = DateTime.Now;
                            bankObj.VoucherNumber = itm.VoucherNumber;
                            bankObj.SectionId = itm.SectionId;
                            bankObj.Remark = itm.Remark;
                            bankObj.CategoryId = itm.CategoryId;
                            bankObj.FiscalyearId = itm.FiscalyearId;
                            bankObj.BankBalance = itm.BankBalance;
                            bankObj.TransactionId = itm.TransactionId;
                            bankObj.LedgerId = itm.LedgerId;
                            bankObj.HospitalId = currentHospitalId;
                            bankObj.CreatedOn = DateTime.Now;
                            bankObj.CreatedBy = currentUser.EmployeeId;
                            bankObj.DrCr = itm.DrCr;
                            bankObj.BankRefNumber = itm.BankRefNumber;
                            bankObj.VoucherTypeId = itm.VoucherTypeId;
                            bankObj.PartyLedgerId = itm.PartyLedgerId;
                            bankObj.PartySubLedgerId = itm.PartySubLedgerId;
                            bankObj.SubLedgerId = itm.SubLedgerId == 0 ? null : itm.SubLedgerId;
                            bankObj.TransactionItemId = itm.TransactionItemId;
                            _accountingDbContext.BankReconciliationModel.Add(bankObj);
                        });

                        _accountingDbContext.SaveChanges();

                        if (extraTxns != null)
                        {
                            var journalVoucher = _accountingDbContext.Vouchers.Where(a => a.VoucherCode == ENUM_ACC_VoucherCode.JournalVoucher && a.HospitalId==currentHospitalId).FirstOrDefault();
                            var fiscalyearId = AccountingTransferData.GetFiscalYearIdByDate(_accountingDbContext, txnClient[0].BankTransactionDate, currentHospitalId);
                            CostCenterModel costCenter = _accountingDbContext.CostCenters.Where(cc => cc.CostCenterName == ENUM_ACC_DefaultCostCenterName.Hospital && cc.HospitalId == currentHospitalId).FirstOrDefault();
                            var isGroupbyData = _accountingDbContext.CFGParameters.Where(a => a.ParameterGroupName == "Accounting" && a.ParameterName == "IsAllowGroupby").FirstOrDefault().ParameterValue;
                            var IdGroupBy = (isGroupbyData != "") ? Convert.ToBoolean(isGroupbyData) : true;

                            var subLedgerParam = _accountingDbContext.CFGParameters.Where(a => a.ParameterGroupName == "Accounting" && a.ParameterName == "SubLedgerAndCostCenter").FirstOrDefault().ParameterValue;
                            var parmValue = DanpheJSONConvert.DeserializeObject<SubLedgerAndCostCenterConfig_DTO>(subLedgerParam);
                            List<TransactionModel> transactions = new List<TransactionModel>();
                            extraTxns.ForEach(txn =>
                            {
                                var voucherNumber = AccountingBL.GetVoucherNumber(_accountingDbContext, journalVoucher.VoucherId, 4, currentHospitalId, fiscalyearId);
                                var TuId = AccountingBL.GetTUID(_accountingDbContext, currentHospitalId);

                                var accTxn = new TransactionModel
                                {
                                    VoucherId = journalVoucher.VoucherId,
                                    TransactionDate = DateTime.Now.Date,
                                    FiscalyearId = fiscalyearId,
                                    CreatedOn = DateTime.Now,
                                    CreatedBy = currentUser.EmployeeId,
                                    IsActive = true,
                                    Remarks = "Journal Voucher Entry For Bank Reconciliation Category",
                                    SectionId = 4,
                                    VoucherNumber = voucherNumber,
                                    //CostCenterId = costCenter != null ? costCenter.CostCenterId : 1,
                                    IsBackDateEntry = false,
                                    TransactionType = ENUM_ACC_TransactionType.ManualEntry,
                                    TUId = TuId,
                                    IsCustomVoucher = false,
                                    IsAllowReverseVoucher = false,
                                    IsEditable = false,
                                    IsGroupTxn = (IdGroupBy) ? IdGroupBy : false,
                                    ModifiedBy = 0,
                                    ModifiedOn = null,
                                    HospitalId = currentHospitalId,
                                    IsReverseVoucher = true,
                                    IsReverseTxnAllow = false,
                                    IsVerified = true,
                                    VerifiedBy = currentUser.EmployeeId,
                                    VerifiedOn = System.DateTime.Now,
                                    VerificationRemarks = "This voucher is auto verified during bank reconciliation."
                                };
                                var defaultCostCenter = _accountingDbContext.CostCenters.Where(a => a.IsDefault == true && a.HospitalId == currentHospitalId).FirstOrDefault();
                                List<TransactionItemModel> txnItems = new List<TransactionItemModel>();
                                var txnItm = new TransactionItemModel
                                {
                                    LedgerId = txn.LedgerId,
                                    DrCr = txn.DrCr,
                                    Amount = txn.Amount,
                                    CreatedOn = DateTime.Now,
                                    CreatedBy = currentUser.EmployeeId,
                                    IsActive = true,
                                    HospitalId = currentHospitalId,
                                    Description = txn.Description,
                                    CostCenterId = defaultCostCenter != null ? defaultCostCenter.CostCenterId : 1
                                };
                                if (parmValue.EnableSubLedger)
                                {
                                    //var subLedger = _accountingDbContext.SubLedger.Where(a => a.LedgerId == (int)txn.MappedLedgerId && a.IsDefault == true).FirstOrDefault();
                                    var subLedTxns = new List<SubLedgerTransactionModel>();
                                    var subLedgerTxn = new SubLedgerTransactionModel
                                    {
                                        LedgerId = txn.LedgerId,
                                        SubLedgerId = (int)txn.SubLedgerId,
                                        DrAmount = txn.DrCr ? txn.Amount : 0,
                                        CrAmount = txn.DrCr ? 0 : txn.Amount,
                                        HospitalId = currentHospitalId,
                                        CreatedBy = currentUser.EmployeeId,
                                        CreatedOn = DateTime.Now,
                                        CostCenterId = defaultCostCenter != null ? defaultCostCenter.CostCenterId : 1,
                                        VoucherDate = DateTime.Now.Date,
                                        VoucherNo = voucherNumber,
                                        VoucherType = journalVoucher.VoucherId,
                                        IsActive = true,
                                        IsVerified = true,
                                        FiscalYearId = fiscalyearId
                                    };
                                    subLedTxns.Add(subLedgerTxn);
                                    txnItm.SubLedgers = subLedTxns;
                                }
                                var txnItm2 = new TransactionItemModel
                                {
                                    LedgerId = txnClient[0].LedgerId,
                                    DrCr = !txn.DrCr,
                                    Amount = txn.Amount,
                                    CreatedOn = DateTime.Now,
                                    CreatedBy = currentUser.EmployeeId,
                                    IsActive = true,
                                    HospitalId = currentHospitalId,
                                    Description = txn.Description,
                                    CostCenterId = defaultCostCenter != null ? defaultCostCenter.CostCenterId : 1
                                };
                                if (parmValue.EnableSubLedger)
                                {
                                    var subLedTxns2 = new List<SubLedgerTransactionModel>();
                                    var subLedgerTxn2 = new SubLedgerTransactionModel
                                    {
                                        LedgerId = txnItm2.LedgerId,
                                        SubLedgerId = (int)txnClient[0].SubLedgerId,
                                        DrAmount = txn.DrCr ? 0 : txn.Amount,
                                        CrAmount = txn.DrCr ? txn.Amount : 0,
                                        HospitalId = currentHospitalId,
                                        CreatedBy = currentUser.EmployeeId,
                                        CreatedOn = DateTime.Now,
                                        CostCenterId = defaultCostCenter != null ? defaultCostCenter.CostCenterId : 1,
                                        VoucherDate = DateTime.Now.Date,
                                        VoucherNo = voucherNumber,
                                        VoucherType = journalVoucher.VoucherId,
                                        IsActive = true,
                                        IsVerified = true,
                                        FiscalYearId = fiscalyearId
                                    };
                                    subLedTxns2.Add(subLedgerTxn2);
                                    txnItm2.SubLedgers = subLedTxns2;
                                }
                                txnItems.Add(txnItm);
                                txnItems.Add(txnItm2);
                                accTxn.TransactionItems = txnItems;
                                _accountingDbContext.Transactions.Add(accTxn);
                                _accountingDbContext.SaveChanges();
                                transactions.Add(accTxn);
                            });

                            transactions.ForEach(bankRec =>
                            {
                                var bankObj = new BankReconciliationModel();
                                bankObj.BankTransactionDate = txnClient[0].BankTransactionDate;
                                bankObj.TransactionDate = bankRec.TransactionDate;
                                bankObj.VerifiedBy = currentUser.EmployeeId;
                                bankObj.IsVerified = true;
                                bankObj.VerifiedOn = DateTime.Now;
                                bankObj.VoucherNumber = bankRec.VoucherNumber;
                                bankObj.SectionId = bankRec.SectionId;
                                bankObj.Remark = bankRec.Remarks;
                                bankObj.CategoryId = null;
                                bankObj.FiscalyearId = bankRec.FiscalyearId;
                                bankObj.BankBalance = bankRec.TransactionItems[0].Amount;
                                bankObj.TransactionId = bankRec.TransactionId;
                                bankObj.LedgerId = bankRec.TransactionItems[1].LedgerId;
                                bankObj.HospitalId = currentHospitalId;
                                bankObj.CreatedOn = DateTime.Now;
                                bankObj.CreatedBy = currentUser.EmployeeId;
                                bankObj.DrCr = bankRec.TransactionItems[0].DrCr;
                                bankObj.BankRefNumber = null;
                                bankObj.VoucherTypeId = bankRec.VoucherId;
                                bankObj.PartyLedgerId = bankRec.TransactionItems[0].LedgerId;
                                bankObj.SubLedgerId = txnClient[0].SubLedgerId == 0 ? null : txnClient[0].SubLedgerId;
                                bankObj.TransactionItemId = bankRec.TransactionItems[1].TransactionItemId;
                                if(bankRec.TransactionItems[0].SubLedgers != null)
                                {
                                    bankObj.PartySubLedgerId = bankRec.TransactionItems[0].SubLedgers[0].SubLedgerId;
                                }
                                else
                                {
                                    bankObj.PartySubLedgerId = null;
                                }
                                _accountingDbContext.BankReconciliationModel.Add(bankObj);
                            });
                            _accountingDbContext.SaveChanges();
                        }
                        dbTransaction.Commit();
                        responseData.Results = "";
                        responseData.Status = ENUM_DanpheHttpResponseText.OK;
                    }
                    else
                    {
                        responseData.Status = ENUM_DanpheHttpResponseText.Failed;
                    }
                }
                catch (Exception ex)
                {
                    dbTransaction.Rollback();
                    responseData.Status = ENUM_DanpheHttpResponseText.Failed;
                    responseData.ErrorMessage = ex.Message + " exception details:" + ex.ToString();

                }
            }

            return DanpheJSONConvert.SerializeObject(responseData, true);
        }



        // PUT api/values/5
        [HttpPut]
        public string Update(/*string reqType*/)
        {

            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();

            AccountingDbContext accountingDBContext = new AccountingDbContext(connString);


            try
            {
                //string str = Request.Form.Keys.First<string>();
                string str = this.ReadPostData();
                string reqType = this.ReadQueryStringData("reqType");
                RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");

            }
            catch (Exception ex)
            {
                responseData.Status = "Failed";
                responseData.ErrorMessage = ex.Message + " exception details:" + ex.ToString();
            }
            return DanpheJSONConvert.SerializeObject(responseData, true);
        }

        // DELETE api/values/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }

        private object GetVoucherReport(DateTime FromDate, DateTime ToDate, int sectionId, int hospitalId)
        {

            //int currentHospitalId = HttpContext.Session.Get<int>("AccSelectedHospitalId");
            int currentHospitalId = hospitalId;
            var SectionList = AccountingBL.GetSections(_accountingDbContext, currentHospitalId);
            var OpeningBalanceData = (from t in _accountingDbContext.Transactions
                                      where t.HospitalId == currentHospitalId
                                      join ti in _accountingDbContext.TransactionItems on t.TransactionId equals ti.TransactionId
                                      join fisc in _accountingDbContext.FiscalYears on t.FiscalyearId equals fisc.FiscalYearId
                                      join map in _accountingDbContext.MapFiscalYears on fisc.FiscalYearId equals map.FiscalYearId
                                      where
                                      ti.HospitalId == currentHospitalId  && map.HospitalId == hospitalId && 
                                      (DbFunctions.TruncateTime(t.TransactionDate) == FromDate) && (t.FiscalyearId == fisc.FiscalYearId)
                                      && t.IsVerified == true
                                      group new { fisc, ti, t } by new
                                      {
                                          fisc.FiscalYearId,
                                          t.TransactionDate,
                                      } into x
                                      select new
                                      {
                                          Amountdr = x.Where(b => b.ti.DrCr == true && (DbFunctions.TruncateTime(b.t.TransactionDate) >= b.fisc.StartDate && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate)).Select(a => (int?)a.ti.Amount).DefaultIfEmpty(0).Sum(),
                                          Amountcr = x.Where(b => b.ti.DrCr == false && (DbFunctions.TruncateTime(b.t.TransactionDate) >= b.fisc.StartDate && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate)).Select(a => (int?)a.ti.Amount).DefaultIfEmpty(0).Sum(),
                                          x.Key.FiscalYearId,
                                      }).ToList();

            var txnList = (from txn in _accountingDbContext.Transactions
                           where txn.HospitalId == currentHospitalId
                           join voucher in _accountingDbContext.Vouchers on txn.VoucherId equals voucher.VoucherId
                           join fiscal in _accountingDbContext.FiscalYears on txn.FiscalyearId equals fiscal.FiscalYearId
                           join map in _accountingDbContext.MapFiscalYears on fiscal.FiscalYearId equals map.FiscalYearId
                           where
                          voucher.HospitalId==currentHospitalId && map.HospitalId == hospitalId &&
                           txn.IsActive == true && (DbFunctions.TruncateTime(txn.TransactionDate) >= FromDate && DbFunctions.TruncateTime(txn.TransactionDate) <= ToDate)
                            && txn.SectionId == sectionId && txn.IsVerified == true
                           select new
                           {
                               TransactionId = txn.TransactionId,
                               FiscalYear = fiscal.FiscalYearName,
                               VoucherNumber = txn.VoucherNumber,
                               VoucherType = voucher.VoucherName,
                               SectionId = txn.SectionId,
                               TransactionDate = DbFunctions.TruncateTime(txn.TransactionDate),// txn.TransactionDate.ToString("dd/mm/yyyy"),                                       
                               Amount = (from txnItm in _accountingDbContext.TransactionItems
                                         where txnItm.TransactionId == txn.TransactionId && txnItm.HospitalId == currentHospitalId
                                         && txnItm.DrCr == true
                                         group txnItm by new
                                         {
                                             txnItm.DrCr
                                         } into g
                                         select g.Sum(x => x.Amount)
                                         ).FirstOrDefault(),
                               Narration = txn.Remarks
                           }).OrderByDescending(a => a.TransactionId).ToList();
            //below query as per new requirement if wants old one result then please comment below and take txnList as result
            var finalData = (from t in txnList
                             group new { t } by new
                             {
                                 t.VoucherNumber,
                                 t.FiscalYear,
                                 t.VoucherType,
                                 t.TransactionDate,
                                 t.SectionId,
                                 t.Narration,
                             }
                            into x
                             select new
                             {
                                 FiscalYear = x.Key.FiscalYear,
                                 VoucherNumber = x.Key.VoucherNumber,
                                 VoucherType = x.Key.VoucherType,
                                 TransactionDate = x.Key.TransactionDate,
                                 Amount = x.Sum(y => y.t.Amount),
                                 SectionId = x.Key.SectionId,
                                 SectionName = SectionList.Where(s => s.SectionId == x.Key.SectionId).Select(a => a.SectionName).FirstOrDefault(),
                                 Narration = x.Key.Narration
                             }).OrderByDescending(a => a.TransactionDate).ToList();
            return finalData;

        }
        private object GetLedgerReport(int ledgerId, DateTime FromDate, DateTime ToDate, int FiscalYearId, int HospitalId)
        {


            //int currentHospitalId = HttpContext.Session.Get<int>("AccSelectedHospitalId");
            int currentHospitalId = HospitalId;
            var showTxnItemLevelPar = (from p in _accountingDbContext.CFGParameters
                                       where p.ParameterGroupName.ToLower() == "accounting" && p.ParameterName == "ShowLedgerReportTxnItemLevel"
                                       select p).FirstOrDefault();
            var showTxnItemLevel = (showTxnItemLevelPar != null) ? Convert.ToBoolean(showTxnItemLevelPar.ParameterValue) : true;
            var fYearId = AccountingTransferData.GetFiscalYearIdForOpeningBalance(_accountingDbContext, FiscalYearId, currentHospitalId);
            var led = (from l in _accountingDbContext.Ledgers
                       join lbh in _accountingDbContext.LedgerBalanceHistory on l.LedgerId equals lbh.LedgerId
                       where lbh.LedgerId == ledgerId
                       && lbh.HospitalId == currentHospitalId && lbh.FiscalYearId == fYearId
                       select new
                       {
                           lbh.OpeningBalance,
                           DrCr = lbh.OpeningDrCr == null ? true : lbh.OpeningDrCr,
                           lbh.LedgerId,
                           l.LedgerName
                       }).FirstOrDefault();

            var LedgerData = (from t in _accountingDbContext.Transactions
                              join ti in _accountingDbContext.TransactionItems on t.TransactionId equals ti.TransactionId
                              join l in _accountingDbContext.Ledgers on ti.LedgerId equals l.LedgerId
                              join v in _accountingDbContext.Vouchers on t.VoucherId equals v.VoucherId
                              where
                              ti.HospitalId == currentHospitalId
                              && l.HospitalId == currentHospitalId &&
                              (ti.LedgerId == ledgerId) && (DbFunctions.TruncateTime(t.TransactionDate) >= FromDate && DbFunctions.TruncateTime(t.TransactionDate) <= ToDate)
                              && t.IsVerified == true
                              select new
                              {
                                  t.TransactionId,
                                  t.TransactionDate,
                                  t.VoucherNumber,
                                  l.LedgerName,
                                  l.Code,
                                  OpeningBalance = led.OpeningBalance,
                                  OpeningBalanceType = led.DrCr,
                                  t.FiscalyearId,
                                  v.VoucherName,
                                  t.SectionId,
                                  ti.Amount,
                                  ti.DrCr,
                                  Description = (t.SectionId == 4) ? ti.Description : "",//get description only for manual voucher entry, 4 Id for Manual section
                              }).ToList();

            List<DataListDTOModel> dataList = new List<DataListDTOModel>();


            var openingBalanceFiscalYear = (from f in _accountingDbContext.FiscalYears
                                            join map in _accountingDbContext.MapFiscalYears
                                            on f.FiscalYearId equals map.FiscalYearId
                                            where map.FiscalYearId == fYearId && map.HospitalId == HospitalId
                                            select f).FirstOrDefault();
            var dataList1 = (from t in _accountingDbContext.Transactions
                             join ti in _accountingDbContext.TransactionItems on t.TransactionId equals ti.TransactionId
                             join l in _accountingDbContext.Ledgers on ti.LedgerId equals l.LedgerId
                             where
                             ti.HospitalId == currentHospitalId
                             && l.HospitalId == currentHospitalId &&
                             (ti.LedgerId == ledgerId) && (DbFunctions.TruncateTime(t.TransactionDate) >= DbFunctions.TruncateTime(openingBalanceFiscalYear.StartDate) && DbFunctions.TruncateTime(t.TransactionDate) <= ToDate)
                             && t.IsVerified == true
                             group new { t, ti, l } by new
                             {
                                 l.LedgerId,
                             }
                            into x
                             select new
                             {
                                 FiscalYearId = fYearId,
                                 AmountDr = x.Where(b => b.ti.DrCr == true && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate).Select(a => a.ti.Amount).DefaultIfEmpty(0).Sum() + ((LedgerData.Count == 0 && led.LedgerId > 0 && led.DrCr == true) ? led.OpeningBalance : 0),
                                 AmountCr = x.Where(b => b.ti.DrCr == false && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate).Select(a => a.ti.Amount).DefaultIfEmpty(0).Sum() + ((LedgerData.Count == 0 && led.LedgerId > 0 && led.DrCr == false) ? led.OpeningBalance : 0),
                             }).ToList();

            if (LedgerData.Count == 0 && dataList1.Count == 0)
            {
                var dToday = DateTime.Now.Date;
                var fYId = AccountingTransferData.GetFiscalYearIdByDate(_accountingDbContext, dToday, currentHospitalId);
                dataList.Add(new DataListDTOModel
                {
                    FiscalYearId = fYId,
                    AmountDr = ((led.DrCr == true) ? led.OpeningBalance : 0),
                    AmountCr = ((led.DrCr == false) ? led.OpeningBalance : 0)
                });

            }
            else if (dataList1.Count > 0)
            {
                dataList1.ForEach(ss =>
                {
                    dataList.Add(
                        new DataListDTOModel
                        {
                            FiscalYearId = dataList1[0].FiscalYearId,
                            AmountDr = (LedgerData.Count == 0 && led.DrCr == true) ? dataList1[0].AmountDr : dataList1[0].AmountDr,
                            AmountCr = (LedgerData.Count == 0 && led.DrCr == false) ? dataList1[0].AmountCr : dataList1[0].AmountCr
                        });
                });

            }
            var result = (from itm in LedgerData
                          select new
                          {
                              itm.TransactionId,
                              itm.TransactionDate,
                              itm.VoucherNumber,
                              itm.LedgerName,
                              itm.Code,
                              itm.VoucherName,
                              LedgerDr = (itm.DrCr == true) ? itm.Amount : 0,
                              LedgerCr = (itm.DrCr == false) ? itm.Amount : 0,
                              itm.Amount,
                              itm.DrCr,
                              dataList[0].AmountCr,
                              dataList[0].AmountDr,
                              Balance = 0,
                              BalanceType = true,
                              itm.OpeningBalance,
                              itm.OpeningBalanceType,
                              DepartmentName = "TempTest",
                              itm.Description,
                              TransactionItems = (showTxnItemLevel == true) ? null :
                                                                                (from txnItm in _accountingDbContext.TransactionItems
                                                                                 where txnItm.HospitalId == currentHospitalId
                                                                                 join ledger in _accountingDbContext.Ledgers on txnItm.LedgerId equals ledger.LedgerId
                                                                                 join txn in _accountingDbContext.Transactions on txnItm.TransactionId equals itm.TransactionId
                                                                                 join v in _accountingDbContext.Vouchers on txn.VoucherId equals v.VoucherId
                                                                                 where
                                                                                 ledger.HospitalId == currentHospitalId &&
                                                                                 txnItm.TransactionId == txn.TransactionId && txn.IsActive == true && v.VoucherName == itm.VoucherName
                                                                                 && (DbFunctions.TruncateTime(txn.TransactionDate) >= FromDate && DbFunctions.TruncateTime(txn.TransactionDate) <= ToDate)
                                                                                 && ledger.LedgerName != itm.LedgerName && txn.TransactionDate == itm.TransactionDate
                                                                                 select new
                                                                                 {
                                                                                     txnItm.TransactionItemId,
                                                                                     LedgerName = ledger.LedgerName,
                                                                                     Code = ledger.Code,
                                                                                     DrCr = txnItm.DrCr,
                                                                                     LedAmount = txnItm.Amount,
                                                                                     Description = (txn.SectionId == 4) ? txnItm.Description : "",//get description only for manual voucher entry, 4 Id for Manual section
                                                                                     Details = (from txnitm in _accountingDbContext.TransactionItems
                                                                                                where txnitm.HospitalId == currentHospitalId
                                                                                                join txndetail in _accountingDbContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
                                                                                                join pat in _accountingDbContext.PatientModel on txndetail.ReferenceId equals pat.PatientId
                                                                                                where txnItm.TransactionItemId == txnitm.TransactionItemId && txn.VoucherNumber == itm.VoucherNumber && txndetail.ReferenceType == "Patient"
                                                                                                group new { txnitm, pat, txndetail } by new
                                                                                                {
                                                                                                    txndetail.ReferenceId,
                                                                                                    txnitm.DrCr
                                                                                                } into x1
                                                                                                select new
                                                                                                {
                                                                                                    Id = x1.Key.ReferenceId,
                                                                                                    Name = x1.Select(a => a.pat.FirstName + a.pat.LastName).FirstOrDefault(),
                                                                                                    DrCr = x1.Key.DrCr,
                                                                                                    Amount = x1.Select(a => a.txndetail.Amount).Sum(),
                                                                                                }).ToList(),
                                                                                     CapitalsGoods = (from txnitm in _accountingDbContext.TransactionItems
                                                                                                      where txnitm.HospitalId == currentHospitalId
                                                                                                      join txndetail in _accountingDbContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
                                                                                                      join pat in _accountingDbContext.InventoryItems on txndetail.ReferenceId equals pat.ItemId
                                                                                                      where txnItm.TransactionItemId == txnitm.TransactionItemId && txn.VoucherNumber == itm.VoucherNumber && txndetail.ReferenceType == "Capital Goods Items"
                                                                                                      group new { txnitm, pat, txndetail } by new
                                                                                                      {
                                                                                                          txndetail.ReferenceId,
                                                                                                          txnitm.DrCr
                                                                                                      } into x1
                                                                                                      select new
                                                                                                      {
                                                                                                          Id = x1.Key.ReferenceId,
                                                                                                          Name = x1.Select(a => a.pat.ItemName).FirstOrDefault(),
                                                                                                          DrCr = x1.Key.DrCr,
                                                                                                          Amount = x1.Select(a => a.txndetail.Amount).Sum(),
                                                                                                      }).ToList(),
                                                                                 }).OrderByDescending(a => a.DrCr == true).ToList(),
                          }).ToList();
            result.ForEach(itm =>
            {
                if (itm.TransactionItems != null)
                {
                    itm.TransactionItems.ForEach(txn =>
                    {
                        foreach (var det in txn.CapitalsGoods)
                        {
                            txn.Details.Add(det);
                        }
                    });
                }

            });
            var FinalData = new
            {
                result,
                dataList
            };
            return FinalData;


        }

        private object GetTrailBalanceReport(DateTime FromDate, DateTime ToDate, int FiscalYearId, int HospitalId)
        {
            //int currentHospitalId = HttpContext.Session.Get<int>("AccSelectedHospitalId");
            int currentHospitalId = HospitalId;
            List <SqlParameter> paramList = new List<SqlParameter>()
                                {
                                        new SqlParameter("@FromDate", FromDate),
                                        new SqlParameter("@ToDate", ToDate),
                                        new SqlParameter("@HospitalId", currentHospitalId),
                                         new SqlParameter("@OpeningFiscalYearId", AccountingTransferData.GetFiscalYearIdForOpeningBalance(_accountingDbContext,FiscalYearId,currentHospitalId))
                                };
            var spDataTable = DALFunctions.GetDataTableFromStoredProc("SP_ACC_RPT_GetTrialBalanceData", paramList, _accountingDbContext);
            var resultStr = JsonConvert.SerializeObject(spDataTable, new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
            var TransactionWithItems = JsonConvert.DeserializeObject<List<dynamic>>(resultStr);

            var trialBalance = (from txnwithitms in TransactionWithItems
                                group new { txnwithitms } by new { txnwithitms.COA }
                                into x
                                select new
                                {
                                    //Level COA
                                    Particulars = x.Key.COA,
                                    LedgerGroupList = (
                                                       from txnwithitms in TransactionWithItems
                                                       where txnwithitms.COA == x.Key.COA
                                                       group new { txnwithitms } by new
                                                       { txnwithitms.LedgerGroupName }
                                                        into x1
                                                       select new
                                                       {
                                                           //Level LedgerGroup
                                                           Particulars = x1.Key.LedgerGroupName,
                                                           LedgerList = (from
                                                                        txnwithitms in TransactionWithItems
                                                                         where txnwithitms.COA == x.Key.COA && txnwithitms.LedgerGroupName == x1.Key.LedgerGroupName

                                                                         select new
                                                                         {

                                                                             LedgerId = txnwithitms.LedgerId,
                                                                             Particulars = txnwithitms.LedgerName,
                                                                             Code = txnwithitms.Code,
                                                                             OpeningDr = txnwithitms.OpeningDr,
                                                                             OpeningCr = txnwithitms.OpeningCr,
                                                                             OpeningBalDr = txnwithitms.OpeningBalDr,
                                                                             OpeningBalCr = txnwithitms.OpeningBalCr,
                                                                             CurrentDr = txnwithitms.CurrentDr,
                                                                             CurrentCr = txnwithitms.CurrentCr,
                                                                             Details = "",
                                                                             InventoryItems = "",

                                                                         }).ToList()
                                                       }).ToList()
                                }).ToList();



            trialBalance.ForEach(itm =>
            {
                itm.LedgerGroupList.ForEach(txn =>
                {
                    txn.LedgerList.ForEach(ledgr =>
                    {

                    });
                });
            });
            return trialBalance;


        }
        private object GetGroupStatementReport(DateTime FromDate, DateTime ToDate, int FiscalYearId, int LedgerGroupId, int HospitalId)
        {


            int currentHospitalId = HospitalId;//HttpContext.Session.Get<int>(ENUM_SessionValues.CurrentHospitalId);
            List<SqlParameter> paramList = new List<SqlParameter>()
                                {
                                        new SqlParameter("@FromDate", FromDate),
                                        new SqlParameter("@ToDate", ToDate),
                                        new SqlParameter("@HospitalId", currentHospitalId),
                                        new SqlParameter("@OpeningFiscalYearId", AccountingTransferData.GetFiscalYearIdForOpeningBalance(_accountingDbContext,FiscalYearId,currentHospitalId)),
                                        new SqlParameter("@LedgerGroupId", LedgerGroupId)
                                };
            var spDataTable = DALFunctions.GetDataTableFromStoredProc("SP_ACC_RPT_GetGroupStatementData", paramList, _accountingDbContext);
            var resultStr = JsonConvert.SerializeObject(spDataTable, new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
            var reportDataList = JsonConvert.DeserializeObject<List<dynamic>>(resultStr);

            var groupStatementReport = (from row in reportDataList
                                        select new
                                        {
                                            Particular = row.Particular,
                                            LedgerId = row.LedgerId,
                                            Code = row.Code,
                                            OpeningDr = row.OpeningDr,
                                            OpeningCr = row.OpeningCr,
                                            TransactionDr = row.TransactionDr,
                                            TransactionCr = row.TransactionCr,
                                            OpeningTotal = (row.OpeningDr > row.OpeningCr || row.OpeningCr == row.OpeningDr) ? (row.OpeningDr - row.OpeningCr) : (row.OpeningCr - row.OpeningDr),
                                            OpeningType = (row.OpeningDr > row.OpeningCr || row.OpeningCr == row.OpeningDr) ? "Dr" : "Cr",
                                            ClosingDr = row.ClosingDr,
                                            ClosingCr = row.ClosingCr,
                                            ClosingTotal = (row.ClosingDr > row.ClosingCr || row.ClosingDr == row.ClosingCr) ? (row.ClosingDr - row.ClosingCr) : (row.ClosingCr - row.ClosingDr),
                                            ClosingType = (row.ClosingDr > row.ClosingCr || row.ClosingDr == row.ClosingCr) ? "Dr" : "Cr",

                                        }).ToList();


            return groupStatementReport;



        }

        private object GetProfitLossReport(DateTime FromDate, DateTime ToDate, int FiscalYearId, int HospitalId)
        {


            //  if (reqType == "profitLossReport")

            //profit and loss report only consider for Revenue and Expense type ledgers
            //No need to consider opening balance
            //int currentHospitalId = HttpContext.Session.Get<int>("AccSelectedHospitalId");
            int currentHospitalId = HospitalId;
            List<SqlParameter> paramList = new List<SqlParameter>()
                                {
                                        new SqlParameter("@FromDate", FromDate),
                                        new SqlParameter("@ToDate", ToDate),
                                        new SqlParameter("@HospitalId", currentHospitalId)
                                };
            var spDataTable = DALFunctions.GetDataTableFromStoredProc("SP_ACC_RPT_GetProfitAndLossData", paramList, _accountingDbContext);
            var resultStr = JsonConvert.SerializeObject(spDataTable, new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
            var txnPnLData = JsonConvert.DeserializeObject<List<dynamic>>(resultStr);


            var result = (from l in txnPnLData

                          group l by new { l.PrimaryGroup } into x
                          select new
                          {
                              x.Key.PrimaryGroup,
                              COAList = (from l in txnPnLData

                                         where l.PrimaryGroup == x.Key.PrimaryGroup && l.COA != "Inventory"
                                         group l by new
                                         {
                                             l.PrimaryGroup,
                                             l.COA
                                         } into x2
                                         select new
                                         {
                                             x2.Key.COA,
                                             LedgerGroupList = (from l in txnPnLData

                                                                where l.COA == x2.Key.COA && l.PrimaryGroup == x.Key.PrimaryGroup
                                                                group l by new
                                                                {
                                                                    l.PrimaryGroup,
                                                                    l.COA,
                                                                    l.LedgerGroupName,
                                                                } into x3
                                                                select new
                                                                {
                                                                    x3.Key.LedgerGroupName,
                                                                    LedgerList = (from l in txnPnLData

                                                                                  where l.COA == x2.Key.COA && l.PrimaryGroup == x.Key.PrimaryGroup && l.LedgerGroupName == x3.Key.LedgerGroupName

                                                                                  select new
                                                                                  {
                                                                                      l.LedgerId,
                                                                                      l.LedgerName,
                                                                                      l.Code,
                                                                                      DrAmount = l.DRAmount,
                                                                                      CrAmount = l.CRAmount,
                                                                                  }).ToList()
                                                                }).ToList()
                                         }).ToList()
                          }).ToList();

            return result;

        }

        private object GetBalanceSheet(DateTime selectedDate, int FiscalYearId, int HospitalId)
        {

            //else if (reqType == "balanceSheetReportData")
            //{
            //NageshBB - 03 Jul 2020
            //Balance sheet will send FiscalYear Id and toDate only                   
            //int currentHospitalId = HttpContext.Session.Get<int>("AccSelectedHospitalId");
            int currentHospitalId = HospitalId;
            List<SqlParameter> paramList = new List<SqlParameter>()
                                {  new SqlParameter("@ToDate", selectedDate),
                                    new SqlParameter("@HospitalId", currentHospitalId),
                                    new SqlParameter("@FiscalYearId", AccountingTransferData.GetFiscalYearIdForOpeningBalance(_accountingDbContext,FiscalYearId,currentHospitalId)) };

            var spDataset = DALFunctions.GetDatasetFromStoredProc("SP_ACC_RPT_GetBalanceSheetData", paramList, _accountingDbContext);

            var balanceSheetStr = JsonConvert.SerializeObject(spDataset.Tables[0], new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
            var TransactionWithItems = JsonConvert.DeserializeObject<List<dynamic>>(balanceSheetStr);
            var netProfit = spDataset.Tables[1].Rows[0][0];

            var result = (from l in TransactionWithItems
                          group l by new { l.PrimaryGroup } into x
                          select new
                          {
                              x.Key.PrimaryGroup,
                              COAList = (from l in TransactionWithItems
                                         where l.PrimaryGroup == x.Key.PrimaryGroup
                                         group l by new
                                         {
                                             l.PrimaryGroup,
                                             l.COA
                                         } into x2
                                         select new
                                         {
                                             x2.Key.COA,
                                             LedgerGroupList = (from l in TransactionWithItems
                                                                where l.COA == x2.Key.COA && l.PrimaryGroup == x.Key.PrimaryGroup
                                                                group l by new
                                                                {
                                                                    l.PrimaryGroup,
                                                                    l.COA,
                                                                    l.LedgerGroupName,
                                                                } into x3
                                                                select new
                                                                {
                                                                    x3.Key.LedgerGroupName,
                                                                    LedgerList = (from l in TransactionWithItems
                                                                                  where l.COA == x2.Key.COA && l.PrimaryGroup == x.Key.PrimaryGroup && x3.Key.LedgerGroupName == l.LedgerGroupName
                                                                                  select new
                                                                                  {
                                                                                      l.LedgerId,
                                                                                      l.PrimaryGroup,
                                                                                      l.LedgerName,
                                                                                      l.Code,
                                                                                      l.OpeningBalanceDr,
                                                                                      l.OpeningBalanceCr,
                                                                                      l.DRAmount,//= x4.Where(a => a.l.TxnItmDrCr == true && a.l.Amount !=null).Select(a => a.l.Amount).Sum(),
                                                                                      l.CRAmount, //= x4.Where(a => a.l.TxnItmDrCr == false && a.l.Amount != null).Select(a => a.l.Amount).Sum(),
                                                                                      Details = "",
                                                                                      InventoryItems = ""
                                                                                  }).ToList()
                                                                }).ToList()
                                         }).ToList()
                          }).ToList();

            var FinalData = new
            {
                result,
                netProfit
            };
            return FinalData;


        }

        private object GetTransactionOriginDetail(string transactionIds)
        {


            //else if (reqType == "txn-Origin-details")
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            int currentHospitalId = HttpContext.Session.Get<int>(ENUM_SessionValues.CurrentHospitalId);
            List<int> referanceIdList = new List<int>();
            List<int> transactionIdList = transactionIds.Split(',').Select(int.Parse).ToList();


            (from txnId in transactionIdList
             join txnLinks in _accountingDbContext.TransactionLinks on txnId equals txnLinks.TransactionId
             select new
             {
                 idList = txnLinks.ReferenceId.Split(',').Select(int.Parse).ToList(),
                 txnid = txnLinks.TransactionId
             }).ToList().ForEach(a =>
             {
                 a.idList.ForEach(newid => referanceIdList.Add((int)newid));
             });

            var txnModel = (from txn in _accountingDbContext.Transactions
                            where txn.HospitalId == currentHospitalId
                            join Ids in transactionIdList on txn.TransactionId equals Ids
                            join txnlink in _accountingDbContext.TransactionLinks on txn.TransactionId equals txnlink.TransactionId
                            select new
                            {
                                TransactionId = txn.TransactionId,
                                TransactionType = txn.TransactionType,
                                SectionId = txn.SectionId,
                                Remarks = txn.Remarks,
                                referIds = txnlink.ReferenceId.ToString(),
                                VocuherNumber = txn.VoucherNumber
                            }).ToList();

            if (txnModel.Count > 0)
            {
                /* * Start Inventory Section */
                if (txnModel.Where(a => a.SectionId == 1).ToList().Count > 0)
                {
                    if (txnModel.Where(a => a.TransactionType.Contains("GoodReceipt")).ToList().Count > 0)
                    {
                        var goodsReceipt = (from gr in _inventoryDbContext.GoodsReceipts.AsEnumerable()

                                            join vendor in _inventoryDbContext.Vendors on gr.VendorId equals vendor.VendorId
                                            join gritm in _inventoryDbContext.GoodsReceiptItems.AsEnumerable() on gr.GoodsReceiptID equals gritm.GoodsReceiptId
                                            join id in referanceIdList on gritm.GoodsReceiptItemId equals id
                                            join itm in _inventoryDbContext.Items on gritm.ItemId equals itm.ItemId
                                            select new
                                            {
                                                itm = new
                                                {
                                                    gr.PaymentMode,
                                                    gritm.TotalAmount,
                                                    VAT = gr.VATTotal,
                                                    gritm.SubTotal,
                                                    gritm.DiscountAmount,
                                                    gr.BillNo
                                                },
                                                vendor.VendorName,
                                                TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault(),
                                                ItemName = itm.ItemName,
                                            }).ToList();
                        responseData.Results = goodsReceipt;
                    }
                    else if (txnModel.Where(a => a.TransactionType.Contains("WriteOff")).ToList().Count > 0)
                    {
                        var writeOff = (from wr in _inventoryDbContext.WriteOffItems.AsEnumerable()
                                        join id in referanceIdList on wr.WriteOffId equals id
                                        join itm in _inventoryDbContext.Items on wr.ItemId equals itm.ItemId
                                        select new
                                        {
                                            itm = new
                                            {
                                                BatchNo = wr.BatchNO,
                                                TotalAmount = wr.TotalAmount
                                            },
                                            itm.ItemName,
                                            TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                                        }).ToList();
                        responseData.Results = writeOff;
                    }
                    else if (txnModel.Where(a => a.TransactionType.Contains("ReturnToVendor")).ToList().Count > 0)
                    {
                        var returnTOVendor = (from rv in _inventoryDbContext.ReturnToVendorItems.AsEnumerable()
                                              join id in referanceIdList on rv.ReturnToVendorItemId equals id
                                              join itm in _inventoryDbContext.Items on rv.ItemId equals itm.ItemId
                                              join vendor in _inventoryDbContext.Vendors on rv.VendorId equals vendor.VendorId
                                              select new
                                              {
                                                  itm = new
                                                  {
                                                      BatchNo = rv.BatchNo,
                                                      TotalAmount = rv.TotalAmount,
                                                      VAT = rv.VAT
                                                  },
                                                  itm.ItemName,
                                                  vendor.VendorName,
                                                  TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                                              }).ToList();
                        responseData.Results = returnTOVendor;
                    }
                    else if (txnModel.Where(a => a.TransactionType.Contains("DispatchToDept")).ToList().Count > 0)
                    {
                        var DispatchToDept = (from wr in _inventoryDbContext.StockTransactions.AsEnumerable()
                                              join id in referanceIdList on wr.StockTransactionId equals id
                                              join st in _inventoryDbContext.StoreStocks.Include(x => x.StockMaster) on wr.StockId equals st.StockId
                                              join itm in _inventoryDbContext.Items on st.ItemId equals itm.ItemId
                                              //EMR_LPH_MERGE: NageshBB- 18-June-2021 -commented below line for temporary build error solution
                                              ///later we need to discuss table and column with inventory team and do chagnes as per requirement
                                              //join gr in inventoryDbContext.GoodsReceiptItems on st.GoodsReceiptItemId equals gr.GoodsReceiptItemId

                                              select new
                                              {
                                                  itm = new
                                                  {
                                                      BatchNo = st.StockMaster.BatchNo,
                                                      TotalAmount = wr.CostPrice //Math.Truncate((decimal)wr.Quantity) * gr.ItemRate, //EMR_MERGE_LPH
                                                                                 //gr.VAT,//EMR_MERGE_LPH
                                                                                 //gr.DiscountAmount, //EMR_MERGE_LPH
                                                  },
                                                  itm.ItemName,
                                                  TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                                              }).ToList();
                        responseData.Results = DispatchToDept;
                    }
                    else if (txnModel.Where(a => a.TransactionType.Contains("INVDeptConsumedGoods")).ToList().Count > 0)
                    {
                        //var ConsumedGoodsItems = (from csm in inventoryDbContext.WardInventoryTransactionModel.AsEnumerable()
                        //                          join id in referanceIdList on csm.TransactionId equals id
                        //                          join itm in inventoryDbContext.Items on csm.ItemId equals itm.ItemId
                        //                          join gr in inventoryDbContext.GoodsReceiptItems on csm.GoodsReceiptItemId equals gr.GoodsReceiptItemId
                        //                          where (csm.TransactionType == "consumption-items")
                        //                          select new
                        //                          {
                        //                              itm = new
                        //                              {
                        //                                  BatchNo = gr.BatchNO,
                        //                                  TotalAmount = Math.Truncate((decimal)csm.Quantity) * csm.Price,
                        //                                  gr.VAT,
                        //                                  gr.DiscountAmount,
                        //                              },
                        //                              itm.ItemName,
                        //                              TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()


                        //                          }).ToList();
                        //responseData.Results = ConsumedGoodsItems;
                        //NageshBB: 13July2021- after lph changes we have done below change we need to verify this 
                        var ConsumedGoodsItems = (from csm in _inventoryDbContext.StockTransactions.AsEnumerable()
                                                  join id in referanceIdList on csm.StockTransactionId equals id
                                                  join stock in _inventoryDbContext.StockMasters on csm.StockId equals stock.StockId
                                                  join itm in _inventoryDbContext.Items on csm.ItemId equals itm.ItemId
                                                  join gr in _inventoryDbContext.GoodsReceiptItems on csm.StockId equals gr.StockId into grJ
                                                  from grLJ in grJ.DefaultIfEmpty()
                                                  where (csm.TransactionType == "consumption-items")
                                                  select new
                                                  {
                                                      itm = new
                                                      {
                                                          BatchNo = stock.BatchNo,
                                                          TotalAmount = Math.Truncate((decimal)csm.OutQty) * csm.CostPrice,
                                                          VAT = grLJ == null ? 0 : grLJ.VAT,
                                                          DiscountAmount = grLJ == null ? 0 : grLJ.DiscountAmount,
                                                      },
                                                      itm.ItemName,
                                                      TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()


                                                  }).ToList();
                        responseData.Results = ConsumedGoodsItems;

                    }
                    else if (txnModel.Where(a => a.TransactionType.Contains("INVStockManageOut")).ToList().Count > 0)
                    {
                        //var stkTxn1 = (from wr in inventoryDbContext.StockTransactions.AsEnumerable()
                        //               join id in referanceIdList on wr.StockTxnId equals id
                        //               join st in inventoryDbContext.Stock on wr.StockId equals st.StockId
                        //               join itm in inventoryDbContext.Items on st.ItemId equals itm.ItemId
                        //               //EMR_LPH_MERGE: NageshBB- 18-June-2021 -commented below line for temporary build error solution
                        //               ///later we need to discuss table and column with inventory team and do chagnes as per requirement
                        //               //join gr in inventoryDbContext.GoodsReceiptItems on st.GoodsReceiptItemId equals gr.GoodsReceiptItemId
                        //               select new
                        //               {
                        //                   itm = new
                        //                   {
                        //                       BatchNo = st.BatchNO,
                        //                       //TotalAmount = Math.Truncate((decimal)wr.Quantity) * gr.ItemRate, //EMR_LPH_MERGE
                        //                       //gr.VAT, //EMR_LPH_MERGE
                        //                       //gr.DiscountAmount, //EMR_LPH_MERGE
                        //                   },
                        //                   itm.ItemName,
                        //                   TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                        //               }).ToList();
                        //responseData.Results = stkTxn1;
                        var stkTxn1 = (from wr in _inventoryDbContext.StockTransactions.AsEnumerable()
                                       join id in referanceIdList on wr.StockTransactionId equals id
                                       join storestock in _inventoryDbContext.StoreStocks.Include(s => s.StockMaster) on wr.StoreStockId equals storestock.StoreStockId
                                       join st in _inventoryDbContext.StoreStocks on wr.StockId equals st.StockId
                                       join itm in _inventoryDbContext.Items on st.ItemId equals itm.ItemId
                                       join gr in _inventoryDbContext.GoodsReceiptItems on st.StockId equals gr.StockId into grJ
                                       from grLJ in grJ.DefaultIfEmpty()
                                       select new
                                       {
                                           itm = new
                                           {
                                               BatchNo = storestock.StockMaster.BatchNo,
                                               TotalAmount = Math.Truncate((decimal)storestock.AvailableQuantity) * storestock.StockMaster.CostPrice,
                                               VAT = grLJ == null ? 0 : grLJ.VAT,
                                               DiscountAmount = grLJ == null ? 0 : grLJ.DiscountAmount,
                                           },
                                           itm.ItemName,
                                           TransactionType = txnModel.Where(a => a.referIds.Contains(id.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                                       }).ToList();
                        responseData.Results = stkTxn1;
                    }
                    responseData.Status = "OK";
                }
                /* * End Inventory Section */

                /* * Start Billing Section */
                if (txnModel.Where(a => a.SectionId == 2).ToList().Count > 0)
                {
                    List<dynamic> depData = new List<dynamic>();
                    List<dynamic> BillData = new List<dynamic>();
                    List<dynamic> ReturnBillData = new List<dynamic>();

                    DataSet txnData = _accountingDbContext.DailyTransactionReportDetails(txnModel[0].VocuherNumber, currentHospitalId);

                    var deposits = txnModel.Where(c => c.TransactionType == "DepositAdd" || c.TransactionType == "DepositReturn").ToList();
                    if (deposits.Count > 0)
                    {
                        depData = DataTableToList.ToDynamic(txnData.Tables[0]);
                    }
                    var bills = txnModel.Where(c => c.TransactionType == "CashBill" || c.TransactionType == "CreditBill").ToList();
                    if (bills.Count > 0)
                    {

                        BillData = DataTableToList.ToDynamic(txnData.Tables[0]);
                    }
                    var returnBill = txnModel.Where(c => c.TransactionType == "CashBillReturn" || c.TransactionType == "CreditBillReturn").ToList();
                    if (returnBill.Count > 0)
                    {

                        ReturnBillData = DataTableToList.ToDynamic(txnData.Tables[0]);
                    }

                    var result = new
                    {
                        DepositData = (from dep in depData.AsEnumerable()
                                       select new
                                       {
                                           PatientName = dep.PatientName,
                                           ReceiptNo = dep.ReceiptNo,
                                           PaymentMode = dep.PaymentMode,
                                           TotalAmount = dep.TotalAmount
                                       }).ToList(),
                        BillData = (from itm in BillData.AsEnumerable()
                                    select new
                                    {
                                        itm,
                                        InvoiceNo = itm.InvoiceNo,
                                        PatientName = itm.PatientName
                                    }).ToList(),
                        ReturnBillData = (from itm in ReturnBillData.AsEnumerable()
                                          select new
                                          {
                                              itm,
                                              InvoiceNo = itm.InvoiceNo,
                                              PatientName = itm.PatientName
                                          }).ToList()
                    };

                    responseData.Results = result;
                    responseData.Status = "OK";

                }
                /* * End Billing Section */

                /* * Start Pharmacy Section */
                if (txnModel.Where(a => a.SectionId == 3).ToList().Count > 0)
                {
                    if (txnModel.Where(a => a.TransactionType.Contains("CashInvoice") && !a.TransactionType.Contains("CashInvoiceReturn")).ToList().Count > 0)
                    {
                        var InvoiceData = (from itm in _pharmacyDbContext.PHRMInvoiceTransactionItems.AsEnumerable()
                                           join detail in _pharmacyDbContext.PHRMInvoiceTransaction.AsEnumerable() on itm.InvoiceId equals detail.InvoiceId
                                           join id in referanceIdList on detail.InvoiceId equals id
                                           join pat in _pharmacyDbContext.PHRMPatient on detail.PatientId equals pat.PatientId
                                           group new { itm, detail, pat } by new { id } into x
                                           select new
                                           {
                                               InvoiceNo = x.Select(a => a.detail.InvoiceId).FirstOrDefault(),
                                               DiscountAmount = x.Select(a => a.detail.DiscountAmount).FirstOrDefault(),
                                               VATAmount = x.Select(a => a.detail.VATAmount).FirstOrDefault(),
                                               TotalAmount = x.Select(a => a.detail.TotalAmount).FirstOrDefault(),
                                               //ItemName = x.Select(a => a.itm.ItemName),
                                               ItemList = x.Select(a => new { a.itm.ItemName, a.itm.TotalAmount }).ToList(),
                                               PatientName = x.Select(a => a.pat.FirstName + "" + a.pat.LastName).FirstOrDefault(),
                                               TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                                           }).ToList();
                        responseData.Results = InvoiceData;
                    }
                    else
                    if (txnModel.Where(a => a.TransactionType.Contains("ReturnToSupplier")).ToList().Count > 0)
                    {
                        var ReturnToSupplierData = (from itm in _pharmacyDbContext.PHRMReturnToSupplierItem.AsEnumerable()
                                                    join detail in _pharmacyDbContext.PHRMReturnToSupplier.AsEnumerable() on itm.ReturnToSupplierId equals detail.ReturnToSupplierId
                                                    join id in referanceIdList on detail.ReturnToSupplierId equals id
                                                    join gritm in _pharmacyDbContext.PHRMGoodsReceiptItems on itm.GoodReceiptItemId equals gritm.GoodReceiptItemId
                                                    join sup in _pharmacyDbContext.PHRMSupplier on detail.SupplierId equals sup.SupplierId
                                                    group new { itm, detail, sup, gritm } by new { id } into x
                                                    select new
                                                    {
                                                        SupplierName = x.Select(a => a.sup.SupplierName).FirstOrDefault(),
                                                        DiscountAmount = x.Select(a => a.detail.DiscountAmount).FirstOrDefault(),
                                                        VATAmount = x.Select(a => a.detail.VATAmount).FirstOrDefault(),
                                                        TotalAmount = x.Select(a => a.detail.TotalAmount).FirstOrDefault(),
                                                        ItemList = x.Select(a => new { a.gritm.ItemName, a.itm.TotalAmount }).ToList(),
                                                        TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                                                    }).ToList();
                        responseData.Results = ReturnToSupplierData;
                    }
                    else
                    if (txnModel.Where(a => a.TransactionType.Contains("CashInvoiceReturn")).ToList().Count > 0)
                    {
                        var CashInvoiceReturnData = (from invReturn in _pharmacyDbContext.PHRMInvoiceReturnModel.AsEnumerable()
                                                     join id in referanceIdList on invReturn.InvoiceReturnId equals id
                                                     join detail in _pharmacyDbContext.PHRMInvoiceReturnItemsModel.AsEnumerable() on invReturn.InvoiceReturnId equals detail.InvoiceReturnId
                                                     join pat in _pharmacyDbContext.PHRMPatient on invReturn.PatientId equals pat.PatientId
                                                     join invitm in _pharmacyDbContext.PHRMInvoiceTransactionItems on detail.InvoiceItemId equals invitm.InvoiceItemId
                                                     group new { invitm, invReturn, pat, detail, id } by new { invReturn.PatientId, id } into x
                                                     select new
                                                     {
                                                         InvoiceNo = x.Select(a => a.invReturn.InvoiceReturnId).FirstOrDefault(),
                                                         PatientName = x.Select(a => a.pat.FirstName + "" + a.pat.LastName).FirstOrDefault(),
                                                         DiscountAmount = x.Select(a => a.detail.DiscountAmount).FirstOrDefault(),
                                                         VATAmount = x.Select(c => (((decimal)c.invReturn.SubTotal - (((decimal)c.invReturn.SubTotal * Convert.ToDecimal((decimal)c.invReturn.DiscountAmount)))) * Convert.ToDecimal((decimal)c.detail.VATPercentage)) / 100).Sum(),
                                                         TotalAmount = x.Select(a => a.detail.TotalAmount).FirstOrDefault(),
                                                         //  ItemName = x.Select(a => a.invitm.ItemName).FirstOrDefault(),
                                                         ItemList = x.Select(a => new { a.invitm.ItemName, a.invitm.TotalAmount }).ToList(),
                                                         TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                                                     }).ToList();
                        responseData.Results = CashInvoiceReturnData;
                    }
                    else
                    if (txnModel.Where(a => a.TransactionType.Contains("GoodReceipt")).ToList().Count > 0)
                    {
                        var GoodsData = (from itm in _pharmacyDbContext.PHRMGoodsReceiptItems.AsEnumerable()
                                         join id in referanceIdList on itm.GoodReceiptId equals id
                                         join detail in _pharmacyDbContext.PHRMGoodsReceipt.AsEnumerable() on itm.GoodReceiptId equals detail.GoodReceiptId
                                         group new { itm, detail, id } by new { id } into x
                                         select new
                                         {
                                             // GoodReceiptId = x.Select(a => a.id).FirstOrDefault(),
                                             InvoiceNo = x.Select(a => a.detail.InvoiceNo).FirstOrDefault(),
                                             //SupplierName = x.Select(a => a.itm.SupplierName).FirstOrDefault(), //Since it can't be set into database, we can't get SupplierName
                                             DiscountAmount = x.Select(a => a.detail.DiscountAmount).FirstOrDefault(),
                                             VATAmount = x.Select(a => a.detail.VATAmount).FirstOrDefault(),
                                             TotalAmount = x.Select(a => a.detail.TotalAmount).FirstOrDefault(),
                                             //ItemName = x.Select(a => a.itm.ItemName),
                                             //TotalAmount = x.Select(a => a.detail.TotalAmount),
                                             ItemList = x.Select(a => new { a.itm.ItemName, a.itm.TotalAmount }).ToList(),
                                             TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                                         }).ToList();
                        responseData.Results = GoodsData;
                    }
                    else if (txnModel.Where(a => a.TransactionType.Contains("PHRMDispatchToDeptReturn")).ToList().Count > 0)
                    {
                        //EMR_LPH_MERGE: NageshBB- 18-June-2021 -commented below line for temporary build error solution
                        ///later we need to discuss table and column with pharmacy team and do chagnes as per requirement
                        //var Data = (from stk in pharmacyDbContext.StockTransactions.AsEnumerable()
                        //            join itm in pharmacyDbContext.PHRMItemMaster.AsEnumerable() on stk.ItemId equals itm.ItemId

                        //            join id in referanceIdList on stk.StockTxnItemId equals id
                        //            group new { stk, id, itm } by new { id } into x
                        //            select new
                        //            {
                        //                ItemList = x.Select(a => new { a.itm.ItemName, a.stk.TotalAmount }).ToList(),
                        //                TotalAmount = x.Select(a => a.stk.SubTotal).FirstOrDefault(),
                        //                TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                        //            }).ToList();

                        //responseData.Results = Data;

                        //sanjit: this condition has been changed beacuse of Stock tables redesign in LPH
                        var Data = (from stk in _pharmacyDbContext.StockTransactions.AsEnumerable()
                                    join itm in _pharmacyDbContext.PHRMItemMaster.AsEnumerable() on stk.ItemId equals itm.ItemId
                                    join id in referanceIdList on stk.StockTransactionId equals id
                                    group new { stk, id, itm } by new { id } into x
                                    select new
                                    {
                                        ItemList = x.Select(a => new { a.itm.ItemName, TotalAmount = a.stk.CostPrice * Convert.ToDecimal(a.stk.InQty) }).ToList(),
                                        TotalAmount = x.Select(a => Convert.ToDecimal(a.stk.InQty) * a.stk.CostPrice).FirstOrDefault(),
                                        TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                                    }).ToList();

                        responseData.Results = Data;
                    }
                    else if (txnModel.Where(a => a.TransactionType.Contains("PHRMDispatchToDept")).ToList().Count > 0)
                    {
                        //EMR_LPH_MERGE: NageshBB- 18-June-2021 -commented below line for temporary build error solution
                        ///later we need to discuss table and column with pharmacy team and do chagnes as per requirement
                        //var Data = (from stk in pharmacyDbContext.StockTransactions.AsEnumerable()
                        //            join id in referanceIdList on stk.StockTxnItemId equals id
                        //            join wdc in pharmacyDbContext.WardConsumption.AsEnumerable() on stk.ReferenceNo equals wdc.InvoiceItemId
                        //            join pat in pharmacyDbContext.PHRMPatient.AsEnumerable() on wdc.PatientId equals pat.PatientId
                        //            group new { stk, pat, id, wdc } by new
                        //            {
                        //                id,
                        //                PatientName = pat.FirstName + " " + (string.IsNullOrEmpty(pat.MiddleName) ? "" : pat.MiddleName + " ") + pat.LastName,

                        //            } into x
                        //            select new
                        //            {
                        //                PatientName = x.Key.PatientName,
                        //                ItemList = x.Select(a => new { a.wdc.ItemName, a.stk.TotalAmount }).ToList(),
                        //                TotalAmount = x.Select(a => a.wdc.SubTotal).FirstOrDefault(),
                        //                TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                        //            }).ToList();

                        //responseData.Results = Data;
                        //sanjit: this condition has been changed beacuse of Stock tables redesign in LPH
                        var Data = (from stk in _pharmacyDbContext.StockTransactions.AsEnumerable()
                                    join id in referanceIdList on stk.StockTransactionId equals id
                                    join wdc in _pharmacyDbContext.WardConsumption.AsEnumerable() on stk.ReferenceNo equals wdc.InvoiceItemId
                                    join pat in _pharmacyDbContext.PHRMPatient.AsEnumerable() on wdc.PatientId equals pat.PatientId
                                    group new { stk, pat, id, wdc } by new
                                    {
                                        id,
                                        PatientName = pat.FirstName + " " + (string.IsNullOrEmpty(pat.MiddleName) ? "" : pat.MiddleName + " ") + pat.LastName,

                                    } into x
                                    select new
                                    {
                                        PatientName = x.Key.PatientName,
                                        ItemList = x.Select(a => new { a.wdc.ItemName, TotalAmount = Convert.ToDecimal(a.stk.OutQty) * a.stk.CostPrice }).ToList(),
                                        TotalAmount = x.Select(a => a.wdc.SubTotal).FirstOrDefault(),
                                        TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                                    }).ToList();

                        responseData.Results = Data;
                    }
                    else
                    {
                        var Data = (from detail in _pharmacyDbContext.PHRMWriteOff.AsEnumerable()
                                    join itm in _pharmacyDbContext.PHRMWriteOffItem.AsEnumerable() on detail.WriteOffId equals itm.WriteOffId
                                    join mstItm in _pharmacyDbContext.PHRMItemMaster.AsEnumerable() on itm.ItemId equals mstItm.ItemId
                                    //join gr in pharmacyDbContext.PHRMGoodsReceiptItems.AsEnumerable() on itm.GoodReceiptItemId equals gr.GoodReceiptItemId
                                    join id in referanceIdList on detail.WriteOffId equals id
                                    group new { detail, itm, mstItm } by new { detail.WriteOffId } into x
                                    select new
                                    {
                                        //there is no link between writeoff table and good receipt table, so we cannot  get the supplier name 
                                        //so here I am sending null 
                                        //SupplierName = x.Select(a => a.gr.SupplierName).FirstOrDefault(),
                                        SupplierName = "",
                                        DiscountAmount = x.Select(a => a.detail.DiscountAmount).FirstOrDefault(),
                                        VATAmount = x.Select(a => a.detail.VATAmount).FirstOrDefault(),
                                        TotalAmount = x.Select(a => a.detail.TotalAmount).FirstOrDefault(),
                                        ItemList = x.Select(a => new { a.mstItm.ItemName, a.itm.TotalAmount }).ToList(),
                                        TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()
                                    }).ToList();
                        responseData.Results = Data;
                    }
                    responseData.Status = "OK";
                }
                /* * End Pharmacy Section */

                /* * Start Incetive Section */
                if (txnModel.Where(a => a.SectionId == 5).ToList().Count > 0)
                {

                    if (txnModel.Where(a => a.TransactionType.Contains("ConsultantIncentive")).ToList().Count > 0)
                    {
                        var incetiveData = (from invt in _incentiveDbContext.IncentiveFractionItems.AsEnumerable()
                                            join id in referanceIdList on invt.InctvTxnItemId equals id
                                            join emp in _accountingDbContext.Emmployees.AsEnumerable() on invt.IncentiveReceiverId equals emp.EmployeeId
                                            group new { invt, emp } by new { emp } into x
                                            select new
                                            {
                                                EmployeeName = x.Select(a => a.emp.FullName).FirstOrDefault(),
                                                TotalAmount = x.Select(a => a.invt.TotalBillAmount).FirstOrDefault(),
                                                ItemList = x.Select(a => new { a.invt.ItemName, a.invt.IncentiveAmount, a.invt.IncentiveReceiverId }).ToList(),
                                                TransactionType = txnModel.Where(a => a.referIds.Contains(a.referIds.ToString())).Select(a => a.TransactionType).FirstOrDefault()

                                            }).ToList();

                        responseData.Results = incetiveData;
                    }


                }

                /* * End Incetive Section */
            }

            return responseData.Results;

        }

        private object GetCashFlowReport(DateTime FromDate, DateTime ToDate, int FiscalYearId, int HospitalId)
        {



            //int currentHospitalId = HttpContext.Session.Get<int>("AccSelectedHospitalId");
            int currentHospitalId = HospitalId;
            List<SqlParameter> paramList = new List<SqlParameter>()
                        {
                            new SqlParameter("@FromDate", FromDate),
                            new SqlParameter("@ToDate", ToDate),
                            new SqlParameter("@FiscalYearId", FiscalYearId),
                            new SqlParameter("@HospitalId", currentHospitalId)
                        };
            DataSet result = DALFunctions.GetDatasetFromStoredProc("SP_ACC_RPT_CashFlowReport", paramList, _accountingDbContext);
            var OpeningData = DataTableToList.ToDynamic(result.Tables[0]);
            var TxnData = DataTableToList.ToDynamic(result.Tables[1]);
            var FinalData = new
            {
                OpeningData,
                TxnData
            };
            return FinalData;

        }

        private object GetDayWiseVoucherReport(DateTime FromDate, DateTime ToDate, int sectionId, int FiscalYearId)
        {



            int currentHospitalId = HttpContext.Session.Get<int>(ENUM_SessionValues.CurrentHospitalId);
            var SectionList = AccountingBL.GetSections(_accountingDbContext, currentHospitalId);
            var OpeningBalanceData = (from t in _accountingDbContext.Transactions
                                      join ti in _accountingDbContext.TransactionItems on t.TransactionId equals ti.TransactionId
                                      join fisc in _accountingDbContext.FiscalYears on t.FiscalyearId equals fisc.FiscalYearId
                                      join map in _accountingDbContext.MapFiscalYears on fisc.FiscalYearId equals map.FiscalYearId
                                      where
                                      ti.HospitalId == currentHospitalId  && map.HospitalId == currentHospitalId && 
                                      (DbFunctions.TruncateTime(t.TransactionDate) == FromDate) && (t.FiscalyearId == fisc.FiscalYearId)
                                      group new { fisc, ti, t } by new
                                      {
                                          fisc.FiscalYearId,
                                          t.TransactionDate,
                                      } into x
                                      select new
                                      {
                                          Amountdr = x.Where(b => b.ti.DrCr == true && (DbFunctions.TruncateTime(b.t.TransactionDate) >= b.fisc.StartDate && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate)).Select(a => (int?)a.ti.Amount).DefaultIfEmpty(0).Sum(),
                                          Amountcr = x.Where(b => b.ti.DrCr == false && (DbFunctions.TruncateTime(b.t.TransactionDate) >= b.fisc.StartDate && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate)).Select(a => (int?)a.ti.Amount).DefaultIfEmpty(0).Sum(),
                                          x.Key.FiscalYearId,
                                      }).ToList();

            var txnList = (from txn in _accountingDbContext.Transactions
                           where txn.HospitalId == currentHospitalId
                           join voucher in _accountingDbContext.Vouchers on txn.VoucherId equals voucher.VoucherId
                           join fiscal in _accountingDbContext.FiscalYears on txn.FiscalyearId equals fiscal.FiscalYearId
                           join map in _accountingDbContext.MapFiscalYears on fiscal.FiscalYearId equals map.FiscalYearId
                           where
                           voucher.HospitalId ==currentHospitalId && map.HospitalId == currentHospitalId &&
                           txn.IsActive == true && (DbFunctions.TruncateTime(txn.TransactionDate) >= FromDate && DbFunctions.TruncateTime(txn.TransactionDate) <= ToDate)
                           && txn.SectionId == sectionId && txn.FiscalyearId == FiscalYearId
                           select new
                           {
                               TransactionId = txn.TransactionId,
                               FiscalYear = fiscal.FiscalYearName,
                               //VoucherNumber = txn.VoucherNumber,
                               VoucherNumber = txn.DayVoucherNumber,
                               VoucherType = voucher.VoucherName,
                               VoucherId = txn.VoucherId,
                               SectionId = txn.SectionId,
                               TransactionDate = DbFunctions.TruncateTime(txn.TransactionDate),// txn.TransactionDate.ToString("dd/mm/yyyy"),                                       
                               Amount = (from txnItm in _accountingDbContext.TransactionItems
                                         where txnItm.TransactionId == txn.TransactionId
                                         && txnItm.HospitalId ==currentHospitalId
                                         && txnItm.DrCr == true
                                         group txnItm by new
                                         {
                                             txnItm.DrCr
                                         } into g
                                         select g.Sum(x => x.Amount)
                                         ).FirstOrDefault()
                           }).OrderByDescending(a => a.TransactionId).ToList();
            //below query as per new requirement if wants old one result then please comment below and take txnList as result
            var finalData = (from t in txnList
                             group new { t } by new
                             {
                                 t.VoucherNumber,
                                 t.FiscalYear,
                                 t.VoucherType,
                                 t.TransactionDate,
                                 t.SectionId
                             }
                            into x
                             select new
                             {
                                 FiscalYear = x.Key.FiscalYear,
                                 VoucherNumber = x.Key.VoucherNumber,
                                 VoucherType = x.Key.VoucherType,
                                 TransactionDate = x.Key.TransactionDate,
                                 Amount = x.Sum(y => y.t.Amount),
                                 SectionId = x.Key.SectionId,
                                 SectionName = SectionList.Where(s => s.SectionId == x.Key.SectionId).Select(a => a.SectionName).FirstOrDefault(),
                                 VoucherId = x.Select(a => a.t.VoucherId).FirstOrDefault()
                             }).OrderByDescending(a => a.TransactionDate).ToList();

            return finalData;
        }

        private object GetDayWiseVoucherDetailsByVoucherNo(int DayVoucherNumber, int voucherId, int sectionId)
        {

            //  else if (reqType == "daywise-voucher-detail-by-dayVoucherNO")

            //getting uniqueid and sectionid of transaction 
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            int currentHospitalId = HttpContext.Session.Get<int>(ENUM_SessionValues.CurrentHospitalId);
            var txnids = (from txn in _accountingDbContext.Transactions
                          where
                          txn.HospitalId == currentHospitalId &&
                          txn.DayVoucherNumber == DayVoucherNumber && txn.IsActive == true && txn.VoucherId == voucherId && txn.SectionId == sectionId
                          select new
                          {
                              txn.SectionId,
                              txn.TUId,
                              txn.VoucherNumber
                          }).FirstOrDefault();


            if (txnids.VoucherNumber.Contains("SV") && txnids.SectionId == 2)
            {//Ajay 15Feb Here we only getting records for Billing Sales Voucher
             //getting single transaction with multiple vouchers
                var alltransactions = (from txn in _accountingDbContext.Transactions
                                       where
                                       txn.HospitalId == currentHospitalId &&
                                       txn.TUId == txnids.TUId
                                       select txn).ToList();
                var alltransactionitems = (from txnitm in _accountingDbContext.TransactionItems.AsEnumerable()
                                           join txn in alltransactions on txnitm.TransactionId equals txn.TransactionId
                                           where txnitm.HospitalId == currentHospitalId
                                           select txnitm).ToList();
                //getting only single sales voucher records
                var transactions = (from txn in alltransactions
                                    where
                                    txn.HospitalId == currentHospitalId &&
                                    txn.DayVoucherNumber == DayVoucherNumber && txn.IsActive == true
                                    select txn).ToList();
                //getting transaction items for selected trasnaction
                var transactionitems = (from ti in alltransactionitems
                                        where ti.HospitalId == currentHospitalId
                                        join t in transactions on ti.TransactionId equals t.TransactionId
                                        select ti).ToList();
                //getting vouchers
                var vouchers = (from v in _accountingDbContext.Vouchers where v.HospitalId==currentHospitalId select v).ToList();
                //getting voucher heads
                var voucherheads = (from head in _accountingDbContext.VoucherHeads where head.HospitalId == currentHospitalId select head).ToList();
                //fiscal year
                var fiscalYear = (from fiscal in _accountingDbContext.FiscalYears
                                  join map in _accountingDbContext.MapFiscalYears
                                  on fiscal.FiscalYearId equals map.FiscalYearId
                                  where map.HospitalId == currentHospitalId
                                  select fiscal).ToList();
                //getting ledgers
                var ledgers = (from l in _accountingDbContext.Ledgers
                               where l.HospitalId == currentHospitalId
                               select l).ToList();
                //getting ledgergroups
                var ledgergroup = (from lg in _accountingDbContext.LedgerGroups
                                   where lg.HospitalId == currentHospitalId
                                   select lg).ToList();
                //getting trasnaction items details for supplier patient and for user
                var transactionitemdetails = (from d in _accountingDbContext.TransactionItemDetails
                                              select d).ToList();
                //getting patient
                var patients = (from pat in _accountingDbContext.PatientModel.AsEnumerable()
                                join txndetail in transactionitemdetails on pat.PatientId equals txndetail.ReferenceId
                                join txnitm in alltransactionitems on txndetail.TransactionItemId equals txnitm.TransactionItemId
                                where txndetail.ReferenceType == "Patient" && txnitm.HospitalId==currentHospitalId
                                select new
                                {
                                    txndetail.ReferenceId,
                                    txnitm.LedgerId,
                                    txnitm.DrCr,
                                    Name = pat.FirstName + pat.LastName,
                                    txndetail.Amount
                                }).ToList();
                //getting suppliers
                var supplier = (from sup in _accountingDbContext.PHRMSupplier select sup).ToList();
                //getting user details
                var userDetails = (from txn in alltransactions
                                   join txnitm in alltransactionitems on txn.TransactionId equals txnitm.TransactionId
                                   join txndetail in transactionitemdetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
                                   join emp in _accountingDbContext.Emmployees.AsEnumerable() on txndetail.ReferenceId equals emp.EmployeeId
                                   where txndetail.ReferenceType == "User"
                                   select new
                                   {
                                       LedgerId = txnitm.LedgerId,
                                       DrCr = txnitm.DrCr,
                                       Name = emp.FirstName + " " + (string.IsNullOrEmpty(emp.LastName) ? "" : emp.LastName),
                                       txndetail.ReferenceId,
                                       txndetail.Amount,
                                       txn.VoucherNumber,
                                   }).ToList();
                //getting amount of credit note voucher and payment voucher
                var Amounts = (from txn in alltransactions
                               join txnItm in alltransactionitems on txn.TransactionId equals txnItm.TransactionId
                               join led in ledgers on txnItm.LedgerId equals led.LedgerId
                               group new { txn, txnItm, led } by new { txn.VoucherId } into x
                               select new
                               {
                                   ReturnAmount = x.Where(a => a.txn.VoucherNumber.Contains("CN") && a.txnItm.DrCr == true /*&& a.txn.TransactionType.StartsWith("Cash")*/).Sum(a => a.txnItm.Amount),
                                   PaymentAmount = x.Where(a => a.txn.VoucherNumber.Contains("PMTV") && a.txnItm.DrCr == true).Sum(a => a.txnItm.Amount),
                                   ReturnDiscount = x.Where(a => a.led.Name == "EIE_ADMINISTRATION_EXPENSES_TRADE_DISCOUNT" && a.txnItm.DrCr == false).Sum(a => a.txnItm.Amount),
                                   ReceivablesAmount = x.Where(a => a.led.Name == "ACA_SUNDRY_DEBTORS_RECEIVABLES" && a.txnItm.DrCr == true).Sum(a => a.txnItm.Amount)
                                                - x.Where(a => a.led.Name == "ACA_SUNDRY_DEBTORS_RECEIVABLES" && a.txnItm.DrCr == false).Sum(a => a.txnItm.Amount)
                               }).ToList();
                //getting user cash collection
                var UserCashCollection = (from user in userDetails
                                          group new { user } by new { user.ReferenceId } into x
                                          select new
                                          {
                                              UserName = x.Select(a => a.user.Name).FirstOrDefault(),
                                              SalesDr = x.Where(a => a.user.DrCr == true && a.user.VoucherNumber.Contains("SV")).Sum(a => a.user.Amount),
                                              SalesCr = x.Where(a => a.user.DrCr == false && a.user.VoucherNumber.Contains("SV")).Sum(a => a.user.Amount),
                                              DepositDr = x.Where(a => a.user.DrCr == true && !a.user.VoucherNumber.Contains("SV")).Sum(a => a.user.Amount),
                                              DepositCr = x.Where(a => a.user.DrCr == false && !a.user.VoucherNumber.Contains("SV")).Sum(a => a.user.Amount),
                                          }).ToList();
                //getting record for selected sales voucher
                var temp = (from txn in transactions
                            join voucher in vouchers on txn.VoucherId equals voucher.VoucherId
                            //join costCenter in _accountingDbContext.CostCenters on txn.CostCenterId equals costCenter.CostCenterId
                            join fiscal in fiscalYear on txn.FiscalyearId equals fiscal.FiscalYearId
                            select new
                            {
                                txn.VoucherNumber,
                                fiscal.FiscalYearName,
                               // costCenter.CostCenterName,
                                txn.TransactionDate,
                                voucher.VoucherName,
                                txn.Remarks,
                                txn.DayVoucherNumber
                            }).ToList();
                //formatting data for sales voucher
                var txnList = (from temptxn in temp
                               select new
                               {
                                   VoucherNumber = temptxn.VoucherNumber,
                                   DayVoucherNumber = temptxn.DayVoucherNumber,
                                   FiscalYear = temptxn.FiscalYearName,
                                   CostCenterName = "",//temptxn.CostCenterName,
                                   TransactionDate = temptxn.TransactionDate,
                                   VoucherType = temptxn.VoucherName,
                                   Remarks = temptxn.Remarks,
                                   TransactionItems = (from txnItm in alltransactionitems
                                                       join ledger in ledgers on txnItm.LedgerId equals ledger.LedgerId
                                                       join txn in alltransactions on txnItm.TransactionId equals txn.TransactionId
                                                       join ledgp in ledgergroup on ledger.LedgerGroupId equals ledgp.LedgerGroupId
                                                       group new { ledger, ledgp, txnItm, txn } by new
                                                       {
                                                           ledgp.LedgerGroupName,
                                                           ledger.LedgerName,
                                                           txnItm.DrCr,
                                                           ledger.LedgerId,
                                                           txn.TransactionType,
                                                           //txn.VoucherNumber
                                                           txn.DayVoucherNumber,
                                                           ledger.Code
                                                       }
                                                       into x
                                                       select new
                                                       {
                                                           LedgerId = x.Key.LedgerId,
                                                           LedgerGroupName = x.Key.LedgerGroupName,
                                                           LedgerName = x.Key.LedgerName,
                                                           Code = x.Key.Code,
                                                           DrCr = x.Key.DrCr,
                                                           VoucherNumber = x.Key.DayVoucherNumber,
                                                           TransactionType = x.Select(a => a.txn.TransactionType).ToList(),
                                                           Name = x.Select(a => a.ledger.Name).FirstOrDefault(),
                                                           Amount = x.Select(a => a.txnItm.Amount).Sum(),
                                                           Remarks = x.Select(a => a.txn.Remarks),
                                                           Details = (from pat in patients
                                                                      where pat.LedgerId == x.Key.LedgerId && pat.DrCr == x.Key.DrCr
                                                                      group new { pat } by new
                                                                      {
                                                                          pat.ReferenceId,
                                                                          pat.DrCr
                                                                      } into x1
                                                                      select new
                                                                      {
                                                                          Name = x1.Select(a => a.pat.Name).FirstOrDefault(),
                                                                          Dr = x1.Where(a => a.pat.DrCr == true).Sum(a => a.pat.Amount),
                                                                          Cr = x1.Where(a => a.pat.DrCr == false).Sum(a => a.pat.Amount),
                                                                      }).ToList(),
                                                           SupplierDetails = (from txnitm in transactionitems
                                                                              join txndetail in transactionitemdetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
                                                                              join sup in supplier on txndetail.ReferenceId equals sup.SupplierId
                                                                              where txnitm.LedgerId == x.Key.LedgerId && txnitm.DrCr == x.Key.DrCr && txndetail.ReferenceType == "Supplier"
                                                                              group new { txnitm, sup, txndetail } by new
                                                                              {
                                                                                  txndetail.ReferenceId,
                                                                                  txnitm.DrCr
                                                                              } into x1
                                                                              select new
                                                                              {
                                                                                  Name = x1.Select(a => a.sup.SupplierName).FirstOrDefault(),
                                                                                  Dr = x1.Where(a => a.txnitm.DrCr == true).Sum(a => a.txndetail.Amount),
                                                                                  Cr = x1.Where(a => a.txnitm.DrCr == false).Sum(a => a.txndetail.Amount),
                                                                              }).ToList(),
                                                       }).OrderByDescending(a => a.DrCr).ToList()
                               }).FirstOrDefault();
                //merging supplier details and patient details, user details
                txnList.TransactionItems.ForEach(data =>
                {
                    //foreach (var det in data.UserDetails)
                    //{
                    //    data.Details.Add(det);
                    //}
                    foreach (var det in data.SupplierDetails)
                    {
                        data.Details.Add(det);
                    }
                });
                //combining final result with credit not amount, payment amount, UserCashCollection and sales voucher transaction details
                var res = new
                {
                    Amounts = new
                    {
                        ReturnAmount = Amounts.Sum(a => a.ReturnAmount),
                        PaymentAmount = Amounts.Sum(a => a.PaymentAmount),
                        RetrunDiscount = Amounts.Sum(a => a.ReturnDiscount),
                        ReceivableAmount = Amounts.Sum(a => a.ReceivablesAmount),
                    },
                    txnList,
                    SectionId = txnids.SectionId,
                    UserCashCollection
                };
                responseData.Results = res;
            }
            else
            {
                var txnList = (from txn in _accountingDbContext.Transactions
                               where txn.HospitalId == currentHospitalId
                               join voucher in _accountingDbContext.Vouchers on txn.VoucherId equals voucher.VoucherId
                               //join costCenter in _accountingDbContext.CostCenters on txn.CostCenterId equals costCenter.CostCenterId
                               join fiscal in _accountingDbContext.FiscalYears on txn.FiscalyearId equals fiscal.FiscalYearId
                               join map in _accountingDbContext.MapFiscalYears on fiscal.FiscalYearId equals map.FiscalYearId
                               where
                               voucher.HospitalId == currentHospitalId && map.HospitalId == currentHospitalId &&                            
                               txn.DayVoucherNumber == DayVoucherNumber && txn.IsActive == true && txn.VoucherId == voucherId
                               select new
                               {
                                   // TransactionId = txn.TransactionId,
                                   VoucherNumber = txn.VoucherNumber,
                                   DayVoucherNumber = txn.DayVoucherNumber,
                                   FiscalYear = fiscal.FiscalYearName,
                                   CostCenterName = "",//costCenter.CostCenterName,
                                   TransactionDate = txn.TransactionDate,
                                   VoucherType = voucher.VoucherName,
                                   Remarks = txn.Remarks,
                                   TransactionItems = (from txnItm in _accountingDbContext.TransactionItems
                                                       where txnItm.HospitalId == currentHospitalId
                                                       join ledger in _accountingDbContext.Ledgers on txnItm.LedgerId equals ledger.LedgerId
                                                       join txnp in _accountingDbContext.Transactions on txnItm.TransactionId equals txnp.TransactionId
                                                       join ledgp in _accountingDbContext.LedgerGroups on ledger.LedgerGroupId equals ledgp.LedgerGroupId
                                                       where
                                                       ledger.HospitalId == currentHospitalId && ledgp.HospitalId == currentHospitalId &&
                                                       txnp.DayVoucherNumber == DayVoucherNumber && txnp.VoucherId == voucherId
                                                       group new { ledger, ledgp, txnItm, txnp } by new
                                                       {
                                                           ledgp.LedgerGroupName,
                                                           ledger.LedgerName,
                                                           txnItm.DrCr,
                                                           ledger.LedgerId,
                                                           ledger.Code
                                                       }
                                                       into x
                                                       select new
                                                       {
                                                           LedgerId = x.Key.LedgerId,
                                                           LedgerGroupName = x.Key.LedgerGroupName,
                                                           LedgerName = x.Key.LedgerName,
                                                           Code = x.Key.Code,
                                                           DrCr = x.Key.DrCr,
                                                           Amount = x.Select(a => a.txnItm.Amount).Sum(),
                                                           Remarks = x.Select(a => a.txnp.Remarks),
                                                           Details = (from txnitm in _accountingDbContext.TransactionItems
                                                                      where txnitm.HospitalId == currentHospitalId
                                                                      join txndetail in _accountingDbContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
                                                                      join pat in _accountingDbContext.PatientModel on txndetail.ReferenceId equals pat.PatientId
                                                                      join txn in _accountingDbContext.Transactions on txnitm.TransactionId equals txn.TransactionId
                                                                      where txn.HospitalId == currentHospitalId &&
                                                                      txn.DayVoucherNumber == DayVoucherNumber && txnitm.LedgerId == x.Key.LedgerId && txnitm.DrCr == x.Key.DrCr && txndetail.ReferenceType == "Patient" && txn.VoucherId == voucherId
                                                                      group new { txnitm, pat, txndetail } by new
                                                                      {
                                                                          txndetail.ReferenceId,
                                                                          txnitm.DrCr
                                                                      } into x1
                                                                      select new
                                                                      {
                                                                          Name = x1.Select(a => a.pat.FirstName + a.pat.LastName).FirstOrDefault(),
                                                                          Dr = x1.Where(a => a.txnitm.DrCr == true).Sum(a => a.txndetail.Amount),
                                                                          Cr = x1.Where(a => a.txnitm.DrCr == false).Sum(a => a.txndetail.Amount),
                                                                      }).ToList(),
                                                           SupplierDetails = (from txnitm in _accountingDbContext.TransactionItems
                                                                              where txnitm.HospitalId == currentHospitalId
                                                                              join txndetail in _accountingDbContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
                                                                              join sup in _accountingDbContext.PHRMSupplier on txndetail.ReferenceId equals sup.SupplierId
                                                                              join txn in _accountingDbContext.Transactions on txnitm.TransactionId equals txn.TransactionId
                                                                              where
                                                                              txn.HospitalId == currentHospitalId &&
                                                                              txn.DayVoucherNumber == DayVoucherNumber && txnitm.LedgerId == x.Key.LedgerId && txnitm.DrCr == x.Key.DrCr && txndetail.ReferenceType == "Supplier" && txn.VoucherId == voucherId
                                                                              group new { txnitm, sup, txndetail } by new
                                                                              {
                                                                                  txndetail.ReferenceId,
                                                                                  txnitm.DrCr
                                                                              } into x1
                                                                              select new
                                                                              {
                                                                                  Name = x1.Select(a => a.sup.SupplierName).FirstOrDefault(),
                                                                                  Dr = x1.Where(a => a.txnitm.DrCr == true).Sum(a => a.txndetail.Amount),
                                                                                  Cr = x1.Where(a => a.txnitm.DrCr == false).Sum(a => a.txndetail.Amount),
                                                                              }).ToList(),
                                                           UserDetails = (from txnitm in _accountingDbContext.TransactionItems
                                                                          where txnitm.HospitalId == currentHospitalId
                                                                          join txndetail in _accountingDbContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
                                                                          join emp in _accountingDbContext.Emmployees on txndetail.ReferenceId equals emp.EmployeeId
                                                                          join txn in _accountingDbContext.Transactions on txnitm.TransactionId equals txn.TransactionId
                                                                          where
                                                                          txn.HospitalId == currentHospitalId &&
                                                                          txn.DayVoucherNumber == DayVoucherNumber && txn.VoucherId == voucherId && txnitm.LedgerId == x.Key.LedgerId && txnitm.DrCr == x.Key.DrCr && txndetail.ReferenceType == "User" && txn.TUId == txnids.TUId
                                                                          group new { txnitm, emp, txndetail } by new
                                                                          {
                                                                              txndetail.ReferenceId,
                                                                              txnitm.DrCr
                                                                          } into x1
                                                                          select new
                                                                          {
                                                                              Name = x1.Select(a => a.emp.FirstName + " " + (string.IsNullOrEmpty(a.emp.LastName) ? "" : a.emp.LastName)).FirstOrDefault(),
                                                                              Dr = x1.Where(a => a.txnitm.DrCr == true).Sum(a => a.txndetail.Amount),
                                                                              Cr = x1.Where(a => a.txnitm.DrCr == false).Sum(a => a.txndetail.Amount),
                                                                          }).ToList(),
                                                           VendorDetails = (from txnitm in _accountingDbContext.TransactionItems
                                                                            where txnitm.HospitalId == currentHospitalId
                                                                            join txndetail in _accountingDbContext.TransactionItemDetails on txnitm.TransactionItemId equals txndetail.TransactionItemId
                                                                            join ven in _accountingDbContext.InvVendors on txndetail.ReferenceId equals ven.VendorId
                                                                            join txn in _accountingDbContext.Transactions on txnitm.TransactionId equals txn.TransactionId
                                                                            where
                                                                            txn.HospitalId == currentHospitalId &&
                                                                            txn.DayVoucherNumber == DayVoucherNumber && txn.VoucherId == voucherId && txnitm.LedgerId == x.Key.LedgerId && txnitm.DrCr == x.Key.DrCr && txndetail.ReferenceType == "Vendor"
                                                                            group new { txnitm, ven, txndetail } by new
                                                                            {
                                                                                txndetail.ReferenceId,
                                                                                txnitm.DrCr
                                                                            } into x1
                                                                            select new
                                                                            {
                                                                                Name = x1.Select(a => a.ven.VendorName).FirstOrDefault(),
                                                                                Dr = x1.Where(a => a.txnitm.DrCr == true).Sum(a => a.txndetail.Amount),
                                                                                Cr = x1.Where(a => a.txnitm.DrCr == false).Sum(a => a.txndetail.Amount),
                                                                            }).ToList(),
                                                       }).OrderByDescending(a => a.DrCr).ToList()
                               }).FirstOrDefault();
                txnList.TransactionItems.ForEach(data =>
                {
                    foreach (var det in data.UserDetails)
                    {
                        data.Details.Add(det);
                    }
                    foreach (var det in data.SupplierDetails)
                    {
                        data.Details.Add(det);
                    }
                    foreach (var det in data.VendorDetails)
                    {
                        data.Details.Add(det);
                    }
                });
                var res = new
                {
                    SectionId = txnids.SectionId,
                    txnList
                };
                responseData.Results = res;
            }


            return responseData;

        }
        private object GetSystemAuditReport(DateTime FromDate, DateTime ToDate, string voucherReportType, int sectionId, int HospitalId)
        {

            //else if (reqType == "system-aduit-report")

            List<SqlParameter> paramList = new List<SqlParameter>()
                                {
                                        new SqlParameter("@FromDate", FromDate),
                                        new SqlParameter("@ToDate", ToDate),
                                        new SqlParameter("@voucherReportType", voucherReportType),
                                        new SqlParameter("@SectionId", sectionId),
                                        new SqlParameter("@HospitalId", HospitalId)
                                };
            var spDataTable = DALFunctions.GetDataTableFromStoredProc("SP_ACC_RPT_GetSystemAduitReport", paramList, _accountingDbContext);
            var resultStr = JsonConvert.SerializeObject(spDataTable, new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
            var TransactionWithItems = JsonConvert.DeserializeObject<List<dynamic>>(resultStr);
            return TransactionWithItems;

        }

        private object GetReverseTransactionDetail(int ReverseTransactionId)
        {



            List<SqlParameter> paramList = new List<SqlParameter>()
                                {
                                        new SqlParameter("@ReverseTransactionId", ReverseTransactionId),
                                };
            var spDataTable = DALFunctions.GetDatasetFromStoredProc("SP_ACC_RPT_GetReverseTranactionDetail", paramList, _accountingDbContext);
            var resultStr = JsonConvert.SerializeObject(spDataTable.Tables[0], new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
            var RevereTransactionDetailList = JsonConvert.DeserializeObject<List<dynamic>>(resultStr);
            var txnRecordsStr = JsonConvert.SerializeObject(spDataTable.Tables[1], new IsoDateTimeConverter() { DateTimeFormat = "yyyy-MM-dd" });
            var txnRecordList = JsonConvert.DeserializeObject<List<dynamic>>(txnRecordsStr);
            return new
            {
                RevereTransactionDetailList,
                txnRecordList
            };

        }

        private object GetBankReconcilationReport(DateTime FromDate, DateTime ToDate, int ledgerId, int FiscalYearId)
        {

            // else if (reqType == "bank-reconcilation-report")
            int currentHospitalId = HttpContext.Session.Get<int>(ENUM_SessionValues.CurrentHospitalId);
            var fYearId = AccountingTransferData.GetFiscalYearIdForOpeningBalance(_accountingDbContext, FiscalYearId, currentHospitalId);

            var Ledgers = _accountingDbContext.Ledgers.AsQueryable();
            var led = (from l in Ledgers
                       join lbh in _accountingDbContext.LedgerBalanceHistory on l.LedgerId equals lbh.LedgerId
                       where lbh.LedgerId == ledgerId && lbh.HospitalId == currentHospitalId && lbh.FiscalYearId == fYearId
                       select new
                       {
                           lbh.OpeningBalance,
                           DrCr = lbh.OpeningDrCr == null ? true : lbh.OpeningDrCr,
                           lbh.LedgerId,
                           l.LedgerName
                       }).FirstOrDefault();

            var transactionRecords = (from t in _accountingDbContext.Transactions
                                      join ti in _accountingDbContext.TransactionItems on t.TransactionId equals ti.TransactionId
                                      join l in Ledgers on ti.LedgerId equals l.LedgerId
                                      join v in _accountingDbContext.Vouchers on t.VoucherId equals v.VoucherId
                                      where
                                      ti.HospitalId == currentHospitalId
                                      && l.HospitalId == currentHospitalId &&
                                      (ti.LedgerId == ledgerId) && (DbFunctions.TruncateTime(t.TransactionDate) >= FromDate && DbFunctions.TruncateTime(t.TransactionDate) <= ToDate)
                                      select new
                                      {
                                          t.TransactionId,
                                          t.TransactionDate,
                                          t.VoucherNumber,
                                          l.LedgerName,
                                          l.Code,
                                          OpeningBalance = led.OpeningBalance,
                                          OpeningBalanceType = led.DrCr,
                                          t.FiscalyearId,
                                          v.VoucherName,
                                          t.SectionId,
                                          ti.Amount,
                                          ti.DrCr,
                                          Description = (t.SectionId == 4) ? ti.Description : "",
                                          l.LedgerId,
                                          t.HospitalId
                                      }).ToList();

            List<DataListDTOModel> dataList = new List<DataListDTOModel>();

            var openingBalanceFiscalYear = (from f in _accountingDbContext.FiscalYears
                                            join map in _accountingDbContext.MapFiscalYears 
                                            on f.FiscalYearId equals map.FiscalYearId 
                                            where map.FiscalYearId == fYearId && map.HospitalId == currentHospitalId select f).FirstOrDefault();
            var dataList1 = (from t in _accountingDbContext.Transactions
                             join ti in _accountingDbContext.TransactionItems on t.TransactionId equals ti.TransactionId
                             join l in Ledgers on ti.LedgerId equals l.LedgerId
                             where
                             ti.HospitalId == currentHospitalId
                             && l.HospitalId == currentHospitalId &&
                             (ti.LedgerId == ledgerId) && (DbFunctions.TruncateTime(t.TransactionDate) >= DbFunctions.TruncateTime(openingBalanceFiscalYear.StartDate) && DbFunctions.TruncateTime(t.TransactionDate) <= ToDate)
                             group new { t, ti, l } by new
                             {
                                 l.LedgerId,
                             }
                            into x
                             select new
                             {
                                 FiscalYearId = fYearId,
                                 AmountDr = x.Where(b => b.ti.DrCr == true && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate).Select(a => a.ti.Amount).DefaultIfEmpty(0).Sum() + ((transactionRecords.Count == 0 && led.LedgerId > 0 && led.DrCr == true) ? led.OpeningBalance : 0),
                                 AmountCr = x.Where(b => b.ti.DrCr == false && DbFunctions.TruncateTime(b.t.TransactionDate) < FromDate).Select(a => a.ti.Amount).DefaultIfEmpty(0).Sum() + ((transactionRecords.Count == 0 && led.LedgerId > 0 && led.DrCr == false) ? led.OpeningBalance : 0),
                             }).ToList();

            if (transactionRecords.Count == 0)// && dataList1.Count == 0)
            {
                var dToday = DateTime.Now.Date;
                var fYId = AccountingTransferData.GetFiscalYearIdByDate(_accountingDbContext, dToday, currentHospitalId);
                dataList.Add(new DataListDTOModel
                {
                    FiscalYearId = fYId,
                    AmountDr = ((led.DrCr == true) ? led.OpeningBalance : 0),
                    AmountCr = ((led.DrCr == false) ? led.OpeningBalance : 0)
                });

            }
            else if (dataList1.Count > 0)
            {
                dataList1.ForEach(ss =>
                {
                    dataList.Add(
                        new DataListDTOModel
                        {
                            FiscalYearId = dataList1[0].FiscalYearId,
                            AmountDr = (transactionRecords.Count == 0 && led.DrCr == true) ? dataList1[0].AmountDr : dataList1[0].AmountDr,
                            AmountCr = (transactionRecords.Count == 0 && led.DrCr == false) ? dataList1[0].AmountCr : dataList1[0].AmountCr
                        });
                });

            }


            var recnsRecords = (from t in transactionRecords
                                join r in _accountingDbContext.BankReconciliationModel on
                         t.LedgerId equals r.LedgerId
                                where t.HospitalId == r.HospitalId && t.VoucherNumber == r.VoucherNumber && t.FiscalyearId == r.FiscalyearId
                                select r).ToList();

            var VouchersWithReconciliation = (from itm in transactionRecords

                                              select new
                                              {
                                                  TransactionDate = itm.TransactionDate,
                                                  VoucherNumber = itm.VoucherNumber,
                                                  VoucherName = itm.VoucherName,
                                                  LedgerDr = (itm.DrCr == true) ? itm.Amount : 0,
                                                  LedgerCr = (itm.DrCr == false) ? itm.Amount : 0,
                                                  Amount = itm.Amount,
                                                  DrCr = itm.DrCr,
                                                  AmountCr = dataList[0].AmountCr,
                                                  AmountDr = dataList[0].AmountDr,
                                                  Balance = 0,
                                                  BalanceType = true,
                                                  OpeningBalance = itm.OpeningBalance,
                                                  OpeningBalanceType = itm.OpeningBalanceType,
                                                  DepartmentName = "TempTest",
                                                  Description = itm.Description,
                                                  SectionId = itm.SectionId,
                                                  FiscalYearId = itm.FiscalyearId,
                                                  BankReconciliationTxn = (from b in recnsRecords
                                                                           where b.HospitalId == itm.HospitalId && b.FiscalyearId == itm.FiscalyearId
                                                         && b.VoucherNumber == itm.VoucherNumber && b.LedgerId == itm.LedgerId
                                                                           select b).OrderByDescending(t => t.Id).FirstOrDefault(),
                                                  TransactionId = itm.TransactionId,
                                                  ledgerId = itm.LedgerId,
                                              }).ToList();


            var FinalData = new
            {
                VouchersWithReconciliation,
                dataList
            };
            return FinalData;

        }
        private object GetVoucherForVerification(int currentHospitalId,DateTime FromDate, DateTime ToDate, int sectionId)
        {
            var SectionList = AccountingBL.GetSections(_accountingDbContext, currentHospitalId);
            var txnList = (from txn in _accountingDbContext.Transactions
                           where txn.HospitalId == currentHospitalId
                           join voucher in _accountingDbContext.Vouchers on txn.VoucherId equals voucher.VoucherId
                           join fiscal in _accountingDbContext.FiscalYears on txn.FiscalyearId equals fiscal.FiscalYearId
                           join map in _accountingDbContext.MapFiscalYears on fiscal.FiscalYearId equals map.FiscalYearId
                           where
                           voucher.HospitalId ==currentHospitalId && map.HospitalId == currentHospitalId &&
                           txn.IsActive == true && (DbFunctions.TruncateTime(txn.TransactionDate) >= FromDate && DbFunctions.TruncateTime(txn.TransactionDate) <= ToDate)
                            && txn.SectionId == sectionId && txn.IsVerified == false //&& txn.Status == Enums.ENUM_ACC_VoucherStatus.Draft
                           select new
                           {
                               TransactionId = txn.TransactionId,
                               FiscalYear = fiscal.FiscalYearName,
                               VoucherNumber = txn.VoucherNumber,
                               VoucherType = voucher.VoucherName,
                               SectionId = txn.SectionId,
                               TransactionDate = DbFunctions.TruncateTime(txn.TransactionDate),                                     
                               Amount = (from txnItm in _accountingDbContext.TransactionItems
                                         where txnItm.TransactionId == txn.TransactionId
                                         && txnItm.HospitalId == currentHospitalId
                                         && txnItm.DrCr == true
                                         group txnItm by new
                                         {
                                             txnItm.DrCr
                                         } into g
                                         select g.Sum(x => x.Amount)
                                         ).FirstOrDefault(),
                               Narration = txn.Remarks
                           }).OrderByDescending(a => a.TransactionId).ToList();

            var finalData = (from t in txnList
                             group new { t } by new
                             {
                                 t.VoucherNumber,
                                 t.FiscalYear,
                                 t.VoucherType,
                                 t.TransactionDate,
                                 t.SectionId,
                                 t.Narration
                             }
                            into x
                             select new
                             {
                                 FiscalYear = x.Key.FiscalYear,
                                 VoucherNumber = x.Key.VoucherNumber,
                                 VoucherType = x.Key.VoucherType,
                                 TransactionDate = x.Key.TransactionDate,
                                 Amount = x.Sum(y => y.t.Amount),
                                 SectionId = x.Key.SectionId,
                                 SectionName = SectionList.Where(s => s.SectionId == x.Key.SectionId).Select(a => a.SectionName).FirstOrDefault(),
                                 Narration = x.Key.Narration
                             }).OrderByDescending(a => a.TransactionDate).ToList();
            return finalData;
        }
    }
    public class DataListDTOModel
    {
        public int FiscalYearId { get; set; }
        public decimal AmountDr { get; set; }
        public decimal AmountCr { get; set; }
        public int LedgerId { get; set; }
    }

}
