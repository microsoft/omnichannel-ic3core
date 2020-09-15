/* tslint:disable:export-name */
/* tslint:disable:no-bitwise */
/* tslint:disable:one-variable-per-declaration */
/* tslint:disable:insecure-random */

export const uuidv4 = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
