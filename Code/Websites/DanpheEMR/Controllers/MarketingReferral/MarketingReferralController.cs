﻿using DanpheEMR.Controllers.Billing;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.Services.BillSettings.DTOs;
using DanpheEMR.Services.MarketingReferral;
using DanpheEMR.Services.MarketingReferral.DTOs;
using DanpheEMR.Services.Utilities.DTOs;
using DanpheEMR.Utilities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System;

namespace DanpheEMR.Controllers.Utilities
{
    public class MarketingReferralController : CommonController
    {
        private readonly IMarketingReferralService _IMarketingReferralService;
        private readonly MarketingReferralDbContext _MarketingReferralDbContext;
        public MarketingReferralController(IMarketingReferralService iMarketingReferralService, IOptions<MyConfiguration> _config) : base(_config)
        {
            _IMarketingReferralService = iMarketingReferralService;
            _MarketingReferralDbContext = new MarketingReferralDbContext(connString);
        }


        [HttpGet]
        [Route("Invoices")]
        public IActionResult GetInvoices(DateTime fromDate, DateTime toDate)
        {
            Func<object> func = () => _IMarketingReferralService.GetInvoice(_MarketingReferralDbContext, fromDate, toDate);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("BillDetails")]
        public IActionResult GetBillDetails(int billTransactionId)
        {
            Func<object> func = () => _IMarketingReferralService.GetBillDetails(_MarketingReferralDbContext, billTransactionId);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("ReferralScheme")]
        public IActionResult GetReferralScheme()
        {
            Func<object> func = () => _IMarketingReferralService.GetReferralScheme(_MarketingReferralDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("ReferringParty")]
        public IActionResult GetReferringParty()
        {
            Func<object> func = () => _IMarketingReferralService.GetReferringParty(_MarketingReferralDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("ReferringPartyGroup")]
        public IActionResult GetReferringPartyGroup()
        {
            Func<object> func = () => _IMarketingReferralService.GetReferringPartyGroup(_MarketingReferralDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("AlreadyAddedCommission")]
        public IActionResult GetAlreadyAddedCommission(int BillingTransactionId)
        {
            Func<object> func = () => _IMarketingReferralService.GetAlreadyAddedCommission(_MarketingReferralDbContext, BillingTransactionId);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("ReferringOrganization")]
        public IActionResult GetReferringOrganizationList()
        {
            Func<object> func = () => _IMarketingReferralService.GetReferringOrganizationList(_MarketingReferralDbContext);
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("MarketingReferralReport")]
        public IActionResult GetMarketingreferralDetailReport(DateTime fromDate, DateTime toDate, int? referringPartyId, int? referringPartyGroupId, string areaCode, int? referringOrganizationId)
        {
            Func<object> func = () => _IMarketingReferralService.GetMarketingreferralDetailReport(_MarketingReferralDbContext, fromDate, toDate, referringPartyId, referringPartyGroupId, areaCode, referringOrganizationId);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("GetMasterDataForFilter")]
        public IActionResult GetMasterDataForFilter()
        {
            Func<object> func = () => _IMarketingReferralService.GetMasterDataForFilter(_MarketingReferralDbContext);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("GetPatientVisitWiseReferralCommission")]
        public IActionResult GetPatientVisitWiseReferralCommission(string fromDate, string toDate)
        {
            Func<object> func = () => _IMarketingReferralService.GetPatientVisitWiseReferralCommission(_MarketingReferralDbContext, fromDate, toDate);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("GetPatientReferralCommissionDetails")]
        public IActionResult GetPatientReferralCommissionDetails(int patientVisitId)
        {
            Func<object> func = () => _IMarketingReferralService.GetPatientReferralCommissionDetails(_MarketingReferralDbContext, patientVisitId);
            return InvokeHttpGetFunction(func);
        }

        [HttpPost]
        [Route("NewReferralComission")]
        public IActionResult AddNewReferralComission([FromBody] ReferralCommission_DTO referralCommission_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IMarketingReferralService.AddNewReferralComission(currentUser, referralCommission_DTO, _MarketingReferralDbContext);
            return InvokeHttpPostFunction(func);
        }
        [HttpPost]
        [Route("NewReferringOrganization")]
        public IActionResult AddNewReferringOrganization([FromBody] ReferringOrganization_DTO referringOrganization_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IMarketingReferralService.AddNewReferringOrganization(currentUser, referringOrganization_DTO, _MarketingReferralDbContext);
            return InvokeHttpPostFunction(func);
        }
        [HttpPost]
        [Route("NewReferringParty")]
        public IActionResult AddNewReferringParty([FromBody] ReferringParty_DTO referringParty_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IMarketingReferralService.AddNewReferringParty(currentUser, referringParty_DTO, _MarketingReferralDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("ReferralScheme")]
        public IActionResult AddNewReferralScheme([FromBody] ReferralScheme_DTO referralScheme)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IMarketingReferralService.AddNewReferralScheme(currentUser, referralScheme, _MarketingReferralDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("PatientReferralCommission")]
        public IActionResult SavePatientReferralCommission([FromBody] PatientVisitLevelReferralCommission_DTO patientVisitLevelReferral)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IMarketingReferralService.SavePatientReferralCommission(currentUser, patientVisitLevelReferral, _MarketingReferralDbContext);
            return InvokeHttpPostFunction(func);
        }

        [HttpPut]
        [Route("ReferringOrganization")]
        public IActionResult UpdateReferringOrganization([FromBody] ReferringOrganization_DTO referringOrganization_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IMarketingReferralService.UpdateReferringOrganization(currentUser, referringOrganization_DTO, _MarketingReferralDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("ReferringParty")]
        public IActionResult UpdateReferringParty([FromBody] ReferringParty_DTO referringParty_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IMarketingReferralService.UpdateReferringParty(currentUser, referringParty_DTO, _MarketingReferralDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("ActivateDeactivateOrganization")]
        public IActionResult ActivateDeactivateOrganization([FromBody] ReferringOrganization_DTO referringOrganization_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IMarketingReferralService.UpdateActivateDeactivateOrganization(referringOrganization_DTO, currentUser, _MarketingReferralDbContext);
            return InvokeHttpPutFunction(func);
        }
        [HttpPut]
        [Route("ActivateDeactivateParty")]
        public IActionResult ActivateDeactivateParty([FromBody] ReferringParty_DTO referringParty_DTO)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IMarketingReferralService.ActivateDeactivateParty(referringParty_DTO, currentUser, _MarketingReferralDbContext);
            return InvokeHttpPutFunction(func);
        }
        [HttpPut]
        [Route("ReferralScheme")]
        public IActionResult UpdateReferralScheme([FromBody] ReferralScheme_DTO referralScheme)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IMarketingReferralService.UpdateReferralScheme(currentUser, referralScheme, _MarketingReferralDbContext);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("ActivateDeactivateReferralScheme")]
        public IActionResult ActivateDeactivateReferralScheme(int referralSchemeId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IMarketingReferralService.ActivateDeactivateReferralScheme(currentUser, referralSchemeId, _MarketingReferralDbContext);
            return InvokeHttpPutFunction(func);
        }
        
        [HttpPut]
        [Route("PatientReferralCommission")]
        public IActionResult DeletePatientReferralCommission(int patientReferralCommissionId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _IMarketingReferralService.DeletePatientReferralCommission(currentUser, patientReferralCommissionId, _MarketingReferralDbContext);
            return InvokeHttpPutFunction(func);
        }


        [HttpDelete]
        [Route("ReferralCommission")]
        public IActionResult DeleteReferralCommission(int ReferralCommissionId)
        {
            Func<object> func = () => _IMarketingReferralService.DeleteReferralCommission(_MarketingReferralDbContext, ReferralCommissionId);
            return InvokeHttpPostFunction(func);
        }

    }
}
