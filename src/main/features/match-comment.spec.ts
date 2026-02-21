import { beforeEach, describe, expect, it, vi } from "vitest";

import "../__tests__/integration-mocks";
import { setConfigLabelerAndPRContext } from "../__tests__/integration-helpers";
import {
  mockAddLabels,
  mockListLabelsOnIssue,
} from "../__tests__/integration-mocks";

describe("integration: comment matcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddLabels.mockResolvedValue(undefined);
    mockListLabelsOnIssue.mockResolvedValue({ data: [] });
  });

  it("adds label when a comment matches pattern", async () => {
    setConfigLabelerAndPRContext(
      { labels: [{ label: "approved", matcher: { comment: "/LGTM/" } }] },
      { comments: ["Looks good!", "LGTM"] },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ["approved"] }),
    );
  });

  it("does not add label when no comment matches", async () => {
    setConfigLabelerAndPRContext(
      { labels: [{ label: "approved", matcher: { comment: "/LGTM/" } }] },
      { comments: ["Not yet"] },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).not.toHaveBeenCalled();
  });
});
