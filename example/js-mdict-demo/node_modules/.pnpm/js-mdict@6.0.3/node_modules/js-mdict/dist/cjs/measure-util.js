"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * measuer the function call time cost
 * @param {any} _this the target function bind object
 * @param {Function} fn the callee function
 * @param {string} name function name (optional)
 * @returns {Function}
 */
//@es-ignore
function measureTimeFn(_this, fn, name = 'unknown') {
    let fname = fn.toString();
    fname = fname.substring('function '.length);
    fname = fname.substring(0, fname.indexOf('('));
    return function (...args) {
        console.time(fname !== null && fname !== void 0 ? fname : name);
        const res = fn.bind(_this)(...args);
        console.timeEnd(fname !== null && fname !== void 0 ? fname : name);
        return res;
    };
}
/**
 * measue memory userage
 * @returns {Function} print the memeory useage step by step
 */
function measureMemFn() {
    // closure variables
    const memoryStack = [];
    let step = -1;
    return function (name) {
        const used = process.memoryUsage();
        const memDatas = [];
        step++;
        memoryStack.push(used);
        for (const key in used) {
            const key_used = Math.round((used[key] / 1024 / 1024) * 100) / 100;
            let last_key_used = 0;
            if (step > 0) {
                last_key_used =
                    Math.round((memoryStack[step - 1][key] / 1024 / 1024) * 100) / 100;
            }
            memDatas.push({
                step: step,
                category: name,
                key: key,
                'used(MB)': key_used,
                'diff(MB)': Math.round((key_used - last_key_used) * 100) / 100,
            });
        }
        console.table(memDatas);
    };
}
exports.default = {
    measureTimeFn,
    measureMemFn,
};
//# sourceMappingURL=measure-util.js.map