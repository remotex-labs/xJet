/**
 * Imports
 */

import { xJetError } from '@errors/xjet.error';
import { ExternalService } from './external.service';
import { withTimeout } from '@components/timeout.component';
import { PacketKind } from '@packets/constants/packet-schema.constants';

/**
 * Mock dependencies
 */

jest.mock('@components/timeout.component', () => ({
    withTimeout: jest.fn((fn) => fn)
}));

jest.mock('@remotex-labs/xjet-expect', () => ({
    serializeError: jest.fn((err) => ({ name: err.name, message: err.message }))
}));

jest.mock('yargs', () => {
    return jest.fn(() => ({
        options: jest.fn().mockReturnThis(),
        parseSync: jest.fn().mockReturnValue({ foo: 'bar' })
    }));
});

jest.mock('@symlinks/services/inject.service', () => ({
    Injectable: jest.fn(),
    inject: jest.fn(() => ({
        rootPath: 'root',
        getSourceMap: jest.fn(() => undefined)
    }))
}));

class FakeQueue {
    tasks: Array<() => Promise<void>> = [];
    enqueue = jest.fn((task: () => Promise<void>) => {
        this.tasks.push(task);

        return task();
    });
    start = jest.fn();
    stop = jest.fn();
    clear = jest.fn();
}

function createFakeRunner(name = 'fake-runner') {
    return {
        name,
        id: '',
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        dispatch: jest.fn().mockResolvedValue(undefined),
        connectionTimeout: 50,
        dispatchTimeout: 50
    };
}

/**
 * Tests
 */

describe('ExternalService', () => {
    let service: ExternalService;

    beforeEach(() => {
        jest.restoreAllMocks();
        service = new ExternalService({
            bail: true,
            filter: null,
            timeout: 5000,
            randomize: false,
            parallel: 1,
            testRunners: [ createFakeRunner() ]
        } as any);

        // replace queue with fake
        (service as any).queue = new FakeQueue();
    });

    describe('initTarget', () => {
        test('should connect all configured runners', async () => {
            const runner = createFakeRunner('runner1');
            service = new ExternalService({
                bail: false,
                timeout: 1000,
                testRunners: [ runner ]
            } as any);
            (service as any).queue = new FakeQueue();

            await service.initTarget();

            expect(runner.connect).toHaveBeenCalled();
            expect(service.runners.size).toBe(1);
        });

        test('should throw if no testRunners provided', async () => {
            service = new ExternalService({
                bail: true,
                timeout: 1000,
                testRunners: []
            } as any);

            await expect(service.initTarget()).rejects.toThrow(xJetError);
        });
    });

    describe('getRunnerName', () => {
        test('should return runner name when id is found', async () => {
            const runner = createFakeRunner('good-runner');
            service.runners.set('abc', runner);

            expect(service.getRunnerName('abc')).toBe('good-runner');
        });

        test('should throw if runner id is missing', () => {
            expect(() => service.getRunnerName('missing')).toThrow(xJetError);
        });
    });

    describe('executeSuites', () => {
        test('should enqueue tasks for all files and runners', async () => {
            const spy = jest.spyOn<any, any>(service as any, 'executeTestWithErrorHandling')
                .mockResolvedValue(undefined);

            service.runners.set('runner1', createFakeRunner());

            const files = [
                { path: '/abs/test1.js', code: 'code1' },
                { path: '/abs/test2.js', code: 'code2' }
            ];

            await service.executeSuites(files, {
                '/abs/path/test1.spec': '/abs/path/test1.spec.ts',
                '/abs/path/test2.spec': '/abs/path/test2.spec.ts'
            });

            expect(spy).toHaveBeenCalledTimes(2);
            expect((service as any).queue.enqueue).toHaveBeenCalledTimes(2);
            expect((service as any).queue.start).toHaveBeenCalled();
        });
    });

    describe('executeTestWithErrorHandling', () => {
        test('should call executeInRunner on success', async () => {
            const spy = jest.spyOn<any, any>(service as any, 'executeInRunner').mockImplementationOnce((testCode, suiteId) => {
                service.completeSuite(<string> suiteId);
            });

            (service as any).suites.set('rel.js', '123');
            (service as any).suites.set('123', 'rel.ts');
            await (service as any).executeTestWithErrorHandling('code', 'rel.js', createFakeRunner());

            expect(spy).toHaveBeenCalledWith('code', expect.any(String), expect.any(Object));
        });

        test('should emit error event when executeInRunner fails', async () => {
            const error = new Error('runner failed');
            jest.spyOn<any, any>(service as any, 'executeInRunner').mockImplementationOnce(() => {
                throw error;
            });

            (service as any).suites.set('rel.js', '123');
            (service as any).suites.set('123', '/file.js');
            const errorListener = jest.fn();
            service.on('error', errorListener);

            try {
                await (service as any).executeTestWithErrorHandling('bad', 'rel.js', createFakeRunner());
            } catch {
                // intentionally ignored
            }

            expect(errorListener).toHaveBeenCalledWith(
                expect.objectContaining({
                    kind: PacketKind.Error,
                    error: JSON.stringify({ name: 'Error', message: 'runner failed' })
                }), expect.any(String)
            );
        });
    });

    describe('executeInRunner', () => {
        test('should dispatch test code with context', async () => {
            const runner = createFakeRunner('my-runner');
            runner.id = 'runner-id';
            service.runners.set('runner-id', runner);
            (service as any).suites.set('compiled.js', '123');
            (service as any).suites.set('123', 'real.js');

            await (service as any).executeInRunner('console.log("hi")', '123', runner);

            expect(runner.dispatch).toHaveBeenCalledWith(
                expect.any(Buffer),
                '123'
            );
            expect(withTimeout).toHaveBeenCalled();
        });
    });

    describe('prepareTestCodeWithContext', () => {
        test('should prefix code with __XJET context', () => {
            const result = (service as any).prepareTestCodeWithContext('console.log(1)', {
                a: 1, runtime: { path: 'src/index.spec.ts' }
            });
            expect(result).toMatch(/__dirname=\"src\";__filename=\"src\/index.spec.ts\";globalThis.__XJET =/);
            expect(result).toContain('console.log(1)');
        });
    });
});
