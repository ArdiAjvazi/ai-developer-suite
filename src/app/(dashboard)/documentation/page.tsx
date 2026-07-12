import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listDocsHistoryForUser } from "@/features/documentation/services/list-docs";
import { DocsWorkspace } from "@/features/documentation/components/docs-workspace";

export const metadata: Metadata = {
  title: "Documentation",
};

export default async function DocumentationPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const history = await listDocsHistoryForUser(session.user.id);

  return <DocsWorkspace initialHistory={history} />;
}
