import type { FilesMatcher } from "../types/files-matcher";

export type MatcherConfig = {
  title?: string;
  body?: string;
  comment?: string;
  branch?: string;
  baseBranch?: string;
  commits?: string;
  author?: string[];
  files?: FilesMatcher;
};

export type LabelConfig = {
  label: string;
  sync?: boolean;
  matcher: MatcherConfig;
};

export type AutomaticFeatures = {
  majorPackagesUpgradedTriggersMajorLabel?: boolean;
  minorPackagesUpgradedTriggersMinorLabel?: boolean;
  patchPackagesUpgradedTriggersPatchLabel?: boolean;
};

export type LabelerConfig = {
  version?: string;
  automaticFeatures?: AutomaticFeatures;
  labelsNames?: {
    semverMajor?: string;
    semverMinor?: string;
    semverPatch?: string;
  };
  labels: LabelConfig[];
  checks?: Array<{
    context: string;
    url?: string;
    description?: { success?: string; failure?: string };
    labels: { any?: string[]; all?: string[] };
  }>;
};

/**
 * PR context: data needed by all matchers (fetched once).
 */
export type PRContext = {
  title: string;
  body: string | null;
  author: string;
  headBranch: string;
  baseBranch: string;
  filePaths: string[];
  comments: string[];
  commitMessages: string[];
};
