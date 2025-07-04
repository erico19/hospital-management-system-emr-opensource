﻿using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class ClinicalVitalsTransaction_DTO
    {
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int VitalsId { get; set; }
        public string VitalsValue { get; set; }
        public string Unit { get; set; }
        public string OtherVariable { get; set; }
        public string Remarks { get; set; }
        public bool IsActive { get; set; }

    }
}
