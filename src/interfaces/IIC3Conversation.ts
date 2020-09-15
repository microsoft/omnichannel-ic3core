import IIC3ConversationProperties from "./IIC3ConversationProperties";
import IIC3Message from "./IIC3Message";
import IIC3ThreadMember from "./IIC3ThreadMember";
import IIC3ThreadProperties from "./IIC3ThreadProperties";

export default interface IIC3Conversation {
    id: string;
    messages?: URL;
    targetLink?: URL;
    lastMessage?: IIC3Message;
    properties: IIC3ConversationProperties;
    threadProperties?: IIC3ThreadProperties;
    version: number;
    members?: IIC3ThreadMember[];
    // For teams to distiquish between 1:1 and group chats
    isOneOnOne?: boolean;
    type?: string;
    lastUpdatedMessageId?: number;
    lastUpdatedMessageVersion?: number;
}