/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-inferrable-types */

import AmsHelper from "../ams/AmsHelper";
import Constants from "../common/Constants";
import FileSharingProtocolType from "../model/FileSharingProtocolType";
import FileStatus from "../model/FileStatus";
import HostType from "../interfaces/HostType";
import { HttpClient, IHttpRequestAttributes } from "../http/HttpClient";
import HttpDataType from "../http/HttpDataType";
import HttpHeaders from "../http/HttpHeaders";
import HttpRequestType from "../http/HttpRequestType";
import IIC3Info from "../interfaces/IIC3Info";
import IC3Initializer from "./IC3Initializer";
import IC3TelemetryEvent from "../logging/IC3TelemetryEvent";
import IFileInfo from "../interfaces/IFileInfo";
import IFileMetadata from "../model/IFileMetadata";
import IIC3Adapter from "../interfaces/IIC3Adapter";
import IIC3GetMessagesResponse from "../interfaces/IIC3GetMessagesResponse";
import IIC3Message from "../interfaces/IIC3Message";
import IIC3Thread from "../interfaces/IIC3Thread";
import IInitializationInfo from "../model/IInitializationInfo";
import IInternalConversationData from "../interfaces/IInternalConversationData";
import IMessagePayload from "../model/IMessagePayload";
import IMessageProperties from "../model/IMessageProperties";
import IPerson from "../model/IPerson";
import IRawBotMessage from "../interfaces/IRawBotMessage";
import IRawConversation from "../model/IRawConversation";
import IRawLogger from "../logging/IRawLogger";
import IRawMessage from "../model/IRawMessage";
import IRawSDKSetupParameters from "../interfaces/IRawSDKSetupParameters";
import IRawThread from "../interfaces/IRawThread";
import LogLevel from "../logging/LogLevel";
import MessageContentType from "../model/MessageContentType";
import MessagePayloadType from "../model/MessagePayloadType";
import ProtocolType from "../interfaces/ProtocoleType";
import RequestHelper from "../http/RequestHelper";
import ResourceType from "../model/ResourceType";
import ServiceEndpointHelper from "../common/ServiceEndpointHelper";
import TypingStatus from "../model/TypingStatus";
import Util from "../common/Util";
import Utilities from "../common/Utilities";

export default abstract class IC3ClientAdapter implements IIC3Adapter {
    public id: string;
    public hostType: HostType = HostType.Page;
    public protocolType: ProtocolType = ProtocolType.IC3V1SDK;
    public logger: IRawLogger | undefined;
    public heartBeatTimer?: number;
    protected conversations: IRawConversation[];
    protected ic3Info?: IIC3Info;
    protected EndpointUrl: string | undefined;
    protected EndpointId: string | undefined;
    protected newConversationMessageListeners: { [conversationId: string]: Array<(message: IRawMessage) => void> };
    protected internalConversationsData: { [conversationId: string]: IInternalConversationData };
    protected threadUpdateListeners: { [conversationId: string]: Array<(message: IRawThread) => void> };
    protected ic3Initializer: IC3Initializer | undefined;
    protected liveStateFailureCount: number;
    protected debug: boolean;

    constructor(id: string) {
        this.id = id;
        this.conversations = [];
        this.newConversationMessageListeners = {};
        this.threadUpdateListeners = {};
        this.internalConversationsData = {};
        this.liveStateFailureCount = 0;
        this.debug = false;
    }

    public startPolling() {
        this.ic3Initializer && this.ic3Initializer.startPolling();
    }

    public stopPolling() {
        this.ic3Initializer && this.ic3Initializer.stopPolling();
    }

    public setup(setupParams: IRawSDKSetupParameters): Promise<void> {
        this.logger = setupParams.logger;
        HttpClient.setLogger(this.logger);
        return Promise.resolve();
    }

    public initialize(sessionInfo: IInitializationInfo): Promise<void> {
        this.setupSession(sessionInfo);
        return Promise.resolve();
    }

    public update(_sessionInfo: IInitializationInfo): Promise<void> {
        return Promise.resolve();
    }

    public dispose(): Promise<void> {
        // stop polling
        this.conversations = [];
        this.newConversationMessageListeners = {};
        this.threadUpdateListeners = {};
        this.internalConversationsData = {};
        return Promise.resolve();
    }

    public joinConversation(conversationId: string, sendHeartBeat: boolean = true): Promise<IRawConversation> {
        const timer = Utilities.timer();
        const conversation: IRawConversation = {
            id: conversationId
        };

        const conversationIndex = this.conversations.findIndex((conv) => conv.id === conversation.id);
        if (conversationIndex === -1) {
            this.conversations.push(conversation);
            this.newConversationMessageListeners[conversation.id] = this.newConversationMessageListeners[conversation.id] || [];
            this.threadUpdateListeners[conversation.id] = this.threadUpdateListeners[conversation.id] || [];
        }

        this.logger?.log(LogLevel.INFO, IC3TelemetryEvent.JoinConversation, {
            ElapsedTimeInMilliseconds: timer.milliSecondsElapsed,
            EndpointUrl: this.EndpointUrl,
            EndpointId: this.EndpointId
        } as any);

        if (!Utilities.isNullOrUndefined(sendHeartBeat) && sendHeartBeat === true) {
            this.sendHeartBeat(conversation.id);
        }
        return Promise.resolve(conversation);
    }

    /**
     * Sends live state to conversation.
     *
     * @param conversationId Conversation id
     */
    public sendLiveState(conversationId: string): Promise<void> {
        this.debug && console.debug("IC3Core/sendLiveState");
        const messageType = MessagePayloadType.LiveState;
        const messageContentType = MessageContentType.Text;
        const messagePayload: IMessagePayload = Util.createBaseMessageData(messageType, messageContentType, "");
        return this.sendMessageToIC3(conversationId, messagePayload).then(() => {
            this.liveStateFailureCount = 0;
            return Promise.resolve();
        }).catch((e: any) => {
            this.liveStateFailureCount++;
            if (this.liveStateFailureCount >= Constants.liveStateRetryCount) {
                this.logger?.log(LogLevel.ERROR, IC3TelemetryEvent.SendLiveStateFailure, {
                    ExceptionDetails: e,
                    EndpointUrl: this.EndpointUrl,
                    EndpointId: this.EndpointId
                } as any);
                this.stopHeartBeat();
                this.liveStateFailureCount = 0;
            }
        });
    }

    /**
     * Sends live state regularly to prevent conversation from disconnecting after 2 minutes.
     *
     * @param conversationId Conversation id
     */
    public sendHeartBeat(conversationId: string) {
        if (!this.heartBeatTimer) {
            this.debug && console.debug("IC3Core/sendHeartBeat");
            this.sendLiveState(conversationId);
            this.heartBeatTimer = window.setInterval(this.sendLiveState.bind(this, conversationId), Constants.heartBeatDuration);
        }
    }

    public stopHeartBeat() {
        clearInterval(this.heartBeatTimer);
    }

    public sendMessage(conversation: IRawConversation, message: IRawMessage): Promise<void> {
        const messagePayload: IMessagePayload = Util.createMessageData(message);
        return this.sendMessageToIC3(conversation.id, messagePayload);
    }

    public getMessages(conversation: IRawConversation): Promise<IRawMessage[]> {
        const defaultGetMessagesQueryParameters = RequestHelper.getDefaultGetMessagesQueryParameters();
        const url = Utilities.addQueryParametersToPath(
            ServiceEndpointHelper.getMessagesUrl(conversation.id, this.ic3Info!.RegionGtms),
            defaultGetMessagesQueryParameters
        );
        const headers: any = RequestHelper.getDefaultIC3Headers();
        headers[HttpHeaders.RegistrationTokenHeader] = this.ic3Info!.RegistrationToken;
        headers[HttpHeaders.ContentTypeHeader] = Constants.ContentTypeJson;
        const requestParameters: IHttpRequestAttributes = {
            enableExponentialBackoff: true,
            headers,
            redirect404RetryCount: Constants.retryCount,
            retryCount: Constants.retryCount,
            shouldRedirectOn404: false,
            shouldResetOnFailure: false,
            shouldRetryOnFailure: Util.shouldRetryOnFailure,
            timeBetweenRetry: Constants.timeBetweenOperationRetry,
            type: HttpRequestType.GET,
            url
        };
        return HttpClient.MakeRequest<IIC3GetMessagesResponse>(requestParameters).then((response) => {
            const previousMessages: IRawMessage[] = [];
            for (const message of response.messages) {
                if (!Util.isSystemMessage(message)) {
                    previousMessages.push(Util.createIRawMessage(message, this.ic3Info!));
                }
            }
            return this.getAllMessagesFromBackwardLinkUrl(response._metadata.backwardLink as any, defaultGetMessagesQueryParameters.startTime, previousMessages);
        });
    }

    public registerOnNewMessage(conversation: IRawConversation, callback: (message: IRawMessage) => void): Promise<void> {
        this.newConversationMessageListeners[conversation.id].push(callback);
        this.logger?.log(LogLevel.INFO, IC3TelemetryEvent.RegisterOnNewMessage, {
            EndpointUrl: this.EndpointUrl,
            EndpointId: this.EndpointId
        } as any);
        return Promise.resolve();
    }

    public registerOnThreadUpdate(conversation: IRawConversation, callback: (message: IRawThread) => void): Promise<void> {
        this.threadUpdateListeners[conversation.id].push(callback);
        this.logger?.log(LogLevel.INFO, IC3TelemetryEvent.RegisterOnThreadUpdate, {
            EndpointUrl: this.EndpointUrl,
            EndpointId: this.EndpointId
        } as any);
        return Promise.resolve();
    }

    public disconnectFromConversation(conversation: IRawConversation): Promise<void> {
        this.conversations.findIndex((conv) => conv.id === conversation.id);
        delete this.internalConversationsData[conversation.id];
        if (this.ic3Info!.visitor) {
            this.stopHeartBeat();
            this.stopPolling();
        }
        return Promise.resolve();
    }

    public sendFileData(conversation: IRawConversation, fileInfo: IFileInfo, fileSharingProtocolType?: FileSharingProtocolType): Promise<any> {
        if (Utilities.isNullOrUndefined(fileSharingProtocolType)) {
            fileSharingProtocolType = FileSharingProtocolType.AmsBasedFileSharing;
        }

        if (fileInfo.size <= 0) {
            throw new Error("File size is lesser or equal to zero.");
        }

        const fileMetadata: IFileMetadata = {
            fileSharingProtocolType,
            id: "",
            name: fileInfo.name,
            size: fileInfo.size,
            type: fileInfo.type,
            url: ""
        };

        return new Promise((resolve, reject) => {
            AmsHelper.createNewDocument(conversation.id, fileInfo, this.ic3Info!)
                .then((response) => {
                    fileMetadata.id = response.id;
                    const isFileImage = Util.isDocumentTypeImage(fileInfo.type);
                    fileMetadata.url = ServiceEndpointHelper.getAmsObjectContentUrl(response.id, this.ic3Info!.RegionGtms, isFileImage);

                    AmsHelper.uploadDocument(response.id, fileInfo, this.ic3Info!).then(() => {
                        resolve(fileMetadata);
                    }).
                    catch((e) => {
                        reject(e);
                    });
                })
                .catch((e) => {
                    reject(e);
                });
        });
    }

    public sendFileMessage(conversation: IRawConversation, fileMetadata: IFileMetadata, message: IRawMessage): Promise<void> {
        return this.sendMessageToIC3(conversation.id, Util.createFileMessage(fileMetadata, this.ic3Info!, message));
    }

    public downloadFileData(_conversation: IRawConversation, fileMetaData: IFileMetadata): Promise<any> {
        this.debug && console.debug(`IC3Core/IC3ClientAdapter/downloadFileData`);
        return new Promise((resolve, reject) => {
            let fileProtocolType = fileMetaData.fileSharingProtocolType;
            if (Utilities.isNullOrUndefined(fileProtocolType)) {
                fileProtocolType = FileSharingProtocolType.AmsBasedFileSharing;
            }
            if (fileProtocolType === FileSharingProtocolType.AmsBasedFileSharing) {
                AmsHelper.downloadDocument(fileMetaData, this.ic3Info!).then((response) => {
                    resolve(response);
                })
                .catch((e) => {
                    reject(e);
                });
            } else {
                reject("This Protocol is not implemented");
            }
        });
    }

    public getFileStatus(_conversation: IRawConversation, fileMetadata: IFileMetadata): Promise<FileStatus> {
        return new Promise((resolve, reject) => {
            let fileProtocolType = fileMetadata.fileSharingProtocolType;
            if (Utilities.isNullOrUndefined(fileProtocolType)) {
                fileProtocolType = FileSharingProtocolType.AmsBasedFileSharing;
            }
            if (fileProtocolType === FileSharingProtocolType.AmsBasedFileSharing) {
                AmsHelper.getFileStatus(fileMetadata, this.ic3Info!)
                    .then((response) => {
                        resolve(response);
                    })
                    .catch((e) => {
                        reject(`${FileStatus.Error} e`);
                    });
            } else {
                reject("This Protocol is not implemented");
            }
        });
    }

    public indicateTypingStatus(conversation: IRawConversation, typingStatus: TypingStatus, optionalProperties?: IMessageProperties): Promise<void> {
        const messageData = Util.createTypingStatusThreadMessageData(typingStatus, optionalProperties);
        return this.sendMessageToIC3(conversation.id, messageData);
    }

    public sendMessageToBot(conversation: IRawConversation, botId: string, botMessage: IRawBotMessage): Promise<void> {
        const messageData = Util.createBotMessageData(conversation.id, botMessage);
        const url = ServiceEndpointHelper.getBotMessagesUrl(botId, this.ic3Info!.RegionGtms);
        const headers: any = RequestHelper.getDefaultIC3Headers();
        headers[HttpHeaders.RegistrationTokenHeader] = this.ic3Info!.RegistrationToken;
        headers[HttpHeaders.ContentTypeHeader] = Constants.ContentTypeTextPlain;
        const requestParameters: IHttpRequestAttributes = {
            data: messageData,
            dataType: HttpDataType.TEXT,
            enableExponentialBackoff: true,
            headers,
            redirect404RetryCount: Constants.retryCount,
            retryCount: Constants.retryCount,
            shouldRedirectOn404: false,
            shouldResetOnFailure: false,
            shouldRetryOnFailure: Util.shouldRetryOnFailure,
            timeBetweenRetry: Constants.timeBetweenOperationRetry,
            type: HttpRequestType.POST,
            url
        };
        return HttpClient.MakeRequest<void>(requestParameters);
    }

    public getMembers(conversation: IRawConversation): Promise<IPerson[]> {
        // Note: Currently, the thread members are not updated each time a member is added or deleted
        // This functionality can be added in future
        const conversationMembers = this.internalConversationsData[conversation.id].members;
        const members: IPerson[] = [];
        if (!Utilities.isNullOrUndefinedOrEmptyArray(conversationMembers)) {
            conversationMembers.forEach((conversationMember) => {
                const memberToAdd: IPerson = {
                    displayName: conversationMember.friendlyName,
                    id: conversationMember.id,
                    type: Util.getPersonType(conversationMember.id)
                };
                members.push(memberToAdd);
            });
        }
        return Promise.resolve(members);
    }

    /**
     * Sends message to IC3.
     *
     * @param conversationId IC3 conversation thread id
     * @param messageData IC3 message payload
     */
    protected sendMessageToIC3(conversationId: string, messageData: IMessagePayload): Promise<any> {
        const url = ServiceEndpointHelper.getMessagesUrl(conversationId, this.ic3Info!.RegionGtms);
        const headers: any = RequestHelper.getDefaultIC3Headers();
        headers[HttpHeaders.RegistrationTokenHeader] = this.ic3Info!.RegistrationToken;
        headers[HttpHeaders.ContentTypeHeader] = Constants.ContentTypeJson;
        const requestParameters: IHttpRequestAttributes = {
            data: JSON.stringify(messageData),
            enableExponentialBackoff: true,
            headers,
            redirect404RetryCount: Constants.retryCount,
            retryCount: Constants.retryCount,
            shouldRedirectOn404: false,
            shouldResetOnFailure: false,
            shouldRetryOnFailure: Util.shouldRetryOnFailure,
            timeBetweenRetry: Constants.timeBetweenOperationRetry,
            type: HttpRequestType.POST,
            url
        };
        return HttpClient.MakeRequest<any>(requestParameters);
    }

    protected onNewMessage(conversation: IRawConversation, message: IIC3Message, resourceType?: ResourceType) {
        const timer = Utilities.timer();
        try {
            if (conversation) {
                if (!Utilities.isNullOrUndefined(this.newConversationMessageListeners[conversation.id])) {
                    if (!Util.isSystemMessage(message)) {
                        this.newConversationMessageListeners[conversation.id].forEach((callback) => {
                            const messageToBeSent = Util.createIRawMessage(message, this.ic3Info!, resourceType);
                            callback(messageToBeSent);
                            return;
                        });
                    }
                }
            }
        } catch (e) {
            const elapsedTimeInMilliseconds = timer.milliSecondsElapsed;
            this.logger?.log(LogLevel.ERROR, IC3TelemetryEvent.OnNewMessageFailure, {
                ExceptionDetails: e,
                ElapsedTimeInMilliseconds: elapsedTimeInMilliseconds,
                EndpointUrl: this.EndpointUrl,
                EndpointId: this.EndpointId
            } as any);
            return;
        }
    }

    protected onThreadUpdate(conversation: IRawConversation, message: IIC3Thread) {
        const timer = Utilities.timer();
        try {
            if (conversation) {
                if (!Utilities.isNullOrUndefined(this.threadUpdateListeners[conversation.id])) {
                    this.threadUpdateListeners[conversation.id].forEach((callback) => {
                        const messageToBeSent = Util.createIRawThread(message);
                        callback(messageToBeSent);
                        return;
                    });
                }
            }
        } catch (e) {
            const elapsedTimeInMilliseconds = timer.milliSecondsElapsed;
            this.logger?.log(LogLevel.ERROR, IC3TelemetryEvent.OnThreadUpdateFailure, {
                ExceptionDetails: e,
                ElapsedTimeInMilliseconds: elapsedTimeInMilliseconds,
                EndpointUrl: this.EndpointUrl,
                EndpointId: this.EndpointId
            } as any);
            return;
        }
    }

    private getAllMessagesFromBackwardLinkUrl(backwardLinkUrl: string, startTime: number, previousMessages: IRawMessage[]): Promise<IRawMessage[]> {
        if (Utilities.isNullOrEmptyString(backwardLinkUrl)) {
            return Promise.resolve(previousMessages);
        }

        return this.getMessagesFromBackwardLinkUrl(backwardLinkUrl, startTime).then((response: any) => {
            for (const message of response.messages) {
                if (!Util.isSystemMessage(message)) {
                    previousMessages.push(Util.createIRawMessage(message, this.ic3Info!));
                }
            }
            return this.getAllMessagesFromBackwardLinkUrl(response._metadata.backwardLink, startTime, previousMessages);
        });
    }

    private getMessagesFromBackwardLinkUrl(backwardLinkUrl: string, startTime: number): Promise<IIC3GetMessagesResponse> {
        const startTimeQueryParameter = { startTime };
        const url = Utilities.addQueryParametersToPath(backwardLinkUrl, startTimeQueryParameter);
        const headers:any  = RequestHelper.getDefaultIC3Headers();
        headers[HttpHeaders.RegistrationTokenHeader] = this.ic3Info!.RegistrationToken;
        headers[HttpHeaders.ContentTypeHeader] = Constants.ContentTypeJson;
        const requestParameters: IHttpRequestAttributes = {
            enableExponentialBackoff: true,
            headers,
            redirect404RetryCount: Constants.retryCount,
            retryCount: Constants.retryCount,
            shouldRedirectOn404: false,
            shouldResetOnFailure: false,
            shouldRetryOnFailure: Util.shouldRetryOnFailure,
            timeBetweenRetry: Constants.timeBetweenOperationRetry,
            type: HttpRequestType.GET,
            url
        };
        return HttpClient.MakeRequest<IIC3GetMessagesResponse>(requestParameters);
    }

    private setupSession(sessionInfo: IInitializationInfo) {
        this.ic3Info = { SkypeToken: sessionInfo.token, RegionGtms: sessionInfo.regionGtms, visitor: sessionInfo.visitor };
        if (!Utilities.isNullOrUndefined(this.ic3Info)) {
            this.EndpointId = this.ic3Info.endpointId;
            this.EndpointUrl = this.ic3Info.RegionGtms ? this.ic3Info.RegionGtms.chatService : "";
        }
    }

    public setDebug(flag: boolean = false) {
        this.debug = flag;
    }
}