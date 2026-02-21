import { beforeEach, describe, expect, it, vi } from "vitest";

import "../__tests__/integration-mocks";
import { setConfigLabelerAndPRContext } from "../__tests__/integration-helpers";
import {
  mockAddLabels,
  mockListLabelsOnIssue,
} from "../__tests__/integration-mocks";

describe("integration: body matcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddLabels.mockResolvedValue(undefined);
    mockListLabelsOnIssue.mockResolvedValue({ data: [] });
  });

  it("adds label when PR body matches pattern", async () => {
    setConfigLabelerAndPRContext(
      { labels: [{ label: "docs", matcher: { body: "/documentation/" } }] },
      { title: "Update", body: "This adds documentation for API." },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ["docs"] }),
    );
  });

  it("does not add label when body does not match", async () => {
    setConfigLabelerAndPRContext(
      { labels: [{ label: "docs", matcher: { body: "/documentation/" } }] },
      { body: "Just a fix." },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).not.toHaveBeenCalled();
  });
});
