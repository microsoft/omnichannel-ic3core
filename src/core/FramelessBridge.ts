/* eslint-disable @typescript-eslint/no-unused-vars */

import ClientBridge from "./ClientBridge";
import FileSharingProtocolType from "../model/FileSharingProtocolType";
import FileStatus from "../model/FileStatus";
import HostType from "../interfaces/HostType";
import IC3ClientV1Adapter from "./IC3ClientV1Adapter";
import IFileMetadata from "../model/IFileMetadata";
import IFileInfo from "../interfaces/IFileInfo";
import IInitializationInfo from "../model/IInitializationInfo";
import IMessageProperties from "../model/IMessageProperties";
import IPerson from "../model/IPerson";
import IRawBotMessage from "../interfaces/IRawBotMessage";
import IRawConversation from "../model/IRawConversation";
import IRawMessage from "../model/IRawMessage";
import IRawSDK from "../interfaces/IRawSDK";
import IRawSDKSetupParameters from "../interfaces/IRawSDKSetupParameters";
import IRawThread from "../interfaces/IRawThread";
import ProtocolType from "../interfaces/ProtocoleType";
import TypingStatus from "../model/TypingStatus";

export default class FramelessBridge extends ClientBridge {
    private protocolAdapter: IRawSDK;

    constructor(protocolType: ProtocolType) {
        super(protocolType);
        this.hostType = HostType.Page;
        this.protocolAdapter = new IC3ClientV1Adapter("", this.hostType);
    }

    public setup(setupParams: IRawSDKSetupParameters): Promise<void> {
        return Promise.resolve();
    }

    public update(sessionInfo: IInitializationInfo): Promise<void> {
        return Promise.resolve();
    }

    public onRegisterOnNewMessage(conversation: IRawConversation): Promise<void> {
        return Promise.resolve();
    }

    public onRegisterOnThreadUpdate(conversation: IRawConversation): Promise<void> {
        return Promise.resolve();
    }

    public initialize(sessionInfo: IInitializationInfo): Promise<void> {
        return this.protocolAdapter.initialize(sessionInfo);
    }

    public dispose(): Promise<void> {
        return this.protocolAdapter.dispose();
    }

    public sendMessage(conversation: IRawConversation, message: IRawMessage): Promise<void> {
        return this.protocolAdapter.sendMessage(conversation, message);
    }

    public sendFileMessage(conversation: IRawConversation, fileMetadata: IFileMetadata, message: IRawMessage): Promise<void> {
        return this.protocolAdapter.sendFileMessage(conversation, fileMetadata, message);
    }

    public getMessages(conversation: IRawConversation): Promise<IRawMessage[]> {
        return this.protocolAdapter.getMessages(conversation);
    }

    public disconnectFromConversation(conversation: IRawConversation): Promise<void> {
        return this.protocolAdapter.disconnectFromConversation(conversation);
    }

    public onJoinConversation(conversationId: string, sendHeartBeat?: boolean): Promise<IRawConversation> {
        return this.protocolAdapter.joinConversation(conversationId, sendHeartBeat);
    }

    public sendFileData(conversation: IRawConversation, fileInfo: IFileInfo, fileSharingProtocolType?: FileSharingProtocolType): Promise<IFileMetadata> {
        return this.protocolAdapter.sendFileData(conversation, fileInfo, fileSharingProtocolType);
    }

    public downloadFileData(conversation: IRawConversation, fileMetadata: IFileMetadata): Promise<ArrayBuffer> {
        return this.protocolAdapter.downloadFileData(conversation, fileMetadata);
    }

    public getFileStatus(conversation: IRawConversation, fileMetadata: IFileMetadata): Promise<FileStatus> {
        return this.protocolAdapter.getFileStatus(conversation, fileMetadata);
    }

    public indicateTypingStatus(conversation: IRawConversation, typingStatus: TypingStatus, optionalProperties?: IMessageProperties): Promise<void> {
        return this.protocolAdapter.indicateTypingStatus(conversation, typingStatus, optionalProperties);
    }

    public sendMessageToBot(conversation: IRawConversation, botId: string, botMessage: IRawBotMessage): Promise<void> {
        return this.protocolAdapter.sendMessageToBot(conversation, botId, botMessage);
    }

    public getMembers(conversation: IRawConversation): Promise<IPerson[]> {
        return this.protocolAdapter.getMembers(conversation);
    }

    public async registerOnNewMessage(conversation: IRawConversation, callback: (message: IRawMessage) => void): Promise<void> {
        this.protocolAdapter.registerOnNewMessage(conversation, callback);
        return Promise.resolve();
    }

    public async registerOnThreadUpdate(conversation: IRawConversation, callback: (message: IRawThread) => void): Promise<void> {
        this.protocolAdapter.registerOnThreadUpdate(conversation, callback);
        return Promise.resolve();
    }

    public setDebug(flag = false): void {
        this.protocolAdapter.setDebug(flag);
    }
}