import { beforeEach, describe, expect, it, vi } from "vitest";

import "../__tests__/integration-mocks";
import { setConfigLabelerAndPRContext } from "../__tests__/integration-helpers";
import {
  mockAddLabels,
  mockListLabelsOnIssue,
} from "../__tests__/integration-mocks";

describe("integration: baseBranch matcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddLabels.mockResolvedValue(undefined);
    mockListLabelsOnIssue.mockResolvedValue({ data: [] });
  });

  it("adds label when base branch matches pattern", async () => {
    setConfigLabelerAndPRContext(
      {
        labels: [{ label: "to-develop", matcher: { baseBranch: "^develop$" } }],
      },
      { baseBranch: "develop" },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ["to-develop"] }),
    );
  });

  it("does not add label when base branch does not match", async () => {
    setConfigLabelerAndPRContext(
      {
        labels: [{ label: "to-develop", matcher: { baseBranch: "^develop$" } }],
      },
      { baseBranch: "main" },
    );
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).not.toHaveBeenCalled();
  });
});
