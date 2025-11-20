import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://snap-r.com/", lastModified: new Date() },
    { url: "https://snap-r.com/dashboard", lastModified: new Date() },
    { url: "https://snap-r.com/upload", lastModified: new Date() },
    { url: "https://snap-r.com/listings", lastModified: new Date() },
    { url: "https://snap-r.com/jobs", lastModified: new Date() },
    { url: "https://snap-r.com/billing", lastModified: new Date() },
    { url: "https://snap-r.com/settings", lastModified: new Date() }
  ];
}

