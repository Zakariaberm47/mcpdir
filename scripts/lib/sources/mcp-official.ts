import { SyncSource, SourceType, SyncSourceOptions, SyncBatch, DiscoveredServer, delay, normalizeGitHubUrl, parseGitHubUrl } from "./base";

const GITHUB_API = "https://api.github.com";
const README_URL = "https://raw.githubusercontent.com/modelcontextprotocol/servers/main/README.md";

// Official MCP monorepos
const MONOREPOS = [
  {
    owner: "modelcontextprotocol",
    repo: "servers",
    path: "src",
    label: "reference",
  },
  {
    owner: "modelcontextprotocol",
    repo: "servers-archived",
    path: "src",
    label: "archived",
  },
];

interface GithubContent {
  name: string;
  path: string;
  type: "file" | "dir";
  url: string;
}

interface PackageJson {
  name?: string;
  description?: string;
  version?: string;
}

// Official MCP servers that live in the monorepo
// These don't have separate repos, so we need to parse them specially
export class McpOfficialSource extends SyncSource {
  // Using "github" as source type since these are from GitHub
  // but we'll mark them specially via sourceIdentifier
  readonly name: SourceType = "github";

  private async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "mcpdir-sync",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    for (let i = 0; i < retries; i++) {
      const res = await fetch(url, { headers });
      if (res.status === 403) {
        const resetHeader = res.headers.get("x-ratelimit-reset");
        if (resetHeader) {
          const resetTime = parseInt(resetHeader) * 1000;
          const waitTime = Math.max(resetTime - Date.now(), 60000);
          console.log(`  Rate limited, waiting ${Math.ceil(waitTime / 1000)}s...`);
          await delay(waitTime);
          continue;
        }
      }
      if (!res.ok && i < retries - 1) {
        await delay(1000 * (i + 1));
        continue;
      }
      return res;
    }
    throw new Error(`Failed to fetch ${url}`);
  }

  async *fetchServers(options: SyncSourceOptions): AsyncGenerator<SyncBatch> {
    console.log("Fetching official MCP servers from monorepos...");

    const servers: DiscoveredServer[] = [];
    let errors = 0;

    for (const monorepo of MONOREPOS) {
      console.log(`\n  Scanning ${monorepo.owner}/${monorepo.repo} (${monorepo.label})...`);

      // Get repo stats
      const repoRes = await this.fetchWithRetry(`${GITHUB_API}/repos/${monorepo.owner}/${monorepo.repo}`);
      const repoData = repoRes.ok ? await repoRes.json() : null;
      const repoStars = repoData?.stargazers_count || 0;
      const repoForks = repoData?.forks_count || 0;

      // Get list of directories
      const contentsUrl = `${GITHUB_API}/repos/${monorepo.owner}/${monorepo.repo}/contents/${monorepo.path}`;
      const contentsRes = await this.fetchWithRetry(contentsUrl);

      if (!contentsRes.ok) {
        console.error(`    Failed to fetch contents: ${contentsRes.status}`);
        errors++;
        continue;
      }

      const contents: GithubContent[] = await contentsRes.json();
      const serverDirs = contents.filter((c) => c.type === "dir");
      console.log(`    Found ${serverDirs.length} servers`);

      for (const dir of serverDirs) {
        if (options.limit && servers.length >= options.limit) break;

        try {
          // Fetch package.json for this server
          const pkgUrl = `${GITHUB_API}/repos/${monorepo.owner}/${monorepo.repo}/contents/${monorepo.path}/${dir.name}/package.json`;
          const pkgRes = await this.fetchWithRetry(pkgUrl);

          let name = dir.name;
          let description: string | undefined;
          let version: string | undefined;
          let npmPackage: string | undefined;

          if (pkgRes.ok) {
            const pkgFile = await pkgRes.json();
            if (pkgFile.content) {
              const pkgContent = Buffer.from(pkgFile.content, "base64").toString("utf-8");
              const pkg: PackageJson = JSON.parse(pkgContent);
              name = pkg.name || dir.name;
              description = pkg.description;
              version = pkg.version;
              // Official packages use @modelcontextprotocol scope
              if (name.startsWith("@modelcontextprotocol/")) {
                npmPackage = name;
              }
            }
          }

          await delay(100); // Rate limiting

          // Fetch README if exists
          const readmeUrl = `${GITHUB_API}/repos/${monorepo.owner}/${monorepo.repo}/contents/${monorepo.path}/${dir.name}/README.md`;
          const readmeRes = await this.fetchWithRetry(readmeUrl);
          let readmeContent: string | undefined;

          if (readmeRes.ok) {
            const readmeFile = await readmeRes.json();
            if (readmeFile.content) {
              readmeContent = Buffer.from(readmeFile.content, "base64").toString("utf-8");
              // Extract description from README if not in package.json
              if (!description && readmeContent) {
                // Remove HTML comments first
                const cleanedReadme = readmeContent.replace(/<!--[\s\S]*?-->/g, "").trim();
                // Find first paragraph after heading
                const firstPara = cleanedReadme.match(/^#[^\n]+\n+([^\n#]+)/s);
                if (firstPara) {
                  description = firstPara[1].trim().slice(0, 500);
                }
              }
            }
          }

          await delay(100);

          const monorepoUrl = `https://github.com/${monorepo.owner}/${monorepo.repo}`;
          const canonicalUrl = `${monorepoUrl}/tree/main/${monorepo.path}/${dir.name}`;

          const server: DiscoveredServer = {
            canonicalUrl,
            githubOwner: monorepo.owner,
            githubRepo: monorepo.repo,
            name: name.replace("@modelcontextprotocol/server-", "").replace("@modelcontextprotocol/", ""),
            description: description || `Official MCP ${dir.name} server`,
            version,
            npmPackage,
            installCommand: npmPackage ? `npx -y ${npmPackage}` : undefined,
            stars: repoStars,
            forks: repoForks,
            source: "github",
            sourceIdentifier: `mcp-official:${monorepo.label}:${dir.name}`,
            sourceUrl: canonicalUrl,
            sourceData: {
              isOfficial: true,
              monorepoLabel: monorepo.label,
              monorepoPath: `${monorepo.path}/${dir.name}`,
              readmeContent,
            },
          };

          servers.push(server);
          console.log(`    ✓ ${server.name} (${npmPackage || "no npm"})`);
        } catch (err) {
          console.error(`    ✗ Failed to process ${dir.name}:`, err);
          errors++;
        }
      }
    }

    console.log(`\n  Total: ${servers.length} official servers`);

    // Now parse Third-Party servers from README
    console.log("\n  Parsing Third-Party servers from README...");
    const thirdPartyServers = await this.parseThirdPartyFromReadme(options.limit ? options.limit - servers.length : undefined);

    // Filter out servers we already have from monorepos
    const existingUrls = new Set(servers.map(s => s.canonicalUrl));
    const newThirdParty = thirdPartyServers.filter(s => !existingUrls.has(s.canonicalUrl));

    servers.push(...newThirdParty);
    console.log(`    Added ${newThirdParty.length} third-party servers`);
    console.log(`\n  Grand total: ${servers.length} servers`);

    yield {
      servers,
      hasMore: false,
      stats: {
        fetched: servers.length,
        filtered: thirdPartyServers.length - newThirdParty.length,
        errors,
      },
    };
  }

  private async parseThirdPartyFromReadme(limit?: number): Promise<DiscoveredServer[]> {
    const servers: DiscoveredServer[] = [];

    const res = await fetch(README_URL);
    if (!res.ok) {
      console.error(`    Failed to fetch README: ${res.status}`);
      return servers;
    }

    const readme = await res.text();

    // Skip patterns - SDKs, tools, non-servers
    const skipPatterns = [
      /sdk$/i,
      /^mcp-/i, // General MCP tools
      /-sdk$/i,
      /^create-/i,
      /inspector/i,
    ];

    // Skip orgs that are just SDKs
    const skipOrgs = new Set([
      'modelcontextprotocol', // Their own repos are SDKs and tools, not third-party servers
    ]);

    // Parse markdown links with descriptions
    // Format: - **[Name](url)** - Description
    // Or: - [Name](url) - Description
    // The dash before is important to identify list items
    const lines = readme.split('\n');
    const seen = new Set<string>();

    for (const line of lines) {
      if (limit && servers.length >= limit) break;

      // Look for list items with GitHub links
      // Pattern: starts with - or *, has [Name](github-url), optionally followed by description
      const match = line.match(/^[-*]\s+(?:<[^>]+>\s*)?\*?\*?\[([^\]]+)\]\((https:\/\/github\.com\/[^)]+)\)\*?\*?\s*[-–—]?\s*(.*)/);
      if (!match) continue;

      const [, name, url, description] = match;

      // Skip non-repo URLs
      if (url.includes('/issues') || url.includes('/discussions') || url.includes('/tree/') || url.includes('#') || url.includes('?tab=')) {
        continue;
      }

      // Normalize URL
      const canonicalUrl = normalizeGitHubUrl(url);
      if (!canonicalUrl || seen.has(canonicalUrl)) continue;
      seen.add(canonicalUrl);

      const parsed = parseGitHubUrl(canonicalUrl);
      if (!parsed) continue;

      // Skip known SDK/tool orgs
      if (skipOrgs.has(parsed.owner.toLowerCase())) continue;

      // Skip if name matches skip patterns
      const cleanName = name.trim().replace(/^<img[^>]*>\s*/, '');
      if (skipPatterns.some(p => p.test(cleanName) || p.test(parsed.repo))) continue;

      // Clean description - remove markdown links and formatting
      let cleanDesc = description
        ?.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
        ?.replace(/<img[^>]*>/g, '')
        ?.replace(/\*\*/g, '')
        ?.replace(/\(by [^)]+\)/g, '') // Remove author attribution
        ?.trim()
        ?.slice(0, 500);

      // Skip if description looks like another link
      if (cleanDesc?.startsWith('[') || cleanDesc?.startsWith('http')) {
        cleanDesc = undefined;
      }

      servers.push({
        canonicalUrl,
        githubOwner: parsed.owner,
        githubRepo: parsed.repo,
        name: cleanName || parsed.repo,
        description: cleanDesc || undefined,
        source: "github",
        sourceIdentifier: `mcp-readme:${parsed.owner}/${parsed.repo}`,
        sourceUrl: canonicalUrl,
        sourceData: {
          fromReadme: true,
        },
      });
    }

    return servers;
  }
}
