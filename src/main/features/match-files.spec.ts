import { beforeEach, describe, expect, it, vi } from "vitest";

import "../__tests__/integration-mocks";
import { setConfigLabelerAndPRContext } from "../__tests__/integration-helpers";
import {
  mockAddLabels,
  mockListLabelsOnIssue,
} from "../__tests__/integration-mocks";

describe("integration: files matcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddLabels.mockResolvedValue(undefined);
    mockListLabelsOnIssue.mockResolvedValue({ data: [] });
  });

  it("adds label when changed files match 'any' glob", async () => {
    setConfigLabelerAndPRContext(
      {
        labels: [{ label: "app", matcher: { files: { any: ["app/**"] } } }],
      },
      { filePaths: ["app/components/Button.tsx", "README.md"] },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ["app"] }),
    );
  });

  it("does not add label when no file matches 'any' glob", async () => {
    setConfigLabelerAndPRContext(
      {
        labels: [{ label: "app", matcher: { files: { any: ["app/**"] } } }],
      },
      { filePaths: ["lib/utils.ts"] },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).not.toHaveBeenCalled();
  });

  it("adds label when all changed files match 'only' globs", async () => {
    setConfigLabelerAndPRContext(
      {
        labels: [
          {
            label: "CI/CD",
            matcher: { files: { only: [".github/**"] } },
          },
        ],
      },
      { filePaths: [".github/workflows/ci.yml", ".github/labeler.yml"] },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ["CI/CD"] }),
    );
  });

  it("does not add label when some changed files are outside 'only' globs", async () => {
    setConfigLabelerAndPRContext(
      {
        labels: [
          {
            label: "CI/CD",
            matcher: { files: { only: [".github/**"] } },
          },
        ],
      },
      { filePaths: [".github/workflows/ci.yml", "src/index.ts"] },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).not.toHaveBeenCalled();
  });

  it("adds label when file count is within gte/lte", async () => {
    setConfigLabelerAndPRContext(
      {
        labels: [
          {
            label: "small-pr",
            matcher: { files: { count: { gte: 1, lte: 5 } } },
          },
        ],
      },
      { filePaths: ["a.ts", "b.ts"] },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ["small-pr"] }),
    );
  });

  it("does not add label when file count outside range", async () => {
    setConfigLabelerAndPRContext(
      {
        labels: [
          {
            label: "small-pr",
            matcher: { files: { count: { lte: 2 } } },
          },
        ],
      },
      { filePaths: ["a.ts", "b.ts", "c.ts"] },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).not.toHaveBeenCalled();
  });
});
