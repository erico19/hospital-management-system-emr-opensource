﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel
{
    public class LabReportModel
    {
        [Key]
        public int LabReportId { get; set; }
        public int PatientId { get; set; }
        public int? TemplateId { get; set; }
        public DateTime ReceivingDate { get; set; }
        public DateTime ReportingDate { get; set; }
        public bool IsPrinted { get; set; }
        public string Signatories { get; set; }
        public DateTime CreatedOn { get; set; }
        public int CreatedBy { get; set; }
        public bool IsActive { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public DateTime? PrintedOn { get; set; }
        public int? PrintedBy { get; set; }
        public int? PrintCount { get; set; }

        public string PrescriberName { get; set; } // Dev : 16June'22 Changed ReferredByDr to PrescriberName
        public string Comments { get; set; }

        [NotMapped]
        public List<int> ComponentIdList { get; set; }
        [NotMapped]
        public bool ValidToPrint { get; set; }
        [NotMapped]
        public bool? VerificationEnabled { get; set; }
        [NotMapped]
        public bool PreVerificationEnabled { get; set; }
        [NotMapped]
        public string CovidFileUrl { get; set; }
        public DateTime CreatedDay { get; set; } = DateTime.Now.Date;
        [NotMapped]
        public string ReferredByName { get; set; } //Bibek 12Dec'24 Added ReferredBy name in report of lab
    }

}
