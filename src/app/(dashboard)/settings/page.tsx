import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getSettingsSnapshot } from "@/features/settings/services/get-settings";
import { SettingsWorkspace } from "@/features/settings/components/settings-workspace";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const settings = await getSettingsSnapshot(session.user.id);
  if (!settings) {
    redirect("/login");
  }

  return <SettingsWorkspace initialSettings={settings} />;
}
