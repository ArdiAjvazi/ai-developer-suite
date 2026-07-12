export type RepoTreeNode = {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  children?: RepoTreeNode[];
};

export type RepoDependency = {
  name: string;
  version: string;
  purpose: string;
  manager: string;
};

export type DetectedRepoStack = {
  framework: string | null;
  frontend: string | null;
  backend: string | null;
  database: string | null;
  orm: string | null;
  authentication: string | null;
  packageManager: string | null;
  deployment: string | null;
  languages: string[];
};

export type RepoStatistics = {
  files: number;
  folders: number;
  linesOfCode: number;
  languagesUsed: Record<string, number>;
  dependenciesCount: number;
  largestFolder: string;
  averageFileSizeKb: number;
};

export type RepoHealthScores = {
  overall: number;
  architecture: number;
  security: number;
  maintainability: number;
  documentation: number;
  projectStructure: number;
  dependencyQuality: number;
};

export type RepositoryAnalysis = {
  stack: DetectedRepoStack;
  statistics: RepoStatistics;
  health: RepoHealthScores;
  tree: RepoTreeNode[];
  dependencies: RepoDependency[];
  summaryMarkdown: string;
};

export type RepositoryRecord = {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  htmlUrl: string;
  visibility: string;
  defaultBranch: string;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  license: string | null;
  sizeKb: number;
  lastCommitAt: string | null;
  status: string;
  mock: boolean;
  createdAt: string;
  syncedAt: string | null;
  analysis: RepositoryAnalysis | null;
};

export type RepositoryHistoryItem = {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  createdAt: string;
  primaryLanguage: string | null;
  framework: string | null;
  status: string;
  healthScore: number | null;
  mock: boolean;
};
