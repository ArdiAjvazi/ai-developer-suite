export type GeneratePdfSource =
  | { sourceType: "REVIEW"; sourceId: string }
  | { sourceType: "DOCS"; sourceId: string }
  | { sourceType: "REPOSITORY"; sourceId: string };

export async function downloadPdfReport(
  input: GeneratePdfSource,
): Promise<{ reportId: string; filename: string }> {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = "Failed to generate PDF report.";
    try {
      const data = (await response.json()) as { error?: string };
      message = data.error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? "codepilot-report.pdf";
  const reportId = response.headers.get("X-Report-Id") ?? "";

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);

  return { reportId, filename };
}
