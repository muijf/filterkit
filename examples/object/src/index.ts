import { filter } from "@filterkit/object";

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

const filtered = filter(obj, "amber.dark");

console.dir(filtered, { depth: null });
