import PersonType from './PersonType';

export default interface IPerson {
    displayName: string;
    id: string;
    type: PersonType;
}