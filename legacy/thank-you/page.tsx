// pages/thank-you.tsx
"use client";

import Link from "next/link";
import "./thank-you.css";
import { useEffect, useState } from "react";
import { getPDF } from "../api/service/pdf-storage";

export default function ThankYou() {
    const [pdfUrls, setPdfUrls] = useState<string[]>([]);

    useEffect(() => {
        const urls: string[] = [];
        const frontBack = localStorage.getItem("front-back");
        const inner = localStorage.getItem("inner-pages");
        if (frontBack) urls.push(frontBack);
        if (inner) urls.push(inner);
        setPdfUrls(urls);
    }, []);

    const handleDownloadAll = async () => {
        await handleDownload('front-back');
    };

    async function handleDownload(filename: string) {
        const blob = await getPDF(filename);
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="pixovo-thankyou-page">
            <div className="pixovo-popup">

                <div className="popup-top-shape"></div>

                <div className="circle-one"></div>
                <div className="circle-two"></div>

                {/* SUCCESS ICON */}
                <div className="success-icon-wrap">
                    <div className="success-icon">✓</div>
                </div>

                {/* CONTENT */}
                <div className="popup-content">

                    <h1>Order Confirmed</h1>

                    <p>
                        Your photobook has been successfully created.
                        Thank you for choosing Pixovo for your photobook needs.
                    </p>

                    {/* BUTTON */}
                    <div className="popup-buttons">
                        {/* <button
                            onClick={handleDownloadAll}
                            className="popup-btn"
                        >
                            📥 Download Album PDF
                        </button> */}
                        <Link href="/" className="popup-btn">
                            Back To Home
                        </Link>
                    </div>

                </div>

            </div>
        </div>
    );
}
