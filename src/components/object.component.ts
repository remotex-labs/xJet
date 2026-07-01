/**
 * Serializes a value to JSON while preserving `bigint` values.
 *
 * @template T - Type of the value being serialized.
 *
 * @param data - Value to serialize.
 * @param space - Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
 * @returns The JSON string, with every `bigint` encoded as a `{ BigInt: <decimal string> }` tag.
 *
 * @remarks
 * `JSON.stringify` throws `TypeError: Do not know how to serialize a BigInt`
 * when it meets a `bigint`, since the format has no native bigint representation.
 *
 * This function supplies a replacer that rewrites each `bigint` into a tagged
 * object carrying its base-10 string form. The tag is reversed by {@link decodeJSON},
 * so values a round-trip without precision loss. All other values pass through unchanged.
 *
 * @example
 * ```ts
 * encodeJSON({ id: 9007199254740993n });
 * // '{"id":{"BigInt":"9007199254740993"}}'
 * ```
 *
 * @see decodeJSON
 * @since 1.5.5
 */

export function encodeJSON<T = unknown>(data: T, space?: string | number): string {
    return JSON.stringify(data, (_, value) =>
        typeof value === 'bigint' ? { 'BigInt': value.toString() } : value
    , space);
}

/**
 * Parses a JSON string produced by {@link encodeJSON}, restoring tagged `bigint` values.
 *
 * @template T - Expected type of the parsed result.
 *
 * @param json - JSON string to parse.
 * @returns The parsed value, with every `{ BigInt: <string> }` tag revived back into a `bigint`.
 *
 * @remarks
 * Supplies a reviver that detects objects carrying a truthy `BigInt` property and
 * reconstructs the original value via the {@link BigInt} constructor. This reverses
 * the encoding applied by {@link encodeJSON}. All other values pass through unchanged.
 *
 * @example
 * ```ts
 * decodeJSON('{"id":{"BigInt":"9007199254740993"}}');
 * // { id: 9007199254740993n }
 * ```
 *
 * @see encodeJSON
 * @since 1.5.5
 */

export function decodeJSON<T = unknown>(json: string): T {
    return JSON.parse(json, (_, value) =>
        value && value['BigInt'] ? BigInt(value['BigInt']) : value
    );
}
