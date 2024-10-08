import { Mdict } from './mdict.js';

export class MDD extends Mdict {
  /**
   * locate the resource key
   * @test no
   * @param resourceKey resource key
   * @returns the keyText and definition
   */
  locate(resourceKey: string): { keyText: string; definition: string | null } {
    return super.locate(resourceKey);
  }
}
