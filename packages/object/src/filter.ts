import type { Infer, Matches, Options } from "./types";

/** Represents a plain object with any valid property key type */
type PlainObject = Record<PropertyKey, unknown>;

/**
 * Type guard to check if a value is a plain object
 * @param value - The value to check
 * @returns True if the value is a plain object, false otherwise
 */
function isPlainObject(value: unknown): value is PlainObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Deep clone a value
 * @template T - The type of value to clone
 * @param value - The value to clone
 * @returns A deep clone of the input value
 */
function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(deepClone) as T;
  if (!isPlainObject(value)) return value;

  return Object.entries(value).reduce((acc, [key, val]) => {
    acc[key] = deepClone(val);
    return acc;
  }, {} as PlainObject) as T;
}

/**
 * Deep merge two objects
 * @template T - The type of the target object
 * @template S - The type of the source object
 * @param target - The target object
 * @param source - The source object
 * @returns The merged object
 */
function deepMerge<T extends PlainObject, S extends PlainObject>(
  target: T,
  source: S
): T & S {
  const output = { ...target } as PlainObject;

  if (isPlainObject(target) && isPlainObject(source)) {
    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        isPlainObject(sourceValue) &&
        key in target &&
        isPlainObject(targetValue)
      ) {
        output[key] = deepMerge(
          targetValue as PlainObject,
          sourceValue as PlainObject
        );
      } else {
        output[key] = deepClone(sourceValue);
      }
    }
  }

  return output as T & S;
}

/**
 * Extract range information from a path string
 */
function extractRange(path: string): {
  path: string;
  range: number[] | null;
} {
  const regex = /(\d+)\.\.(\d+)/;
  const match = path.match(regex);

  if (!match) {
    return { path, range: null };
  }

  const [fullMatch, start, end] = match;
  const startNum = parseInt(start, 10);
  const endNum = parseInt(end, 10);

  // Generate the range of numbers
  const range = Array.from(
    { length: endNum - startNum + 1 },
    (_, i) => startNum + i
  );

  // Split the path at the range expression
  const [beforeRange, afterRange] = path.split(fullMatch);

  return {
    path: `${beforeRange}${fullMatch}${afterRange}`,
    range,
  };
}

/**
 * Expand a path with a range into multiple paths
 */
function expandRangePath(path: string): string[] {
  const { path: originalPath, range } = extractRange(path);

  if (!range) {
    return [path];
  }

  const regex = /(\d+)\.\.(\d+)/;
  const [beforeRange, afterRange] = originalPath.split(regex);

  return range.map((num) => `${beforeRange}${num}${afterRange}`);
}

/**
 * Filter an object by a single path (without range handling)
 * @param obj - The object to filter
 * @param path - The path to filter by
 * @param separator - The separator used in the path
 * @param wildcard - The wildcard character
 * @returns The filtered object
 * @throws Error if the path does not exist in the object
 */
function filterSinglePath(
  obj: unknown,
  path: string,
  separator: string,
  wildcard: string
): PlainObject {
  if (path === wildcard) {
    return isPlainObject(obj) ? { ...obj } : {};
  }

  if (!isPlainObject(obj)) {
    throw new Error(`Cannot filter non-object value`);
  }

  const parts = path.split(separator).filter(Boolean);
  const result: PlainObject = {};
  let current = result;
  let source = obj as PlainObject;

  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    const isLastKey = i === parts.length - 1;

    if (!(key in source)) {
      throw new Error(
        `Path "${path}" does not exist in the object. Key "${key}" not found.`
      );
    }

    if (isLastKey) {
      current[key] = deepClone(source[key]);
    } else {
      const next = source[key];
      if (!isPlainObject(next)) {
        throw new Error(
          `Cannot traverse through non-object value at key "${key}"`
        );
      }
      current[key] = {};
      current = current[key] as PlainObject;
      source = next;
    }
  }

  return result;
}

/**
 * Safely filter an object by a path, returning null if the path doesn't exist
 * @param obj - The object to filter
 * @param path - The path to filter by
 * @param separator - The separator used in the path
 * @param wildcard - The wildcard character
 * @returns The filtered object or null if the path doesn't exist
 */
function safeFilterSinglePath(
  obj: unknown,
  path: string,
  separator: string,
  wildcard: string
): PlainObject | null {
  try {
    return filterSinglePath(obj, path, separator, wildcard);
  } catch (error) {
    return null;
  }
}

/**
 * Filter an object to include specific paths
 * @template T - The type of the object to filter
 * @template M - The type of the matches
 * @template O - The type of the options
 * @param obj - The object to filter
 * @param matches - The paths to include
 * @param options - The options for filtering
 * @returns The filtered object
 */
export function filter<
  T extends object,
  M extends Matches<T, O>,
  O extends Options = Options,
>(obj: T, matches: M, options?: O): Infer<T, M, O> {
  const separator = options?.separator ?? ".";
  const wildcard = options?.wildcard ?? "*";

  // Handle wildcard directly
  if (matches === wildcard) {
    return filterSinglePath(obj, wildcard, separator, wildcard) as Infer<
      T,
      M,
      O
    >;
  }

  // Handle array of paths
  if (Array.isArray(matches)) {
    return matches.reduce(
      (acc, path) =>
        deepMerge(acc, filter(obj, path as any, options) as PlainObject),
      {} as PlainObject
    ) as Infer<T, M, O>;
  }

  // Handle path with range
  if (typeof matches === "string" && matches.includes("..")) {
    // Find the range expression in the path
    const regex = /(\d+)\.\.(\d+)/;
    const match = matches.match(regex);

    if (match) {
      const [fullMatch, start, end] = match;
      const startNum = parseInt(start, 10);
      const endNum = parseInt(end, 10);

      // Ensure start is less than end
      if (startNum >= endNum) {
        throw new Error(
          `Invalid range: ${startNum}..${endNum}. Start must be less than end.`
        );
      }

      // Create an array of numbers in the range
      const range = [];
      for (let i = startNum; i <= endNum; i++) {
        range.push(i);
      }

      // Split the path at the range expression
      const [beforeRange, afterRange] = matches.split(fullMatch);

      // Create a path for each number in the range
      const expandedPaths = range.map(
        (num) => `${beforeRange}${num}${afterRange}`
      );

      // Filter each path and merge the results
      return expandedPaths.reduce((acc, path) => {
        const filtered = safeFilterSinglePath(obj, path, separator, wildcard);
        if (filtered !== null) {
          return deepMerge(acc, filtered);
        }
        return acc;
      }, {} as PlainObject) as Infer<T, M, O>;
    }
  }

  // Handle single path without range
  return filterSinglePath(obj, matches, separator, wildcard) as Infer<T, M, O>;
}

const obj = {
  a: {
    b: {
      1: {
        c: 1,
      },
      2: {
        c: 2,
      },
      3: {
        c: 3,
      },
      4: {
        c: 4,
      },
      5: {
        c: 5,
      },
      6: {
        c: 6,
      },
      7: {
        c: 7,
      },
    },
  },
};

const t1 = filter(obj, "*");
const t2 = filter(obj, "a.b.1");
const t3 = filter(obj, "a.b.1..2");

type T1 = Infer<typeof obj, "*">;
type T2 = Infer<typeof obj, "a.b.1.c">;
type T3 = Infer<typeof obj, "a.b.2..3">;

console.dir(t1, { depth: null });
console.dir(t2, { depth: null });
console.dir(t3, { depth: null });
