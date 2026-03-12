"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { profileUpdateSchema } from "@/lib/validations/profile";

type AccountProfileFormProps = {
  fullName: string;
  email: string;
  phone?: string | null;
};

type ProfileUpdateResponse = {
  message?: string;
};

type AccountProfileFormValues = z.input<typeof profileUpdateSchema>;

export function AccountProfileForm({ fullName, email, phone }: AccountProfileFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountProfileFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName,
      phone: phone ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const requestPayload = profileUpdateSchema.parse(values);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    const result = (await response.json()) as ProfileUpdateResponse;

    if (!response.ok) {
      toast.error(result.message ?? "Không thể cập nhật hồ sơ lúc này.");
      return;
    }

    toast.success(result.message ?? "Đã cập nhật hồ sơ cá nhân.");
    router.refresh();
  });

  return (
    <article className="iv-card p-5">
      <h2 className="text-xl font-bold text-slate-900">Thông tin cá nhân</h2>
      <p className="mt-1 text-sm text-slate-500">
        Cập nhật họ tên và số điện thoại để đội ngũ tư vấn hỗ trợ nhanh hơn.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="account-full-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Họ và tên
            </label>
            <input
              id="account-full-name"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
              {...register("fullName")}
            />
            {errors.fullName ? (
              <p className="mt-1 text-xs text-rose-600">{errors.fullName.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="account-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
              Số điện thoại
            </label>
            <input
              id="account-phone"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
              placeholder="0909123456"
              {...register("phone")}
            />
            {errors.phone ? <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p> : null}
          </div>
        </div>

        <div>
          <label htmlFor="account-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email đăng nhập
          </label>
          <input
            id="account-email"
            value={email}
            readOnly
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-600 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="iv-btn-primary inline-flex h-10 items-center justify-center px-5 text-sm font-semibold disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </button>
      </form>
    </article>
  );
}
