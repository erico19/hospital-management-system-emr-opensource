﻿using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.Utilities;
using Microsoft.Extensions.Options;
using OfficeOpenXml.FormulaParsing.Excel.Functions.Text;

namespace DanpheEMR.Services.QueueManagement
{
    public class QueueManagementService : IQueueManagementService
    {
        public QueueManagementDbContext queueManagementDbContext;
        public string connStr;
        public QueueManagementService(IOptions<MyConfiguration> _config)
        {
            this.connStr = _config.Value.Connectionstring;
            queueManagementDbContext = new QueueManagementDbContext(connStr);
        }

        public dynamic GetDepartment()
        {
            var departmentdetails = queueManagementDbContext.Department.Where(x => x.IsAppointmentApplicable == true).ToList();
            return departmentdetails;
        }

        public dynamic GetAppointmentData(int deptId, List<int?> doctorId, bool pendingOnly)
        {
            //List<int?> doctorIdList = DanpheJSONConvert.DeserializeObject<List<int?>>(doctorId);

            var visitVMList = (from visit in queueManagementDbContext.Visits
                               join department in queueManagementDbContext.Department on visit.DepartmentId equals department.DepartmentId
                               join patient in queueManagementDbContext.Patients on visit.PatientId equals patient.PatientId
                               where ((visit.VisitStatus == "initiated")
                                     && visit.VisitDate == DbFunctions.TruncateTime(System.DateTime.Now) && visit.VisitType != ENUM_VisitType.inpatient) && visit.BillingStatus != ENUM_BillingStatus.returned
                                     && (department.DepartmentId == deptId || deptId == 0)
                                     && (doctorId.Contains(visit.PerformerId) || doctorId.Count == 0)

                               //&& (doctorIdList.Contains(visit.PerformerId) || doctorIdList.Count == 0)

                               //&& (visit.PerformerId == doctorId || doctorId == 0)
                               //&& (visit.PerformerId.HasValue && doctorIdList.Contains(visit.PerformerId.Value) || doctorIdList.Count == 0) 
                               where visit.Ins_HasInsurance == false
                               select new
                               {
                                   PatientVisitId = visit.PatientVisitId,
                                   DepartmentId = department.DepartmentId,
                                   DepartmentName = department.DepartmentName,
                                   ProviderId = visit.PerformerId,
                                   ProviderName = visit.PerformerName,
                                   VisitDate = visit.VisitDate,
                                   QueueStatus = visit.QueueStatus,
                                   VisitType = visit.VisitType,
                                   AppointmentType = visit.AppointmentType,
                                   PatientId = patient.PatientId,
                                   PatientCode = patient.PatientCode,
                                   ShortName = patient.FirstName + " " + (string.IsNullOrEmpty(patient.MiddleName) ? "" : patient.MiddleName + " ") + patient.LastName,
                                   PhoneNumber = patient.PhoneNumber,
                                   DateOfBirth = patient.DateOfBirth,
                                   Gender = patient.Gender,
                                   QueueNo = visit.QueueNo,
                               }).OrderBy(v => v.QueueNo).AsQueryable();
            if (pendingOnly)
            {
                return visitVMList.Where(a => a.QueueStatus == "pending" || a.QueueStatus == null).ToList();
            }
            else
            {
                return visitVMList.ToList();
            }
        }

        public dynamic updateQueueStatus(string data, int visitId, RbacUser currentUser)
        {
            VisitModel visitModel = queueManagementDbContext.Visits.Where(a => a.PatientVisitId == visitId).FirstOrDefault();
            visitModel.QueueStatus = data;
            visitModel.ModifiedBy = currentUser.UserId;
            visitModel.ModifiedOn = DateTime.Now;
            queueManagementDbContext.Entry(visitModel).Property(a => a.ModifiedBy).IsModified = true;
            queueManagementDbContext.Entry(visitModel).Property(a => a.ModifiedOn).IsModified = true;
            queueManagementDbContext.Entry(visitModel).Property(a => a.QueueStatus).IsModified = true;
            queueManagementDbContext.SaveChanges();
            return visitModel;
        }


        public dynamic GetAllAppointmentApplicableDoctor()
        {
            var doctorList = queueManagementDbContext.Employees.Where(x => x.IsAppointmentApplicable == true && x.IsActive == true).ToList();
            return doctorList;
        }
    }
}
