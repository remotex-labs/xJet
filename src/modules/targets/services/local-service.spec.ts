/**
 * Imports
 */

import { LocalService } from './local.service';
import { sandboxExecute } from '@services/vm.service';
import { PacketKind } from '@packets/constants/packet-schema.constants';

/**
 * Mock dependencies
 */

jest.mock('@services/vm.service', () => ({
    sandboxExecute: jest.fn()
}));

jest.mock('@remotex-labs/xjet-expect', () => ({
    serializeError: jest.fn((err) => ({ name: err.name, message: err.message }))
}));

jest.mock('@symlinks/services/inject.service', () => ({
    Injectable: jest.fn(),
    inject: jest.fn(() => ({
        rootPath: 'root',
        getSourceMap: jest.fn(() => undefined)
    }))
}));

class FakeQueue {
    tasks: Array<() => Promise<void>> = [];
    size = 0;
    enqueue = jest.fn((task: () => Promise<void>) => {
        this.tasks.push(task);

        return task();
    });
    start = jest.fn();
    stop = jest.fn();
    clear = jest.fn();
}

/**
 * Tests
 */

describe('LocalService', () => {
    let service: LocalService;

    beforeEach(() => {
        service = new LocalService({
            bail: true,
            filter: null,
            timeout: 5000,
            randomize: false,
            parallel: 1
        } as any);

        // swap the real queue with fake queue
        (service as any).queue = new FakeQueue();
        jest.restoreAllMocks();
    });

    describe('getRunnerName', () => {
        test('should return "local"', () => {
            expect(service.getRunnerName()).toBe('local');
        });
    });

    describe('executeSuites', () => {
        test('should enqueue and start tasks for each transpiled file', async () => {
            const spy = jest.spyOn<any, any>(service as any, 'executeTestWithErrorHandling')
                .mockResolvedValue(undefined);

            const transpileFiles = [
                { path: '/abs/path/test1.spec.js', code: 'code1' },
                { path: '/abs/path/test2.spec.js', code: 'code2' }
            ];

            await service.executeSuites(transpileFiles as any, {
                '/abs/path/test1.spec': '/abs/path/test1.spec.ts',
                '/abs/path/test2.spec': '/abs/path/test2.spec.ts'
            });

            expect(spy).toHaveBeenCalledTimes(2);
            expect((service as any).queue.enqueue).toHaveBeenCalledTimes(2);
            expect((service as any).queue.start).toHaveBeenCalled();
        });
    });

    describe('executeTestWithErrorHandling', () => {
        test('should call executeInSandbox on success', async () => {
            const sandboxSpy =
                jest.spyOn<any, any>(service as any, 'executeInSandbox').mockImplementationOnce((testCode, filePath, suiteId) => {
                    service.completeSuite(<string> suiteId);
                });

            (service as any).suites.set('rel/file.js', '123');
            (service as any).suites.set('123', '/abs/file.js');
            (service as any).executeTestWithErrorHandling('testCode', '/abs/file.js', 'rel/file.js');


            expect(sandboxSpy).toHaveBeenCalledWith('testCode', '/abs/file.js', expect.any(String));
        });

        test('should emit error event on failure', async () => {
            const error = new Error('sandbox failed');
            jest.spyOn<any, any>(service as any, 'executeInSandbox').mockImplementationOnce(() => {
                throw error;
            });


            const errorListener = jest.fn();
            service.on('error', errorListener);
            (service as any).suites.set('rel/file.js', '123');
            (service as any).suites.set('123', '/abs/file.js');

            try {
                await (service as any).executeTestWithErrorHandling('badCode', '/abs/file.js', 'rel/file.js');
            } catch {
                expect(errorListener).toHaveBeenCalledWith(
                    expect.objectContaining({
                        kind: PacketKind.Error,
                        suiteId: expect.any(String),
                        runnerId: expect.any(String),
                        error: JSON.stringify({ name: 'Error', message: 'sandbox failed' })
                    }), expect.any(String)
                );
            }
        });
    });

    describe('executeInSandbox', () => {
        test('should call sandboxExecute with test code and sandbox context', async () => {
            (sandboxExecute as jest.Mock).mockResolvedValue(undefined);

            const testCode = 'console.log("hi")';
            const testFile = '/abs/test.js';
            const suiteId = 'suite1';

            (service as any).suites.set(suiteId, testFile);
            await (service as any).executeInSandbox(testCode, testFile, suiteId);

            expect(sandboxExecute).toHaveBeenCalledWith(
                testCode,
                expect.objectContaining({
                    Buffer,
                    module: { exports: {} },
                    require: expect.any(Function),
                    __XJET: {
                        runtime: expect.objectContaining({
                            suiteId,
                            runnerId: expect.any(String),
                            path: testFile
                        })
                    },
                    dispatch: expect.any(Function)
                })
            );
        });
    });
});
