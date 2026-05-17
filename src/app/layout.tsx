import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/providers/app-provider";

export const metadata: Metadata = {
  title: {
    default: "Immersive Vietnam - Đặt tour du lịch Việt Nam",
    template: "%s | Immersive Vietnam",
  },
  description:
    "Nền tảng đặt tour du lịch Việt Nam hiện đại, tối ưu trải nghiệm người dùng và quản trị dữ liệu thực tế.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var attrRegex = /^(__processed_|bis_)/i;
                  var clean = function (root) {
                    if (!root || !root.querySelectorAll) return;
                    var nodes = root.querySelectorAll('*');
                    for (var i = 0; i < nodes.length; i++) {
                      var el = nodes[i];
                      if (!el || !el.attributes) continue;
                      for (var j = el.attributes.length - 1; j >= 0; j--) {
                        var name = el.attributes[j].name;
                        if (attrRegex.test(name)) {
                          el.removeAttribute(name);
                        }
                      }
                    }
                  };
                  clean(document);
                  var obs = new MutationObserver(function (mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.target && m.attributeName && attrRegex.test(m.attributeName)) {
                        m.target.removeAttribute(m.attributeName);
                      }
                      if (m.addedNodes && m.addedNodes.length) {
                        for (var k = 0; k < m.addedNodes.length; k++) {
                          clean(m.addedNodes[k]);
                        }
                      }
                    }
                  });
                  obs.observe(document.documentElement, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                  });
                } catch (_e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-background antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

