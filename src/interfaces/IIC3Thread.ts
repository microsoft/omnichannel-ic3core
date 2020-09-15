import IIC3ThreadMember from "./IIC3ThreadMember";
import IIC3ThreadProperties from "./IIC3ThreadProperties";

export default interface IIC3Thread {
    id: string;
    type: string;
    properties: IIC3ThreadProperties;
    members: IIC3ThreadMember[];
    version: number;
    messages: string;
    rosterVersion: number;
}