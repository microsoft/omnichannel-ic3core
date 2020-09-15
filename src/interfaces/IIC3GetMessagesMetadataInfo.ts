export default interface IIC3GetMessagesMetadataInfo {
    syncState: string;
    backwardLink?: string;
    lastCompleteSegmentStartTime: number;
    lastCompleteSegmentEndTime: number;
}