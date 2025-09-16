/**
 * Imports
 */

import { headerSchema } from '@packets/schema/packet.schema';
import { decodePacket, encodePacket } from '@packets/packets.module';
import { PacketKind } from '@packets/constants/packet-schema.constants';
import { PacketSchemas } from '@packets/constants/packet-schema.constants';

/**
 * Mock dependencies
 */

jest.mock('@packets/schema/packet.schema', () => ({
    headerSchema: {
        size: 10,
        toBuffer: jest.fn(() => Buffer.from('header')),
        toObject: jest.fn((buffer: Buffer, cb: (offset: number) => void) => {
            cb(0);

            return { kind: 1, suiteId: 'suite', runnerId: 'runner', timestamp: '2023-01-01T00:00:00Z' };
        })
    }
}));

jest.mock('@packets/constants/packet-schema.constants', () => ({
    PacketKind: {
        Log: 1
    },
    PacketSchemas: {
        1: {
            toBuffer: jest.fn(() => Buffer.from('payload')),
            toObject: jest.fn(() => ({ message: 'hello world' }))
        }
    }
}));

/**
 * Tests
 */

describe('encodePacket', () => {
    test('should encode packet with header and payload', () => {
        const result = encodePacket(PacketKind.Log, { message: 'hello world' });
        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result.toString()).toContain('header');
        expect(result.toString()).toContain('payload');

        // check mocks were called
        expect(headerSchema.toBuffer).toHaveBeenCalled();
        expect(PacketSchemas[PacketKind.Log].toBuffer).toHaveBeenCalledWith({ message: 'hello world' });
    });

    test('should throw error for invalid kind', () => {
        expect(() => encodePacket(<any> 5, {})).toThrow('Invalid schema kind');
    });
});

describe('decodePacket', () => {
    test('should decode buffer into header + payload object', () => {
        const fakeBuffer = Buffer.from('somebuffer');
        const result = decodePacket(fakeBuffer);
        expect(result).toEqual(
            expect.objectContaining({
                kind: 1,
                suiteId: 'suite',
                runnerId: 'runner',
                timestamp: expect.any(String),
                message: 'hello world'
            })
        );

        // check mocks
        expect(headerSchema.toObject).toHaveBeenCalled();
        expect(PacketSchemas[PacketKind.Log].toObject).toHaveBeenCalled();
    });

    test('should throw error for unknown packet kind', () => {
        (headerSchema.toObject as jest.Mock).mockReturnValueOnce({
            kind: 'UnknownKind'
        });

        const fakeBuffer = Buffer.from('anotherbuffer');
        expect(() => decodePacket(fakeBuffer)).toThrow('Unknown packet kind');
    });
});
