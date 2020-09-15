import DeliveryMode from './DeliveryMode';
import IFileMetadata from './IFileMetadata';
import IMessageProperties from './IMessageProperties';
import IPerson from './IPerson';
import MessageContentType from './MessageContentType';
import MessageType from './MessageType';

export default interface IMessage {
    content: string;
    contentType: MessageContentType;
    messageType: MessageType;
    sender: IPerson;
    timestamp: Date;
    properties?: IMessageProperties;
    tags?: string[];
    deliveryMode: DeliveryMode;
    fileMetadata?: IFileMetadata;
}