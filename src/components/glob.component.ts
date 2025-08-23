/**
 * Constants
 */

import { resolve } from 'path';

/**
 * Matches a single-character glob symbol (`?`).
 *
 * @remarks
 * In glob patterns, `?` matches exactly one character.
 *
 * @since 1.0.0
 */

const QUESTION_MARK = /\?/g;

/**
 * Matches brace expansion groups in glob patterns (e.g. `{a,b,c}`).
 *
 * @remarks
 * Brace groups expand into multiple alternatives separated by commas.
 *
 * @since 1.0.0
 */

const BRACE_PATTERN = /\{([^}]+)\}/g;

/**
 * Matches double asterisks (`**`) used in glob patterns.
 *
 * @remarks
 * `**` typically represents recursive directory matching.
 *
 * @since 1.0.0
 */

const DOUBLE_ASTERISK = /(?:\/|^)\*{2}(?:\/|$)/g;

/**
 * Matches a single asterisk (`*`) in glob patterns.
 *
 * @remarks
 * `*` matches zero or more characters within a single directory segment.
 *
 * @since 1.0.0
 */

const SINGLE_ASTERISK = /(?<!\.)\*/g;

/**
 * Matches escaped character classes in glob patterns (e.g. `[abc]`).
 *
 * @remarks
 * Used to translate character class expressions into regex equivalents.
 *
 * @since 1.0.0
 */

const CHARACTER_CLASS = /\\\[([^\]]+)\\\]/g;

/**
 * Matches special regex characters that need escaping.
 *
 * @remarks
 * Ensures that characters like `.`, `+`, `$`, `|`, `[]`, `\`
 * are properly escaped when compiling glob patterns.
 *
 * @since 1.0.0
 */

const REGEX_SPECIAL_CHARS = /[.+$|[\]\\]/g;

/**
 * Compiles a glob pattern into a corresponding regular expression.
 *
 * @param globPattern - The glob pattern string to convert.
 * @returns A `RegExp` instance that matches the given glob pattern.
 *
 * @remarks
 * This function converts common glob syntax into equivalent
 * regular expression syntax. It supports:
 * - `*` to match zero or more characters (excluding `/`)
 * - `**` to match across directories
 * - `?` to match exactly one character
 * - Character classes like `[abc]`
 * - Brace expansions like `{a,b,c}`
 *
 * Escapes regex-special characters before applying glob conversions
 * to ensure the resulting expression is valid.
 *
 * @example
 * ```ts
 * const regex = compileGlobPattern("src/**\/*.ts");
 * console.log(regex.test("src/utils/helpers.ts")); // true
 * console.log(regex.test("dist/index.js"));        // false
 * ```
 *
 * @since 1.0.0
 */

export function compileGlobPattern(globPattern: string): RegExp {
    const escapeRegexChars = (pattern: string): string =>
        pattern.replace(REGEX_SPECIAL_CHARS, '\\$&');

    const convertGlobToRegex = (pattern: string): string => {
        return pattern
            .replace(QUESTION_MARK, '.')
            .replace(DOUBLE_ASTERISK, '.*\/?')
            .replace(SINGLE_ASTERISK, '[^/]+')
            .replace(CHARACTER_CLASS, (_, chars) => `[${ chars }]`)
            .replace(BRACE_PATTERN, (_, choices) =>
                `(${ choices.split(',').join('|') })`);
    };

    return new RegExp(`^${ convertGlobToRegex(escapeRegexChars(globPattern)) }$`);
}

/**
 * Determines whether a given string is a glob pattern.
 *
 * @param str - The string to test.
 * @returns `true` if the string contains glob-like syntax, otherwise `false`.
 *
 * @remarks
 * This function checks for the presence of common glob syntax
 * characters (`*`, `?`, `[]`, `{}`, `!`, `@`, `+`, `()`, `|`),
 * brace expressions (e.g. `{a,b}`), and extglob patterns
 * (e.g. `@(pattern)`).
 *
 * It is useful for distinguishing between literal file paths
 * and glob patterns when working with file matching or build
 * tools.
 *
 * @example
 * ```ts
 * isGlob("src/**\/*.ts");    // true
 * isGlob("file.txt");       // false
 * isGlob("lib/@(a|b).js");  // true
 * ```
 *
 * @since 1.0.0
 */

export function isGlob(str: string): boolean {
    // Checks for common glob patterns including:
    // * ? [ ] { } ! @ + ( ) |
    const globCharacters = /[*?[\]{}!@+()|\]]/.test(str);

    // Check for brace expressions like {a,b}
    const hasBraces = /{[^}]+}/.test(str);

    // Check for extglob patterns like @(pattern)
    const hasExtglob = /@\([^)]+\)/.test(str);

    return globCharacters || hasBraces || hasExtglob;
}

/**
 * Determines whether a given path matches any of the provided regular expression patterns.
 *
 * @param path - The string path to check against the patterns.
 * @param patterns - An array of RegExp objects to test the path against.
 * @returns A boolean indicating whether the path matches any of the patterns.
 *
 * @remarks This function is commonly used in file filtering operations like
 * in the `collectFilesFromDir` function to determine which files to include
 * or exclude based on pattern matching.
 *
 * @example
 * ```ts
 * const isMatch = matchesAny('src/file.ts', [/\.ts$/, /\.js$/]);
 * console.log(isMatch); // true
 * ```
 *
 * @since 1.6.0
 */

export function matchesAny(path: string, patterns: RegExp[]): boolean {
    return patterns.some(regex => regex.test(path));
}

/**
 * Compiles an array of string/glob/regex patterns into {@link RegExp} objects.
 *
 * @remarks
 * - If an entry is already a `RegExp`, it is returned as-is.
 * - If an entry is a glob pattern (e.g. `src/**\/*.test.ts`), it is compiled into a regex
 *   using {@link compileGlobPattern}.
 * - Otherwise, literal file paths are converted into an exact-match regex,
 *   with regex metacharacters properly escaped.
 *
 * @param patterns - A list of strings (paths, globs) or regular expressions.
 * @returns An array of {@link RegExp} objects ready for matching.
 *
 * @example
 * ```ts
 * const regexes = compilePatterns([
 *   /\.test\.ts$/,             // already a regex
 *   "src/utils/helper.ts",     // literal file path
 *   "tests/**\/*.spec.ts"       // glob pattern
 * ]);
 *
 * matchesAnyRegex("src/utils/helper.ts", regexes); // true
 * ```
 *
 * @since 1.0.0
 */

export function compilePatterns(patterns: Array<string | RegExp>): Array<RegExp> {
    return patterns.map(pattern => {
        if (pattern instanceof RegExp) {
            return pattern;
        }

        if (isGlob(pattern)) {
            return compileGlobPattern(pattern);
        }

        // For literal paths, escape special regex characters and create exact match pattern
        const escapedPattern = resolve(pattern).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        return new RegExp(`^${ escapedPattern }$`);
    });
}
