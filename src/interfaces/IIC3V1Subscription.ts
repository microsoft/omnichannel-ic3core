export default interface IIC3V1Subscription {
    id?: string;
    type?: string;
    channelType: string;
    conversationType?: number;
    eventChannel?: string;
    template?: string;
    eventServiceName?: string;
    packageSid?: string;
    xuid?: string;
    interestedResources: string[];
}