/**
 * Import will remove at compile time
 */

import type { Context, ScriptOptions } from 'vm';

/**
 * Imports
 */

import { Script, createContext } from 'vm';

/**
 * Executes a piece of JavaScript code within a sandboxed context.
 *
 * This method evaluates the provided code in a secure, isolated environment by using Node.js's vm module.
 * The sandboxed context ensures that the evaluated code has limited access only to the objects explicitly provided
 * in the `sandbox` parameter. Additionally, the `RegExp` constructor and
 * `console` object are exposed by default in the sandboxed execution.
 *
 * @param code - A string containing the JavaScript code to execute within the sandbox.
 * @param sandbox - An optional object representing the sandboxed environment
 * where the execution will take place. Defaults to an empty object.
 * @param options - An optional object containing VM script configuration options:
 *   - filename: Virtual filename for the script (appears in stack traces)
 *   - lineOffset: Offset added to line numbers in stack traces
 *   - columnOffset: Offset added to column numbers in stack traces
 *   - displayErrors: Whether to include enhanced error messages
 *   - timeout: Maximum execution time in milliseconds
 *   - breakOnSigint: Whether to stop execution on SIGINT
 * @returns The result of the evaluated code from the sandboxed context.
 *
 * @throws Error - If there is a syntax error or runtime error in the provided code,
 * it will throw the corresponding error.
 *
 * @remarks
 * - Be cautious when executing untrusted code, as any malicious or unexpected
 * behavior might still occur if proper precautions are not taken when crafting
 * the sandbox environment.
 * - The `RegExp` constructor from the main Node.js context is explicitly
 * exposed to the sandbox, as issues with instanceof checks can arise from
 * differing execution contexts.
 * - Stack traces will show the virtual filename specified in options.filename,
 * which helps with debugging and error reporting.
 *
 * @example
 * ```ts
 * await sandboxExecute(
 *   'console.log("Hello")',
 *   {},
 *   { filename: 'virtual-script.js', timeout: 5000 }
 * );
 * ```
 *
 * @since 1.0.0
 */

export async function sandboxExecute(code: string, sandbox: Context = {}, options: ScriptOptions = {}): Promise<unknown> {
    /**
     * Why instanceof Fails:
     * The instanceof operator relies on the prototype chain
     * to check whether an object is an instance of a particular constructor.
     * However, in your sandboxed environment, the RegExp object might come from a different execution context (the sandbox),
     * and that context might have its own RegExp constructor,
     * which differs from the RegExp constructor in the main Node.js context.
     *
     * As a result:
     * mangleProps instanceof RegExp fails
     * because the RegExp constructor used in the sandbox might not be the same RegExp constructor
     * that exists in the main context.
     * Thus, the object doesn't match the expected prototype chain.
     *
     * Why Object.prototype.toString Works:
     * On the other hand,
     * Object.prototype.toString.call(mangleProps)
     * is a low-level check that looks at the internal class of the object,
     * not its prototype chain.
     * Since it doesn't depend on the execution context,
     * it will correctly identify the object as a RegExp regardless of which context it was created in.
     */

    sandbox.RegExp = RegExp;

    const script = new Script(code, options);
    const context = createContext(sandbox);

    return await script.runInContext(context, { breakOnSigint: true, displayErrors: false });
}
