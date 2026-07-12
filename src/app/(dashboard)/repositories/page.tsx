import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import {
  getRepositoryForUser,
  listRepositoriesForUser,
} from "@/features/repositories/services/import-repository";
import { RepositoriesWorkspace } from "@/features/repositories/components/repositories-workspace";

export const metadata: Metadata = {
  title: "Repository Import",
};

export default async function RepositoriesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const history = await listRepositoriesForUser(session.user.id);
  const latestId = history[0]?.id;
  const initialRepository = latestId
    ? await getRepositoryForUser(session.user.id, latestId)
    : null;

  return (
    <RepositoriesWorkspace
      initialHistory={history}
      initialRepository={initialRepository}
    />
  );
}
