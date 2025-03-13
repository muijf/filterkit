type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;

type PathsWithDepthLimit<
  T,
  Depth extends number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
> = [Depth] extends [[]]
  ? never
  : T extends object
    ? {
        [K in keyof T]: K extends string | number
          ? K | `${K}.${PathsWithDepthLimit<T[K], Tail<Depth>>}`
          : never;
      }[keyof T & (string | number)]
    : never;

type ObjectPaths<T> = PathsWithDepthLimit<T> | (keyof T & string);

type KeysOf<T> = keyof T & (string | number);

type ExistsAtAnyDepth<T, K extends string> = K extends keyof T
  ? true
  : T extends object
    ? { [P in keyof T]: ExistsAtAnyDepth<T[P], K> }[keyof T] extends never
      ? false
      : true
    : false;

// Helper to check if a segment is directly accessible from a path
type IsDirectlyAccessible<
  T,
  Path extends string,
  Segment extends string,
> = Path extends `${infer Start}.${infer Rest}`
  ? Start extends keyof T
    ? Rest extends `${infer Next}.${infer Remaining}`
      ? Next extends keyof T[Start]
        ? IsDirectlyAccessible<T[Start], Rest, Segment>
        : false
      : Rest extends keyof T[Start]
        ? Segment extends keyof T[Start][Rest]
          ? true
          : false
        : false
    : false
  : Path extends keyof T
    ? Segment extends keyof T[Path]
      ? true
      : false
    : false;

type SingleWildcardPath<P extends string, T> =
  | "*"
  | (P extends `${infer A}.${infer B}`
      ? A extends keyof T
        ? T[A] extends object
          ? P extends `${infer Prefix}.*.${infer Suffix}`
            ? IsDirectlyAccessible<T, Prefix, Suffix> extends true
              ? Suffix extends keyof T[Prefix & keyof T]
                ? T[Prefix & keyof T][Suffix] extends object
                  ? `${A}.*.${B}` | `${A}.${SingleWildcardPath<B, T[A]>}`
                  : never
                : `${A}.*.${B}` | `${A}.${SingleWildcardPath<B, T[A]>}`
              : `${A}.*.${B}` | `${A}.${SingleWildcardPath<B, T[A]>}`
            : `${A}.*.${B}` | `${A}.${SingleWildcardPath<B, T[A]>}`
          : never
        : ExistsAtAnyDepth<T, A> extends true
          ? `*.${B}`
          : never
      : never);

type DoubleWildcardPath<P extends string, T> =
  | "**"
  | (P extends `${infer A}.${infer B}`
      ? A extends keyof T
        ? T[A] extends object
          ? P extends `${infer Prefix}.**.${infer Suffix}`
            ? IsDirectlyAccessible<T, Prefix, Suffix> extends true
              ? Suffix extends keyof T[Prefix & keyof T]
                ? T[Prefix & keyof T][Suffix] extends object
                  ? `${A}.**.${B}` | `${A}.${DoubleWildcardPath<B, T[A]>}`
                  : never
                : `${A}.**.${B}` | `${A}.${DoubleWildcardPath<B, T[A]>}`
              : `${A}.**.${B}` | `${A}.${DoubleWildcardPath<B, T[A]>}`
            : `${A}.**.${B}` | `${A}.${DoubleWildcardPath<B, T[A]>}`
          : never
        : ExistsAtAnyDepth<T, A> extends true
          ? `**.${B}`
          : never
      : never);

type WildcardPath<P extends string, T> =
  | SingleWildcardPath<P, T>
  | DoubleWildcardPath<P, T>;

type BracketNotation<T> = {
  [K1 in KeysOf<T>]: {
    [K2 in Exclude<KeysOf<T>, K1>]:
      | `[${K1}|${K2}]`
      | {
          [K3 in Exclude<KeysOf<T>, K1 | K2>]:
            | `[${K1}|${K2}|${K3}]`
            | {
                [K4 in Exclude<
                  KeysOf<T>,
                  K1 | K2 | K3
                >]: `[${K1}|${K2}|${K3}|${K4}]`;
              }[Exclude<KeysOf<T>, K1 | K2 | K3>];
        }[Exclude<KeysOf<T>, K1 | K2>];
  }[Exclude<KeysOf<T>, K1>];
}[KeysOf<T>];

type GetCommonKeys<T, K1 extends KeysOf<T>, K2 extends KeysOf<T>> = Extract<
  keyof T[K1],
  keyof T[K2]
> &
  (string | number);

type NestedBracketNotation<T> = {
  [K1 in KeysOf<T>]: {
    [K2 in Exclude<KeysOf<T>, K1>]: {
      [CK in GetCommonKeys<T, K1, K2>]: `[${K1}|${K2}].${CK}`;
    }[GetCommonKeys<T, K1, K2>];
  }[Exclude<KeysOf<T>, K1>];
}[KeysOf<T>];

export type PathPatterns<T> =
  | ObjectPaths<T>
  | WildcardPath<ObjectPaths<T> & string, T>
  | BracketNotation<T>
  | NestedBracketNotation<T>;
