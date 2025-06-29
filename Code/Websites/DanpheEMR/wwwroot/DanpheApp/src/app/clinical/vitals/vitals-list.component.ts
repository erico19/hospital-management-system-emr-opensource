// <reference path="../../radiology/imaging/imaging-requisition-list.component.ts" />
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";

import * as moment from "moment/moment";
import { VisitService } from "../../appointments/shared/visit.service";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { IOAllergyVitalsBLService } from "../shared/io-allergy-vitals.bl.service";

import { CoreService } from "../../core/shared/core.service";
import { PatientService } from "../../patients/shared/patient.service";
import { ENUM_VitalVerbalScale, ENUM_VitalsEyeScale, ENUM_VitalsMotorScale } from "../../shared/shared-enums";
import { Vitals } from "../shared/vitals.model";

@Component({
  selector: "vitals-list",
  templateUrl: "../../view/clinical-view/Vitals.html", //"/ClinicalView/Vitals"
})
export class VitalsListComponent {
  public CurrentVital: Vitals = new Vitals();
  public selectedVitals: any;

  public vitals: Vitals = new Vitals();

  public vitalsList: Array<Vitals> = new Array<Vitals>();
  public painData: Array<{ BodyPart: ""; PainScale: 0 }> = [];

  public foot: number = null;
  public inch: number = null;
  //if footInch is selected then 2 input box is displayed.
  public footInchSelected: boolean = false;
  public updateButton: boolean = false;
  public selectedIndex: number = null;
  public loading: boolean = false;
  public showAddVitalBox: boolean = false;
  public painDataList: Array<any> = new Array<any>();
  public date: string = null;
  public hospitalName: string = null;
  public vitalsPrintFormat: string = null;
  public doctorsPanel: Array<any> = [];
  public heightFoot: Array<number> = [];
  public heightMeter: Array<number> = [];
  public heightCm: Array<number> = [];
  public weightkg: Array<number> = [];
  public weightPound: Array<number> = [];
  public degFarenheit: Array<number> = [];
  public degCelsius: Array<number> = [];

  @Input("returnVitalsList") public returnVitalsList: boolean = false;
  @Output("vitalsEmitter") public vitalsEmitter: EventEmitter<object> = new EventEmitter<object>();

  constructor(
    public visitService: VisitService,
    public ioAllergyVitalsBLService: IOAllergyVitalsBLService,
    public changeDetector: ChangeDetectorRef,
    public msgBoxServ: MessageboxService,
    public patientService: PatientService,
    public coreService: CoreService
  ) {
    this.painData.push({ BodyPart: "", PainScale: null });
    this.date = moment().format("YYYY-MM-DD");
    this.hospitalName = this.coreService.GetHospitalName();
    this.vitalsPrintFormat = this.coreService.GetVitalsPrintFormat();
    this.AssignDoctorsPanel();
  }

  ngOnInit() {
    this.GetPatientVitalsList();
  }

  AssignDoctorsPanel() {
    let currPerformerName = this.visitService.globalVisit.PerformerName;
    let currPerformerId = this.visitService.globalVisit.PerformerId;

    //Gyane Panel. 110(Sunita), 112(Padam), 140(Atit)
    if (
      currPerformerName == "Dr. Sunita Pun" ||
      currPerformerName == "Dr. Atit Poudel" ||
      currPerformerName == "Prof. Dr. Padam Raj Pant"
    ) {
      this.doctorsPanel = [
        "Prof. Dr. Padam Raj Pant",
        "Dr. Sunita Pun",
        "Dr. Atit Poudel",
      ];
    }
    //159 Bhola Rijal , 162 Karishma Pandey
    else if (
      currPerformerName == "Dr. Bhola Rijal" ||
      currPerformerName == "Dr. Karishma Pandey"
    ) {
      this.doctorsPanel = ["Dr. Bhola Rijal", "Dr. Karishma Pandey"];
    } else {
      this.doctorsPanel = [this.visitService.globalVisit.PerformerName];
    }
  }

  //gets the list of vitals of the selected patient.
  GetPatientVitalsList(): void {
    let patientVisitId = this.visitService.getGlobal().PatientVisitId;
    this.ioAllergyVitalsBLService
      .GetPatientVitalsList(patientVisitId)
      .subscribe(
        (res) => {
          if (res.Status == "OK") {
            this.CallBackGetPatientVitalList(res.Results);
            if (this.returnVitalsList) {
              this.vitalsEmitter.emit({ vitalsList: res.Results });
            }
            this.changeHeight(res.Results);
          } else {
            this.msgBoxServ.showMessage(
              "failed",
              ["Failed. please check log for details."],
              res.ErrorMessage
            );
          }
        },
        (err) => {
          this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
        }
      );
  }
  //call back funtion for get patient vitals
  CallBackGetPatientVitalList(_vitalsList) {
    //looping through the vitalsList to check if any object contains height unit as inch so that it can be converted to foot inch.
    for (var i = 0; i < _vitalsList.length; i++) {
      if (_vitalsList[i].HeightUnit && _vitalsList[i].HeightUnit == "inch") {
        //incase of footinch we're converting and storing as inch.
        //converting back for displaying in the format foot'inch''
        _vitalsList[
          i
        ].Height = this.ioAllergyVitalsBLService.ConvertInchToFootInch(
          _vitalsList[i].Height
        );
      }
      var jsonData = JSON.parse(_vitalsList[i].BodyPart);
      this.painDataList.push(jsonData);
    }
    this.vitalsList = _vitalsList;
    if (this.vitalsList.length > 0) {
      this.MapVitalData();
    }
  }
  MapVitalData() {

    this.vitalsList.forEach((vitals) => {
      if (vitals.Eyes) {
        vitals.Eyes = this.MapEyeScale(vitals.Eyes);
      }
      if (vitals.Motor) {
        vitals.Motor = this.MapMotorScale(vitals.Motor);
      }
      if (vitals.Verbal) {
        vitals.Verbal = this.MapVerbalScale(vitals.Verbal);
      }
    });
  }
  MapEyeScale(value: string): string {
    switch (value) {
      case ENUM_VitalsEyeScale.Scale1:
        return "1";
      case ENUM_VitalsEyeScale.Scale2:
        return "2";
      case ENUM_VitalsEyeScale.Scale3:
        return "3";
      case ENUM_VitalsEyeScale.Scale4:
        return "4";
      default:
        return value;
    }
  }
  MapMotorScale(value: string): string {
    switch (value) {
      case ENUM_VitalsMotorScale.Scale1:
        return "1";
      case ENUM_VitalsMotorScale.Scale2:
        return "2";
      case ENUM_VitalsMotorScale.Scale3:
        return "3";
      case ENUM_VitalsMotorScale.Scale4:
        return "4";
      case ENUM_VitalsMotorScale.Scale5:
        return "5";
      case ENUM_VitalsMotorScale.Scale6:
        return "6";
      default:
        return value;
    }
  }
  MapVerbalScale(value: string): string {
    switch (value) {
      case ENUM_VitalVerbalScale.Scale1:
        return "1";
      case ENUM_VitalVerbalScale.Scale2:
        return "2";
      case ENUM_VitalVerbalScale.Scale3:
        return "3";
      case ENUM_VitalVerbalScale.Scale4:
        return "4";
      case ENUM_VitalVerbalScale.Scale5:
        return "5";
      default:
        return value;
    }
  }
  //change given height, weight and temperature to other units
  changeHeight(data) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].HeightUnit == "cm") {
        this.heightFoot.push(data[i].Height / 30.48);
        this.heightMeter.push(data[i].Height / 100);
        this.heightCm.push(data[i].Height);
      } else if (data[i].HeightUnit == "inch") {
        this.heightFoot.push(data[i].Height);
        this.heightMeter.push(data[i].Height / 3.281);
        this.heightCm.push(data[i].Height * 2.54);
      } else if (data[i].HeightUnit == "meter") {
        this.heightFoot.push(data[i].Height * 3.281);
        this.heightMeter.push(data[i].Height);
        this.heightCm.push(data[i].Height * 100);
      }
    }

    for (var i = 0; i < data.length; i++) {
      if (data[i].WeightUnit == "kg") {
        this.weightPound.push(data[i].Weight * 2.205);
        this.weightkg.push(data[i].Weight);
      }
      if (data[i].WeightUnit == "lbs") {
        this.weightkg.push(data[i].Weight / 2.205);
        this.weightPound.push(data[i].Weight);
      }
    }

    for (var i = 0; i < data.length; i++) {
      if (data[i].TemperatureUnit == "F") {
        this.degFarenheit.push(data[i].Temperature);
        this.degCelsius.push((data[i].Temperature - 32) * (5 / 9));
      } if (data[i].TemperatureUnit == "C") {
        this.degFarenheit.push((data[i].Temperature) * (9 / 5) + 32);
        this.degCelsius.push(data[i].Temperature);
      }
    }
  }

  //enables the update button and assigns the selected vitals object to the CurrentVital object.
  public Edit(selectedVitals, selIndex: number) {
    this.selectedVitals = null;
    this.selectedIndex = selIndex;
    this.showAddVitalBox = false;
    this.changeDetector.detectChanges();
    this.selectedVitals = selectedVitals;

    if (!this.selectedVitals.TemperatureUnit) {
      this.selectedVitals.TemperatureUnit = "F";
    }
    if (!this.selectedVitals.HeightUnit) {
      this.selectedVitals.HeightUnit = "cm";
    }
    if (!this.selectedVitals.WeightUnit) {
      this.selectedVitals.WeightUnit = "kg";
    }

    this.showAddVitalBox = true;
  }

  Print(selectedVital) {
    this.vitals = null;
    //this.changeDetector.detectChanges();
    this.vitals = selectedVital;

    if (this.vitals.BodyPart) {
      var painDetail = JSON.parse(this.vitals.BodyPart);
      if (painDetail) {
        this.vitals.PainScale = painDetail[0].PainScale;
      }
    }
    this.changeDetector.detectChanges();
    this.showPrintScreen();
  }

  showPrintScreen() {
    let popupWinindow;
    var printContents = document.getElementById("vitalsPrintpage").innerHTML;
    popupWinindow = window.open(
      "",
      "_blank",
      "width=1600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no"
    );
    popupWinindow.document.open();
    popupWinindow.document.write(
      '<html><head><link href="../../assets/global/plugins/bootstrap/css/bootstrap.min.css" rel="stylesheet" type="text/css" /><link rel="stylesheet" type="text/css" href="../../themes/theme-default/DanpheStyle.css" /></head><body onload="window.print()">' +
      printContents +
      "</body></html>"
    );
    popupWinindow.document.close();
  }

  AddVitalBox() {
    this.showAddVitalBox = false;
    this.selectedVitals = null;
    this.changeDetector.detectChanges();
    this.showAddVitalBox = true;
  }

  CallBackAdd($event) {
    if ($event.submit) {
      if (this.selectedIndex || this.selectedIndex == 0) {
        if ($event.vitals.HeightUnit == "inch") {
          //incase of footinch we're converting and storing as inch.
          //converting back for displaying in the format foot'inch''
          $event.vitals.HeightUnit == "footinch";
          $event.vitals.Height = this.ioAllergyVitalsBLService.ConvertInchToFootInch(
            $event.vitals.Height
          );
        }
        if (this.selectedIndex != null) {
          this.vitalsList.splice(this.selectedIndex, 1);
          this.vitalsList.splice(this.selectedIndex, 0, $event.vitals);
          this.vitalsList.slice();
          this.MapVitalData();
        }

        var pData = JSON.parse($event.vitals.BodyPart);

        if (pData) {
          this.painDataList.splice(this.selectedIndex, 1);
          this.painDataList.splice(this.selectedIndex, 0, pData);
          this.painDataList.slice();
        }

        this.CurrentVital.BodyPart = JSON.stringify(pData);

        this.selectedIndex = null;
      } else {
        var jsonData = JSON.parse($event.vitals.BodyPart);
        this.painDataList.push(jsonData);
        if ($event.vitals.HeightUnit == "inch") {
          //incase of footinch we're converting and storing as inch.
          //converting back for displaying in the format foot'inch''
          $event.vitals.Height = this.ioAllergyVitalsBLService.ConvertInchToFootInch(
            $event.vitals.Height
          );
        }
        if (this.returnVitalsList) {
          let arr = [];
          arr.push($event.vitals);
          this.vitalsEmitter.emit({ vitalsList: arr });;
        }
        this.vitalsList.push($event.vitals);
        this.changeHeight(this.vitalsList);
        this.selectedIndex = null;
        this.MapVitalData();
      }
    } else {
      this.showAddVitalBox = false;
    }
  }
}
