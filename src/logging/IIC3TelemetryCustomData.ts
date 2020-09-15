export default interface IIC3TelemetryCustomData {
    ElapsedTimeInMilliseconds?: number;
    ErrorCode?: string;
    ExceptionDetails?: object;
    Description?: string;
    ShouldBubbleToHost?: boolean;
}
