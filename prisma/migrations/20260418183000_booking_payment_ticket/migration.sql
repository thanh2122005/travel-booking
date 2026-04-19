-- Add lightweight payment request + ticket issuance fields for Booking
ALTER TABLE `Booking`
  ADD COLUMN `paymentRequestedAt` DATETIME(3) NULL,
  ADD COLUMN `paymentVerifiedAt` DATETIME(3) NULL,
  ADD COLUMN `paymentVerifiedById` VARCHAR(191) NULL,
  ADD COLUMN `paymentVerifiedByName` VARCHAR(191) NULL,
  ADD COLUMN `ticketCode` VARCHAR(191) NULL,
  ADD COLUMN `checkInCode` VARCHAR(191) NULL,
  ADD COLUMN `ticketIssuedAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `Booking_ticketCode_key` ON `Booking`(`ticketCode`);
CREATE UNIQUE INDEX `Booking_checkInCode_key` ON `Booking`(`checkInCode`);
