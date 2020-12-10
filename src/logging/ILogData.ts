/* eslint-disable @typescript-eslint/no-explicit-any */

import IConversationTelemetryContext from "./IConversationTelemetryContext";
import IGlobalTelemetryContext from "./IGlobalTelemetryContext";
import ISDKTelemetryContext from "./ISDKTelemetryContext";

export default interface ILogData {
    /**
     * The telemetry event to log
     */
    event: string;
    /**
     * The event description
     */
    description?: string;
    /**
     * The type of the event
     */
    eventType: string;
    /**
     * The additional data which needs to be logged
     */
    customData?: any;
    /**
     * The global telemetry context for the event to be logged
     */
    globalTelemetryContext: IGlobalTelemetryContext;
    /**
     * The sdk telemetry context for the event to be logged
     */
    sdkTelemetryContext: ISDKTelemetryContext;
    /**
     * The conversation telemetry context for the event to be logged
     */
    conversationTelemetryContext: IConversationTelemetryContext;
    /**
     * The event log time in ISO format
     */
    eventLogTime: string;
    /**
     * The execution time of the event
     */
    executionTime?: number;
    /**
     * The error which needs to be logged
     */
    error?: Error;
}

export interface IIC3SDKLogData {
    SubscriptionId?: string;
    EndpointUrl?: string;
    EndpointId?: string;
    ElapsedTimeInMilliseconds?: number;
    Event?: string;
    ErrorCode?: string;
    ExceptionDetails?: object;
    Description?: string;
    ShouldBubbleToHost?: boolean;
}

export interface IIC3TelemetryCustomData {
    ElapsedTimeInMilliseconds?: number;
    ErrorCode?: string;
    EndpointUrl?: string;
    EndpointId?: string;
    ExceptionDetails?: object;
    Description?: string;
    ShouldBubbleToHost?: boolean;
}