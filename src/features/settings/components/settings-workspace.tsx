"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Alert,
  Badge,
  Dialog,
  Separator,
  Slider,
  Switch,
  Tabs,
  ToastBanner,
} from "@/shared/components/ui/settings-primitives";
import {
  aiPreferencesSchema,
  appearanceSchema,
  changePasswordSchema,
  notificationsSchema,
  profileSchema,
  type ChangePasswordInput,
  type ProfileInput,
} from "@/features/settings/schemas/settings";
import type {
  ApiKeyProvider,
  ConnectionStatus,
  SettingsSnapshot,
} from "@/features/settings/types";
import { z } from "zod";

type SettingsWorkspaceProps = {
  initialSettings: SettingsSnapshot;
};

type ToastState = { message: string; tone: "success" | "error" | "info" } | null;

const TAB_ITEMS = [
  { value: "account", label: "Account" },
  { value: "api-keys", label: "API Keys" },
  { value: "ai", label: "AI Preferences" },
  { value: "appearance", label: "Appearance" },
  { value: "notifications", label: "Notifications" },
  { value: "security", label: "Security" },
];

function statusBadge(status: ConnectionStatus) {
  if (status === "connected")
    return <Badge tone="success">✔ Connected</Badge>;
  if (status === "invalid") return <Badge tone="danger">✖ Invalid</Badge>;
  return <Badge tone="warning">⚠ Never validated</Badge>;
}

export function SettingsWorkspace({ initialSettings }: SettingsWorkspaceProps) {
  const [tab, setTab] = useState("account");
  const [settings, setSettings] = useState(initialSettings);
  const [toast, setToast] = useState<ToastState>(null);
  const [pending, startTransition] = useTransition();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keyDrafts, setKeyDrafts] = useState({
    openai: "",
    github: "",
    anthropic: "",
  });
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [booting, setBooting] = useState(false);

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: settings.profile.name,
      email: settings.profile.email,
      username: settings.profile.username,
      image: settings.profile.image,
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const aiForm = useForm<z.infer<typeof aiPreferencesSchema>>({
    resolver: zodResolver(aiPreferencesSchema),
    defaultValues: settings.ai,
  });

  const appearanceForm = useForm<z.infer<typeof appearanceSchema>>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: settings.appearance,
  });

  const notificationsForm = useForm<z.infer<typeof notificationsSchema>>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: settings.notifications,
  });

  useEffect(() => {
    profileForm.reset({
      name: settings.profile.name,
      email: settings.profile.email,
      username: settings.profile.username,
      image: settings.profile.image,
    });
    aiForm.reset(settings.ai);
    appearanceForm.reset(settings.appearance);
    notificationsForm.reset(settings.notifications);
  }, [settings, profileForm, aiForm, appearanceForm, notificationsForm]);

  function showToast(message: string, tone: ToastState extends null ? never : NonNullable<ToastState>["tone"]) {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }

  async function parseJson(res: Response) {
    try {
      return (await res.json()) as {
        settings?: SettingsSnapshot;
        error?: string;
        message?: string;
        status?: ConnectionStatus;
      };
    } catch {
      return { error: "Unexpected server response." };
    }
  }

  function applySettings(next?: SettingsSnapshot) {
    if (next) setSettings(next);
  }

  async function saveProfile(values: ProfileInput) {
    startTransition(async () => {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        showToast(data.error ?? "Unable to update profile.", "error");
        return;
      }
      applySettings(data.settings);
      showToast(data.message ?? "Profile updated.", "success");
    });
  }

  async function savePreferences() {
    const ai = aiForm.getValues();
    const appearance = appearanceForm.getValues();
    const notifications = notificationsForm.getValues();
    startTransition(async () => {
      const res = await fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai, appearance, notifications }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        showToast(data.error ?? "Unable to save preferences.", "error");
        return;
      }
      applySettings(data.settings);
      showToast(data.message ?? "Preferences saved.", "success");
    });
  }

  async function saveApiKeys() {
    startTransition(async () => {
      const res = await fetch("/api/settings/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keyDrafts),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        showToast(data.error ?? "Unable to update API keys.", "error");
        return;
      }
      applySettings(data.settings);
      setKeyDrafts({ openai: "", github: "", anthropic: "" });
      showToast(data.message ?? "API keys updated.", "success");
    });
  }

  async function validateKey(provider: ApiKeyProvider) {
    startTransition(async () => {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        showToast(data.error ?? "Unable to validate API Key.", "error");
        return;
      }
      applySettings(data.settings);
      showToast(
        data.message ??
          (data.status === "connected"
            ? "Connection validated."
            : "Unable to validate API Key."),
        data.status === "connected" ? "success" : "error",
      );
    });
  }

  async function changePassword(values: ChangePasswordInput) {
    startTransition(async () => {
      const res = await fetch("/api/settings/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        showToast(data.error ?? "Unable to update password.", "error");
        return;
      }
      passwordForm.reset();
      showToast(data.message ?? "Password updated.", "success");
    });
  }

  async function logoutOthers() {
    setConfirmLogout(false);
    startTransition(async () => {
      const res = await fetch("/api/settings/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout-others" }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        showToast(data.error ?? "Unable to sign out other sessions.", "error");
        return;
      }
      applySettings(data.settings);
      showToast(data.message ?? "Other sessions signed out.", "success");
    });
  }

  function onAvatarSelected(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.", "error");
      return;
    }
    if (file.size > 250_000) {
      showToast("Avatar must be under 250KB.", "error");
      return;
    }
    setBooting(true);
    const reader = new FileReader();
    reader.onload = () => {
      profileForm.setValue("image", String(reader.result), {
        shouldDirty: true,
        shouldValidate: true,
      });
      setBooting(false);
    };
    reader.readAsDataURL(file);
  }

  const avatarPreview = profileForm.watch("image");
  const temperature = aiForm.watch("temperature");

  const keyRows = useMemo(
    () =>
      settings.apiKeys.map((item) => ({
        ...item,
        label:
          item.provider === "openai"
            ? "OpenAI API Key"
            : item.provider === "github"
              ? "GitHub Personal Access Token"
              : "Anthropic API Key",
        draftKey: item.provider,
      })),
    [settings.apiKeys],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account, AI providers, appearance, notifications, and security."
      />

      <Tabs value={tab} onValueChange={setTab} items={TAB_ITEMS} />

      {tab === "account" ? (
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Profile details and avatar</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={profileForm.handleSubmit(saveProfile)}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-elevated">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">No avatar</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-elevated px-3 text-xs font-medium">
                    <Upload className="h-3.5 w-3.5" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) =>
                        onAvatarSelected(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      profileForm.setValue("image", null, {
                        shouldDirty: true,
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" {...profileForm.register("name")} />
                  {profileForm.formState.errors.name ? (
                    <p className="text-xs text-red-300">
                      {profileForm.formState.errors.name.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" {...profileForm.register("username")} />
                  {profileForm.formState.errors.username ? (
                    <p className="text-xs text-red-300">
                      {profileForm.formState.errors.username.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" {...profileForm.register("email")} />
                  {profileForm.formState.errors.email ? (
                    <p className="text-xs text-red-300">
                      {profileForm.formState.errors.email.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <Button type="submit" disabled={pending || booting}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {tab === "api-keys" ? (
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Keys are encrypted at rest. Stored values are never returned in full.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert>
              Paste a new key to rotate it. Existing keys stay masked as
              sk-****************************XXXX.
            </Alert>
            {keyRows.map((row) => (
              <div
                key={row.provider}
                className="space-y-3 rounded-xl border border-border bg-elevated/30 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{row.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.configured
                        ? row.masked
                        : "Not configured"}
                      {row.validatedAt
                        ? ` · Last validated ${new Date(row.validatedAt).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  {statusBadge(row.status)}
                </div>
                <div className="flex gap-2">
                  <Input
                    type={showKeys[row.provider] ? "text" : "password"}
                    placeholder={
                      row.configured
                        ? "Enter a new key to rotate…"
                        : "Paste API key…"
                    }
                    value={keyDrafts[row.provider]}
                    onChange={(event) =>
                      setKeyDrafts((prev) => ({
                        ...prev,
                        [row.provider]: event.target.value,
                      }))
                    }
                    aria-label={row.label}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={showKeys[row.provider] ? "Hide key" : "Show key"}
                    onClick={() =>
                      setShowKeys((prev) => ({
                        ...prev,
                        [row.provider]: !prev[row.provider],
                      }))
                    }
                  >
                    {showKeys[row.provider] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending || !row.configured}
                  onClick={() => void validateKey(row.provider)}
                >
                  Validate connection
                </Button>
              </div>
            ))}
            <Button type="button" disabled={pending} onClick={() => void saveApiKeys()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save API keys
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {tab === "ai" ? (
        <Card>
          <CardHeader>
            <CardTitle>AI Preferences</CardTitle>
            <CardDescription>Defaults used across CodePilot AI modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="aiProvider">Default AI provider</Label>
                <Select
                  id="aiProvider"
                  value={aiForm.watch("aiProvider")}
                  onChange={(event) =>
                    aiForm.setValue(
                      "aiProvider",
                      event.target.value as "openai" | "anthropic",
                      { shouldDirty: true },
                    )
                  }
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aiModel">Default model</Label>
                <Select
                  id="aiModel"
                  value={aiForm.watch("aiModel")}
                  onChange={(event) =>
                    aiForm.setValue("aiModel", event.target.value, {
                      shouldDirty: true,
                    })
                  }
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-5">GPT-5</option>
                  <option value="gpt-5-mini">GPT-5 Mini</option>
                  <option value="claude-sonnet-4">Claude Sonnet</option>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="temperature">
                  Temperature ({temperature.toFixed(1)})
                </Label>
                <Slider
                  id="temperature"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  label="Temperature"
                  onValueChange={(value) =>
                    aiForm.setValue("temperature", value, { shouldDirty: true })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxTokens">Max tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min={256}
                  max={128000}
                  {...aiForm.register("maxTokens", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language">Language preference</Label>
                <Select
                  id="language"
                  value={aiForm.watch("language")}
                  onChange={(event) =>
                    aiForm.setValue("language", event.target.value, {
                      shouldDirty: true,
                    })
                  }
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="pt">Portuguese</option>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="reviewStyle">Code review style</Label>
                <Select
                  id="reviewStyle"
                  value={aiForm.watch("reviewStyle")}
                  onChange={(event) =>
                    aiForm.setValue(
                      "reviewStyle",
                      event.target.value as "strict" | "balanced" | "beginner",
                      { shouldDirty: true },
                    )
                  }
                >
                  <option value="strict">Strict</option>
                  <option value="balanced">Balanced</option>
                  <option value="beginner">Beginner Friendly</option>
                </Select>
              </div>
            </div>
            <Button type="button" disabled={pending} onClick={() => void savePreferences()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save AI preferences
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {tab === "appearance" ? (
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Theme and interface density</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="theme">Theme</Label>
              <Select
                id="theme"
                value={appearanceForm.watch("theme")}
                onChange={(event) =>
                  appearanceForm.setValue(
                    "theme",
                    event.target.value as "dark" | "light" | "system",
                    { shouldDirty: true },
                  )
                }
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </Select>
            </div>
            {(
              [
                ["sidebarCollapsed", "Sidebar collapsed"],
                ["compactMode", "Compact mode"],
                ["animations", "Animations"],
                ["reducedMotion", "Reduced motion"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-elevated/30 px-3 py-3"
              >
                <Label htmlFor={key}>{label}</Label>
                <Switch
                  id={key}
                  label={label}
                  checked={appearanceForm.watch(key)}
                  onCheckedChange={(checked) =>
                    appearanceForm.setValue(key, checked, { shouldDirty: true })
                  }
                />
              </div>
            ))}
            <Button type="button" disabled={pending} onClick={() => void savePreferences()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save appearance
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {tab === "notifications" ? (
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose what CodePilot AI emails you about</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                ["emailNotifications", "Email notifications"],
                ["notifyReviewCompleted", "Review completed"],
                ["notifyRepoImported", "Repository imported"],
                ["notifySecurityAlerts", "Security alerts"],
                ["notifyWeeklyReports", "Weekly reports"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-border bg-elevated/30 px-3 py-3"
              >
                <Label htmlFor={key}>{label}</Label>
                <Switch
                  id={key}
                  label={label}
                  checked={notificationsForm.watch(key)}
                  onCheckedChange={(checked) =>
                    notificationsForm.setValue(key, checked, {
                      shouldDirty: true,
                    })
                  }
                />
              </div>
            ))}
            <Button type="button" disabled={pending} onClick={() => void savePreferences()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save notifications
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {tab === "security" ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Change password
              </CardTitle>
              <CardDescription>
                Use a strong password with mixed case, numbers, and symbols
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={passwordForm.handleSubmit(changePassword)}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    {...passwordForm.register("currentPassword")}
                  />
                  {passwordForm.formState.errors.currentPassword ? (
                    <p className="text-xs text-red-300">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    {...passwordForm.register("newPassword")}
                  />
                  {passwordForm.formState.errors.newPassword ? (
                    <p className="text-xs text-red-300">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...passwordForm.register("confirmPassword")}
                  />
                  {passwordForm.formState.errors.confirmPassword ? (
                    <p className="text-xs text-red-300">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>
                <Button type="submit" disabled={pending}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Update password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active sessions</CardTitle>
              <CardDescription>
                Review devices and revoke other sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.sessions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No sessions to display.
                </p>
              ) : (
                settings.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-elevated/30 px-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {session.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires {new Date(session.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    {session.current ? (
                      <Badge tone="success">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Current
                      </Badge>
                    ) : null}
                  </div>
                ))
              )}
              <Separator />
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => setConfirmLogout(true)}
              >
                Log out other devices
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {pending && tab !== "account" && tab !== "security" ? (
        <div className="grid gap-2 sm:grid-cols-3" aria-hidden>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}

      <Dialog
        open={confirmLogout}
        title="Sign out other devices?"
        description="This revokes stored sessions for your account. Your current session stays active."
        onClose={() => setConfirmLogout(false)}
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setConfirmLogout(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void logoutOthers()}>
            Confirm
          </Button>
        </div>
      </Dialog>

      {toast ? (
        <ToastBanner
          message={toast.message}
          tone={toast.tone}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
