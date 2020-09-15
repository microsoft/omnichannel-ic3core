import IKeyValuePair from './IKeyValuePair';
import MessagePayloadType from './MessagePayloadType';

export default interface IMessagePayload {
    messagetype: MessagePayloadType;
    composetime?: string;
    contenttype?: string;
    content: string;
    clientmessageid?: string;
    imdisplayname?: string;
    "Has-Mentions"?: string;
    properties?: string | IKeyValuePair;
    amsreferences?: string;
}