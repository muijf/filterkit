/**
 * Type to determine if a value is an object (excluding arrays and null)
 */
type IsObject<T> = T extends object ? (T extends any[] ? false : true) : false;

/**
 * Default options for path operations
 */
export type DefaultOptions = {
  separator: ".";
  wildcard: "*";
  shallow: false;
};

/**
 * Options for the path functions with defaults
 */
export type Options<
  Sep extends string = DefaultOptions["separator"],
  Wild extends string = DefaultOptions["wildcard"],
  Shallow extends boolean = DefaultOptions["shallow"],
> = {
  /**
   * The separator character
   * @default "."
   */
  separator?: Sep;
  /**
   * The wildcard character
   * @default "*"
   */
  wildcard?: Wild;
  /**
   * Whether to shallowly filter the object
   * @default false
   */
  shallow?: Shallow;
};

/**
 * Get all possible paths in an object using dot notation
 * @template T - The object type
 * @template Sep - The separator character (default ".")
 * @template Wild - The wildcard character (default "*")
 */
export type Filter<
  T,
  Sep extends string = DefaultOptions["separator"],
  Wild extends string = DefaultOptions["wildcard"],
  Shallow extends boolean = DefaultOptions["shallow"],
> = Wild | ObjectPaths<T, Sep, Wild, Shallow>;

/**
 * Path with options
 */
export type PathWithOptions<
  T,
  Sep extends string = DefaultOptions["separator"],
  Wild extends string = DefaultOptions["wildcard"],
  Shallow extends boolean = DefaultOptions["shallow"],
  CustomSep extends string = string,
> = readonly [
  // If a custom separator is provided, use it for the path
  CustomSep extends string
    ? Wild | ObjectPaths<T, CustomSep, Wild, Shallow>
    : Filter<T, Sep, Wild, Shallow>,
  {
    separator?: CustomSep;
    wildcard?: Wild;
    shallow?: boolean; // Allow any boolean value, not just Shallow
  },
];

/**
 * Path parameter type - can be a single path, an array of paths, or an array of paths with options
 */
export type PathParam<
  T,
  Sep extends string = DefaultOptions["separator"],
  Wild extends string = DefaultOptions["wildcard"],
  Shallow extends boolean = DefaultOptions["shallow"],
> =
  | Filter<T, Sep, Wild, Shallow>
  | readonly (
      | Filter<T, Sep, Wild, Shallow>
      | PathWithOptions<T, Sep, Wild, Shallow, string>
    )[];

/**
 * Helper type to get all paths in an object without including the wildcard
 */
type ObjectPaths<
  T,
  Sep extends string = DefaultOptions["separator"],
  Wild extends string = DefaultOptions["wildcard"],
  Shallow extends boolean = DefaultOptions["shallow"],
> = T extends object
  ? {
      [K in keyof T]: K extends string | number
        ?
            | `${K}`
            | (IsObject<T[K]> extends true
                ? `${K}${Sep}${ObjectPaths<T[K], Sep, Wild, Shallow>}`
                : never)
        : never;
    }[keyof T]
  : never;

/**
 * Get the type of a value at a specific path
 * @template T - The object type
 * @template P - The path string
 * @template Sep - The separator character (default ".")
 * @template Wild - The wildcard character (default "*")
 */
export type InferValue<
  T,
  P extends string,
  Sep extends string = DefaultOptions["separator"],
  Wild extends string = DefaultOptions["wildcard"],
  Shallow extends boolean = DefaultOptions["shallow"],
> = P extends Wild
  ? T
  : P extends `${infer K}${Sep}${infer Rest}`
    ? K extends keyof T
      ? InferValue<T[K], Rest, Sep, Wild, Shallow>
      : K extends `${number}`
        ? K extends `${infer N extends number}`
          ? N extends keyof T
            ? InferValue<T[N], Rest, Sep, Wild, Shallow>
            : never
          : never
        : never
    : P extends keyof T
      ? T[P]
      : P extends `${number}`
        ? P extends `${infer N extends number}`
          ? N extends keyof T
            ? T[N]
            : never
          : never
        : never;

/**
 * Filter an object to only include a specific path
 * @template T - The object type
 * @template P - The path string, array of paths, or array of paths with options
 * @template Sep - The separator character (default ".")
 * @template Wild - The wildcard character (default "*")
 * @template Shallow - Whether to shallowly filter the object (default false)
 */
export type InferObject<
  T,
  P,
  Sep extends string = DefaultOptions["separator"],
  Wild extends string = DefaultOptions["wildcard"],
  Shallow extends boolean = DefaultOptions["shallow"],
> = P extends readonly (infer Item)[]
  ? UnionToIntersection<
      Item extends readonly [infer Path, infer ItemOptions]
        ? Path extends Wild
          ? T // Handle wildcard in path options
          : Path extends string
            ? ItemOptions extends { separator: infer CustomSep }
              ? CustomSep extends string
                ? ItemOptions extends { shallow: infer ItemShallow }
                  ? ItemShallow extends true
                    ? ShallowFilterByPath<T, Path, CustomSep>
                    : DeepFilterByPath<T, Path, CustomSep>
                  : Shallow extends true
                    ? ShallowFilterByPath<T, Path, CustomSep>
                    : DeepFilterByPath<T, Path, CustomSep>
                : never
              : ItemOptions extends { shallow: infer ItemShallow }
                ? ItemShallow extends true
                  ? ShallowFilterByPath<T, Path, Sep>
                  : DeepFilterByPath<T, Path, Sep>
                : Shallow extends true
                  ? ShallowFilterByPath<T, Path, Sep>
                  : DeepFilterByPath<T, Path, Sep>
            : never
        : Item extends Wild
          ? T // Handle wildcard in array
          : Item extends string
            ? Shallow extends true
              ? ShallowFilterByPath<T, Item, Sep>
              : DeepFilterByPath<T, Item, Sep>
            : never
    >
  : P extends Wild
    ? T
    : P extends string
      ? Shallow extends true
        ? ShallowFilterByPath<T, P, Sep>
        : DeepFilterByPath<T, P, Sep>
      : never;

/**
 * Helper type for deep filtering
 */
type DeepFilterByPath<
  T,
  P extends string,
  Sep extends string = DefaultOptions["separator"],
> = P extends `${infer K}${Sep}${infer Rest}`
  ? {
      [Key in Extract<keyof T, string | number> as `${Key}` extends K
        ? Key
        : never]: DeepFilterByPath<T[Key], Rest, Sep>;
    }
  : {
      [Key in Extract<keyof T, string | number> as `${Key}` extends P
        ? Key
        : never]: T[Key];
    };

/**
 * Helper type for shallow filtering
 */
type ShallowFilterByPath<
  T,
  P extends string,
  Sep extends string = DefaultOptions["separator"],
> = P extends `${infer K}${Sep}${infer Rest}`
  ? {
      [Key in Extract<keyof T, string | number> as `${Key}` extends K
        ? Key
        : never]: ShallowFilterByPath<T[Key], Rest, Sep>;
    }
  : {
      [Key in Extract<keyof T, string | number> as `${Key}` extends P
        ? Key
        : never]: T[Key] extends object
        ? T[Key] extends any[]
          ? T[Key]
          : {}
        : T[Key];
    };

/**
 * Helper type to convert a union type to an intersection type
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;
