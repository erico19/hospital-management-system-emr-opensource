import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { DanpheHTTPResponse } from '../../shared/common-models';
import { ImagingItemReport } from '../shared/imaging-item-report.model';
import { ImagingItemRequisition } from './imaging-item-requisition.model';

@Injectable()
export class ImagingDLService {
    public options = {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
    };
    constructor(public http: HttpClient) {
    }
    public GetFilmTypeData() {
        return this.http.get<any>('/api/radiology/FilmTypes', this.options);
    }

    //this returns a promise, the calling component can map, subscribe and do the needful
    //imaging-requistion-component
    public GetItemsByType(typeId: number) {
        return this.http.get<any>("/api/Master/ImagingItems?inputValue=" + typeId, this.options);
    }
    //imaging-requistion-component
    //get patinet's list of requisition items
    // Method below is commented as it has no reference.
    // public GetPatientImagingRequisitions(patientId: number, orderStatus: string) {
    //     return this.http.get<any>('/api/radiology?patientId=' + patientId + '&orderStatus=' + orderStatus
    //         + '&reqType=patientImagingRequisition', this.options);
    // }
    //imaging-requisition.component
    //gets types of imaging in radiology
    public GetImagingTypes() {
        return this.http.get<any>('/api/radiology/ImagingTypes', this.options);
    }

    //gets dicom Image list
    public GetDicomImageList(PatientStudyId) {
        return this.http.get<any>(`/api/radiology/DicomImages?PatientStudyId=${PatientStudyId}`, this.options);
    }



    //imaging-report.component 
    //get requisition items using reportOrderStatus and billingStatus
    public GetImagingReqsAndReportsByStatus(reqOrderStatus: string, reportOrderStatus: string, typeList: string, fromDate: string, toDate: string) {
        return this.http.get<any>(`/api/radiology/Requisitions?reqOrderStatus=${reqOrderStatus}&reportOrderStatus=${reportOrderStatus}&typeList=${typeList}&fromDate=${fromDate}&toDate=${toDate}`, this.options);
    }
    public GetPendingReportsandRequisition(reqOrderStatus: string, reportOrderStatus: string, typeList: string, fromDate: string, toDate: string) {
        return this.http.get<any>(`/api/radiology/PendingReportsandRequisition?reqOrderStatus=${reqOrderStatus}&reportOrderStatus=${reportOrderStatus}&typeList=${typeList}&fromDate=${fromDate}&toDate=${toDate}`, this.options);
    }

    //get requisition items using reportOrderStatus and billingStatus
    // Method below is commented as it has no reference.
    // public GetImagingReqsAndReportsByStatus_Old(reqOrderStatus: string, reportOrderStatus: string, billingStatus: string) {
    //     return this.http.get<any>('/api/radiology?reqType=reqNReportListByStatus'
    //         + '&reqOrderStatus=' + reqOrderStatus
    //         + '&reportOrderStatus=' + reportOrderStatus
    //         + '&billingStatus=' + billingStatus, this.options);
    // }

    //imaging-result.component
    //get list of reports of selected patient using orderStatus
    public GetPatientReports(patientId: number, reportOrderStatus) {
        return this.http.get<any>(`/api/radiology/ImagingResults?patientId=${patientId}&reportOrderStatus=${reportOrderStatus}`, this.options);
    }

    public GetPatientVisitReports(patientVisitId: number) {
        return this.http.get<any>(`/api/radiology/PatientVisitsImagingResults?patientVisitId=${patientVisitId}`, this.options);
    }

    //imaging-result.component
    //get list of reports of selected patient using orderStatus
    public GetAllImagingReports(reportOrderStatus: string, frmDate: string, toDate: string, typeStr: string) {
        return this.http.get<any>(`/api/radiology/ImagingReports?reportOrderStatus=${reportOrderStatus}&fromDate=${frmDate}&toDate=${toDate}&typeList=${typeStr}`, this.options);
    }

    //imaging-report by requisitionId
    public GetImagingReportByRequisitionId(requisitionId: number) {
        return this.http.get<any>(`/api/radiology/ImagingReport?requisitionId=${requisitionId}`, this.options);
    }
    //gets the types of imaging items
    // Methos below is commented as it is not in use.
    // public GetImagingType() {
    //     return this.http.get<any>('/api/radiology/ImagingTypes', this.options);
    // }
    //getting report for patient view..(used in view-report.component)
    public GetEmpPreference(employeeId: number) {
        return this.http.get<any>("/api/radiology?reqType=employeePreference&employeeId=" + employeeId, this.options)
    }
    //get ReportText, imageNames, imageFolderpath by Id from imgRequisition or imgReport table
    public GetImagingReportContent(isRequisitionReport, id) {
        try {
            return this.http.get<any>(`/api/radiology/ReportDetail?isRequisitionReport=${isRequisitionReport}&id=${id}`, this.options)
        } catch (exception) {
            throw exception;
        }
    }
    //Method below is commented as it is not in use.
    //public GetReportingDoctor(imagingTypeId: number) {
    //    return this.http.get<any>("/api/radiology?reqType=reporting-doctor&imagingTypeId=" + imagingTypeId, this.options)
    //}
    public GetAllReportTemplates() {
        return this.http.get<any>("/api/radiology/ReportTemplates", this.options)
    }

    public GetDoctorList() {
        return this.http.get<any>("/api/radiology/Doctors", this.options)
    }
    //Get  scanned imaging files list for add to report
    //get data from pac server
    GetImgFileList(fromDate: string, toDate: string) {
        try {
            return this.http.get<any>(`/api/radiology/ImgingFilesFromPACS?fromDate=${fromDate}&toDate=${toDate}`, this.options)
        } catch (exception) {
            throw exception;
        }
    }
    //get report text by Imaging report id from report table
    //Method below is commented as it is not in use.
    // GetReportTextByImagingReportId(ImagingReportId) {
    //     try {
    //         return this.http.get<any>("/api/radiology?reqType=reportTextByRPTId&imagingReportId=" + ImagingReportId, this.options)
    //     } catch (exception) {
    //         throw exception;
    //     }
    // }
    //Get dicom viewer url and open dicom viewer
    // GetDICOMViewerByImgRptId(ImagingReportId, PatientStudyId) {
    //     try {
    //         return this.http.get<any>("/api/radiology?reqType=dicomViewerUrl&imagingReportId=" + ImagingReportId + "&PatientStudyId=" + PatientStudyId, this.options)
    //     } catch (exception) {
    //         throw exception;
    //     }
    // }
    //imaging-requistion-component
    //post all the requisition items
    public PostRequestItems(reqItemList: Array<ImagingItemRequisition>) {
        let data = JSON.stringify(reqItemList);
        return this.http.post<any>('/api/Radiology/Requisitions', data, this.options);
    }

    //imaging-report.component
    //post report
    //not used now
    public PostItemReport(itemReport: ImagingItemReport) {
        let data = JSON.stringify(itemReport);
        return this.http.post<any>('/api/Radiology/Report', data, this.options);
    }
    //imaging-report.component
    //post report
    public PostImgItemReport(formData: any) {
        try {
            return this.http.post<any>("/api/Radiology/Report", formData);

        } catch (exception) {
            throw exception;
        }
    }
    public UploadRadiologyFile(data: any) {
        try {
            return this.http.post<any>("/api/radiology/UploadFile", data);
        }
        catch (exception) {
            throw exception;
        }
    }
    public UpdateRadiologyFile(data: any) {
        try {
            return this.http.put<any>("/api/radiology/UploadFile", data);
        }
        catch (exception) {
            throw exception;
        }
    }
    public GetPatientFileDetail(patientDetail: any[]) {
        try {
            const patientDetailObject = patientDetail[0];
            const patientDetailString = encodeURIComponent(JSON.stringify(patientDetailObject));
            return this.http.get<any>(`/api/radiology/patientFileDetail?patientDetail=${patientDetailString}`, this.options);
        } catch (exception) {
            throw exception;
        }
    }


    PostPatientStudy(reportData) {
        try {
            return this.http.post<any>("/api/Radiology/PatientStudy", reportData, this.options);
        } catch (exception) {
            throw exception;
        }
    }

    public SendEmail(formData: any) {
        let data = formData;
        try {
            return this.http.post<any>("/api/Radiology/SendEmail", data, this.options)
        } catch (exception) {
            throw exception;
        }
    }

    //update billing status of imaging itme in imagingrequisition table
    //imaging-requisition.component
    public PutImagingReqsBillingStatus(requisitionIds: number[], billingStatus: string) {
        let data = JSON.stringify(requisitionIds);
        return this.http.put<any>(`/api/Radiology/BillingStatus?billingStatus=${billingStatus}`, data, this.options)
    }

    //imaging-report.component
    //update ImagingReport
    public PutImgItemReport(formData: any) {
        try {
            return this.http
                .put<any>('/api/Radiology/ImagingReport'
                    , formData);
        } catch (exception) {
            throw exception;
        }
    }

    //attach patient study (imaging files) with repor
    public PutPatientStudy(reportData) {
        try {
            return this.http
                .put<any>('/api/Radiology/PatientStudy'
                    , reportData, this.options);
        } catch (exception) {
            throw exception;
        }
    }
    //delete selected imaging report images before submit report
    //update imageName string and ImageFullPath in db
    public DeleteImgsByImagingRptId(reportModelData) {
        try {
            let data = JSON.stringify(reportModelData);
            return this.http.put<any>('/api/Radiology/DeleteReportImages', data, this.options);
        } catch (exception) {
            throw exception;
        }
    }

    //start: sud-5Feb'18--For Ward Billing--
    public GetRadiologyBillingItems() {
        return this.http.get<any>("/api/Billing/LabBillCfgItems?departmentName=radiology", this.options)
    }
    public CancelRadRequest(data: string) {
        return this.http.put<any>("/api/Billing/CancelInpatientItemFromWard", data, this.options);
    }
    public CancelInpatientCurrentLabTest(data) {
        return this.http.put<any>('/api/Lab/CancelInpatientLabTest', data, this.options);
    }

    public CancelBillRequest(data: string) {
        return this.http.put<any>("/api/Billing/CancelOutpatientProvisionalItem", data, this.options);
    }

    public PutDoctor(prescriberId: number, prescriberName: string, reqId: number) {
        let data = JSON.stringify(reqId);
        return this.http.put<any>(`/api/Radiology/Doctor?prescriberId=${prescriberId}&prescriberName=${prescriberName}`, data, this.options);
    }

    //end: sud-5Feb'18--For Ward Billing--

    public PutScannedDetails(scannedDetail: any) {
        try {
            return this.http
                .put<any>('/api/Radiology/PatientScanDone', scannedDetail, this.options);
        } catch (exception) {
            throw exception;
        }
    }
    // public GetPrintCount(requisitionId: number) {
    //     return this.http.put<any>("/api/Radiology/PrintCount?requisitionId=" + requisitionId, this.options);
    // }
    public GetPrintCount(requisitionId: number) {
        return this.http.put<any>(`/api/Radiology/PrintCount?requisitionId=${requisitionId}`, this.options);
    }
    public UpdateReferrer(referredById: number, referredByName: string, requisitionId: number) {
        const params = new HttpParams()
            .set('referredById', referredById.toString())
            .set('referredByName', referredByName)
            .set('requisitionId', requisitionId.toString());
        return this.http.put<DanpheHTTPResponse>('/api/Radiology/Referrer', null, { params, ...this.options });
    }

    public GetTemplatesStyles() {
        try {
            return this.http.get<DanpheHTTPResponse>("/api/RadiologySettings/TemplateStyle");
        } catch (exception) {
            throw exception;
        }
    }

}
