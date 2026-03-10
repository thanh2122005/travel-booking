export type CatalogLocation = {
  name: string;
  slug: string;
  provinceOrCity: string;
  country: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  featured?: boolean;
};

export type CatalogTour = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  discountPrice?: number;
  durationDays: number;
  durationNights: number;
  maxGuests: number;
  transportation: string;
  departureLocation: string;
  featuredImage: string;
  gallery: string[];
  featured?: boolean;
  status?: "ACTIVE" | "INACTIVE";
  locationSlug: string;
  itineraryTitles: string[];
};

export type CatalogTravelerProfile = {
  fullName: string;
  email: string;
  phone: string;
};

export const localAvatarPool = [
  "/immerse-vietnam/images/test-1.jpg",
  "/immerse-vietnam/images/test-2.jpg",
  "/immerse-vietnam/images/test-3.jpg",
] as const;

export const catalogLocations: CatalogLocation[] = [
  {
    name: "Hà Nội",
    slug: "ha-noi",
    provinceOrCity: "Hà Nội",
    country: "Việt Nam",
    shortDescription: "Thủ đô nghìn năm văn hiến, giàu chiều sâu lịch sử.",
    description:
      "Hà Nội nổi bật với khu phố cổ, Hồ Gươm, văn hóa ẩm thực đường phố và nhiều di tích lâu đời.",
    imageUrl: "/immerse-vietnam/images/HaNoi/hanoicover.jpg",
    gallery: [
      "/immerse-vietnam/images/HaNoi/HN1.jpg",
      "/immerse-vietnam/images/HaNoi/HN2.jpg",
      "/immerse-vietnam/images/HaNoi/HN4.jpg",
    ],
    featured: true,
  },
  {
    name: "Đà Nẵng",
    slug: "da-nang",
    provinceOrCity: "Đà Nẵng",
    country: "Việt Nam",
    shortDescription: "Thành phố biển hiện đại với nhịp sống năng động.",
    description:
      "Đà Nẵng hấp dẫn bởi biển đẹp, hạ tầng du lịch tốt, ẩm thực phong phú và vị trí kết nối miền Trung.",
    imageUrl: "/immerse-vietnam/images/DaNang/danangcover.jpg",
    gallery: [
      "/immerse-vietnam/images/DaNang/DN1.jpg",
      "/immerse-vietnam/images/DaNang/DaNang.jpg",
      "/immerse-vietnam/images/DN.jpg",
    ],
    featured: true,
  },
  {
    name: "Hội An",
    slug: "hoi-an",
    provinceOrCity: "Quảng Nam",
    country: "Việt Nam",
    shortDescription: "Phố cổ thơ mộng, giàu bản sắc văn hóa địa phương.",
    description:
      "Hội An phù hợp cho du lịch nghỉ dưỡng nhẹ nhàng, khám phá di sản và trải nghiệm đời sống bản địa.",
    imageUrl: "/immerse-vietnam/images/HoiAn/hoiancover.jpg",
    gallery: [
      "/immerse-vietnam/images/HoiAn/HA1.jpg",
      "/immerse-vietnam/images/HoiAn/HA2.jpg",
      "/immerse-vietnam/images/HoiAn/HA3.jpg",
    ],
    featured: true,
  },
  {
    name: "Huế",
    slug: "hue",
    provinceOrCity: "Thừa Thiên Huế",
    country: "Việt Nam",
    shortDescription: "Cố đô trầm mặc với quần thể di sản đặc sắc.",
    description:
      "Huế nổi tiếng với Đại Nội, lăng tẩm, nhã nhạc cung đình và nét ẩm thực cung đình tinh tế.",
    imageUrl: "/immerse-vietnam/images/Hue/huecover.jpg",
    gallery: [
      "/immerse-vietnam/images/Hue/H1.jpeg",
      "/immerse-vietnam/images/Hue/H2.jpg",
      "/immerse-vietnam/images/hue.jpg",
    ],
    featured: false,
  },
  {
    name: "Nha Trang",
    slug: "nha-trang",
    provinceOrCity: "Khánh Hòa",
    country: "Việt Nam",
    shortDescription: "Thiên đường biển đảo với nhiều hoạt động giải trí.",
    description:
      "Nha Trang có đường bờ biển đẹp, khí hậu ôn hòa, phù hợp cho cả nghỉ dưỡng và trải nghiệm gia đình.",
    imageUrl: "/immerse-vietnam/images/NhaTrang/nhatrangcover.jpg",
    gallery: [
      "/immerse-vietnam/images/NhaTrang/NT1.jpg",
      "/immerse-vietnam/images/NhaTrang/Nt2.jpg",
      "/immerse-vietnam/images/NhaTrang/NT3.jpg",
    ],
    featured: true,
  },
  {
    name: "Phú Quốc",
    slug: "phu-quoc",
    provinceOrCity: "Kiên Giang",
    country: "Việt Nam",
    shortDescription: "Đảo ngọc cho kỳ nghỉ cao cấp và lãng mạn.",
    description:
      "Phú Quốc nổi tiếng với biển xanh, hoàng hôn đẹp, hệ sinh thái nghỉ dưỡng phát triển và ẩm thực biển phong phú.",
    imageUrl: "/immerse-vietnam/images/PQ.jpg",
    gallery: [
      "/immerse-vietnam/images/PhuQuoc/PQ1.jpg",
      "/immerse-vietnam/images/PhuQuoc/PQ2.jpg",
      "/immerse-vietnam/images/PhuQuoc/PQ3.jpg",
    ],
    featured: true,
  },
  {
    name: "Đà Lạt",
    slug: "da-lat",
    provinceOrCity: "Lâm Đồng",
    country: "Việt Nam",
    shortDescription: "Thành phố cao nguyên mát lành, ngập tràn trải nghiệm.",
    description:
      "Đà Lạt phù hợp cho cặp đôi, gia đình trẻ và nhóm bạn yêu thích khí hậu mát mẻ cùng nhiều điểm check-in đẹp.",
    imageUrl: "/immerse-vietnam/images/DaLat/dalatcover.jpg",
    gallery: [
      "/immerse-vietnam/images/DaLat/Đl4.jpg",
      "/immerse-vietnam/images/gallery4.jpg",
      "/immerse-vietnam/images/gallery5.jpg",
    ],
    featured: true,
  },
  {
    name: "Hạ Long",
    slug: "ha-long",
    provinceOrCity: "Quảng Ninh",
    country: "Việt Nam",
    shortDescription: "Kỳ quan thiên nhiên thế giới với hành trình du thuyền.",
    description:
      "Hạ Long là điểm đến nổi bật cho nghỉ dưỡng ngắn ngày, du thuyền ngủ đêm và khám phá hang động.",
    imageUrl: "/immerse-vietnam/images/HaLong/halongcover.jpg",
    gallery: [
      "/immerse-vietnam/images/HaLong/HL1.webp",
      "/immerse-vietnam/images/HaLong/HL2.webp",
      "/immerse-vietnam/images/HL1.jpg",
    ],
    featured: true,
  },
  {
    name: "TP. Hồ Chí Minh",
    slug: "ho-chi-minh",
    provinceOrCity: "TP. Hồ Chí Minh",
    country: "Việt Nam",
    shortDescription: "Trung tâm kinh tế sôi động và ẩm thực đa sắc màu.",
    description:
      "Sài Gòn phù hợp cho city tour, food tour và các hành trình liên tuyến miền Nam.",
    imageUrl: "/immerse-vietnam/images/HCM/hcmcover.jpg",
    gallery: [
      "/immerse-vietnam/images/HCM/HCM1.jpg",
      "/immerse-vietnam/images/HCM/HCM2.jpg",
      "/immerse-vietnam/images/HCM/HCM3.jpg",
    ],
    featured: false,
  },
  {
    name: "Hải Phòng",
    slug: "hai-phong",
    provinceOrCity: "Hải Phòng",
    country: "Việt Nam",
    shortDescription: "Thành phố cảng, cửa ngõ khám phá biển đảo phía Bắc.",
    description:
      "Hải Phòng là điểm đi thuận tiện tới Cát Bà, Đồ Sơn và nhiều trải nghiệm ẩm thực hải sản tươi.",
    imageUrl: "/immerse-vietnam/images/HaiPhong/HP1.jpg",
    gallery: [
      "/immerse-vietnam/images/HaiPhong/HP2.jpg",
      "/immerse-vietnam/images/HaiPhong/HP3.jpg",
      "/immerse-vietnam/images/HaiPhong/HP4.jpg",
    ],
    featured: false,
  },
  {
    name: "Phú Yên",
    slug: "phu-yen",
    provinceOrCity: "Phú Yên",
    country: "Việt Nam",
    shortDescription: "Vẻ đẹp biển miền Trung hoang sơ và thơ mộng.",
    description:
      "Phú Yên là lựa chọn lý tưởng cho du khách muốn tránh đông đúc, tìm trải nghiệm biển xanh và cảnh quan nguyên bản.",
    imageUrl: "/immerse-vietnam/images/PhuYen/PY1.jpg",
    gallery: [
      "/immerse-vietnam/images/PhuYen/PY2.jpg",
      "/immerse-vietnam/images/PhuYen/PY3.jpg",
      "/immerse-vietnam/images/PhuYen/PY4.jpg",
    ],
    featured: false,
  },
  {
    name: "Phú Quý",
    slug: "phu-quy",
    provinceOrCity: "Bình Thuận",
    country: "Việt Nam",
    shortDescription: "Hòn đảo nhỏ yên bình với làn nước trong xanh.",
    description:
      "Phú Quý phù hợp cho hành trình khám phá biển đảo mới, nhịp sống bản địa và hoạt động ngoài trời.",
    imageUrl: "/immerse-vietnam/images/PhuQuy/PQuy1.jpg",
    gallery: [
      "/immerse-vietnam/images/PhuQuy/Pquy2.jpg",
      "/immerse-vietnam/images/PhuQuy/Pquy3.jpg",
      "/immerse-vietnam/images/gallery8.jpg",
    ],
    featured: false,
  },
];

const coreCatalogTours: CatalogTour[] = [
  {
    title: "Đà Nẵng - Hội An Trọn Vẹn 4N3Đ",
    slug: "da-nang-hoi-an-tron-ven-4n3d",
    shortDescription: "Biển xanh, phố cổ và những đêm đèn lồng đặc sắc.",
    description:
      "Hành trình cân bằng giữa nghỉ dưỡng và khám phá văn hóa miền Trung, phù hợp khách gia đình và nhóm bạn.",
    price: 5390000,
    discountPrice: 4890000,
    durationDays: 4,
    durationNights: 3,
    maxGuests: 22,
    transportation: "Máy bay + xe du lịch",
    departureLocation: "TP. Hồ Chí Minh",
    featuredImage: "/immerse-vietnam/images/DaNang/DN1.jpg",
    gallery: [
      "/immerse-vietnam/images/DaNang/DaNang.jpg",
      "/immerse-vietnam/images/HoiAn/HA1.jpg",
      "/immerse-vietnam/images/HoiAn/HA2.jpg",
    ],
    featured: true,
    locationSlug: "da-nang",
    itineraryTitles: ["Đón khách", "Bà Nà Hills", "Hội An", "Mua sắm và kết thúc"],
  },
  {
    title: "Đà Nẵng Nghỉ Dưỡng Gia Đình 3N2Đ",
    slug: "da-nang-nghi-duong-gia-dinh-3n2d",
    shortDescription: "Lịch trình nhẹ, phù hợp cho gia đình có trẻ nhỏ.",
    description:
      "Tour chú trọng chất lượng lưu trú, thời gian nghỉ và trải nghiệm an toàn cho nhiều độ tuổi.",
    price: 4290000,
    discountPrice: 3890000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 18,
    transportation: "Máy bay + xe du lịch",
    departureLocation: "Hà Nội",
    featuredImage: "/immerse-vietnam/images/DN1.jpg",
    gallery: [
      "/immerse-vietnam/images/DaNang/danangcover.jpg",
      "/immerse-vietnam/images/DN.jpg",
      "/immerse-vietnam/images/services-bg.png",
    ],
    featured: true,
    locationSlug: "da-nang",
    itineraryTitles: ["Khởi hành", "Biển Mỹ Khê", "Tự do và kết thúc"],
  },
  {
    title: "Hà Nội - Ninh Bình 3N2Đ",
    slug: "ha-noi-ninh-binh-3n2d",
    shortDescription: "Di sản văn hóa và thiên nhiên miền Bắc trong một hành trình.",
    description:
      "Khám phá Hồ Gươm, phố cổ và hành trình về Tràng An - Bái Đính với nhịp độ vừa phải.",
    price: 3690000,
    discountPrice: 3390000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 24,
    transportation: "Xe du lịch",
    departureLocation: "Hà Nội",
    featuredImage: "/immerse-vietnam/images/HaNoi/HN1.jpg",
    gallery: [
      "/immerse-vietnam/images/HaNoi/HN2.jpg",
      "/immerse-vietnam/images/HaNoi/HN4.jpg",
      "/immerse-vietnam/images/HN2.jpg",
    ],
    featured: false,
    locationSlug: "ha-noi",
    itineraryTitles: ["Phố cổ Hà Nội", "Tràng An", "Mua quà và kết thúc"],
  },
  {
    title: "Hà Nội - Sa Pa - Fansipan 4N3Đ",
    slug: "ha-noi-sa-pa-fansipan-4n3d",
    shortDescription: "Săn mây vùng cao kết hợp văn hóa miền Bắc.",
    description:
      "Tour phù hợp cho du khách yêu cảnh quan núi rừng, trải nghiệm cáp treo Fansipan và bản làng địa phương.",
    price: 5590000,
    discountPrice: 5190000,
    durationDays: 4,
    durationNights: 3,
    maxGuests: 20,
    transportation: "Xe cabin + xe du lịch",
    departureLocation: "Hà Nội",
    featuredImage: "/immerse-vietnam/images/HN.jpg",
    gallery: [
      "/immerse-vietnam/images/HaNoi/hanoicover.jpg",
      "/immerse-vietnam/images/gallery7.jpg",
      "/immerse-vietnam/images/gallery8.webp",
    ],
    featured: true,
    locationSlug: "ha-noi",
    itineraryTitles: ["Rời Hà Nội", "Khám phá Sa Pa", "Fansipan", "Trở về"],
  },
  {
    title: "Du Thuyền Hạ Long 2N1Đ",
    slug: "du-thuyen-ha-long-2n1d",
    shortDescription: "Nghỉ đêm trên vịnh với dịch vụ cao cấp.",
    description:
      "Hành trình ngắn ngày nhưng đầy đủ trải nghiệm: chèo kayak, ngắm hoàng hôn và bữa tối trên du thuyền.",
    price: 4690000,
    durationDays: 2,
    durationNights: 1,
    maxGuests: 30,
    transportation: "Limousine",
    departureLocation: "Hà Nội",
    featuredImage: "/immerse-vietnam/images/HaLong/HL1.webp",
    gallery: [
      "/immerse-vietnam/images/HaLong/HL2.webp",
      "/immerse-vietnam/images/HaLong/halongcover.jpg",
      "/immerse-vietnam/images/HL1.jpg",
    ],
    featured: true,
    locationSlug: "ha-long",
    itineraryTitles: ["Lên du thuyền", "Kết thúc hành trình"],
  },
  {
    title: "Hạ Long - Cát Bà 3N2Đ",
    slug: "ha-long-cat-ba-3n2d",
    shortDescription: "Kết hợp kỳ quan thiên nhiên và biển đảo Cát Bà.",
    description:
      "Tour phù hợp cho khách yêu thiên nhiên, muốn trải nghiệm thêm sinh thái biển đảo phía Bắc.",
    price: 5190000,
    discountPrice: 4790000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 24,
    transportation: "Limousine + tàu",
    departureLocation: "Hà Nội",
    featuredImage: "/immerse-vietnam/images/HaLong/halongcoverGOC.jpg",
    gallery: [
      "/immerse-vietnam/images/HaLong/HL1.webp",
      "/immerse-vietnam/images/HaiPhong/HP2.jpg",
      "/immerse-vietnam/images/HaiPhong/HP3.jpg",
    ],
    featured: false,
    locationSlug: "ha-long",
    itineraryTitles: ["Khởi hành", "Cát Bà", "Kết thúc"],
  },
  {
    title: "Hội An Cổ Kính 2N1Đ",
    slug: "hoi-an-co-kinh-2n1d",
    shortDescription: "Dạo phố cổ, thưởng thức ẩm thực và trải nghiệm đêm đèn lồng.",
    description:
      "Tour ngắn ngày cho khách muốn tận hưởng không khí yên bình cùng nét văn hóa đặc trưng miền Trung.",
    price: 2590000,
    durationDays: 2,
    durationNights: 1,
    maxGuests: 20,
    transportation: "Xe du lịch",
    departureLocation: "Đà Nẵng",
    featuredImage: "/immerse-vietnam/images/HoiAn/HA5.jpg",
    gallery: [
      "/immerse-vietnam/images/HoiAn/HA1.jpg",
      "/immerse-vietnam/images/HoiAn/HA3.jpg",
      "/immerse-vietnam/images/HoiAn/HA4.webp",
    ],
    featured: false,
    locationSlug: "hoi-an",
    itineraryTitles: ["Đón khách", "Tham quan phố cổ"],
  },
  {
    title: "Hội An Làng Nghề 3N2Đ",
    slug: "hoi-an-lang-nghe-3n2d",
    shortDescription: "Khám phá làng gốm, làng rau và đời sống bản địa.",
    description:
      "Chương trình nâng cao trải nghiệm văn hóa và tương tác trực tiếp với cộng đồng địa phương.",
    price: 3790000,
    discountPrice: 3490000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 18,
    transportation: "Xe du lịch",
    departureLocation: "Đà Nẵng",
    featuredImage: "/immerse-vietnam/images/HoiAn/hoiancoverGOC.jpg",
    gallery: [
      "/immerse-vietnam/images/HoiAn/HA2.jpg",
      "/immerse-vietnam/images/HoiAn/HA6.png",
      "/immerse-vietnam/images/HA5.jpg",
    ],
    featured: false,
    locationSlug: "hoi-an",
    itineraryTitles: ["Phố cổ Hội An", "Làng nghề truyền thống", "Kết thúc"],
  },
  {
    title: "Huế Di Sản Cố Đô 2N1Đ",
    slug: "hue-di-san-co-do-2n1d",
    shortDescription: "Đại Nội, lăng tẩm và ẩm thực cung đình đặc sắc.",
    description:
      "Hành trình ngắn giúp du khách cảm nhận chiều sâu văn hóa Huế theo phong cách tinh gọn.",
    price: 2790000,
    durationDays: 2,
    durationNights: 1,
    maxGuests: 22,
    transportation: "Xe du lịch",
    departureLocation: "Đà Nẵng",
    featuredImage: "/immerse-vietnam/images/Hue/huecover.jpg",
    gallery: [
      "/immerse-vietnam/images/Hue/H1.jpeg",
      "/immerse-vietnam/images/Hue/H2.jpg",
      "/immerse-vietnam/images/hue.jpg",
    ],
    featured: false,
    locationSlug: "hue",
    itineraryTitles: ["Đại Nội và chùa Thiên Mụ", "Lăng tẩm và kết thúc"],
  },
  {
    title: "Huế - Đà Nẵng 3N2Đ",
    slug: "hue-da-nang-3n2d",
    shortDescription: "Kết hợp thành phố di sản và thành phố biển.",
    description:
      "Tour liên tuyến tiện lợi cho du khách muốn đi trọn miền Trung trong thời gian ngắn.",
    price: 4290000,
    discountPrice: 3990000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 24,
    transportation: "Xe du lịch",
    departureLocation: "TP. Hồ Chí Minh",
    featuredImage: "/immerse-vietnam/images/hue.jpg",
    gallery: [
      "/immerse-vietnam/images/Hue/huecoverGOC.jpg",
      "/immerse-vietnam/images/DaNang/danangcover.jpg",
      "/immerse-vietnam/images/DaNang/DN1.jpg",
    ],
    featured: false,
    locationSlug: "hue",
    itineraryTitles: ["Huế", "Hải Vân - Đà Nẵng", "Kết thúc"],
  },
  {
    title: "Nha Trang Biển Xanh 3N2Đ",
    slug: "nha-trang-bien-xanh-3n2d",
    shortDescription: "Nghỉ dưỡng biển và thưởng thức hải sản tươi.",
    description:
      "Tour phù hợp cho cả gia đình và nhóm bạn, tập trung vào trải nghiệm biển đảo thư giãn.",
    price: 3890000,
    discountPrice: 3590000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 26,
    transportation: "Máy bay + xe du lịch",
    departureLocation: "Hà Nội",
    featuredImage: "/immerse-vietnam/images/NhaTrang/NT1.jpg",
    gallery: [
      "/immerse-vietnam/images/NhaTrang/NT3.jpg",
      "/immerse-vietnam/images/NhaTrang/Nt2.jpg",
      "/immerse-vietnam/images/NT2.jpg",
    ],
    featured: true,
    locationSlug: "nha-trang",
    itineraryTitles: ["Nhận phòng", "Vui chơi biển đảo", "Kết thúc"],
  },
  {
    title: "Nha Trang VinWonders 4N3Đ",
    slug: "nha-trang-vinwonders-4n3d",
    shortDescription: "Trải nghiệm công viên giải trí và nghỉ dưỡng biển.",
    description:
      "Chương trình tối ưu cho gia đình có trẻ em, kết hợp vui chơi và thời gian nghỉ hợp lý.",
    price: 5790000,
    discountPrice: 5290000,
    durationDays: 4,
    durationNights: 3,
    maxGuests: 20,
    transportation: "Máy bay + xe du lịch",
    departureLocation: "TP. Hồ Chí Minh",
    featuredImage: "/immerse-vietnam/images/NhaTrang/nhatrangcover.jpg",
    gallery: [
      "/immerse-vietnam/images/NhaTrang/Nt4.jpg",
      "/immerse-vietnam/images/NhaTrang/Nt5.jpg",
      "/immerse-vietnam/images/NhaTrang/Nt6.webp",
    ],
    featured: false,
    locationSlug: "nha-trang",
    itineraryTitles: ["Khởi hành", "VinWonders", "Biển Nha Trang", "Kết thúc"],
  },
  {
    title: "Phú Quốc Nghỉ Dưỡng 4N3Đ",
    slug: "phu-quoc-nghi-duong-4n3d",
    shortDescription: "Kỳ nghỉ tại đảo ngọc với resort và bãi biển đẹp.",
    description:
      "Tour phổ biến dành cho khách gia đình và cặp đôi cần một kỳ nghỉ trọn gói tiện lợi.",
    price: 6490000,
    discountPrice: 5990000,
    durationDays: 4,
    durationNights: 3,
    maxGuests: 18,
    transportation: "Máy bay + xe du lịch",
    departureLocation: "TP. Hồ Chí Minh",
    featuredImage: "/immerse-vietnam/images/PhuQuoc/PQ1.jpg",
    gallery: [
      "/immerse-vietnam/images/PhuQuoc/PQ2.jpg",
      "/immerse-vietnam/images/PhuQuoc/PQ3.jpg",
      "/immerse-vietnam/images/PhuQuoc/PQ4.jpg",
    ],
    featured: true,
    locationSlug: "phu-quoc",
    itineraryTitles: ["Check-in đảo ngọc", "Cáp treo Hòn Thơm", "Tự do nghỉ dưỡng", "Kết thúc"],
  },
  {
    title: "Phú Quốc Hòn Thơm 3N2Đ",
    slug: "phu-quoc-hon-thom-3n2d",
    shortDescription: "Tập trung trải nghiệm biển đảo và cáp treo vượt biển.",
    description:
      "Lịch trình linh hoạt, phù hợp khách trẻ thích hoạt động ngoài trời và check-in.",
    price: 4990000,
    discountPrice: 4590000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 20,
    transportation: "Máy bay + xe du lịch",
    departureLocation: "Hà Nội",
    featuredImage: "/immerse-vietnam/images/PQ.jpg",
    gallery: [
      "/immerse-vietnam/images/PhuQuoc/PQ4.jpg",
      "/immerse-vietnam/images/PhuQuoc/PQ5.jpeg",
      "/immerse-vietnam/images/PhuQuoc/PQ2.jpg",
    ],
    featured: false,
    locationSlug: "phu-quoc",
    itineraryTitles: ["Khởi hành", "Hòn Thơm", "Kết thúc"],
  },
  {
    title: "Đà Lạt Săn Mây 3N2Đ",
    slug: "da-lat-san-may-3n2d",
    shortDescription: "Trải nghiệm khí hậu cao nguyên và các điểm check-in nổi bật.",
    description:
      "Tour có nhịp độ thoải mái, phù hợp cặp đôi và nhóm bạn trẻ yêu phong cách chill.",
    price: 3390000,
    discountPrice: 3090000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 20,
    transportation: "Xe giường nằm",
    departureLocation: "TP. Hồ Chí Minh",
    featuredImage: "/immerse-vietnam/images/DaLat/dalatcover.jpg",
    gallery: [
      "/immerse-vietnam/images/DaLat/Đl4.jpg",
      "/immerse-vietnam/images/gallery3.jpg",
      "/immerse-vietnam/images/gallery4.jpg",
    ],
    featured: true,
    locationSlug: "da-lat",
    itineraryTitles: ["Khởi hành", "Săn mây và cà phê", "Kết thúc"],
  },
  {
    title: "Đà Lạt Camping Sương Mai 2N1Đ",
    slug: "da-lat-camping-suong-mai-2n1d",
    shortDescription: "Cắm trại ngoại ô, ngắm bình minh và trải nghiệm thiên nhiên.",
    description:
      "Sản phẩm hướng đến khách thích hoạt động ngoài trời, nhóm bạn nhỏ và lịch trình ngắn.",
    price: 2590000,
    durationDays: 2,
    durationNights: 1,
    maxGuests: 16,
    transportation: "Xe du lịch",
    departureLocation: "TP. Hồ Chí Minh",
    featuredImage: "/immerse-vietnam/images/gallery5.jpg",
    gallery: [
      "/immerse-vietnam/images/DaLat/dalatcoverGOC.jpg",
      "/immerse-vietnam/images/gallery6.jpg",
      "/immerse-vietnam/images/gallery7.jpg",
    ],
    featured: false,
    locationSlug: "da-lat",
    itineraryTitles: ["Di chuyển và cắm trại", "Đón bình minh và trở về"],
  },
  {
    title: "Sài Gòn City & Food Tour 2N1Đ",
    slug: "sai-gon-city-food-tour-2n1d",
    shortDescription: "Khám phá nhịp sống đô thị và ẩm thực bản địa.",
    description:
      "Tour city break ngắn ngày, phù hợp khách công tác kết hợp du lịch hoặc khách nội địa cuối tuần.",
    price: 2790000,
    durationDays: 2,
    durationNights: 1,
    maxGuests: 24,
    transportation: "Xe du lịch",
    departureLocation: "TP. Hồ Chí Minh",
    featuredImage: "/immerse-vietnam/images/HCM/HCM1.jpg",
    gallery: [
      "/immerse-vietnam/images/HCM/HCM2.jpg",
      "/immerse-vietnam/images/HCM/HCM3.jpg",
      "/immerse-vietnam/images/HCM3.jpg",
    ],
    featured: false,
    locationSlug: "ho-chi-minh",
    itineraryTitles: ["Trung tâm Sài Gòn", "Food tour và kết thúc"],
  },
  {
    title: "Sài Gòn - Củ Chi - Mỹ Tho 3N2Đ",
    slug: "sai-gon-cu-chi-my-tho-3n2d",
    shortDescription: "Hành trình liên tuyến văn hóa và miền sông nước.",
    description:
      "Tour phù hợp khách muốn khám phá lịch sử và trải nghiệm đời sống miền Tây trong thời gian ngắn.",
    price: 4190000,
    discountPrice: 3890000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 22,
    transportation: "Xe du lịch + thuyền",
    departureLocation: "TP. Hồ Chí Minh",
    featuredImage: "/immerse-vietnam/images/HCM/hcmcover.jpg",
    gallery: [
      "/immerse-vietnam/images/HCM/HCM4.jpg",
      "/immerse-vietnam/images/HCM/HCM5.jpg",
      "/immerse-vietnam/images/HCM1.jpg",
    ],
    featured: false,
    locationSlug: "ho-chi-minh",
    itineraryTitles: ["Sài Gòn", "Củ Chi", "Mỹ Tho và kết thúc"],
  },
  {
    title: "Hải Phòng - Cát Bà 3N2Đ",
    slug: "hai-phong-cat-ba-3n2d",
    shortDescription: "Biển đảo phía Bắc với lịch trình thư giãn.",
    description:
      "Tour kết hợp city tour ngắn tại Hải Phòng và thời gian trải nghiệm biển Cát Bà.",
    price: 4590000,
    discountPrice: 4190000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 20,
    transportation: "Xe du lịch + tàu cao tốc",
    departureLocation: "Hà Nội",
    featuredImage: "/immerse-vietnam/images/HaiPhong/HP1.jpg",
    gallery: [
      "/immerse-vietnam/images/HaiPhong/HP2.jpg",
      "/immerse-vietnam/images/HaiPhong/HP3.jpg",
      "/immerse-vietnam/images/HaiPhong/HP4.jpg",
    ],
    featured: false,
    locationSlug: "hai-phong",
    itineraryTitles: ["Di chuyển đến Hải Phòng", "Cát Bà", "Kết thúc"],
  },
  {
    title: "Hải Phòng Foodie Weekend 2N1Đ",
    slug: "hai-phong-foodie-weekend-2n1d",
    shortDescription: "Cuối tuần ăn ngon và khám phá thành phố cảng.",
    description:
      "Sản phẩm ngắn ngày cho khách trẻ, tập trung trải nghiệm ẩm thực địa phương đặc trưng.",
    price: 2390000,
    durationDays: 2,
    durationNights: 1,
    maxGuests: 20,
    transportation: "Xe du lịch",
    departureLocation: "Hà Nội",
    featuredImage: "/immerse-vietnam/images/HaiPhong/HP5.jpg",
    gallery: [
      "/immerse-vietnam/images/HaiPhong/HP1.jpg",
      "/immerse-vietnam/images/HaiPhong/HP4.jpg",
      "/immerse-vietnam/images/gallery1.jpg",
    ],
    featured: false,
    locationSlug: "hai-phong",
    itineraryTitles: ["City tour và ẩm thực", "Mua sắm và kết thúc"],
  },
  {
    title: "Phú Yên Hoa Vàng Cỏ Xanh 3N2Đ",
    slug: "phu-yen-hoa-vang-co-xanh-3n2d",
    shortDescription: "Trải nghiệm cung đường biển đẹp và khung cảnh nguyên sơ.",
    description:
      "Tour dành cho khách yêu thiên nhiên, muốn chụp ảnh cảnh quan và nghỉ dưỡng nhẹ nhàng.",
    price: 3890000,
    discountPrice: 3590000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 18,
    transportation: "Máy bay + xe du lịch",
    departureLocation: "TP. Hồ Chí Minh",
    featuredImage: "/immerse-vietnam/images/PhuYen/PY1.jpg",
    gallery: [
      "/immerse-vietnam/images/PhuYen/PY2.jpg",
      "/immerse-vietnam/images/PhuYen/PY3.jpg",
      "/immerse-vietnam/images/PhuYen/PY4.jpg",
    ],
    featured: false,
    locationSlug: "phu-yen",
    itineraryTitles: ["Khởi hành", "Cảnh quan Phú Yên", "Kết thúc"],
  },
  {
    title: "Phú Yên - Quy Nhơn 4N3Đ",
    slug: "phu-yen-quy-nhon-4n3d",
    shortDescription: "Hành trình biển miền Trung với nhịp độ vừa phải.",
    description:
      "Kết hợp các điểm đến nổi bật giữa Phú Yên và Quy Nhơn, phù hợp du lịch gia đình.",
    price: 5590000,
    discountPrice: 5190000,
    durationDays: 4,
    durationNights: 3,
    maxGuests: 20,
    transportation: "Máy bay + xe du lịch",
    departureLocation: "Hà Nội",
    featuredImage: "/immerse-vietnam/images/PhuYen/PY5.jpg",
    gallery: [
      "/immerse-vietnam/images/PhuYen/PY1.jpg",
      "/immerse-vietnam/images/PhuYen/PY4.jpg",
      "/immerse-vietnam/images/gallery2.webp",
    ],
    featured: false,
    locationSlug: "phu-yen",
    itineraryTitles: ["Phú Yên", "Quy Nhơn", "Nghỉ dưỡng", "Kết thúc"],
  },
  {
    title: "Phú Quý Đảo Xanh 3N2Đ",
    slug: "phu-quy-dao-xanh-3n2d",
    shortDescription: "Khám phá hòn đảo mới nổi với biển xanh trong vắt.",
    description:
      "Tour phù hợp khách thích hành trình mới, trải nghiệm biển đảo gần gũi và không gian yên bình.",
    price: 4790000,
    discountPrice: 4390000,
    durationDays: 3,
    durationNights: 2,
    maxGuests: 16,
    transportation: "Xe du lịch + tàu cao tốc",
    departureLocation: "TP. Hồ Chí Minh",
    featuredImage: "/immerse-vietnam/images/PhuQuy/PQuy1.jpg",
    gallery: [
      "/immerse-vietnam/images/PhuQuy/Pquy2.jpg",
      "/immerse-vietnam/images/PhuQuy/Pquy3.jpg",
      "/immerse-vietnam/images/gallery8.jpg",
    ],
    featured: false,
    locationSlug: "phu-quy",
    itineraryTitles: ["Ra đảo", "Khám phá Phú Quý", "Trở về"],
  },
  {
    title: "Phú Quý Câu Cá Hoàng Hôn 2N1Đ",
    slug: "phu-quy-cau-ca-hoang-hon-2n1d",
    shortDescription: "Trải nghiệm ngắm hoàng hôn và hoạt động biển đặc trưng.",
    description:
      "Tour ngắn ngày cho khách trẻ, ưu tiên trải nghiệm ngoài trời và chụp ảnh phong cảnh.",
    price: 2990000,
    durationDays: 2,
    durationNights: 1,
    maxGuests: 14,
    transportation: "Xe du lịch + tàu cao tốc",
    departureLocation: "TP. Hồ Chí Minh",
    featuredImage: "/immerse-vietnam/images/PhuQuy/Pquy3.jpg",
    gallery: [
      "/immerse-vietnam/images/PhuQuy/PQuy1.jpg",
      "/immerse-vietnam/images/PhuQuy/Pquy2.jpg",
      "/immerse-vietnam/images/gallery6.jpg",
    ],
    featured: false,
    status: "INACTIVE",
    locationSlug: "phu-quy",
    itineraryTitles: ["Di chuyển ra đảo", "Hoạt động biển và kết thúc"],
  },
];

const supplementalDepartures = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng"] as const;
const supplementalTransportations = [
  "Máy bay + xe du lịch",
  "Xe du lịch",
  "Limousine + xe du lịch",
] as const;

const supplementalCatalogTours: CatalogTour[] = catalogLocations
  .slice(0, 10)
  .map((location, index) => {
    const durationDays = index % 2 === 0 ? 2 : 3;
    const durationNights = Math.max(durationDays - 1, 1);
    const imagePool = Array.from(
      new Set([location.imageUrl, ...location.gallery].filter(Boolean)),
    );
    const featuredImage = imagePool[0] ?? "/immerse-vietnam/images/header-bg.jpg";
    const gallery = imagePool.slice(1, 5).length ? imagePool.slice(1, 5) : [featuredImage];
    const tourSuffix = durationDays === 2 ? "2N1Đ" : "3N2Đ";
    const slug = `${location.slug}-kham-pha-nhanh-${durationDays}n${durationNights}d`;
    const price = 2490000 + index * 260000;
    const discountPrice = price - 300000;

    return {
      title: `${location.name} Khám Phá Nhanh ${tourSuffix}`,
      slug,
      shortDescription: `${location.shortDescription} Lịch trình gọn, dễ đi trong cuối tuần.`,
      description: `Hành trình ngắn ngày tại ${location.name}, tối ưu trải nghiệm địa phương, phù hợp nhóm bạn và gia đình nhỏ.`,
      price,
      discountPrice,
      durationDays,
      durationNights,
      maxGuests: 16 + (index % 4) * 2,
      transportation: supplementalTransportations[index % supplementalTransportations.length]!,
      departureLocation: supplementalDepartures[index % supplementalDepartures.length]!,
      featuredImage,
      gallery,
      featured: index % 3 === 0,
      status: "ACTIVE",
      locationSlug: location.slug,
      itineraryTitles: Array.from({ length: durationDays }).map(
        (_, day) => `Ngày ${day + 1}: Trải nghiệm tại ${location.name}`,
      ),
    } satisfies CatalogTour;
  })
  .filter((candidate) => !coreCatalogTours.some((tour) => tour.slug === candidate.slug));

export const catalogTours: CatalogTour[] = [...coreCatalogTours, ...supplementalCatalogTours];

export const catalogTravelerProfiles: CatalogTravelerProfile[] = [
  { fullName: "Nguyễn Minh Anh", email: "user1@example.com", phone: "0909000001" },
  { fullName: "Trần Bảo Long", email: "user2@example.com", phone: "0909000002" },
  { fullName: "Lê Hoài Nam", email: "user3@example.com", phone: "0909000003" },
  { fullName: "Phạm Thu Trang", email: "user4@example.com", phone: "0909000004" },
  { fullName: "Đặng Khánh Linh", email: "user5@example.com", phone: "0909000005" },
  { fullName: "Vũ Đức Mạnh", email: "user6@example.com", phone: "0909000006" },
  { fullName: "Hoàng Ngọc Mai", email: "user7@example.com", phone: "0909000007" },
  { fullName: "Bùi Quang Huy", email: "user8@example.com", phone: "0909000008" },
  { fullName: "Ngô Phương Thảo", email: "user9@example.com", phone: "0909000009" },
  { fullName: "Phan Gia Bảo", email: "user10@example.com", phone: "0909000010" },
  { fullName: "Lý Thanh Tâm", email: "user11@example.com", phone: "0909000011" },
  { fullName: "Mai Hoàng Phúc", email: "user12@example.com", phone: "0909000012" },
  { fullName: "Tạ Hải Yến", email: "user13@example.com", phone: "0909000013" },
  { fullName: "Trịnh Quốc Vinh", email: "user14@example.com", phone: "0909000014" },
  { fullName: "Đoàn Kim Chi", email: "user15@example.com", phone: "0909000015" },
  { fullName: "Dương Đức Tín", email: "user16@example.com", phone: "0909000016" },
  { fullName: "Tống Nhật Hạ", email: "user17@example.com", phone: "0909000017" },
  { fullName: "Hồ Nhật Minh", email: "user18@example.com", phone: "0909000018" },
  { fullName: "Nguyễn Thanh Vy", email: "user19@example.com", phone: "0909000019" },
  { fullName: "Chu Anh Khoa", email: "user20@example.com", phone: "0909000020" },
  { fullName: "Võ Khánh An", email: "user21@example.com", phone: "0909000021" },
  { fullName: "Lưu Trọng Nhân", email: "user22@example.com", phone: "0909000022" },
  { fullName: "Trần Bích Ngọc", email: "user23@example.com", phone: "0909000023" },
  { fullName: "Lê Gia Hân", email: "user24@example.com", phone: "0909000024" },
];

export const catalogReviewComments = [
  "Lịch trình hợp lý, hướng dẫn viên nhiệt tình và hỗ trợ rất tốt.",
  "Khách sạn sạch sẽ, xe đưa đón đúng giờ, dịch vụ ổn định.",
  "Điểm đến đẹp hơn mong đợi, gia đình mình rất hài lòng.",
  "Trải nghiệm tốt, đồ ăn ngon, sẽ quay lại vào dịp tới.",
  "Tour tổ chức chuyên nghiệp, phù hợp cả người lớn tuổi và trẻ em.",
  "Đặt tour nhanh, tư vấn rõ ràng, không phát sinh chi phí bất ngờ.",
  "Các điểm check-in đẹp, thời lượng tham quan vừa đủ.",
  "Mình thích cách điều phối lịch trình linh hoạt theo thời tiết.",
  "Giá tốt so với chất lượng, đáng để giới thiệu bạn bè.",
  "Đội ngũ chăm sóc khách hàng phản hồi nhanh và rất thân thiện.",
] as const;
