"use client";

import nextDynamic from "next/dynamic";
import { RevenueChartSkeleton } from "@/components/admin/dashboard/revenue-chart-skeleton";

export const RevenueChartDynamic = nextDynamic(
  // Lazy load chart để tránh chi phí render phía server và giảm hydration mismatch.
  () => import("@/components/admin/dashboard/revenue-chart").then((mod) => mod.RevenueChart),
  // Hiển thị skeleton trong lúc tải chart component.
  { ssr: false, loading: () => <RevenueChartSkeleton /> }
);
