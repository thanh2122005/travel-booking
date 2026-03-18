"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MoreHorizontal, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminInquiryActionsProps = {
  inquiryId: string;
  status: "PENDING" | "RESOLVED";
};

export function AdminInquiryActions({ inquiryId, status }: AdminInquiryActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleSetStatus(nextStatus: "PENDING" | "RESOLVED") {
    startTransition(async () => {
      const response = await fetch("/api/admin/inquiries/" + inquiryId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "Khong the cap nhat trang thai tu van.");
        return;
      }

      toast.success(
        payload.message ?? (nextStatus === "RESOLVED" ? "Da danh dau da xu ly." : "Da chuyen ve cho xu ly."),
      );
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 focus:outline-none"
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem
          onClick={() => handleSetStatus("RESOLVED")}
          disabled={status === "RESOLVED" || isPending}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Danh dau da xu ly</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSetStatus("PENDING")}
          disabled={status === "PENDING" || isPending}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4 text-amber-600" />
          <span>Chuyen ve cho xu ly</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
