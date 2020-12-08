/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */

import HostType from "../interfaces/HostType";
import ProtocolType from "../interfaces/ProtocoleType";
import IConversation from "../model/IConversation";
import IRawSDKSetupParameters from "../interfaces/IRawSDKSetupParameters";
import IInitializationInfo from "../model/IInitializationInfo";
import IRawConversation from "../model/IRawConversation";
import IRawMessage from "../model/IRawMessage";
import IFileInfo from "../interfaces/IFileInfo";
import FileSharingProtocolType from "../model/FileSharingProtocolType";
import IFileMetadata from "../model/IFileMetadata";
import FileStatus from "../model/FileStatus";
import TypingStatus from "../model/TypingStatus";
import IMessageProperties from "../model/IMessageProperties";
import IRawBotMessage from "../interfaces/IRawBotMessage";
import IPerson from "../model/IPerson";
import IRawThread from "../interfaces/IRawThread";
import { uuidv4 } from "../utils/uuid";
import IRawSDK from "../interfaces/IRawSDK";
import IRawLogger from "../logging/IRawLogger";

// TODO: Use TimeOutEventDispatcher in listeners
export default abstract class ClientBridge implements IRawSDK {
    public id: string;
    public protocolType: ProtocolType;
    public hostType: HostType = HostType.Page;
    public logger!: IRawLogger;
    protected newConversationMessageListeners: { [conversationId: string]: any };
    protected threadUpdateListeners: { [conversationId: string]: any };
    private debug: boolean;

    constructor (protocolType: ProtocolType) {
        this.id = uuidv4();
        this.protocolType = protocolType;
        this.newConversationMessageListeners = {};
        this.threadUpdateListeners = {};
        this.debug = false;
    }

    public abstract setup(setupParams: IRawSDKSetupParameters): Promise<void>;
    public abstract initialize(sessionInfo: IInitializationInfo): Promise<void>;
    public abstract update(sessionInfo: IInitializationInfo): Promise<void>;
    public abstract dispose(): Promise<void>;
    public abstract onJoinConversation(conversationId: string, sendHeartBeat?: boolean): Promise<IRawConversation>;

    public abstract sendMessage(conversation: IRawConversation, message: IRawMessage): Promise<void>;
    public abstract getMessages(conversation: IRawConversation): Promise<IRawMessage[]>;
    public abstract onRegisterOnNewMessage(conversation: IRawConversation): Promise<void>;
    public abstract onRegisterOnThreadUpdate(conversation: IRawConversation): Promise<void>;
    public abstract sendFileData(conversation: IRawConversation, fileInfo: IFileInfo, fileSharingProtocolType?: FileSharingProtocolType): Promise<IFileMetadata>;
    public abstract downloadFileData(conversation: IRawConversation, fileMetadata: IFileMetadata): Promise<ArrayBuffer>;
    public abstract getFileStatus(conversation: IRawConversation, fileMetadata: IFileMetadata): Promise<FileStatus>;
    public abstract indicateTypingStatus(conversation: IRawConversation, typingStatus: TypingStatus, optionalProperties?: IMessageProperties): Promise<void>;
    public abstract disconnectFromConversation(conversation: IRawConversation): Promise<void>;
    public abstract sendFileMessage(conversation: IRawConversation, fileMedata: IFileMetadata, message: IRawMessage): Promise<void>;
    public abstract sendMessageToBot(conversation: IRawConversation, botId: string, botMessage: IRawBotMessage): Promise<void>;
    public abstract getMembers(conversation: IRawConversation): Promise<IPerson[]>;

    public setDebug(flag: boolean) {
        this.debug = flag;
    }

    public joinConversation(conversationId: string, sendHeartBeat?: boolean): Promise<IConversation> {
        return this.onJoinConversation(conversationId, sendHeartBeat).then((conversation) => {
            const clientConversation: IConversation = {
                disconnect: this.disconnectFromConversation.bind(this, conversation),
                downloadFile: this.downloadFile.bind(this, conversation),
                getFileStatus: this.getFileStatus.bind(this, conversation),
                getMembers: this.getMembers.bind(this, conversation),
                getMessages: this.getMessages.bind(this, conversation),
                id: conversation.id,
                indicateTypingStatus: this.indicateTypingStatus.bind(this, conversation),
                registerOnNewMessage: this.registerOnNewMessage.bind(this, conversation),
                registerOnThreadUpdate: this.registerOnThreadUpdate.bind(this, conversation),
                sendFileMessage: this.sendFileMessage.bind(this, conversation),
                sendMessage: this.sendMessage.bind(this, conversation),
                sendMessageToBot: this.sendMessageToBot.bind(this, conversation),
                uploadFile: this.uploadFile.bind(this, conversation),
                sendFileData: this.sendFileData.bind(this, conversation)
            };

            return clientConversation;
        });
    }

    public async registerOnNewMessage(conversation: IRawConversation, callback: (message: IRawMessage) => void) {
        return Promise.resolve();
    }

    public async registerOnThreadUpdate(conversation: IRawConversation, callback: (message: IRawThread) => void) {
        return Promise.resolve();
    }

    // Web based
    public uploadFile(conversation: IRawConversation, fileToSend: File, fileSharingProtocolType?: FileSharingProtocolType): Promise<any> {
        return Promise.resolve();
    }

    public downloadFile(conversation: IRawConversation, fileMetadata: IFileMetadata): Promise<any> {
        this.debug && console.debug(`IC3Core/ClientBridge/downloadFile`);
        return this.downloadFileData(conversation, fileMetadata).then((dataAsArrayBuffer) => {
            const dataAsBlob = dataAsArrayBuffer as unknown as Blob;
            if (dataAsBlob && dataAsBlob.size) {
                return dataAsBlob; //case when the parameter is blob. Not ArrayBuffer
            }
            const blob = new Blob([new Uint8Array(dataAsArrayBuffer)]);
            return (!blob || blob.size === 0 && blob.type === "")
            ? dataAsArrayBuffer as unknown as Blob
            : blob;
        });
    }
}