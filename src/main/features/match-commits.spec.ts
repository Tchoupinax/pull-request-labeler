import { beforeEach, describe, expect, it, vi } from "vitest";

import "../__tests__/integration-mocks";
import { setConfigLabelerAndPRContext } from "../__tests__/integration-helpers";
import {
  mockAddLabels,
  mockListLabelsOnIssue,
} from "../__tests__/integration-mocks";

describe("integration: commits matcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddLabels.mockResolvedValue(undefined);
    mockListLabelsOnIssue.mockResolvedValue({ data: [] });
  });

  it("adds label when a commit message matches pattern", async () => {
    setConfigLabelerAndPRContext(
      { labels: [{ label: "feat", matcher: { commits: "^feat:" } }] },
      { commitMessages: ["feat: add button", "fix: lint"] },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ["feat"] }),
    );
  });

  it("does not add label when no commit message matches", async () => {
    setConfigLabelerAndPRContext(
      { labels: [{ label: "feat", matcher: { commits: "^feat:" } }] },
      { commitMessages: ["fix: typo"] },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).not.toHaveBeenCalled();
  });
});
