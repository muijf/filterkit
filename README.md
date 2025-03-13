<img src="https://github.com/muijf/path-matcher/blob/main/.github/banner.png?raw=true">

<p align="center">
  <a href="https://docs.muijf.com/path-matcher">Docs</a>
</p>

# Installation

```bash
npm install @path-matcher/core
```

# Usage

## Filter

```ts
import { filter } from "@path-matcher/core";

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

filter(obj, "*"); // { hello: {}, world: {} }
filter(obj, "**"); // { hello: { world: { text: "Hello World" } }, world: { hello: { text: "Hello World" } } }
filter(obj, "hello.world"); // { hello: { world: { text: "Hello World" } } }
filter(obj, "hello.*"); // { hello: { world: {} }
filter(obj, "hello.**"); // { hello: { world: { text: "Hello World" }, test: "test" } }
filter(obj, "[hello|world].*"); // { hello: { world: {} }, world: { hello: {} } }
filter(obj, "[hello|world].**"); // { hello: { world: { text: "Hello World" } }, world: { hello: { text: "Hello World" } } }
filter(obj, "hello.*.text"); // { hello: { world: { text: "Hello World" } } }
filter(obj, "hello.**.text"); // { hello: { world: { text: "Hello World" } } }
```
