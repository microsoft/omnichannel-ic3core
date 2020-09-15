import AMSFilePermissions from './AMSFilePermissions';

export default interface IAMSNewDocumentRequest {
    type: string;
    permissions: AMSFilePermissions;
    filename?: string;
}