import { prisma } from "@/server/db/prisma";
import { fetchRepositoryByUrl } from "@/server/github";
import {
  payloadToPrismaData,
  toHistoryItem,
  toRepositoryRecord,
} from "@/features/repositories/services/mappers";
import type {
  RepositoryHistoryItem,
  RepositoryRecord,
} from "@/features/repositories/types";

export async function importRepositoryForUser(
  userId: string,
  url: string,
  options?: { forceMock?: boolean },
): Promise<RepositoryRecord> {
  const payload = await fetchRepositoryByUrl(url, options);
  const data = payloadToPrismaData(userId, payload);

  const row = await prisma.repository.upsert({
    where: {
      userId_fullName: {
        userId,
        fullName: payload.fullName,
      },
    },
    create: data,
    update: {
      githubId: data.githubId,
      name: data.name,
      owner: data.owner,
      description: data.description,
      htmlUrl: data.htmlUrl,
      visibility: data.visibility,
      defaultBranch: data.defaultBranch,
      primaryLanguage: data.primaryLanguage,
      stars: data.stars,
      forks: data.forks,
      openIssues: data.openIssues,
      license: data.license,
      sizeKb: data.sizeKb,
      lastCommitAt: data.lastCommitAt,
      analysis: data.analysis,
      status: data.status,
      mock: data.mock,
      syncedAt: data.syncedAt,
    },
  });

  return toRepositoryRecord(row);
}

export async function listRepositoriesForUser(
  userId: string,
  limit = 50,
): Promise<RepositoryHistoryItem[]> {
  const rows = await prisma.repository.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toHistoryItem);
}

export async function getRepositoryForUser(
  userId: string,
  id: string,
): Promise<RepositoryRecord | null> {
  const row = await prisma.repository.findFirst({
    where: { id, userId },
  });
  if (!row) return null;
  return toRepositoryRecord(row);
}

export async function deleteRepositoryForUser(
  userId: string,
  id: string,
): Promise<boolean> {
  const existing = await prisma.repository.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return false;
  await prisma.repository.delete({ where: { id: existing.id } });
  return true;
}

export async function refreshRepositoryForUser(
  userId: string,
  id: string,
): Promise<RepositoryRecord | null> {
  const existing = await prisma.repository.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;
  return importRepositoryForUser(userId, existing.htmlUrl);
}
