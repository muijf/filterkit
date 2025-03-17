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
 * Helper type to check if all numbers in a range have a common property
 * Simplified to avoid excessive recursion
 */
type CommonPropertiesInRange<T extends { [key: number]: any }> = {
  [K in keyof T[number]]: K;
};

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
 * Helper type to validate a range expression in a path
 * Ensures that the first number is strictly less than the second
 */
type ValidateRangeInPath<
  Path extends string,
  Sep extends string,
> = Path extends `${infer Before}${infer N1 extends number}..${infer N2 extends number}${infer After}`
  ? LessThan<N1, N2> extends true
    ? Path
    : never
  : Path;

/**
 * Helper type to check if a string contains an invalid range (where first number > second)
 */
type HasInvalidRange<S extends string> =
  S extends `${infer Before}${infer N1 extends number}..${infer N2 extends number}${infer After}`
    ? LessThan<N1, N2> extends true
      ? HasInvalidRange<After>
      : true
    : false;

/**
 * Helper type to ensure a path has valid ranges
 */
type EnsureValidRanges<S extends string> =
  HasInvalidRange<S> extends true ? never : S;

/**
 * Helper type to check if a range in a path is valid
 * This approach directly uses our existing LessThan type
 */
type ValidatePathRanges<Path extends string> =
  Path extends `${infer Before}${infer N1 extends number}..${infer N2 extends number}${infer After}`
    ? [N1, N2] extends [number, number]
      ? LessThan<N1, N2> extends true
        ? `${Before}${N1}..${N2}${ValidatePathRanges<After>}`
        : never
      : Path
    : Path;

/**
 * Updated Matches type that relies on runtime validation for ranges
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
 * Helper type to get the exact type at a path with range
 * Ensures that Start < End (first number is less than second)
 */
type GetValueWithRange<
  T,
  Start extends number,
  End extends number,
  Rest extends string,
  O extends Options,
> =
  LessThan<Start, End> extends true
    ? T extends { [key: number]: any }
      ? {
          [K in ValidNumberRange<T, Start, End>]: Rest extends ""
            ? T[K]
            : GetValue<T[K], Rest, O>;
        }
      : never
    : never;

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
    : Key extends `${infer Start extends number}..${infer End extends number}`
      ? LessThan<Start, End> extends true
        ? GetValueWithRange<T, Start, End, Rest, O>
        : never
      : never
  : P extends keyof T
    ? T[P]
    : P extends `${infer Start extends number}..${infer End extends number}`
      ? LessThan<Start, End> extends true
        ? T extends { [key: number]: any }
          ? { [K in ValidNumberRange<T, Start, End>]: T[K] }
          : never
        : never
      : never;

/**
 * Helper type to build an object structure from a path with range
 * Ensures that Start < End (first number is less than second)
 */
type BuildPathWithRange<
  T,
  Start extends number,
  End extends number,
  Rest extends string,
  O extends Options,
> =
  LessThan<Start, End> extends true
    ? T extends { [key: number]: any }
      ? {
          [K in ValidNumberRange<T, Start, End>]: Rest extends ""
            ? T[K]
            : BuildPath<T[K], Rest, O>;
        }
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
      ? Rest extends `${infer RangeStart extends number}..${infer RangeEnd extends number}${O["separator"]}${infer RangeRest}`
        ? LessThan<RangeStart, RangeEnd> extends true
          ? T[Key] extends { [key: number]: any }
            ? {
                [K in Key]: BuildPathWithRange<
                  T[Key],
                  RangeStart,
                  RangeEnd,
                  RangeRest,
                  O
                >;
              }
            : never
          : never
        : { [K in Key]: BuildPath<T[Key], Rest, O> }
      : Key extends `${infer Start extends number}..${infer End extends number}`
        ? LessThan<Start, End> extends true
          ? T extends { [key: number]: any }
            ? BuildPathWithRange<T, Start, End, Rest, O>
            : never
          : never
        : never
    : P extends keyof T
      ? { [K in P]: T[P] }
      : P extends `${infer Start extends number}..${infer End extends number}`
        ? LessThan<Start, End> extends true
          ? T extends { [key: number]: any }
            ? { [K in ValidNumberRange<T, Start, End>]: T[K] }
            : never
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
