import { Mdict } from './mdict';

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
    let normalizedKey = resourceKey.replace(/\//g, '\\');
    if (normalizedKey.length > 0 && !normalizedKey.startsWith('\\')) {
      normalizedKey = '\\' + normalizedKey;
    }

    const item = this.lookupKeyBlockByWord(normalizedKey);
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
