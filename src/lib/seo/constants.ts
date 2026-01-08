export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mcpdir.dev";

export const SITE_CONFIG = {
  name: "MCP Hub",
  tagline: "The registry for Model Context Protocol servers",
  description:
    "Discover and explore MCP servers. The npm/Docker Hub for Model Context Protocol — find AI integrations for databases, APIs, file systems, and dev tools.",
  url: SITE_URL,
  twitterHandle: "@mcphub",
  locale: "en_US",
  themeColor: "#06b6d4",
  backgroundColor: "#0a0a0f",
} as const;

export const KEYWORDS = {
  global: [
    "MCP",
    "Model Context Protocol",
    "MCP servers",
    "AI integrations",
    "LLM tools",
    "Claude tools",
    "AI development",
    "MCP registry",
  ],
  servers: ["MCP server", "AI tool", "LLM integration", "Claude integration", "AI assistant tools"],
  categories: ["MCP categories", "AI tools by type", "MCP server types"],
} as const;
