<img src="https://github.com/muijf/pathkit/blob/main/.github/banner.png?raw=true">

<p align="center">
  <a href="https://docs.muijf.com/pathkit">Docs</a>
</p>

# Installation

```bash
npm install @pathkit/object
```

# Usage

## Filter

```ts
import { filter } from "@pathkit/object";

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
