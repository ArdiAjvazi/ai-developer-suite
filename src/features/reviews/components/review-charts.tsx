"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { ReviewHistoryItem } from "@/features/reviews/types";

type ReviewChartsProps = {
  history: ReviewHistoryItem[];
};

export function ReviewCharts({ history }: ReviewChartsProps) {
  const chronological = [...history]
    .filter((item) => item.score !== null)
    .reverse()
    .slice(-12)
    .map((item) => ({
      label: new Date(item.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      Security: item.categoryScores.Security ?? null,
      Performance: item.categoryScores.Performance ?? null,
      Readability: item.categoryScores.Readability ?? null,
      Maintainability: item.categoryScores.Maintainability ?? null,
      Score: item.score,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality trends</CardTitle>
        <CardDescription>
          Security, performance, readability, and maintainability over recent reviews
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[280px]">
        {chronological.length < 2 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              Run at least two reviews to unlock trend charts across quality
              dimensions.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chronological}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="Security"
                stroke="#f87171"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Performance"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Readability"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Maintainability"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
