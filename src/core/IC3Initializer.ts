import Constants from "../common/Constants";
import HttpHeaders from "../http/HttpHeaders";
import IC3PollingV1InterestedResources from "../model/IC3PollingV1InterestedResources";
import IC3PollingV2EndpointFeatures from "../model/IC3PollingV2EndpointFeatures";
import IIC3Info from "../interfaces/IIC3Info";
import IIC3V1EndpointResponse from '../interfaces/IIC3V1EndpointResponse';
import IRawLogger from "../logging/IRawLogger";
import RequestHelper from "../http/RequestHelper";
import ServiceEndpointHelper from "../common/ServiceEndpointHelper";
import Utilities from "../common/Utilities";
import Poller from "../polling/Poller";
import LogLevel from "../logging/LogLevel";
import IC3TelemetryEvent from "../logging/IC3TelemetryEvent";
import HttpCode from "../http/HttpCode";
import Util from "../common/Util";
import { HttpClient, IHttpRequestAttributes } from "../http/HttpClient";
import HttpRequestType from "../http/HttpRequestType";
import IIC3V1EndpointRequest from "../interfaces/IIC3V1EndpointRequest";
import IIC3V1Subscription from "../interfaces/IIC3V1Subscription";

export default class IC3Initializer {
    public debug = false;
    private current404RetryCount: number;
    private currentOtherRetryCount: number;
    private skipUnsubscribe: boolean;
    private telemetryMessage: string;
    private errorCode: string;
    private ic3Info: IIC3Info | any;
    private poller: Poller | any;
    private logger?: IRawLogger;
    private pollDataHandler: (data: any) => void;

    constructor() {
        this.current404RetryCount = 0;
        this.currentOtherRetryCount = 0;
        this.skipUnsubscribe = false;
        this.telemetryMessage = "";
        this.errorCode = '';
        this.pollDataHandler = (data: any) => {};  // eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        this.resetRetryCount();
    }

    public async setup(logger?: IRawLogger): Promise<void> {
        this.logger = logger;
    }

    public getPoller(): any {
        const pollDataHandler = this.pollDataHandler.bind(this);
        if (!this.poller) {
            this.poller = new Poller(this.ic3Info, pollDataHandler,
                this.redirectErrorHandler.bind(this),
                this.onRequestCreationFailure.bind(this) as any
            );
        }
        return this.poller;
    }

    public async setIc3Info(ic3Info: IIC3Info): Promise<void> {
        const localIc3Info: IIC3Info = {
            RegionGtms: JSON.parse(JSON.stringify(ic3Info.RegionGtms)),
            SkypeToken: ic3Info.SkypeToken,
            visitor: ic3Info.visitor
        };
        this.ic3Info = localIc3Info;
    }

    public initializeIC3(pollDataHandler?: (data: any) => void): Promise<IIC3Info> {
        if (pollDataHandler) {
            this.pollDataHandler = pollDataHandler;
        }

        this.logger?.log(LogLevel.INFO, IC3TelemetryEvent.IC3InitializationBegins, {
            Description: `Endpoint to poll is ${JSON.stringify(this.ic3Info.RegionGtms.chatService)}`,
            EndpointUrl: this.ic3Info.RegionGtms.chatService,
            EndpointId: this.ic3Info.endpointId
        });

        const initializeIC3Promise = this.createEndpoint()
            .then(() => this.createSubscription())
            .then(() => this.setEndpointProperty())
            .then(() => this.startPolling(pollDataHandler))
            .then(() => this.resetRetryCount())
            .then(() => Promise.resolve(this.ic3Info))
            .catch((e) => {
                return this.redirectErrorHandler(e);
            });
        return initializeIC3Promise;
    }

    public startPolling(handlePollData?: (data: any) => void): void {
        const handler = !handlePollData && this.pollDataHandler? this.pollDataHandler.bind(this): this.pollDataHandler;
        if (!this.poller) {
            this.poller = new Poller(this.ic3Info, handler,
                this.redirectErrorHandler.bind(this),
                this.onRequestCreationFailure.bind(this) as any
            );
        }
        this.poller.ic3Info = this.ic3Info;
        this.logger?.log(LogLevel.INFO, IC3TelemetryEvent.IC3StartedPolling, {
            EndpointUrl: this.ic3Info.RegionGtms.chatService,
            EndpointId: this.ic3Info.endpointId
        });
        this.poller.start();
    }

    public stopPolling(oldInitializer?: boolean): void {
        const initializer = oldInitializer ? Constants.oldInitializer : Constants.newInitializer;
        this.logger?.log(LogLevel.INFO, IC3TelemetryEvent.IC3StoppedPolling, {
            Description: `${initializer} stopped polling.`,
            EndpointUrl: this.ic3Info.RegionGtms.chatService,
            EndpointId: this.ic3Info.endpointId
        });

        if (this.poller) {
            this.poller.stop();
        }
    }

    public reset(oldInitializer?: boolean): Promise<void> {
        this.stopPolling(oldInitializer);
        return this.unsubscribeFromEndpoint();
    }

    private resetRetryCount() {
        this.current404RetryCount = 0;
        this.currentOtherRetryCount = 0;
    }

    private onEndpointCreationFailure(jqXHR: any) {
        this.onRequestCreationFailure(jqXHR, Constants.endpointRequestLog);
    }

    private onEndpointCreationSuccess(jqXHR: any) {
        const registrationTokenHeader = Utilities.getResponseHeader(jqXHR, HttpHeaders.SetRegistrationTokenHeader);
        if (!Utilities.isNullOrUndefined(registrationTokenHeader)) {
            this.ic3Info.RegistrationToken = Utilities.getRegistrationTokenValue(registrationTokenHeader);
        }
        const locationHeader = Utilities.getResponseHeader(jqXHR, HttpHeaders.LocationHeader);
        if (!Utilities.isNullOrUndefined(locationHeader)) {
            // location header value: <CHAT_SERVICE_URL>/v1/users/ME/endpoints/%7B<ENDPOINT_ID>%7D
            const epidMatch = locationHeader.match(/endpoints\/(%7B[\da-z\-]+%7D)/); // eslint-disable-line no-useless-escape
            (this.ic3Info as any).endpointId = epidMatch && epidMatch[1];
            this.logger?.log(LogLevel.INFO, IC3TelemetryEvent.IC3EndpointCreationSuccess, {
                Description: `IC3 endpoint Id is ${this.ic3Info.endpointId}`,
                EndpointUrl: this.ic3Info.RegionGtms.chatService,
                EndpointId: this.ic3Info.endpointId
            });

            if (jqXHR.status === HttpCode.Created && Util.parseChatServiceHostUrl(locationHeader) !== this.ic3Info.RegionGtms.chatService) {
                this.ic3Info.RegionGtms.chatService = Util.parseChatServiceHostUrl(locationHeader);
                this.logger?.log(LogLevel.WARN, IC3TelemetryEvent.OnRequestCreationSuccessRedirect,{
                    Description: `Endpoint changed`,
                    EndpointUrl: this.ic3Info.RegionGtms.chatService,
                    EndpointId: this.ic3Info.endpointId
                });
            }
        }
    }

    /**
     * Creates IC3 endpoint
     *
     * 1. Gets SkypeToken, RegionGtms
     * 2. Sets polling features
     * 3. API call to create endpoint
     * 4. Saves RegistrationToken
     * 5. Saves endpoint ID
     */
    private createEndpointRequest() {
        const url = ServiceEndpointHelper.getV1EndpointUrl(this.ic3Info.RegionGtms);
        const headers: any = RequestHelper.getDefaultIC3Headers();
        headers[HttpHeaders.AuthenticationHeader] = HttpHeaders.SkypeTokenHeaderValue + this.ic3Info.SkypeToken;
        headers[HttpHeaders.ContentTypeHeader] = Constants.ContentTypeJson;
        const features = [
            IC3PollingV2EndpointFeatures.Agent,
            IC3PollingV2EndpointFeatures.InviteFree,
            IC3PollingV2EndpointFeatures.MessageProperties
        ];

        const payload: IIC3V1EndpointRequest = {
            endpointFeatures: features.join(',')
        };

        const requestParameters: IHttpRequestAttributes = {
            callbackOnFailure: this.onEndpointCreationFailure.bind(this),
            callbackOnSuccess: this.onEndpointCreationSuccess.bind(this),
            data: JSON.stringify(payload),
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
        return HttpClient.MakeRequest<IIC3V1EndpointResponse>(requestParameters);
    }

    private createEndpoint(): Promise<IIC3V1EndpointResponse> {
        return this.createEndpointRequest().then((response) => {
            if (response.subscriptions && response.subscriptions.length > 0) {
                this.ic3Info.subscriptionId = response.subscriptions[0].id;
            }
            return response;
        });
    }

    private onSubscriptionCreationFailure(jqXHR: any) {
        this.onRequestCreationFailure(jqXHR, Constants.subscriptionRequestLog);
    }

    private onSubscriptionCreationSuccess(jqXHR: any) {
        const locationHeader = Utilities.getResponseHeader(jqXHR, HttpHeaders.LocationHeader) || "";
        if (jqXHR.status === HttpCode.Created &&
            !Utilities.isNullOrUndefined(locationHeader) && Util.parseChatServiceHostUrl(locationHeader) !== this.ic3Info.RegionGtms.chatService) {
            this.ic3Info.RegionGtms.chatService = Util.parseChatServiceHostUrl(locationHeader);
            this.logger?.log(LogLevel.WARN, IC3TelemetryEvent.OnRequestCreationSuccessRedirect, {
                Description: `Endpoint changed`,
                EndpointUrl: this.ic3Info.RegionGtms.chatService,
                EndpointId: this.ic3Info.endpointId
            });
        }
        const subscriptionIdMatch = locationHeader.match(/\/(\d+)$/);
        if (subscriptionIdMatch) {
            this.ic3Info.subscriptionId = subscriptionIdMatch[1];
        }
    }

    private createSubscriptionRequest(): Promise<void> {
        const url = ServiceEndpointHelper.getV1SubscriptionUrl(this.ic3Info.RegionGtms);
        const headers: any = RequestHelper.getDefaultIC3Headers();
        headers[HttpHeaders.RegistrationTokenHeader] = this.ic3Info.RegistrationToken;
        headers[HttpHeaders.ContentTypeHeader] = Constants.ContentTypeJson;
        const payload: IIC3V1Subscription = {
            channelType: Constants.HttpLongPoll,
            interestedResources: [
                IC3PollingV1InterestedResources.ConversationMessages,
                IC3PollingV1InterestedResources.ConversationProperties,
                IC3PollingV1InterestedResources.Threads,
                IC3PollingV1InterestedResources.Contacts
            ]
        };
        const requestParameters: IHttpRequestAttributes = {
            callbackOnFailure: this.onSubscriptionCreationFailure.bind(this),
            callbackOnSuccess: this.onSubscriptionCreationSuccess.bind(this),
            data: JSON.stringify(payload),
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
        return HttpClient.MakeRequest<void>(requestParameters);
    }

    private createSubscription(): Promise<void> {
        return this.createSubscriptionRequest();
    }

    private onSetEndpointPropertyCreationFailure(jqXHR: any) {
        this.onRequestCreationFailure(jqXHR, Constants.setPropertiesRequestLog);
    }

    private setEndpointProperty(): Promise<void> {
        if (this.ic3Info.visitor) {
            return Promise.resolve();
        }
        const url = ServiceEndpointHelper.getV1SetPropertiesUrl(this.ic3Info.RegionGtms);
        const payload: any = {};
        const property = HttpHeaders.SetEndpointProperty;
        payload[property] = true; // eslint-disable-line security/detect-object-injection
        const headers: any = RequestHelper.getDefaultIC3Headers();
        headers[HttpHeaders.AuthenticationHeader] = HttpHeaders.SkypeTokenHeaderValue + this.ic3Info.SkypeToken;
        headers[HttpHeaders.RegistrationTokenHeader] = this.ic3Info.RegistrationToken;
        headers[HttpHeaders.ContentTypeHeader] = Constants.ContentTypeJson;
        const requestParameters: IHttpRequestAttributes = {
            callbackOnFailure: this.onSetEndpointPropertyCreationFailure.bind(this),
            data: JSON.stringify(payload),
            enableExponentialBackoff: true,
            headers,
            redirect404RetryCount: Constants.retryCount,
            retryCount: Constants.retryCount,
            shouldRedirectOn404: true,
            shouldResetOnFailure: true,
            shouldRetryOnFailure: Util.shouldRetryOnFailure,
            timeBetweenRetry: Constants.timeBetweenOperationRetry,
            type: HttpRequestType.PUT,
            url
        };
        return HttpClient.MakeRequest<void>(requestParameters);
    }

    private onUnsubscribeCreationFailure(jqXHR: any) {
        this.onRequestCreationFailure(jqXHR, Constants.unsubscribeRequestLog);
    }

    private unsubscribeFromEndpoint(): Promise<void> {
        if (this.ic3Info.visitor || Utilities.isNullOrUndefined(this.ic3Info.endpointId) || this.skipUnsubscribe) {
            this.skipUnsubscribe = true;
            return Promise.resolve();
        }
        const url = ServiceEndpointHelper.getV1DeleteEndpointUrl(this.ic3Info.RegionGtms, this.ic3Info.endpointId as any);
        const headers: any = RequestHelper.getDefaultIC3Headers();
        headers[HttpHeaders.AuthenticationHeader] = HttpHeaders.SkypeTokenHeaderValue + this.ic3Info.SkypeToken;
        headers[HttpHeaders.RegistrationTokenHeader] = this.ic3Info.RegistrationToken;
        headers[HttpHeaders.ContentTypeHeader] = Constants.ContentTypeJson;
        const requestParameters: IHttpRequestAttributes = {
            callbackOnFailure: this.onUnsubscribeCreationFailure.bind(this),
            enableExponentialBackoff: true,
            headers,
            redirect404RetryCount: Constants.retryCount,
            retryCount: Constants.retryCount,
            shouldRedirectOn404: true,
            shouldResetOnFailure: true,
            shouldRetryOnFailure: Util.shouldRetryOnFailure,
            timeBetweenRetry: Constants.timeBetweenOperationRetry,
            type: HttpRequestType.DELETE,
            url
        };
        return HttpClient.MakeRequest<void>(requestParameters);
    }

    private onRequestCreationFailure(jqXHR: any, request: string) {
        const locationHeader = Utilities.getResponseHeader(jqXHR, HttpHeaders.LocationHeader);
        this.telemetryMessage = `${request} failed. Error Code: ${jqXHR.status}.`;
        this.errorCode = jqXHR.status.toString();
        this.skipUnsubscribe = true; // never unsubscribe on error since endpoint is already invalid
        if (jqXHR.status === HttpCode.Redirect && !Utilities.isNullOrEmptyString(locationHeader)) {
            this.logger?.log(LogLevel.WARN, IC3TelemetryEvent.RedirectOnRequestCreationFailure, {
                Description: this.telemetryMessage + " Trying to redirect.",
                ErrorCode: jqXHR.status.toString(),
                EndpointUrl: this.ic3Info.RegionGtms.chatService,
                EndpointId: this.ic3Info.endpointId
            } as any);
            this.onRequestCreationFailureRedirect(jqXHR);
        } else {
            // Don't unsubscribe if the endpoint already doesn't exist (729)
            this.logger?.log(LogLevel.WARN, IC3TelemetryEvent.ResetOnRequestCreationFailure, {
                    Description: this.telemetryMessage + " Trying to reset.",
                    ErrorCode: jqXHR.status.toString(),
                    EndpointUrl: this.ic3Info.RegionGtms.chatService,
                    EndpointId: this.ic3Info.endpointId
            });
            this.current404RetryCount = 0;
            this.currentOtherRetryCount++;
        }
    }

    private redirectErrorHandler(e: any): Promise<IIC3Info> {
        if ((e.message === Constants.Reset_Flag) && this.current404RetryCount <= Constants.retry404Count
            && this.currentOtherRetryCount <= Constants.retryCount) {
            return this.reset().then(() => {
                return this.initializeIC3();
            });
        } else {
            this.logger?.log(LogLevel.ERROR, IC3TelemetryEvent.MaxRetryCountReachedForRedirect, {
                Description: `Fatal Error. Initialization failed. Maximum retry count reached. Exiting. ${this.telemetryMessage}`,
                ErrorCode: this.errorCode,
                ExceptionDetails: e,
                EndpointUrl: this.ic3Info.RegionGtms.chatService,
                EndpointId: this.ic3Info.endpointId
            });

            return this.reset().then(() => {
                return Promise.reject(e.message);
            });
        }
    }

    private onRequestCreationFailureRedirect(jqXHR: any) {
        this.current404RetryCount++;
        this.currentOtherRetryCount = 0;
        this.ic3Info.RegionGtms.chatService = Util.parseChatServiceHostUrl(Utilities.getResponseHeader(jqXHR, HttpHeaders.LocationHeader));
        this.logger?.log(LogLevel.WARN, IC3TelemetryEvent.OnRequestCreationFailureRedirect,{
            Description: `Endpoint changed.`,
            EndpointUrl: this.ic3Info.RegionGtms.chatService,
            EndpointId: this.ic3Info.endpointId
        });
    }
}
