import DeliveryMode from "./DeliveryMode";
import IFileMetadata from "./IFileMetadata";
import IMessageProperties from "./IMessageProperties";
import IPerson from "./IPerson";
import MessageContentType from "./MessageContentType";
import MessageType from "./MessageType";
import ResourceType from "../model/ResourceType";

export default interface IRawMessage {
    clientmessageid?: string;
    content: string;
    contentType: MessageContentType;
    deliveryMode: DeliveryMode;
    messageType: MessageType;
    sender: IPerson;
    timestamp: Date;
    properties?: IMessageProperties;
    tags?: string[];
    fileMetadata?: IFileMetadata;
    resourceType?: ResourceType;
}