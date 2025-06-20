import { ChangeDetectorRef, Component } from "@angular/core";
import { Router } from "@angular/router";

import { Chart } from "chart.js";
import { VisitService } from "../../appointments/shared/visit.service";
import { ActiveMedical } from "../../clinical/shared/active-medical.model";
import { ComplaintsModel } from "../../nursing/opd-triage/opd-triage.component";
import { Patient } from "../../patients/shared/patient.model";
import { PatientService } from "../../patients/shared/patient.service";
import { SecurityService } from "../../security/shared/security.service";
import { CallbackService } from "../../shared/callback.service";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { RouteFromService } from "../../shared/routefrom.service";
import { ENUM_VitalVerbalScale, ENUM_VitalsEyeScale, ENUM_VitalsMotorScale } from "../../shared/shared-enums";
import { DoctorsBLService } from "../shared/doctors.bl.service";

@Component({
  templateUrl: "./patient-overview.html",
  styles: [`.inline-complaint{position: relative;} .remove-complaint{position: absolute; top:0;right:0;padding: 0 5px;}`]
})
export class PatientOverviewComponent {
  public chart = [];

  public currentPatient: Patient = null;
  public patientVisitId: number = null;

  //used to view lab report of selected test
  public labRequisitionIdList: Array<number>;
  public showLabReport: boolean = false;

  public imagingRequisitionId: number = null;
  public showImagingReport: boolean = false;
  public selectedProblem: ActiveMedical = new ActiveMedical();
  public showAddProblemNote: boolean = false;
  public enableAddOrders: boolean = true;
  public showChart: boolean = false;

  //used to display different measurement values in vitals list
  public heightFoot: Array<number> = [];
  public heightMeter: Array<number> = [];
  public heightCm: Array<number> = [];
  public weightkg: Array<number> = [];
  public weightPound: Array<number> = [];
  public degFarenheit: Array<number> = [];
  public degCelsius: Array<number> = [];

  public chiefComplaints: Array<ComplaintsModel> = [];
  public newChiefComplaints: Array<ComplaintsModel> = [];
  public complainLoading: boolean = false;


  constructor(
    public patientservice: PatientService,
    public callBackService: CallbackService,
    public changeDetector: ChangeDetectorRef,
    public router: Router,
    public visitservice: VisitService,
    public msgBoxServ: MessageboxService,
    public doctorsBLService: DoctorsBLService,
    public routeFromService: RouteFromService,
    public securityService: SecurityService
  ) {
    this.currentPatient = new Patient();
    this.patientVisitId = this.visitservice.globalVisit.PatientVisitId;
    this.CheckRouteFrom();
    this.ShowPatientPreview();
    this.GetChiefComplaints();
  }





  GetChiefComplaints() {
    this.doctorsBLService.GetComplaints(this.patientVisitId)
      .subscribe(res => {
        if (res.Status = "OK") {
          this.complainLoading = false;
          this.chiefComplaints = [];
          for (var i = 0; i < res.Results.length; i++) {
            if (res.Results[i].KeyName == "chief-complaint") {
              let singleComplain = res.Results[i];
              singleComplain["IsActive"] = true;
              this.chiefComplaints.push(singleComplain);
            }
          }
        } else {
          this.msgBoxServ.showMessage("failed to load data", [res.ErrorMessage]);
          this.complainLoading = false;
        }
      });
  }

  UpdateComplaint(complaint: any, remove: boolean = false) {
    if (!remove) {
      if (complaint.InfoId && complaint.Value && complaint.Value.trim().length > 0) {
        this.updateComplaintToDb(complaint);
      } else {
        this.GetChiefComplaints();
      }
    } else {
      if (complaint.InfoId) {
        complaint.IsActive = false;
        this.updateComplaintToDb(complaint);
      }
    }
  }

  AddNewComplaintRow() {
    let newComp = new ComplaintsModel();
    newComp.PatientId = this.patientservice.globalPatient.PatientId;
    newComp.PatientVisitId = this.patientVisitId;
    newComp.KeyName = "chief-complaint";
    newComp.IsActive = true;
    this.newChiefComplaints.push(newComp);
  }

  RemoveComplaintRow(ind: number) {
    this.newChiefComplaints.splice(ind, 1);
    this.newChiefComplaints.slice();
  }

  AddComplaint() {
    if (this.newChiefComplaints && this.newChiefComplaints.length) {
      let compToAdd = [];
      this.newChiefComplaints.forEach(c => {
        if (c.Value && c.Value.trim().length) {
          compToAdd.push(c);
        }
      });
      if (compToAdd.length) {
        this.doctorsBLService.AddComplaints(compToAdd).subscribe(res => {
          if (res.Status == "OK") {
            this.msgBoxServ.showMessage("success", ['Complaint Added Successfully']);
            this.newChiefComplaints = [];
            this.GetChiefComplaints();
            this.complainLoading = false;
          } else {
            this.msgBoxServ.showMessage("Failed to Add new complaints", [res.ErrorMessage]);
            this.complainLoading = false;
          }
        });
      } else {
        this.complainLoading = false;
        this.newChiefComplaints = [];
      }
    }
  }

  updateComplaintToDb(complaint: any) {
    if (this.complainLoading) {
      this.doctorsBLService.UpdateComplaint(complaint)
        .subscribe(res => {
          if (res.Status == "OK") {
            this.GetChiefComplaints();
            this.complainLoading = false;
            if (res.Results.IsActive) {
              this.msgBoxServ.showMessage("success", ['Complain Updated successfully']);
            } else {
              this.msgBoxServ.showMessage("success", ['Complain Removed successfully']);
            }
          } else {
            this.msgBoxServ.showMessage("Failed to remove this complaint", [res.ErrorMessage]);
            this.complainLoading = false;
          }
        });
    }
  }






  ShowChart() {
    this.showChart = !this.showChart;
    this.changeDetector.detectChanges();
    if (this.showChart) {
      this.CreateChart();
    }
  }
  MapVitalData(currentPatient) {

    this.currentPatient.Vitals.forEach((vitals) => {
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
    }
  }
  CreateChart() {
    var Date: Array<any> = new Array<any>();
    var BMI: Array<any> = new Array<any>();
    var Pulse: Array<any> = new Array<any>();
    var Temp: Array<any> = new Array<any>();
    var RespiratoryRate: Array<any> = new Array<any>();
    var SpO2: Array<any> = new Array<any>();
    for (var i = 0; i < this.currentPatient.Vitals.length; i++) {
      Date.push(this.currentPatient.Vitals[i].CreatedOn);
      BMI.push(this.currentPatient.Vitals[i].BMI);
      Pulse.push(this.currentPatient.Vitals[i].Pulse);
      Temp.push(this.currentPatient.Vitals[i].Temperature);
      RespiratoryRate.push(
        parseInt(this.currentPatient.Vitals[i].RespiratoryRatePerMin)
      );
      SpO2.push(this.currentPatient.Vitals[i].SpO2);
    }
    this.chart = new Chart("canvas", {
      type: "line",
      data: {
        labels: Date,
        datasets: [
          {
            label: "Respiratory Rate",
            data: RespiratoryRate,
            backgroundColor: "red",
            borderColor: "red",
            fill: false,
          },
          {
            label: "BMI",
            data: BMI,
            backgroundColor: "blue",
            borderColor: "blue",
            fill: false,
          },
          {
            label: "Pulse",
            data: Pulse,
            backgroundColor: "green",
            borderColor: "green",
            fill: false,
          },
          {
            label: "Temperature",
            data: Temp,
            backgroundColor: "pink",
            borderColor: "pink",
            fill: false,
          },
          {
            label: "SpO2",
            data: SpO2,
            backgroundColor: "purple",
            borderColor: "purple",
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          xAxes: [
            {
              type: "time",
              time: {
                displayFormats: {
                  day: "MMM D",
                  hour: "hA",
                },
              },
            },
          ],
        },
      },
    });
  }
  public CheckRouteFrom() {
    if (this.securityService.currentModule == "nursing" || this.securityService.currentModule == "emergency") {
      this.enableAddOrders = false;
      //this.routeFromService.RouteFrom = null;
    }
  }

  ShowPatientPreview() {
    let patientId = this.patientservice.getGlobal().PatientId;
    let patientVisitId = this.visitservice.getGlobal().PatientVisitId;
    this.doctorsBLService
      .GetPatientPreview(patientId, patientVisitId)
      .subscribe((res) => {
        this.CallBackPatientPreview(res);
        this.changeHeight();
        this.routeFromService.RouteFrom = null;
      });
  }

  CallBackPatientPreview(res) {
    if (res.Status == "OK") {
      let retPatient: Patient = res.Results;

      var pat = this.patientservice.getGlobal();
      pat.PatientId = retPatient.PatientId;
      pat.FirstName = retPatient.FirstName;
      pat.LastName = retPatient.LastName;
      pat.MiddleName = retPatient.MiddleName;
      pat.ShortName = retPatient.ShortName;
      pat.PatientCode = retPatient.PatientCode;
      pat.DateOfBirth = retPatient.DateOfBirth;
      pat.CountrySubDivisionId = retPatient.CountrySubDivisionId;
      pat.Gender = retPatient.Gender;
      pat.Salutation = retPatient.Salutation;
      pat.Allergies = retPatient.Allergies;
      pat.BedNo = retPatient.BedNo;
      pat.WardName = retPatient.WardName;
      // if (this.patientVisitId && retPatient.Visits.length > 0) {
      //   let visit = retPatient.Visits.find(v => v.PatientVisitId == this.patientVisitId);
      //   if (visit) {
      //     pat.PatientCode = visit.VisitCode;
      //   }
      // }
      if (retPatient.Vitals && retPatient.Vitals.length > 0) {
        retPatient.Vitals.forEach((v, i) => {

          if (v.HeightUnit && v.HeightUnit == 'inch') {
            let inch = v.Height % 12;
            let foot = (v.Height - inch) / 12;
            if (foot < 0)
              foot = 0;
            let height: string = foot + "'" + inch + "''";
            retPatient.Vitals[i].HeightUnit = height;   // this is temporary to display foot and inch         
          }

          var tempBp = JSON.parse(v.BodyPart);
          retPatient.Vitals[i].BodyPart = tempBp[0].BodyPart;
          retPatient.Vitals[i].PainScale = tempBp[0].PainScale;
        });
        pat.Vitals = retPatient.Vitals;
      }


      pat.Problems = retPatient.Problems;
      pat.MedicationPrescriptions = retPatient.MedicationPrescriptions;
      pat.LabRequisitions = retPatient.LabRequisitions;
      pat.ProfilePic = retPatient.ProfilePic;
      //pat.ImagingReports = retPatient.ImagingReports;
      pat.ImagingItemRequisitions = retPatient.ImagingItemRequisitions;
      this.currentPatient = this.patientservice.getGlobal();
      this.MapVitalData(this.currentPatient);

      this.currentPatient["MedAllergy"] = retPatient.Allergies.filter(
        (a) => a.AllergyType == "Medication"
      );
      this.currentPatient["AdvReaction"] = retPatient.Allergies.filter(
        (a) => a.AllergyType == "AdvRec" || a.AllergyType == "Food"
      );
      this.currentPatient["OtherAllergy"] = retPatient.Allergies.filter(
        (a) => a.AllergyType == "Non Medication"
      );
      console.log(retPatient.Allergies);
      //format patient allergies so that we can show them in PatOverviewMain Page.
      pat.FormatPatientAllergies();
    } else {
      this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
    }
  }

  AddAllergy() {
    this.callBackService.CallbackRoute = "/Doctors/PatientOverview";
    this.router.navigate(["/Clinical/Allergy"]);
    //this.allergy.AddAllergy();
  }

  routeTo(route: string = null) {
    this.routeFromService.RouteFrom = route;
    this.router.navigate(["/Doctors/PatientOverviewMain/Orders"]);
  }
  public ViewLabReport(labRequisitionId: number) {
    this.labRequisitionIdList = [labRequisitionId];
    this.showLabReport = true;
  }
  public ViewImagingReport(imagingRequisitionId: number) {
    this.imagingRequisitionId = null;
    this.showImagingReport = false;
    this.changeDetector.detectChanges();
    this.imagingRequisitionId = imagingRequisitionId;
    this.showImagingReport = true;
  }

  public CloseLabReport() {
    this.labRequisitionIdList = null;
    this.showLabReport = false;
  }
  public CloseImagingReport() {
    this.imagingRequisitionId = null;
    this.showImagingReport = false;
  }
  public CloseAddProblemNote() {
    this.selectedProblem = null;
    this.showAddProblemNote = false;
  }
  public ShowAddProblemNote(problem: ActiveMedical) {
    this.selectedProblem = new ActiveMedical();
    this.selectedProblem = Object.assign(this.selectedProblem, problem);
    this.showAddProblemNote = true;
  }
  public AddProblemNote() {
    this.selectedProblem.ActiveMedicalValidator.controls["Note"].markAsDirty();
    this.selectedProblem.ActiveMedicalValidator.controls[
      "Note"
    ].updateValueAndValidity();
    if (this.selectedProblem.ActiveMedicalValidator.controls["Note"].valid) {
      this.doctorsBLService
        .PutActiveMedical(this.selectedProblem)
        .subscribe((res) => {
          if (res.Status == "OK") {
            var index = this.currentPatient.Problems.findIndex(
              (a) => a.PatientProblemId == this.selectedProblem.PatientProblemId
            );
            this.msgBoxServ.showMessage("success", ["Note Updated"]);
            this.currentPatient.Problems[index] = res.Results;
            this.CloseAddProblemNote();
          } else {
            this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
            console.log(res.ErrorMessage);
          }
        });
    }
  }

  changeHeight() {
    let data = this.currentPatient.Vitals;
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
}
