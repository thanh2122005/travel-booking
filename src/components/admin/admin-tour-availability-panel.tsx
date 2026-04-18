"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type TourAvailability = {
  tourId: string;
  departureDate: string;
  maxGuests: number;
  bookedGuests: number;
  remainingSeats: number;
  isFull: boolean;
};

type AdminTourAvailabilityPanelProps = {
  tourId: string;
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AdminTourAvailabilityPanel({ tourId }: AdminTourAvailabilityPanelProps) {
  const [departureDate, setDepartureDate] = useState(() => toDateInputValue(new Date()));
  const [availability, setAvailability] = useState<TourAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!departureDate) return;

    const controller = new AbortController();

    fetch(
      `/api/tours/${encodeURIComponent(tourId)}/availability?departureDate=${encodeURIComponent(
        departureDate,
      )}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as
          | TourAvailability
          | { message?: string };

        if (!response.ok) {
          setAvailability(null);
          setError(
            "message" in payload
              ? payload.message ?? "Không lấy được dữ liệu chỗ trống."
              : "Không lấy được dữ liệu chỗ trống.",
          );
          return;
        }

        setAvailability(payload as TourAvailability);
      })
      .catch((err: unknown) => {
        if (
          typeof err === "object" &&
          err !== null &&
          "name" in err &&
          err.name === "AbortError"
        ) {
          return;
        }
        setAvailability(null);
        setError("Không lấy được dữ liệu chỗ trống.");
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [departureDate, tourId]);

  const occupancyPercent = useMemo(() => {
    if (!availability || availability.maxGuests <= 0) return 0;
    return Math.min((availability.bookedGuests / availability.maxGuests) * 100, 100);
  }, [availability]);

  return (
    <section className="iv-card rounded-2xl border-slate-200/80 bg-white p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Tồn chỗ theo ngày khởi hành
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Theo dõi đã đặt và số chỗ còn trống
          </h2>
        </div>
        <label className="block">
          <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-slate-600">
            <CalendarDays className="h-3.5 w-3.5" />
            Ngày khởi hành
          </span>
          <input
            type="date"
            value={departureDate}
            onChange={(event) => {
              setIsLoading(true);
              setError(null);
              setDepartureDate(event.target.value);
            }}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
          />
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {isLoading ? (
          <p className="inline-flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải dữ liệu chỗ trống...
          </p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : availability ? (
          <div className="space-y-3">
            <p
              className={cn(
                "inline-flex items-center gap-2 text-sm font-medium",
                availability.remainingSeats > 0 ? "text-emerald-700" : "text-rose-600",
              )}
            >
              <Users className="h-4 w-4" />
              Đã đặt {availability.bookedGuests}/{availability.maxGuests} khách • Còn{" "}
              {availability.remainingSeats} chỗ
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  availability.remainingSeats > 0 ? "bg-emerald-500" : "bg-rose-500",
                )}
                style={{ width: `${Math.max(occupancyPercent, 2)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Chưa có dữ liệu.</p>
        )}
      </div>
    </section>
  );
}
