import type { Metadata } from "next";
import { PlaceholderPage } from "@/shared/components/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Manage profile, connected accounts, workspace preferences, and appearance."
      module="Settings"
    />
  );
}
