import type { Metadata } from "next";
import { PlaceholderPage } from "@/shared/components/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Code Review",
};

export default function ReviewsPage() {
  return (
    <PlaceholderPage
      title="AI Code Review"
      description="Analyze repositories and diffs for bugs, security issues, and maintainability improvements."
      module="Code Review"
    />
  );
}
