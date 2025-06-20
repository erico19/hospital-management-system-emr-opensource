import * as moment from "moment";
import { AuditTrailModel } from "../../../app/system-admin/shared/audit-trail-model";
import { CodeDetailsModel } from "../../shared/code-details.model";
import { ChartofAccountModel } from "../settings/shared/chart-of-account.model";
import { CostCenterModel } from "../settings/shared/cost-center.model";
import { Hospital_DTO } from "../settings/shared/dto/hospitals.dto";
import { FiscalYearModel } from "../settings/shared/fiscalyear.model";
import { LedgerModel } from "../settings/shared/ledger.model";
import { ledgerGroupModel } from "../settings/shared/ledgerGroup.model";
import { PrimaryGroupModel } from "../settings/shared/primary-group.model";
import { SectionModel } from "../settings/shared/section.model";
import { VoucherHeadModel } from "../settings/shared/voucherhead.model";
import { SubLedger_DTO } from "../transactions/shared/DTOs/subledger-dto";
import { Voucher } from "../transactions/shared/voucher";
//this class is to reuse inside accounting for hospital related information.
//created: 21Jun'20- Sud/Nagesh
//We can extend this model to fill up other information of current hospital whenever required.

export class AccHospitalInfoVM {
    public ActiveHospitalId: number = 0;
    public FiscalYearList: Array<FiscalYearModel> = [];
    public SectionList: Array<SectionModel> = [];
    public TodaysDate: string = moment().format("YYYY-MM-DD");

    //below properties are only for client side..
    public HospitalShortName: string = null;
    public HospitalLongName: string = null;
    public TotalHospitalPermissionCount: number = 0;
    public CurrFiscalYear: FiscalYearModel = new FiscalYearModel();
    public PermissionId: number = 0;
}

//mumbai-team-june2021-danphe-accounting-cache-change
export class AccCacheDataVM {
    public VoucherType: Array<Voucher> = new Array<Voucher>();
    public COA: Array<ChartofAccountModel> = new Array<ChartofAccountModel>();
    public PrimaryGroup: Array<PrimaryGroupModel> = new Array<PrimaryGroupModel>();
    public VoucherHead: Array<VoucherHeadModel> = new Array<VoucherHeadModel>();
    public FiscalYearList: Array<FiscalYearModel> = new Array<FiscalYearModel>();
    public Sections: Array<SectionModel> = new Array<SectionModel>();
    public CodeDetails: Array<CodeDetailsModel> = new Array<CodeDetailsModel>();
    public AuditReportType: Array<AuditTrailModel> = new Array<AuditTrailModel>();
    public LedgerGroups: Array<ledgerGroupModel> = new Array<ledgerGroupModel>();
    public Ledgers: Array<LedgerModel> = new Array<LedgerModel>();
    public LedgersALL: Array<LedgerModel> = new Array<LedgerModel>();
    public SubLedgerAll: Array<SubLedger_DTO> = new Array<SubLedger_DTO>();
    public CostCenters: Array<CostCenterModel> = new Array<CostCenterModel>();
    public Hospitals: Array<Hospital_DTO> = new Array<Hospital_DTO>();
}