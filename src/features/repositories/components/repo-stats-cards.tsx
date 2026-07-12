import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { RepoStatistics } from "@/features/repositories/types";
import {
  FileCode2,
  FolderTree,
  HardDrive,
  Languages,
  Package,
  Ruler,
} from "lucide-react";

type RepoStatsCardsProps = {
  statistics: RepoStatistics;
};

export function RepoStatsCards({ statistics }: RepoStatsCardsProps) {
  const items = [
    {
      label: "Files",
      value: statistics.files.toLocaleString(),
      icon: FileCode2,
    },
    {
      label: "Folders",
      value: statistics.folders.toLocaleString(),
      icon: FolderTree,
    },
    {
      label: "Lines of code",
      value: statistics.linesOfCode.toLocaleString(),
      icon: Ruler,
    },
    {
      label: "Dependencies",
      value: statistics.dependenciesCount.toLocaleString(),
      icon: Package,
    },
    {
      label: "Largest folder",
      value: statistics.largestFolder,
      icon: HardDrive,
    },
    {
      label: "Avg file size",
      value: `${statistics.averageFileSizeKb} KB`,
      icon: Languages,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="transition hover:border-zinc-600">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-xl font-semibold tracking-tight text-foreground">
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
