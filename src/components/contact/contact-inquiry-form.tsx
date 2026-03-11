"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { contactInquirySchema } from "@/lib/validations/contact";

type ContactInquiryFormProps = {
  tours: Array<{
    id: string;
    title: string;
  }>;
};

type ContactInquiryResponse = {
  message?: string;
  referenceCode?: string;
};

type ContactInquiryFormValues = z.input<typeof contactInquirySchema>;

const defaultValues: ContactInquiryFormValues = {
  fullName: "",
  phone: "",
  email: "",
  tourId: "",
  departureDate: "",
  numberOfGuests: 2,
  message: "",
};

export function ContactInquiryForm({ tours }: ContactInquiryFormProps) {
  const [referenceCode, setReferenceCode] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInquiryFormValues>({
    resolver: zodResolver(contactInquirySchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setReferenceCode(null);
    const payload = contactInquirySchema.parse(values);

    const response = await fetch("/api/contact-inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as ContactInquiryResponse;

    if (!response.ok) {
      toast.error(result.message ?? "Không thể gửi yêu cầu lúc này.");
      return;
    }

    toast.success(result.message ?? "Đã gửi yêu cầu tư vấn thành công.");
    setReferenceCode(result.referenceCode ?? null);
    reset(defaultValues);
  });

  return (
    <form onSubmit={onSubmit} className="iv-card space-y-4 p-6">
      {referenceCode ? (
        <article className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Đã ghi nhận yêu cầu tư vấn của bạn. Mã tham chiếu: <span className="font-semibold">{referenceCode}</span>.
        </article>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="inquiry-full-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Họ và tên
          </label>
          <input
            id="inquiry-full-name"
            placeholder="Nguyễn Văn A"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            {...register("fullName")}
          />
          {errors.fullName ? <p className="mt-1 text-xs text-rose-600">{errors.fullName.message}</p> : null}
        </div>
        <div>
          <label htmlFor="inquiry-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
            Số điện thoại
          </label>
          <input
            id="inquiry-phone"
            placeholder="0909123456"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            {...register("phone")}
          />
          {errors.phone ? <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="inquiry-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="inquiry-email"
            type="email"
            placeholder="ban@example.com"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            {...register("email")}
          />
          {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
        </div>
        <div>
          <label htmlFor="inquiry-tour" className="mb-1.5 block text-sm font-medium text-slate-700">
            Tour quan tâm
          </label>
          <select
            id="inquiry-tour"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            {...register("tourId")}
          >
            <option value="">Chọn tour</option>
            {tours.map((tour) => (
              <option key={tour.id} value={tour.id}>
                {tour.title}
              </option>
            ))}
          </select>
          {errors.tourId ? <p className="mt-1 text-xs text-rose-600">{errors.tourId.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="inquiry-date" className="mb-1.5 block text-sm font-medium text-slate-700">
            Ngày khởi hành mong muốn
          </label>
          <input
            id="inquiry-date"
            type="date"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            {...register("departureDate")}
          />
          {errors.departureDate ? <p className="mt-1 text-xs text-rose-600">{errors.departureDate.message}</p> : null}
        </div>
        <div>
          <label htmlFor="inquiry-guests" className="mb-1.5 block text-sm font-medium text-slate-700">
            Số khách
          </label>
          <input
            id="inquiry-guests"
            type="number"
            min={1}
            max={20}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            {...register("numberOfGuests", { valueAsNumber: true })}
          />
          {errors.numberOfGuests ? <p className="mt-1 text-xs text-rose-600">{errors.numberOfGuests.message}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor="inquiry-message" className="mb-1.5 block text-sm font-medium text-slate-700">
          Nội dung cần hỗ trợ
        </label>
        <textarea
          id="inquiry-message"
          rows={5}
          placeholder="Bạn muốn ưu tiên lịch trình nào?"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          {...register("message")}
        />
        {errors.message ? <p className="mt-1 text-xs text-rose-600">{errors.message.message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="iv-btn-primary inline-flex h-11 items-center justify-center px-6 text-sm font-semibold disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang gửi yêu cầu...
          </>
        ) : (
          "Gửi yêu cầu tư vấn"
        )}
      </button>
    </form>
  );
}
