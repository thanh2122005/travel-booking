SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS `travel_booking`;
CREATE DATABASE `travel_booking` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `travel_booking`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `avatarUrl` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `role` ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  `status` ENUM('ACTIVE','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_role_idx` (`role`),
  KEY `User_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Location` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `provinceOrCity` VARCHAR(191) NOT NULL,
  `country` VARCHAR(191) NOT NULL,
  `shortDescription` TEXT NOT NULL,
  `description` LONGTEXT NOT NULL,
  `imageUrl` VARCHAR(191) NOT NULL,
  `gallery` JSON NOT NULL,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Location_slug_key` (`slug`),
  KEY `Location_featured_idx` (`featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Tour` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `shortDescription` TEXT NOT NULL,
  `description` LONGTEXT NOT NULL,
  `price` INT NOT NULL,
  `discountPrice` INT NULL,
  `durationDays` INT NOT NULL,
  `durationNights` INT NOT NULL,
  `singleRoomSurchargePerAdult` INT NOT NULL DEFAULT 0,
  `maxGuests` INT NOT NULL,
  `transportation` VARCHAR(191) NOT NULL,
  `departureLocation` VARCHAR(191) NOT NULL,
  `featuredImage` VARCHAR(191) NOT NULL,
  `status` ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `locationId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Tour_slug_key` (`slug`),
  KEY `Tour_locationId_idx` (`locationId`),
  KEY `Tour_status_idx` (`status`),
  KEY `Tour_featured_idx` (`featured`),
  KEY `Tour_price_idx` (`price`),
  CONSTRAINT `Tour_locationId_fkey`
    FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `TourImage` (
  `id` VARCHAR(191) NOT NULL,
  `tourId` VARCHAR(191) NOT NULL,
  `imageUrl` VARCHAR(191) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `TourImage_tourId_idx` (`tourId`),
  CONSTRAINT `TourImage_tourId_fkey`
    FOREIGN KEY (`tourId`) REFERENCES `Tour`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Itinerary` (
  `id` VARCHAR(191) NOT NULL,
  `tourId` VARCHAR(191) NOT NULL,
  `dayNumber` INT NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Itinerary_tourId_dayNumber_key` (`tourId`, `dayNumber`),
  KEY `Itinerary_tourId_idx` (`tourId`),
  CONSTRAINT `Itinerary_tourId_fkey`
    FOREIGN KEY (`tourId`) REFERENCES `Tour`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Booking` (
  `id` VARCHAR(191) NOT NULL,
  `bookingCode` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tourId` VARCHAR(191) NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `numberOfGuests` INT NOT NULL,
  `guestsFrom8` INT NULL,
  `child5To7Guests` INT NULL,
  `childUnder5Guests` INT NULL,
  `roomType` ENUM('DOUBLE','SINGLE') NOT NULL DEFAULT 'DOUBLE',
  `pickupMethod` ENUM('SELF_ARRIVAL','NEED_PICKUP') NOT NULL DEFAULT 'SELF_ARRIVAL',
  `pickupLocation` VARCHAR(191) NULL,
  `note` LONGTEXT NULL,
  `baseGuestTotal` INT NOT NULL DEFAULT 0,
  `roomSurchargeTotal` INT NOT NULL DEFAULT 0,
  `unitPriceSnapshot` INT NOT NULL DEFAULT 0,
  `discountPriceSnapshot` INT NULL,
  `child5To7RatioSnapshot` DOUBLE NOT NULL DEFAULT 0.5,
  `childUnder5RatioSnapshot` DOUBLE NOT NULL DEFAULT 0,
  `singleRoomSurchargePerAdultSnapshot` INT NOT NULL DEFAULT 0,
  `durationNightsSnapshot` INT NOT NULL DEFAULT 0,
  `totalPrice` INT NOT NULL,
  `status` ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'PENDING',
  `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'Thanh toan khi xac nhan',
  `paymentStatus` ENUM('UNPAID','PAID') NOT NULL DEFAULT 'UNPAID',
  `paymentRequestedAt` DATETIME(3) NULL,
  `paymentVerifiedAt` DATETIME(3) NULL,
  `paymentVerifiedById` VARCHAR(191) NULL,
  `paymentVerifiedByName` VARCHAR(191) NULL,
  `ticketCode` VARCHAR(191) NULL,
  `checkInCode` VARCHAR(191) NULL,
  `ticketIssuedAt` DATETIME(3) NULL,
  `departureDate` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Booking_bookingCode_key` (`bookingCode`),
  UNIQUE KEY `Booking_ticketCode_key` (`ticketCode`),
  UNIQUE KEY `Booking_checkInCode_key` (`checkInCode`),
  KEY `Booking_userId_idx` (`userId`),
  KEY `Booking_tourId_idx` (`tourId`),
  KEY `Booking_status_idx` (`status`),
  KEY `Booking_paymentStatus_idx` (`paymentStatus`),
  CONSTRAINT `Booking_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Booking_tourId_fkey`
    FOREIGN KEY (`tourId`) REFERENCES `Tour`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Review` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tourId` VARCHAR(191) NOT NULL,
  `rating` INT NOT NULL,
  `comment` LONGTEXT NOT NULL,
  `isVisible` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Review_userId_tourId_key` (`userId`, `tourId`),
  KEY `Review_tourId_idx` (`tourId`),
  KEY `Review_isVisible_idx` (`isVisible`),
  CONSTRAINT `Review_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Review_tourId_fkey`
    FOREIGN KEY (`tourId`) REFERENCES `Tour`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Favorite` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tourId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Favorite_userId_tourId_key` (`userId`, `tourId`),
  KEY `Favorite_userId_idx` (`userId`),
  KEY `Favorite_tourId_idx` (`tourId`),
  CONSTRAINT `Favorite_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Favorite_tourId_fkey`
    FOREIGN KEY (`tourId`) REFERENCES `Tour`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ContactInquiry` (
  `id` VARCHAR(191) NOT NULL,
  `referenceCode` VARCHAR(191) NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `tourId` VARCHAR(191) NULL,
  `departureDate` DATETIME(3) NULL,
  `numberOfGuests` INT NOT NULL,
  `message` LONGTEXT NOT NULL,
  `status` ENUM('PENDING','RESOLVED') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ContactInquiry_referenceCode_key` (`referenceCode`),
  KEY `ContactInquiry_status_idx` (`status`),
  KEY `ContactInquiry_email_idx` (`email`),
  KEY `ContactInquiry_tourId_idx` (`tourId`),
  CONSTRAINT `ContactInquiry_tourId_fkey`
    FOREIGN KEY (`tourId`) REFERENCES `Tour`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `NewsletterSubscriber` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `NewsletterSubscriber_email_key` (`email`),
  KEY `NewsletterSubscriber_email_idx` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
