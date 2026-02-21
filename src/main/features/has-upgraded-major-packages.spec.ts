import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "../__tests__/integration-mocks";
import {
  BASE_PKG,
  encodeLabelerConfig,
  encodePackageJson,
  HEAD_PKG_MAJOR_UPGRADE,
} from "../__tests__/integration-helpers";
import {
  mockAddLabels,
  mockGetContent,
  mockListLabelsOnIssue,
  mockPaginate,
  mockPullsGet,
} from "../__tests__/integration-mocks";

const configWithMajorFeature = {
  labels: [],
  automaticFeatures: { majorPackagesUpgradedTriggersMajorLabel: true },
};

describe("integration: major label on PR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddLabels.mockResolvedValue(undefined);
    mockListLabelsOnIssue.mockResolvedValue({ data: [] });
    mockPaginate.mockResolvedValue([]);

    mockPullsGet.mockResolvedValue({
      data: {
        base: { sha: "base-sha" },
        head: { sha: "head-sha" },
      },
    });

    mockGetContent.mockImplementation(
      (params: { path?: string; ref?: string }) => {
        if (params.path === ".github/pull-request-labeler.yml") {
          return Promise.resolve({
            data: {
              content: encodeLabelerConfig(configWithMajorFeature),
              encoding: "base64",
            },
          });
        }
        if (params.ref === "base-sha") {
          return Promise.resolve({
            data: {
              content: encodePackageJson(BASE_PKG),
              encoding: "base64",
            },
          });
        }
        if (params.ref === "head-sha") {
          return Promise.resolve({
            data: {
              content: encodePackageJson(HEAD_PKG_MAJOR_UPGRADE),
              encoding: "base64",
            },
          });
        }
        return Promise.reject(new Error(`Unexpected ref: ${params.ref}`));
      },
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("adds major label when PR upgrades a dependency major version", async () => {
    const { main } = await import("../index");
    await main();

    expect(mockAddLabels).toHaveBeenCalledTimes(1);
    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 42,
      labels: ["major"],
    });
  });

  it("does not add any label when PR has no major upgrade", async () => {
    const headPkgPatchOnly = {
      name: "test-repo",
      dependencies: { lodash: "^4.17.21" },
    };
    mockGetContent.mockImplementation(
      (params: { path?: string; ref?: string }) => {
        if (params.path === ".github/pull-request-labeler.yml") {
          return Promise.resolve({
            data: {
              content: encodeLabelerConfig(configWithMajorFeature),
              encoding: "base64",
            },
          });
        }
        if (params.ref === "base-sha") {
          return Promise.resolve({
            data: {
              content: encodePackageJson(BASE_PKG),
              encoding: "base64",
            },
          });
        }
        if (params.ref === "head-sha") {
          return Promise.resolve({
            data: {
              content: encodePackageJson(headPkgPatchOnly),
              encoding: "base64",
            },
          });
        }
        return Promise.reject(new Error(`Unexpected ref: ${params.ref}`));
      },
    );

    const { main } = await import("../index");
    await main();

    expect(mockAddLabels).not.toHaveBeenCalled();
  });
});
