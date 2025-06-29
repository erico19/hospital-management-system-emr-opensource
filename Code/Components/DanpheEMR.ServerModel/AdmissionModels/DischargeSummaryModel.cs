﻿using DanpheEMR.ServerModel.AdmissionModels;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel
{
    public class DischargeSummaryModel
    {
        [DatabaseGeneratedAttribute(DatabaseGeneratedOption.Identity)]
        public int DischargeSummaryId { get; set; }

        //[Key, ForeignKey("Visit")]
        [Key]
        public int PatientVisitId { get; set; }
        public int DischargeTypeId { get; set; }
        //public int ConsultantId { get; set; }
        public int? DoctorInchargeId { get; set; }
        public string OperativeProcedure { get; set; }
        public string OperativeFindings { get; set; }
        public int? AnaesthetistsId { get; set; }
        public string Diagnosis { get; set; }
        public string CaseSummary { get; set; }
        public string Condition { get; set; }
        public string Treatment { get; set; }
        public string HistologyReport { get; set; }
        public string SpecialNotes { get; set; }
        public string Medications { get; set; }
        public string Allergies { get; set; }
        public string Activities { get; set; }
        public string Diet { get; set; }
        public string RestDays { get; set; }
        public string FollowUp { get; set; }
        public string Others { get; set; }
        //Ashim: 15Dec2017 : ResidenceDr is not mandatory
        public int? ResidenceDrId { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        //public virtual VisitModel Visit { get; set; }
        public bool? IsSubmitted { get; set; }
        public bool? IsDischargeCancel { get; set; }
        public string LabTests { get; set; }
        public int? DischargeConditionId { get; set; }
        public int? DeliveryTypeId { get; set; }
        public int? BabyBirthConditionId { get; set; }
        public int? DeathTypeId { get; set; }
        public string DeathPeriod { get; set; }
        public string AdviceOnDischarge { get; set; }
        [NotMapped]
        public virtual List<DischargeSummaryMedication> DischargeSummaryMedications { get; set; }
        [NotMapped]
        public virtual List<BabyBirthDetailsModel> BabyBirthDetails { get; set; }

        public int? NotesId { get; set; }
        public string ChiefComplaint { get; set; }
        public string PendingReports { get; set; }
        public string HospitalCourse { get; set; }
        public string PresentingIllness { get; set; }
        public string ProcedureNts { get; set; }
        public string SelectedImagingItems { get; set; }
        public string DiagnosisFreeText { get; set; }
        public string ProvisionalDiagnosis { get; set; }
        public string ObstetricHistory { get; set; }
        public string RelevantMaternalHistory { get; set; }
        public string IndicationForAdmission { get; set; }
        public string RespiratorySystem { get; set; }
        public string CardiovascularSystem { get; set; }
        public string GastrointestinalAndNutrition { get; set; }
        public string Renal { get; set; }
        public string NervousSystem { get; set; }
        public string Metabolic { get; set; }
        public string Sepsis { get; set; }
        public string CongenitalAnomalies { get; set; }
        public string Reflexes { get; set; }
        public string MedicationsReceivedInNICUNursery { get; set; }
        public string Discussion { get; set; }

        [NotMapped]
        public List<ADTDischargeSummaryConsultantModel> DischargeSummaryConsultants { get; set; }

        public string BabyWeight { get; set; } // Krishna, 17th,May'22, Fishtail Specific Changes
        public int? CheckedBy { get; set; } // Krishna, 17th,May'22, Fishtail Specific Changes
        public string ClinicalFindings { get; set; } //Rusha, 30th June'22, added for BIH specific changes
        public string PastHistory { get; set; } //Rusha, 24th Nov 2022, add past history for charak
        public int? DischargeSummaryTemplateId { get; set; } //Bikesh, 26th sept  2023 for dynamic discharge summary

    }

}
