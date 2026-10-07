"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import './stickers.css';

interface Sticker {
    icon: string;
    name?: string;
}

interface StickersProps {
    freepikApiKey?: string;
    freepikApiUrl?: string;
    onStickerSelect: (img: string) => void;
}

const Stickers: React.FC<StickersProps> = ({ onStickerSelect, }) => {
    const [stickersList, setStickersList] = useState<Sticker[]>([]);
    const [stickerStorage, setStickerStorage] = useState<any[]>([]);
    const [pageNo, setPageNo] = useState(1);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const apiUrl = "https://example.com/";

    const basePath = `${apiUrl}src/uploads/sticker/`;

    //===// API call to get stickers //===//
    const imageAPI = useCallback((searchValue: string) => {
        setLoading(true);
        const filterOptions = { searchvalue: searchValue };
        axios.post(`${apiUrl}sticker/list`, filterOptions).then((resp: any) => {
            setLoading(false);
            if (resp.data.status) {
                const icons: Sticker[] = resp.data.data.stickerlist.map((item: any) => ({
                    icon: basePath + item.image.filename,
                }));
                setStickersList((prev) => [...prev, ...icons]);
                setStickerStorage((prev) => [
                    ...prev,
                    { pageno: pageNo, icons: icons },
                ]);
                setPageNo((prev) => prev + 1);
            }
        }).catch((err) => {
            console.error(err);
            setLoading(false);
        });
    },
        [apiUrl, basePath, pageNo]
    );

    //===// Load images (initial & paginated) //===//
    const loadImage = useCallback(() => {
        setLoading(true);
        if (stickerStorage.length === 0) {
            imageAPI(search);
        } else {
            const data = stickerStorage.filter((x) => x.pageno === pageNo);
            if (data.length > 0) {
                const imageList = data[0];
                setStickersList((prev) => [...prev, ...imageList.icons]);
                setPageNo((prev) => prev + 1);
                setLoading(false);
            } else {
                imageAPI(search);
            }
        }
    }, [pageNo, search, stickerStorage, imageAPI]);


    //===// Load more on scroll //===//
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        if (
            element.scrollHeight - element.scrollTop - 100 <= element.clientHeight &&
            !loading
        ) {
            loadImage();
        }
    };

    //===// Search stickers from Tenor //===//
    const searchStickers = (value: string) => {
        setSearch(value);
        if (!value) return;

        const apiKey = "LIVDSRZULELA"; //===// Tenor public demo key //===//
        const query = encodeURIComponent(value);
        axios.get(`https://api.tenor.com/v1/search?q=${query}&key=${apiKey}&limit=9`).then((res: any) => {
            const results: Sticker[] = res.data.results.map((item: any) => ({
                name: item.title || value,
                icon: item.media[0].tinygif.preview,
            }));
            setStickersList(results);
        });
    };

    //===// Initial load //===//
    useEffect(() => {
        loadImage();
    }, [loadImage]);

    return (
        <div className="stickers">
            <div className="flex flex-middle">
                <div className="search relative flex-grow mt-2 mb-2">
                    <input
                        type="search"
                        placeholder="Search"
                        autoComplete="off"
                        onChange={(e) => searchStickers(e.target.value)}
                    />
                    <span className="icon loupe flex">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"></path>
                        </svg>
                    </span>
                </div>
            </div>

            <div
                className="row"
                style={{ maxHeight: "590px", overflowY: "auto" }}
                onScroll={handleScroll}
            >
                {stickersList && stickersList.length > 0 ? (
                    stickersList.map((item, index) => (
                        <div key={index} className="col-md-4 col-3 p-3">
                            <img
                                src={item.icon}
                                className="cursor-pointer w-100 h-100 sticker-img"
                                alt={item.name || "sticker"}
                                onClick={() => onStickerSelect(item.icon)}
                            />
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center p-3 text-muted">
                        No stickers found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Stickers;
