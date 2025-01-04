/**
 * measuer the function call time cost
 * @param {any} _this the target function bind object
 * @param {Function} fn the callee function
 * @param {string} name function name (optional)
 * @returns {Function}
 */
declare function measureTimeFn(_this: any, fn: Function, name?: string): Function;
/**
 * measue memory userage
 * @returns {Function} print the memeory useage step by step
 */
declare function measureMemFn(): Function;
declare const _default: {
    measureTimeFn: typeof measureTimeFn;
    measureMemFn: typeof measureMemFn;
};
export default _default;
