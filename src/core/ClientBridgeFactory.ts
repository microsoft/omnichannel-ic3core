import ClientBridge from "./ClientBridge";
import FramelessBridge from "./FramelessBridge";
import HostType from "../interfaces/HostType";
import IProtocolInfo from "../common/IProtocolInfo";

export default class ClientBridgeFactory {
    public static getClientBridge(protocolInfo: IProtocolInfo): ClientBridge {
        switch (protocolInfo.hostType) {
            case HostType.IFrame:
                throw new Error(`Framed bridge not implemented for ${protocolInfo.hostType} in IC3Core`);
            case HostType.Page:
                return new FramelessBridge(protocolInfo.protocolType);
            default:
                throw new Error(`Client bridge not implemented for ${protocolInfo.hostType} in IC3Core`);
        }
    }
}