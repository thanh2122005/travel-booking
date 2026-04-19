import { PaymentStatus } from "@prisma/client";

type BookingPaymentLike = {
  paymentStatus: PaymentStatus | "UNPAID" | "PAID";
  paymentRequestedAt?: Date | string | null;
  ticketCode?: string | null;
  checkInCode?: string | null;
  ticketIssuedAt?: Date | string | null;
  status?: string | null;
};

type PaymentBadgeVariant = "default" | "secondary" | "outline";

export function buildBookingTicketCode(bookingCode: string) {
  return `VE-${bookingCode}`;
}

export function buildBookingCheckInCode(bookingCode: string) {
  return `CI-${bookingCode}`;
}

export function hasPaymentRequest(booking: BookingPaymentLike) {
  return Boolean(booking.paymentRequestedAt);
}

export function hasIssuedTicket(booking: BookingPaymentLike) {
  return booking.paymentStatus === PaymentStatus.PAID && Boolean(booking.ticketCode);
}

export function canRequestBookingPayment(booking: BookingPaymentLike) {
  return (
    booking.status !== "CANCELLED" &&
    booking.paymentStatus === PaymentStatus.UNPAID &&
    !hasPaymentRequest(booking)
  );
}

export function getBookingPaymentPresentation(booking: BookingPaymentLike): {
  label: string;
  description: string;
  variant: PaymentBadgeVariant;
} {
  if (booking.paymentStatus === PaymentStatus.PAID) {
    if (booking.ticketCode) {
      return {
        label: "Đã thanh toán - Vé đã phát hành",
        description: "Bạn có thể dùng mã vé hoặc QR nội bộ để check-in khi đi tour.",
        variant: "default",
      };
    }

    return {
      label: "Đã thanh toán",
      description: "Đơn đã được xác nhận thanh toán.",
      variant: "default",
    };
  }

  if (booking.paymentRequestedAt) {
    return {
      label: "Chờ admin xác nhận",
      description:
        "Bạn đã xác nhận thanh toán. Đội ngũ sẽ kiểm tra và phát hành vé sớm nhất có thể.",
      variant: "secondary",
    };
  }

  return {
    label: "Chưa thanh toán",
    description: "Xác nhận thanh toán để admin duyệt và phát hành vé điện tử.",
    variant: "outline",
  };
}

function createSeed(input: string) {
  let seed = 0;
  for (let index = 0; index < input.length; index += 1) {
    seed = (seed * 31 + input.charCodeAt(index)) >>> 0;
  }
  return seed || 0x13579bdf;
}

function nextSeed(seed: number) {
  let next = seed ^ (seed << 13);
  next ^= next >>> 17;
  next ^= next << 5;
  return next >>> 0;
}

function isFinderModule(row: number, col: number, size: number) {
  const inTopLeft = row < 7 && col < 7;
  const inTopRight = row < 7 && col >= size - 7;
  const inBottomLeft = row >= size - 7 && col < 7;
  return inTopLeft || inTopRight || inBottomLeft;
}

function renderFinderPattern(row: number, col: number, size: number) {
  const top = row < 7;
  const left = col < 7;
  const right = col >= size - 7;
  const bottom = row >= size - 7;

  const localRow = top ? row : bottom ? row - (size - 7) : row;
  const localCol = left ? col : right ? col - (size - 7) : col;
  const outer = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
  const inner = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;
  return outer || inner;
}

export function buildBookingQrSvgDataUri(value: string) {
  const size = 25;
  const cellSize = 5;
  const padding = 4;
  let seed = createSeed(value);
  const cells: string[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      let filled = false;
      if (isFinderModule(row, col, size)) {
        filled = renderFinderPattern(row, col, size);
      } else {
        seed = nextSeed(seed);
        filled = (seed & 1) === 1;
      }

      if (!filled) continue;
      cells.push(
        `<rect x="${(col + padding) * cellSize}" y="${(row + padding) * cellSize}" width="${cellSize}" height="${cellSize}" rx="1" />`,
      );
    }
  }

  const dimension = (size + padding * 2) * cellSize;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" role="img" aria-label="QR vé nội bộ">`,
    `<rect width="${dimension}" height="${dimension}" rx="${cellSize * 2}" fill="#ffffff" />`,
    `<g fill="#0f172a">`,
    ...cells,
    "</g>",
    "</svg>",
  ].join("");

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
