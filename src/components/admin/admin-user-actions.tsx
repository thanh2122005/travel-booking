"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type UserRoleValue = "USER" | "ADMIN";
type UserStatusValue = "ACTIVE" | "BLOCKED";

type AdminUserActionsProps = {
  userId: string;
  role: UserRoleValue;
  status: UserStatusValue;
};

export function AdminUserActions({ userId, role, status }: AdminUserActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState(role);
  const [selectedStatus, setSelectedStatus] = useState(status);

  function handleSave() {
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          status: selectedStatus,
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật người dùng.");
        return;
      }

      toast.success(payload.message ?? "Đã cập nhật người dùng.");
      router.refresh();
    });
  }

  return (
    <div className="flex min-w-[200px] flex-col gap-2">
      <select
        value={selectedRole}
        onChange={(event) => setSelectedRole(event.target.value as UserRoleValue)}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
      >
        <option value="USER">Người dùng</option>
        <option value="ADMIN">Quản trị viên</option>
      </select>
      <select
        value={selectedStatus}
        onChange={(event) => setSelectedStatus(event.target.value as UserStatusValue)}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
      >
        <option value="ACTIVE">Hoạt động</option>
        <option value="BLOCKED">Bị khóa</option>
      </select>
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="inline-flex h-8 items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            Lưu
          </>
        ) : (
          "Lưu"
        )}
      </button>
    </div>
  );
}
