type ResolveSingleRoomSurchargeInput = {
  durationNights: number;
  unitPrice: number;
  configuredSurcharge?: number | bigint | null;
};

const DEFAULT_SURCHARGE_STANDARD = 200_000;
const DEFAULT_SURCHARGE_PREMIUM = 300_000;
const PREMIUM_PRICE_THRESHOLD = 3_000_000;

export function resolveSingleRoomSurchargePerAdult({
  durationNights,
  unitPrice,
  configuredSurcharge,
}: ResolveSingleRoomSurchargeInput) {
  if (!Number.isFinite(durationNights) || durationNights <= 0) {
    return 0;
  }

  const configured = Number(configuredSurcharge ?? 0);
  if (Number.isFinite(configured) && configured > 0) {
    return Math.round(configured);
  }

  return unitPrice >= PREMIUM_PRICE_THRESHOLD
    ? DEFAULT_SURCHARGE_PREMIUM
    : DEFAULT_SURCHARGE_STANDARD;
}

