import type { PathPatterns } from "./types";
import { getMatches } from "./matches";

/**
 * Creates a new object with only the matched paths
 * @param obj The object to filter
 * @param path The path to match, can include wildcards (* for single level, ** for multiple levels) or key lists ([key1|key2])
 * @param maxDepth Optional maximum depth to include in the result (useful for limiting ** wildcard results)
 * @returns A new object containing only the matched paths
 */
export function filter<T extends object>(
  obj: T,
  path: PathPatterns<T>,
  maxDepth?: number
): object {
  const pathStr = String(path);
  const exactDepth = pathStr.includes("*") && !pathStr.includes("**");
  const shallowMatch = pathStr === "*";
  const matches = getMatches(obj, path, exactDepth, shallowMatch);
  const result: Record<string, any> = {};

  for (const match of matches) {
    const pathSegments = match.path.split(".");

    if (maxDepth !== undefined && pathSegments.length > maxDepth) {
      continue;
    }

    let current = result;

    for (let i = 0; i < pathSegments.length - 1; i++) {
      const segment = pathSegments[i];
      if (!(segment in current)) {
        current[segment] = {};
      }
      current = current[segment];
    }

    const lastSegment = pathSegments[pathSegments.length - 1];
    current[lastSegment] = match.value;
  }

  return result;
}
