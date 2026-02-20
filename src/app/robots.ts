import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/admin/", "/settings/", "/auth/"],
      },
    ],
    sitemap: "https://www.quotahit.com/sitemap.xml",
  };
}
