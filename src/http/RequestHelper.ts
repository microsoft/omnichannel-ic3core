/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import Constants from '../common/Constants';
import IIC3GetMessagesRequestQueryParameters from '../model/IIC3GetMessagesRequestQueryParameters';
import {uuidv4} from '../utils/uuid';

export default class RequestHelper {
    public static getDefaultIC3Headers() {
        return {
            Accept: Constants.ContentTypeJson,
            BehaviorOverride: Constants.RedirectAs404,
            ClientInfo: Constants.ClientInfoValue,
            ContextId: `tcid=${uuidv4()}`,
            Expires: 0,
            Pragma: Constants.NoCache,
            "x-ms-client-type": Constants.Web,
            "x-ms-user-type": Constants.User
        };
    }

    public static getDefaultBaseIC3Headers() {
        return {
            Accept: Constants.ContentTypeJson,
            BehaviorOverride: Constants.RedirectAs404,
            "content-type": Constants.ContentTypeJson
        };
    }

    public static getDefaultGetMessagesQueryParameters(): IIC3GetMessagesRequestQueryParameters {
        return {
            pageSize: 20,
            startTime: 0,
            view: "msnp24Equivalent|supportsMessageProperties"
        };
    }

    public static getDefaultAMSHeaders(token: string): Record<string, string> {
        return {
            Authorization: Constants.AMSAuthorizationSkypeTokenValue + token,
            "X-MS-Client-Version": Constants.ClientInfoValue
        };
    }

    public static getDefaultAMSViewHeaders(token: string) {
        return {
            Accept: Constants.AMSAcceptHeaderValue,
            "Accept-Encoding": Constants.AMSAcceptEncodingHeaderValue,
            Authorization: Constants.AMSAuthorizationSkypeTokenValue + token,
            "X-MS-Client-Version": Constants.ClientInfoValue
        };
    }
}