"use client";

import { Clock3, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type TourItineraryItem = {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
};

type TourItinerarySectionProps = {
  itineraries: TourItineraryItem[];
  durationDays: number;
};

function summarizeDescription(description: string) {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (normalized.length <= 120) return normalized;
  return `${normalized.slice(0, 120).trimEnd()}...`;
}

function splitHighlights(description: string) {
  return description
    .split(/[.!?]\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function TourItinerarySection({ itineraries, durationDays }: TourItinerarySectionProps) {
  const sorted = [...itineraries].sort((a, b) => a.dayNumber - b.dayNumber);

  if (!sorted.length) {
    return null;
  }

  return (
    <article id="lich-trinh" className="space-y-4 rounded-3xl border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Lịch trình chi tiết</h2>
        <Dialog>
          <DialogTrigger render={<Button variant="outline" className="h-9 px-4 text-sm font-semibold" />}>
            Xem chi tiết
          </DialogTrigger>
          <DialogContent className="max-h-[88vh] overflow-hidden p-0 sm:max-w-4xl">
            <div className="space-y-4 p-5">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Lịch trình đầy đủ {durationDays} ngày</DialogTitle>
                <DialogDescription>
                  Theo dõi chi tiết từng ngày để chủ động chuẩn bị lịch cá nhân trước khi khởi hành.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 pb-5">
              {sorted.map((item) => {
                const highlights = splitHighlights(item.description);
                return (
                  <section key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                          Ngày {item.dayNumber}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-slate-900">{item.title}</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                        <Clock3 className="h-3.5 w-3.5 text-primary" />
                        Cả ngày
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                    {highlights.length ? (
                      <ul className="mt-3 space-y-2">
                        {highlights.map((point, index) => (
                          <li key={`${item.id}-highlight-${index}`} className="flex gap-2 text-sm text-slate-700">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {sorted.map((item) => (
          <div key={item.id} className="rounded-xl border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                Ngày {item.dayNumber}
              </p>
              <span className="text-xs text-slate-500">Lịch trình theo ngày</span>
            </div>
            <h3 className="mt-1 text-base font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{summarizeDescription(item.description)}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

