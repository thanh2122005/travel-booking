"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { newsletterSchema } from "@/lib/validations/newsletter";

type NewsletterResponse = {
  message?: string;
};

export function NewsletterSubscribeForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = newsletterSchema.safeParse({ email });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      toast.error(firstIssue?.message ?? "Email không hợp lệ.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json()) as NewsletterResponse;

      if (!response.ok) {
        toast.error(payload.message ?? "Không thể đăng ký nhận tin lúc này.");
        return;
      }

      toast.success(payload.message ?? "Đăng ký nhận tin thành công.");
      setEmail("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email của bạn"
        className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-white placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="iv-btn-primary inline-flex h-10 w-full items-center justify-center px-4 text-sm font-semibold disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang gửi...
          </>
        ) : (
          "Đăng ký"
        )}
      </button>
    </form>
  );
}
