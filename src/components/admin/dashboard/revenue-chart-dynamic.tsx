"use client";

import nextDynamic from "next/dynamic";
import { RevenueChartSkeleton } from "@/components/admin/dashboard/revenue-chart-skeleton";

export const RevenueChartDynamic = nextDynamic(
  () => import("@/components/admin/dashboard/revenue-chart").then((mod) => mod.RevenueChart),
  { ssr: false, loading: () => <RevenueChartSkeleton /> }
);
