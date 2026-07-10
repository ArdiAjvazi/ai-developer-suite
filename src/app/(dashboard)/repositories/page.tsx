import type { Metadata } from "next";
import { PlaceholderPage } from "@/shared/components/ui/placeholder-page";

export const metadata: Metadata = {
  title: "GitHub Import",
};

export default function RepositoriesPage() {
  return (
    <PlaceholderPage
      title="GitHub Repository Import"
      description="Connect GitHub and import repositories into your CodePilot workspace."
      module="GitHub Import"
    />
  );
}
