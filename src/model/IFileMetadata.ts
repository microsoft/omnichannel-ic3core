import FileSharingProtocolType from './FileSharingProtocolType';

export default interface IFileMetadata {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    fileSharingProtocolType?: FileSharingProtocolType;
}