import IRegionGtms from '../model/IRegionGtms';
import Poller from '../polling/Poller';

export default interface IIC3Info {
    SkypeToken: string;
    RegionGtms: IRegionGtms;
    RegistrationToken?: string;
    endpointId?: string;
    subscriptionId?: string;
    poller?: Poller;
    visitor?: boolean;
}