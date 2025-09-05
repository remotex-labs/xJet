/**
 * Import will remove at compile time
 */

import type { TestExecutionType } from '@services/interfaces/watch-service.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { accessSync } from 'fs';
import { readFile, watch } from 'fs/promises';
import { dirname, join, normalize } from 'path';
import { inject } from '@symlinks/services/inject.service';
import { FrameworkService } from '@services/framework.service';
import { compilePatterns, matchesAny } from '@components/glob.component';
import { resolveImport, updateAliases } from '@providers/import-resolver.provider';

/**
 * Service for watching the project filesystem and re-running only the tests
 * affected by file changes.
 *
 * @remarks
 * The service maintains a dependency graph that maps source files to test files.
 * When a file changes:
 * - If it's a test file, that file is re-executed.
 * - If it's a dependency of one or more test files, all dependent test files are re-executed.
 * - Deleted files are removed from the graph automatically.
 *
 * The watcher uses a debounced handler (default 400 ms) to batch multiple
 * filesystem changes before re-running tests.
 *
 * @example
 * ```ts
 * const service = new WatchService(config, specFiles, async (suites) => {
 *   console.log('Re-running tests:', suites);
 * });
 * await service.init();
 * ```
 *
 * @see compilePatterns
 * @see matchesAny
 * @since 1.0.0
 */

export class WatchService {
    /**
     * Regular expression for matching ESM-style import paths.
     *
     * @remarks
     * Captures module specifiers from statements such as
     * - `import x from 'module'`
     * - `import { y } from "module"`
     *
     * The named capture group `path` contains the module specifier string.
     *
     * @example
     * ```ts
     * const code = "import { readFile } from 'fs';";
     * const match = WatchService.IMPORT_REGEX.exec(code);
     * console.log(match?.groups?.path); // "fs"
     * ```
     *
     * @since 1.0.0
     */

    private static readonly IMPORT_REGEX = /(?:from|import)\s+['"](?<path>[^'"]+)['"]/g;

    /**
     * Regular expression for matching a file extension.
     *
     * @remarks
     * Matches the last dot (`.`) in a file name and all following characters,
     * excluding additional dots or path separators.
     * Effectively isolates the extension from a file path.
     *
     * @example
     * ```ts
     * const file = "example.test.ts";
     * const match = WatchService.FILE_EXTENSION_REGEX.exec(file);
     * console.log(match?.[0]); // ".ts"
     * ```
     *
     * Useful for stripping extensions when normalizing or mapping test files.
     *
     * @since 1.0.0
     */

    private static readonly FILE_EXTENSION_REGEX = /\.[^/.]+$/;

    /**
     * Reference to the core {@link FrameworkService}.
     *
     * @remarks
     * Injected via the {@link inject} helper, this service provides access to
     * framework-level configuration such as the project root path, runtime
     * environment, and shared utilities.
     * It is used here for resolving relative paths and coordinating with the
     * broader testing infrastructure.
     *
     * @see inject
     * @see FrameworkService
     *
     * @since 1.0.0
     */

    private readonly framework: FrameworkService = inject(FrameworkService);

    /**
     * Tracks the dependency relationships between source files and test files.
     *
     * @remarks
     * Each key is a file path (either a source or test file), and its value is a set of
     * test files that depend on it. This graph is used to determine which tests
     * need to be re-executed when a file changes.
     *
     * @example
     * ```ts
     * // If "utils.ts" changes, all dependent tests are retrieved:
     * const affectedTests = dependencyGraph.get('src/utils.ts');
     * ```
     *
     * @since 1.0.0
     */

    private readonly dependencyGraph: Map<string, Set<string>> = new Map();

    /**
     * Caches the list of direct dependencies for each file.
     *
     * @remarks
     * Each key is a file path, and the corresponding value is an array of file paths
     * that the key file directly imports. This cache avoids repeated parsing of
     * files when tracking changes in the dependency graph.
     *
     * @example
     * ```ts
     * const deps = dependenciesCache.get('src/test/example.spec.ts');
     * // deps might be ['src/utils.ts', 'src/helpers.ts']
     * ```
     *
     * @since 1.0.0
     */

    private readonly dependenciesCache: Map<string, Array<string>> = new Map();

    /**
     * Timer used for debouncing file change events.
     *
     * @remarks
     * When multiple file changes occur in quick succession, this timer ensures that
     * the `handleChangedFiles` method is called only once after a short delay,
     * preventing redundant executions and improving performance.
     *
     * @since 1.0.0
     */

    private debounceTimer: NodeJS.Timeout | null = null;

    /**
     * Compiled regular expressions for test file inclusion.
     *
     * @remarks
     * These patterns are derived from the user's configuration (`config.files`) and
     * are used to determine which files should be treated as test/spec files during
     * watch or execution.
     *
     * @since 1.0.0
     */

    private readonly patterns: Array<RegExp>;

    /**
     * Compiled regular expressions for file exclusion.
     *
     * @remarks
     * These patterns are derived from the user's configuration (`config.exclude`) and
     * are used to ignore files or directories when scanning for test files or
     * tracking dependencies.
     *
     * @since 1.0.0
     */

    private readonly excludes: Array<RegExp>;

    /**
     * Initializes the WatchService for monitoring test files and their dependencies.
     *
     * @param config - Configuration object containing `files` and `exclude` patterns.
     * @param testsFile - Map of test file relative paths to absolute paths.
     * @param exec - Callback invoked with the changed suites when a relevant file changes.
     *
     * @remarks
     * The constructor compiles the provided file inclusion and exclusion patterns
     * and prepares internal caches for dependency tracking. This sets up the service
     * for watching test files and their imported dependencies for changes.
     *
     * @since 1.0.0
     */

    constructor(config: ConfigurationInterface, private testsFile: Record<string, string>, private exec: TestExecutionType) {
        updateAliases();
        this.patterns = compilePatterns(config?.files ?? []);
        this.excludes = compilePatterns(config?.exclude ?? []);
    }

    /**
     * Initializes the file watcher and builds the initial dependency graph.
     *
     * @remarks
     * This method performs the following steps:
     * 1. Updates the dependency graph for all known test files.
     * 2. Sets up a recursive file system watcher on the framework's root directory.
     * 3. On file changes, normalizes paths, filters excluded files, and schedules
     *    handling of changed files with a debouncing to avoid excessive executions.
     *
     * @returns A promise that resolves when the watcher is ready.
     *
     * @since 1.0.0
     */

    async init(): Promise<void> {
        await Promise.all(Object.values(this.testsFile).map(
            (testFile) => this.updateGraph(testFile))
        );

        const changedFilesSet = new Set<string>();
        const watcher = watch(this.framework.rootPath, { recursive: true });
        for await (const { filename } of watcher) {
            if (!filename) continue;

            const fullPath = normalize(filename);
            if (matchesAny(fullPath, this.excludes)) continue;

            changedFilesSet.add(fullPath);
            this.debounce(() => this.handleChangedFiles([ ...changedFilesSet ], changedFilesSet));
        }
    }

    /**
     * Debounce the execution of a function to limit how frequently it runs.
     *
     * @param fn - The function to execute after the debounce delay.
     * @param delay - Optional debounce delay in milliseconds (default is 400 ms).
     *
     * @remarks
     * If multiple calls are made within the delay period, only the last one will execute.
     * This is used in the file watcher to prevent excessive calls to handle file changes
     * when multiple filesystem events occur in quick succession.
     *
     * @since 1.0.0
     */

    private debounce(fn: () => void, delay = 400): void {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(fn, delay);
    }

    /**
     * Checks whether a file exists on the filesystem.
     *
     * @param file - Absolute or relative path to the file.
     * @returns `true` if the file exists and is accessible, otherwise `false`.
     *
     * @remarks
     * This method uses synchronous filesystem access to determine the file's existence.
     * It is primarily used by the watcher to verify that a changed file still exists
     * before processing it.
     *
     * @since 1.0.0
     */

    private fileExists(file: string): boolean {
        try {
            accessSync(file);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Removes a file and all its associations from the dependency graph.
     *
     * @param file - The absolute path of the file to remove.
     *
     * @remarks
     * This method removes the file from both the main `dependencyGraph` and the
     * `dependenciesCache`. It also ensures that any other files that depend on this
     * file no longer reference it as a dependency. This is useful when a file is
     * deleted or no longer relevant to the test execution.
     *
     * @since 1.0.0
     */

    private removeFileFromGraph(file: string): void {
        this.dependencyGraph.delete(file);
        this.dependenciesCache.delete(file);

        for (const dependents of this.dependencyGraph.values()) {
            dependents.delete(file);
        }
    }

    /**
     * Processes a batch of changed files, updates the dependency graph, and triggers test execution.
     *
     * @param changedFiles - Array of absolute paths for files that have changed.
     * @param changedFilesSet - Set used for debouncing and tracking currently changed files.
     *
     * @remarks
     * For each file in `changedFiles`:
     * 1. If the file no longer exists, it is removed from the dependency graph.
     * 2. If the file matches test patterns, the dependency graph is updated and the file is queued for execution.
     * 3. If the file is a dependency of any test files, those dependent test files are also updated and queued.
     *
     * Once all relevant test files are collected, the `exec` function is called with a map of suite IDs to their absolute file paths.
     *
     * @since 1.0.0
     */

    private async handleChangedFiles(changedFiles: string[], changedFilesSet: Set<string>): Promise<void> {
        changedFilesSet.clear();
        const suites: Record<string, string> = {};

        for (const file of changedFiles) {
            if (!this.fileExists(file)) {
                this.removeFileFromGraph(file);
                continue;
            }

            if (matchesAny(file, this.patterns)) {
                await this.updateGraph(file);
                const key = file.replace(WatchService.FILE_EXTENSION_REGEX, '');
                suites[key] = file;
            }

            if (this.dependencyGraph.has(file)) {
                await this.updateGraph(file);
                this.dependencyGraph.get(file)?.forEach(suite => {
                    const key = suite.replace(WatchService.FILE_EXTENSION_REGEX, '');
                    suites[key] = suite;
                });
            }
        }

        if (Object.keys(suites).length > 0) {
            await this.exec(suites);
        }
    }

    /**
     * Extracts and returns all TypeScript dependencies for a given test file.
     *
     * @param target - Absolute path of the file to analyze for imports.
     * @param force - If `true`, bypasses the cache and recomputes dependencies.
     * @returns An array of absolute paths representing the imported files.
     *
     * @remarks
     * This function reads the file content, matches all `import` or `from` statements
     * using the {@link WatchService.IMPORT_REGEX}, and resolves relative paths to absolute paths.
     * Results are cached in {@link dependenciesCache} for faster lookups.
     *
     * @example
     * ```ts
     * const deps = await getTestDependencies('/project/tests/unit/example.spec.ts');
     * console.log(deps); // ['/project/src/util.ts', '/project/src/helper.ts', ...]
     * ```
     *
     * @since 1.0.0
     */

    private async getTestDependencies(target: string, force: boolean = false): Promise<Array<string>> {
        if (!force && this.dependenciesCache.has(target)) {
            return this.dependenciesCache.get(target)!;
        }

        try {
            const content = await readFile(target, 'utf-8');
            const dependencies: string[] = [];

            for (const match of content.matchAll(WatchService.IMPORT_REGEX)) {
                const importPath = match.groups?.path;
                if (!importPath) continue;

                const path = resolveImport(importPath) ?? join(dirname(target), importPath);
                dependencies.push(path.endsWith('.ts') ? path : `${ path }.ts`);
            }

            this.dependenciesCache.set(target, dependencies);

            return dependencies;
        } catch {
            this.dependenciesCache.set(target, []);

            return [];
        }
    }

    /**
     * Recursively links a set of test files to their dependencies in the dependency graph.
     *
     * @param testFiles - Array of test file paths that depend on the given dependencies.
     * @param dependencies - Array of dependency file paths to link to the test files.
     *
     * @remarks
     * This function ensures that any changes in a dependency file can trigger re-execution
     * of all test files that depend on it. It also recursively processes nested dependencies
     * by calling {@link getTestDependencies} for each dependency.
     *
     * @example
     * ```ts
     * await linkDependency(['tests/unit/example.spec.ts'], ['src/util.ts']);
     * ```
     *
     * @since 1.0.0
     */

    private async linkDependency(testFiles: Array<string>, dependencies: Array<string>): Promise<void> {
        for (const dep of dependencies) {
            const depSet = this.dependencyGraph.get(dep) ?? new Set<string>();
            const originalSize = depSet.size;
            testFiles.forEach((test) => depSet.add(test));

            if (!this.dependencyGraph.has(dep)) {
                this.dependencyGraph.set(dep, depSet);
            }

            if (depSet.size > originalSize) {
                const nestedDeps = await this.getTestDependencies(dep);
                if (nestedDeps.length > 0) {
                    await this.linkDependency(testFiles, nestedDeps);
                }
            }
        }
    }

    /**
     * Updates the dependency graph for a changed file.
     *
     * @param changedFile - The absolute path of the file that has changed.
     *
     * @remarks
     * This method ensures that the dependency graph remains up to date when a file changes:
     * - If the changed file is a test file (matches the configured patterns), its direct dependencies
     *   are retrieved using {@link getTestDependencies} and linked via {@link linkDependency}.
     * - If the changed file is a dependency for other test files, all dependent test files are updated
     *   recursively to include the changed file's dependencies.
     *
     * The dependency graph allows the watch service to re-run only affected test files when a source
     * or test file changes, improving efficiency during watch mode.
     *
     * @example
     * ```ts
     * await updateGraph('tests/unit/example.spec.ts');
     * ```
     *
     * @since 1.0.0
     */

    private async updateGraph(changedFile: string): Promise<void> {
        const isTestFile = matchesAny(changedFile, this.patterns);

        if (isTestFile) {
            const deps = await this.getTestDependencies(changedFile, true);
            await this.linkDependency([ changedFile ], deps);
        } else if (this.dependencyGraph.has(changedFile)) {
            const testFiles = [ ...this.dependencyGraph.get(changedFile)! ];
            const deps = await this.getTestDependencies(changedFile, true);
            await this.linkDependency(testFiles, deps);
        }
    }
}
