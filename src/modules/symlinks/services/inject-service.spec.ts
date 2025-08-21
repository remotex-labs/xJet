import { inject, Injectable } from '@symlinks/services/inject.service';

/**
 * Tests
 */

describe('Dependency Injection', () => {
    test('should throw if trying to inject a class not marked as @Injectable', () => {
        class NotInjectable {}

        expect(() => inject(NotInjectable)).toThrow(
            /Cannot inject NotInjectable/
        );
    });

    test('should create a new instance each time (default transient)', () => {
        @Injectable()
        class TransientService {
            id = Math.random();
        }

        const instance1 = inject(TransientService);
        const instance2 = inject(TransientService);

        expect(instance1).not.toBe(instance2);
        expect(instance1).toBeInstanceOf(TransientService);
        expect(instance2).toBeInstanceOf(TransientService);
    });

    test('should return the same instance for singleton scope', () => {
        @Injectable({ scope: 'singleton' })
        class SingletonService {
            id = Math.random();
        }

        const instance1 = inject(SingletonService);
        const instance2 = inject(SingletonService);

        expect(instance1).toBe(instance2);
        expect(instance1).toBeInstanceOf(SingletonService);
    });

    test('should use the factory function when provided', () => {
        class FactoryProduct {
            constructor(public value: string) {}
        }

        @Injectable({
            factory: () => new FactoryProduct('from-factory')
        })
        class FactoryService {}

        const instance = inject(FactoryService) as FactoryProduct;

        expect(instance).toBeInstanceOf(FactoryProduct);
        expect(instance.value).toBe('from-factory');
    });

    test('should pass constructor arguments when resolving', () => {
        @Injectable()
        class ServiceWithArgs {
            constructor(public name: string, public age: number) {}
        }

        const instance = inject(ServiceWithArgs, 'Alice', 30);

        expect(instance.name).toBe('Alice');
        expect(instance.age).toBe(30);
    });

    test('should pass arguments to factory function', () => {
        class FactoryProduct {
            constructor(public message: string) {}
        }

        @Injectable({
            factory: (msg: string) => new FactoryProduct(msg)
        })
        class ArgFactoryService {}

        const instance = inject<unknown, unknown[]>(ArgFactoryService, 'hello world') as FactoryProduct;

        expect(instance.message).toBe('hello world');
    });
});
