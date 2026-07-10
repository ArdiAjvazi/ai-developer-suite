import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  FileText,
  FolderGit2,
  LayoutDashboard,
  ScanSearch,
  Settings,
  FileDown,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const mainNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview and quick actions",
  },
  {
    title: "Code Review",
    href: "/reviews",
    icon: ScanSearch,
    description: "AI-powered code analysis",
  },
  {
    title: "Documentation",
    href: "/documentation",
    icon: BookOpen,
    description: "Generate structured docs",
  },
  {
    title: "README Generator",
    href: "/readme",
    icon: FileText,
    description: "Craft polished READMEs",
  },
  {
    title: "GitHub Import",
    href: "/repositories",
    icon: FolderGit2,
    description: "Import and sync repositories",
  },
  {
    title: "PDF Reports",
    href: "/reports",
    icon: FileDown,
    description: "Professional PDF exports",
  },
];

export const secondaryNav: NavItem[] = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Workspace and preferences",
  },
];
