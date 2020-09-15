import LogLevel from "./LogLevel";
import IIC3TelemetryCustomData from "./IIC3TelemetryCustomData";

export default interface IRawLogger {
    log(loglevel: LogLevel, telemetryEvent: string, customData?: IIC3TelemetryCustomData): void;
    isLoggingEnabled(): boolean;
}