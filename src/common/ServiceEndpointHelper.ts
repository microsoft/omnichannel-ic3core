import Constants from './Constants';
import HttpHeaders from '../http/HttpHeaders';
import Utilities from '../common/Utilities';
import IRegionGtms from '../model/IRegionGtms';

export default class ServiceEndpointHelper {
    public static getV2EndpointUrl(epid: string, regionGtms: IRegionGtms): string {
        return regionGtms.chatService + "/v2/users/ME/endpoints/" + epid;
    }

    public static getThreadUrl(threadId: string, regionGtms: IRegionGtms): string {
        return regionGtms.chatService + "/v1/threads/" + threadId + "?view=msnp24Equivalent";
    }

    public static getMessagesUrl(threadId: string, regionGtms: IRegionGtms): string {
        return regionGtms.chatService + "/v1/users/ME/conversations/" + threadId + "/messages";
    }

    public static getBotMessagesUrl(botId: string, regionGtms: IRegionGtms): string {
        return regionGtms.chatService + "/v1/agents/" + botId + "/invoke";
    }

    public static getAmsObjectsUrl(regionGtms: IRegionGtms) {
        return Utilities.sanitizeUrlWithBackSlash(regionGtms.ams) + "v1/objects";
    }

    public static getAmsObjectContentUrl(id: string, regionGtms: IRegionGtms, isImageFile: boolean = false) {
        const cloudDataContent = isImageFile
            ? Constants.ImageContent
            : Constants.FileContent;
        return Utilities.sanitizeUrlWithBackSlash(regionGtms.ams) + "v1/objects/" + id + "/content/" + cloudDataContent;
    }

    public static getAmsObjectViewUrl(id: string, regionGtms: IRegionGtms, isImageFile: boolean = false) {
        const fileView = isImageFile
            ? Constants.ImageView
            : Constants.FileView;
        return Utilities.sanitizeUrlWithBackSlash(regionGtms.ams) + "v1/objects/" + id + "/views/" + fileView;
    }

    public static getAmsStatusUrl(id: string, regionGtms: IRegionGtms, isImageFile: boolean = false) {
        const fileView = isImageFile
            ? Constants.ImageView
            : Constants.FileView;
        const url = Utilities.sanitizeUrlWithBackSlash(regionGtms.ams) + "v1/objects/" + id + "/views/" + fileView + "/status";
        return url;
    }

    public static getV1EndpointUrl(regionGtms: IRegionGtms): string {
        return regionGtms.chatService + "/v1/users/ME/endpoints";
    }

    public static getV1DeleteEndpointUrl(regionGtms: IRegionGtms, epid: string): string {
        return regionGtms.chatService + "/v1/users/ME/endpoints/" + epid;
    }

    public static getV1SubscriptionUrl(regionGtms: IRegionGtms): string {
        return regionGtms.chatService + "/v1/users/ME/endpoints/SELF/subscriptions";
    }

    public static getV1PollUrl(regionGtms: IRegionGtms, sid: string): string {
        return regionGtms.chatService + "/v1/users/ME/endpoints/SELF/subscriptions/" + sid + "/poll";
    }

    public static getV1SetPropertiesUrl(regionGtms: IRegionGtms): string {
        return regionGtms.chatService + "/v1/users/ME/endpoints/SELF/properties?name=" + HttpHeaders.SetEndpointProperty;
    }
}