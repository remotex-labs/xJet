/**
 * Imports
 */

import { normalize } from 'path';
import { parseErrorStack } from '@remotex-labs/xmap/parser.component';
import { formatErrorCode } from '@remotex-labs/xmap/formatter.component';
import { highlightCode } from '@remotex-labs/xmap/highlighter.component';
import { formatStack, getSourceLocation, highlightPositionCode, stackEntry } from '@providers/stack.provider';
import { formatFrameWithPosition, formatStackFrame, parseStackTrace, stackMetadata } from '@providers/stack.provider';

/**
 * Mock dependencies
 */

jest.mock('@services/framework.service');
jest.mock('@symlinks/symlinks.module', () => ({
    inject: jest.fn(() => ({
        getSourceMap: jest.fn(() => null),
        isFrameworkFile: jest.fn(() => false),
        rootPath: '/app',
        distPath: '/app/dist'
    }))
}));

jest.mock('@remotex-labs/xmap/highlighter.component', () => ({
    highlightCode: jest.fn((code) => `[highlighted]${ code }[/highlighted]`)
}));

jest.mock('@remotex-labs/xmap/formatter.component', () => ({
    formatErrorCode: jest.fn((position, options) => `[formatted color=${ options.color }]${ position.code }[/formatted]`)
}));

jest.mock('@remotex-labs/xmap/parser.component', () => ({
    parseErrorStack: jest.fn(() => ({
        stack: [
            { functionName: 'func1', fileName: '/app/src/file1.js', line: 1, column: 2 },
            { functionName: 'func2', fileName: '/app/src/file2.js', line: 3, column: 4 }
        ]
    }))
}));

jest.mock('@remotex-labs/xansi/xterm.component', () => ({
    xterm: {
        gray: jest.fn((str) => `[gray]${ str }[/gray]`),
        darkGray: jest.fn((str) => `[darkGray]${ str }[/darkGray]`),
        brightPink: 'pink',
        lightCoral: jest.fn((str) => `[lightCoral]${ str }[/lightCoral]`)
    }
}));

/**
 * Tests
 */

describe('formatStackFrame', () => {
    const context = {
        framework: {
            rootPath: '/app'
        }
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should shorten file path relative to framework root and include line/column', () => {
        const frame = {
            source: 'inline code',
            fileName: '/app/src/utils/file.js',
            functionName: 'myFunction',
            line: 10,
            column: 5,
            eval: false,
            async: false,
            native: false,
            constructor: false
        };

        const result = formatStackFrame.call(context, frame);

        expect(result).toContain('myFunction');
        expect(result).toContain(`at myFunction [darkGray]${ normalize(frame.fileName) }[/darkGray] [gray][10:5][/gray]`);
        expect(result).toContain('[gray][10:5][/gray]');
    });

    test('should return source if fileName is missing', () => {
        const frame = { source: 'inline code' } as any;
        const result = formatStackFrame.call(context, frame);
        expect(result).toBe('inline code');
    });

    test('should handle frames with missing line/column', () => {
        const frame = {
            source: 'inline code',
            fileName: '/app/src/file.js',
            functionName: 'myFunction',
            eval: false,
            async: false,
            native: false,
            constructor: false
        };
        const result = formatStackFrame.call(context, frame);
        expect(result).toContain('myFunction');
        expect(result).toContain(`at myFunction [darkGray]${ normalize(frame.fileName) }[/darkGray]`);
        expect(result).not.toContain('[gray]');
    });

    test('should trim extra spaces', () => {
        const frame = {
            source: 'inline code',
            fileName: '/app/src/file.js',
            functionName: 'myFunction',
            line: 0,
            column: 0,
            eval: false,
            async: false,
            native: false,
            constructor: false
        };
        const result = formatStackFrame.call(context, frame);
        expect(result).not.toMatch(/\s{2,}/);
    });
});

describe('getSourceLocation', () => {
    const context = {
        framework: {
            distPath: '/app/dist'
        }
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return full http URL with line number', () => {
        const frame = { fileName: '' } as any;
        const position = { source: 'http://example.com/file.js', sourceRoot: '', line: 10 } as any;
        const result = getSourceLocation.call(context, frame, position);
        expect(result).toBe('http://example.com/file.js#L10');
    });

    test('should return full https URL with line number', () => {
        const frame = { fileName: '' } as any;
        const position = { source: 'https://example.com/file.js', sourceRoot: '', line: 20 } as any;
        const result = getSourceLocation.call(context, frame, position);
        expect(result).toBe('https://example.com/file.js#L20');
    });

    test('should return source with sourceRoot applied', () => {
        const frame = { fileName: '' } as any;
        const position = { source: 'src/file.js', sourceRoot: '/app/', line: 5 } as any;
        const result = getSourceLocation.call(context, frame, position);
        expect(result).toContain('#L5');
        expect(result).toContain('src/file.js');
    });

    test('should fallback to fileName if source is missing', () => {
        const frame = { fileName: 'file.js' } as any;
        const position = { source: '', sourceRoot: '', line: 0 } as any;
        const result = getSourceLocation.call(context, frame, position);
        expect(result).toBe('file.js');
    });

    test('should remove file:// prefix from fileName', () => {
        const frame = { fileName: 'file://file.js' } as any;
        const position = { source: '', sourceRoot: '', line: 0 } as any;
        const result = getSourceLocation.call(context, frame, position);
        expect(result).toBe('file.js');
    });
});

describe('highlightPositionCode', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should highlight code and format with brightPink color', () => {
        const position = {
            code: 'const x = 1;',
            line: 1,
            column: 0,
            name: 'myFunction',
            source: 'file.js',
            sourceRoot: '/app/'
        };

        const result = highlightPositionCode(position as any);

        expect(highlightCode).toHaveBeenCalledWith('const x = 1;');
        expect(formatErrorCode).toHaveBeenCalledWith(
            { ...position, code: '[highlighted]const x = 1;[/highlighted]' },
            { color: 'pink' }
        );
        expect(result).toBe('[formatted color=pink][highlighted]const x = 1;[/highlighted][/formatted]');
    });
});

describe('formatFrameWithPosition', () => {
    const context = {
        framework: { rootPath: '/app', distPath: '/app/dist' },
        code: '',
        formatCode: ''
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        context.code = '';
        context.formatCode = '';
    });

    test('should set code and formatCode if not set', () => {
        const frame = {
            functionName: 'myFunc',
            fileName: '/app/src/file.js'
        } as any;

        const position = {
            code: 'const x = 1;',
            line: 10,
            column: 5,
            name: 'myFunc',
            source: 'src/file.js',
            sourceRoot: '/app/'
        } as any;

        const result = formatFrameWithPosition.call(context, frame, position);

        expect(context.code).toBe('const x = 1;');
        expect(context.formatCode).toContain('const x = 1;');
        expect(result).toContain('myFunc');
        expect(result).toContain('file.js#L10');
        expect(result).toContain('[10:5]');
    });

    test('should not override code and formatCode if already set', () => {
        context.code = 'existing code';
        context.formatCode = 'existing formatCode';

        const frame = {
            functionName: 'myFunc',
            fileName: '/app/src/file.js'
        } as any;

        const position = {
            code: 'new code',
            line: 20,
            column: 3,
            name: 'myFunc',
            source: 'src/file.js',
            sourceRoot: '/app/'
        } as any;

        const result = formatFrameWithPosition.call(context, frame, position);

        expect(context.code).toBe('existing code');
        expect(context.formatCode).toBe('existing formatCode');
        expect(result).toContain('myFunc');
        expect(result).toContain(normalize('src/file.js'));
        expect(result).toContain('[20:3]');
    });
});

describe('stackEntry', () => {
    const position = {
        line: 10,
        column: 5,
        code: 'const x = 1;',
        name: 'myFunc',
        source: 'src/file.js',
        sourceRoot: '/app/'
    } as any;

    const mockSource = {
        getPositionWithCode: jest.fn(() => position)
    };

    const context = {
        framework: {
            getSourceMap: jest.fn(() => mockSource),
            isFrameworkFile: jest.fn(() => false)
        },
        withNativeFrames: true,
        withFrameworkFrames: true,
        code: '',
        formatCode: ''
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        context.code = '';
        context.formatCode = '';
    });

    test('should return empty string if native frame is skipped', () => {
        const frame = { native: true } as any;
        context.withNativeFrames = false;

        const result = stackEntry.call(context, frame);
        expect(result).toBe('');
    });

    test('should return empty string for empty frame', () => {
        const frame = {} as any;
        const result = stackEntry.call(context, frame);
        expect(result).toBe('');
    });

    test('should call formatStackFrame if no source map', () => {
        const frame = { fileName: 'file.js', functionName: 'myFunc', line: 1, column: 1 } as any;
        context.framework.getSourceMap = jest.fn(() => null);

        const result = stackEntry.call(context, frame);
        expect(result).toContain('myFunc');
        expect(result).toContain('file.js');
    });

    test('should return formatted frame with position', () => {
        const frame = { fileName: 'file.js', functionName: 'myFunc', line: 10, column: 5 } as any;
        context.framework.distPath = '/app/src/file.js';
        context.framework.getSourceMap = jest.fn(() => mockSource);

        const result = stackEntry.call(context, frame);
        expect(result).toContain('myFunc');
        expect(result).toContain('src/file.js');
        expect(result).toContain('[10:5]');
        expect(context.line).toBe(10);
        expect(context.column).toBe(5);
    });

    test('should skip framework file if withFrameworkFrames is false', () => {
        const frame = { fileName: 'file.js', functionName: 'myFunc', line: 10, column: 5 } as any;
        context.withFrameworkFrames = false;
        context.framework.isFrameworkFile = jest.fn(() => true);

        const result = stackEntry.call(context, frame);
        expect(result).toBe('');
    });
});

describe('parseStackTrace', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should parse error stack and return structured stack interface', () => {
        const error = new Error('Test error');

        const result = parseStackTrace(error);

        expect(parseErrorStack).toHaveBeenCalledWith(error);
        expect(result.stacks.length).toBe(2);
        expect(result.stacks[0]).toContain('func1');
        expect(result.stacks[1]).toContain('func2');
        expect(result.code).toBe('');
        expect(result.formatCode).toBe('');
        expect(result.line).toBe(0);
        expect(result.column).toBe(0);
    });

    test('should apply options when provided', () => {
        const error = new Error('Test error');

        const result = parseStackTrace(error, { withNativeFrames: false });

        expect(result.stacks.length).toBe(2);
        expect(result.code).toBe('');
    });
});

describe('formatStack', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should format error with name, message, formatted code, and stack lines', () => {
        const error = new Error('Test error');

        const result = formatStack(error);

        expect(result).toContain(error.name);
        expect(result).toContain('Test error');
        // It should include stack lines if parseStackTrace returns them
        expect(result).toMatch(/Enhanced Stack Trace:/);
    });

    test('should handle errors with no stacks or formatted code', () => {
        (parseErrorStack as jest.Mock).mockReturnValueOnce({ stack: [] });
        const error = { name: 'Error', message: 'Empty error', stack: '' };
        const result = formatStack(error);

        expect(result).toContain('Empty error');
        // If parseStackTrace returns no stacks, the Enhanced Stack Trace section shouldn't appear
        expect(result).not.toMatch(/^\sEnhanced Stack Trace:/m);
    });
});

describe('stackMetadata', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return structured metadata with indented stack lines', () => {
        const error = new Error('Test error');
        const metadata = stackMetadata(error);

        expect(metadata).toHaveProperty('code');
        expect(metadata).toHaveProperty('line');
        expect(metadata).toHaveProperty('column');
        expect(metadata).toHaveProperty('stacks');
        expect(metadata).toHaveProperty('formatCode');

        // stacks should be joined and indented with 4 spaces
        if (metadata.stacks) {
            const lines = metadata.stacks.split('\n');
            for (const line of lines) {
                expect(line.startsWith('    ')).toBe(true);
            }
        }
    });

    test('should handle errors with empty stack', () => {
        const error = new Error('Empty error');
        const metadata = stackMetadata(error);

        expect(metadata.code).toBeDefined();
        expect(metadata.stacks).toBeDefined();
        expect(metadata.formatCode).toBeDefined();
    });
});
