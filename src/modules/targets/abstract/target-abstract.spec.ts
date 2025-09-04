/**
 * Import will remove at compile time
 */

import type { RunnerInterface } from '@targets/target.module';

/**
 * Imports
 */

import { xJetError } from '@errors/xjet.error';
import { decodePacket } from '@packets/packets.module';
import { AbstractTarget } from '@targets/abstract/target.abstract';
import { PacketKind } from '@packets/constants/packet-schema.constants';

/**
 * Mock dependencies
 */

jest.mock('@packets/packets.module', () => ({
    decodePacket: jest.fn()
}));

jest.mock('@symlinks/services/inject.service', () => ({
    Injectable: jest.fn(),
    inject: jest.fn(() => ({
        getSourceMap: jest.fn(() => undefined)
    }))
}));

jest.mock('@services/framework.service', () => {
    return {
        FrameworkService: jest.fn().mockImplementation(() => ({
            setSource: jest.fn(),
            getSourceMap: jest.fn(),
            isFrameworkFile: jest.fn()
        }))
    };
});

/**
 * Class utils
 */

class MockQueueService {
    size = 0;
    stop = jest.fn();
    clear = jest.fn();
}

class TestTarget extends AbstractTarget {
    queue = new MockQueueService() as any;

    getRunners(): Array<RunnerInterface> {
        throw new Error('Method not implemented.');
    }

    async initTarget(): Promise<void> {
    }

    getRunnerName(runnerId: string): string {
        return `runner-${ runnerId }`;
    }

    async executeSuites(): Promise<void> {
    }
}

/**
 * Tests
 */

describe('AbstractTarget', () => {
    let target: TestTarget;

    beforeEach(() => {
        target = new TestTarget({ bail: true, parallel: 1 } as any);
        jest.clearAllMocks();
    });

    describe('completeSuite', () => {
        test('should resolve a running suite', () => {
            const resolve = jest.fn();
            const reject = jest.fn();
            target['runningSuites'].set('suite1', { resolve, reject } as any);

            target.completeSuite('suite1');

            expect(resolve).toHaveBeenCalled();
            expect(reject).not.toHaveBeenCalled();
            expect(target['runningSuites'].has('suite1')).toBe(false);
        });

        test('should reject suite and stop queue if hasError and bail=true', () => {
            const resolve = jest.fn();
            const reject = jest.fn();
            target['runningSuites'].set('suite1', { resolve, reject } as any);

            target.completeSuite('suite1', true);

            expect(reject).toHaveBeenCalled();
            expect(resolve).not.toHaveBeenCalled();
            expect(target.queue.stop).toHaveBeenCalled();
            expect(target.queue.clear).toHaveBeenCalled();
            expect(target['runningSuites'].has('suite1')).toBe(false);
        });

        test('should do nothing if suite not found', () => {
            expect(() => target.completeSuite('nonexistent')).not.toThrow();
        });
    });

    describe('dispatch', () => {
        const mockSource = { name: 'source' };

        beforeEach(() => {
            (<any> target).suites.set('suite1', mockSource as any);
        });

        test('should emit log event', () => {
            (decodePacket as jest.Mock).mockReturnValue({
                kind: PacketKind.Log,
                suiteId: 'suite1',
                runnerId: 'runner1'
            });
            const listener = jest.fn();
            target.on('log', listener);

            target['dispatch'](Buffer.from([]));

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({ kind: PacketKind.Log }), mockSource);
        });

        test('should emit error event and complete suite', () => {
            (decodePacket as jest.Mock).mockReturnValue({
                kind: PacketKind.Error,
                suiteId: 'suite1',
                runnerId: 'runner1'
            });
            const listener = jest.fn();
            target.on('error', listener);

            const resolve = jest.fn();
            const reject = jest.fn();
            target['runningSuites'].set('runner1suite1', { resolve, reject } as any);

            target['dispatch'](Buffer.from([]));

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({ kind: PacketKind.Error }), mockSource);
            expect(reject).toHaveBeenCalled();
        });

        test('should throw xJetError for unknown suite', () => {
            (decodePacket as jest.Mock).mockReturnValue({
                kind: PacketKind.Log,
                suiteId: 'unknown',
                runnerId: 'runner1'
            });

            expect(() => target['dispatch'](Buffer.from([]))).toThrow(xJetError);
        });

        test('should throw xJetError for invalid kind', () => {
            (decodePacket as jest.Mock).mockReturnValue({ kind: 999, suiteId: 'suite1', runnerId: 'runner1' });

            expect(() => target['dispatch'](Buffer.from([]))).toThrow(xJetError);
        });
    });

    describe('numberActiveTask', () => {
        test('should return current queue size', () => {
            target.queue.size = 5;
            expect(target.numberActiveTask).toBe(5);
        });
    });

    describe('generateId', () => {
        test('should generate a string of length 14', () => {
            const id = target['generateId']();
            expect(id).toHaveLength(14);
        });
    });
});
