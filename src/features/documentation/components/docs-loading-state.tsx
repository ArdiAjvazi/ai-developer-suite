import { Skeleton } from "@/shared/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";

export function DocsLoadingState() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <p className="text-sm text-muted-foreground">
        Analyzing source and drafting enterprise documentation…
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-[80%]" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 pt-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
