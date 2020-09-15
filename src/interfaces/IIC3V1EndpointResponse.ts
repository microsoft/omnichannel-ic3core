import IIC3V1Subscription from './IIC3V1Subscription';

export default interface IIC3V1EndpointResponse {
    id?: string;
    type?: string;
    networks?: any[]; // tslint:disable-line:no-any
    policies?: any; // tslint:disable-line:no-any
    subscriptions?: IIC3V1Subscription[];
    isActive?: boolean;
    productContext?: string;
}