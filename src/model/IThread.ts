export default interface IThread {
    id: string;
    type: string;
    properties: any;
    members: any[];
    version: number;
    messages: string;
    rosterVersion: number;
}