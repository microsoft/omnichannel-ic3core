export default interface IIC3ThreadMember {
    id: string;
    type: string;
    userLink: string;
    role: string;
    capabilities: any[]; // tslint:disable-line:no-any
    linkedMri: string;
    cid: string;
    userTile: string;
    friendlyName: string;
    isFollowing: boolean;
    isModerator: boolean;
    isReader: boolean;
    memberExpirationTime: any; // tslint:disable-line:no-any
    expirationTimeInSeconds: any; // tslint:disable-line:no-any
    hidden: boolean;
}