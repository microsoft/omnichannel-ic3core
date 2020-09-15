import ConversationGenerator from './ConversationGenerator';
import IRegionGtms from './IRegionGtms';

export default interface IInitializationInfo {
    token: string;
    regionGtms: IRegionGtms;
    conversationGenerator?: ConversationGenerator;
    visitor?: boolean;
}