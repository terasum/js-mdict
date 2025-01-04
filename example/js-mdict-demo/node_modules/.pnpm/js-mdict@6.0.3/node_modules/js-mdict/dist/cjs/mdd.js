"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MDD = void 0;
const mdict_js_1 = require("./mdict.js");
const BASE64ENCODER = function (arrayBuffer) {
    return Buffer.from(arrayBuffer).toString('base64');
};
class MDD extends mdict_js_1.Mdict {
    /**
     * locate the resource key
     * @param resourceKey resource key
     * @returns the keyText and definition
     */
    locate(resourceKey) {
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
exports.MDD = MDD;
//# sourceMappingURL=mdd.js.map