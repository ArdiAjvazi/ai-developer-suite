import type { GenerateDocsInput } from "@/features/documentation/schemas/generate-docs";
import type { CodeAnalysisSummary } from "@/features/documentation/types";

export function detectLanguageFromFileName(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "TypeScript";
    case "js":
    case "jsx":
      return "JavaScript";
    case "py":
      return "Python";
    case "rs":
      return "Rust";
    case "go":
      return "Go";
    case "sql":
      return "SQL";
    case "prisma":
      return "Prisma";
    default:
      return null;
  }
}

export function analyzeSource(input: GenerateDocsInput): CodeAnalysisSummary {
  const code = input.code;
  const fromFile = input.fileName
    ? detectLanguageFromFileName(input.fileName)
    : null;

  const language =
    input.language !== "Auto-detect"
      ? input.language
      : fromFile ??
        (/model\s+\w+\s*\{/.test(code)
          ? "Prisma"
          : /SELECT\s+.+\s+FROM/i.test(code)
            ? "SQL"
            : /\bdef\s+\w+\(/.test(code)
              ? "Python"
              : /fn\s+\w+\(/.test(code)
                ? "Rust"
                : /func\s+\w+\(/.test(code)
                  ? "Go"
                  : /:\s*\w+(\[\])?\s*[=;]|interface\s+\w+|type\s+\w+\s*=/.test(
                        code,
                      )
                    ? "TypeScript"
                    : "JavaScript");

  const functionMatches = [
    ...code.matchAll(
      /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/g,
    ),
    ...code.matchAll(
      /(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/g,
    ),
    ...code.matchAll(/def\s+([A-Za-z0-9_]+)\s*\(/g),
    ...code.matchAll(/fn\s+([A-Za-z0-9_]+)\s*\(/g),
  ].map((match) => match[1]);

  const classMatches = [
    ...code.matchAll(/(?:export\s+)?class\s+([A-Za-z0-9_]+)/g),
  ].map((match) => match[1]);

  const interfaceMatches = [
    ...code.matchAll(/(?:export\s+)?interface\s+([A-Za-z0-9_]+)/g),
    ...code.matchAll(/(?:export\s+)?type\s+([A-Za-z0-9_]+)\s*=/g),
  ].map((match) => match[1]);

  const enumMatches = [
    ...code.matchAll(/(?:export\s+)?enum\s+([A-Za-z0-9_]+)/g),
  ].map((match) => match[1]);

  const hookMatches = [
    ...code.matchAll(/\b(use[A-Z][A-Za-z0-9_]*)\b/g),
  ].map((match) => match[1]);

  const endpoints = [
    ...code.matchAll(
      /\b(GET|POST|PUT|PATCH|DELETE)\s+([\/][A-Za-z0-9_\-\/\{\}:]*)/gi,
    ),
    ...code.matchAll(
      /(?:app|router)\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/gi,
    ),
    ...code.matchAll(
      /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/g,
    ),
  ].map((match) => {
    if (match.length >= 3) {
      return {
        method: match[1].toUpperCase(),
        path: match[2],
      };
    }
    return {
      method: match[1].toUpperCase(),
      path: "/api/route",
    };
  });

  const models = [
    ...code.matchAll(/model\s+([A-Za-z0-9_]+)\s*\{/g),
    ...code.matchAll(/CREATE\s+TABLE\s+([A-Za-z0-9_]+)/gi),
  ].map((match) => match[1]);

  const unique = (values: string[]) => Array.from(new Set(values)).slice(0, 40);

  return {
    language,
    functions: unique(functionMatches),
    classes: unique(classMatches),
    interfaces: unique(interfaceMatches),
    enums: unique(enumMatches),
    hooks: unique(hookMatches.filter((name) => name.startsWith("use"))),
    endpoints: endpoints.slice(0, 30),
    models: unique(models),
    hasPrisma: /model\s+\w+\s*\{/.test(code) || /prisma/i.test(code),
    hasSql: /SELECT\s+|CREATE\s+TABLE/i.test(code),
    hasReact: /from\s+['"]react['"]|useState|useEffect|jsx|tsx/i.test(code),
  };
}

export function deriveDocsProjectName(input: GenerateDocsInput) {
  if (input.projectName?.trim()) return input.projectName.trim();
  if (input.repositoryHint?.trim()) return input.repositoryHint.trim();
  if (input.fileName && input.fileName !== "source.ts") {
    return input.fileName.replace(/\.[^.]+$/, "");
  }
  const first = input.code
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return first?.replace(/^#+\s*/, "").slice(0, 60) || "Project Documentation";
}
