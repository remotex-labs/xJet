# Creating a Custom TCP Runner for xJet

You can extend xJet to run tests on remote environments or separate processes using a custom runner over TCP.
This approach lets you offload test execution to an external service, a different machine, or even a container,
while keeping the xJet orchestration and reporting features.
This guide walks you through building a TCP-based test runner with an example client (runner) and server in JavaScript/TypeScript.

## Key Concepts

- **TestRunnerInterface**: To be compatible, your runner must implement the `TestRunnerInterface`.
    This defines methods for connecting (`connect`), dispatching test suites (`dispatch`), and (optionally) disconnecting.
- **Communication Protocol**: All communication over TCP is done using a length-prefixed binary protocol. Each message is prepended with a 4-byte big-endian integer indicating the message length.
- **Global Dispatch**: Your runner environment must expose a global `dispatch` function, which test code uses to send messages (e.g., test results, logs) back to the xJet process.

## Architecture

- **Client Side (“Runner”):**
  - Is instantiated by xJet as part of your config’s `testRunners` array.
  - Connects to a TCP server (host/port), identifies itself, and waits for test suites to execute.
  - Sends the test suite code plus a `suiteId` to the server.
  - Handles all messages received from the server.

- **Server Side:**
  - Listens for incoming TCP connections from any runner client(s).
  - On receiving code to execute, runs it safely (e.g., in a Node.js VM).
  - Exposes a `dispatch` function in the sandbox, allowing code to send test results or messages back to the client.

## Step 1: Implement the TCP Client (“Runner”)

Create a class implementing `TestRunnerInterface`. This class connects to your TCP server, sends test suites for execution,
and receives messages (such as test results).

Essential points:

- Test suites are sent as single messages: the payload includes test suite code with a trailing `suiteId` for identification in case of execute error.
- All messages sent and received use a 4-byte big-endian length prefix.
- Handles partial/incomplete messages (buffering until a complete message is available).

**Responsibilities:**

- Manage a single TCP connection.
- Provide `connect`, `dispatch`, and `disconnect` methods.

```ts
// client.provider.ts
/**
 * Import will remove at compile time
 */

import type { TestRunnerInterface } from '@remotex-labs/xjet';

/**
 * Imports
 */

import * as net from 'net';

/**
 * ClientProvider handles TCP communication with a server using a length-prefixed protocol
 * and implements the TestRunnerInterface for xJet test execution.
 *
 * @remarks
 * - Manages a single TCP connection to the server.
 * - Provides methods to connect, dispatch test suites, and disconnect cleanly.
 * - Processes incoming messages in a length-prefixed manner.
 */

export class ClientProvider implements TestRunnerInterface {
/**
* Timeout for dispatch operations in milliseconds.
* A value of `-1` means no timeout is applied
*/

    dispatchTimeout = -1; // no timeout
    connectionTimeout = -1; // no timeout

    private socket: net.Socket | null = null;
    private isConnected = false;
    private receiveBuffer: Buffer = Buffer.alloc(0);
    private currentMessageLength: number | null = null;
    private onMessageReceived: (data: Buffer) => void;

    /**
     * Creates a new ClientProvider instance.
     *
     * @param name - The name of the test runner.
     * @param host - The server hostname or IP address. Defaults to `'localhost'`.
     * @param port - The server TCP port. Defaults to `3000`.
     *
     * @remarks
     * - Initializes the internal message callback as a no-op.
     * - Use `connect` to establish the TCP connection and provide a real message handler.
     */

    constructor(public name: string, private host = 'localhost', private port = 3000) {
        this.onMessageReceived = (): void => {};
    }

    /**
     * Establishes a TCP connection to the server and sets up message handling.
     *
     * @param messageCallback - Callback invoked for each complete message received from the server.
     * @param clientId - Unique identifier for this client, sent immediately after connection.
     *
     * @returns A promise that resolves when the connection is successfully established.
     *
     * @remarks
     * - Incoming messages are handled using a length-prefixed protocol (4-byte big-endian).
     * - The `messageCallback` will be invoked asynchronously for each complete message.
     * - The promise rejects if there is a connection error.
     * - After connecting, the client is marked as `isConnected = true`.
     *
     */

    async connect(messageCallback: (data: Buffer) => void, clientId: string): Promise<void> {
        this.onMessageReceived = messageCallback;

        return new Promise((resolve, reject) => {
            this.socket = net.createConnection({ host: this.host, port: this.port }, () => {
                this.isConnected = true;
                // Send client ID immediately
                this.socket!.write(Buffer.from(clientId));
                resolve();
            });

            this.socket.on('data', (chunk: Buffer) => {
                this.receiveBuffer = Buffer.concat([ this.receiveBuffer, chunk ]);
                this.processMessages();
            });

            this.socket.on('end', () => {
                this.isConnected = false;
            });

            this.socket.on('error', (err: Error) => {
                reject(err);
            });
        });
    }

    /**
     * Dispatches a test suite to the server for execution.
     *
     * @param suite - A buffer containing the serialized test suite data.
     * @param suiteId - A unique identifier for the test suite.
     *
     * @returns A promise that resolves immediately after sending the message.
     *
     * @remarks
     * - The suite data is converted to a UTF-8 string and sent with a length-prefixed protocol.
     * - This method does not wait for a server response; it only ensures the message is written to the socket.
     */

    dispatch(suite: Buffer, suiteId: string): void {
        this.sendMessage(suite.toString() + suiteId);
    }

    disconnect(): void {
        if (this.socket && this.isConnected) {
            this.socket.destroy();
            this.socket = null;
            this.isConnected = false;
        }
    }

    /**
     * Sends a length-prefixed message to the server over the TCP connection.
     *
     * @param messageContent - The message content as a UTF-8 string.
     *
     * @throws Will throw an `Error` if the socket is not connected.
     *
     * @remarks
     * - Prepends a 4-byte big-endian header to indicate the message length.
     * - Intended for internal use by methods like `dispatch`.
     */

    private sendMessage(messageContent: string): void {
        if (!this.socket || !this.isConnected) {
            throw new Error('Cannot send message: Not connected to server');
        }

        const contentBuffer = Buffer.from(messageContent, 'utf8');
        const headerBuffer = Buffer.alloc(4);
        headerBuffer.writeUInt32BE(contentBuffer.length, 0);

        this.socket.write(Buffer.concat([ headerBuffer, contentBuffer ]));
    }

    /**
     * Processes the accumulated receive buffer to extract complete messages.
     *
     * @remarks
     * - Messages are expected to use a 4-byte big-endian length prefix.
     * - This method will extract and emit all complete messages currently in the buffer.
     * - Partial messages are left in the buffer until more data arrives.
     * - Each complete message triggers the `onMessageReceived` callback.
     *
     * @private
     */

    private processMessages(): void {
        while (this.receiveBuffer.length > 0) {
            if (this.currentMessageLength === null) {
                if (this.receiveBuffer.length < 4)
                    return;

                this.currentMessageLength = this.receiveBuffer.readUInt32BE(0);
                this.receiveBuffer = this.receiveBuffer.subarray(4);
            }

            if (this.receiveBuffer.length < this.currentMessageLength)
                return;

            const message = this.receiveBuffer.subarray(0, this.currentMessageLength);
            this.receiveBuffer = this.receiveBuffer.subarray(this.currentMessageLength);
            this.currentMessageLength = null;

            this.onMessageReceived(message);
        }
    }
}
```

## Step 2: Set Up the TCP Server

The server receives test suite code and the suite identifier,
executes the code in a sandbox (using Node.js `vm` module), and forwards messages or results back to xJet using the connection.

Essential server features:

- Handles multiple simultaneous clients if needed.
- Buffers incoming data and reconstructs complete messages using the 4-byte length header.
- Extracts code and suite ID, then executes code using the Node.js VM.
- In the execution context, **global `dispatch(data)`** is available. Your test code should use this function to report test events/results across the TCP connection.

```js
// server.js
/**
 * Imports
 */

import * as net from 'net';
import { createRequire } from 'module';
import { Script, createContext } from 'vm';
import { encodeErrorSchema } from '@remotex-labs/xjet';

/**
 * Server configuration constants
 */

const CONFIG = {
    PORT: 3000,
    HEADER_SIZE: 4,
    RUNNER_ID_LENGTH: 14
};


/**
 * Executes JavaScript code safely in a sandboxed VM context.
 *
 * @param code - The JavaScript code to execute.
 * @param context - Objects/functions to expose in the sandbox.
 * @returns The result of the executed code.
 *
 * @remarks
 * - Uses Node.js `vm.Script` and `vm.createContext` to isolate execution.
 * - Execution respects `breakOnSigint` and disables automatic error display.
 */

async function executeInSandbox(code, context = {}) {
    const script = new Script(code);
    const vmContext = createContext(context);

    return script.runInContext(vmContext, { breakOnSigint: true, displayErrors: false });
}

/**
 * Wraps data in a 4-byte length prefix for TCP transmission.
 *
 * @param data - The string or Buffer to send.
 * @returns A new Buffer with a 4-byte length prefix followed by the payload.
 *
 * @remarks
 * - The length prefix is encoded as a big-endian 32-bit unsigned integer.
 * - If the input is a string, it is converted to a UTF-8 Buffer.
 */

function createPrefixedMessage(data) {
    const buffer = typeof data === 'string' ? Buffer.from(data) : data;
    const header = Buffer.alloc(CONFIG.HEADER_SIZE);
    header.writeUInt32BE(buffer.length, 0);

    return Buffer.concat([ header, buffer ]);
}

/**
 * Sends a length-prefixed message to a TCP socket.
 *
 * @param socket - The target TCP socket to send data through.
 * @param data - The string or Buffer to send.
 *
 * @remarks
 * - The message is automatically wrapped with a 4-byte big-endian length prefix.
 */

function sendData(socket, data) {
    socket.write(createPrefixedMessage(data));
}

/**
 * Executes JavaScript code in a sandboxed VM context with a communication channel.
 *
 * @param code - The JavaScript code to execute.
 * @param socket - The TCP socket used to send messages back to the client.
 * @param suiteId - Identifier of the test suite, used for dispatch messages.
 *
 * @remarks
 * - Exposes `Buffer`, `console`, `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`,
 *   `require`, and `module` inside the sandbox.
 * - Provides a `dispatch(data)` function in the sandbox to send messages back through the socket.
 * - Uses `executeInSandbox` to run the code safely in a VM context.
 */

async function executeSandboxedCode(code, socket, suiteId) {
const require = createRequire(import.meta.url);
const module = { exports: {} };

    const sandbox = {
        Buffer,
        module,
        require,
        console,
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        dispatch: (data) => sendData(socket, data)
    };

    await executeInSandbox(code, sandbox);
}

/**
* Handles a single TCP client connection.
*
* @param socket - The TCP socket representing the client connection.
*
* @remarks
* - Reads the runner ID from the first message received from the client.
* - Buffers incoming data and processes length-prefixed messages.
* - Extracts code and suite ID from each message and executes the code in a sandbox.
* - Sends any execution errors back to the client using `encodeErrorSchema`.
* - Logs client connections, disconnections, and socket errors to the console.
    */

function handleClient(socket) {
const clientInfo = `${ socket.remoteAddress }:${ socket.remotePort }`;
console.log('Client connected:', clientInfo);

    let runnerId = '';
    let isFirstMessage = true;
    let buffer = Buffer.alloc(0);
    let expectedLength = null;

    socket.on('data', async (chunk) => {
        if (isFirstMessage) {
            runnerId = chunk.subarray(0, CONFIG.RUNNER_ID_LENGTH).toString();
            isFirstMessage = false;
            chunk = chunk.subarray(CONFIG.RUNNER_ID_LENGTH);
        }

        buffer = Buffer.concat([ buffer, chunk ]);

        while (buffer.length >= CONFIG.HEADER_SIZE) {
            if (expectedLength === null) {
                expectedLength = buffer.readUInt32BE(0);
                buffer = buffer.slice(CONFIG.HEADER_SIZE);
            }

            if (buffer.length < expectedLength) break;

            const message = buffer.slice(0, expectedLength);
            buffer = buffer.slice(expectedLength);
            expectedLength = null;

            const suiteIdStart = message.length - CONFIG.RUNNER_ID_LENGTH;
            const code = message.subarray(0, suiteIdStart).toString();
            const suiteId = message.subarray(suiteIdStart).toString();

            try {
                await executeSandboxedCode(code, socket, suiteId);
            } catch (err) {
                const errorMsg = encodeErrorSchema(err, suiteId, runnerId);
                sendData(socket, errorMsg);
            }
        }
    });

    socket.on('close', () => console.log(`Client disconnected: ${ clientInfo }`));
    socket.on('error', (err) => console.error(`Socket error for ${ clientInfo }:`, err));
}

/**
* Starts a TCP server and listens for client connections.
*
* @param port - The TCP port number to listen on. Defaults to `CONFIG.PORT`.
* @returns The created TCP server instance.
*
* @remarks
* - Uses `handleClient` to manage all incoming client connections.
* - Logs a message to the console when the server starts listening.
* - Each connected client is handled asynchronously and can execute sandboxed code.
    */

function startTcpServer(port = CONFIG.PORT) {
const server = net.createServer(handleClient);
server.listen(port, () => console.log(`TCP server listening on port ${ port }`));

    return server;
}

// Start the server
startTcpServer();
```

## Step 3: set xJet config

```ts
/**
 * Import will remove at compile time
 */

import type { xJetConfig } from '@remotex-labs/xjet';

/**
 * Imports
 */

import { ClientProvider } from './client.provider';

/**
 * Config
 */

export default {
    parallel: 3,
    testRunners: [ new ClientProvider('Node'), new ClientProvider('Node2') ],
    build: {
        platform: 'node' // to support node in the tests imports like (`fs`, `path` ...) 
    }
} as xJetConfig;
```

## When to Use This Pattern

- Running tests on remote machines, in containers, or inside a specialized test infrastructure.
- Integrating with custom test environments where Node’s built-in VM isolation suffices for running potentially untrusted test code.
- Extending xJet to support distributed, scalable, or multi-platform test execution.
