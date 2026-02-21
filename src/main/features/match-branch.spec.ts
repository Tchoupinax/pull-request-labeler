import { beforeEach, describe, expect, it, vi } from "vitest";

import "../__tests__/integration-mocks";
import { setConfigLabelerAndPRContext } from "../__tests__/integration-helpers";
import {
  mockAddLabels,
  mockListLabelsOnIssue,
} from "../__tests__/integration-mocks";

describe("integration: branch matcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddLabels.mockResolvedValue(undefined);
    mockListLabelsOnIssue.mockResolvedValue({ data: [] });
  });

  it("adds label when head branch matches pattern", async () => {
    setConfigLabelerAndPRContext(
      { labels: [{ label: "feat", matcher: { branch: "^feat/" } }] },
      { headBranch: "feat/new-button" },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ["feat"] }),
    );
  });

  it("does not add label when head branch does not match", async () => {
    setConfigLabelerAndPRContext(
      { labels: [{ label: "feat", matcher: { branch: "^feat/" } }] },
      { headBranch: "main" },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).not.toHaveBeenCalled();
  });
});
