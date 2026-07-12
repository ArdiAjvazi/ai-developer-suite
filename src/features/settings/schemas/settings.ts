import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name is too long."),
  email: z.string().trim().email("Enter a valid email address.").max(160),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username is too long.")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username may only contain letters, numbers, underscores, and hyphens.",
    ),
  image: z
    .string()
    .nullable()
    .optional()
    .refine(
      (value) =>
        value == null ||
        value === "" ||
        value.startsWith("data:image/") ||
        value.startsWith("https://"),
      "Avatar must be an image upload or HTTPS URL.",
    ),
});

export const apiKeysSchema = z.object({
  openai: z
    .string()
    .trim()
    .max(200)
    .optional()
    .refine(
      (v) => !v || v.length === 0 || v.startsWith("sk-") || v.includes("•"),
      "OpenAI keys should start with sk-.",
    ),
  github: z.string().trim().max(200).optional(),
  anthropic: z
    .string()
    .trim()
    .max(200)
    .optional()
    .refine(
      (v) => !v || v.length === 0 || v.startsWith("sk-ant-") || v.includes("•"),
      "Anthropic keys should start with sk-ant-.",
    ),
});

export const validateKeySchema = z.object({
  provider: z.enum(["openai", "github", "anthropic"]),
});

export const aiPreferencesSchema = z.object({
  aiProvider: z.enum(["openai", "anthropic"]),
  aiModel: z.string().trim().min(1).max(80),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(256).max(128000),
  language: z.string().trim().min(2).max(32),
  reviewStyle: z.enum(["strict", "balanced", "beginner"]),
});

export const appearanceSchema = z.object({
  theme: z.enum(["dark", "light", "system"]),
  sidebarCollapsed: z.boolean(),
  compactMode: z.boolean(),
  animations: z.boolean(),
  reducedMotion: z.boolean(),
});

export const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  notifyReviewCompleted: z.boolean(),
  notifyRepoImported: z.boolean(),
  notifySecurityAlerts: z.boolean(),
  notifyWeeklyReports: z.boolean(),
});

export const preferencesSchema = z.object({
  ai: aiPreferencesSchema,
  appearance: appearanceSchema,
  notifications: notificationsSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required."),
    newPassword: z
      .string()
      .min(10, "Password must be at least 10 characters.")
      .max(128)
      .regex(/[A-Z]/, "Include at least one uppercase letter.")
      .regex(/[a-z]/, "Include at least one lowercase letter.")
      .regex(/[0-9]/, "Include at least one number.")
      .regex(/[^A-Za-z0-9]/, "Include at least one special character."),
    confirmPassword: z.string().min(10),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ProfileInput = z.infer<typeof profileSchema>;
export type ApiKeysInput = z.infer<typeof apiKeysSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
