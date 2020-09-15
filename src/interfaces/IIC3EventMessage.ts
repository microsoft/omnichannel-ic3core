import IIC3Conversation from './IIC3Conversation';
import IIC3Message from '../interfaces/IIC3Message';
import IIC3Thread from './IIC3Thread';
import ResourceType from '../model/ResourceType';

export default interface IIC3EventMessage {
    resource: IIC3Message | IIC3Conversation | IIC3Thread;
    resourceLink: string;
    resourceType: ResourceType;
    id?: number;
    type?: IIC3EventMessage;
    time?: string;
}