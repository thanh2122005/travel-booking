"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type UserRoleValue = "USER" | "ADMIN";
type UserStatusValue = "ACTIVE" | "BLOCKED";

type AdminUserActionsProps = {
  userId: string;
  role: UserRoleValue;
  status: UserStatusValue;
  compact?: boolean;
};

export function AdminUserActions({ userId, role, status, compact = false }: AdminUserActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRole, setSelectedRole] = useState(role);
  const [selectedStatus, setSelectedStatus] = useState(status);

  function handleSave() {
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, status: selectedStatus }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "KhÃ´ng thá»ƒ cáº­p nháº­t ngÆ°á»i dÃ¹ng.");
        return;
      }

      toast.success(payload.message ?? "ÄÃ£ cáº­p nháº­t ngÆ°á»i dÃ¹ng.");
      router.refresh();
    });
  }

  async function handleDeleteUser() {
    const confirmed = window.confirm(
      "Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a ngÆ°á»i dÃ¹ng nÃ y? HÃ nh Ä‘á»™ng sáº½ xÃ³a booking, review vÃ  favorite cá»§a tÃ i khoáº£n.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "KhÃ´ng thá»ƒ xÃ³a ngÆ°á»i dÃ¹ng.");
        return;
      }

      toast.success(payload.message ?? "ÄÃ£ xÃ³a ngÆ°á»i dÃ¹ng thÃ nh cÃ´ng.");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${compact ? "w-full min-w-[112px] max-w-[132px]" : "w-[148px]"}`}>
      <select
        value={selectedRole}
        onChange={(event) => setSelectedRole(event.target.value as UserRoleValue)}
        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
        disabled={isPending || isDeleting}
      >
        <option value="USER">NgÆ°á»i dÃ¹ng</option>
        <option value="ADMIN">Quáº£n trá»‹ viÃªn</option>
      </select>
      <select
        value={selectedStatus}
        onChange={(event) => setSelectedStatus(event.target.value as UserStatusValue)}
        className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
        disabled={isPending || isDeleting}
      >
        <option value="ACTIVE">Hoáº¡t Ä‘á»™ng</option>
        <option value="BLOCKED">Bá»‹ khÃ³a</option>
      </select>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || isDeleting}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-md bg-slate-800 px-2.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              LÆ°u
            </>
          ) : (
            "LÆ°u"
          )}
        </button>
        <button
          type="button"
          onClick={handleDeleteUser}
          disabled={isPending || isDeleting}
          title="XÃ³a ngÆ°á»i dÃ¹ng"
          className={`inline-flex h-8 items-center justify-center rounded-md border border-rose-200 px-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 ${
            compact ? "w-8 shrink-0" : ""
          }`}
        >
          {isDeleting ? (
            <>
              <Loader2 className={compact ? "h-3.5 w-3.5 animate-spin" : "mr-1 h-3.5 w-3.5 animate-spin"} />
              {compact ? null : "XÃ³a"}
            </>
          ) : (
            <>
              <Trash2 className={compact ? "h-3.5 w-3.5" : "mr-1 h-3.5 w-3.5"} />
              {compact ? null : "XÃ³a"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
