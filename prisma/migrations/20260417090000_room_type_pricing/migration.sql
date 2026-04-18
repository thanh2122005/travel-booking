-- Add room pricing fields for Tour
ALTER TABLE `Tour`
  ADD COLUMN `singleRoomSurchargePerAdult` INTEGER NOT NULL DEFAULT 0;

-- Add room type + pricing snapshot fields for Booking
ALTER TABLE `Booking`
  ADD COLUMN `roomType` ENUM('DOUBLE', 'SINGLE') NOT NULL DEFAULT 'DOUBLE',
  ADD COLUMN `baseGuestTotal` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `roomSurchargeTotal` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `unitPriceSnapshot` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `discountPriceSnapshot` INTEGER NULL,
  ADD COLUMN `child5To7RatioSnapshot` DOUBLE NOT NULL DEFAULT 0.5,
  ADD COLUMN `childUnder5RatioSnapshot` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `singleRoomSurchargePerAdultSnapshot` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `durationNightsSnapshot` INTEGER NOT NULL DEFAULT 0;
