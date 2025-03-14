# Installation

```bash
npm install @filterkit/object
```

# Usage

## Filter

```ts
import { filter } from "@filterkit/object";

const obj = {
  hello: {
    world: {
      text: "Hello World",
    },
    test: "test",
  },
  world: {
    hello: {
      text: "Hello World",
    },
  },
};

filter(obj, "hello.world", {
  separator: ".",
  wildcard: "*",
  shallow: false,
});

// { hello: { world: { text: "Hello World" } } }

filter(obj, "hello.world", {
  separator: ".",
  wildcard: "*",
  shallow: true,
});

// { hello: { world: {} } }

filter(obj, ["hello", ["world", { shallow: false }]], {
  separator: ".",
  wildcard: "*",
  shallow: true,
});

// { hello: { }, world: { hello: { text: "Hello World" } } }
```
