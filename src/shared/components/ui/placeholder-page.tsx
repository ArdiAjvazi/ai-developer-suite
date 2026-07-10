import { PageHeader } from "@/shared/components/ui/page-header";

type PlaceholderPageProps = {
  title: string;
  description: string;
  module: string;
};

export function PlaceholderPage({
  title,
  description,
  module,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description} />

      <div className="rounded-xl border border-dashed border-border bg-surface/60 p-10">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-elevated">
            <span className="font-mono text-xs text-muted-foreground">P0</span>
          </div>
          <h2 className="text-base font-medium text-foreground">
            {module} module scaffolded
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Routing and layout are live. Feature logic, API routes, and AI
            pipelines land in later phases.
          </p>
        </div>
      </div>
    </div>
  );
}
