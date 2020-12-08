/* eslint-disable @typescript-eslint/no-explicit-any */

import IC3ThreadType from "../enums/IC3ThreadType";

export default interface IIC3ThreadProperties {
    createdat: string;
    tenantid: string;
    partnerName: string;
    containsExternalEntitiesListeningAll: string;
    threadType: IC3ThreadType;
    creator: string;
    historydisclosed: string;
    capabilities: any[];
}