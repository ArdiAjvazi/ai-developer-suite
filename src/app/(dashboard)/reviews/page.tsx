import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listReviewHistoryForUser } from "@/features/reviews/services/list-reviews";
import { CodeReviewWorkspace } from "@/features/reviews/components/code-review-workspace";

export const metadata: Metadata = {
  title: "Code Review",
};

export default async function ReviewsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const history = await listReviewHistoryForUser(session.user.id);

  return <CodeReviewWorkspace initialHistory={history} />;
}
