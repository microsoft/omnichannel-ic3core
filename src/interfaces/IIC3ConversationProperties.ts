/* eslint-disable @typescript-eslint/no-explicit-any */

import IIC3ConversationStatusProperties from "./IIC3ConversationStatusProperties";

export default interface IIC3ConversationProperties {
    consumptionhorizon: string;
    consumptionHorizonBookmark?: string;
    picture: string;
    conversationblocked?: string;
    conversationstatus?: string;
    lastimreceivedtime: string;
    conversationstatusproperties?: IIC3ConversationStatusProperties;
    alerts?: any;
    alertmatches?: any;
    pinned?: string;
    favorite?: string;
    topic?: string;
}