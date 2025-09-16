/**
 * Import will remove at compile time
 */

import type { ConstructorType } from '@remotex-labs/xjet-expect';

/**
 * A utility type that removes all index signatures (string and number keys) from the given type `T`.
 * This results in a new type that retains only explicitly defined properties.
 *
 * @template T - The type from which index signatures are to be removed.
 *
 * @remarks
 * This type is useful for filtering out index signatures from types, especially when working
 * with mapped or dynamic types where indexable properties are not desired.
 * When an object has an index signature (e.g., `[key: string]: any`), TypeScript assumes that all
 * possible string or number keys exist on the object. This utility type filters out such keys,
 * leaving only explicitly defined properties.
 *
 * @see https://stackoverflow.com/a/66252656/4536543
 *
 * @since 1.0.0
 */

export type RemoveIndexType<T> = {
    [P in keyof T as string extends P ? never : number extends P ? never : P]: T[P];
};

/**
 * A utility type that maps the keys of a given type `T` whose properties are constructor types.
 *
 * This type iterates over the properties of `RemoveIndexType<T>`,
 * retaining only those keys where the value matches a constructor type.
 *
 * @template T - The target type from which constructor-like properties are to be extracted.
 *
 * @remarks
 * This type is designed to filter out keys of a given type `T` to include only those that are associated with constructor functions.
 * It leverages mapped types along with conditional type checks to achieve this functionality.
 *
 * @since 1.0.0
 */

export type PropertiesWithConstructorsType<T> = {
    [Key in keyof RemoveIndexType<T> as RemoveIndexType<T>[Key] extends ConstructorType ? Key : never]: RemoveIndexType<T>[Key];
};

/**
 * A utility type that extracts the keys of the provided type `T` that correspond
 * to properties with constructor types, removing any index signatures.
 *
 * @template T - The object type from which constructor property keys are extracted.
 *
 * @remarks
 * This type is useful for narrowing down a type to only the keys representing
 * properties with constructor functions (e.g., classes) while excluding index signatures.
 *
 * @since 1.0.0
 */

export type ConstructorKeysType<T> = RemoveIndexType<keyof PropertiesWithConstructorsType<T>>;

/**
 * A utility type that extracts the keys of a type `T` if `T` extends a constructor type.
 * If `T` does not extend a constructor type, it resolves to `never`.
 *
 * @template T - The type to check and extract keys from.
 *
 * @param T - The generic type parameter which is evaluated against a constructor type.
 *
 * @remarks
 * This type is particularly useful when working with class-like or constructor-based types.
 * It further applies `RemoveIndexType` to exclude index signatures from the resulting keys.
 *
 * @since 1.0.0
 */

export type KeysExtendingConstructorType<T> = T extends ConstructorType ? keyof RemoveIndexType<T> : never;
