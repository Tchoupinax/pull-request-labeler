import { vi } from "vitest";

export const mockAddLabels = vi.fn();
export const mockRemoveLabel = vi.fn();
export const mockGetContent = vi.fn();
export const mockPullsGet = vi.fn();
export const mockReposGet = vi.fn();
export const mockPaginate = vi.fn();
export const mockListLabelsOnIssue = vi.fn();

vi.mock("@actions/core", () => ({
  getInput: vi.fn((name: string) =>
    name === "github-token" ? "fake-token" : "",
  ),
  info: vi.fn(),
  setFailed: vi.fn(),
}));

vi.mock("@actions/github", () => ({
  getOctokit: () => ({
    rest: {
      pulls: { get: mockPullsGet },
      repos: { get: mockReposGet, getContent: mockGetContent },
      issues: {
        addLabels: mockAddLabels,
        removeLabel: mockRemoveLabel,
        listLabelsOnIssue: mockListLabelsOnIssue,
      },
    },
    paginate: mockPaginate,
  }),
  context: {
    eventName: "pull_request",
    repo: { owner: "test-owner", repo: "test-repo" },
    issue: { number: 42 },
  },
}));
