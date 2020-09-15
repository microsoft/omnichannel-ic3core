import IRawSDK from "../interfaces/IRawSDK";
import IIC3TelemetryCustomData from "./IIC3TelemetryCustomData";
import { IIC3SDKLogData } from "./ILogData";

export default class TelemetryHelper {
    public static getTelemetryEventData(sdk: IRawSDK, telemetryEvent: string, customData?: IIC3TelemetryCustomData): IIC3SDKLogData {
        const logData: IIC3SDKLogData = {
            Description: (customData as any).Description,
            ElapsedTimeInMilliseconds: (customData as any).ElapsedTimeInMilliseconds,
            EndpointUrl: (customData as any).EndpointUrl,
            EndpointId: (customData as any).EndpointId,
            ErrorCode: (customData as any).ErrorCode,
            Event: telemetryEvent,
            ExceptionDetails: (customData as any).ExceptionDetails,
            ShouldBubbleToHost: (customData as any).ShouldBubbleToHost,
            SubscriptionId: sdk.id
        };
        return logData;
    }
}