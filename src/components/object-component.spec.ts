/**
 * Imports
 */

import { encodeJSON, decodeJSON } from '@components/object.component';

/**
 * Tests
 */

describe('encodeJSON', () => {
    test('encodes a bigint as a tagged object', () => {
        expect(encodeJSON(42n)).toBe('{"BigInt":"42"}');
    });

    test('encodes a bigint property without precision loss', () => {
        expect(encodeJSON({ id: 9007199254740993n })).toBe('{"id":{"BigInt":"9007199254740993"}}');
    });

    test('passes non-bigint values through unchanged', () => {
        expect(encodeJSON({ name: 'jet', count: 3, ok: true })).toBe('{"name":"jet","count":3,"ok":true}');
    });

    test('encodes bigints nested in arrays', () => {
        expect(encodeJSON([ 1n, 2n ])).toBe('[{"BigInt":"1"},{"BigInt":"2"}]');
    });
});

describe('decodeJSON', () => {
    test('revives a tagged object back into a bigint', () => {
        expect(decodeJSON('{"BigInt":"42"}')).toBe(42n);
    });

    test('revives a bigint property without precision loss', () => {
        expect(decodeJSON('{"id":{"BigInt":"9007199254740993"}}')).toEqual({ id: 9007199254740993n });
    });

    test('passes non-tagged values through unchanged', () => {
        expect(decodeJSON('{"name":"jet","count":3,"ok":true}')).toEqual({ name: 'jet', count: 3, ok: true });
    });
});

describe('encodeJSON <-> decodeJSON', () => {
    test('round-trips a value containing bigints', () => {
        const value = { id: 9007199254740993n, tags: [ 1n, 2n ], name: 'jet' };

        expect(decodeJSON(encodeJSON(value))).toEqual(value);
    });
});
