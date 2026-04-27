USE `travel_booking`;
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `favorite`;
TRUNCATE TABLE `review`;
TRUNCATE TABLE `booking`;
TRUNCATE TABLE `itinerary`;
TRUNCATE TABLE `tourimage`;
TRUNCATE TABLE `contactinquiry`;
TRUNCATE TABLE `tour`;
TRUNCATE TABLE `location`;
TRUNCATE TABLE `newslettersubscriber`;
TRUNCATE TABLE `user`;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO `user` (`id`,`fullName`,`email`,`passwordHash`,`avatarUrl`,`phone`,`role`,`status`,`createdAt`,`updatedAt`) VALUES
('admin_01','Quan tri vien he thong','admin@example.com','$2b$10$GHBpb5dprElBoReXvlRMYuBgfJbtfyKOHhLIDyM3a/kOh8koSzFoq',NULL,'0909000000','ADMIN','ACTIVE',NOW(3),NOW(3)),
('user_01','Nguyen Minh Anh','user1@example.com','$2b$10$Mz2TJwptW8lJtOky5FZkk.B73LTmnXztSxcc/1lgMQAp8UL71qA32',NULL,'0909000001','USER','ACTIVE',NOW(3),NOW(3)),
('user_02','Ly Thanh Tam','user2@example.com','$2b$10$Mz2TJwptW8lJtOky5FZkk.B73LTmnXztSxcc/1lgMQAp8UL71qA32',NULL,'0909000002','USER','ACTIVE',NOW(3),NOW(3));

INSERT INTO `location` (`id`,`name`,`slug`,`provinceOrCity`,`country`,`shortDescription`,`description`,`imageUrl`,`gallery`,`featured`,`createdAt`,`updatedAt`) VALUES
('loc_hn','Ha Noi','ha-noi','Ha Noi','Viet Nam','Thu do nghin nam van hien','Kham pha van hoa, am thuc va cac diem den noi bat tai Ha Noi.','/immerse-vietnam/images/HaNoi/hanoicover.jpg',JSON_ARRAY('/immerse-vietnam/images/HaNoi/HN1.jpg','/immerse-vietnam/images/HaNoi/HN2.jpg'),1,NOW(3),NOW(3)),
('loc_dn','Da Nang','da-nang','Da Nang','Viet Nam','Thanh pho bien hien dai','Trai nghiem bien xanh, am thuc va cac diem check-in noi bat.','/immerse-vietnam/images/DaNang/danangcover.jpg',JSON_ARRAY('/immerse-vietnam/images/DaNang/DN1.jpg','/immerse-vietnam/images/DaNang/DaNang.jpg'),1,NOW(3),NOW(3)),
('loc_hl','Ha Long','ha-long','Quang Ninh','Viet Nam','Ky quan thien nhien the gioi','Du ngoan vinh bien, hang dong va nghi duong cao cap.','/immerse-vietnam/images/HaLong/halongcover.jpg',JSON_ARRAY('/immerse-vietnam/images/HaLong/HL1.webp','/immerse-vietnam/images/HaLong/HL2.webp'),1,NOW(3),NOW(3));

INSERT INTO `tour` (`id`,`title`,`slug`,`shortDescription`,`description`,`price`,`discountPrice`,`durationDays`,`durationNights`,`singleRoomSurchargePerAdult`,`maxGuests`,`transportation`,`departureLocation`,`featuredImage`,`status`,`featured`,`locationId`,`createdAt`,`updatedAt`) VALUES
('tour_hn_hl_3n2d','Ha Noi - Ha Long 3N2D','ha-noi-ha-long-3n2d','Tour nghi duong ket hop tham quan Vinh Ha Long.','Lich trinh phu hop cho gia dinh va nhom ban, xe dua don tieu chuan du lich.',3890000,3490000,3,2,300000,30,'Xe du lich','Ha Noi','/immerse-vietnam/images/HaLong/halongcover.jpg','ACTIVE',1,'loc_hl',NOW(3),NOW(3)),
('tour_dn_ha_4n3d','Da Nang - Hoi An 4N3D','da-nang-hoi-an-4n3d','Kham pha mien Trung nang dong va co kinh.','Ket hop bien Da Nang va pho co Hoi An voi lich trinh can bang.',4490000,3890000,4,3,300000,28,'Xe du lich','Da Nang','/immerse-vietnam/images/DaNang/danangcover.jpg','ACTIVE',1,'loc_dn',NOW(3),NOW(3)),
('tour_hn_city_2n1d','Ha Noi City Break 2N1D','ha-noi-city-break-2n1d','Tour ngan ngay kham pha thu do.','Phu hop khach ban ron muon trai nghiem nhanh diem noi bat Ha Noi.',2590000,2290000,2,1,250000,24,'Xe du lich','Ha Noi','/immerse-vietnam/images/HaNoi/hanoicover.jpg','ACTIVE',0,'loc_hn',NOW(3),NOW(3));

INSERT INTO `tourimage` (`id`,`tourId`,`imageUrl`,`sortOrder`) VALUES
('img_1','tour_hn_hl_3n2d','/immerse-vietnam/images/HaLong/HL1.webp',1),
('img_2','tour_hn_hl_3n2d','/immerse-vietnam/images/HaLong/HL2.webp',2),
('img_3','tour_dn_ha_4n3d','/immerse-vietnam/images/DaNang/DN1.jpg',1),
('img_4','tour_dn_ha_4n3d','/immerse-vietnam/images/HoiAn/HA1.jpg',2),
('img_5','tour_hn_city_2n1d','/immerse-vietnam/images/HaNoi/HN1.jpg',1);

INSERT INTO `itinerary` (`id`,`tourId`,`dayNumber`,`title`,`description`) VALUES
('it_1','tour_hn_hl_3n2d',1,'Khoi hanh Ha Noi','Don khach tai diem hen, di chuyen den Ha Long va nhan phong.'),
('it_2','tour_hn_hl_3n2d',2,'Tham quan Vinh','Du ngoan vinh, kham pha hang dong va hoat dong tu do.'),
('it_3','tour_hn_hl_3n2d',3,'Ket thuc hanh trinh','Tra phong va tro ve Ha Noi.'),
('it_4','tour_dn_ha_4n3d',1,'Den Da Nang','Don khach, check-in khach san va tham quan thanh pho.'),
('it_5','tour_dn_ha_4n3d',2,'Ba Na Hills','Trai nghiem khu du lich va cac diem check-in noi bat.'),
('it_6','tour_dn_ha_4n3d',3,'Hoi An','Tham quan pho co va thuong thuc am thuc dia phuong.'),
('it_7','tour_dn_ha_4n3d',4,'Ket thuc','Mua sam, tra phong va tien khach.'),
('it_8','tour_hn_city_2n1d',1,'Pho co Ha Noi','Kham pha Ho Guom, pho co va am thuc dac sac.'),
('it_9','tour_hn_city_2n1d',2,'Lang nghe truyen thong','Tham quan va ket thuc tour.');

INSERT INTO `booking` (
  `id`,`bookingCode`,`userId`,`tourId`,`fullName`,`email`,`phone`,`numberOfGuests`,`guestsFrom8`,`child5To7Guests`,`childUnder5Guests`,`roomType`,`pickupMethod`,`pickupLocation`,`note`,`baseGuestTotal`,`roomSurchargeTotal`,`unitPriceSnapshot`,`discountPriceSnapshot`,`child5To7RatioSnapshot`,`childUnder5RatioSnapshot`,`singleRoomSurchargePerAdultSnapshot`,`durationNightsSnapshot`,`totalPrice`,`status`,`paymentMethod`,`paymentStatus`,`paymentRequestedAt`,`paymentVerifiedAt`,`paymentVerifiedById`,`paymentVerifiedByName`,`ticketCode`,`checkInCode`,`ticketIssuedAt`,`departureDate`,`createdAt`,`updatedAt`
) VALUES
(
  'booking_01','TB202600001','user_01','tour_dn_ha_4n3d','Nguyen Minh Anh','user1@example.com','0909000001',1,1,0,0,'DOUBLE','SELF_ARRIVAL',NULL,'Khach yeu cau phong gan bien',3890000,0,3890000,3890000,0.5,0,300000,3,3890000,'CONFIRMED','Thanh toan khi xac nhan','PAID',NOW(3),NOW(3),'admin_01','Quan tri vien','VE-TB202600001','CI-TB202600001',NOW(3),DATE_ADD(CURDATE(), INTERVAL 7 DAY),NOW(3),NOW(3)
),
(
  'booking_02','TB202600002','user_02','tour_hn_hl_3n2d','Ly Thanh Tam','user2@example.com','0909000002',2,2,0,0,'SINGLE','NEED_PICKUP','Hai Duong','Can goi xac nhan diem don',6980000,600000,3490000,3490000,0.5,0,300000,2,7580000,'PENDING','Thanh toan khi xac nhan','UNPAID',NULL,NULL,NULL,NULL,NULL,NULL,NULL,DATE_ADD(CURDATE(), INTERVAL 10 DAY),NOW(3),NOW(3)
);

INSERT INTO `review` (`id`,`userId`,`tourId`,`rating`,`comment`,`isVisible`,`createdAt`,`updatedAt`) VALUES
('review_01','user_01','tour_dn_ha_4n3d',5,'Lich trinh hop ly, huong dan vien nhiet tinh.',1,NOW(3),NOW(3)),
('review_02','user_02','tour_hn_hl_3n2d',4,'Canh dep va dich vu on, se quay lai.',1,NOW(3),NOW(3));

INSERT INTO `favorite` (`id`,`userId`,`tourId`,`createdAt`) VALUES
('fav_01','user_01','tour_dn_ha_4n3d',NOW(3)),
('fav_02','user_01','tour_hn_hl_3n2d',NOW(3));

INSERT INTO `contactinquiry` (`id`,`referenceCode`,`fullName`,`phone`,`email`,`tourId`,`departureDate`,`numberOfGuests`,`message`,`status`,`createdAt`,`updatedAt`) VALUES
('inq_01','TV202600001','Nguyen Minh Anh','0909000001','user1@example.com','tour_dn_ha_4n3d',DATE_ADD(CURDATE(), INTERVAL 9 DAY),2,'Minh can lich trinh nhe cho gia dinh co tre nho.','PENDING',NOW(3),NOW(3)),
('inq_02','TV202600002','Ly Thanh Tam','0909000002','user2@example.com','tour_hn_hl_3n2d',DATE_ADD(CURDATE(), INTERVAL 15 DAY),3,'Can tu van them ve chi phi phu thu phong don.','RESOLVED',NOW(3),NOW(3));

INSERT INTO `newslettersubscriber` (`id`,`email`,`createdAt`) VALUES
('news_01','ngoclinh.travel@gmail.com',NOW(3)),
('news_02','huynhbao.booking@gmail.com',NOW(3)),
('news_03','lananh.explore@gmail.com',NOW(3));

CREATE TABLE IF NOT EXISTS booking_activity_logs (
  id VARCHAR(191) PRIMARY KEY,
  booking_id VARCHAR(191) NOT NULL,
  action VARCHAR(80) NOT NULL,
  actor_id VARCHAR(191) NULL,
  actor_name VARCHAR(191) NULL,
  detail_json LONGTEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_booking_activity_logs_booking_created (booking_id, created_at),
  INDEX idx_booking_activity_logs_action_created (action, created_at),
  CONSTRAINT fk_booking_activity_logs_booking
    FOREIGN KEY (booking_id) REFERENCES booking(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id VARCHAR(191) PRIMARY KEY,
  action VARCHAR(80) NOT NULL,
  actor_id VARCHAR(191) NULL,
  actor_name VARCHAR(191) NULL,
  booking_code VARCHAR(191) NULL,
  detail_json LONGTEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_admin_activity_logs_action_created (action, created_at),
  INDEX idx_admin_activity_logs_booking_created (booking_code, created_at)
);

DELETE FROM booking_activity_logs;
DELETE FROM admin_activity_logs;

INSERT INTO booking_activity_logs (`id`,`booking_id`,`action`,`actor_id`,`actor_name`,`detail_json`,`created_at`) VALUES
('bal_01','booking_01','BOOKING_STATUS_UPDATED','admin_01','Quan tri vien',JSON_OBJECT('status','CONFIRMED'),NOW(3)),
('bal_02','booking_01','BOOKING_PAYMENT_UPDATED','admin_01','Quan tri vien',JSON_OBJECT('paymentStatus','PAID'),NOW(3)),
('bal_03','booking_01','BOOKING_CHECKED_IN','admin_01','Quan tri vien',JSON_OBJECT('checkedInAt', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')),NOW(3));

INSERT INTO admin_activity_logs (`id`,`action`,`actor_id`,`actor_name`,`booking_code`,`detail_json`,`created_at`) VALUES
('aal_01','ADMIN_LOGIN','admin_01','Quan tri vien',NULL,JSON_OBJECT('message','Dang nhap admin thanh cong'),NOW(3)),
('aal_02','INQUIRY_STATUS_UPDATED','admin_01','Quan tri vien','TB202600001',JSON_OBJECT('status','RESOLVED'),NOW(3));


