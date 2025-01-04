"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceLatinies = replaceLatinies;
exports.hasLatinies = hasLatinies;
function replaceLatinies(word) {
    return word.normalize('NFD').replace(/[\u0300-\u036f]/g, '\u9999');
}
function hasLatinies(word) {
    return word.normalize('NFD').search(/[\u0300-\u036f]/g) != -1;
}
//# sourceMappingURL=latins.js.map