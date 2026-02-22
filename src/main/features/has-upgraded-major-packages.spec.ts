import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import "../__tests__/integration-mocks";
import {
  BASE_PKG,
  encodeLabelerConfig,
  encodePackageJson,
  HEAD_PKG_MAJOR_UPGRADE,
  HEAD_PKG_MINOR_UPGRADE,
  HEAD_PKG_PATCH_UPGRADE,
} from "../__tests__/integration-helpers";
import {
  mockAddLabels,
  mockGetContent,
  mockListLabelsOnIssue,
  mockPaginate,
  mockPullsGet,
} from "../__tests__/integration-mocks";
import { LabelerConfig } from "./types";

const configWithMajorFeature = {
  labels: [],
  automaticFeatures: { majorPackagesUpgradedTriggersMajorLabel: true },
};

const configWithCustomSemverMajorLabel = {
  labels: [],
  labelsNames: { semverMajor: "Major2" },
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
      labels: ["semver:major"],
    });
  });

  it("uses custom semverMajor label from config when PR upgrades major", async () => {
    mockGetContent.mockImplementation(
      (params: { path?: string; ref?: string }) => {
        if (params.path === ".github/pull-request-labeler.yml") {
          return Promise.resolve({
            data: {
              content: encodeLabelerConfig(configWithCustomSemverMajorLabel),
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

    const { main } = await import("../index");
    await main();

    expect(mockAddLabels).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 42,
      labels: ["Major2"],
    });
  });

  it("does not add any label when PR has no major upgrade", async () => {
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
              content: encodePackageJson(HEAD_PKG_PATCH_UPGRADE),
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

const configWithMinorFeature = {
  labels: [],
  automaticFeatures: { minorPackagesUpgradedTriggersMinorLabel: true },
};

const configWithPatchFeature = {
  labels: [],
  automaticFeatures: { patchPackagesUpgradedTriggersPatchLabel: true },
};

function mockGetContentForUpgradeTests(
  labelerConfig: LabelerConfig,
  headPkg: object,
): void {
  mockGetContent.mockImplementation(
    (params: { path?: string; ref?: string }) => {
      if (params.path === ".github/pull-request-labeler.yml") {
        return Promise.resolve({
          data: {
            content: encodeLabelerConfig(labelerConfig),
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
            content: encodePackageJson(headPkg),
            encoding: "base64",
          },
        });
      }
      return Promise.reject(new Error(`Unexpected ref: ${params.ref}`));
    },
  );
}

describe("integration: minor label on PR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddLabels.mockResolvedValue(undefined);
    mockListLabelsOnIssue.mockResolvedValue({ data: [] });
    mockPaginate.mockResolvedValue([]);
    mockPullsGet.mockResolvedValue({
      data: { base: { sha: "base-sha" }, head: { sha: "head-sha" } },
    });
  });

  it("do not add minor label when PR has minor upgrade only", async () => {
    mockGetContentForUpgradeTests(configWithMinorFeature, HEAD_PKG_MINOR_UPGRADE);

    const { main } = await import("../index");
    await main();

    expect(mockAddLabels).not.toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 42,
      labels: ["semver:minor"],
    });
  });

  it("does not add minor label when PR has major upgrade", async () => {
    mockGetContentForUpgradeTests(configWithMinorFeature, HEAD_PKG_MAJOR_UPGRADE);

    const { main } = await import("../index");
    await main();

    expect(mockAddLabels).not.toHaveBeenCalled();
  });
});

describe("integration: patch label on PR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddLabels.mockResolvedValue(undefined);
    mockListLabelsOnIssue.mockResolvedValue({ data: [] });
    mockPaginate.mockResolvedValue([]);
    mockPullsGet.mockResolvedValue({
      data: { base: { sha: "base-sha" }, head: { sha: "head-sha" } },
    });
  });

  it("do not add semver:patch label when PR has patch upgrade only", async () => {
    mockGetContentForUpgradeTests(configWithPatchFeature, HEAD_PKG_PATCH_UPGRADE);

    const { main } = await import("../index");
    await main();

    expect(mockAddLabels).not.toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 42,
      labels: ["semver:patch"],
    });
  });

  it("does not add patch label when PR has minor upgrade", async () => {
    mockGetContentForUpgradeTests(configWithPatchFeature, HEAD_PKG_MINOR_UPGRADE);

    const { main } = await import("../index");
    await main();

    expect(mockAddLabels).not.toHaveBeenCalled();
  });
});
