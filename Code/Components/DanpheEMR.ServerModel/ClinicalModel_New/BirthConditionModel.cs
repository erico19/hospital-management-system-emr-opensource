﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
    public class BirthConditionModel
    {
       [Key]
        public int BabyBirthConditionId { get; set; }
         public string BirthConditionType { get; set; }
         public int DischargeConditionId { get; set; }
        
    }
}
