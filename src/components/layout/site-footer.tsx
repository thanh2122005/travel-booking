import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { footerPopularDestinations, footerQuickLinks } from "@/lib/content/site-navigation";
import { getLocations } from "@/lib/db/public-queries";

export async function SiteFooter() {
  const popularDestinations = await getLocations()
    .then((locations) =>
      locations
        .slice()
        .sort((a, b) => Number(b.featured) - Number(a.featured))
        .slice(0, 4)
        .map((location) => ({
          href: `/dia-diem/${location.slug}`,
          label: location.name,
        })),
    )
    .catch(() => footerPopularDestinations);

  return (
    <footer className="iv-footer">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 md:px-6 lg:grid-cols-4">
        <div className="space-y-4">
          <p className="text-2xl font-extrabold tracking-tight text-white">
            Immersive<span className="text-teal-400">Vietnam</span>
          </p>
          <p className="text-sm leading-7 text-slate-300">
            Ná»n táº£ng Ä‘áº·t tour du lá»‹ch Viá»‡t Nam theo hÆ°á»›ng sáº£n pháº©m tháº­t: dá»… dÃ¹ng, Ä‘áº¹p, vÃ  cÃ³ thá»ƒ má»Ÿ rá»™ng dÃ i háº¡n.
          </p>
          <div className="space-y-1.5 text-sm text-slate-200">
            <p className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4 text-teal-400" />
              +84 866 055 283
            </p>
            <p className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-teal-400" />
              hello@immersevietnam.vn
            </p>
            <p className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal-400" />
              HÃ  Ná»™i, Viá»‡t Nam
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-white">Äiá»u hÆ°á»›ng nhanh</h3>
          <ul className="space-y-2 text-sm">
            {footerQuickLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-white">Äiá»ƒm Ä‘áº¿n phá»• biáº¿n</h3>
          <ul className="space-y-2 text-sm">
            {popularDestinations.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-white">Nháº­n tin Æ°u Ä‘Ã£i</h3>
          <p className="text-sm leading-7 text-slate-300">
            Nháº­n báº£n tin vá» hÃ nh trÃ¬nh má»›i, tour ná»•i báº­t vÃ  lá»™ trÃ¬nh du lá»‹ch Viá»‡t Nam má»›i nháº¥t.
          </p>
          <form className="space-y-2">
            <input
              type="email"
              placeholder="Email cá»§a báº¡n"
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-white placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
            />
            <button
              type="submit"
              className="iv-btn-primary inline-flex h-10 w-full items-center justify-center px-4 text-sm font-semibold"
            >
              ÄÄƒng kÃ½
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-slate-700/70 px-4 py-4 text-center text-xs text-slate-400 md:px-6">
        Â© {new Date().getFullYear()} ImmersiveVietnam. Báº£o lÆ°u má»i quyá»n.
      </div>
    </footer>
  );
}

