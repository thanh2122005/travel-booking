# Task: Room Type Pricing (Phòng đơn / Phòng đôi)

## Goal
- Add room-type pricing into existing booking flow.
- Keep current age-based pricing logic.
- Make server the single source of truth for all pricing.
- Store pricing snapshots at booking time for audit and reporting stability.

## Final Business Rules
- Apply room options automatically only when `tour.durationNights > 0`.
- `roomType` options:
  - `DOUBLE` (default)
  - `SINGLE` (with surcharge)
- Age pricing:
  - Adult (`guestsFrom8`): `100%`
  - Child 5-7 (`child5To7Guests`): `50%`
  - Child under 5 (`childUnder5Guests`): `0%`
- Surcharge rule:
  - `roomSurchargeTotal = adults * singleRoomSurchargePerAdult * durationNights` when `roomType=SINGLE`
  - `roomSurchargeTotal = 0` when `roomType=DOUBLE`
- Final pricing:
  - `baseGuestTotal = unitPrice * (adults + child5To7*0.5 + childUnder5*0)`
  - `totalPrice = baseGuestTotal + roomSurchargeTotal`

## DB Changes
- Add enum `RoomType`:
  - `DOUBLE`
  - `SINGLE`

- Add `Tour.singleRoomSurchargePerAdult Int @default(0)`.

- Add booking snapshot and room fields:
  - `Booking.roomType RoomType @default(DOUBLE)`
  - `Booking.baseGuestTotal Int @default(0)`
  - `Booking.roomSurchargeTotal Int @default(0)`
  - `Booking.unitPriceSnapshot Int @default(0)`
  - `Booking.discountPriceSnapshot Int?`
  - `Booking.child5To7RatioSnapshot Float @default(0.5)`
  - `Booking.childUnder5RatioSnapshot Float @default(0)`
  - `Booking.singleRoomSurchargePerAdultSnapshot Int @default(0)`
  - `Booking.durationNightsSnapshot Int @default(0)`

## API / Validation Changes
- Extend booking input with `roomType` (`DOUBLE|SINGLE`, default `DOUBLE`).
- Keep strict validation:
  - `numberOfGuests` must match age breakdown sum.
  - disallow negative values.
  - reject `roomType=SINGLE` when `durationNights <= 0`.
- In `/api/bookings`:
  - ignore any client-provided total amounts.
  - fetch tour pricing and compute server-side.
  - persist full snapshots and computed totals.

## Admin & UI Changes
- Tour create/update forms:
  - Add input: `singleRoomSurchargePerAdult`.
- Tour booking card:
  - Show room type selector only when `durationNights > 0`.
  - Recompute temp total in real time with room surcharge.
  - Show full breakdown:
    - guest total
    - room surcharge
    - final total
- Admin booking views (table/detail):
  - Display `roomType` and surcharge parts.

## Implementation Checklist
- [x] Update Prisma schema.
- [x] Add migration SQL (`prisma/migrations/20260417090000_room_type_pricing/migration.sql`).
- [ ] Apply migration + regenerate Prisma client on local machine.
- [x] Update booking validation schema and types.
- [x] Update admin tour create API + form.
- [x] Update admin tour content API + form.
- [x] Update public booking card UI and payload.
- [x] Update booking API compute + persistence logic.
- [x] Update admin booking query/types display.
- [x] Update seed/demo compatibility (new fields have default fallback in demo flow).
- [x] Add/adjust pricing condition text in booking flow.
- [x] Run checks (`tsc`, lint).

## Test Checklist
- [ ] `durationNights=0` tour: no room selector shown.
- [ ] `durationNights>0` tour: selector shown.
- [ ] `DOUBLE`: total = guest pricing only.
- [ ] `SINGLE`: total adds `adult * surcharge * nights`.
- [ ] Mixed guests (`2 adult + 1 child 5-7`) pricing matches formula.
- [ ] API rejects invalid roomType for 0-night tours.
- [ ] Admin booking detail shows room type + surcharge total.
- [ ] Existing booking flow and availability checks remain stable.
