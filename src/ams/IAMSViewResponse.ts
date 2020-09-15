export default interface IAMSViewResponse {
    content_length?: number;
    content_full_length?: number;
    content_state?: string;
    scan?: {
        status: string;
    };
    status?: number;
    status_location?: string;
    view_location?: string;
    view_state?: string;
    view_length?: number;
    original_filename?: string;
}