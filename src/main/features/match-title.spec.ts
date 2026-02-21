import { beforeEach, describe, expect, it, vi } from "vitest";

import "../__tests__/integration-mocks";
import { setConfigLabelerAndPRContext } from "../__tests__/integration-helpers";
import {
  mockAddLabels,
  mockListLabelsOnIssue,
} from "../__tests__/integration-mocks";

describe("integration: title matcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddLabels.mockResolvedValue(undefined);
    mockListLabelsOnIssue.mockResolvedValue({ data: [] });
  });

  it("adds label when PR title matches pattern", async () => {
    setConfigLabelerAndPRContext(
      { labels: [{ label: "feat", matcher: { title: "^feat:" } }] },
      { title: "feat: add option to get config from another repository" },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ["feat"] }),
    );
  });

  it("does not add label when PR title does not match", async () => {
    setConfigLabelerAndPRContext(
      { labels: [{ label: "feat", matcher: { title: "^feat:" } }] },
      { title: "fix: typo" },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).not.toHaveBeenCalled();
  });
});
