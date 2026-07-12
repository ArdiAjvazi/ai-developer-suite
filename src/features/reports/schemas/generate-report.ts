import { z } from "zod";

export const generateReportSchema = z.object({
  sourceType: z.enum(["REVIEW", "DOCS", "REPOSITORY"]),
  sourceId: z.string().trim().min(1, "sourceId is required."),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
