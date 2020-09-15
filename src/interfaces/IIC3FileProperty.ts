export default interface IIC3FileProperty {
    version: number;
    id: string;
    baseUrl: string;
    type: string;
    title: string;
    state: string;
    objectUrl: string;
    providerData: string;
    itemid: string;
    fileName: string;
    fileType: string;
    fileInfo: {
        fileUrl: string;
        siteUrl: string;
        serverRelativeUrl: string;
    };
    filePreview?: {
        previewUrl: string;
    };
}