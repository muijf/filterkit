import {
  deepClone,
  deepMerge,
  isPlainObject,
  type PlainObject,
  type IsObject,
  type NumericKeysOf,
  type ValidNumberRange,
  type LessThan,
  type MergeIntersection,
  type UnionToIntersection,
} from "@muijf/utils";

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
 * Filter namespace containing the function and related types
 */
export namespace filter {
  /**
   * Options for path operations
   */
  export type Options = {
    separator?: string;
    wildcard?: string;
  };

  /**
   * Default options for path operations
   */
  export type DefaultOptions = {
    separator: ".";
    wildcard: "*";
  };

  /**
   * Helper type to merge user options with defaults
   */
  type MergeOptions<O extends Options> = {
    separator: O extends { separator: infer Sep extends string } ? Sep : ".";
    wildcard: O extends { wildcard: infer W extends string } ? W : "*";
  };

  /**
   * Helper type to get all paths in an object
   */
  type ObjectPaths<T, O extends Options> = T extends object
    ? {
        [K in keyof T]: K extends string | number
          ?
              | `${K}`
              | (IsObject<T[K]> extends true
                  ? `${K}` | `${K}${O["separator"]}${ObjectPaths<T[K], O>}`
                  : never)
          : never;
      }[keyof T]
    : never;

  /**
   * Helper type to get all valid paths in an object with a specific separator
   */
  type GetPaths<T, Sep extends string> = T extends object
    ? {
        [K in keyof T]: K extends string | number
          ? T[K] extends object
            ? T[K] extends { [key: number]: any }
              ?
                  | `${K}`
                  | `${K}${Sep}${NumericKeysOf<T[K]>}`
                  | `${K}${Sep}${GetPaths<T[K], Sep>}`
                  | RangePathsFor<T[K], K, Sep>
                  | RangePathsWithPropertyFor<T[K], K, Sep>
              : `${K}` | `${K}${Sep}${GetPaths<T[K], Sep>}`
            : `${K}`
          : never;
      }[keyof T]
    : never;

  /**
   * Helper type to generate range paths for an object
   * Strictly ensures that N1 < N2 (first number is less than second)
   */
  type RangePathsFor<
    T extends { [key: number]: any },
    K extends string | number,
    Sep extends string,
  > = {
    [N1 in NumericKeysOf<T>]: {
      [N2 in NumericKeysOf<T>]: [N1, N2] extends [
        infer A extends number,
        infer B extends number,
      ]
        ? LessThan<A, B> extends true
          ? `${K}${Sep}${N1}..${N2}`
          : never
        : never;
    }[NumericKeysOf<T>];
  }[NumericKeysOf<T>];

  /**
   * Helper type to generate range paths with properties for an object
   * Explicitly ensures that N1 < N2 (first number is less than second)
   */
  type RangePathsWithPropertyFor<
    T extends { [key: number]: any },
    K extends string | number,
    Sep extends string,
  > = {
    [N1 in NumericKeysOf<T>]: {
      [N2 in NumericKeysOf<T>]: [N1, N2] extends [
        infer A extends number,
        infer B extends number,
      ]
        ? LessThan<A, B> extends true
          ? {
              [P in keyof T[N1] &
                keyof T[N2] &
                string]: `${K}${Sep}${N1}..${N2}${Sep}${P}`;
            }[keyof T[N1] & keyof T[N2] & string]
          : never
        : never;
    }[NumericKeysOf<T>];
  }[NumericKeysOf<T>];

  /**
   * Updated Matches type that relies on runtime validation for ranges
   */
  export type Matches<T, O extends Options = DefaultOptions> =
    | (O extends { separator: infer Sep extends string }
        ? GetPaths<T, Sep>
        : GetPaths<T, ".">)
    | (O extends { wildcard: infer W extends string } ? W : "*")
    | Array<
        O extends { separator: infer Sep extends string }
          ? GetPaths<T, Sep>
          : GetPaths<T, ".">
      >;

  /**
   * Match type to find all possible matches in an object based on settings
   */
  export type Match<T, O extends Options = DefaultOptions> = ObjectPaths<T, O>;

  /**
   * Helper type to build an object structure from a path
   */
  type BuildPath<T, P extends string, O extends Options> = P extends
    | O["wildcard"]
    | "*"
    ? T
    : P extends `${infer Prefix}${O["separator"] extends string ? O["separator"] : "."}${infer Start extends number}..${infer End extends number}${O["separator"] extends string ? O["separator"] : "."}${infer Rest}`
      ? Prefix extends keyof T
        ? {
            [K in Prefix]: BuildRangePathWithRest<
              T[Prefix],
              Start,
              End,
              Rest,
              O
            >;
          }
        : never
      : P extends `${infer Prefix}${O["separator"] extends string ? O["separator"] : "."}${infer Start extends number}..${infer End extends number}`
        ? Prefix extends keyof T
          ? { [K in Prefix]: BuildRangePath<T[Prefix], Start, End> }
          : never
        : P extends `${infer Key}${O["separator"] extends string ? O["separator"] : "."}${infer Rest}`
          ? Key extends keyof T
            ? { [K in Key]: BuildPath<T[Key], Rest, O> }
            : Key extends `${infer N extends number}`
              ? N extends keyof T
                ? { [K in Key]: BuildPath<T[N], Rest, O> }
                : never
              : never
          : P extends keyof T
            ? { [K in P]: T[P] }
            : P extends `${infer N extends number}`
              ? N extends keyof T
                ? { [K in P]: T[N] }
                : never
              : {};

  /**
   * Helper type to build a range path
   */
  type BuildRangePath<T, Start extends number, End extends number> =
    LessThan<Start, End> extends true
      ? T extends { [key: number]: any }
        ? { [K in ValidNumberRange<T, Start, End>]: T[K] }
        : never
      : never;

  /**
   * Helper type to build a range path with remaining path
   */
  type BuildRangePathWithRest<
    T,
    Start extends number,
    End extends number,
    Rest extends string,
    O extends Options,
  > =
    LessThan<Start, End> extends true
      ? T extends { [key: number]: any }
        ? {
            [K in ValidNumberRange<T, Start, End>]: BuildPath<T[K], Rest, O>;
          }
        : never
      : never;

  /**
   * Infer the resulting type from an object and matcher
   */
  export type Return<
    T,
    M extends
      | string
      | string[]
      | (O extends { wildcard: infer W extends string } ? W : "*"),
    O extends Options = DefaultOptions,
  > = M extends string[]
    ? InferArray<T, M, MergeOptions<O>>
    : M extends O["wildcard"] | "*"
      ? T
      : M extends string
        ? BuildPath<T, M, MergeOptions<O>>
        : never;

  /**
   * Helper type for handling array of paths
   */
  type InferArray<
    T,
    Paths extends string[],
    O extends Options,
  > = MergeIntersection<UnionToIntersection<BuildPath<T, Paths[number], O>>>;
}

/**
 * Filter an object to include specific paths
 */
export function filter<T extends object, M extends filter.Matches<T>>(
  obj: T,
  matches: M
): filter.Return<T, M>;

export function filter<
  T extends object,
  M extends filter.Matches<T, O>,
  O extends filter.Options = filter.DefaultOptions,
>(obj: T, matches: M, options: O): filter.Return<T, M, O>;

export function filter(
  obj: object,
  matches: string | string[] | "*",
  options?: filter.Options
): any {
  const separator = options?.separator ?? ".";
  const wildcard = options?.wildcard ?? "*";

  // Handle wildcard directly
  if (matches === wildcard) {
    return deepClone(obj);
  }

  // Handle array of paths
  if (Array.isArray(matches)) {
    return matches.reduce((acc, path) => {
      // Use type assertion to tell TypeScript that each path is valid
      if (options) {
        const filtered = filter(obj, path as any, options);
        return deepMerge(acc, filtered as PlainObject);
      } else {
        const filtered = filter(obj, path as any);
        return deepMerge(acc, filtered as PlainObject);
      }
    }, {} as PlainObject);
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
      const parts = matches.split(fullMatch);
      const beforeRange = parts[0];
      const afterRange = parts.slice(1).join(fullMatch);

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
      }, {} as PlainObject);
    }
  }

  // Handle simple path
  if (typeof matches === "string") {
    return filterSinglePath(obj, matches, separator, wildcard);
  }

  return {};
}
