/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-escape */

import Constants from "./Constants";
import DeliveryMode from "../model/DeliveryMode";
import FileSharingProtocolType from "../model/FileSharingProtocolType";
import HttpCode from "../http/HttpCode";
import IFileMetadata from "../model/IFileMetadata";
import IIC3FileProperty from "../interfaces/IIC3FileProperty";
import IIC3Info from "../interfaces/IIC3Info";
import IIC3Message from "../interfaces/IIC3Message";
import IIC3Thread from "../interfaces/IIC3Thread";
import IMessagePayload from "../model/IMessagePayload";
import IMessageProperties from "../model/IMessageProperties";
import IKeyValuePair from "../model/IKeyValuePair";
import IRawBotMessage from "../interfaces/IRawBotMessage";
import IRawMessage from "../model/IRawMessage";
import IRawThread from "../interfaces/IRawThread";
import MessageContentType from "../model/MessageContentType";
import MessagePayloadType from "../model/MessagePayloadType";
import MessageType from "../model/MessageType";
import PersonType from "../model/PersonType";
import ResourceType from "../model/ResourceType";
import ServiceEndpointHelper from "./ServiceEndpointHelper";
import TypingStatus from "../model/TypingStatus";
import Utilities from "./Utilities";

export default class Util {
    public static createMessageData(message: IRawMessage): IMessagePayload {
        const messageType = message.contentType === MessageContentType.Text ?
            MessagePayloadType.Text : MessagePayloadType.RichTextHtml;
        const encodedMessage = message.content;
        const messageData = Util.createBaseMessageData(messageType, message.contentType.toString(), encodedMessage);
        messageData.properties = this.getMessageProperties(message);
        if (!Utilities.isNullOrUndefined(message.sender.displayName)) {
            messageData.imdisplayname = message.sender.displayName;
        }
        return messageData;
    }

    public static createBaseMessageData(messagetype: string, contenttype: string, content: string): IMessagePayload {
        const messageData: IMessagePayload = {
            "Has-Mentions": "false",
            clientmessageid: Date.now().toString(),
            composetime: new Date().toISOString(),
            content,
            contenttype,
            messagetype
        };
        return messageData;
    }

    public static getMessageProperties(message: IRawMessage): IKeyValuePair {
        const properties: IKeyValuePair = {};
        properties.deliveryMode = message.deliveryMode.toString();
        if (message.tags) {
            const tags: string[] = [];
            message.tags.forEach((tagName) => {
                tags.push(tagName);
            });
            properties.tags = tags.join();
        }
        return properties;
    }

    public static createTypingStatusThreadMessageData(typingStatus: TypingStatus, optionalProperties?: IMessageProperties): IMessagePayload {
        let messageType = "";
        switch (typingStatus) {
            case TypingStatus.Typing:
                messageType = MessagePayloadType.ControlTyping;
                break;
            case TypingStatus.ClearTyping:
                messageType = MessagePayloadType.ControlClearTyping;
                break;
        }
        let messageData = Util.createBaseMessageData(messageType, MessageContentType.Text, "");
        if (!Utilities.isNullOrUndefined(optionalProperties)) {
            messageData = { ...optionalProperties, ...messageData };
        }
        return messageData;
    }

    public static createBotMessageData(conversationId: string, message: IRawBotMessage): string {
        const botMessage = {
            conversation: {
                id: conversationId
            },
            value: message
        };
        return JSON.stringify(botMessage);
    }

    public static createFileMessage(filemetadata: IFileMetadata, ic3Info: IIC3Info, message: IRawMessage): IMessagePayload {
        const messageType = MessagePayloadType.Text;
        const contentType = MessageContentType.Text.toString().toLowerCase();
        const messageData = Util.createBaseMessageData(messageType, contentType.toString(), "");
        messageData.amsreferences = JSON.stringify([filemetadata.id]);
        messageData.properties = JSON.stringify(this.createFileMessageProperties(filemetadata, ic3Info, message));
        if (!Utilities.isNullOrUndefined(message.sender.displayName)) {
            messageData.imdisplayname = message.sender.displayName;
        }
        return messageData;
    }

    public static createFileMessageProperties(fileInfo: IFileMetadata, ic3Info: IIC3Info, message: IRawMessage): IKeyValuePair {
        const properties: IKeyValuePair = {};
        properties.deliveryMode = message.deliveryMode.toString();
        properties.files = JSON.stringify([this.createFileProperty(fileInfo, ic3Info)]);
        properties.importance = '';
        properties.subject = "";
        if (message.tags) {
            const tags: string[] = [];
            message.tags.forEach((tagName) => {
                tags.push(tagName);
            });
            properties.tags = tags.join();
        }
        return properties;
    }

    public static createFileProperty(fileInfo: IFileMetadata, ic3Info: IIC3Info): IIC3FileProperty {
        const isFileImage = Util.isDocumentTypeImage(fileInfo.type)
            ? true
            : false;
        return {
            '@type': 'http://schema.skype.com/File',
            'type': fileInfo.type,
            'itemid': '',
            'baseUrl': '',
            'providerData': '',
            'version': 2,
            'id': fileInfo.id,
            'title': fileInfo.name,
            'state': 'active',
            'objectUrl': ServiceEndpointHelper.getAmsObjectViewUrl(fileInfo.id, ic3Info.RegionGtms, isFileImage),
            'fileName': fileInfo.name,
            'fileType': Util.getNameAndExtension(fileInfo.name).extension,
            'botFileProperties': {
                url: ServiceEndpointHelper.getAmsObjectViewUrl(fileInfo.id, ic3Info.RegionGtms, isFileImage)
            },
            'fileInfo': {
                fileUrl: ServiceEndpointHelper.getAmsObjectContentUrl(fileInfo.id, ic3Info.RegionGtms, isFileImage),
                siteUrl: '',
                serverRelativeUrl: ''
            },
            'filePreview': {
                previewUrl: ''
            }
        } as IIC3FileProperty;
    }

    public static getNameAndExtension(filename: string): { name: string, extension: string } {
        const nameAndExtensionMatcher = (filename || '').split('.');
        let name = '';
        let extension = '';
        if (nameAndExtensionMatcher.length > 1) {
            extension = nameAndExtensionMatcher.pop()!.toLowerCase(); // eslint-disable-line @typescript-eslint/no-non-null-assertion
            name = nameAndExtensionMatcher.join('.');
        } else {
            extension = '';
            name = nameAndExtensionMatcher[0];
        }
        return { name, extension };
    }

    public static createIRawMessage(message: IIC3Message, ic3Info: IIC3Info, resourceType?: ResourceType): IRawMessage {
        const rawMessage: IRawMessage = {
            clientmessageid: message.clientmessageid,
            content: message.content,
            contentType: Util.getMessageContentType(message),
            deliveryMode: !Utilities.isNullOrUndefined(message.properties) && message.properties.deliveryMode === DeliveryMode.Bridged ?
                DeliveryMode.Bridged : DeliveryMode.Unbridged,
            messageType: Util.getMessageType(message),
            properties: message.properties as IMessageProperties,
            sender: { displayName: (message.imdisplayname as string), id: (message.from as string), type: Util.getPersonType(message.from as string) },
            timestamp: new Date(Date.parse(message.originalarrivaltime as string))
        };

        if (resourceType) {
            rawMessage.resourceType = resourceType;
        }

        if (!Utilities.isNullOrUndefined(message.properties)) {
            if (!Utilities.isNullOrEmptyString((message.properties as IMessageProperties).tags)) {
                let tagsReceived: string[] = [];
                tagsReceived = (message.properties as IMessageProperties).tags.split(",");
                rawMessage.tags = tagsReceived;
            }
        }

        if (!Utilities.isNullOrUndefined(message.properties)) {
            if (!Utilities.isNullOrEmptyString((message.properties as IMessageProperties).files)) {
                let filesRecieved: IIC3FileProperty[] = [];
                filesRecieved = JSON.parse((message.properties as IMessageProperties).files);
                if (filesRecieved.length > 0) {
                    let fileId = filesRecieved[0].id;
                    if (Utilities.isNullOrUndefined(fileId) && message.amsreferences) {
                        fileId = message.amsreferences[0];
                    }
                    const fileUrl = Util.getFileUrl(filesRecieved[0], fileId, ic3Info);
                    const fileMetadata: IFileMetadata = {
                        fileSharingProtocolType: FileSharingProtocolType.AmsBasedFileSharing,
                        id: fileId,
                        name: filesRecieved[0].fileName,
                        size: filesRecieved[0].version,
                        type: filesRecieved[0].fileType,
                        url: fileUrl as string
                    };
                    rawMessage.fileMetadata = fileMetadata;
                }
            }
        }
        return rawMessage;
    }

    public static createIRawThread(message: IIC3Thread): IRawThread {
        const rawThread: IRawThread = {
            id: message.id,
            members: message.members,
            messages: message.messages,
            properties: message.properties,
            rosterVersion: message.rosterVersion,
            type: message.type,
            version: message.version
        };
        return rawThread;
    }

    public static getConversationIdFromUrl(url: any) {
        const matches = url && url.match(/\/(\d+:[^\/]*)[\/]?/);
        return (matches && matches[1]) ? matches[1] : undefined;
    }

    public static isSystemMessage(message: IIC3Message): boolean {
        let isSystemMessage = false;
        if (!Utilities.isNullOrEmptyString(message.messagetype)) {
            isSystemMessage = Util.getSystemMessageTypes().reduce((isSystemMessageTillNow: any, systemMessageType: any) => {
                return isSystemMessageTillNow || message.messagetype.toLowerCase().indexOf(systemMessageType.toLowerCase()) === 0;
            }, isSystemMessage);
        }
        return isSystemMessage;
    }

    public static getPersonType(personId: string): PersonType {
        let personType = PersonType.Unknown;
        const sanitizedPersonId = personId.split("/").pop()  as string;
        if (sanitizedPersonId.indexOf("28:") === 0) {
            personType = PersonType.Bot;
        } else if (sanitizedPersonId.indexOf("19:") === 0) {
            personType = PersonType.User;
        }
        return personType;
    }

    public static isImageType(fileType: string): boolean {
        switch (fileType.toLowerCase()) {
            case "jpeg":
            case "jpg":
            case "gif":
            case "png":
            case "bmp":
            case "tiff":
            case "jfif":
                return true;
            default:
                return false;
        }
    }

    private static getMessageType(message: IIC3Message): string {
        let messageType: string;

        switch (message.messagetype) {
            case MessageType.Typing:
                messageType = MessageType.Typing;
                break;
            case MessageType.ClearTyping:
                messageType = MessageType.ClearTyping;
                break;
            default:
                messageType = MessageType.UserMessage;
        }

        return messageType;
    }

    private static getMessageContentType(message: IIC3Message): string {
        let messageContentType: string;
        const contentType = message.contenttype ? message.contenttype : message.messagetype;
        if (contentType === MessagePayloadType.Text.toLowerCase()) {
            messageContentType = MessageContentType.Text;
        } else if (contentType.indexOf(Constants.TextPlainMimeType) >= 0) {
            messageContentType = MessageContentType.Text;
        } else {
            messageContentType = MessageContentType.RichText;
        }
        return messageContentType;
    }

    private static getSystemMessageTypes(): string[] {
        return [
            "ThreadActivity"
        ];
    }

    private static getFileUrl(fileProperty: IIC3FileProperty, fileId: string, ic3Info: IIC3Info) {
        const fileInfo = fileProperty.fileInfo;
        let fileUrl;

        if (fileInfo && fileInfo.fileUrl) {
            fileUrl = fileInfo.fileUrl;
        } else if (fileId) {
            const isFileImage = Util.isImageType(fileProperty.fileType);
            fileUrl = ServiceEndpointHelper.getAmsObjectContentUrl(fileId, ic3Info.RegionGtms, isFileImage);
        }
        return fileUrl;
    }

    public static isDocumentTypeImage(contentType: string): boolean {
        return contentType.indexOf(Constants.Image) !== -1;
    }

    public static getDomainRegexp(): RegExp {
        return new RegExp(/^(https?:.+?\.microsoft\.com)/i);
    }

    public static parseDomain(url: string) {
        const match = url.match(Util.getDomainRegexp());
        if (match) {
            return match[1];
        }
        return null;
    }

    public static parseChatServiceHostUrl(url: string): string {
        return Util.parseDomain(url) as string;
    }

    public static shouldRetryOnFailure(status: number): boolean {
        return (status !== HttpCode.Accepted && status !== HttpCode.Created);
    }
}