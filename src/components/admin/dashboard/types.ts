import type { BookingStatus, InquiryStatus, PaymentStatus } from "@prisma/client";
import type { LucideIcon } from "lucide-react";

export type DashboardKpiItem = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  deltaText?: string;
  deltaTone?: "up" | "down" | "flat";
  icon: LucideIcon;
};

export type DashboardTimelineItem = {
  monthKey: string;
  label: string;
  bookings: number;
  confirmedRevenue: number;
};

export type DashboardTopTourItem = {
  tourId: string;
  title: string;
  slug: string;
  bookings: number;
  confirmedBookings: number;
  paidBookings: number;
  confirmedRevenue: number;
};

export type DashboardTopCustomerItem = {
  userId: string;
  fullName: string;
  email: string;
  bookings: number;
  confirmedBookings: number;
  paidBookings: number;
  confirmedRevenue: number;
};

export type DashboardRecentBooking = {
  id: string;
  bookingCode: string;
  fullName: string;
  totalPrice: number;
  createdAt: Date;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentRequestedAt?: Date | null;
  ticketCode?: string | null;
  ticketIssuedAt?: Date | null;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  tour: {
    id: string;
    title: string;
    slug: string;
  };
};

export type DashboardRecentReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  user: {
    id: string;
    fullName: string;
  };
  tour: {
    id: string;
    title: string;
    slug: string;
  };
};

export type DashboardRecentInquiry = {
  id: string;
  referenceCode: string;
  fullName: string;
  email: string;
  phone: string;
  numberOfGuests: number;
  departureDate: Date | null;
  message: string;
  status: InquiryStatus;
  createdAt: Date;
  tour: {
    title: string;
    slug: string;
  } | null;
};

export type DashboardSubscriber = {
  id: string;
  email: string;
  createdAt: Date;
};
