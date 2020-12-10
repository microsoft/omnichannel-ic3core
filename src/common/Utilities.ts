/* eslint-disable @typescript-eslint/no-explicit-any */

import HttpHeaders from "../http/HttpHeaders";
import ITimer from "./ITimer";

export default class Utilities {
    public static isNullOrEmptyString(s: string): boolean {
        return Utilities.isNullOrUndefined(s) || s === "";
    }

    public static isNullOrUndefinedOrEmptyArray(obj: any[]): boolean {
        return Utilities.isNullOrUndefined(obj) || obj.length === 0;
    }

    public static isNullOrUndefined(obj: any): boolean { // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
        return (obj === null || obj === undefined);
    }

    public static isPrimitiveString(obj: any): boolean { // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
        return (typeof obj === "string");
    }

    public static convertStringToBoolean(input: string): boolean {
        return (!Utilities.isNullOrUndefined(input) && input.toLowerCase() === "true");
    }

    public static sanitizeUrlWithBackSlash(url: string): string {
        return url.endsWith("/") ? url : url + "/";
    }

    public static getRegistrationTokenValue(registrationTokenHeader: string): string {
        const regToken = registrationTokenHeader.match(/registrationToken=(.+); expires=(\d+)/);
        if (regToken && regToken.length >= 2) {
            return HttpHeaders.RegistrationTokenHeaderValue + regToken[1];
        }
        return "";
    }

    public static addQueryParametersToPath(basePath: string, queryParameters: { [key: string]: string | number | boolean }): string {
        let finalPath = basePath;
        if (!Utilities.isNullOrUndefined(queryParameters)) {
            if (!(finalPath.indexOf("?") >= 0)) {
                finalPath += "?";
            }
            for (const queryParamKey in queryParameters) {
                if (queryParameters.hasOwnProperty(queryParamKey)) { // eslint-disable-line no-prototype-builtins
                    let queryParamData = queryParamKey + "=" + queryParameters[queryParamKey]; // eslint-disable-line security/detect-object-injection
                    if (finalPath[finalPath.length - 1] !== "?") {
                        queryParamData = "&" + queryParamData;
                    }
                    finalPath += queryParamData;
                }
            }
        }
        return finalPath;
    }

    public static getResponseHeader(jqXHR: any, headerName: string): string { // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
        let headerValue;
        if (!Utilities.isNullOrUndefined(jqXHR)) {
            headerValue = jqXHR.headers[headerName]; // eslint-disable-line security/detect-object-injection
        }
        return headerValue;
    }

    /**
     * Creates a timer with current time as the start time
     * Returns an ITimer instance
     * Use the milliSecondsElapsed property to get the time ellapsed since the timer was started
     * @returns {ITimer} An ITimer instance
     */
    public static timer(): ITimer {
        const timeStart = new Date().getTime();
        return {
            get milliSecondsElapsed() {
                const ms = (new Date().getTime() - timeStart);
                return ms;
            }
        };
    }

    public static concatArrays(arr1: any[], arr2: any[]): void {
        if (!Utilities.isNullOrUndefined(arr1) && !Utilities.isNullOrUndefined(arr2)) {
            arr2.forEach((entry) => {
                arr1.push(entry);
            });
        }
    }
}