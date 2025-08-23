/**
 * Imports
 */

import { xJetBaseError } from '@errors/base.error';
import { esBuildError } from '@errors/esbuild.error';

/**
 * Mock dependencies
 */

jest.mock('@remotex-labs/xmap/formatter.component', () => ({
    formatCode: jest.fn((code) => `[formatted code: ${ code }]`)
}));

jest.mock('@remotex-labs/xmap/highlighter.component', () => ({
    highlightCode: jest.fn((code) => `[highlighted code: ${ code }]`)
}));

jest.mock('@remotex-labs/xansi/xterm.component', () => ({
    xterm: {
        lightCoral: jest.fn((str) => `[lightCoral]${ str }[/lightCoral]`),
        dim: jest.fn((str) => `[dim]${ str }[/dim]`),
        gray: jest.fn((str) => `[gray]${ str }[/gray]`)
    }
}));

jest.mock('@providers/stack.provider', () => ({
    formatStack: jest.fn((error) => `[formatted stack for: ${ error.message }]`)
}));

/**
 * Tests
 */

describe('esBuildError', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should call reformatStack for regular error without aggregateErrors', () => {
        const error = { message: 'normal error' } as any;

        const esError = new esBuildError(error);
        expect(esError).toBeInstanceOf(esBuildError);
        expect(esError).toBeInstanceOf(xJetBaseError);

        // Expect the formatted stack returned by the mocked formatStack
        expect((<any>esError).formattedStack).toBe('[formatted stack for: normal error]');
    });

    test('should format aggregateErrors correctly', () => {
        const aggregateError = {
            text: 'Something failed',
            notes: [{ text: 'Extra info' }],
            location: {
                file: 'file.js',
                line: 5,
                column: 10,
                length: 1,
                lineText: 'const x = 1;',
                namespace: 'file',
                suggestion: ''
            },
            pluginName: 'pluginA',
            id: '123'
        };

        const error = { aggregateErrors: [ aggregateError ] } as any;

        const esError = new esBuildError(error);

        expect((<any>esError).formattedStack).toContain('esBuildError');
        expect((<any>esError).formattedStack).toContain('[lightCoral]Something failed: Extra info[/lightCoral]');
        expect((<any>esError).formattedStack).toContain('[highlighted code: const x = 1;]');
        expect((<any>esError).formattedStack).toContain('[dim]file.js[/dim]');
        expect((<any>esError).formattedStack).toContain('[gray][5:10][/gray]');
    });

    test('should handle multiple aggregateErrors', () => {
        const agg1 = {
            text: 'Error1',
            notes: [{ text: 'Note1' }],
            location: {
                file: 'a.js',
                line: 1,
                column: 2,
                length: 1,
                lineText: 'line1',
                namespace: 'a',
                suggestion: ''
            },
            pluginName: 'plugin1',
            id: 'id1'
        };
        const agg2 = {
            text: 'Error2',
            notes: [{ text: 'Note2' }],
            location: {
                file: 'b.js',
                line: 3,
                column: 4,
                length: 1,
                lineText: 'line2',
                namespace: 'b',
                suggestion: ''
            },
            pluginName: 'plugin2',
            id: 'id2'
        };

        const error = { aggregateErrors: [ agg1, agg2 ] } as any;

        const esError = new esBuildError(error);
        expect((<any>esError).formattedStack).toContain('Error1');
        expect((<any>esError).formattedStack).toContain('Error2');
    });
});
