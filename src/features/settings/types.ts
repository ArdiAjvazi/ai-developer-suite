export type ConnectionStatus = "connected" | "invalid" | "never";

export type ApiKeyProvider = "openai" | "github" | "anthropic";

export type SettingsProfile = {
  name: string;
  email: string;
  username: string;
  image: string | null;
};

export type ApiKeyPublicState = {
  provider: ApiKeyProvider;
  masked: string | null;
  configured: boolean;
  status: ConnectionStatus;
  validatedAt: string | null;
};

export type AiPreferences = {
  aiProvider: "openai" | "anthropic";
  aiModel: string;
  temperature: number;
  maxTokens: number;
  language: string;
  reviewStyle: "strict" | "balanced" | "beginner";
};

export type AppearancePreferences = {
  theme: "dark" | "light" | "system";
  sidebarCollapsed: boolean;
  compactMode: boolean;
  animations: boolean;
  reducedMotion: boolean;
};

export type NotificationPreferences = {
  emailNotifications: boolean;
  notifyReviewCompleted: boolean;
  notifyRepoImported: boolean;
  notifySecurityAlerts: boolean;
  notifyWeeklyReports: boolean;
};

export type SessionInfo = {
  id: string;
  current: boolean;
  createdAt: string | null;
  expiresAt: string;
  label: string;
};

export type SettingsSnapshot = {
  profile: SettingsProfile;
  apiKeys: ApiKeyPublicState[];
  ai: AiPreferences;
  appearance: AppearancePreferences;
  notifications: NotificationPreferences;
  sessions: SessionInfo[];
};
