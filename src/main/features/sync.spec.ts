import { beforeEach, describe, expect, it, vi } from "vitest";

import "../__tests__/integration-mocks";
import { setConfigLabelerAndPRContext } from "../__tests__/integration-helpers";
import {
  mockAddLabels,
  mockListLabelsOnIssue,
  mockRemoveLabel,
} from "../__tests__/integration-mocks";

describe("integration: sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddLabels.mockResolvedValue(undefined);
    mockRemoveLabel.mockResolvedValue(undefined);
    mockListLabelsOnIssue.mockResolvedValue({ data: [] });
  });

  it("removes label when sync: true and matcher no longer matches", async () => {
    setConfigLabelerAndPRContext(
      {
        labels: [
          {
            label: "feat",
            sync: true,
            matcher: { title: "^feat:" },
          },
        ],
      },
      { title: "fix: something" },
    );
    mockListLabelsOnIssue.mockResolvedValue({
      data: [{ name: "feat" }],
    });
    const { main } = await import("../index");
    await main();
    expect(mockAddLabels).not.toHaveBeenCalled();
    expect(mockRemoveLabel).toHaveBeenCalledWith(
      expect.objectContaining({ name: "feat" }),
    );
  });
});
