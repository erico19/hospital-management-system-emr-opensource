﻿export class ICD10 {
    public ICD10Code: string = null;
    public ICD10Description: string = null;
    public ICD10ID: number = 0;
    public ICDShortCode: string = null;
    public ValidForCoding: boolean = true;
    public Active: boolean = true;
    public IsPatientReferred: boolean;
    public ReferredBy: string;
    public IcdVersion: string = null;
    DiseaseGroupId: number = 0;
}