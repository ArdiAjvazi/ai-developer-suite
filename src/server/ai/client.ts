const PLACEHOLDER_KEYS = new Set([
  "",
  "sk-replace-me",
  "sk-...",
  "your-api-key",
  "replace-me",
]);

export function isOpenAiConfigured() {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  return apiKey.length > 0 && !PLACEHOLDER_KEYS.has(apiKey);
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResult = {
  content: string;
  model: string;
};

export async function createChatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; model?: string },
): Promise<ChatCompletionResult> {
  if (!isOpenAiConfigured()) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add a valid key to your .env file.",
    );
  }

  const apiKey = process.env.OPENAI_API_KEY!;
  const baseUrl = (
    process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model =
    options?.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: options?.temperature ?? 0.4,
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `AI provider error (${response.status}): ${detail.slice(0, 400)}`,
    );
  }

  const data = (await response.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("AI provider returned an empty response.");
  }

  return {
    content,
    model: data.model ?? model,
  };
}
