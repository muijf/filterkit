import { filter } from "../src";
import { expect, describe, test } from "vitest";

const obj = {
  amber: {
    1: "value",
    a: {
      1: "value",
    },
    p3: {
      1: "value",
      a: {
        1: "value",
      },
    },
    dark: {
      1: "value",
      a: {
        1: "value",
      },
      p3: {
        1: "value",
        a: {
          1: "value",
        },
      },
    },
  },
  blue: {
    a: {
      1: "value",
    },
    dark: {
      1: "value",
      a: {
        1: "value",
      },
      p3: {
        1: "value",
        a: {
          1: "value",
        },
      },
    },
    p3: {
      1: "value",
      a: {
        1: "value",
      },
    },
  },
  black: {
    1: "value",
    a: {
      1: "value",
    },
    p3: {
      1: "value",
      a: {
        1: "value",
      },
    },
  },
  white: {
    1: "value",
    a: {
      1: "value",
    },
    p3: {
      1: "value",
      a: {
        1: "value",
      },
    },
  },
};

console.log(filter(obj, "[blue|amber].dark"));
