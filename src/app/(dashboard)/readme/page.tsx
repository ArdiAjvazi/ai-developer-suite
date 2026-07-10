import type { Metadata } from "next";
import { ReadmeGenerator } from "@/features/readme/components/readme-generator";

export const metadata: Metadata = {
  title: "README Generator",
};

export default function ReadmePage() {
  return <ReadmeGenerator />;
}
