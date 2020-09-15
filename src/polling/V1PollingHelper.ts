import Constants from "../common/Constants";
import { HttpClient, IHttpRequestAttributes } from "../http/HttpClient";
import HttpHeaders from "../http/HttpHeaders";
import HttpRequestType from "../http/HttpRequestType";
import RequestHelper from "../http/RequestHelper";
import Util from "../common/Util";

class V1PollingHelper {
    public static poll(url: string, registrationToken: string, callback: (jqXHR: any) => void): Promise<any> { // tslint:disable-line:no-any
        const headers: any = RequestHelper.getDefaultIC3Headers();
        headers[HttpHeaders.RegistrationTokenHeader] = registrationToken;
        headers[HttpHeaders.ContentTypeHeader] = Constants.ContentTypeJson;
        const payload = JSON.stringify({});
        const requestParameters: IHttpRequestAttributes = {
            callbackOnFailure: callback,
            data: payload,
            enableExponentialBackoff: true,
            headers,
            redirect404RetryCount: Constants.retryCount,
            retryCount: Constants.retryCount,
            shouldRedirectOn404: true,
            shouldResetOnFailure: true,
            shouldRetryOnFailure: Util.shouldRetryOnFailure,
            timeBetweenRetry: Constants.timeBetweenOperationRetry,
            type: HttpRequestType.POST,
            url
        };
        return HttpClient.MakeRequest<any>(requestParameters);
    }
}

export default V1PollingHelper;