import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listReadmeHistoryForUser } from "@/features/readme/services/list-readmes";
import { ReadmeWorkspace } from "@/features/readme/components/readme-workspace";

export const metadata: Metadata = {
  title: "README Generator",
};

export default async function ReadmePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const history = await listReadmeHistoryForUser(session.user.id);

  return <ReadmeWorkspace initialHistory={history} />;
}
