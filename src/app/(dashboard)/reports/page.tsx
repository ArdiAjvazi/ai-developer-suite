import type { Metadata } from "next";
import { PlaceholderPage } from "@/shared/components/ui/placeholder-page";

export const metadata: Metadata = {
  title: "PDF Reports",
};

export default function ReportsPage() {
  return (
    <PlaceholderPage
      title="Professional PDF Reports"
      description="Export branded PDF reports from code reviews and documentation artifacts."
      module="PDF Reports"
    />
  );
}
