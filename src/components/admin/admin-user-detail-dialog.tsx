"use client";

import { FormEvent, useState, useTransition } from "react";
import { Loader2, PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SafeImage } from "@/components/common/safe-image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type UserRoleValue = "USER" | "ADMIN";
type UserStatusValue = "ACTIVE" | "BLOCKED";

type AdminUserDetailDialogProps = {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    role: UserRoleValue;
    status: UserStatusValue;
  };
};

const avatarSuggestions = [
  "/immerse-vietnam/images/test-1.jpg",
  "/immerse-vietnam/images/test-2.jpg",
  "/immerse-vietnam/images/test-3.jpg",
] as const;

export function AdminUserDetailDialog({ user }: AdminUserDetailDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [role, setRole] = useState<UserRoleValue>(user.role);
  const [status, setStatus] = useState<UserStatusValue>(user.status);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim()) {
      toast.error("Họ tên là bắt buộc.");
      return;
    }
    if (!email.trim()) {
      toast.error("Email là bắt buộc.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${user.id}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim().length ? phone.trim() : null,
          avatarUrl: avatarUrl.trim().length ? avatarUrl.trim() : null,
          role,
          status,
        }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(payload.message ?? "Không thể cập nhật người dùng.");
        return;
      }

      toast.success(payload.message ?? "Đã cập nhật người dùng.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
        <PencilLine className="mr-1.5 h-3.5 w-3.5" />
        Sửa hồ sơ
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          <DialogDescription>Cập nhật hồ sơ tài khoản và phân quyền truy cập.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Họ và tên</label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Số điện thoại</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Vai trò</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRoleValue)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="USER">Người dùng</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Trạng thái</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as UserStatusValue)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="BLOCKED">Bị khóa</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Ảnh đại diện</label>
            <input
              list="avatar-options"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              placeholder="URL ảnh đại diện"
            />
            <datalist id="avatar-options">
              {avatarSuggestions.map((avatar) => (
                <option key={avatar} value={avatar} />
              ))}
            </datalist>
          </div>
          <div className="relative h-28 overflow-hidden rounded-lg border border-slate-200 md:col-span-2">
            <SafeImage
              src={avatarUrl}
              alt={`Avatar ${fullName}`}
              fill
              sizes="400px"
              className="object-cover"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 md:col-span-2 md:justify-self-end"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Đang lưu
              </>
            ) : (
              "Lưu hồ sơ người dùng"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
