/**
 * Creates a new function that, when called, has its 'this' keyword set to the provided value,
 * with a given sequence of arguments preceding any provided when the new function is called.
 *
 * @param thisArg - The value to be passed as the 'this' parameter to the target function when the bound function is called
 * @param args - Arguments to prepend to arguments provided to the bound function when invoking the target function
 * @returns A new function instance that is bound to the provided `thisArg` value, with optional arguments prepended
 *
 * @throws TypeError - If the target is not callable
 *
 * @remarks
 * This method ensures that the value of 'this' within the bound function is maintained as the specified object,
 * regardless of how the bound function is called. Any arguments provided at the time of binding are prepended
 * to the arguments passed when calling the bound function.
 *
 * @example
 * ```ts
 * const module = {
 *   x: 42,
 *   getX: function() {
 *     return this.x;
 *   }
 * };
 *
 * const unboundGetX = module.getX;
 * // When called without proper context, 'this' is not the module
 * console.log(unboundGetX()); // undefined
 *
 * const boundGetX = unboundGetX.bind(module);
 * // 'this' is correctly bound to the module
 * console.log(boundGetX()); // 42
 *
 * // With arguments prepending
 * function list() {
 *   return Array.from(arguments);
 * }
 * const listWith = list.bind(null, 1, 2);
 * console.log(listWith(3, 4)); // [1, 2, 3, 4]
 * ```
 *
 * @see call
 * @see apply
 *
 * @since 1.0.0
 */

Function.prototype.bind = new Proxy(Function.prototype.bind, {
    apply(target, thisArg, args): unknown {
        const obj = Reflect.apply(target, thisArg, args);
        obj.__boundThis = args[0];
        obj.__boundArgs = args.slice(1);

        return obj;// Preserve the original `.bind` behavior
    }
});
