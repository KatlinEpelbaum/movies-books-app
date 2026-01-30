"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  watching: {
    label: "Watching",
    color: "hsl(var(--chart-2))",
  },
  plan_to_watch: {
    label: "Plan to Watch",
    color: "hsl(var(--chart-3))",
  },
  on_hold: {
    label: "On Hold",
    color: "hsl(var(--chart-4))",
  },
  dropped: {
    label: "Dropped",
    color: "hsl(var(--chart-5))",
  },
};

export function CompletedOverTimeChart({
  data,
}: {
  data: { name: string; total?: number; completed?: number; watching?: number; plan_to_watch?: number; on_hold?: number; dropped?: number }[];
}) {
  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="font-headline text-2xl">Activity This Year</CardTitle>
        <CardDescription className="text-base">All activity per month by status</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <BarChart 
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            barCategoryGap="5%"
          >
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="colorWatching" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="colorPlan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="colorOnHold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="colorDropped" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0.7}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.2} vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              content={<ChartTooltipContent hideLabel indicator="line" />}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
            />
            <Legend 
              wrapperStyle={{
                paddingTop: "20px",
                paddingLeft: "50px",
              }}
              iconType="square"
            />
            <Bar dataKey="completed" stackId="a" fill="url(#colorCompleted)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="watching" stackId="a" fill="url(#colorWatching)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="plan_to_watch" stackId="a" fill="url(#colorPlan)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="on_hold" stackId="a" fill="url(#colorOnHold)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="dropped" stackId="a" fill="url(#colorDropped)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
