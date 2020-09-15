import IIC3EventMessage from "./IIC3EventMessage";

export default interface IIC3PollResponse {
    eventMessages: IIC3EventMessage[];
    errorCode?: number;
    next?: string;
}