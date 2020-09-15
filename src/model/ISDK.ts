import IConversation from "./IConversation";
import IInitializationInfo from "./IInitializationInfo";

export default interface ISDK {
    id: string;
    heartBeatTimer?: number;
    initialize(sessionInfo: IInitializationInfo): Promise<void>;
    update(sessionInfo: IInitializationInfo): Promise<void>;
    dispose(): Promise<void>;
    joinConversation(conversationId: string, sendHeartBeat?: boolean): Promise<IConversation>;
    setDebug(flag: boolean): void;
}