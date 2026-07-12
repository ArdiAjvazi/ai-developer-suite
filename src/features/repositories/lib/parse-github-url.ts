import { GITHUB_URL_PATTERN } from "@/features/repositories/schemas/import-repository";

export type ParsedGitHubUrl = {
  owner: string;
  repo: string;
  fullName: string;
  htmlUrl: string;
};

export function parseGitHubUrl(raw: string): ParsedGitHubUrl | null {
  const trimmed = raw.trim().replace(/\/$/, "");
  const match = trimmed.match(GITHUB_URL_PATTERN);
  if (!match) return null;

  const owner = match[2];
  const repo = match[3].replace(/\.git$/i, "");
  if (!owner || !repo || owner.toLowerCase() === "orgs") return null;

  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
    htmlUrl: `https://github.com/${owner}/${repo}`,
  };
}

export class RepositoryImportError extends Error {
  code:
    | "INVALID_URL"
    | "NOT_FOUND"
    | "PRIVATE"
    | "RATE_LIMIT"
    | "NETWORK"
    | "UNKNOWN";

  constructor(
    code: RepositoryImportError["code"],
    message: string,
  ) {
    super(message);
    this.name = "RepositoryImportError";
    this.code = code;
  }
}

export function messageForImportError(error: unknown): string {
  if (error instanceof RepositoryImportError) return error.message;
  if (error instanceof Error) return error.message;
  return "Failed to import repository.";
}
