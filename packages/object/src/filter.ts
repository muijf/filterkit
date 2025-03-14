import type {
  InferObject,
  Options,
  DefaultOptions,
  PathParam,
  PathWithOptions,
} from "./types";

/**
 * Filter an object to only include specific paths
 * @param obj - The object to filter
 * @param path - The path or paths to keep
 * @param options - Options for filtering
 */
export function filter<
  T extends object,
  Sep extends string = DefaultOptions["separator"],
  Wild extends string = DefaultOptions["wildcard"],
  Shallow extends boolean = DefaultOptions["shallow"],
  P extends PathParam<T, Sep, Wild, Shallow> = PathParam<T, Sep, Wild, Shallow>,
>(
  obj: T,
  path: P,
  options?: Options<Sep, Wild, Shallow>
): InferObject<T, P, Sep, Wild, Shallow> {
  const defaultSeparator = (options?.separator ?? ".") as Sep;
  const defaultWildcard = (options?.wildcard ?? "*") as Wild;
  const defaultShallow = (options?.shallow ?? false) as Shallow;

  // Handle array of paths
  if (Array.isArray(path)) {
    // Filter for each path and merge the results
    return path.reduce((result, currentPath) => {
      // Check if the path has options (is a tuple with exactly 2 elements)
      if (
        Array.isArray(currentPath) &&
        currentPath.length === 2 &&
        typeof currentPath[0] === "string" &&
        typeof currentPath[1] === "object" &&
        currentPath[1] !== null
      ) {
        // Safe to cast now that we've verified the structure
        const pathWithOptions = currentPath as unknown as PathWithOptions<
          T,
          Sep,
          Wild,
          Shallow
        >;
        const [pathString, pathOptions] = pathWithOptions;

        const separator = (pathOptions?.separator ?? defaultSeparator) as Sep;
        const wildcard = (pathOptions?.wildcard ?? defaultWildcard) as Wild;
        const shallow = (pathOptions?.shallow ?? defaultShallow) as Shallow;

        const filtered = filterSinglePath(
          obj,
          pathString as string,
          separator,
          wildcard,
          shallow
        );
        return deepMerge(result, filtered);
      } else {
        // Regular path without options
        const filtered = filterSinglePath(
          obj,
          currentPath as string,
          defaultSeparator,
          defaultWildcard,
          defaultShallow
        );
        return deepMerge(result, filtered);
      }
    }, {} as any) as InferObject<T, P, Sep, Wild, Shallow>;
  }

  // Handle single path
  return filterSinglePath(
    obj,
    path as string,
    defaultSeparator,
    defaultWildcard,
    defaultShallow
  ) as InferObject<T, P, Sep, Wild, Shallow>;
}

/**
 * Filter an object to include a single path
 */
function filterSinglePath<T extends object>(
  obj: T,
  path: string,
  separator: string,
  wildcard: string,
  shallow: boolean
): any {
  // Handle wildcard
  if (path === wildcard) {
    return { ...obj };
  }

  const keys = path.split(separator) as string[];
  let result: Record<string, any> = {};
  let current = result;
  let source = obj as any;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    // Check if the key exists in the source object
    if (source == null || !(key in source)) {
      throw new Error(
        `Path "${path}" does not exist in the object. Key "${key}" not found.`
      );
    }

    if (i === keys.length - 1) {
      // Last key, set the actual value
      if (shallow) {
        const value = source[key];

        if (value !== null && typeof value === "object") {
          if (Array.isArray(value)) current[key] = [...value];
          else current[key] = Object.create(Object.getPrototypeOf(value));
        } else current[key] = value;
      } else current[key] = cloneValue(source[key]);
    } else {
      // Not the last key, create nested object
      current[key] = {};
      current = current[key];
      source = source[key];
    }
  }

  return result;
}

/**
 * Deep merge two objects
 */
function deepMerge<
  T extends Record<string, any>,
  U extends Record<string, any>,
>(target: T, source: U): T & U {
  const output = { ...target } as Record<string, any>;

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (isObject(sourceValue)) {
        if (!(key in target)) {
          output[key] = sourceValue;
        } else {
          output[key] = deepMerge(
            targetValue as Record<string, any>,
            sourceValue as Record<string, any>
          );
        }
      } else {
        output[key] = sourceValue;
      }
    });
  }

  return output as T & U;
}

/**
 * Check if a value is an object
 */
function isObject(item: any): item is object {
  return item !== null && typeof item === "object" && !Array.isArray(item);
}

/**
 * Clone a value deeply
 */
function cloneValue(value: any): any {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(cloneValue);

  const result: Record<string, any> = {};
  for (const key in value)
    if (Object.prototype.hasOwnProperty.call(value, key))
      result[key] = cloneValue(value[key]);

  return result;
}
