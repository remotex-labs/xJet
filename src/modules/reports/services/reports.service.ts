/**
 * Import will remove at compile time
 */

import type { AbstractReporter } from '@reports/abstract/report.abstract';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';
import type { TranspileFileInterface } from '@services/interfaces/transpiler-service.interface';
import type { ReporterConstructorType } from '@reports/abstract/interfaces/report-abstract.interface';

/**
 * Node & utility imports
 */

import { existsSync } from 'fs';
import { createRequire } from 'module';

/**
 * Error & service imports
 */

import { xJetError } from '@errors/xjet.error';
import { sandboxExecute } from '@services/vm.service';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { transpileFile } from '@services/transpiler.service';

/**
 * Reporter implementations
 */

import { JsonReporter } from '@reports/reporter/json.reporter';
import { JunitReporter } from '@reports/reporter/junit.reporter';
import { ConsoleReporter } from '@reports/reporter/console.reporter';
import { LogLevel } from '@reports/abstract/constants/report.constant';

/**
 * Transpiles a reporter file into a CommonJS module.
 *
 * @remarks
 * Uses the `transpileFile` utility with predefined options:
 * - `minify: false`
 * - `format: 'cjs'`
 * - `platform: 'node'`
 * - `logLevel: 'silent'`
 * - `packages: 'external'`
 *
 * @param reporterPath - Path to the reporter file to transpile
 * @returns A promise that resolves to a {@link TranspileFileInterface} containing the transpiled file
 *
 * @see TranspileFileInterface
 * @since 1.0.0
 */

export async function transpile(reporterPath: string): Promise<TranspileFileInterface> {
    return transpileFile(reporterPath, {
        minify: false,
        format: 'cjs',
        platform: 'node',
        logLevel: 'silent',
        packages: 'external'
    });
}

/**
 * Loads and parses an external reporter file.
 *
 * @remarks
 * This function first transpiles the reporter using {@link transpile} and then executes it
 * in a sandboxed environment. The module's default export is expected to be a subclass of {@link AbstractReporter}.
 * Throws a {@link VMRuntimeError} if execution fails.
 *
 * @param reporterPath - Path to the external reporter file
 * @returns A promise that resolves to the reporter constructor ({@link ReporterConstructorType}) if successful, otherwise `undefined`
 *
 * @throws VMRuntimeError - If an error occurs during sandboxed execution
 *
 * @see transpile
 * @see ReporterConstructorType
 *
 * @since 1.0.0
 */

export async function parseExternalReporter(reporterPath: string): Promise<ReporterConstructorType | undefined> {
    const { code, path } = await transpile(reporterPath);

    try {
        const module = { exports: { default: undefined } };
        const require = createRequire(path);
        const context = { Error, Buffer, RegExp, module, console, require, setTimeout, setInterval };

        await sandboxExecute(code, context, { filename: path });

        return module.exports.default;
    } catch (error) {
        throw new VMRuntimeError(error as Error);
    }
}

/**
 * Retrieves a reporter instance based on the provided configuration.
 *
 * @remarks
 * This function supports both built-in and custom external reporters:
 * - Built-in reporters: `json`, `junit`, `default` (console).
 * - Custom reporters: dynamically loaded via {@link parseExternalReporter}.
 * The reporter is instantiated with `LogLevel.DEBUG` and an optional output file path.
 *
 * @param config - Configuration object containing reporter settings
 * @returns A promise that resolves to an {@link AbstractReporter} instance
 *
 * @throws xJetError - If the reporter path does not export a valid reporter class
 * @throws VMRuntimeError - If instantiation of a custom reporter fails
 *
 * @see LogLevel
 * @see AbstractReporter
 * @see parseExternalReporter
 *
 * @since 1.0.0
 */

export async function getReporter(config: ConfigurationInterface): Promise<AbstractReporter> {
    const { reporter, outputFile } = config;

    // Built-in reporters
    const builtInReporters: Record<string, new (level: LogLevel, path?: string) => AbstractReporter> = {
        json: JsonReporter,
        junit: JunitReporter,
        default: ConsoleReporter
    };

    if (builtInReporters[reporter] || !existsSync(reporter)) {
        const Reporter = builtInReporters[reporter] || ConsoleReporter;

        return new Reporter(LogLevel.DEBUG, outputFile);
    }

    // Custom external reporter
    const CustomReporter = await parseExternalReporter(reporter);

    if (!CustomReporter) {
        throw new xJetError(`Reporter at "${ reporter }" does not have a valid default export`);
    }

    if (typeof CustomReporter !== 'function') {
        throw new xJetError(`Reporter at "${ reporter }" is not a valid constructor`);
    }

    try {
        return new CustomReporter(LogLevel.DEBUG, outputFile);
    } catch (error) {
        throw new VMRuntimeError(error as Error);
    }
}
