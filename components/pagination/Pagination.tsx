"use client";

import React from "react";
import "./pagination.css";

interface PaginationProps {
    currentPage: number;
    totalRecords: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalRecords, pageSize, onPageChange }) => {
    const totalPages = Math.ceil(totalRecords / pageSize);
    if (totalPages <= 1) return null;

    //==// Generate pages with ellipsis //==//
    const getPages = () => {
        const pages: (number | { type: "dots"; direction: "left" | "right" })[] = [];
        if (totalPages <= 1) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);

            if (currentPage > 4) pages.push({ type: "dots", direction: "left" });
            const start = Math.max(2, currentPage - 2);
            const end = Math.min(totalPages - 1, currentPage + 2);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 3) pages.push({ type: "dots", direction: "right" });
            pages.push(totalPages);
        }

        return pages;
    };

    const pages = getPages();
    const handlePageClick = (page: number | { type: string; direction: string }) => {
        if (typeof page === "number") {
            onPageChange(page);
        } else if (page.type === "dots") {
            const target =
                page.direction === "left"
                    ? Math.max(1, currentPage - 5)
                    : Math.min(totalPages, currentPage + 5);
            onPageChange(target);
        }
    };

    return (
        <div className="pagination flex justify-center items-center space-x-2 mt-4">
            {/* Prev */}
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 prev" >
                <i className="fa fa-arrow-left" aria-hidden="true"></i>
                <span> Prev</span>
            </button>

            {/* Pages */}
            {pages.map((page, idx) => {
                if (typeof page === "number") {
                    return (
                        <button key={page} onClick={() => handlePageClick(page)}
                            className={`px-3 py-1 border rounded ${page === currentPage ? "active-pagination" : "hover:bg-gray-100"}`} >
                            {page}
                        </button>
                    );
                } else {
                    return (
                        <button key={`dots-${idx}`}
                            onClick={() => handlePageClick(page)}
                            className="px-3 py-1 border rounded hover:bg-gray-100" >
                            ...
                        </button>
                    );
                }
            })}

            {/* Next */}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 next" >
                <span>Next</span>
                <i className="fa fa-arrow-right" aria-hidden="true"></i>
            </button>
        </div>
    );
};

export default Pagination;
