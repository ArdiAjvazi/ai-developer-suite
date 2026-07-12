import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { listReportHistoryForUser } from "@/features/reports/services/generate-report";
import { listReviewHistoryForUser } from "@/features/reviews/services/list-reviews";
import { listDocsHistoryForUser } from "@/features/documentation/services/list-docs";
import { listRepositoriesForUser } from "@/features/repositories/services/import-repository";
import { ReportsWorkspace } from "@/features/reports/components/reports-workspace";
import type { ReportSourceType } from "@/features/reports/types";

export const metadata: Metadata = {
  title: "PDF Reports",
};

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const repoId = firstParam(params.id) ?? firstParam(params.repoId);
  const source = firstParam(params.source)?.toUpperCase();

  let initialSourceType: ReportSourceType = "REVIEW";
  let initialSourceId = "";

  if (repoId) {
    initialSourceType = "REPOSITORY";
    initialSourceId = repoId;
  } else if (source === "DOCS" || source === "REVIEW" || source === "REPOSITORY") {
    initialSourceType = source;
    initialSourceId = firstParam(params.sourceId) ?? "";
  }

  const [history, reviews, docs, repositories] = await Promise.all([
    listReportHistoryForUser(session.user.id),
    listReviewHistoryForUser(session.user.id),
    listDocsHistoryForUser(session.user.id),
    listRepositoriesForUser(session.user.id),
  ]);

  if (!initialSourceId && initialSourceType === "REPOSITORY" && repositories[0]) {
    initialSourceId = repositories[0].id;
  }

  return (
    <ReportsWorkspace
      initialHistory={history}
      reviews={reviews}
      docs={docs}
      repositories={repositories}
      initialSourceType={initialSourceType}
      initialSourceId={initialSourceId}
    />
  );
}
