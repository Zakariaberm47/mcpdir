export * from "./base";
export { McpRegistrySource } from "./mcp-registry";
export { NpmSource } from "./npm";
export { GitHubSource } from "./github";
export { GlamaSource } from "./glama";
export { PulseMcpSource } from "./pulsemcp";
export { McpOfficialSource } from "./mcp-official";

import { SyncSource, SourceType } from "./base";
import { McpRegistrySource } from "./mcp-registry";
import { NpmSource } from "./npm";
import { GitHubSource } from "./github";
import { GlamaSource } from "./glama";
import { PulseMcpSource } from "./pulsemcp";
import { McpOfficialSource } from "./mcp-official";

// Extended source type including special sources
export type ExtendedSourceType = SourceType | "mcp-official";

const sources: Record<ExtendedSourceType, () => SyncSource> = {
  "mcp-registry": () => new McpRegistrySource(),
  npm: () => new NpmSource(),
  github: () => new GitHubSource(),
  glama: () => new GlamaSource(),
  pulsemcp: () => new PulseMcpSource(),
  "mcp-official": () => new McpOfficialSource(),
  pypi: () => {
    throw new Error("PyPI source not implemented yet");
  },
};

export function getSource(name: ExtendedSourceType): SyncSource {
  const factory = sources[name];
  if (!factory) {
    throw new Error(`Unknown source: ${name}`);
  }
  return factory();
}

export function getAllSources(): SyncSource[] {
  // MCP Official first to ensure official servers get priority
  return [new McpOfficialSource(), new McpRegistrySource(), new NpmSource(), new GitHubSource(), new GlamaSource(), new PulseMcpSource()];
}
