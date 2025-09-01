#!/usr/bin/env node

interface User {
    id: number;
    name: string;
}

interface Product {
    id: number;
    price: number;
}

// Map numeric "type" to interface
type TypeMap = {
    1: User;
    2: Product;
};

// Function where `type` is number
function xxx<T extends keyof TypeMap>(type: T, data: TypeMap[T]) {
    console.log(type, data);
}

xxx(3, 'asdasd');


// Union of all possible return values
type DecodeResult = {
    [K in keyof TypeMap]: { type: K; data: TypeMap[K] }
}[keyof TypeMap];

// Decoder function
function decode(buffer: Buffer): DecodeResult {
    const type = buffer.readUInt8(0) as keyof TypeMap; // assume first byte is type

    switch (type) {
        case 1: {
            // Fake decode logic
            const user: User = { id: 123, name: "Alice" };
            return { type, data: user };
        }
        case 2: {
            const product: Product = { id: 42, price: 9.99 };
            return { type, data: product };
        }
        default:
            throw new Error(`Unknown type ${type}`);
    }
}
