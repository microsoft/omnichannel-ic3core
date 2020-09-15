import IIC3Info from "./IIC3Info";
import IRawSDK from "./IRawSDK";

export default interface IIC3Adapter extends IRawSDK {
    startPolling(ic3Info?: IIC3Info, handlePollData?: (data: any) => void): void;
    stopPolling(ic3Info?: IIC3Info): void;
}