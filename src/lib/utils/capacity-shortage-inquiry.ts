const CAPACITY_SHORTAGE_TAG = "[THIEU_CHO]";

type CapacityShortageMessageInput = {
  tourTitle: string;
  departureDate: Date | string;
  requestedGuests: number;
  remainingSeats: number;
};

function toIsoDateOnly(value: Date | string) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return value.toISOString().slice(0, 10);
  }

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return parsed.toISOString().slice(0, 10);
}

export function buildCapacityShortageMessage(input: CapacityShortageMessageInput) {
  const departureDate = toIsoDateOnly(input.departureDate);
  const normalizedTitle = input.tourTitle.trim() || "Khong ro tour";

  return [
    CAPACITY_SHORTAGE_TAG,
    `Tour: ${normalizedTitle}`,
    `Ngay di: ${departureDate || "Chua xac dinh"}`,
    `So khach yeu cau: ${input.requestedGuests}`,
    `So cho con lai: ${input.remainingSeats}`,
    "Yeu cau uu tien xu ly gap: lien he khach de tu van phuong an phu hop.",
  ].join("\n");
}

export function isCapacityShortageMessage(message: string | null | undefined) {
  if (!message) return false;
  return message.includes(CAPACITY_SHORTAGE_TAG);
}

export type ParsedCapacityShortageMessage = {
  tourTitle: string | null;
  departureDate: string | null;
  requestedGuests: number | null;
  remainingSeats: number | null;
};

function parseNumberFromLine(line: string | undefined) {
  if (!line) return null;
  const match = line.match(/(-?\d+)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function parseTextAfterPrefix(line: string | undefined, prefix: string) {
  if (!line) return null;
  if (!line.startsWith(prefix)) return null;
  const value = line.slice(prefix.length).trim();
  return value || null;
}

export function parseCapacityShortageMessage(message: string | null | undefined): ParsedCapacityShortageMessage | null {
  if (!isCapacityShortageMessage(message)) return null;
  const lines = (message ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const tourTitle = parseTextAfterPrefix(lines.find((line) => line.startsWith("Tour:")), "Tour:");
  const departureDate = parseTextAfterPrefix(lines.find((line) => line.startsWith("Ngay di:")), "Ngay di:");
  const requestedGuests = parseNumberFromLine(
    lines.find((line) => line.startsWith("So khach yeu cau:")),
  );
  const remainingSeats = parseNumberFromLine(
    lines.find((line) => line.startsWith("So cho con lai:")),
  );

  return {
    tourTitle,
    departureDate,
    requestedGuests,
    remainingSeats,
  };
}
