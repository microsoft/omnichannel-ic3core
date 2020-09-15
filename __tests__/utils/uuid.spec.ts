import {uuidv4} from '../../src/utils/uuid';

const uuidV4Regex = /(?:^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}$)|(?:^0{8}-0{4}-0{4}-0{4}-0{12}$)/u

describe('uuid', () => {
    it('uuid.uuidv4() should return a string', () => {
        const uuid = uuidv4();

        expect(typeof uuid).toBe('string');
    });

    it('uuid.uuidv4() should return an uuidv4', () => {
        const uuid = uuidv4();
        const found = uuid.match(uuidV4Regex);

        expect(found).not.toBe(null);
    });
});