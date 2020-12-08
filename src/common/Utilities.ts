/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable no-prototype-builtins */
/* eslint-disable security/detect-object-injection */

import HttpHeaders from "../http/HttpHeaders";
import ITimer from "./ITimer";

export default class Utilities {
    public static isNullOrEmptyString(s: string) {
        return Utilities.isNullOrUndefined(s) || s === "";
    }

    public static isNullOrUndefinedOrEmptyArray(obj: any[]) {
        return Utilities.isNullOrUndefined(obj) || obj.length === 0;
    }

    public static isNullOrUndefined(obj: any) {
        return (obj === null || obj === undefined);
    }

    public static isPrimitiveString(obj: any) {
        return (typeof obj === "string");
    }

    public static convertStringToBoolean(input: string): boolean {
        return (!Utilities.isNullOrUndefined(input) && input.toLowerCase() === "true");
    }

    public static sanitizeUrlWithBackSlash(url: string) {
        return url.endsWith("/") ? url : url + "/";
    }

    public static getRegistrationTokenValue(registrationTokenHeader: string) {
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
                if (queryParameters.hasOwnProperty(queryParamKey)) {
                    let queryParamData = queryParamKey + "=" + queryParameters[queryParamKey];
                    if (finalPath[finalPath.length - 1] !== "?") {
                        queryParamData = "&" + queryParamData;
                    }
                    finalPath += queryParamData;
                }
            }
        }
        return finalPath;
    }

    public static getResponseHeader(jqXHR: any, headerName: string): string {
        let headerValue;
        if (!Utilities.isNullOrUndefined(jqXHR)) {
            headerValue = jqXHR.headers[headerName];
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

    public static concatArrays(arr1: any[], arr2: any[]) {
        if (!Utilities.isNullOrUndefined(arr1) && !Utilities.isNullOrUndefined(arr2)) {
            arr2.forEach((entry) => {
                arr1.push(entry);
            });
        }
    }
}