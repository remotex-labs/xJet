/**
 * Import will remove at compile time
 */

import type { AbstractReporter } from '@messages/abstract/report.abstract';
import type { ReporterConstructorType } from '@messages/interfaces/abstract.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';
import type { TranspileFileInterface } from '@services/interfaces/transpiler-service.interface';

/**
 * Imports
 */

import { existsSync } from 'fs';
import { createRequire } from 'module';
import { xJetError } from '@errors/xjet.error';
import { sandboxExecute } from '@services/vm.service';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { transpileFile } from '@services/transpiler.service';
import { LogLevel } from '@messages/constants/report.constant';
import { JsonReporter } from '@messages/reports/json.reporter';
import { JunitReporter } from '@messages/reports/junit.reporter';
import { ConsoleReporter } from '@messages/reports/console.report';

/**
 * Transpiles a reporter file into a CommonJS module.
 *
 * @param reporterPath - Path to the reporter file to transpile
 * @returns A promise that resolves to a {@link TranspileFileInterface} containing the transpiled file
 *
 * @remarks
 * Uses the `transpileFile` utility with predefined options:
 * - `minify: false`
 * - `format: 'cjs'`
 * - `platform: 'node'`
 * - `logLevel: 'silent'`
 * - `packages: 'external'`
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
 * @param reporterPath - Path to the external reporter file
 * @returns A promise that resolves to the reporter constructor ({@link ReporterConstructorType}) if successful, otherwise `undefined`
 *
 * @throws VMRuntimeError - If an error occurs during sandboxed execution
 *
 * @remarks
 * This function first transpiles the reporter using {@link transpile} and then executes it
 * in a sandboxed environment. The module's default export is expected to be a subclass of {@link AbstractReporter}.
 * Throws a {@link VMRuntimeError} if execution fails.
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
        const context = { Error, Buffer, RegExp, module, process, console, require, setTimeout, setInterval };

        await sandboxExecute(code, context, { filename: path });

        return module.exports.default;
    } catch (error) {
        throw new VMRuntimeError(error as Error);
    }
}

/**
 * Retrieves a reporter instance based on the provided configuration.
 *
 * @param config - Configuration object containing reporter settings
 * @returns A promise that resolves to an {@link AbstractReporter} instance
 *
 * @throws xJetError - If the reporter path does not export a valid reporter class
 * @throws VMRuntimeError - If instantiation of a custom reporter fails
 *
 * @remarks
 * This function supports both built-in and custom external reporters:
 * - Built-in reporters: `json`, `junit`, `default` (console).
 * - Custom reporters: dynamically loaded via {@link parseExternalReporter}.
 * The reporter is instantiated with `LogLevel.Debug` and an optional output file path.
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

        return new Reporter(LogLevel[config.logLevel] ?? 0, outputFile);
    }

    const CustomReporter = await parseExternalReporter(reporter);
    if (!CustomReporter) {
        throw new xJetError(`Reporter at "${ reporter }" does not have a valid default export`);
    }

    if (typeof CustomReporter !== 'function') {
        throw new xJetError(`Reporter at "${ reporter }" is not a valid constructor`);
    }

    try {
        return new CustomReporter(LogLevel.Debug, outputFile);
    } catch (error) {
        throw new VMRuntimeError(error as Error);
    }
}
