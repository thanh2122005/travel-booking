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
};

export function AdminUserActions({ userId, role, status }: AdminUserActionsProps) {
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

  async function handleDeleteUser() {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa người dùng này? Hành động sẽ xóa booking, review và favorite của tài khoản.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể xóa người dùng.");
        return;
      }

      toast.success(payload.message ?? "Đã xóa người dùng thành công.");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex min-w-[220px] flex-col gap-2">
      <select
        value={selectedRole}
        onChange={(event) => setSelectedRole(event.target.value as UserRoleValue)}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
        disabled={isPending || isDeleting}
      >
        <option value="USER">Người dùng</option>
        <option value="ADMIN">Quản trị viên</option>
      </select>
      <select
        value={selectedStatus}
        onChange={(event) => setSelectedStatus(event.target.value as UserStatusValue)}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
        disabled={isPending || isDeleting}
      >
        <option value="ACTIVE">Hoạt động</option>
        <option value="BLOCKED">Bị khóa</option>
      </select>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || isDeleting}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        <button
          type="button"
          onClick={handleDeleteUser}
          disabled={isPending || isDeleting}
          className="inline-flex h-8 items-center justify-center rounded-md border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? (
            <>
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              Xóa
            </>
          ) : (
            <>
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Xóa
            </>
          )}
        </button>
      </div>
    </div>
  );
}
