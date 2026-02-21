import { beforeEach, describe, expect, it, vi } from "vitest";

import "../__tests__/integration-mocks";
import { setConfigLabelerAndPRContext } from "../__tests__/integration-helpers";
import {
  mockAddLabels,
  mockListLabelsOnIssue,
} from "../__tests__/integration-mocks";

describe("integration: author matcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddLabels.mockResolvedValue(undefined);
    mockListLabelsOnIssue.mockResolvedValue({ data: [] });
  });

  it("adds label when PR author is in list", async () => {
    setConfigLabelerAndPRContext(
      {
        labels: [{ label: "core-team", matcher: { author: ["alice", "bob"] } }],
      },
      { author: "alice" },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ["core-team"] }),
    );
  });

  it("does not add label when PR author is not in list", async () => {
    setConfigLabelerAndPRContext(
      {
        labels: [{ label: "core-team", matcher: { author: ["alice", "bob"] } }],
      },
      { author: "charlie" },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).not.toHaveBeenCalled();
  });
});
