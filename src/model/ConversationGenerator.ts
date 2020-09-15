import IConversation from './IConversation';
import IMessage from './IMessage';

export default class ConversationGenerator {
    private messagesObservers: Array<(conversation: IConversation, message: IMessage) => void>;
    private fileMessagesObservers: Array<(conversation: IConversation, message: IMessage, file: File) => void>;

    constructor() {
        this.messagesObservers = [];
        this.fileMessagesObservers = [];
    }

    public generateMessage(conversationId: string, message: IMessage) {
        const conversation = {
            id: conversationId
        };

        this.messagesObservers.forEach((messagesObserver) => {
            messagesObserver(conversation as IConversation, message);
        });
    }

    public generateFileMessage(conversationId: string, message: IMessage, file: File) {
        const conversation = {
            id: conversationId
        };

        this.fileMessagesObservers.forEach((fileMessagesObserver) => {
            fileMessagesObserver(conversation as IConversation, message, file);
        });
    }

    public subscribeToMessages(subscriber: (conversation: IConversation, message: IMessage) => void) {
        this.messagesObservers.push(subscriber);
    }

    public subscribeToFileMessages(subscriber: (conversation: IConversation, message: IMessage, file: File) => void) {
        this.fileMessagesObservers.push(subscriber);
    }
}