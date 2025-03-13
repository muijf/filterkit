import type { PathPatterns } from "./types";

/**
 * Matches a path against an object and returns all matching values
 * @param obj The object to search in
 * @param path The path to match, can include wildcards (* for single level, ** for multiple levels) or key lists ([key1|key2])
 * @param exactDepth If true, only return matches that exactly match the depth of the path segments
 * @param shallowMatch If true, only return the immediate children without their nested content
 * @returns An array of matched values with their paths
 */
export function getMatches<T extends object>(
  obj: T,
  path: PathPatterns<T>,
  exactDepth: boolean = false,
  shallowMatch: boolean = false
): Array<{ path: string; value: any }> {
  const pathStr = String(path);
  const segments: string[] = [];
  let currentSegment = "";
  let inBrackets = false;

  for (let i = 0; i < pathStr.length; i++) {
    const char = pathStr[i];

    if (char === "[" && !inBrackets) {
      inBrackets = true;
      continue;
    }

    if (char === "]" && inBrackets) {
      inBrackets = false;
      segments.push(currentSegment);
      currentSegment = "";
      continue;
    }

    if (char === "." && !inBrackets) {
      if (currentSegment) {
        segments.push(currentSegment);
        currentSegment = "";
      }
      continue;
    }

    currentSegment += char;
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  const results: Array<{ path: string; value: any }> = [];
  const expectedDepth = segments.length;
  const hasSingleWildcard = segments.includes("*");

  function traverse(current: any, currentPath: string[], segmentIndex: number) {
    if (current === null || current === undefined) {
      return;
    }

    if (segmentIndex >= segments.length) {
      if (!exactDepth || currentPath.length === expectedDepth) {
        const value =
          (shallowMatch || hasSingleWildcard) &&
          typeof current === "object" &&
          current !== null
            ? {}
            : current;

        results.push({
          path: currentPath.join("."),
          value: value,
        });
      }
      return;
    }

    const segment = segments[segmentIndex];

    if (segment === "**") {
      traverse(current, currentPath, segmentIndex + 1);

      if (typeof current === "object" && current !== null) {
        for (const key in current) {
          if (Object.prototype.hasOwnProperty.call(current, key)) {
            traverse(current[key], [...currentPath, key], segmentIndex + 1);

            if (typeof current[key] === "object" && current[key] !== null) {
              traverse(current[key], [...currentPath, key], segmentIndex);
            }
          }
        }
      }
    } else if (segment === "*") {
      if (typeof current === "object" && current !== null) {
        for (const key in current) {
          if (Object.prototype.hasOwnProperty.call(current, key)) {
            traverse(current[key], [...currentPath, key], segmentIndex + 1);
          }
        }
      }
    } else if (segment.includes("|")) {
      if (typeof current === "object" && current !== null) {
        const keys = segment.split("|");
        for (const key of keys) {
          if (key in current) {
            traverse(current[key], [...currentPath, key], segmentIndex + 1);
          }
        }
      }
    } else if (
      typeof current === "object" &&
      current !== null &&
      segment in current
    ) {
      traverse(current[segment], [...currentPath, segment], segmentIndex + 1);
    }
  }

  traverse(obj, [], 0);
  return results;
}
