/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import IIC3Info from "../interfaces/IIC3Info";
import ServiceEndpointHelper from "../common/ServiceEndpointHelper";
import V1PollingHelper from "./V1PollingHelper";
import Constants from "../common/Constants";

export default class Poller {
    private _onNewData: (data: any) => void;
    private _onError: (error: any) => any;
    private _ic3Info: IIC3Info;
    private isPolling: boolean = false;
    private callbackOnFailure: (jqXHR: any, request: string) => void;

    constructor(ic3Info: IIC3Info, onNewData: (data: any) => void, onError: (error: any) => any, callbackOnFailure: (jqXHR: any, request?: string) => void) {
        this._ic3Info = ic3Info;
        this._onNewData = onNewData;
        this._onError = onError;
        this.callbackOnFailure = callbackOnFailure;
    }

    public start(): Promise<void> {
        if (!this.isPolling) {
            this.isPolling = true;
            this.startPolling();
        }
        return Promise.resolve();
    }

    public stop(): Promise<void> {
        this.isPolling = false;
        return Promise.resolve();
    }

    public set onNewData(input: (data: any) => void) {
        this._onNewData = input;
    }

    public get onNewData(): (data: any) => void {
        return this._onNewData;
    }

    public set onError(input: (error: any) => any) {
        this._onError = input;
    }

    public get onError(): (error: any) => any {
        return this._onError;
    }

    public set setCallbackOnFailure(input: (jqXHR: any, request: string) => void) {
        this.setCallbackOnFailure = input;
    }

    public set ic3Info(input: IIC3Info) {
        this._ic3Info = input;
    }

    public get ic3Info(): IIC3Info {
        return this._ic3Info;
    }

    private startPolling() {
        if (this.isPolling) {
            this.poll()
                .then((data) => {
                    if (this.isPolling && this._onNewData) {
                        this._onNewData(data);
                    }
                })
                .catch((e) => {
                    if (this._onError) {
                        this._onError(e);
                    }
                })
                .then(() => {
                    this.startPolling();
                });
        }
    }

    private poll(): Promise<any> {
        const url = ServiceEndpointHelper.getV1PollUrl(this._ic3Info.RegionGtms, this._ic3Info.subscriptionId!);
        return V1PollingHelper.poll(url, this._ic3Info.RegistrationToken!, this.callbackOnEachRequestCompleted.bind(this));
    }

    private callbackOnEachRequestCompleted(jqXHR: any) {
        this.callbackOnFailure(jqXHR, Constants.pollRequestLog);
    }
}