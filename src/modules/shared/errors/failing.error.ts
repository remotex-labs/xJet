/**
 * Imports
 */

import { ExecutionError } from '@shared/errors/execution.error';


export class FailingError extends ExecutionError {


    constructor(stack: string) {
        super('Failing test passed even though it was supposed to fail. Remove `.failing` to remove error.');

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FailingError);
        }

        this.name = 'xJetFailingError';
        this.stack = `${ this.name }: ${ this.message }\n${ stack }`;
    }
}
