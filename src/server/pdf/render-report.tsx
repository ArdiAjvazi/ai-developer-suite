import { renderToBuffer } from "@react-pdf/renderer";
import { CodePilotReportDocument } from "@/server/pdf/report-document";
import { slugifyFilename } from "@/server/pdf/theme";
import type { PdfReportPayload } from "@/features/reports/types";

export async function renderReportPdf(
  report: PdfReportPayload,
): Promise<{ buffer: Buffer; filename: string }> {
  const buffer = await renderToBuffer(
    <CodePilotReportDocument report={report} />,
  );

  const filename = `${slugifyFilename(report.projectName) || "codepilot"}-${report.sourceType.toLowerCase()}-report.pdf`;

  return { buffer: Buffer.from(buffer), filename };
}
