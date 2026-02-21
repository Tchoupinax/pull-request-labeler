import { minimatch } from "minimatch";

import { FilesMatcher } from "../types/files-matcher";
import { PRContext } from "./types";

/**
 * Returns true if the matcher has no files rule or the changed files satisfy any/all/count.
 */
export function matchFiles(
  context: PRContext,
  filesMatcher: FilesMatcher | undefined,
): boolean {
  if (filesMatcher == null) {
    return true;
  }

  const paths = context.filePaths;

  if (filesMatcher.any != null && filesMatcher.any.length > 0) {
    const anyMatch = filesMatcher.any.some(glob =>
      paths.some(p => minimatch(p, glob, { matchBase: true })),
    );
    if (!anyMatch) {
      return false;
    }
  }

  if (filesMatcher.only != null && filesMatcher.only.length > 0) {
    const onlyMatch = paths.every(p =>
      filesMatcher.only!.some(glob => minimatch(p, glob, { matchBase: true })),
    );
    if (!onlyMatch) {
      return false;
    }
  }

  if (filesMatcher.all != null && filesMatcher.all.length > 0) {
    const allMatch = filesMatcher.all.every(glob =>
      paths.some(p => minimatch(p, glob, { matchBase: true })),
    );
    if (!allMatch) {
      return false;
    }
  }

  if (filesMatcher.count != null) {
    const { gte, lte } = filesMatcher.count;
    const n = paths.length;
    if (gte != null && n < gte) {
      return false;
    }
    if (lte != null && n > lte) {
      return false;
    }
  }

  return true;
}
