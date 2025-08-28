/**
 * Import will remove at compile time
 */

import type { LogLevel } from '@reports/abstract/constants/report.constant';
import type { TestEndInterface } from '@reports/abstract/interfaces/report-abstract.interface';
import type { SuiteDisplayInterface } from '@reports/reporter/interfaces/console-reporter.interface';
import type { RunnerInterface, SuiteEndInterface } from '@reports/abstract/interfaces/report-abstract.interface';
import type { DescribeEndInterface, SuiteStartInterface } from '@reports/abstract/interfaces/report-abstract.interface';

/**
 * Imports
 */

import { xterm } from '@remotex-labs/xansi/xterm.component';
import { ANSI, writeRaw } from '@remotex-labs/xansi/ansi.component';
import { ShadowRenderer } from '@remotex-labs/xansi/shadow.service';
import { AbstractReporter } from '@reports/abstract/report.abstract';
import { ConsolePrefixStatus } from '@reports/abstract/constants/console.constant';

/**
 *
 */

export class ConsoleReporter extends AbstractReporter {
    private renderer: ShadowRenderer;
    private isSingleRunner = false;
    private maxRunnerNameLength = 0;
    private suiteOrder: Array<string> = [];
    private suiteMap = new Map<string, SuiteDisplayInterface>();

    constructor(logLevel: LogLevel, outFilePath?: string) {
        super(logLevel, outFilePath);
        writeRaw(ANSI.HIDE_CURSOR);
        writeRaw(ANSI.CLEAR_SCREEN);

        const height = process.stdout.rows ?? 24;
        const width = process.stdout.columns ?? 80;
        this.renderer = new ShadowRenderer(height, width, 1, 0);
    }

    init(suites: Array<string>, runners: Array<RunnerInterface>): void {
        runners = runners.length < 1 ? [{ name: 'local', id: '' }] : runners;
        this.isSingleRunner = runners.length < 2;
        this.maxRunnerNameLength = Math.max(...runners.map(r => r.name.length));

        for (const suiteName of suites) {
            for (const runner of runners) {
                const key = this.getSuiteKey(runner, suiteName);
                const content = this.getPrefix(ConsolePrefixStatus.PENDING, runner, suiteName);
                this.suiteMap.set(key, {
                    row: 0,
                    content,
                    details: []
                });

                this.suiteOrder.push(key);
            }
        }

        this.renderSuites();
    }

    suiteStart(event: SuiteStartInterface): void {
        const suite = this.ensureSuite(event.runner, event.suiteName);
        suite.content = this.getPrefix(ConsolePrefixStatus.RUN, event.runner, event.suiteName);

        this.renderSuites();
    }

    suiteEnd(event: SuiteEndInterface): void {
        const suite = this.ensureSuite(event.runner, event.suiteName);
        let content = this.getPrefix(ConsolePrefixStatus.FAIL, event.runner, event.suiteName);
        content += ` ${ event.duration }ms`;
        suite.content = content;

        if (event.errors?.length) {
            for (const err of event.errors) {
                const lines = err.message.split(/\r?\n/);
                for (const line of lines) {
                    suite.details.push(`${ xterm.redBright('[ERROR]') } ${ line }`);
                }
            }
        }

        this.renderSuites();
    }

    describeEnd(event: DescribeEndInterface): void {
        const suite = this.ensureSuite(event.runner, event.suiteName);
        if (event.errors?.length) {
            for (const err of event.errors) {
                const lines = err.message.split(/\r?\n/);
                for (const line of lines) {
                    suite.details.push(`${ xterm.redBright('[Describe ERROR]') } ${ line }`);
                }
            }
        }
        this.renderSuites();
    }

    testEnd(event: TestEndInterface): void {
        const suite = this.ensureSuite(event.runner, event.suiteName);
        let status = event.passed ? xterm.greenBright('✓') : xterm.redBright('✗');
        if (event.todo) status = xterm.magentaBright('TODO');

        const testLine = `${ status } ${ event.description } (${ event.duration }ms)`;
        suite.details.push(testLine);

        if (event.errors?.length) {
            for (const err of event.errors) {
                const lines = err.message.split(/\r?\n/);
                for (const line of lines) {
                    suite.details.push(`${ xterm.redBright('[Test ERROR]') } ${ line }`);
                }
            }
        }

        this.renderSuites();
    }

    private getSuiteKey(runner: RunnerInterface, suiteName: string): string {
        return `${ runner.name }::${ suiteName }`;
    }

    private ensureSuite(runner: RunnerInterface, suiteName: string): SuiteDisplayInterface {
        return this.suiteMap.get(this.getSuiteKey(runner, suiteName))!;
    }

    private renderSuites(): void {
        let row = 0;
        for (const key of this.suiteOrder) {
            const suite = this.suiteMap.get(key)!;
            suite.row = row;
            this.renderer.writeText(row++, 0, suite.content);

            for (const detail of suite.details) {
                this.renderer.writeText(row++, 2, detail, true);
            }
        }

        this.renderer.render();
    }

    private getPrefix(status: ConsolePrefixStatus, runner: RunnerInterface, suiteName: string): string {
        let statusPrefix = xterm.hex('#808080')('[ PENDING ]');

        switch (status) {
            case ConsolePrefixStatus.RUN:
                statusPrefix = xterm.hex('#FFD966')('[ RUNNING ]');
                break;
            case ConsolePrefixStatus.PASS:
                statusPrefix = xterm.hex('#90EE90')('[ PASSED ] ');
                break;
            case ConsolePrefixStatus.FAIL:
                statusPrefix = xterm.hex('#F08080')('[ FAILED ] ');
                break;
        }

        statusPrefix += this.isSingleRunner
            ? ''
            :  ' ' + xterm.burntOrange(`[ ${ runner.name.padEnd(this.maxRunnerNameLength) } ]`);

        return `${ statusPrefix } ${ suiteName }`;
    }
}
