# CSDL `travel_booking` (Structure Only)

Mục tiêu: cung cấp cấu trúc DB để phân tích nghiệp vụ, vẽ ERD/use case mà không lộ dữ liệu thật.

Nguồn chuẩn: [schema.prisma](d:/Source Code/travel-booking/prisma/schema.prisma) và các migration hiện có trong `prisma/migrations`.

## 1) MySQL DDL (chỉ cấu trúc)

```sql
-- ========================================
-- DATABASE: travel_booking (structure-only)
-- MySQL 8.x / InnoDB / utf8mb4
-- ========================================

CREATE DATABASE IF NOT EXISTS `travel_booking`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `travel_booking`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `Favorite`;
DROP TABLE IF EXISTS `Review`;
DROP TABLE IF EXISTS `Booking`;
DROP TABLE IF EXISTS `Itinerary`;
DROP TABLE IF EXISTS `TourImage`;
DROP TABLE IF EXISTS `ContactInquiry`;
DROP TABLE IF EXISTS `Tour`;
DROP TABLE IF EXISTS `NewsletterSubscriber`;
DROP TABLE IF EXISTS `Location`;
DROP TABLE IF EXISTS `User`;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- User
-- =========================
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

-- =========================
-- Location
-- =========================
CREATE TABLE `Location` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `provinceOrCity` VARCHAR(191) NOT NULL,
  `country` VARCHAR(191) NOT NULL,
  `shortDescription` TEXT NOT NULL,
  `description` LONGTEXT NOT NULL,
  `imageUrl` VARCHAR(191) NOT NULL,
  `gallery` JSON NOT NULL DEFAULT (JSON_ARRAY()),
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Location_slug_key` (`slug`),
  KEY `Location_featured_idx` (`featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Tour
-- =========================
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
    FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TourImage
-- =========================
CREATE TABLE `TourImage` (
  `id` VARCHAR(191) NOT NULL,
  `tourId` VARCHAR(191) NOT NULL,
  `imageUrl` VARCHAR(191) NOT NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `TourImage_tourId_idx` (`tourId`),
  CONSTRAINT `TourImage_tourId_fkey`
    FOREIGN KEY (`tourId`) REFERENCES `Tour`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Itinerary
-- =========================
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
    FOREIGN KEY (`tourId`) REFERENCES `Tour`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Booking
-- =========================
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
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Booking_tourId_fkey`
    FOREIGN KEY (`tourId`) REFERENCES `Tour`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Review
-- =========================
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
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Review_tourId_fkey`
    FOREIGN KEY (`tourId`) REFERENCES `Tour`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Favorite
-- =========================
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
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Favorite_tourId_fkey`
    FOREIGN KEY (`tourId`) REFERENCES `Tour`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- ContactInquiry
-- =========================
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
  KEY `ContactInquiry_tourId_fkey` (`tourId`),
  CONSTRAINT `ContactInquiry_tourId_fkey`
    FOREIGN KEY (`tourId`) REFERENCES `Tour`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- NewsletterSubscriber
-- =========================
CREATE TABLE `NewsletterSubscriber` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `NewsletterSubscriber_email_key` (`email`),
  KEY `NewsletterSubscriber_email_idx` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 2) Quan hệ chính (để ChatGPT đọc nhanh)

- `User (1) - (n) Booking`
- `User (1) - (n) Review`
- `User (1) - (n) Favorite`
- `Location (1) - (n) Tour`
- `Tour (1) - (n) TourImage`
- `Tour (1) - (n) Itinerary`
- `Tour (1) - (n) Booking`
- `Tour (1) - (n) Review`
- `Tour (1) - (n) Favorite`
- `Tour (0..1) - (n) ContactInquiry` (xóa tour => `tourId = NULL`)

## 3) Trả lời câu hỏi của bạn

> “Export SQL dạng structure-only thì ChatGPT khó làm hơn đúng không?”

- Đúng là ChatGPT sẽ **không biết dữ liệu thực tế** (ví dụ top tour, hành vi user cụ thể).
- Nhưng để vẽ **ERD / Use Case / kiến trúc / luồng nghiệp vụ chuẩn**, structure-only là **đủ và đúng**, lại an toàn vì không lộ dữ liệu thật.
- Nếu cần phân tích sâu hơn (ví dụ testcase theo số liệu), chỉ cần thêm 1 file dữ liệu demo nhỏ đã ẩn thông tin nhạy cảm.
