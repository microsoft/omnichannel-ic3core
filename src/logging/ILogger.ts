import ILogData from "./ILogData";
import LogLevel from "./LogLevel";

export default interface ILogger {
    logClientSdkTelemetryEvent(loglevel: LogLevel, event: ILogData): void;
}