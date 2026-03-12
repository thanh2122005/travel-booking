const configuredAuthSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

if (process.env.NODE_ENV === "production" && !configuredAuthSecret) {
  throw new Error(
    "Thiếu AUTH_SECRET/NEXTAUTH_SECRET trong môi trường production. Vui lòng cấu hình biến môi trường bảo mật.",
  );
}

export const authSecret = configuredAuthSecret ?? "travel-booking-dev-secret";
