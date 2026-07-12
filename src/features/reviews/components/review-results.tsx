"use client";

import { ReviewSummary } from "@/features/reviews/components/review-summary";
import { QualityBreakdown } from "@/features/reviews/components/quality-breakdown";
import { IssueCard } from "@/features/reviews/components/issue-card";
import { QuickActions } from "@/features/reviews/components/quick-actions";
import { ReviewMetadata } from "@/features/reviews/components/review-metadata";
import type { CodeReviewResult, ReviewIssue } from "@/features/reviews/types";

type ReviewResultsProps = {
  review: CodeReviewResult;
  reviewId: string;
  model: string | null;
  mock?: boolean;
  onApplyAllFixes: () => void;
  onApplyIssueFix: (issue: ReviewIssue) => void;
};

export function ReviewResults({
  review,
  reviewId,
  model,
  mock,
  onApplyAllFixes,
  onApplyIssueFix,
}: ReviewResultsProps) {
  return (
    <div className="space-y-8" aria-live="polite">
      <div className="space-y-3">
        <QuickActions
          review={review}
          reviewId={reviewId}
          model={model}
          onApplyFix={onApplyAllFixes}
        />
        <ReviewSummary review={review} mock={mock} />
      </div>

      <QualityBreakdown categories={review.categories} />

      <section className="space-y-3" aria-labelledby="findings-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="findings-heading" className="text-sm font-medium text-foreground">
            Findings & code diff
          </h2>
          <span className="text-xs text-muted-foreground">
            {review.issues.length} issue
            {review.issues.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="grid gap-4">
          {review.issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onApplyFix={onApplyIssueFix}
            />
          ))}
        </div>
      </section>

      <ReviewMetadata review={review} reviewId={reviewId} model={model} />
    </div>
  );
}
