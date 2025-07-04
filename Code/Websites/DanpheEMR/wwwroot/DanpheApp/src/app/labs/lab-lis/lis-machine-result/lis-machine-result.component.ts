import {
    ChangeDetectorRef,
    Component
} from '@angular/core';
import { CoreService } from '../../../core/shared/core.service';
import { SecurityService } from '../../../security/shared/security.service';
import { CommonFunctions } from '../../../shared/common.functions';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_LaboratoryResultValidation, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { LabTestComponent } from '../../shared/lab-component.model';
import { MachineResultsFormatted, MachineResultsVM } from '../shared/DTOs/lis-machine-result.dto';
import { LabLISBLService } from '../shared/lis.bl.service';

@Component({
    templateUrl: "./lis-machine-result.html",
    styles: ['.res-table tbody tr td{font-size: 11px; font-weight: normal;} .res-table thead tr th{font-size: 11px;} .res-table{background: #fff;}']
})

export class LISMachineResultComponent {
    public selectedMachineId: number = 0;
    public allMachines: Array<any> = [];
    public allResults: Array<MachineResultsFormatted> = [];
    public selectedAll: boolean = false;
    public anySelected: boolean;
    public componentsToPost: Array<LabTestComponent> = new Array<LabTestComponent>();
    public fromDate: any;
    public toDate: any;


    constructor(public coreService: CoreService, public securityService: SecurityService, public labLISBlService: LabLISBLService,
        public changeDetector: ChangeDetectorRef, public messageService: MessageboxService) {
        this.GetAllMachineMaster();
    }

    GetAllMachineMaster() {
        this.coreService.loading = true;
        this.labLISBlService.GetAllMachinesMaster().subscribe(res => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                this.allMachines = res.Results;
                if (this.allMachines && this.allMachines.length == 1) {
                    this.selectedMachineId = this.allMachines[0].MachineId;
                }
                this.coreService.loading = false;
            }
        }, (err) => {
            console.log(err.error.ErrorMessage); this.coreService.loading = false; this.messageService.showMessage(ENUM_MessageBox_Status.Error, ['Could not get Machine List Now. Please try again later.']);
        });
    }

    LoadMachineData() {
        if (this.selectedMachineId > 0) {
            this.coreService.loading = true;
            this.allResults = [];
            this.labLISBlService.GetAllMachineResult(this.selectedMachineId, this.fromDate, this.toDate)
                .finally(() => { this.coreService.loading = false; })
                .subscribe(res => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        if (res.Results && res.Results.length > 0) {
                            this.allResults = res.Results;
                            this.coreService.FocusInputById(`MachineResult_0`);
                            this.CheckComponentValueIsValidAndNormal();
                            //this.ModifyData();
                            this.selectedAll = false;
                            this.anySelected = false;
                        }
                        else {
                            this.messageService.showMessage(ENUM_MessageBox_Status.Notice, [`No data found for selected date range for this machine...`]);
                        }
                    }
                }, (err) => { this.coreService.loading = false; console.log(err.error.ErrorMessage); this.messageService.showMessage(ENUM_MessageBox_Status.Error, ['Could not get Machine Data Now. Please try again later.']); });
        }
        else {
            this.messageService.showMessage(ENUM_MessageBox_Status.Notice, [`Please select at least one machine from the list...`]);
        }

    }


    SelectComps(ind: number) {
        if (ind) {
            this.allResults = this.allResults.map(p => { p.Data.forEach(d => d.IsSelected = (this.selectedAll && d.IsValueValid)); return p; });
            this.anySelected = this.selectedAll;
        } else {
            let anyFalse = false;
            let anyTrue = false;
            this.allResults.forEach(p => {
                if (p.Data.some(d => d.IsSelected == false)) {
                    anyFalse = true;
                }
                if (p.Data.some(d => d.IsSelected == true)) {
                    anyTrue = true;
                }
            });
            this.anySelected = anyTrue;
            this.selectedAll = !anyFalse;
        }
        this.allResults.forEach(a => {
            this.ApplyGroupValidation(a.Data);
        })
    }

    SaveMachineDataToDanphe() {
        if (this.allResults.every(a => a.Data.every(b => b.IsGroupValid == true))) {
            this.coreService.loading = true;
            let dataToPost = this.allResults.reduce(function (acc, currVal) {
                currVal.Data.forEach(elm => {
                    if (elm.IsSelected) {
                        acc.push(elm);
                    }
                });
                return acc;
            }, []);


            this.labLISBlService.AddLisDataToResult(dataToPost)
                .subscribe(res => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        this.coreService.loading = false;
                        this.selectedAll = false;
                        this.anySelected = false;
                        this.allResults = [];
                        this.LoadMachineData();
                    }
                    else if (res.Status === ENUM_DanpheHTTPResponses.Failed) {
                        this.coreService.loading = false;
                        this.messageService.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
                        this.LoadMachineData();
                    }
                }, (err) => {
                    this.coreService.loading = false; console.log(err.error.ErrorMessage); this.messageService.showMessage(ENUM_MessageBox_Status.Error, ['Could not save the Machine Result Now. Please try again later.']);
                });
        }
        else {
            let errorArray = new Array<string>();
            this.allResults.forEach(res => {
                res.Data.forEach(data => {
                    errorArray.push(data.ErrorMessage);
                });
            });
            errorArray = errorArray.filter((x, i, a) => a.indexOf(x) == i)
            this.messageService.showMessage(ENUM_MessageBox_Status.Warning, [`${errorArray.toString()}`]);
        }
    }


    CheckComponentValueIsValidAndNormal() {
        this.allResults.forEach(dt => {
            dt.Data.forEach(singleData => {
                if (singleData.Value == null || singleData.Value == "" || singleData.Value.trim() == "") {
                    singleData.IsValueValid = false;
                    singleData.IsAbnormal = false;
                } else {
                    ///for ValueType other than "number" -- non-empty values are normal
                    if (singleData.Component.ValueType != "number") {
                        singleData.IsValueValid = true;
                    } else {
                        //assinging the value to a variable to maintain "," or "02" in the display value even if the value is parsed as Number()
                        //let value = Number(singleData.Value.replace(/,/g, ""));
                        //check if the value is number or not.
                        //if (isNaN(value)) { singleData.IsValueValid = false; }
                        ///if the value is number then then it is Valid
                        //else {

                        singleData.IsValueValid = true;
                        singleData.IsAbnormal = isNaN(+singleData.Value) ? true : false;
                        let value = isNaN(+singleData.Value) ? singleData.Value.toString() : (+singleData.Value * +singleData.ConversionFactor).toFixed(singleData.Component.ValuePrecision).toString();
                        singleData.Value = singleData.GroupName === ENUM_LaboratoryResultValidation.Check100 ? value.padStart(2, "0") : value;
                        // singleData.Value = ((value) * (singleData.ConversionFactor)).toFixed(singleData.Component.ValuePrecision) 
                        // }
                    }
                }

                let valueType: string = singleData.Component.ValueType;
                if (valueType && valueType == "string") {
                    valueType = "number";
                }
                var dob = singleData.DateOfBirth;
                var patGender = singleData.Gender;
                var patAge = CommonFunctions.GetFormattedAge(dob);
                patAge = patAge.toUpperCase();

                let comp = singleData.Component;


                if (patAge.includes("Y")) {
                    var ageArr = patAge.split("Y");
                    var actualAge = Number(ageArr[0]);
                    //Patient is not child
                    if (actualAge > 16) {
                        //Use validation according to Gender
                        if (
                            patGender.toLowerCase() == "male" &&
                            comp.MaleRange &&
                            comp.MaleRange.trim() != "" &&
                            comp.MaleRange.length
                        ) {
                            comp.Range = comp.MaleRange;
                        } else if (
                            patGender.toLowerCase() == "female" &&
                            comp.FemaleRange &&
                            comp.FemaleRange.trim() != "" &&
                            comp.FemaleRange.length
                        ) {
                            comp.Range = comp.FemaleRange;
                        } else {
                        }
                    }
                    //Patient is Child
                    else {
                        //If Child validation is present
                        if (
                            comp.ChildRange &&
                            comp.ChildRange.trim() != "" &&
                            comp.ChildRange.length
                        ) {
                            comp.Range = comp.ChildRange;
                        } else {
                            if (
                                patGender.toLowerCase() == "male" &&
                                comp.MaleRange &&
                                comp.MaleRange.trim() != "" &&
                                comp.MaleRange.length
                            ) {
                                comp.Range = comp.MaleRange;
                            } else if (
                                patGender.toLowerCase() == "female" &&
                                comp.FemaleRange &&
                                comp.FemaleRange.trim() != "" &&
                                comp.FemaleRange.length
                            ) {
                                comp.Range = comp.FemaleRange;
                            } else {
                            }
                        }
                    }
                }
                //this means there is either M or D, i.e. Patient is Child so use child Validation if available
                else {
                    comp.Range = comp.ChildRange;
                }

                if (singleData.IsValueValid) {
                    singleData.IsAbnormal = isNaN(+singleData.Value) ? true : false;
                    singleData.AbnormalType = "normal";
                    //comp.Range && comp.ValueType  => True only if these fields are present & has some value.
                    //check abnormal only for valuetype=number, for string we cannot detect which value is abnormal.--sud:11Apr'18
                    if (comp.Range && valueType && valueType == "number") {
                        let value = Number(singleData.Value.replace(/,/g, ""));
                        if (comp.Range.includes("-")) {
                            comp.Range = comp.Range.replace(/,/g, "");
                            let range = comp.Range.split("-");
                            if (value < Number(range[0]) || value > Number(range[1])) {
                                //comp.IsAbnormal = false;
                                //this.changeDetector.detectChanges();
                                if (value < Number(range[0])) {
                                    singleData.AbnormalType = "low";
                                } else {
                                    singleData.AbnormalType = "high";
                                }
                                singleData.IsAbnormal = true;
                            }
                        } else if (comp.Range.includes("<")) {
                            let range = comp.Range.split("<");
                            if (value >= Number(range[1])) {
                                //comp.IsAbnormal = false;
                                //this.changeDetector.detectChanges();
                                singleData.AbnormalType = "high";
                                singleData.IsAbnormal = true;
                            }
                        } else if (comp.Range.includes(">")) {
                            let range = comp.Range.split(">");
                            if (value <= Number(range[1])) {
                                //comp.IsAbnormal = false;
                                //this.changeDetector.detectChanges();
                                singleData.AbnormalType = "low";
                                singleData.IsAbnormal = true;
                            }
                        }
                    }
                }
            });
            this.ApplyGroupValidation(dt.Data);
        });

    }

    OnFromToDateChange($event) {
        if ($event) {
            this.fromDate = $event.fromDate;
            this.toDate = $event.toDate;
        }
    }

    ModifyData() {
        let Components = ["BASO%", "EO%", "MONO%", "LYMPH%", "LYM%", "NEUT%", "NEU%", "MON%", "EOS%", "BAS%"];
        this.allResults.forEach(data => {
            let numbers = [];
            let roundedNumbers = [];
            let roundedSum = 0;
            let sum = 0;
            data.Data.forEach(element => {
                if (Components.includes(element.LISComponentName))
                    numbers.push(+element.Value);
                element.Value = Math.round(+element.Value).toString();
                if (Components.includes(element.LISComponentName))
                    roundedNumbers.push(+element.Value);
                element.Value = +element.Value > 9 ? element.Value : "0" + element.Value;
            });
            roundedSum = roundedNumbers.reduce((partialSum, a) => partialSum + a, 0);
            let count = data.Data.filter(a => Components.includes(a.LISComponentName)).length / 5;
            sum = Number(count + "00");
            let isRoundeSumLarger = roundedSum > sum;
            while (roundedSum != sum) {
                for (let n = 0; n < numbers.length; n++) {
                    var maxDifferenceIndex;
                    let maxDifferenceValue = 0;
                    let difference = Math.abs(roundedNumbers[n] - numbers[n]);
                    if ((isRoundeSumLarger && roundedNumbers[n] > numbers[n] && maxDifferenceValue < difference)
                        || (!isRoundeSumLarger && roundedNumbers[n] < numbers[n] && maxDifferenceValue < difference)) {
                        maxDifferenceValue = difference;
                        maxDifferenceIndex = n;
                    }
                }
                let modifyValue = (isRoundeSumLarger ? -1 : 1);
                roundedNumbers[maxDifferenceIndex] += modifyValue;
                roundedSum += modifyValue;
            }

            data.Data.filter(a => Components.includes(a.LISComponentName)).forEach((element, index) => {
                element.Value = roundedNumbers[index] > 9 ? roundedNumbers[index].toString() : "0" + roundedNumbers[index].toString();
            });
            // let sum = 0;
            // data.Data.filter(a => Components.includes(a.LISComponentName)).forEach(element => {
            //     sum += (+element.Value);
            // });
            // data.Data.filter(a=> a.LISComponentName == "NEUT%").map(a=>{
            //     a.Value = (+a.Value + 100-sum).toString();
            // })
            data.Data.filter(a => a.LISComponentName == "WBC").map(a => {
                let data = a.Value.split("");
                let modifiedData = "";
                data[a.Value.length - 2] = "0";
                for (let i = 0; i < a.Value.length; i++) {
                    modifiedData += data[i];
                }
                a.Value = modifiedData;
            })
        })
    }

    public FocusOnInputField(result, value, id: string, startIndex: number, endIndex: number) {
        value.IsSelected = true;
        this.SelectComps(0);
        let focusId = `${id}${startIndex}${endIndex + 1}`;
        let focusElement = document.getElementById(`${id}${startIndex}${endIndex + 1}`);
        if (!focusElement) {
            focusElement = document.getElementById(`${id}${startIndex + 1}${endIndex}`);
            focusId = `${id}${startIndex + 1}0`
        }
        if (focusElement)
            this.coreService.FocusInputById(`${focusId}`);
        this.ApplyGroupValidation(result.Data);
    }
    ApplyGroupValidation(componentList: Array<MachineResultsVM>) {
        let groupValidation: { isGroupValid: boolean; validationMessage: string };

        let distinctCompGroups = componentList.map((a) => {
            if (a.GroupName) return a.GroupName;
        });
        distinctCompGroups = CommonFunctions.GetUniqueItemsFromArray(
            distinctCompGroups
        );
        distinctCompGroups = distinctCompGroups.filter(a => a != undefined && a != null);
        if (distinctCompGroups && distinctCompGroups.length > 0) {
            distinctCompGroups.forEach((grp) => {
                let currGroupComps = componentList.filter((a) => a.GroupName == grp);
                groupValidation = this.CheckGroupValidations(grp, currGroupComps);
                if (!groupValidation.isGroupValid) {
                    currGroupComps.forEach((comp) => {
                        comp.IsGroupValid = false;
                        comp.ErrorMessage = groupValidation.validationMessage;
                    });
                } else {
                    currGroupComps.forEach((comp) => {
                        comp.IsGroupValid = true;
                    });
                }
            });
        }
    }

    CheckGroupValidations(groupName: string, groupComponents: Array<MachineResultsVM>): { isGroupValid: boolean; validationMessage: string } {
        var groupValidation = { isGroupValid: true, validationMessage: "" };
        groupName = groupName ? groupName.toLowerCase() : '';
        switch (groupName) {
            case ENUM_LaboratoryResultValidation.Check100:
                let valueArray = groupComponents.map((a) => {
                    if (a.IsSelected == true) {
                        return parseFloat(a.Value);
                    }
                });

                let sum: number = 0;
                valueArray.forEach((v) => {
                    sum += v;
                });
                sum = +sum.toFixed(2);
                if (sum === 100) {
                    groupValidation.isGroupValid = true;
                } else {
                    groupValidation.isGroupValid = false;
                    groupValidation.validationMessage =
                        "Sum of the values should be exactly 100.";
                }
                break;
            default:
                groupValidation.isGroupValid = true;
                break;
        }
        return groupValidation;
    }
}
