/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import Constants from '../common/Constants';
import HttpHeaders from '../http/HttpHeaders';
import HttpRequestType from '../http/HttpRequestType';
import {HttpClient, IHttpRequestAttributes} from '../http/HttpClient';

import ServiceEndpointHelper from '../common/ServiceEndpointHelper';
import RequestHelper from '../http/RequestHelper';
import AMSFilePermissions from './AMSFilePermissions';
import IIC3Info from '../interfaces/IIC3Info';
import IFileInfo from '../interfaces/IFileInfo';
import IFileMetadata from '../model/IFileMetadata';
import FileStatus from '../model/FileStatus';
import IAMSNewDocumentRequest from './IAMSNewDocumentRequest';
import IAMSNewDocumentResponse from './IAMSNewDocumentResponse';
import IAMSDocumentPermissions from './IAMSDocumentPermissions';
import IAMSViewResponse from './IAMSViewResponse';
import Util from '../common/Util';

export default class AmsHelper {
    public static getDocumentTypeFromContentType(contentType: string): string {
        return Util.isDocumentTypeImage(contentType)
            ? Constants.DocumentTypeImage
            : Constants.DocumentTypeFile;
    }

    public static async createNewDocument(conversationId: string, file: IFileInfo, ic3Info: IIC3Info): Promise<IAMSNewDocumentResponse> {
        const permissions: IAMSDocumentPermissions = {
            [conversationId]: [AMSFilePermissions[AMSFilePermissions.read]]
        };
        const body: IAMSNewDocumentRequest = {
            filename: file.name,
            permissions,
            type: AmsHelper.getDocumentTypeFromContentType(file.type)
        };
        const url = ServiceEndpointHelper.getAmsObjectsUrl(ic3Info.RegionGtms);
        const headers: any = RequestHelper.getDefaultAMSHeaders(ic3Info.SkypeToken);
        headers[HttpHeaders.ContentTypeHeader] = Constants.ContentTypeJson;
        const requestParameters: IHttpRequestAttributes = {
            data: JSON.stringify(body),
            headers,
            type: HttpRequestType.POST,
            url
        };
        const responseData = await HttpClient.MakeRequest({...requestParameters, url: "https://httpbin.org/post" });
        return HttpClient.MakeRequest<any>(requestParameters);
    }

    public static async uploadDocument(documentId: string, file: IFileInfo, ic3Info: IIC3Info): Promise<any> {
        console.log(`AmsHelper.ts uploadDocument(): ${documentId}, ${file}, ${ic3Info}`);
        const isFileImage = Util.isDocumentTypeImage(file.type);
        const url = ServiceEndpointHelper.getAmsObjectContentUrl(documentId, ic3Info.RegionGtms, isFileImage);
        const headers = RequestHelper.getDefaultAMSHeaders(ic3Info.SkypeToken);
        const requestParameters: IHttpRequestAttributes = {
            data: file.data,
            headers,
            processData: false,
            type: HttpRequestType.PUT,
            url
        };
        const responseData = await HttpClient.MakeRequest({...requestParameters, url: "https://httpbin.org/put" });
        console.log("EHTESH", responseData);
        return HttpClient.MakeRequest<any>(requestParameters);
    }

    public static getFileStatus(fileInfo: IFileMetadata, ic3Info: IIC3Info): Promise<FileStatus> {
        console.log(`AmsHelper.ts getFileStatus(): ${fileInfo}, ${ic3Info}`);
        const isFileImage = Util.isImageType(fileInfo.type);
        const url = ServiceEndpointHelper.getAmsStatusUrl(fileInfo.id, ic3Info.RegionGtms, isFileImage);
        return this.getViewStatus(url, ic3Info)
            .then((response) => {
                const isScanFailed = response.scan && response.scan.status === Constants.Malware;
                if (isScanFailed) {
                    return FileStatus.Error;
                }
                if (response.view_state === Constants.Ready) {
                    return FileStatus.Success;
                }
                const isScanInProgress = response.scan && response.scan.status === Constants.InProgress;
                if (isScanInProgress) {
                    return FileStatus.InProgress;
                }
                if (response.view_state && response.view_state !== Constants.Failed) {
                    return FileStatus.InProgress;
                }
                return FileStatus.Error;
            })
            .catch(() => {
                return Promise.reject({});
            });
    }

    public static downloadDocument(fileMetadata: IFileMetadata, ic3Info: IIC3Info): Promise<Blob> {
        console.log(`AmsHelper.ts downloadDocument(): ${fileMetadata}, ${ic3Info}`);
        const isFileImage = Util.isImageType(fileMetadata.type);
        const statusUri = ServiceEndpointHelper.getAmsStatusUrl(fileMetadata.id, ic3Info.RegionGtms, isFileImage);
        return new Promise<Blob>((resolve) => {
            this.getViewUri(statusUri, ic3Info).then((vUrl: string) => {
                const headers = new Headers();
                headers.append("Authorization", "skype_token " + ic3Info.SkypeToken);
                headers.append("X-MS-Client-Version", Constants.ClientVersion);
                if (isFileImage) {
                    headers.append("accept", Constants.AMSAcceptHeaderValue);
                    headers.append("Accept-Encoding", Constants.AMSAcceptEncodingHeaderValue);
                }

                const requestParameters: RequestInit = {
                    headers,
                    method: HttpRequestType.GET
                };
                return fetch(vUrl, requestParameters)
                    .then((response) => {
                        resolve((response.blob()));
                    })
                    .catch(() => {
                        return Promise.reject({});
                    });
            });
        });
    }

    private static getViewUri(statusUri: string, ic3Info: IIC3Info): Promise<string> {
        console.log(`AmsHelper.ts getViewUri(): ${statusUri}, ${ic3Info}`);
        return this.getViewStatus(statusUri, ic3Info)
            .then((response: IAMSViewResponse): Promise<string> => {
                const isScanFailed = response.scan
                    && response.scan.status === Constants.Malware;

                if (!response.view_location || response.view_state === Constants.Failed || isScanFailed) {
                    return Promise.reject({});
                }

                if (response.view_state && response.view_state !== Constants.Ready) {
                    return this.getViewUri(statusUri, ic3Info);
                }

                if (response.content_state === Constants.Expired) {
                    return Promise.reject({});
                }

                return Promise.resolve(response.view_location);
            })
            .catch(() => {
                return Promise.reject("");
            });
    }

    private static getViewStatus(url: string, ic3Info: IIC3Info): Promise<IAMSViewResponse> {
        console.log(`AmsHelper.ts getViewStatus(): ${url}, ${ic3Info}`);
        return new Promise((resolve: () => any) => {
            setTimeout(resolve, Constants.DelayForAms);
        }).then(() => {
            const headers = RequestHelper.getDefaultAMSViewHeaders(ic3Info.SkypeToken);
            const requestParameters: IHttpRequestAttributes = {
                headers,
                type: HttpRequestType.GET,
                url
            };
            return HttpClient.MakeRequest<any>(requestParameters)
                .then((response: IAMSViewResponse): Promise<IAMSViewResponse> => {
                    if (response.status_location && !response.view_state) {
                        return this.getViewStatus(response.status_location, ic3Info);
                    }
                    return Promise.resolve(response);
                })
                .catch((response: IAMSViewResponse) => {
                    if (response.status === 401 || response.status === 403) {
                        return Promise.reject("unauthorized");
                    }
                    return Promise.reject({});
                });
        });
    }
}
