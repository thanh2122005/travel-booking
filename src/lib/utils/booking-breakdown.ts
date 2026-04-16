export type BookingGuestBreakdown = {
  adults: number;
  child5To7: number;
  childUnder5: number;
  total: number;
  inferred: boolean;
};

type ResolveBreakdownInput = {
  numberOfGuests: number;
  totalPrice: number;
  unitPrice: number;
  guestsFrom8?: number | null;
  child5To7Guests?: number | null;
  childUnder5Guests?: number | null;
};

function toAllAdults(totalGuests: number, inferred: boolean): BookingGuestBreakdown {
  return {
    adults: Math.max(0, totalGuests),
    child5To7: 0,
    childUnder5: 0,
    total: Math.max(0, totalGuests),
    inferred,
  };
}

function inferBreakdownFromTotals(totalGuests: number, totalPrice: number, unitPrice: number) {
  if (!Number.isFinite(totalGuests) || totalGuests <= 0) return null;
  if (!Number.isFinite(totalPrice) || totalPrice < 0) return null;
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) return null;

  const weightedGuests = totalPrice / unitPrice;
  if (!Number.isFinite(weightedGuests)) return null;

  let best:
    | {
        adults: number;
        child5To7: number;
        childUnder5: number;
        score: number;
      }
    | null = null;

  for (let adults = totalGuests; adults >= 0; adults -= 1) {
    const child5To7 = Math.round((weightedGuests - adults) * 2);
    if (child5To7 < 0) continue;
    if (child5To7 > totalGuests - adults) continue;
    const childUnder5 = totalGuests - adults - child5To7;
    if (childUnder5 < 0) continue;

    const recomputed = Math.round(unitPrice * (adults + child5To7 * 0.5));
    if (recomputed !== totalPrice) continue;

    // Ưu tiên phương án có >= 1 người lớn, sau đó ưu tiên nhiều người lớn hơn.
    const score = (adults >= 1 ? 10000 : 0) + adults * 100 + childUnder5;
    if (!best || score > best.score) {
      best = { adults, child5To7, childUnder5, score };
    }
  }

  return best
    ? {
        adults: best.adults,
        child5To7: best.child5To7,
        childUnder5: best.childUnder5,
      }
    : null;
}

export function resolveBookingGuestBreakdown(input: ResolveBreakdownInput): BookingGuestBreakdown {
  const totalGuests = Math.max(0, Math.trunc(input.numberOfGuests));
  const adults = input.guestsFrom8 ?? null;
  const child5To7 = input.child5To7Guests ?? null;
  const childUnder5 = input.childUnder5Guests ?? null;

  if (
    adults !== null &&
    child5To7 !== null &&
    childUnder5 !== null &&
    adults >= 0 &&
    child5To7 >= 0 &&
    childUnder5 >= 0 &&
    adults + child5To7 + childUnder5 === totalGuests
  ) {
    return {
      adults,
      child5To7,
      childUnder5,
      total: totalGuests,
      inferred: false,
    };
  }

  const inferred = inferBreakdownFromTotals(totalGuests, input.totalPrice, input.unitPrice);
  if (inferred) {
    return {
      adults: inferred.adults,
      child5To7: inferred.child5To7,
      childUnder5: inferred.childUnder5,
      total: totalGuests,
      inferred: true,
    };
  }

  return toAllAdults(totalGuests, true);
}
