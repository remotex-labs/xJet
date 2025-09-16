/**
 * A regular expression pattern used to match variable-like strings prefixed with a `$` symbol.
 *
 * @default /\$([#\\w.])+/g
 *
 * @see resolveVariable
 * @see interpolateVariables
 *
 * @since 1.0.0
 */

const VARIABLE_PATTERN = /\$([#\w.])+/g;

/**
 * Formats a given value into a human-readable string representation.
 *
 * @param value - The value to be formatted
 * @returns The formatted string representation of the input value
 *
 * @remarks
 * This method ensures that non-string values are converted into a JSON string with
 * indentation for easier readability. If the input is a string, it is returned as-is.
 *
 * @example
 * ```ts
 * // String input is returned unchanged
 * const str = prettyFormat("hello");  // Returns: "hello"
 *
 * // Objects are converted to indented JSON
 * const obj = prettyFormat({ name: "John", age: 30 });
 * // Returns:
 * // {
 * //     "name": "John",
 * //     "age": 30
 * // }
 * ```
 *
 * @see printf
 *
 * @since 1.0.0
 */

export function prettyFormat(value: unknown): string {
    if (typeof value === 'string') return value;

    return JSON.stringify(value, null, 4);
}

/**
 * Retrieves a value from a nested object structure based on a specified path.
 *
 * @param data - The object containing the nested data to traverse
 * @param path - An array of strings representing the sequence of keys to access the desired value
 * @returns The value found at the specified path within the object, or `undefined` if the path does not exist
 *
 * @remarks
 * This function safely traverses the given object structure without throwing errors
 * for missing keys or null/undefined values.
 *
 * @example
 * ```ts
 * const data = {
 *   user: {
 *     profile: {
 *       name: "John Doe",
 *       email: "john@example.com"
 *     }
 *   }
 * };
 *
 * const name = getValueByPath(data, ["user", "profile", "name"]);
 * // Returns: "John Doe"
 *
 * const missing = getValueByPath(data, ["user", "settings", "theme"]);
 * // Returns: undefined
 * ```
 *
 * @see resolveVariable
 *
 * @since 1.0.0
 */

export function getValueByPath(data: Record<string, unknown>, path: string[]): unknown {
    if (!path.length || !data) return undefined;

    try {
        return path.reduce((obj, key) => {
            if (obj === null || obj === undefined || typeof obj !== 'object') {
                throw new Error('Path traversal failed');
            }

            return (obj as Record<string, unknown>)[key];
        }, data as unknown);
    } catch {
        return undefined;
    }
}

/**
 * Resolves a variable token into its corresponding value from the provided data object.
 *
 * @param token - The variable token to resolve
 * @param data - The object containing data used for resolving the variable token
 * @param arrayIndex - The index value to be used if the token represents an array index (`$#`)
 * @returns The resolved value as a string, or the original token if resolution fails
 *
 * @remarks
 * This function assumes the use of dot notation in token paths to access nested properties
 * within the `data` object. Tokens starting with `$#` will be replaced by the array index.
 *
 * @example
 * ```ts
 * const data = {
 *   user: {
 *     name: "John"
 *   }
 * };
 *
 * const value1 = resolveVariable("$user.name", data, 0);
 * // Returns: "John"
 *
 * const value2 = resolveVariable("$#", data, 5);
 * // Returns: "5"
 * ```
 *
 * @see getValueByPath
 * @see interpolateVariables
 *
 * @since 1.0.0
 */

export function resolveVariable(token: string, data: Record<string, unknown>, arrayIndex: number): string {
    if (!token || typeof <unknown> token !== 'string' || !token.startsWith('$'))
        return token;

    if (token === '$#')
        return String(arrayIndex);

    const propertyPath = token.slice(1).split('.');
    const resolvedValue = getValueByPath(data, propertyPath);

    if (resolvedValue === undefined || resolvedValue === null) {
        return token;
    }

    if (typeof resolvedValue === 'object') {
        try {
            return JSON.stringify(resolvedValue, (key, value) => {
                if (key && typeof value === 'object')
                    return '[Object]';

                return value;
            });
        } catch {
            return String(resolvedValue);
        }
    }

    return String(resolvedValue);
}

/**
 * Replaces variable placeholders within a template string with corresponding values from a provided data object.
 *
 * @param template - The template string containing variable placeholders
 * @param data - An object mapping variable names to their respective values
 * @param arrayIndex - The index to be applied when resolving variables that reference array values
 * @returns The resulting string with all variable placeholders replaced by their resolved values
 *
 * @throws Error - If a required variable cannot be resolved
 *
 * @remarks
 * The function uses a regular expression to identify variable placeholders within the template string
 * and replaces them with corresponding values derived from the `data` object.
 *
 * @example
 * ```ts
 * const data = {
 *   user: {
 *     name: "Jane",
 *     id: 42
 *   },
 *   status: "active"
 * };
 *
 * const result = interpolateVariables("User $user.name ($user.id) is $status", data, 0);
 * // Returns: "User Jane (42) is active"
 * ```
 *
 * @see VARIABLE_PATTERN
 * @see resolveVariable
 *
 * @since 1.0.0
 */

export function interpolateVariables(template: string, data: Record<string, unknown>, arrayIndex: number): string {
    return template.replace(
        VARIABLE_PATTERN, (variableToken) => resolveVariable(variableToken, data, arrayIndex)
    );
}

/**
 * Formats a given string by interpolating it with the provided parameters.
 *
 * @param description - The format string containing variables or tokens to be replaced
 * @param params - An array of values to interpolate or substitute into the format string
 * @param index - An index used for specific token replacements (e.g., `%#`)
 * @returns The formatted string after performing substitutions and formatting
 *
 * @remarks
 * This function supports two formatting approaches:
 * 1. `$variable` style interpolation using the first object in the `params` array
 * 2. Printf-style format specifiers with the following options:
 *    - `%p`: Pretty prints a value
 *    - `%s`: Converts value to a string
 *    - `%d`: Converts value to a numeric string
 *    - `%i`: Converts value to an integer string (floor of the number)
 *    - `%f`: Converts value to a floating-point string
 *    - `%j`: Converts value to its JSON representation
 *    - `%o`: Outputs the object's `toString` representation
 *    - `%#`: Replaced with the provided `index`
 *    - `%%`: Escapes the `%` character
 *
 * If the `description` contains `$`-style variables, it will interpolate those using the first object in the `params` array.
 * This behavior does not apply if the string also contains `%%`.
 *
 * @example
 * ```ts
 * // Format with printf-style specifiers
 * const result1 = printf("Value: %s, Number: %d", ["test", 42], 0);
 * // Returns: "Value: test, Number: 42"
 *
 * // Format with variable interpolation
 * const data = { name: "Alice", age: 30 };
 * const result2 = printf("Name: $name, Age: $age", [data], 0);
 * // Returns: "Name: Alice, Age: 30"
 * ```
 *
 * @see prettyFormat
 * @see interpolateVariables
 *
 * @since 1.0.0
 */

export function printf(description: string, params: Array<unknown>, index: number): string {
    let paramIndex = 0;
    // Handle $variable style interpolation first
    if (description.includes('$') && !description.includes('%%')) {
        description = interpolateVariables(description, <Record<string, unknown>> params[0], index);
    }

    return description.replace(/%([psdifjo#%])/g, (match, format) => {
        if (format === '%') return '%';
        if (format === '#') return String(index);

        const value = params[paramIndex++];
        switch (format) {
            case 'p':
                return prettyFormat(value);
            case 's':
                return String(value);
            case 'd':
                return Number(value).toString();
            case 'i':
                return Math.floor(Number(value)).toString();
            case 'f':
                return Number(value).toString();
            case 'j':
                return JSON.stringify(value);
            case 'o':
                return Object.prototype.toString.call(value);
            default:
                return match;
        }
    });
}
