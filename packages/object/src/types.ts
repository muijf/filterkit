/**
 * Options for path operations
 */
export type Options = {
  separator?: "." | string;
  wildcard?: "*" | string;
};

/**
 * Helper type to determine if a value is an object (excluding arrays and null)
 */
type IsObject<T> = T extends object ? (T extends any[] ? false : true) : false;

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
 * Match type to find all possible matches in an object based on settings
 */
export type Match<T, O extends Options = Options> = ObjectPaths<T, O>;

/**
 * Helper type to generate a range of numbers from Min to Max
 * Only works when Min <= Max
 */
type NumberRange<
  Min extends number,
  Max extends number,
  Arr extends number[] = [],
> = Min extends Max
  ? Min
  : Max extends Min
    ? Max
    : Min extends Arr["length"]
      ? Min | NumberRange<[...Arr, 1]["length"], Max, [...Arr, 1]>
      : NumberRange<Min, Max, [...Arr, 1]>;

/**
 * Helper type to get all numeric keys from an object
 */
type NumericKeysOf<T> = Extract<keyof T, number>;

/**
 * Helper type to get the range of existing numeric keys in an object
 */
type ValidNumberRange<T, Min extends number, Max extends number> = Extract<
  NumericKeysOf<T>,
  NumberRange<Min, Max>
>;

/**
 * Helper type to compare two numbers (A < B)
 * Ensures strict less than (not equal)
 */
type LessThan<A extends number, B extends number> = A extends B
  ? false // If A equals B, then A is not less than B
  : [...Array<unknown>]["length"] extends A
    ? B extends 0
      ? false // If A is 0 and B is 0, then A is not less than B
      : true // If A is 0 and B is not 0, then A < B
    : [...Array<unknown>]["length"] extends B
      ? false // If B is 0 and A is not 0, then A is not less than B
      : number extends A
        ? true // If A is a generic number, assume A < B
        : number extends B
          ? false // If B is a generic number but A isn't, assume A is not less than B
          : BuildArrayOfLength<A> extends [...infer R, unknown]
            ? BuildArrayOfLength<B> extends [...any, ...R]
              ? true // If B's array contains A's array plus at least one more element, then A < B
              : false
            : false;

/**
 * Helper type to build an array of a specific length
 * This is a more generic approach that works for any number
 */
type BuildArrayOfLength<
  N extends number,
  Acc extends unknown[] = [],
> = Acc["length"] extends N ? Acc : BuildArrayOfLength<N, [...Acc, unknown]>;

/**
 * Helper type to ensure Start < End in a range expression
 * Uses the improved LessThan type to enforce strict inequality
 */
type ValidRangeOrder<Start extends number, End extends number> =
  LessThan<Start, End> extends true ? Start : never;

/**
 * Helper type to parse range expression "start..end" and validate against existing keys
 * Only allows ranges where start <= end
 */
type ParseValidRange<
  T,
  S extends string,
> = S extends `${infer Start extends number}..${infer End extends number}`
  ? ValidRangeOrder<Start, End> extends never
    ? never
    : ValidNumberRange<T, Start, End>
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
                | {
                    [N1 in NumericKeysOf<T[K]>]: {
                      [N2 in NumericKeysOf<T[K]>]: LessThan<N1, N2> extends true
                        ? `${K}${Sep}${N1}..${N2}`
                        : never;
                    }[NumericKeysOf<T[K]>];
                  }[NumericKeysOf<T[K]>]
            : `${K}` | `${K}${Sep}${GetPaths<T[K], Sep>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

/**
 * Updated Matches type that strictly validates paths
 */
export type Matches<T, O extends Options = Options> =
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
 * Helper type to get the exact type at a path
 */
type GetValue<
  T,
  P extends string,
  O extends Options,
> = P extends `${infer Key}${O["separator"]}${infer Rest}`
  ? Key extends keyof T
    ? GetValue<T[Key], Rest, O>
    : Key extends `${number}..${number}`
      ? T extends { [key: number]: any }
        ? GetValue<T[number], Rest, O>
        : never
      : never
  : P extends keyof T
    ? T[P]
    : P extends `${number}..${number}`
      ? T extends { [key: number]: any }
        ? T[number]
        : never
      : never;

/**
 * Helper type to build an object structure from a path
 */
type BuildPath<T, P extends string, O extends Options> = P extends
  | O["wildcard"]
  | "*"
  ? T
  : P extends `${infer Key}${O["separator"]}${infer Rest}`
    ? Key extends keyof T
      ? Rest extends `${number}..${number}`
        ? T[Key] extends { [key: number]: any }
          ? {
              [K in Key]: { [K2 in ParseValidRange<T[Key], Rest>]: T[Key][K2] };
            }
          : never
        : { [K in Key]: BuildPath<T[Key], Rest, O> }
      : Key extends `${number}..${number}`
        ? T extends { [key: number]: any }
          ? { [K in ParseValidRange<T, Key>]: BuildPath<T[K], Rest, O> }
          : never
        : never
    : P extends keyof T
      ? { [K in P]: T[P] }
      : P extends `${number}..${number}`
        ? T extends { [key: number]: any }
          ? { [K in ParseValidRange<T, P>]: T[K] }
          : never
        : never;

/**
 * Helper type to merge intersected objects
 */
type MergeIntersection<T> = T extends object
  ? { [K in keyof T]: T[K] extends object ? MergeIntersection<T[K]> : T[K] }
  : T;

/**
 * Helper type for handling array of paths
 */
type InferArray<T, Paths, O extends Options> = MergeIntersection<
  Paths extends string[]
    ? UnionToIntersection<BuildPath<T, Paths[number], O>>
    : never
>;

/**
 * Helper type to convert a union type to an intersection type
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

/**
 * Infer the resulting type from an object and matcher
 */
export type Infer<
  T,
  M extends Matches<T, O>,
  O extends Options = Options,
> = M extends string[]
  ? InferArray<T, M, O>
  : M extends string
    ? BuildPath<T, M, O>
    : never;
