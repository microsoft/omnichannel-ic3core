export default interface IIC3Message {
    id: string;
    contenttype: string;
    composetime: string;
    clientmessageid: string;
    content: string;
    messagetype: string;
    properties: {
        deliveryMode: string,
        tags?: string,
        files?: string
    };
    amsreferences?: string[];
    conversationid?: string;
    conversationLink?: string;
    from?: string;
    originalarrivaltime?: string;
    imdisplayname?: string;
}