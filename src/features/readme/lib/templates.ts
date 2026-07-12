import type { ReadmeTemplate } from "@/features/readme/schemas/generate-readme";
import type { DetectedStack } from "@/features/readme/types";

export function templateSections(template: ReadmeTemplate): string[] {
  const base = [
    "Project Title",
    "Description",
    "Features",
    "Tech Stack",
    "Installation",
    "Requirements",
    "Environment Variables",
    "Getting Started",
    "Folder Structure",
    "Usage",
    "Scripts",
    "Examples",
    "Screenshots Placeholder",
    "Roadmap",
    "Contributing",
    "License",
    "Support",
    "Credits",
    "FAQ",
  ];

  switch (template) {
    case "Open Source":
      return [...base, "Code of Conduct", "Community"];
    case "Startup":
      return [...base, "Product Vision", "Pricing Placeholder", "Changelog"];
    case "Enterprise":
      return [
        ...base,
        "Architecture Overview",
        "Security",
        "Compliance",
        "SLA",
        "Support Tiers",
      ];
    case "Library":
      return [
        "Project Title",
        "Description",
        "Features",
        "Installation",
        "API Reference",
        "Usage",
        "Examples",
        "TypeScript",
        "Contributing",
        "License",
        "FAQ",
      ];
    case "API":
      return [
        "Project Title",
        "Description",
        "Features",
        "Tech Stack",
        "Authentication",
        "API Endpoints",
        "Examples",
        "Environment Variables",
        "Error Handling",
        "Rate Limits",
        "License",
        "Support",
      ];
    case "CLI Tool":
      return [
        "Project Title",
        "Description",
        "Features",
        "Installation",
        "Commands",
        "Usage",
        "Examples",
        "Configuration",
        "Contributing",
        "License",
      ];
    case "Portfolio":
      return [
        "Project Title",
        "Description",
        "Features",
        "Tech Stack",
        "Demo",
        "Screenshots Placeholder",
        "Getting Started",
        "Folder Structure",
        "Credits",
        "License",
      ];
    default:
      return [...base, "Configuration", "Architecture Overview", "Authentication"];
  }
}

export function buildBadges(detected: DetectedStack, template: ReadmeTemplate) {
  const badges = [
    "![Build Status](https://img.shields.io/badge/build-passing-brightgreen)",
    "![Version](https://img.shields.io/badge/version-1.0.0-blue)",
    "![License](https://img.shields.io/badge/license-MIT-green)",
  ];

  if (detected.language === "TypeScript" || /typescript/i.test(detected.primaryStack)) {
    badges.push("![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)");
  }
  if (detected.framework === "Next.js" || /next/i.test(detected.primaryStack)) {
    badges.push("![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)");
  }
  if (detected.frontend === "React" || /react/i.test(detected.primaryStack)) {
    badges.push("![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)");
  }
  if (detected.backend === "Node.js" || /node/i.test(detected.primaryStack)) {
    badges.push("![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white)");
  }
  if (/openai|ai|llm/i.test(detected.primaryStack + template)) {
    badges.push("![OpenAI](https://img.shields.io/badge/OpenAI-compatible-412991?logo=openai&logoColor=white)");
  }

  badges.push("![GitHub Stars](https://img.shields.io/badge/stars-★-yellow)");
  badges.push("![Downloads](https://img.shields.io/badge/downloads-1k%2Fmo-informational)");

  return badges;
}

export function buildFolderTree(detected: DetectedStack) {
  if (detected.framework === "Next.js" || /next/i.test(detected.primaryStack)) {
    return `\`\`\`text
.
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   └── server/
├── public/
├── prisma/
├── package.json
└── README.md
\`\`\``;
  }

  if (detected.language === "Python") {
    return `\`\`\`text
.
├── app/
├── tests/
├── requirements.txt
├── pyproject.toml
└── README.md
\`\`\``;
  }

  if (detected.language === "Rust") {
    return `\`\`\`text
.
├── src/
├── tests/
├── Cargo.toml
└── README.md
\`\`\``;
  }

  return `\`\`\`text
.
├── src/
│   ├── components/
│   ├── lib/
│   └── app/
├── public/
├── package.json
└── README.md
\`\`\``;
}

export function installCommands(detected: DetectedStack) {
  const pm = detected.packageManager ?? "npm";

  if (pm === "pip") {
    return `\`\`\`bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
\`\`\``;
  }

  if (pm === "cargo") {
    return `\`\`\`bash
cargo build
cargo run
\`\`\``;
  }

  if (pm === "pnpm") {
    return `\`\`\`bash
pnpm install
pnpm dev
\`\`\``;
  }

  if (pm === "yarn") {
    return `\`\`\`bash
yarn
yarn dev
\`\`\``;
  }

  if (pm === "bun") {
    return `\`\`\`bash
bun install
bun dev
\`\`\``;
  }

  return `\`\`\`bash
npm install
npm run dev
\`\`\``;
}
