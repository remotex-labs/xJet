# xJet

[![npm version](https://img.shields.io/badge/Documentation-orange?logo=typescript&logoColor=f5f5f5)](https://remotex-labs.github.io/xJet/)
[![npm version](https://img.shields.io/npm/v/@remotex-labs/xjet.svg)](https://www.npmjs.com/package/@remotex-labs/xjet)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![Node.js CI](https://github.com/remotex-labs/xJet/actions/workflows/node.js.yml/badge.svg)](https://github.com/remotex-labs/xJet/actions/workflows/node.js.yml)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/remotex-labs/xJet)

## Overview

xJet is a powerful, flexible testing framework for JavaScript and TypeScript applications.
Its mission is to help you "Run Automated Tests Anywhere, Effortlessly."

## Features

- **Familiar API**: Uses a Jest-like interface with `describe`, `it`, `test`, and `expect` functions
- **Powerful Mocking**: Complete suite of mocking utilities including `fn`, `mock`, and `spyOn`
- **CLI Options**: Configurable through command-line arguments
- **Multiple Reporters**: Support for different output formats including human-readable, JSON, and JUnit XML
- **TypeScript Support**: First-class TypeScript support with type definitions included

## Installation

```bash
npm install @remotex-labs/xjet
```

## 🚀 Quick Start

Create a test file and start writing tests immediately:

```ts
// example.test.ts 
describe('Calculator', () => { 
    test('should add two numbers correctly', () => { 
        const result = 1 + 2; expect(result).toBe(3); 
    });

    it('should subtract two numbers correctly', () => { 
        const result = 5 - 2; expect(result).toBe(3); 
    }); 
});
```

## 📚 Documentation

For comprehensive guides and reference, check our [documentation](https://remotex-labs.github.io/xJet/):

- [CLI Options](https://remotex-labs.github.io/xJet/configuration/cli)
- [Test Structure](https://remotex-labs.github.io/xJet/tests/test)
- [Mocking APIs](https://remotex-labs.github.io/xJet/mocks/mock)
- [Timer Manipulation](https://remotex-labs.github.io/xJet/mocks/timer)
- [Matchers Reference](https://remotex-labs.github.io/xJet/xjet-expect/equality)

Run:

![Run](./docs/public/images/run.png)

![Run](./docs/public/images/run1.png)

![Run](./docs/public/images/run2.png)

## Documentation

For complete API documentation, examples, and guides, visit: [xJet Documentation](https://remotex-labs.github.io/xJet/)

## 🔍 Compatibility

- Node.js 20+
- All modern browsers (via bundlers)
- TypeScript 4.5+

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE](LICENSE) file for details.

## 💖 Acknowledgements

- Built with TypeScript
- Inspired by testing frameworks like Jest and Mocha
- Powered by the esbuild ecosystem

Made with ❤️ by the remotex-labs/xJet team
