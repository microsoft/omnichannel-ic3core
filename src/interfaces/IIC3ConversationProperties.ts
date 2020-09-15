import IIC3ConversationStatusProperties from "./IIC3ConversationStatusProperties";

export default interface IIC3ConversationProperties {
    consumptionhorizon: string;
    consumptionHorizonBookmark?: string;
    picture: string;
    conversationblocked?: string;
    conversationstatus?: string;
    lastimreceivedtime: string;
    conversationstatusproperties?: IIC3ConversationStatusProperties;
    alerts?: any; // tslint:disable-line:no-any
    alertmatches?: any; // tslint:disable-line:no-any
    pinned?: string;
    favorite?: string;
    topic?: string;
}