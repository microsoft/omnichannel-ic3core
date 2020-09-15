import FileSharingProtocolType from './FileSharingProtocolType';
import FileStatus from './FileStatus';
import IBotMessage from './IBotMessage';
import IFileInfo from '../interfaces/IFileInfo';
import IFileMetadata from './IFileMetadata';
import IMessage from './IMessage';
import IMessageProperties from './IMessageProperties';
import IPerson from './IPerson';
import IRawConversation from './IRawConversation';
import IThread from './IThread';
import TypingStatus from './TypingStatus';

export default interface IConversation {
    id: string;
    sendMessage(message: IMessage): Promise<void>;
    getMessages(): Promise<IMessage[]>;
    registerOnNewMessage(callback: (message: IMessage) => void): Promise<void>;
    registerOnThreadUpdate(callback: (message: IThread) => void): Promise<void>;
    disconnect(): Promise<void>;
    downloadFile(fileMetadata: IFileMetadata): Promise<Blob>;
    getFileStatus(fileMetadata: IFileMetadata): Promise<FileStatus>;
    indicateTypingStatus(typingStatus: TypingStatus, optionalProperties?: IMessageProperties): Promise<void>;
    sendFileMessage(fileMedata: IFileMetadata, message: IMessage): Promise<void>;
    sendMessageToBot(botId: string, botMessage: IBotMessage): Promise<void>;
    getMembers(): Promise<IPerson[]>;
    uploadFile(fileToSend: File, fileSharingProtocolType?: FileSharingProtocolType): Promise<IFileMetadata>;
    sendFileData(fileInfo: IFileInfo, fileSharingProtocolType?: FileSharingProtocolType): Promise<IFileMetadata>;
}