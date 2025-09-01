import type { PacketHeaderInterface } from '@packets/schema/interfaces/packet-schema.interface';
import { Struct } from '@remotex-labs/xstruct';

export const headerSchema = new Struct<PacketHeaderInterface>({
    type: 'UInt8:4',
    kind: 'UInt8:4',
    suiteId: { type: 'string', size: 14 },
    runnerId: { type: 'string', size: 14 }
});

export const logSchema = new Struct<SchemaLogInterface>({
    level: 'UInt8',
    message: { type: 'string', lengthType: 'UInt32LE' },
    ancestry: { type: 'string', lengthType: 'UInt32LE' },
    invocation: invocationSchema
});

export const errorSchema = new Struct<SchemaErrorInterface>({
    error: { type: 'string', lengthType: 'UInt32LE' }
});

export const statusSchema = new Struct<SchemaStatusInterface>({
    ancestry: { type: 'string', lengthType: 'UInt32LE' },
    description: { type: 'string', lengthType: 'UInt32LE' }
});

export const resultSchema = new Struct<SchemaResultInterface>({
    todo: 'UInt8:1',
    passed: 'UInt8:2',
    skipped: 'UInt8:3',
    reserved: 'UInt8:5',
    duration: 'UInt32LE',
    error: { type: 'string', lengthType: 'UInt32LE' }
});
