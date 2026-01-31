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

const baseColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(220, 70%, 50%)",
  "hsl(280, 70%, 50%)",
  "hsl(340, 70%, 50%)",
  "hsl(40, 70%, 50%)",
  "hsl(100, 70%, 50%)",
];

export function GenreDistributionChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  // Create a dynamic config based on the data genres
  const dynamicConfig: Record<string, any> = {
    value: {
      label: "Items",
    },
  };

  data.forEach((item, index) => {
    if (!dynamicConfig[item.name]) {
      dynamicConfig[item.name] = {
        label: item.name,
        color: baseColors[index % baseColors.length],
      };
    }
  });

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Genre Distribution</CardTitle>
        <CardDescription>Based on completed items</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={dynamicConfig}
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
                  fill={dynamicConfig[entry.name]?.color || baseColors[index % baseColors.length]}
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
