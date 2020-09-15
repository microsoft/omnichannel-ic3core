import ClientBridgeFactory from "./ClientBridgeFactory";
import IClientSDKInitializationParameters from "../model/IClientSDKInitializationParameters";
import IProtocolInfo from "../common/IProtocolInfo";
import ISDK from "../model/ISDK";
import RawLogger from "../logging/RawLogger";
import IRawSDKSetupParameters from "../interfaces/IRawSDKSetupParameters";

export default class SDKProvider {
    public static getSDK(initializationParams: IClientSDKInitializationParameters): Promise<ISDK> {
        return new Promise((resolve) => {
            const protocolInfo: IProtocolInfo = {
                hostType: initializationParams.hostType,
                protocolType: initializationParams.protocolType
            };

            const clientBridge = ClientBridgeFactory.getClientBridge(protocolInfo);
            const clientBridgeSetupParameters: IRawSDKSetupParameters = {
                logger: new RawLogger(clientBridge, initializationParams.logger as any)
            };

            return clientBridge.setup(clientBridgeSetupParameters).then(() => {
                const clientSdk: ISDK = {
                    dispose: clientBridge.dispose.bind(clientBridge),
                    id: clientBridge.id,
                    initialize: clientBridge.initialize.bind(clientBridge),
                    joinConversation: clientBridge.joinConversation.bind(clientBridge),
                    update: clientBridge.update.bind(clientBridge),
                    setDebug: clientBridge.setDebug.bind(clientBridge)
                };
                return resolve(clientSdk);
            });
        });
    }
}