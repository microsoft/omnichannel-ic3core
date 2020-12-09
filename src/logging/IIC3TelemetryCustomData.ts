export default interface IIC3TelemetryCustomData {
    ElapsedTimeInMilliseconds?: number;
    ErrorCode?: string;
    EndpointUrl?: string;
    EndpointId?: string;
    ExceptionDetails?: object;
    Description?: string;
    ShouldBubbleToHost?: boolean;
}
