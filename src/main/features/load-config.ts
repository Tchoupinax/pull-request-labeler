import type { getOctokit } from "@actions/github";

import yaml from "js-yaml";

import type { LabelerConfig } from "./types";

type Port = {
  octokit: ReturnType<typeof getOctokit>;
  owner: string;
  repo: string;
  ref: string;
  configPath?: string;
};

/**
 * Load and parse labeler config from the repo at the given ref.
 */
export async function loadConfig(port: Port): Promise<LabelerConfig | null> {
  const {
    octokit,
    owner,
    repo,
    ref,
    configPath,
  } = port;
  const path = configPath && configPath.trim() !== "" ? configPath : ".github/pull-request-labeler.yml";

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });
    if (Array.isArray(data) || !("content" in data)) {
      return null;
    }
    const content = data.content;
    if (typeof content !== "string") {
      return null;
    }
    const yamlStr = Buffer.from(content, "base64").toString("utf-8");
    const parsed = yaml.load(yamlStr);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (!Array.isArray((parsed as LabelerConfig).labels)) {
      return null;
    }

    return parsed as LabelerConfig;
  } catch {
    return null;
  }
}
