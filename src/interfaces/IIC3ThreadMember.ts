/* eslint-disable @typescript-eslint/no-explicit-any */

export default interface IIC3ThreadMember {
    id: string;
    type: string;
    userLink: string;
    role: string;
    capabilities: any[];
    linkedMri: string;
    cid: string;
    userTile: string;
    friendlyName: string;
    isFollowing: boolean;
    isModerator: boolean;
    isReader: boolean;
    memberExpirationTime: any;
    expirationTimeInSeconds: any;
    hidden: boolean;
}