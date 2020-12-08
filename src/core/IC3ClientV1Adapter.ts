/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-inferrable-types */

import Constants from '../common/Constants';
import HostType from "../interfaces/HostType";
import HttpHeaders from '../http/HttpHeaders';
import HttpRequestType from "../http/HttpRequestType";
import IC3ClientAdapter from "./IC3ClientAdapter";
import IC3Initializer from '../core/IC3Initializer';
import IC3TelemetryEvent from "../logging/IC3TelemetryEvent";
import IFileMetadata from '../model/IFileMetadata';
import { IHttpRequestAttributes, HttpClient } from "../http/HttpClient";
import IIC3Adapter from "../interfaces/IIC3Adapter";
import IIC3EventMessage from "../interfaces/IIC3EventMessage";
import IIC3Info from "../interfaces/IIC3Info";
import IIC3Message from "../interfaces/IIC3Message";
import IIC3PollResponse from "../interfaces/IIC3PollResponse";
import IIC3Thread from "../interfaces/IIC3Thread";
import IInitializationInfo from '../model/IInitializationInfo';
import IRawConversation from "../model/IRawConversation";
import IRawMessage from "../model/IRawMessage";
import IRawSDKSetupParameters from "../interfaces/IRawSDKSetupParameters";
import IRawThread from "../interfaces/IRawThread";
import LogLevel from "../logging/LogLevel";
import MatchingIC3EventIndex from "../interfaces/MatchingIC3EventIndex";
import ProtocolType from "../interfaces/ProtocoleType";
import RequestHelper from "../http/RequestHelper";
import ResourceType from "../model/ResourceType";
import ServiceEndpointHelper from '../common/ServiceEndpointHelper';
import Util from "../common/Util";
import Utilities from "../common/Utilities";

export default class IC3ClientV1Adapter extends IC3ClientAdapter implements IIC3Adapter {
    private updateTokenClearTimeoutHandle: any;

    public constructor(id: string, hostType: HostType) {
        super(id);
        this.debug && console.debug("IC3Core/Constructor");
        this.protocolType = ProtocolType.IC3V1SDK;
        this.hostType = hostType;
        this.ic3Initializer = new IC3Initializer();
    }

    public startPolling() {
        super.startPolling();
    }

    public stopPolling() {
        super.stopPolling();
    }

    public setup(setupParams: IRawSDKSetupParameters): Promise<void> {
        return super.setup(setupParams);
    }

    public initialize(sessionInfo: IInitializationInfo): Promise<void> {
        return super.initialize(sessionInfo)
            .then(() => {
                const initializeOperation = () => {
                    return this.ic3Initializer?.setup(this.logger)
                        .then(() => this.setSkypeTokenCookie())
                        .then(() => this.ic3Initializer?.setIc3Info(this.ic3Info!))
                        .then(() => this.ic3Initializer?.initializeIC3(this.handlePollData.bind(this)))
                        .then((ic3Info) => { this.ic3Info = ic3Info; });
                };
                return initializeOperation();
            });
    }

    public update(sessionInfo: IInitializationInfo): Promise<void> {
        return super.update(sessionInfo)
            .then(() => {
                const updateOperation = () => {
                    const ic3Info: IIC3Info = {
                        RegionGtms: sessionInfo.regionGtms,
                        SkypeToken: sessionInfo.token,
                        visitor: sessionInfo.visitor
                    };

                    return this.updateToken(ic3Info);
                };

                return updateOperation();
            });
    }

    public async dispose() {
        this.ic3Initializer?.stopPolling();
        this.heartBeatTimer && clearInterval(this.heartBeatTimer);
        Promise.resolve();
    }

    public joinConversation(conversationId: string, sendHeartBeat?: boolean): Promise<IRawConversation> {
        const timer = Utilities.timer();
        return super.joinConversation(conversationId, sendHeartBeat).then((conversation) => {
            return this.getThreadRequest(conversation.id).then((thread) => {
                this.internalConversationsData[conversation.id] = {
                    id: conversationId,
                    members: thread.members
                };
                return conversation;
            }).catch((ex: any) => {
                const elapsedTimeInMilliseconds = timer.milliSecondsElapsed;
                this.logger && this.logger.log(LogLevel.WARN, IC3TelemetryEvent.JoinConversationV1GetThreadRequestFailed,
                    {
                        Description: `Unable to retrieve thread: ${ex}`,
                        ElapsedTimeInMilliseconds: elapsedTimeInMilliseconds,
                        EndpointUrl: this.EndpointUrl, EndpointId: this.ic3Info!.endpointId
                    } as any);

                this.internalConversationsData[conversation.id] = {
                    id: conversationId,
                    members: []
                };
                return conversation;
            });
        });
    }

    public sendMessage(conversation: IRawConversation, message: IRawMessage): Promise<void> {
        return super.sendMessage(conversation, message);
    }

    public sendFileMessage(conversation: IRawConversation, fileMetadata: IFileMetadata, message: IRawMessage): Promise<void> {
        return super.sendFileMessage(conversation, fileMetadata, message);
    }

    public getMessages(conversation: IRawConversation): Promise<IRawMessage[]> {
        return super.getMessages(conversation);
    }

    public registerOnNewMessage(conversation: IRawConversation, callback: (message: IRawMessage) => void): Promise<void> {
        return super.registerOnNewMessage(conversation, callback);
    }

    public registerOnThreadUpdate(conversation: IRawConversation, callback: (message: IRawThread) => void): Promise<void> {
        return super.registerOnThreadUpdate(conversation, callback);
    }

    public disconnectFromConversation(conversation: IRawConversation): Promise<void> {
        return super.disconnectFromConversation(conversation);
    }

    private setSkypeTokenCookie(): Promise<any> {
        const url = this.ic3Info!.RegionGtms.ams.concat(Constants.skypeTokenAuthURL);
        const headers: any = RequestHelper.getDefaultBaseIC3Headers();
        headers[HttpHeaders.ContentTypeHeader] = Constants.ContentTypeForm;
        const skypeTokenData = Constants.skypeTokenConstantForData + this.ic3Info!.SkypeToken;

        const requestParameters: IHttpRequestAttributes = {
            data: skypeTokenData,
            enableExponentialBackoff: true,
            useXHRWithCredentials: true,
            headers,
            redirect404RetryCount: Constants.retryCount,
            retryCount: Constants.retryCount,
            shouldRedirectOn404: false,
            shouldResetOnFailure: false,
            shouldRetryOnFailure: Util.shouldRetryOnFailure,
            timeBetweenRetry: Constants.timeBetweenOperationRetry,
            type: HttpRequestType.POST,
            url
        };
        return HttpClient.MakeRequest<any>(requestParameters);
    }

    private getThreadRequest(conversationId: string): Promise<IIC3Thread> {
        const url = ServiceEndpointHelper.getThreadUrl(conversationId, this.ic3Info!.RegionGtms);
        const headers: any = RequestHelper.getDefaultBaseIC3Headers();
        headers[HttpHeaders.RegistrationTokenHeader] = this.ic3Info!.RegistrationToken;
        const requestParameters: IHttpRequestAttributes = {
            enableExponentialBackoff: true,
            headers,
            redirect404RetryCount: Constants.retryCount,
            retryCount: Constants.retryCount,
            shouldRedirectOn404: true,
            shouldRetryOnFailure: Util.shouldRetryOnFailure,
            timeBetweenRetry: Constants.timeBetweenOperationRetry,
            type: HttpRequestType.GET,
            url
        };

        return HttpClient.MakeRequest<IIC3Thread>(requestParameters);
    }

    private newMessageReceived(conversation: IRawConversation, message: IIC3Message, resourceType: ResourceType) {
        super.onNewMessage(conversation, message, resourceType);
    }

    private newThreadUpdate(conversation: IRawConversation, message: IIC3Thread) {
        super.onThreadUpdate(conversation, message);
    }

    private handleNewMessageEvent(eventMessage: IIC3EventMessage) {
        let conversationId: string;
        if (eventMessage.resource && (eventMessage.resource as IIC3Message).conversationid) {
            conversationId = (eventMessage.resource as IIC3Message).conversationid!;
        } else if ((eventMessage.resource as IIC3Message).conversationLink) {
            conversationId = Util.getConversationIdFromUrl((eventMessage.resource as IIC3Message).conversationLink);
        } else {
            conversationId = Util.getConversationIdFromUrl(eventMessage.resourceLink);
        }
        const conversationIndex = this.conversations.findIndex((conv) => conv.id === conversationId);
        const interestedConversation = this.conversations[conversationIndex];
        this.newMessageReceived(interestedConversation, eventMessage.resource as IIC3Message, eventMessage.resourceType as ResourceType);
    }

    private handleConversationUpdateEvent(eventMessage: IIC3EventMessage): void {
        if (eventMessage.resourceType === ResourceType.ConversationUpdate) {
            // handle conversation update
        }
    }

    private handleThreadUpdate(eventMessage: IIC3EventMessage): void {
        if (eventMessage.resourceType !== ResourceType.ThreadUpdate) {
            return;
        }
        let conversationId: string;
        if (eventMessage.resource && (eventMessage.resource as IIC3Thread).id) {
            conversationId = (eventMessage.resource as IIC3Thread).id;
        } else if ((eventMessage.resource as IIC3Thread).messages) {
            conversationId = Util.getConversationIdFromUrl((eventMessage.resource as IIC3Thread).messages);
        } else {
            conversationId = Util.getConversationIdFromUrl(eventMessage.resourceLink);
        }
        const conversationIndex = this.conversations.findIndex((conv) => conv.id === conversationId);
        const interestedConversation = this.conversations[conversationIndex];
        this.newThreadUpdate(interestedConversation, eventMessage.resource as IIC3Thread);
    }

    private handlePollData(eventData: IIC3PollResponse): void {
        if (!eventData || !eventData.eventMessages) {
            return;
        }
        for (const eventMessage of eventData.eventMessages) {
            this.handlePollEventMessage(eventMessage);
        }
    }

    private handlePollEventMessage(eventMessage: IIC3EventMessage) {
        if (eventMessage.resourceType === ResourceType.NewMessage
            || eventMessage.resourceType === ResourceType.MessageUpdate
        ) {
            this.handleNewMessageEvent(eventMessage);
        } else if (eventMessage.resourceType === ResourceType.ThreadUpdate) {
            this.handleThreadUpdate(eventMessage);
        } else if (eventMessage.resourceType === ResourceType.ConversationUpdate) {
            this.handleConversationUpdateEvent(eventMessage);
        }
    }

    /**
     * Updates the token info following the below steps:
     * Stops raising events from the ongoing poll
     * Creates new endpoint and subscription
     * Starts polling with the new endpoint
     * Stops polling from the ongoing poll
     * Raises all the distinct events received during this period
     * Updates the current ic3Info with the new ic3Info
     * Reverts in case of any errors in the above state
     * The above steps take care that no event is dropped or raised multiple times while transitioning
     * @param ic3Info - IIC3Info object used to update the token
     */
    private async updateToken(ic3Info: IIC3Info): Promise<void> {
        this.logger && this.logger.log(LogLevel.INFO, IC3TelemetryEvent.UpdateToken, {
            EndpointUrl: this.EndpointUrl,
            EndpointId: this.ic3Info!.endpointId
        } as any);
        const pollDataFromOngoingPoll: IIC3EventMessage[] = [];
        const handlePollDataFromOngoingPoll = (pollData: IIC3PollResponse) => {
            if (pollData && pollData.eventMessages) {
                Utilities.concatArrays(pollDataFromOngoingPoll, pollData.eventMessages);
            }
        };

        const pollDataFromNewPoll: IIC3EventMessage[] = [];
        const handlePollDataFromNewPoll = (pollData: IIC3PollResponse) => {
            if (pollData && pollData.eventMessages) {
                Utilities.concatArrays(pollDataFromNewPoll, pollData.eventMessages);
            }
        };

        const currentIc3Initializer = this.ic3Initializer!;
        const newIc3Initializer = new IC3Initializer();

        const currentUpdateTokenClearTimeoutHandle: any = this.updateTokenClearTimeoutHandle; // tslint:disable-line:no-any
        const currentIc3Info: IIC3Info = this.ic3Info!;
        let newIc3Info: IIC3Info;
        let matchingIC3EventIndex: MatchingIC3EventIndex;

        currentIc3Initializer.getPoller().onNewData = handlePollDataFromOngoingPoll;

        if (this.logger) {
            await newIc3Initializer.setup(this.logger);
        }

        const updateTokenPromise = newIc3Initializer.setIc3Info(ic3Info)
            .then(() => newIc3Initializer.initializeIC3(handlePollDataFromNewPoll))
            .then((response) => { newIc3Info = response; })
            .then(() => this.getMatchingIC3EventIndex(pollDataFromOngoingPoll, pollDataFromNewPoll))
            .then((response) => { matchingIC3EventIndex = response; })
            .then(() => currentIc3Initializer.reset(true))
            .then(() => this.syncPollingData(pollDataFromOngoingPoll, pollDataFromNewPoll, matchingIC3EventIndex))
            .then(() => {
                this.ic3Info = newIc3Info;
                this.ic3Initializer = newIc3Initializer;
                this.ic3Initializer.getPoller().onNewData = this.handlePollData.bind(this);
            })
            .catch((e) => {
                if (this.updateTokenClearTimeoutHandle !== currentUpdateTokenClearTimeoutHandle) {
                    clearTimeout(this.updateTokenClearTimeoutHandle);
                    this.updateTokenClearTimeoutHandle = currentUpdateTokenClearTimeoutHandle;
                }
                this.ic3Info = currentIc3Info;
                this.ic3Initializer!.getPoller().onNewData = this.handlePollData.bind(this);
                this.ic3Initializer!.getPoller().start();
                throw new Error("Update token failed: " + (e && e.message));
            });

        return updateTokenPromise;
    }

    /**
     * Returns indices of the first event common among events from ongoing and new polls
     * Waits for Constants.timeBetweenStabilizingPoll * Constants.stabilizePollMaxRetryCount milliseconds
     * till the common event is found.
     * Returns { -1, -1 } as the common index if no common event is found within the above time
     * @param pollDataFromOngoingPoll - Events from ongoing poll
     * @param pollDataFromNewPoll - Events from new poll
     * @param currentRetryCount - Current retry count
     */
    private getMatchingIC3EventIndex(
        pollDataFromOngoingPoll: IIC3EventMessage[],
        pollDataFromNewPoll: IIC3EventMessage[],
        currentRetryCount?: number): Promise<MatchingIC3EventIndex> {

        return new Promise((resolve, reject) => {
            currentRetryCount = currentRetryCount || 0;
            if (currentRetryCount === Constants.stabilizePollMaxRetryCount) {
                resolve({ newPollIndex: -1, previousPollIndex: -1 });
            } else {
                let ongoingPollIndex: number = 0;
                let newPollIndex: number = 0;

                while (ongoingPollIndex < pollDataFromOngoingPoll.length && newPollIndex < pollDataFromNewPoll.length) {
                    const ongoingPollData = pollDataFromOngoingPoll[ongoingPollIndex];
                    const newPollData = pollDataFromNewPoll[newPollIndex];
                    if (ongoingPollData.time === newPollData.time) {
                        resolve({ newPollIndex, previousPollIndex: ongoingPollIndex });
                        return;
                    } else if (new Date((ongoingPollData as any).time) < new Date((ongoingPollData as any).time)) {
                        ongoingPollIndex++;
                    } else {
                        newPollIndex++;
                    }
                }

                setTimeout(() => {
                    this.getMatchingIC3EventIndex(pollDataFromOngoingPoll, pollDataFromNewPoll, (currentRetryCount as number) + 1)
                        .then((response) => { resolve(response); })
                        .catch((e) => { reject(e); });
                }, Constants.timeBetweenStabilizingPoll);
            }
        });
    }

    /**
     * Syncs the polling data.
     * Processes all the distinct events received during the simultaneous running of both the polls
     * @param pollDataFromOngoingPoll - Events from ongoing poll
     * @param pollDataFromNewPoll - Events from new poll
     * @param matchingIC3EventIndex - Indices of the first common event between the polls
     */
    private syncPollingData(
        pollDataFromOngoingPoll: IIC3EventMessage[],
        pollDataFromNewPoll: IIC3EventMessage[],
        matchingIC3EventIndex: MatchingIC3EventIndex): void {

        this.logger && this.logger.log(LogLevel.INFO, IC3TelemetryEvent.SyncingPollData, {
            EndpointUrl: this.EndpointUrl,
            EndpointId: this.ic3Info!.endpointId
        } as any);

        let previousPollLastIndex = matchingIC3EventIndex.previousPollIndex;
        let newPollStartIndex = matchingIC3EventIndex.newPollIndex + 1;

        if (matchingIC3EventIndex.previousPollIndex === -1 && matchingIC3EventIndex.newPollIndex === -1) {
            previousPollLastIndex = pollDataFromOngoingPoll.length - 1;
            newPollStartIndex = 0;
        }

        for (let ind = 0; ind <= previousPollLastIndex; ind++) {
            this.handlePollEventMessage(pollDataFromOngoingPoll[ind]);
        }

        for (let ind = newPollStartIndex; ind < pollDataFromNewPoll.length; ind++) {
            this.handlePollEventMessage(pollDataFromNewPoll[ind]);
        }
    }
}