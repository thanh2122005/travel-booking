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
  const normalizedTitle = input.tourTitle.trim() || "Không rõ tour";

  return [
    CAPACITY_SHORTAGE_TAG,
    `Tour: ${normalizedTitle}`,
    `Ngày đi: ${departureDate || "Chưa xác định"}`,
    `Số khách yêu cầu: ${input.requestedGuests}`,
    `Số chỗ còn lại: ${input.remainingSeats}`,
    "Yêu cầu ưu tiên xử lý gấp: liên hệ khách để tư vấn phương án phù hợp.",
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
  // Hỗ trợ cả format cũ (không dấu) và format mới (có dấu).
  const departureDateLine = lines.find((line) => line.startsWith("Ngày đi:") || line.startsWith("Ngay di:"));
  const departureDate = parseTextAfterPrefix(departureDateLine, departureDateLine?.startsWith("Ngày đi:") ? "Ngày đi:" : "Ngay di:");
  const requestedGuestsLine = lines.find((line) => line.startsWith("Số khách yêu cầu:") || line.startsWith("So khach yeu cau:"));
  const requestedGuests = parseNumberFromLine(requestedGuestsLine);
  const remainingSeatsLine = lines.find((line) => line.startsWith("Số chỗ còn lại:") || line.startsWith("So cho con lai:"));
  const remainingSeats = parseNumberFromLine(remainingSeatsLine);

  return {
    tourTitle,
    departureDate,
    requestedGuests,
    remainingSeats,
  };
}
