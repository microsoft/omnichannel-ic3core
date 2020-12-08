/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import Utilities from "../common/Utilities";
import Constants from "../common/Constants";
import IC3TelemetryEvent from "../logging/IC3TelemetryEvent";
import LogLevel from "../logging/LogLevel";
import HttpHeaders from "./HttpHeaders";
import HttpCode from "./HttpCode";
import HttpRequestType from "./HttpRequestType";
import IRawLogger from "../logging/IRawLogger";

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

export interface IHttpRequestAttributes {
    url: string;
    type: HttpRequestType;
    data?: any;
    timeout?: number;
    retryCount?: number;
    shouldResetOnFailure?: boolean;
    shouldRetryOnFailure?: (status: number) => boolean;
    timeBetweenRetry?: number;
    contentType?: string;
    headers?: { [key: string]: any; };
    callbackOnSuccess?: (response: AxiosResponse) => void;
    callbackOnFailure?: (error: AxiosError) => void;
    shouldRedirectOn404?: boolean;
    redirect404RetryCount?: number;
    dataType?: string;
    processData?: boolean;
    enableExponentialBackoff?: boolean;
    useXHRWithCredentials?: boolean;
}

export class HttpClient {

    public static MakeRequest<T>(requestAttributes: IHttpRequestAttributes): Promise<T> {
        const responsePromise: Promise<T> = new Promise<T>((resolve, reject) => {
            function onSuccess(data: T, response: AxiosResponse) {
                if (response.status >= 400) { // if not 2xx
                    const exceptionDetails = {
                        ResponseText: response.statusText,
                        Status: status
                    };
                    HttpClient.logWarning("Requesting " + requestAttributes.url, response.status, exceptionDetails);
                }

                if (requestAttributes.callbackOnSuccess) {
                    requestAttributes.callbackOnSuccess(response);
                }
                resolve(data);
            }

            function onFailure(error: AxiosError) {
                const exceptionDetails = {
                    ErrorThrown: error.message,
                    ResponseText: error.response?.statusText,
                    Status: error.response?.status
                };

                const rejectAsError = () => {
                    HttpClient.logError("Request to " + requestAttributes.url + " failed.", error.response?.status || 0, exceptionDetails);
                    reject(new Error(error.response?.statusText || ""));
                };

                const rejectAsRedirect = () => {
                    HttpClient.logError("Request to " + requestAttributes.url + " failed. Resetting endpoint.", error.response?.status || 0, exceptionDetails);
                    if (requestAttributes.callbackOnFailure) {
                        requestAttributes.callbackOnFailure(error);
                    }
                    reject(new Error(Constants.Reset_Flag));
                };

                const retry = () => {
                    currentRetryCount++;
                    let timeBetweenRetry = requestAttributes.timeBetweenRetry || 0;
                    if (requestAttributes.enableExponentialBackoff || error.response?.status === HttpCode.TooManyRequests) {
                        timeBetweenRetry = timeBetweenRetry * Math.exp(currentRetryCount);
                    }
                    setTimeout(() => {
                        makeAxiosRequest();
                    }, timeBetweenRetry);
                };

                const locationHeader = error.response?.headers[HttpHeaders.LocationHeader];
                const registrationTokenHeader = error.response?.headers[HttpHeaders.SetRegistrationTokenHeader];

                if (error.response?.status === HttpCode.Redirect && !Utilities.isNullOrEmptyString(locationHeader)) {
                    if (requestAttributes.shouldRedirectOn404) {
                        rejectAsRedirect();
                    } else if (currentRetryCount <= maxRetryCount) {
                        requestAttributes.url = locationHeader;
                        retry();
                    } else {
                        rejectAsError();
                    }
                } else if ((error.response?.status === HttpCode.Unauthorized || error.response?.status === HttpCode.Forbidden) &&
                    !Utilities.isNullOrEmptyString(registrationTokenHeader)) {
                    if (currentRetryCount <= maxRetryCount
                        && requestAttributes.shouldRetryOnFailure
                        && requestAttributes.shouldRetryOnFailure(error.response?.status || 0)) {
                        if (requestAttributes.headers){
                            requestAttributes.headers[HttpHeaders.RegistrationTokenHeader] = Utilities.getRegistrationTokenValue(registrationTokenHeader);
                        }
                        retry();
                    } else if (requestAttributes.shouldResetOnFailure) {
                        rejectAsRedirect();
                    } else {
                        rejectAsError();
                    }
                } else {
                    if (currentRetryCount <= maxRetryCount
                        && requestAttributes.shouldRetryOnFailure
                        && requestAttributes.shouldRetryOnFailure(error.response?.status || 0)
                        || error.response?.status === HttpCode.TooManyRequests) {
                        retry();
                    } else if (requestAttributes.shouldResetOnFailure) {
                        rejectAsRedirect();
                    } else {
                        rejectAsError();
                    }
                }
            }

            let currentRetryCount = 0;
            const maxRetryCount = requestAttributes.retryCount || 1;

            const axiosConfig: AxiosRequestConfig = {
                url: requestAttributes.url,
                method: requestAttributes.type,
                data: requestAttributes.data,
                timeout: requestAttributes.timeout,
                headers: requestAttributes.headers,
                withCredentials: requestAttributes.useXHRWithCredentials || false
            }

            const makeAxiosRequest = function() {
                axios.request(axiosConfig)
                .then(function(response: AxiosResponse) {
                    onSuccess(response.data, response);
                })
                .catch(function(error: AxiosError){
                    onFailure(error);
                });
            }
            makeAxiosRequest();

        });
        return responsePromise;
    }

    public static isClientError(e: Error): boolean {
        if (!e) {
            return false;
        }
        const errorMsg = e.message;
        let isClientError = false;
        if (!Utilities.isNullOrEmptyString(errorMsg)) {
            isClientError = (errorMsg.search(/Status- 40\d/) >= -1);
        }
        return isClientError;
    }

    public static setLogger(logger: IRawLogger) {
        HttpClient.logger = logger;
    }

    private static logger: IRawLogger;

    private static logError(errorDescription: string, errorCode: number, errorResponse: object) {
        if (HttpClient.logger) {
            HttpClient.logger.log(LogLevel.ERROR, IC3TelemetryEvent.HTTPRequestFailed,
                {
                    Description: errorDescription,
                    ErrorCode: errorCode.toString(),
                    ExceptionDetails: errorResponse
                }
            );
        }
    }

    private static logWarning(warningDescription: string, warningCode: number, warningResponse: object) {
        if (HttpClient.logger) {
            HttpClient.logger.log(LogLevel.INFO, IC3TelemetryEvent.HTTPRequestUnusualResponse,
                {
                    Description: warningDescription,
                    ErrorCode: warningCode.toString(),
                    ExceptionDetails: warningResponse
                }
            );
        }
    }
}
