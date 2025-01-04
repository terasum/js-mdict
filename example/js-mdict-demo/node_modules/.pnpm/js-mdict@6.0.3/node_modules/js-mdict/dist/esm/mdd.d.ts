import { Mdict } from './mdict.js';
export declare class MDD extends Mdict {
    /**
     * locate the resource key
     * @param resourceKey resource key
     * @returns the keyText and definition
     */
    locate(resourceKey: string): {
        keyText: string;
        definition: string | null;
    };
}
