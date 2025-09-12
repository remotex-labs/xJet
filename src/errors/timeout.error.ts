export class TimeoutError extends Error {
    constructor(timeout: number, at: string, stack: string = '') {
        super(`Exceeded timeout of ${ timeout } ms at ${ at }`);

        // Ensure a correct prototype chain (important for `instanceof`)
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'xJetTimeoutError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }

        this.name = 'xJetFailingError';
        if(stack) {
            this.stack = `${ this.name }: ${ this.message }\n${ stack }`;
        }
    }
}
