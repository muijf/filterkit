import { filter } from "../src";
import { describe, test, expect } from "vitest";

describe("filter function", () => {
  // Test object with nested structure
  const testObj = {
    user: {
      profile: {
        name: "John Doe",
        age: 30,
        contact: {
          email: "john@example.com",
          phone: "123-456-7890",
        },
      },
      settings: {
        theme: "dark",
        notifications: true,
      },
    },
    posts: [
      { id: 1, title: "First Post", content: "Hello World" },
      { id: 2, title: "Second Post", content: "Testing" },
    ],
    comments: {
      1: { text: "Great post!", author: "Jane" },
      2: { text: "Thanks for sharing", author: "Bob" },
    },
    meta: {
      version: "1.0.0",
      lastUpdated: "2023-01-01",
    },
  };

  describe("basic filtering", () => {
    test("filters a single path", () => {
      const result = filter(testObj, "user.profile.name");
      expect(result).toEqual({ user: { profile: { name: "John Doe" } } });
    });

    test("filters a nested path", () => {
      const result = filter(testObj, "user.profile.contact");
      expect(result).toEqual({
        user: {
          profile: {
            contact: {
              email: "john@example.com",
              phone: "123-456-7890",
            },
          },
        },
      });
    });

    test("filters a path with numeric key", () => {
      const result = filter(testObj, "comments.1");
      expect(result).toEqual({
        comments: {
          1: { text: "Great post!", author: "Jane" },
        },
      });
    });
  });

  describe("wildcard filtering", () => {
    test("returns the entire object with wildcard", () => {
      const result = filter(testObj, "*");
      expect(result).toEqual(testObj);
    });

    test("returns merged results for multiple paths", () => {
      const result = filter(testObj, ["user.profile.name", "*"]);
      expect(result).toEqual(testObj);
    });
  });

  describe("multiple paths filtering", () => {
    test("filters multiple paths", () => {
      const result = filter(testObj, ["user.profile.name", "meta.version"]);
      expect(result).toEqual({
        user: {
          profile: {
            name: "John Doe",
          },
        },
        meta: {
          version: "1.0.0",
        },
      });
    });

    test("merges multiple paths correctly", () => {
      const result = filter(testObj, [
        "user.profile.name",
        "user.profile.contact.email",
      ]);
      expect(result).toEqual({
        user: {
          profile: {
            name: "John Doe",
            contact: {
              email: "john@example.com",
            },
          },
        },
      });
    });
  });

  describe("custom options", () => {
    test("uses custom separator", () => {
      const result = filter(testObj, "user/profile/name", { separator: "/" });
      expect(result).toEqual({
        user: {
          profile: {
            name: "John Doe",
          },
        },
      });
    });

    test("uses custom wildcard", () => {
      const result = filter(testObj, "ALL", { wildcard: "ALL" });
      expect(result).toEqual(testObj);
    });

    test("uses global separator option", () => {
      const result = filter(
        testObj,
        ["user/profile/name", "user/settings/theme"],
        { separator: "/" }
      );

      expect(result).toEqual({
        user: {
          profile: {
            name: "John Doe",
          },
          settings: {
            theme: "dark",
          },
        },
      });
    });
  });

  describe("edge cases", () => {
    test("throws error for non-existent paths", () => {
      expect(() => {
        filter(testObj, "user.nonexistent.path");
      }).toThrow(
        'Path "user.nonexistent.path" does not exist in the object. Key "nonexistent" not found.'
      );
    });

    test("handles empty array of paths", () => {
      const result = filter(testObj, []);
      expect(result).toEqual({});
    });

    test("handles undefined values in path", () => {
      const objWithUndefined = {
        a: {
          b: undefined,
        },
      };

      const result = filter(objWithUndefined, "a.b");
      expect(result).toEqual({
        a: {
          b: undefined,
        },
      });
    });
  });
});
