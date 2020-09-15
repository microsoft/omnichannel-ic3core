import IIC3GetMessagesMetadataInfo from "./IIC3GetMessagesMetadataInfo";
import IIC3Message from "./IIC3Message";

export default interface IIC3GetMessagesResponse {
    messages: IIC3Message[];
    _metadata: IIC3GetMessagesMetadataInfo;
}