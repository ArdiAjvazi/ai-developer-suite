import type {
  RepositoryAnalysis,
  RepositoryHistoryItem,
  RepositoryRecord,
} from "@/features/repositories/types";
import type { FetchedRepositoryPayload } from "@/features/repositories/lib/mock-repository";

export function toRepositoryRecord(row: {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  htmlUrl: string;
  visibility: string;
  defaultBranch: string;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  license: string | null;
  sizeKb: number;
  lastCommitAt: Date | null;
  status: string;
  mock: boolean;
  createdAt: Date;
  syncedAt: Date | null;
  analysis: unknown;
}): RepositoryRecord {
  return {
    id: row.id,
    fullName: row.fullName,
    name: row.name,
    owner: row.owner,
    description: row.description,
    htmlUrl: row.htmlUrl,
    visibility: row.visibility,
    defaultBranch: row.defaultBranch,
    primaryLanguage: row.primaryLanguage,
    stars: row.stars,
    forks: row.forks,
    openIssues: row.openIssues,
    license: row.license,
    sizeKb: row.sizeKb,
    lastCommitAt: row.lastCommitAt?.toISOString() ?? null,
    status: row.status,
    mock: row.mock,
    createdAt: row.createdAt.toISOString(),
    syncedAt: row.syncedAt?.toISOString() ?? null,
    analysis: (row.analysis as RepositoryAnalysis | null) ?? null,
  };
}

export function toHistoryItem(row: {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  createdAt: Date;
  primaryLanguage: string | null;
  status: string;
  mock: boolean;
  analysis: unknown;
}): RepositoryHistoryItem {
  const analysis = row.analysis as RepositoryAnalysis | null;
  return {
    id: row.id,
    fullName: row.fullName,
    name: row.name,
    owner: row.owner,
    createdAt: row.createdAt.toISOString(),
    primaryLanguage: row.primaryLanguage,
    framework: analysis?.stack.framework ?? null,
    status: row.status,
    healthScore: analysis?.health.overall ?? null,
    mock: row.mock,
  };
}

export function payloadToPrismaData(
  userId: string,
  payload: FetchedRepositoryPayload,
) {
  return {
    userId,
    githubId: payload.githubId,
    fullName: payload.fullName,
    name: payload.name,
    owner: payload.owner,
    description: payload.description,
    htmlUrl: payload.htmlUrl,
    visibility: payload.visibility,
    defaultBranch: payload.defaultBranch,
    primaryLanguage: payload.primaryLanguage,
    stars: payload.stars,
    forks: payload.forks,
    openIssues: payload.openIssues,
    license: payload.license,
    sizeKb: payload.sizeKb,
    lastCommitAt: payload.lastCommitAt ? new Date(payload.lastCommitAt) : null,
    analysis: payload.analysis,
    status: "READY" as const,
    mock: payload.mock,
    syncedAt: new Date(),
  };
}
