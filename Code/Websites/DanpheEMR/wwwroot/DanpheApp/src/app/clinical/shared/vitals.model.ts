
//importing form and its related components, these are used for forms validation.
import {
    FormBuilder,
    FormControl,
    FormGroup
} from '@angular/forms';
import * as moment from 'moment';
import { ENUM_DateTimeFormat } from '../../shared/shared-enums';


export class Vitals {
    public PatientVitalId: number = 0;
    public PatientVisitId: number = 0;
    public DateTime: string = null;
    public Height: number = null;
    public HeightUnit: string = "cm";
    public Weight: number = null;
    public WeightUnit: string = "kg";

    //needs revision
    public BMI: number = null;
    public Temperature: number = null;
    public TemperatureUnit: string = "F";
    public Pulse: number = null;
    public BPSystolic: number = null;
    public BPDiastolic: number = null;
    public RespiratoryRatePerMin: string = null;
    public SpO2: number = null;
    public OxygenDeliveryMethod: string = null;
    public PainScale: number = null;
    public BodyPart: string = null;
    public Eyes: string = '';
    public Verbal: string = '';
    public Motor: string = '';
    public GCS: string = '';

    public CreatedBy: number = null;
    public ModifiedBy: number = null;
    public Remarks: string = '';
    public CreatedOn: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
    public ModifiedOn: string = null;
    public VitalsTakenOn: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);

    public VitalsValidator: FormGroup = null;

    constructor() {

        var _formBuilder = new FormBuilder();

        this.VitalsValidator = _formBuilder.group({
            'systolic': new FormControl(''),
            'diastolic': new FormControl(''),
        });

    }


    public IsDirty(): boolean {
        return this.VitalsValidator.dirty;
    }


    public IsValid(): boolean { if (this.VitalsValidator.valid) { return true; } else { return false; } }
    public IsValidCheck(): boolean {
        let bpSys = this.VitalsValidator.controls["systolic"].value;
        let bpDias = this.VitalsValidator.controls["diastolic"].value;

        if (bpSys && bpDias) {
            if (bpSys < bpDias) {
                return false;
            }
            else if (bpSys == bpDias) {
                return false;
            }
        }
        return true;
    }

    //returns true if both bp diastolic and systolic are filled.
    // false if one is filled and another is filled.
    public IsBPComplete(): boolean {

        let bpSys = this.VitalsValidator.controls["systolic"].value;
        let bpDias = this.VitalsValidator.controls["diastolic"].value;
        //if both empty then return true. 
        if (!bpSys && !bpDias) {
            return true;
        }
        else if (bpSys && !bpDias) {
            return false;
        }

        else if (bpDias && !bpSys) {
            return false;
        }
        return true;
    }
}
