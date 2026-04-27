// TÓM TẮT API: src/app/api/auth/[...nextauth]/route.ts
// Phạm vi: API xác thực (auth).
// Luồng chính: kiểm tra quyền -> rate limit -> parse body -> validate schema -> xử lý DB -> trả response nhất quán.

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

const handler = NextAuth(authOptions);

// LUỒNG: Route catch-all NextAuth uy quyen GET/POST cho handler NextAuth (session, csrf, signin, callback).
export { handler as GET, handler as POST };








