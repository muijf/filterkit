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

describe("filterByPath", () => {
  // Direct path tests
  test("filters by direct path", () => {
    const result = filter(obj, "amber");
    expect(result).toEqual({ amber: obj.amber });
  });

  test("filters by nested direct path", () => {
    const result = filter(obj, "amber.dark");
    expect(result).toEqual({ amber: { dark: obj.amber.dark } });
  });

  test("filters by deeply nested direct path", () => {
    const result = filter(obj, "amber.dark.p3");
    expect(result).toEqual({ amber: { dark: { p3: obj.amber.dark.p3 } } });
  });

  test("filters by path to primitive value", () => {
    const result = filter(obj, "amber.dark.1");
    expect(result).toEqual({ amber: { dark: { 1: "value" } } });
  });

  // Single wildcard tests
  test("filters by top-level single wildcard", () => {
    const result = filter(obj, "*");
    // Should return all top-level keys with empty objects
    expect(Object.keys(result)).toEqual(["amber", "blue", "black", "white"]);
    // Values should be empty objects
    expect(result.amber).toEqual({});
    expect(result.blue).toEqual({});
    expect(result.black).toEqual({});
    expect(result.white).toEqual({});
  });

  test("filters by nested single wildcard", () => {
    const result = filter(obj, "amber.*");
    // Should return all keys under amber with empty objects
    expect(Object.keys(result.amber)).toEqual(["1", "a", "p3", "dark"]);
    // Object values should be empty objects
    expect(result.amber.a).toEqual({});
    expect(result.amber.p3).toEqual({});
    expect(result.amber.dark).toEqual({});
  });

  test("filters by single wildcard with specific key", () => {
    const result = filter(obj, "*.dark");
    // Should return amber and blue with dark key
    expect(Object.keys(result)).toEqual(["amber", "blue"]);
    expect(result.amber.dark).toEqual({});
    expect(result.blue.dark).toEqual({});
  });

  test("filters by single wildcard in middle of path", () => {
    const result = filter(obj, "amber.*.a");
    // Should return p3 and dark with a key
    expect(Object.keys(result.amber)).toEqual(["p3", "dark"]);
    expect(result.amber.p3.a).toEqual({});
    expect(result.amber.dark.a).toEqual({});
  });

  // Double wildcard tests
  test("filters by top-level double wildcard", () => {
    const result = filter(obj, "**");
    // Should return the entire object
    expect(result).toEqual(obj);
  });

  test("filters by double wildcard with specific key", () => {
    const result = filter(obj, "**.a");
    // Should find all 'a' keys at any level
    expect(Object.keys(result)).toEqual(["amber", "blue", "black", "white"]);
    expect(result.amber.a).toBeDefined();
    expect(result.amber.p3.a).toBeDefined();
    expect(result.amber.dark.a).toBeDefined();
    expect(result.amber.dark.p3.a).toBeDefined();
  });

  test("filters by double wildcard with specific nested key", () => {
    const result = filter(obj, "**.a.1");
    // Should find all 'a.1' paths at any level
    expect(Object.keys(result)).toEqual(["amber", "blue", "black", "white"]);
    expect(result.amber.a[1]).toBeDefined();
    expect(result.amber.p3.a[1]).toBeDefined();
    expect(result.amber.dark.a[1]).toBeDefined();
    expect(result.amber.dark.p3.a[1]).toBeDefined();
  });

  test("filters by double wildcard with depth limit", () => {
    const result = filter(obj, "amber.**", 2);
    // Should only include paths up to depth 2 under amber
    expect(Object.keys(result.amber)).toEqual(["1", "a", "p3", "dark"]);
    expect(result.amber.a[1]).toBeDefined();
    expect(result.amber.p3[1]).toBeDefined();
    expect(result.amber.dark[1]).toBeDefined();
    // But not deeper paths
    expect(result.amber.dark.p3).toBeUndefined();
  });

  // Bracket notation tests
  test("filters by bracket notation with single key", () => {
    const result = filter(obj, "[amber]");
    expect(result).toEqual({ amber: obj.amber });
  });

  test("filters by bracket notation with multiple keys", () => {
    const result = filter(obj, "[amber|blue]");
    expect(result).toEqual({
      amber: obj.amber,
      blue: obj.blue,
    });
  });

  test("filters by nested bracket notation", () => {
    const result = filter(obj, "[amber|blue].dark");
    expect(result).toEqual({
      amber: { dark: obj.amber.dark },
      blue: { dark: obj.blue.dark },
    });
  });

  // Combined patterns
  test("filters by bracket notation with wildcard", () => {
    const result = filter(obj, "[amber|blue].*");
    expect(Object.keys(result)).toEqual(["amber", "blue"]);
    // All immediate children should be empty objects
    expect(result.amber[1]).toEqual({});
    expect(result.amber.a).toEqual({});
    expect(result.blue.a).toEqual({});
    expect(result.blue.dark).toEqual({});
  });

  test("filters by complex nested path with wildcards", () => {
    const result = filter(obj, "**.dark.*.a.1");
    // Should find all paths matching dark.*.a.1
    expect(Object.keys(result)).toEqual(["amber", "blue"]);
    expect(result.amber.dark.p3.a[1]).toBeDefined();
    expect(result.blue.dark.p3.a[1]).toBeDefined();
  });
});
