import HostType from "../interfaces/HostType";
import ILogger from "../logging/ILogger";
import ProtocolType from "../interfaces/ProtocoleType";

export default interface IClientSDKInitializationParameters {
    hostType: HostType;
    protocolType: ProtocolType;
    logger?: ILogger;
}