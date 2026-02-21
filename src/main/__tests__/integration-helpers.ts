import yaml from "js-yaml";

import type { LabelerConfig } from "../features/types";
import {
  mockGetContent,
  mockPaginate,
  mockPullsGet,
} from "./integration-mocks";

export const BASE_PKG = {
  name: "test-repo",
  dependencies: { lodash: "^4.17.0" },
};
export const HEAD_PKG_MAJOR_UPGRADE = {
  name: "test-repo",
  dependencies: { lodash: "^5.0.0" },
};

export function encodePackageJson(pkg: object): string {
  return Buffer.from(JSON.stringify(pkg)).toString("base64");
}

export function encodeLabelerConfig(config: LabelerConfig): string {
  return Buffer.from(yaml.dump(config)).toString("base64");
}

export type PRContextParams = {
  title?: string;
  body?: string | null;
  author?: string;
  baseBranch?: string;
  headBranch?: string;
  filePaths?: string[];
  comments?: string[];
  commitMessages?: string[];
};

/** Set config + PR context for config-labeler tests. No major upgrade. */
export function setConfigLabelerAndPRContext(
  config: LabelerConfig,
  pr: PRContextParams,
): void {
  mockGetContent.mockImplementation(
    (params: { path?: string; ref?: string }) => {
      if (params.path === ".github/pull-request-labeler.yml") {
        return Promise.resolve({
          data: { content: encodeLabelerConfig(config), encoding: "base64" },
        });
      }
      if (params.path === "package.json") {
        return Promise.reject(new Error("No package.json"));
      }
      return Promise.reject(new Error(`Unexpected path: ${params.path}`));
    },
  );
  mockPullsGet.mockResolvedValue({
    data: {
      base: { sha: "base-sha", ref: pr.baseBranch ?? "main" },
      head: { sha: "head-sha", ref: pr.headBranch ?? "feat/foo" },
      title: pr.title ?? "",
      body: pr.body ?? null,
      user: { login: pr.author ?? "someone" },
    },
  });
  mockPaginate
    .mockResolvedValueOnce((pr.filePaths ?? []).map(f => ({ filename: f })))
    .mockResolvedValueOnce((pr.comments ?? []).map(b => ({ body: b })))
    .mockResolvedValueOnce(
      (pr.commitMessages ?? []).map(m => ({ commit: { message: m } })),
    );
}
