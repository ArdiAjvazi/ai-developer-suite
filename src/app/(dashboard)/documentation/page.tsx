import type { Metadata } from "next";
import { PlaceholderPage } from "@/shared/components/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Documentation",
};

export default function DocumentationPage() {
  return (
    <PlaceholderPage
      title="AI Documentation Generator"
      description="Turn modules and repositories into structured, developer-ready documentation."
      module="Documentation"
    />
  );
}
