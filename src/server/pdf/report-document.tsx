import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PdfReportPayload, ReportSectionBlock } from "@/features/reports/types";
import { formatReportDate, pdfTheme, scoreColor } from "@/server/pdf/theme";

const styles = StyleSheet.create({
  page: {
    backgroundColor: pdfTheme.pageBg,
    color: pdfTheme.text,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 40,
  },
  coverPage: {
    backgroundColor: pdfTheme.pageBg,
    color: pdfTheme.text,
    fontFamily: "Helvetica",
    padding: 48,
    justifyContent: "space-between",
  },
  brand: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: pdfTheme.muted,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: pdfTheme.brand,
    marginTop: 18,
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 12,
    color: pdfTheme.muted,
    marginBottom: 28,
  },
  coverMetaCard: {
    backgroundColor: pdfTheme.cardBg,
    borderColor: pdfTheme.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metaLabel: {
    fontSize: 9,
    color: pdfTheme.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 11,
    color: pdfTheme.text,
    fontFamily: "Helvetica-Bold",
    maxWidth: "70%",
    textAlign: "right",
  },
  scoreHero: {
    marginTop: 28,
    backgroundColor: pdfTheme.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: pdfTheme.border,
    padding: 20,
    alignItems: "flex-start",
  },
  scoreValue: {
    fontSize: 42,
    fontFamily: "Helvetica-Bold",
  },
  scoreCaption: {
    fontSize: 10,
    color: pdfTheme.muted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    color: pdfTheme.text,
  },
  card: {
    backgroundColor: pdfTheme.cardBg,
    borderColor: pdfTheme.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  paragraph: {
    lineHeight: 1.5,
    color: pdfTheme.accent,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricChip: {
    width: "48%",
    backgroundColor: pdfTheme.elevated,
    borderRadius: 6,
    padding: 10,
    marginBottom: 4,
  },
  scoreRow: {
    marginBottom: 10,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  barTrack: {
    height: 6,
    backgroundColor: pdfTheme.elevated,
    borderRadius: 99,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 99,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: pdfTheme.elevated,
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.border,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.border,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableCell: {
    flexGrow: 1,
    flexBasis: 0,
    fontSize: 8,
    color: pdfTheme.accent,
    paddingRight: 4,
  },
  tableCellHeader: {
    flexGrow: 1,
    flexBasis: 0,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: pdfTheme.muted,
    textTransform: "uppercase",
    paddingRight: 4,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 4,
    gap: 6,
  },
  bulletDot: {
    width: 4,
    height: 4,
    marginTop: 4,
    borderRadius: 99,
    backgroundColor: pdfTheme.info,
  },
  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: pdfTheme.muted,
    borderTopWidth: 1,
    borderTopColor: pdfTheme.border,
    paddingTop: 8,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: pdfTheme.elevated,
    color: pdfTheme.warning,
    fontSize: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 12,
  },
});

function PageFooter({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>CodePilot AI · {formatReportDate(generatedAt)}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

function ScoreBars({ scores }: { scores: PdfReportPayload["scores"] }) {
  if (!scores.length) {
    return <Text style={styles.paragraph}>No score breakdown available.</Text>;
  }

  return (
    <View>
      {scores.map((row) => (
        <View key={row.label} style={styles.scoreRow} wrap={false}>
          <View style={styles.scoreHeader}>
            <Text>{row.label}</Text>
            <Text style={{ color: scoreColor(row.score) }}>{row.score}/100</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.max(0, Math.min(100, row.score))}%`,
                  backgroundColor: scoreColor(row.score),
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function SectionBlock({ block }: { block: ReportSectionBlock }) {
  if (block.kind === "paragraph") {
    return (
      <View style={styles.card} wrap={false}>
        {block.title ? <Text style={styles.sectionTitle}>{block.title}</Text> : null}
        <Text style={styles.paragraph}>{block.text}</Text>
      </View>
    );
  }

  if (block.kind === "bullets") {
    return (
      <View style={styles.card}>
        {block.title ? <Text style={styles.sectionTitle}>{block.title}</Text> : null}
        {block.items.map((item) => (
          <View key={item} style={styles.bulletItem} wrap={false}>
            <View style={styles.bulletDot} />
            <Text style={[styles.paragraph, { flex: 1 }]}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (block.kind === "code") {
    return (
      <View style={styles.card} wrap={false}>
        {block.title ? <Text style={styles.sectionTitle}>{block.title}</Text> : null}
        <Text style={{ fontFamily: "Courier", fontSize: 8, color: pdfTheme.accent }}>
          {block.code.slice(0, 1800)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {block.title ? <Text style={styles.sectionTitle}>{block.title}</Text> : null}
      <View style={styles.tableHeader} wrap={false}>
        {block.headers.map((header) => (
          <Text key={header} style={styles.tableCellHeader}>
            {header}
          </Text>
        ))}
      </View>
      {block.rows.map((row, index) => (
        <View key={`${index}-${row[0]}`} style={styles.tableRow} wrap={false}>
          {row.map((cell, cellIndex) => (
            <Text key={`${cellIndex}-${cell}`} style={styles.tableCell}>
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function CodePilotReportDocument({
  report,
}: {
  report: PdfReportPayload;
}) {
  return (
    <Document
      title={`${report.title} — ${report.projectName}`}
      author="CodePilot AI"
      subject={report.subtitle}
      creator="CodePilot AI"
    >
      <Page size="A4" style={styles.coverPage}>
        <View>
          <Text style={styles.brand}>CodePilot AI</Text>
          <Text style={styles.coverTitle}>{report.title}</Text>
          <Text style={styles.coverSubtitle}>{report.subtitle}</Text>
          <View style={styles.coverMetaCard}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Project</Text>
              <Text style={styles.metaValue}>{report.projectName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Owner / Context</Text>
              <Text style={styles.metaValue}>{report.owner}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Generated</Text>
              <Text style={styles.metaValue}>
                {formatReportDate(report.generatedAt)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Source</Text>
              <Text style={styles.metaValue}>{report.sourceType}</Text>
            </View>
          </View>
          {report.overallScore != null ? (
            <View style={styles.scoreHero}>
              <Text
                style={[
                  styles.scoreValue,
                  { color: scoreColor(report.overallScore) },
                ]}
              >
                {report.overallScore}
              </Text>
              <Text style={styles.scoreCaption}>Overall health / quality score</Text>
            </View>
          ) : null}
          {report.mock ? <Text style={styles.badge}>Mock analysis mode</Text> : null}
        </View>
        <Text style={{ fontSize: 9, color: pdfTheme.muted }}>
          Professional developer report generated by CodePilot AI
        </Text>
        <PageFooter generatedAt={report.generatedAt} />
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.sectionTitle}>Project metrics</Text>
        <View style={[styles.card, styles.metricsGrid]}>
          {report.metrics.map((metric) => (
            <View key={metric.label} style={styles.metricChip} wrap={false}>
              <Text style={styles.metaLabel}>{metric.label}</Text>
              <Text style={{ marginTop: 4, fontFamily: "Helvetica-Bold" }}>
                {String(metric.value)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Health scores</Text>
        <View style={styles.card}>
          <ScoreBars scores={report.scores} />
        </View>

        <Text style={styles.sectionTitle}>Executive summary</Text>
        <View style={styles.card} wrap={false}>
          <Text style={styles.paragraph}>{report.executiveSummary}</Text>
        </View>

        <PageFooter generatedAt={report.generatedAt} />
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.sectionTitle}>Detailed breakdown</Text>
        {report.sections.map((block, index) => (
          <SectionBlock key={`${block.kind}-${index}`} block={block} />
        ))}
        <PageFooter generatedAt={report.generatedAt} />
      </Page>
    </Document>
  );
}
