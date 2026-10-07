"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    keywords?: string;
}

const DEFAULT_TITLE = "My Website";
const DEFAULT_DESCRIPTION = "This is my awesome website";
const DEFAULT_URL = "https://www.example.com";
const DEFAULT_IMAGE = "/default-og-image.png";
const DEFAULT_KEYWORDS = "website, blog, portfolio";

export default function SEO({ title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, image = DEFAULT_IMAGE, url, keywords = DEFAULT_KEYWORDS }: SEOProps) {
    const pathname = usePathname();
    const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const origin = window.location.origin;
            setCurrentUrl(url || `${origin}${pathname}`);
        }
    }, [pathname, url]);

    return (
        <>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Open Graph / Facebook */}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:image" content={image} />

            {/* Canonical URL */}
            <link rel="canonical" href={currentUrl} />
        </>
    );
}
