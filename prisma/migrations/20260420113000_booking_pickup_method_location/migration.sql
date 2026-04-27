-- Add pickup fields for booking operation flow:
-- - pickup_method: SELF_ARRIVAL / NEED_PICKUP
-- - pickup_location: optional customer desired pickup point
ALTER TABLE `Booking`
  ADD COLUMN `pickupMethod` ENUM('SELF_ARRIVAL', 'NEED_PICKUP') NOT NULL DEFAULT 'SELF_ARRIVAL',
  ADD COLUMN `pickupLocation` VARCHAR(191) NULL;
