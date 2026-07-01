---
name: 🐞 Bug Report
title: 🐞 Bug Report
about: Something is broken
labels: [ "bug", "needs triage" ]
---

**Describe the bug**

A clear and concise description of what is wrong.

**Reproduction**

A minimal test and the code that triggers the problem.

```ts
// example.test.ts
describe('Example', () => {
    test('reproduces the issue', () => {
        const result = 1 + 2;
        expect(result).toBe(3);
    });
});
```

**Expected behavior**

What you expected to happen.

**Actual behavior**

What actually happened. Include the full error message and stack trace if there is one.

```text
Error: ...
    at ...
```

**Environment**

|                                 | |
|---------------------------------|-|
| `@remotex-labs/xjet` version    | |
| Node.js version                 | |
| TypeScript version              | |
| OS                              | |

**Checklist**

- [ ] I have searched for existing issues, and this is not a duplicate.
- [ ] I am using the latest published version.
- [ ] I have included a minimal reproduction above.
