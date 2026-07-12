import type { GenerateReviewInput } from "@/features/reviews/schemas/generate-review";
import { REVIEW_CATEGORIES } from "@/features/reviews/schemas/generate-review";
import type {
  CategoryScore,
  CodeReviewResult,
  ReviewIssue,
} from "@/features/reviews/types";
import {
  countLines,
  estimateDebtHours,
  estimateFixMinutes,
  healthFromScore,
  statusFromScore,
} from "@/features/reviews/lib/review-metrics";

function findLine(code: string, pattern: RegExp): number | null {
  const lines = code.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (pattern.test(lines[i])) {
      return i + 1;
    }
  }
  return null;
}

function lineAt(code: string, line: number | null) {
  if (!line) return "";
  return code.split(/\r?\n/)[line - 1]?.trim() ?? "";
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

const CATEGORY_COPY: Record<
  (typeof REVIEW_CATEGORIES)[number],
  string
> = {
  Security: "Protects against injection, XSS, and secret leakage.",
  Bugs: "Correctness risks that can cause runtime failures.",
  Performance: "Hot-path inefficiencies and unnecessary work.",
  Readability: "Clarity for future reviewers and maintainers.",
  Maintainability: "Structure, coupling, and long-term change cost.",
  "Best Practices": "Conventions that keep production code healthy.",
};

/**
 * Rich mock review for local UI/DB testing without an OpenAI key.
 */
export function buildMockCodeReview(
  input: GenerateReviewInput,
  durationMs = 720,
): CodeReviewResult {
  const { code, language, fileName } = input;
  const issues: ReviewIssue[] = [];
  let id = 1;

  const push = (
    issue: Omit<ReviewIssue, "id" | "fileName"> & { fileName?: string },
  ) => {
    issues.push({
      id: `mock-${id++}`,
      fileName: issue.fileName ?? fileName,
      category: issue.category,
      severity: issue.severity,
      line: issue.line,
      description: issue.description,
      whyItMatters: issue.whyItMatters,
      recommendation: issue.recommendation,
      beforeCode: issue.beforeCode,
      afterCode: issue.afterCode,
    });
  };

  if (/eval\s*\(/.test(code)) {
    const line = findLine(code, /eval\s*\(/);
    const before = lineAt(code, line) || 'eval(user.couponScript);';
    push({
      category: "Security",
      severity: "High",
      line,
      description:
        "Use of `eval` can execute untrusted input and enable remote code execution.",
      whyItMatters:
        "Attackers can inject arbitrary JavaScript, compromise sessions, and exfiltrate data.",
      recommendation:
        "Remove `eval` and parse or validate input with a safe, explicit API.",
      beforeCode: before,
      afterCode: "const coupon = validateCoupon(user.couponCode);",
    });
  }

  if (/innerHTML\s*=/.test(code)) {
    const line = findLine(code, /innerHTML\s*=/);
    const before =
      lineAt(code, line) ||
      'document.body.innerHTML = "<h1>Paid " + total + "</h1>";';
    push({
      category: "Security",
      severity: "High",
      line,
      description:
        "Assigning to `innerHTML` with untrusted data can introduce XSS.",
      whyItMatters:
        "Unescaped HTML can execute scripts in the victim browser and steal credentials.",
      recommendation:
        "Prefer `textContent`, sanitized HTML libraries, or framework-safe rendering.",
      beforeCode: before,
      afterCode:
        'statusEl.textContent = `Paid ${total}`;',
    });
  }

  if (/password\s*=\s*['"][^'"]+['"]/i.test(code) || /user\.password/.test(code)) {
    const line =
      findLine(code, /password\s*=\s*['"][^'"]+['"]/i) ??
      findLine(code, /user\.password/);
    const before =
      lineAt(code, line) || 'console.log("charging", user.password);';
    push({
      category: "Security",
      severity: "High",
      line,
      description: "Sensitive credential handling detected in source.",
      whyItMatters:
        "Secrets in logs or source increase breach blast radius and compliance risk.",
      recommendation:
        "Never log credentials; load secrets from environment variables or a vault.",
      beforeCode: before,
      afterCode: 'logger.info("charging user", { userId: user.id });',
    });
  }

  if (/API_KEY\s*=\s*['"][^'"]+['"]/.test(code)) {
    const line = findLine(code, /API_KEY\s*=\s*['"][^'"]+['"]/);
    const before = lineAt(code, line) || 'const API_KEY = "123";';
    push({
      category: "Security",
      severity: "High",
      line,
      description: "Hard-coded API key found in source.",
      whyItMatters:
        "Committed keys are routinely scraped from repositories and abused within minutes.",
      recommendation: "Store keys in environment variables and rotate exposed credentials.",
      beforeCode: before,
      afterCode: "const API_KEY = process.env.API_KEY;",
    });
  }

  if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(code) || /catch\s*\([^)]*\)\s*\{\s*\}/.test(code) || /catch\s*\(e\)\s*\{\s*\}/.test(code) || /catch\s*\(e\)\s*\{\}/.test(code)) {
    const line = findLine(code, /catch\s*(\(|\{)/);
    const before = lineAt(code, line) || "catch (e) {}";
    push({
      category: "Bugs",
      severity: "Medium",
      line,
      description: "Empty catch block may hide failures and complicate debugging.",
      whyItMatters:
        "Silent failures make production incidents harder to diagnose and recover from.",
      recommendation:
        "Log structured errors and rethrow or handle recoverable cases explicitly.",
      beforeCode: before.includes("catch") ? before : "try {\n  // ...\n} catch (e) {}",
      afterCode:
        'try {\n  // ...\n} catch (error) {\n  logger.error("checkout failed", { error });\n  throw error;\n}',
    });
  }

  if (/for\s*\(.*in\s+.*\)/.test(code) && language !== "Python") {
    const line = findLine(code, /for\s*\(.*in\s+.*\)/);
    const before = lineAt(code, line) || "for (const item in cart) {";
    push({
      category: "Bugs",
      severity: "Medium",
      line,
      description:
        "`for...in` iterates enumerable keys and can surprise on arrays/objects.",
      whyItMatters:
        "Incorrect iteration can skip items, double-count, or throw at runtime.",
      recommendation:
        "Prefer `for...of`, `Object.keys`, or indexed loops for arrays.",
      beforeCode: before,
      afterCode: "for (const item of cart) {",
    });
  }

  if (/:\s*any\b/.test(code)) {
    const line = findLine(code, /:\s*any\b/);
    const before = lineAt(code, line) || "user: any";
    push({
      category: "Maintainability",
      severity: "Medium",
      line,
      description: "Use of `any` weakens type safety across call sites.",
      whyItMatters:
        "Unchecked shapes drift over time and turn refactors into runtime regressions.",
      recommendation: "Replace `any` with a precise interface or zod-validated type.",
      beforeCode: before,
      afterCode: "user: CheckoutUser",
    });
  }

  if (/\.map\s*\([^)]*\)\s*\.filter\s*\(/.test(code) || /\.filter\s*\([^)]*\)\s*\.map\s*\(/.test(code)) {
    const line = findLine(code, /\.(map|filter)\s*\(/);
    push({
      category: "Performance",
      severity: "Medium",
      line,
      description: "Chained map/filter creates intermediate arrays.",
      whyItMatters:
        "Extra allocations add latency and GC pressure on large collections.",
      recommendation:
        "Combine into a single pass with `flatMap`/`reduce`, or use a for-loop for hot paths.",
      beforeCode: "items.map(transform).filter(Boolean)",
      afterCode:
        "items.reduce<Result[]>((acc, item) => {\n  const next = transform(item);\n  if (next) acc.push(next);\n  return acc;\n}, [])",
    });
  }

  if (/TODO|FIXME|HACK/.test(code)) {
    const line = findLine(code, /TODO|FIXME|HACK/);
    const before = lineAt(code, line) || "// TODO: validate inventory";
    push({
      category: "Best Practices",
      severity: "Low",
      line,
      description: "Outstanding TODO/FIXME marker left in production-bound code.",
      whyItMatters:
        "Unresolved markers often become forgotten production debt.",
      recommendation:
        "Resolve the marker or track it as a ticket before merging.",
      beforeCode: before,
      afterCode: "// Inventory validated via assertInStock(cart)",
    });
  }

  if (/console\.(log|debug|info)\s*\(/.test(code)) {
    const line = findLine(code, /console\.(log|debug|info)\s*\(/);
    const before = lineAt(code, line) || 'console.log("charging", user.password);';
    push({
      category: "Best Practices",
      severity: "Low",
      line,
      description: "Debug logging left in source may leak noise or sensitive data.",
      whyItMatters:
        "Noisy logs hide real incidents and can expose PII in shared log sinks.",
      recommendation:
        "Gate logs behind a logger with levels, or remove debug statements.",
      beforeCode: before,
      afterCode: 'logger.debug("charging started", { userId: user.id });',
    });
  }

  if (code.split(/\r?\n/).some((line) => line.length > 120)) {
    const line =
      code.split(/\r?\n/).findIndex((entry) => entry.length > 120) + 1 || null;
    push({
      category: "Readability",
      severity: "Low",
      line,
      description: "One or more lines exceed 120 characters.",
      whyItMatters:
        "Long lines reduce review speed and increase merge-conflict noise.",
      recommendation:
        "Break long expressions across lines to improve scanability in reviews.",
      beforeCode: lineAt(code, line) || "// very long line...",
      afterCode: "// split across multiple readable lines",
    });
  }

  if (!/function|=>|class|def |fn |func /.test(code) && code.length > 40) {
    push({
      category: "Readability",
      severity: "Medium",
      line: 1,
      description: "Snippet lacks clear function/module boundaries.",
      whyItMatters:
        "Unstructured scripts are harder to test, reuse, and reason about.",
      recommendation:
        "Extract named functions with single responsibilities and explicit return types.",
      beforeCode: code.trim().slice(0, 120),
      afterCode:
        "export function runCheckout(input: CheckoutInput): CheckoutResult {\n  // ...\n}",
    });
  }

  if (issues.length < 2) {
    push({
      category: "Maintainability",
      severity: "Low",
      line: 1,
      description:
        "Consider extracting domain validation into a dedicated helper module.",
      whyItMatters:
        "Centralized validation reduces duplication and keeps business rules consistent.",
      recommendation:
        "Create a `validateCheckoutInput` helper shared by API and UI layers.",
      beforeCode: "// inline validation mixed with business logic",
      afterCode:
        "const input = validateCheckoutInput(raw);\nreturn processCheckout(input);",
    });
  }

  if (issues.length === 0) {
    push({
      category: "Best Practices",
      severity: "Low",
      line: 1,
      description:
        "No high-signal anti-patterns detected in mock heuristics for this snippet.",
      whyItMatters:
        "Clean snippets still benefit from tests and typed contracts before release.",
      recommendation:
        "Add tests and type checks; connect a live model key for deeper semantic review.",
      beforeCode: "// current implementation",
      afterCode: "// keep current implementation + add unit coverage",
    });
  }

  const severityWeight = { High: 18, Medium: 10, Low: 4 } as const;
  const severityCounts = { High: 0, Medium: 0, Low: 0 };
  for (const issue of issues) {
    severityCounts[issue.severity] += 1;
  }

  const penalty = issues.reduce(
    (sum, issue) => sum + severityWeight[issue.severity],
    0,
  );
  const score = clampScore(92 - penalty);

  const categories: CategoryScore[] = REVIEW_CATEGORIES.map((category) => {
    const categoryIssues = issues.filter((issue) => issue.category === category);
    const categoryPenalty = categoryIssues.reduce(
      (sum, issue) => sum + severityWeight[issue.severity],
      0,
    );
    const categoryScore = clampScore(95 - categoryPenalty * 1.4);
    return {
      category,
      score: categoryScore,
      issueCount: categoryIssues.length,
      explanation: CATEGORY_COPY[category],
      status: statusFromScore(categoryScore),
    };
  });

  const estimatedFixMinutes = estimateFixMinutes(
    severityCounts.High,
    severityCounts.Medium,
    severityCounts.Low,
  );

  return {
    score,
    summary: `Mock review of ${fileName} (${language}): found ${issues.length} finding${issues.length === 1 ? "" : "s"} with an overall quality score of ${score}/100. Repository health is ${healthFromScore(score)}.`,
    categories,
    issues,
    severityCounts,
    metrics: {
      estimatedFixMinutes,
      technicalDebtHours: estimateDebtHours(estimatedFixMinutes),
      repositoryHealth: healthFromScore(score),
      linesOfCode: countLines(code),
      filesAnalyzed: 1,
      durationMs,
      languageDetected: language,
    },
  };
}
