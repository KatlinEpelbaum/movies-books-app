"use client";

import * as React from "react";
import { Pie, PieChart, Cell } from "recharts";

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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartConfig = {
  value: {
    label: "Items",
  },
  "Sci-Fi": {
    label: "Sci-Fi",
    color: "hsl(var(--chart-1))",
  },
  Fantasy: {
    label: "Fantasy",
    color: "hsl(var(--chart-2))",
  },
  Drama: {
    label: "Drama",
    color: "hsl(var(--chart-3))",
  },
  Action: {
    label: "Action",
    color: "hsl(var(--chart-4))",
  },
  Thriller: {
    label: "Thriller",
    color: "hsl(var(--chart-5))",
  },
};

export function GenreDistributionChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Genre Distribution</CardTitle>
        <CardDescription>Based on completed items</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    chartConfig[entry.name as keyof typeof chartConfig]?.color
                  }
                />
              ))}
            </Pie>
             <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
