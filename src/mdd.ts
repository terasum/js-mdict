import { Mdict } from './mdict.js';

const BASE64ENCODER = function(arrayBuffer: Uint8Array): string {
  return Buffer.from(arrayBuffer).toString('base64');
};

export class MDD extends Mdict {
  /**
   * locate the resource key
   * @param resourceKey resource key
   * @returns the keyText and definition
   */
  locate(resourceKey: string): { keyText: string; definition: string | null } {
    // return super.locate(resourceKey);

    const item = this.lookupKeyBlockByWord(resourceKey);
    if (!item) {
      return {
        keyText: resourceKey,
        definition: null
      };
    }

    const meaningBuff = this.lookupRecordByKeyBlock(item);
    if (!meaningBuff) {
      return {
        keyText: resourceKey,
        definition: null
      };
    }
    return {
      keyText: resourceKey,
      definition: BASE64ENCODER(meaningBuff)
    };
  }
}
