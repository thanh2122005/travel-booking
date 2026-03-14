import { InquiryStatus, Prisma } from "@prisma/client";
import {
  demoExportContactInquiries,
  demoGetContactInquiries,
  demoUpdateContactInquiryStatus,
} from "@/lib/demo/contact-inquiry-store";
import {
  demoExportNewsletterSubscribers,
  demoGetNewsletterSubscribers,
} from "@/lib/demo/newsletter-subscriber-store";
import { isDatabaseUnavailableError } from "@/lib/db/db-error";
import { db } from "@/lib/db/prisma";

type AdminListFilter = {
  search?: string;
  page?: number;
  pageSize?: number;
};

type AdminInquiryListFilter = AdminListFilter & {
  status?: InquiryStatus;
  createdFrom?: Date;
  createdTo?: Date;
};

type AdminNewsletterListFilter = AdminListFilter & {
  createdFrom?: Date;
  createdTo?: Date;
};

const MAX_ADMIN_DATE_RANGE_DAYS = 366;

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
}

function parseDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getPagination(filter: AdminListFilter, defaultPageSize = 15) {
  const page = Math.max(filter.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filter.pageSize ?? defaultPageSize, 1), 50);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

function normalizeDateRange(from?: Date, to?: Date, maxDays = MAX_ADMIN_DATE_RANGE_DAYS) {
  let start = from ? startOfDay(from) : undefined;
  let end = to ? endOfDay(to) : undefined;

  if (!start && !end) {
    return { start, end };
  }

  if (!start && end) {
    start = startOfDay(end);
    start.setDate(start.getDate() - (maxDays - 1));
  }

  if (start && !end) {
    end = endOfDay(start);
    end.setDate(end.getDate() + (maxDays - 1));
  }

  if (start && end && start > end) {
    const swappedStart = startOfDay(end);
    const swappedEnd = endOfDay(start);
    start = swappedStart;
    end = swappedEnd;
  }

  if (start && end) {
    const days =
      Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
    if (days > maxDays) {
      start = startOfDay(end);
      start.setDate(start.getDate() - (maxDays - 1));
    }
  }

  return { start, end };
}

function buildInquiryWhere(filter: AdminInquiryListFilter) {
  const { start: createdFrom, end: createdTo } = normalizeDateRange(filter.createdFrom, filter.createdTo);

  const where: Prisma.ContactInquiryWhereInput = filter.search
    ? {
        OR: [
          { referenceCode: { contains: filter.search, mode: "insensitive" } },
          { fullName: { contains: filter.search, mode: "insensitive" } },
          { phone: { contains: filter.search, mode: "insensitive" } },
          { email: { contains: filter.search, mode: "insensitive" } },
          { message: { contains: filter.search, mode: "insensitive" } },
          { tour: { title: { contains: filter.search, mode: "insensitive" } } },
        ],
      }
    : {};

  if (filter.status) {
    where.status = filter.status;
  }

  if (createdFrom || createdTo) {
    where.createdAt = {
      ...(createdFrom ? { gte: createdFrom } : {}),
      ...(createdTo ? { lte: createdTo } : {}),
    };
  }

  return where;
}

function buildNewsletterWhere(filter: AdminNewsletterListFilter) {
  const { start: createdFrom, end: createdTo } = normalizeDateRange(filter.createdFrom, filter.createdTo);

  const where: Prisma.NewsletterSubscriberWhereInput = filter.search
    ? {
        email: { contains: filter.search, mode: "insensitive" },
      }
    : {};

  if (createdFrom || createdTo) {
    where.createdAt = {
      ...(createdFrom ? { gte: createdFrom } : {}),
      ...(createdTo ? { lte: createdTo } : {}),
    };
  }

  return where;
}

function mapDemoInquiry(
  item: Awaited<ReturnType<typeof demoGetContactInquiries>>["items"][number],
) {
  return {
    ...item,
    departureDate: parseDate(item.departureDate),
    createdAt: parseDate(item.createdAt) ?? new Date(),
    updatedAt: parseDate(item.updatedAt) ?? parseDate(item.createdAt) ?? new Date(),
    tour: null as { title: string; slug: string } | null,
  };
}

function mapDemoNewsletter(
  item: Awaited<ReturnType<typeof demoGetNewsletterSubscribers>>["items"][number],
) {
  return {
    ...item,
    createdAt: parseDate(item.createdAt) ?? new Date(),
  };
}

export async function getAdminInquiries(filter: AdminInquiryListFilter = {}) {
  try {
    const { page, pageSize, skip } = getPagination(filter, 15);
    const where = buildInquiryWhere(filter);

    const [total, items] = await Promise.all([
      db.contactInquiry.count({ where }),
      db.contactInquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          tour: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const demoData = await demoGetContactInquiries(filter);
      return {
        ...demoData,
        items: demoData.items.map(mapDemoInquiry),
      };
    }
    throw error;
  }
}

export async function exportAdminInquiries(filter: AdminInquiryListFilter = {}) {
  try {
    const where = buildInquiryWhere(filter);
    return db.contactInquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: {
        tour: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const demoData = await demoExportContactInquiries(filter);
      return demoData.map(mapDemoInquiry);
    }
    throw error;
  }
}

export async function updateAdminInquiryStatus(inquiryId: string, status: InquiryStatus) {
  try {
    return db.contactInquiry.update({
      where: { id: inquiryId },
      data: { status },
      include: {
        tour: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const updated = await demoUpdateContactInquiryStatus(inquiryId, status);
      return updated ? mapDemoInquiry(updated) : null;
    }
    throw error;
  }
}

export async function getAdminNewsletterSubscribers(filter: AdminNewsletterListFilter = {}) {
  try {
    const { page, pageSize, skip } = getPagination(filter, 15);
    const where = buildNewsletterWhere(filter);

    const [total, items] = await Promise.all([
      db.newsletterSubscriber.count({ where }),
      db.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const demoData = await demoGetNewsletterSubscribers(filter);
      return {
        ...demoData,
        items: demoData.items.map(mapDemoNewsletter),
      };
    }
    throw error;
  }
}

export async function exportAdminNewsletterSubscribers(filter: AdminNewsletterListFilter = {}) {
  try {
    const where = buildNewsletterWhere(filter);
    return db.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      const demoData = await demoExportNewsletterSubscribers(filter);
      return demoData.map(mapDemoNewsletter);
    }
    throw error;
  }
}
