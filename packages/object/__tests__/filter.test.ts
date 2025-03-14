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

    test("returns the entire object when wildcard is in array", () => {
      const result = filter(testObj, ["user.profile.name", "*"]);
      expect(result).toEqual(testObj);
    });

    test("returns the entire object when wildcard is in path options", () => {
      const result = filter(testObj, [
        "user.profile.name",
        ["*", { shallow: true }],
      ]);
      expect(result).toEqual(testObj);
    });
  });

  describe("shallow filtering", () => {
    test("shallow filters a single path", () => {
      const result = filter(testObj, "user.profile", { shallow: true });
      // Should have empty objects for nested properties
      expect(result).toEqual({
        user: {
          profile: {},
        },
      });
    });

    test("shallow filters with path options", () => {
      const result = filter(testObj, [
        "user.profile", // Uses global shallow: false
        ["user.settings", { shallow: true }], // Uses local shallow: true
      ]);

      // profile should have all properties, settings should be empty
      expect(result).toEqual({
        user: {
          profile: {
            name: "John Doe",
            age: 30,
            contact: {
              email: "john@example.com",
              phone: "123-456-7890",
            },
          },
          settings: {},
        },
      });
    });

    test("preserves arrays with shallow filtering", () => {
      const result = filter(testObj, "posts", { shallow: true });
      // Should preserve the array structure
      expect(result).toEqual({
        posts: testObj.posts,
      });
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

    test("filters with mixed path types", () => {
      const result = filter(testObj, [
        "user.profile.name",
        ["meta.version", { shallow: true }],
        ["comments.1", { shallow: false }],
      ]);

      expect(result).toEqual({
        user: {
          profile: {
            name: "John Doe",
          },
        },
        meta: {
          version: "1.0.0",
        },
        comments: {
          1: {
            text: "Great post!",
            author: "Jane",
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

    test("uses custom options in path options", () => {
      const result = filter(
        testObj,
        ["user.profile.name", ["user/settings/theme", { separator: "/" }]],
        {
          separator: ".",
        }
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
        filter(testObj, "user.nonexistent.path" as any);
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
