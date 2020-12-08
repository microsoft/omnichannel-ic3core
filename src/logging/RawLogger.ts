/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import IRawLogger from "./IRawLogger";
import IRawSDK from "../interfaces/IRawSDK";
import Utilities from "../common/Utilities";
import ILogger from "./ILogger";
import LogLevel from "./LogLevel";
import IIC3TelemetryCustomData from "./IIC3TelemetryCustomData";
import { IIC3SDKLogData } from "./ILogData";
import TelemetryHelper from "./TelemetryHelper";

export default class RawLogger implements IRawLogger {
    private sdk: IRawSDK;

    private logger: ILogger;

    public constructor(sdk: IRawSDK, logger: ILogger) {
        this.sdk = sdk;
        this.logger = logger;
    }

    public log(loglevel: LogLevel, telemetryEvent: string, customData?: IIC3TelemetryCustomData): void {
        if (this.isLoggingEnabled()) {
            const logData = TelemetryHelper.getTelemetryEventData(this.sdk, telemetryEvent, customData);
            this.logEvent(loglevel, logData);
        }
    }

    public logEvent(logLevel: LogLevel, logData: IIC3SDKLogData) {
        if (this.isLoggingEnabled()) {
            setTimeout(this.logger.logClientSdkTelemetryEvent.bind(this.logger), 0, logLevel, logData);
        }
    }

    public isLoggingEnabled(): boolean {
        return !Utilities.isNullOrUndefined(this.logger);
    }
}