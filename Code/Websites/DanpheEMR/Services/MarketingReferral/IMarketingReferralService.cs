﻿using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.Services.MarketingReferral.DTOs;
using DanpheEMR.Services.Utilities.DTOs;
using System;

namespace DanpheEMR.Services.MarketingReferral
{
    public interface IMarketingReferralService
    {
        object GetInvoice(MarketingReferralDbContext marketingReferralDbContext, DateTime fromDate, DateTime toDate);
        object GetBillDetails(MarketingReferralDbContext marketingReferralDbContext,int billTransactionId);
        object GetReferralScheme(MarketingReferralDbContext marketingReferralDbContext);
        object GetReferringParty(MarketingReferralDbContext marketingReferralDbContext);
        object GetReferringPartyGroup(MarketingReferralDbContext marketingReferralDbContext);
        object GetReferringOrganizationList(MarketingReferralDbContext marketingReferralDbContext);
        object GetAlreadyAddedCommission(MarketingReferralDbContext marketingReferralDbContext, int billTransactionId);
        object GetMarketingreferralDetailReport(MarketingReferralDbContext marketingReferralDbContext, DateTime fromDate, DateTime toDate, int? ReferralComissionId, int? referringPartyGroupId, string areaCode, int? referringOrganizationId);
        object GetMasterDataForFilter(MarketingReferralDbContext marketingReferralDbContext);
        object GetPatientVisitWiseReferralCommission(MarketingReferralDbContext marketingReferralDbContext, string fromDate, string toDate);
        object GetPatientReferralCommissionDetails(MarketingReferralDbContext marketingReferralDbContext, int patientVisitId);
        object DeleteReferralCommission(MarketingReferralDbContext marketingReferralDbContext, int ReferralCommissionId);
        object AddNewReferralComission(RbacUser currentUser, ReferralCommission_DTO referralCommission_DTO, MarketingReferralDbContext marketingReferralDbContext);
        object AddNewReferringOrganization(RbacUser currentUser, ReferringOrganization_DTO referringOrganization_DTO, MarketingReferralDbContext marketingReferralDbContext);
        object AddNewReferringParty(RbacUser currentUser, ReferringParty_DTO referringParty_DTO, MarketingReferralDbContext marketingReferralDbContext);
        object AddNewReferralScheme(RbacUser currentUser, ReferralScheme_DTO referralScheme, MarketingReferralDbContext marketingReferralDbContext);
        object SavePatientReferralCommission(RbacUser currentUser, PatientVisitLevelReferralCommission_DTO patientVisitLevelReferral, MarketingReferralDbContext marketingReferralDbContext);
        object UpdateReferringOrganization(RbacUser currentUser, ReferringOrganization_DTO referringOrganization_DTO, MarketingReferralDbContext marketingReferralDbContext);
        object UpdateReferringParty(RbacUser currentUser, ReferringParty_DTO referringParty_DTO, MarketingReferralDbContext marketingReferralDbContext);
        object UpdateReferralScheme(RbacUser currentUser, ReferralScheme_DTO referralScheme, MarketingReferralDbContext marketingReferralDbContext);
        object UpdateActivateDeactivateOrganization( ReferringOrganization_DTO referringOrganization_DTO, RbacUser currentUser, MarketingReferralDbContext marketingReferralDbContext);
        object ActivateDeactivateParty(ReferringParty_DTO referringParty_DTO, RbacUser currentUser, MarketingReferralDbContext marketingReferralDbContext);
        object ActivateDeactivateReferralScheme(RbacUser currentUser, int referralSchemeId, MarketingReferralDbContext marketingReferralDbContext);
        object DeletePatientReferralCommission(RbacUser currentUser, int patientReferralCommissionId, MarketingReferralDbContext marketingReferralDbContext);

    }
}
