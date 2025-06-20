﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DanpheEMR.Core.Caching;
using DanpheEMR.ServerModel;
using DanpheEMR.DalLayer;
using DanpheEMR.Sync.IRDNepal.Models;
using Newtonsoft.Json;
using System.Configuration;
using DanpheEMR.ServerModel.LabModels;
using DanpheEMR.Enums;
using DanpheEMR.ServerModel.PatientModels;
using OfficeOpenXml.FormulaParsing.Excel.Functions.Text;
/*File: LabsBL.cs
* created: 12Sept'18 <sud>
* Description: This class contains common functions used in Labs-Controllers.
* Remarks: <needs refinement>
*/

namespace DanpheEMR.Labs
{
    public class LabsBL
    {
        public static List<EmployeeModel> empList;
        public static string CovidFileUrlCommon;
        public static LabReportVM GetLabReportVMForReqIds(LabDbContext labDbContext, List<Int64> reqIdList, string covidFileUrlCommon)
        {
            empList = labDbContext.Employee.ToList();
            CovidFileUrlCommon = covidFileUrlCommon;
            List<LabResult_Denormalized_VM> resultsDenormalized = GetResultsDenormalized(labDbContext, reqIdList);
            LabReportVM retReport = FormatResultsForLabReportVM(resultsDenormalized, labDbContext);
            return retReport;
        }
        /// <summary>
        /// This function gives a flat list with all possible properties from the combination of LabReport, Requisition, Result, LabTest, etc.. 
        /// Which is later used to transform to our required return type.
        /// </summary>
        /// <param name="labDbContext"></param>
        /// <param name="reqIdList"></param>
        /// <returns></returns>
        public static List<LabResult_Denormalized_VM> GetResultsDenormalized(LabDbContext labDbContext, List<Int64> reqIdList)
        {
            var resultDetails = (from req in labDbContext.Requisitions
                                 join pat in labDbContext.Patients on req.PatientId equals pat.PatientId
                                 join test in labDbContext.LabTests on req.LabTestId equals test.LabTestId
                                 join template in labDbContext.LabReportTemplates on req.ReportTemplateId equals template.ReportTemplateID
                                 from doc in labDbContext.Employee.Where(emp => emp.EmployeeId == req.PrescriberId).DefaultIfEmpty()
                                 from comp in labDbContext.LabTestComponentResults.Where(cmp => cmp.RequisitionId == req.RequisitionId && cmp.IsActive == true).DefaultIfEmpty()
                                 from rept in labDbContext.LabReports.Where(rpt => rpt.LabReportId == req.LabReportId).DefaultIfEmpty()
                                 from billitm in labDbContext.BillingTransactionItems.Where(rpt => rpt.BillingTransactionItemId == req.BillingTransactionItemId).DefaultIfEmpty()
                                 from refDoc in labDbContext.Employee.Where(emp => emp.EmployeeId == billitm.ReferredById).DefaultIfEmpty()
                                     //changed below condition by sudd.. to avoid null exception.. 
                                     //from doc in labDbContext.Employee.Where(e => req.ProviderId.HasValue && req.ProviderId.Value == e.EmployeeId).DefaultIfEmpty()
                                 where reqIdList.Contains(req.RequisitionId)
                                 select new LabResult_Denormalized_VM()
                                 {

                                     Email = pat.Email,
                                     LabTypeName = req.LabTypeName,
                                     PatientId = pat.PatientId,
                                     PatientName = pat.FirstName + " " + (string.IsNullOrEmpty(pat.MiddleName) ? "" : pat.MiddleName + " ") + pat.LastName,
                                     PatientCode = pat.PatientCode,
                                     Gender = pat.Gender,
                                     DOB = pat.DateOfBirth,
                                     PhoneNumber = pat.PhoneNumber,
                                     Address = pat.Address,
                                     CountrySubDivisionName = (from subDiv in labDbContext.CountrySubdivisions
                                                               where subDiv.CountrySubDivisionId == pat.CountrySubDivisionId
                                                               select subDiv.CountrySubDivisionName).FirstOrDefault(),
                                     MunicipalityName = (from mun in labDbContext.Municipalities
                                                         where mun.MunicipalityId == pat.MunicipalityId
                                                         select mun.MunicipalityName).FirstOrDefault(),
                                     CountryName = (from country in labDbContext.Countries
                                                    where country.CountryId == pat.CountryId
                                                        select country.CountryName).FirstOrDefault(),

                                     PrescriberId = (int?)req.PrescriberId,
                                     ReferredById = (int?)billitm.ReferredById,
                                     ReferredByName = rept == null ? (billitm.ReferredById  != null ? (string.IsNullOrEmpty(refDoc == null ? "" : refDoc.FullName) ? refDoc == null ? "" : refDoc.FullName : refDoc == null ? "" : refDoc.FullName) : "SELF1") : refDoc.FullName,

                                     //ashim: 06Sep2018 : Report details are saved only in final report. So we don't have report details in pending report.
                                     //ReferredByName will be: LongSignature (for internal), Or FullName (for external), or SELF for NULL, or Existing value based on conditions.
                                     PrescriberName = rept == null ? (req.PrescriberId != null ? (string.IsNullOrEmpty(doc == null ? "" : doc.FullName) ? doc == null? "" : doc.FullName : doc == null ? "" : doc.FullName) : "SELF") : rept.PrescriberName,
                                     ReceivingDate = rept == null ? ((req.RunNumberType.ToLower() == ENUM_LabRunNumType.histo || req.RunNumberType.ToLower() == ENUM_LabRunNumType.cyto) ? req.OrderDateTime : req.SampleCreatedOn) : rept.ReceivingDate,
                                     //ReceivingDate = rept == null ? ((req.RunNumberType.ToLower() == "histo" || req.RunNumberType.ToLower() == "cyto") ? req.OrderDateTime : req.SampleCreatedOn) : rept.ReceivingDate,
                                     ReportingDate = rept == null ? DateTime.Now : rept.ReportingDate,
                                     SampleDate = req.SampleCreatedOn,
                                     SampleCode = req.SampleCode,
                                     SampleCodeFormatted = req.SampleCodeFormatted,
                                     BillingStatus = req.BillingStatus,
                                     Specimen = req.LabTestSpecimen,
                                     ColSettingsJSON = template.ColSettingsJSON,
                                     Comments = req.Comments,
                                     LabReportComments = rept == null? "" : rept.Comments,
                                     ComponentName = comp == null ? "" :comp.ComponentName,
                                     CreatedBy = req.CreatedBy,
                                     CreatedOn = req.CreatedOn,
                                     ReportCreatedBy = rept == null ? 0 : rept.CreatedBy,
                                     ReportCreatedOn = rept ==  null ? DateTime.Now : rept.CreatedOn,
                                     Description = template.Description,
                                     DiagnosisId = req.DiagnosisId,
                                     TestDisplaySequence = test.DisplaySequence,
                                     FooterText = template.FooterText,
                                     HasNegativeResults = test.HasNegativeResults,
                                     HeaderText = template.HeaderText,
                                     Interpretation = test.Interpretation,
                                     IsAbnormal = comp == null ? false: comp.IsAbnormal,
                                     AbnormalType = comp == null ? "" :comp.AbnormalType,
                                     IsActive_Test = test.IsActive,
                                     IsDefault = template.IsDefault,
                                     IsNegativeResult = comp == null ? false : comp.IsNegativeResult,
                                     IsPrinted =  rept == null ? false : rept.IsPrinted,
                                     LabReportId = rept == null ? 0 : rept.LabReportId,
                                     LabTestComponentsJSON = new object(),
                                     LabTestId = test.LabTestId,
                                     LabTestName = test.LabTestName,
                                     LabTestSpecimen = test.LabTestSpecimen,
                                     LabTestSpecimenSource = test.LabTestSpecimenSource,
                                     Method = comp == null ? "" : comp.Method,
                                     ModifiedBy = req.ModifiedBy,
                                     ModifiedOn = req.ModifiedOn,
                                     NegativeResultText = test.NegativeResultText,
                                     OrderDateTime = req.OrderDateTime,
                                     OrderStatus = req.OrderStatus,
                                     PatientVisitId = req.PatientVisitId,
                                     ProviderId = req.PrescriberId,
                                     ProviderName = req.PrescriberName,
                                     Range = comp == null ? "" : comp.Range,
                                     RangeDescription = comp == null ? "" : comp.RangeDescription,
                                     ReferredByDr = rept == null? "" : rept.PrescriberName,
                                     Remarks = comp == null ? "" : comp.Remarks,
                                     ReportingName = test.ReportingName,
                                     ReportTemplateId = template.ReportTemplateID,
                                     ReportTemplateName = template.ReportTemplateName,
                                     ReportTemplateShortName = template.ReportTemplateShortName,
                                     RequisitionId = req.RequisitionId,
                                     RequisitionRemarks = req.RequisitionRemarks,
                                     ResultGroup = comp == null ? 0 : comp.ResultGroup,
                                     ResultingVendorId = req.ResultingVendorId,
                                     SampleCreatedBy = req.SampleCreatedBy,
                                     SampleCreatedOn = req.SampleCreatedOn,
                                     Signatories = rept == null? "" : rept.Signatories,
                                     VerifiedBy = req.VerifiedBy,
                                     VerifiedOn = req.VerifiedOn,
                                     TemplateHTML = template.TemplateHTML,
                                     TemplateId = template.ReportTemplateID,
                                     TemplateType = template.TemplateType,
                                     Unit = comp == null ? "" : comp.Unit,
                                     Urgency = req.Urgency,
                                     Value = comp == null ? "" : comp.Value,
                                     TestComponentResultId = comp.TestComponentResultId,
                                     IsActive_Component = comp == null ? false : comp.IsActive,
                                     VisitType = req.VisitType,
                                     RunNumberType = req.RunNumberType,
                                     TemplateDisplaySequence = template.DisplaySequence,
                                     HasInsurance = req.HasInsurance,
                                     PrintCount = rept == null ? 0 : rept.PrintCount,
                                     PrintedBy = rept == null ? 0 : rept.PrintedBy,
                                     PrintedOn = rept == null? DateTime.Now : rept.PrintedOn,
                                     PrintedByName = "",
                                     CovidFileUrl = string.IsNullOrEmpty(CovidFileUrlCommon) ? "" : CovidFileUrlCommon.Replace("GGLFILEUPLOADID", req.GoogleFileId),
                                     IsFileUploadedToTeleMedicine = req.IsFileUploadedToTeleMedicine,
                                     PassPortNumber = pat.PassportNumber,
                                     WardName = req.WardName,
                                     IsLISApplicable = test.IsLISApplicable,
                                 }).ToList();


            return resultDetails;
        }       

        public static LabReportVM FormatResultsForLabReportVM(List<LabResult_Denormalized_VM> resultSets, LabDbContext labDbContext)
        {
            LabReportVM retData = (from r in resultSets
                                   select new LabReportVM()
                                   {
                                       Columns = r.ColSettingsJSON,
                                       FooterText = r.FooterText,
                                       Header = r.HeaderText,
                                       ReportId = r.LabReportId,
                                       Signatories = r.Signatories,
                                       TemplateType = r.TemplateType,
                                       TemplateHTML = r.TemplateHTML,
                                       Comments = r.LabReportComments,
                                       IsPrinted = r.IsPrinted,
                                       CreatedBy = r.CreatedBy,
                                       CreatedOn = r.CreatedOn,
                                       ReportCreatedBy = r.ReportCreatedBy,
                                       ReportCreatedOn = r.ReportCreatedOn,
                                       PrintCount = r.PrintCount,
                                       PrintedBy = r.PrintedBy,
                                       HasInsurance = r.HasInsurance,
                                       PrintedByName = (from emp in empList
                                                        where emp.EmployeeId == r.PrintedBy
                                                        select emp.FirstName + " " + emp.LastName).FirstOrDefault(),
                                       PrintedOn = r.PrintedOn,
                                       CovidFileUrl = r.CovidFileUrl,
                                       Email = r.Email,
                                       IsFileUploadedToTeleMedicine = r.IsFileUploadedToTeleMedicine
                                   }).GroupBy(tmp => tmp.TemplateType).Select(group => group.First()).FirstOrDefault();



            retData.Lookups = GetLookup(labDbContext,resultSets);
            retData.Templates = GetTemplateVM(resultSets, labDbContext);
            return retData;
        }

        /// <summary>
        /// this function gets only lookup part from the denormalized result sets.
        /// </summary>
        /// <param name="resultSets"></param>
        /// <returns></returns>
        public static ReportLookup GetLookup(LabDbContext labDbContext, List<LabResult_Denormalized_VM> resultSets)
        {
            var PatientId = resultSets.FirstOrDefault().PatientId;
            PatientSchemeMapModel SchemeMap = labDbContext.PatientSchemeMap.Where(a => a.PatientId == PatientId).FirstOrDefault();
            ReportLookup lookups = (from r in resultSets
                                    select new ReportLookup
                                    {
                                        LabTypeName = r.LabTypeName,
                                        Address = r.Address,
                                        DOB = r.DOB,
                                        Gender = r.Gender,
                                        PatientCode = r.PatientCode,
                                        PatientName = r.PatientName,
                                        PatientId = r.PatientId,
                                        PhoneNumber = r.PhoneNumber,
                                        ReceivingDate = r.ReceivingDate,
                                        ReportingDate = r.ReportingDate,
                                        PrescriberName = r.PrescriberName,
                                        PrescriberId = r.PrescriberId,
                                        ReferredById = r.ReferredById,
                                        ReferredByName = r.ReferredByName,
                                        SampleCode = r.SampleCode,
                                        SampleCodeFormatted = r.SampleCodeFormatted,
                                        SampleDate = r.SampleDate,
                                        VerifiedOn = r.VerifiedOn,
                                        VisitType = r.VisitType,
                                        RunNumberType = r.RunNumberType,
                                        Specimen = r.Specimen,
                                        MunicipalityName = r.MunicipalityName,
                                        CountrySubDivisionName = r.CountrySubDivisionName,
                                        CountryName = r.CountryName,
                                        WardNumber = r.WardNumber,
                                        ProfilePictureName = getProfilePicture(labDbContext,r.PatientId),
                                        PassPortNumber = r.PassPortNumber,
                                        WardName = r.WardName,
                                        PolicyNumber = SchemeMap != null? SchemeMap.PolicyNo : "",
                                    }
                            ).FirstOrDefault();
            return lookups;
        }
       
        public static string getProfilePicture(LabDbContext labDbContext, int patientId)
        {
            var location = (from dbc in labDbContext.AdminParameters
                            where dbc.ParameterGroupName.ToLower() == "patient" && dbc.ParameterName == "PatientProfilePicImageUploadLocation"
                            select dbc.ParameterValue
            ).FirstOrDefault();

            PatientFilesModel retFile = labDbContext.PatientFiles
                                       .Where(f => f.PatientId == patientId && f.IsActive == true
                                       && f.FileType == "profile-pic")
                                       .FirstOrDefault();

            if (retFile != null)
            {
                var fileFullPath = location + retFile.FileName;
                byte[] imageArray = System.IO.File.ReadAllBytes(@fileFullPath);
                retFile.FileBase64String = Convert.ToBase64String(imageArray);
                return retFile.FileBase64String;
            }
            else
            {
                return null; 
            }

        }

        /// <summary>
        /// Gets unique templates based on templatetype(eg: normal, html, culture etc)
        /// we do loop inside each template and assign tests to them from the same source (denormalized result set)
        /// </summary>
        /// <param name="resultSets"></param>
        /// <returns></returns>
        public static List<LabReportTemplateVM> GetTemplateVM(List<LabResult_Denormalized_VM> resultSets, LabDbContext labDbContext)
        {
            List<LabReportTemplateVM> templates = (from r in resultSets
                                                   select new LabReportTemplateVM()
                                                   {
                                                       FooterText = r.FooterText,
                                                       HeaderText = r.HeaderText,
                                                       TemplateHtml = r.TemplateHTML,
                                                       TemplateId = r.TemplateId,
                                                       TemplateName = r.ReportTemplateName,
                                                       TemplateType = r.TemplateType,
                                                       DisplaySequence = r.TemplateDisplaySequence,
                                                       Tests = new object(),
                                                       TemplateColumns = r.ColSettingsJSON//sud: 19Sept'18-- to show hide columns in template's scope.
                                                   }).GroupBy(tmp => tmp.TemplateId).Select(group => group.First()).OrderBy(a => a.DisplaySequence).ToList();

            if (templates != null && templates.Count > 0)
            {
                foreach (var tmp in templates)
                {
                    tmp.Tests = GetTestsOfTemplate(resultSets, tmp.TemplateId, labDbContext);
                }
            }

            return templates;
        }

        public static List<LabTest_Temp_VM> GetTestsOfTemplate(List<LabResult_Denormalized_VM> resultSets, int? templateId, LabDbContext labDbContext)
        {

            List<LabTest_Temp_VM> retData = (from r in resultSets
                                             where templateId == r.TemplateId
                                             select new LabTest_Temp_VM()
                                             {
                                                 TestName = r.LabTestName,
                                                 ReportingName = r.ReportingName,
                                                 LabTestId = r.LabTestId,
                                                 Comments = r.Comments,
                                                 ComponentJSON = new object(),
                                                 DisplaySequence = r.TestDisplaySequence,
                                                 HasNegativeResults = r.HasNegativeResults,
                                                 Interpretation = r.Interpretation,
                                                 NegativeResultText = r.NegativeResultText,
                                                 RequestDate = r.OrderDateTime,
                                                 RequisitionId = r.RequisitionId,
                                                 Components = null,
                                                 Specimen = r.Specimen,
                                                 BillingStatus = r.BillingStatus,
                                                 ResultingVendorId = r.ResultingVendorId,
                                                 VendorDetail = new LabVendorsModel(),
                                                 SampleCollectedBy = (from employee in empList
                                                                      where employee.EmployeeId == r.SampleCreatedBy
                                                                      select employee.FirstName + " " + (string.IsNullOrEmpty(employee.MiddleName) ? "" : employee.MiddleName + " ") + employee.LastName).FirstOrDefault(),
                                                 SampleCollectedOn = r.SampleCreatedOn,
                                                 HasInsurance = r.HasInsurance,
                                                 VerifiedBy = r.VerifiedBy,
                                                 VerifiedOn = r.VerifiedOn,
                                                 IsLISApplicable = r.IsLISApplicable,
                                             }).GroupBy(tmp => tmp.RequisitionId).Select(group => group.First()).OrderBy(test => test.DisplaySequence).ToList();
            //Removed this to get same test for Multiple times for same patient
            //.GroupBy(tmp => tmp.LabTestId).Select(group => group.First()).OrderBy(test => test.DisplaySequence).ToList();

            if (retData != null && retData.Count > 0)
            {
                foreach (var tst in retData)
                {
                    tst.VendorDetail = (from vendor in labDbContext.LabVendors
                                        where vendor.LabVendorId == tst.ResultingVendorId
                                        select vendor).FirstOrDefault();
                    tst.ComponentJSON = (from labtest in labDbContext.LabTests
                                         join componentMap in labDbContext.LabTestComponentMap on labtest.LabTestId equals componentMap.LabTestId
                                         join component in labDbContext.LabTestComponents on componentMap.ComponentId equals component.ComponentId
                                         where labtest.LabTestId == tst.LabTestId && componentMap.IsActive == true
                                         select new
                                         {
                                             ComponentId = component.ComponentId,
                                             ComponentName = component.ComponentName,
                                             Unit = component.Unit,
                                             ValueType = component.ValueType,
                                             ControlType = component.ControlType,
                                             Range = component.Range,
                                             RangeDescription = component.RangeDescription,
                                             Method = component.Method,
                                             ValueLookup = component.ValueLookup,
                                             MinValue = component.MinValue,
                                             MaxValue = component.MaxValue,
                                             DisplayName = component.DisplayName,
                                             DisplaySequence = componentMap.DisplaySequence,
                                             IndentationCount = componentMap.IndentationCount,
                                             ShowInSheet = componentMap.ShowInSheet,
                                             ComponentMapId = componentMap.ComponentMapId,
                                             MaleRange = component.MaleRange,
                                             FemaleRange = component.FemaleRange,
                                             ChildRange = component.ChildRange,
                                             GroupName = componentMap.GroupName,
                                             IsAutoCalculate = componentMap.IsAutoCalculate,
                                             CalculationFormula = componentMap.CalculationFormula,
                                             FormulaDescription = componentMap.FormulaDescription,
                                             ValuePrecision = component.ValuePrecision,
                                             ShowRangeDescriptionInLabReport = component.ShowRangeDescriptionInLabReport,
                                         }).ToList();
                    tst.Components = GetResulsOfTestRequisition(resultSets, tst.RequisitionId);
                    tst.MaxResultGroup = tst.Components.Max(v => v.ResultGroup);
                    tst.MaxResultGroup = tst.MaxResultGroup.HasValue ? tst.MaxResultGroup.Value : 1;
                }
            }

            return retData;
        }

        public static List<LabTestComponentResult> GetResulsOfTestRequisition(List<LabResult_Denormalized_VM> resultSets, Int64 requisitionId)
        {
            List<LabTestComponentResult> retData = (from r in resultSets
                                                    where r.RequisitionId == requisitionId
                                                    && r.IsActive_Component == true
                                                    select new LabTestComponentResult()
                                                    {
                                                        TestComponentResultId = r.TestComponentResultId.HasValue ? r.TestComponentResultId.Value : 0,
                                                        ComponentName = r.ComponentName,
                                                        Value = r.Value,
                                                        Unit = r.Unit,
                                                        Range = r.Range,
                                                        RangeDescription = r.RangeDescription,
                                                        Remarks = r.Remarks,
                                                        CreatedOn = r.CreatedOn,
                                                        IsAbnormal = r.IsAbnormal,
                                                        AbnormalType = r.AbnormalType,
                                                        IsNegativeResult = r.IsNegativeResult,
                                                        Method = r.Method,
                                                        ResultGroup = r.ResultGroup
                                                    }).ToList();
            if (retData != null && retData.Count > 0 && retData[0].TestComponentResultId == 0)
            {
                retData = new List<LabTestComponentResult>();
            }

            return retData;
        }

    }

}
