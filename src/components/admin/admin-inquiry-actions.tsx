"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markInquiryResolved } from "@/app/admin/inquiries/actions";

type AdminInquiryActionsProps = {
  inquiryId: string;
  status: "PENDING" | "RESOLVED";
};

export function AdminInquiryActions({
  inquiryId,
  status,
}: AdminInquiryActionsProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleMarkResolved() {
    setIsPending(true);
    const result = await markInquiryResolved(inquiryId);
    setIsPending(false);

    if (result.success) {
      toast.success("Đã đánh dấu xử lý thành công.");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 focus:outline-none"
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreHorizontal className="h-4 w-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={handleMarkResolved}
          disabled={status === "RESOLVED" || isPending}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>Đánh dấu đã xử lý</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
