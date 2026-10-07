"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/service/api-service";
import Pagination from "@/components/pagination/Pagination";
import { toastWarning, toastError, toastSuccess } from "../api/service/common";
import { useLoader } from "../context/LoaderContext";
import { useRouter } from "next/navigation";
// fa-* icons used on this route (and by Components/pagination) — see app/layout.tsx.
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./order.css"

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [limit, setLimit] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { showLoader, hideLoader } = useLoader();
    const [query, setQuery] = useState("");   // 🔹 search query
    const router = useRouter();

    useEffect(() => {
        fetchOrders(currentPage, query);
    }, [currentPage]);

    // 🔹 Debounce Search
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            setCurrentPage(1);   // reset to first page
            fetchOrders(1, query);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [query]);


    const fetchOrders = async (page: number, search: string = "") => {
        try {
            showLoader();
            const res = await apiGet<any>(`order/list?page=${currentPage}&limit=${limit}&&search=${search}`);
            if (res.status && res.data.orders) {
                setOrders(res.data.orders);
                setTotalPages(res.data.total);
                hideLoader();
            } else {
                toastError(res.message)
                hideLoader();
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
            hideLoader();
        } finally {
            hideLoader();
        }
    };

    const goToDetail = (id: any) => {
        router.push(`/order-detail?id=${id}`);
    }

    /**
     * Copies ordered. Orders placed before the quantity feature carry no field,
     * and were always a single copy.
     */
    const orderQuantity = (order: any) => {
        const n = Math.floor(Number(order?.quantity));
        return Number.isFinite(n) && n > 0 ? n : 1;
    };
        const handleReorder = async (orderId: string) => {
        try {
            showLoader();
            const res = await apiPost<any>("order/reorder", { order_id: orderId });
            if (res?.status && res?.data?._id) {
                router.push(`/checkout?id=${res.data._id}`);
            } else {
                toastError(res?.message || "Could not start reorder. Please try again.");
            }
        } catch (err) {
            console.error("Reorder failed:", err);
            toastError("Something went wrong while creating your reorder.");
        } finally {
            hideLoader();
        }
    };


    return (
        <div className="order-page order-inner-page">
            <div className="container-fluid">
                <div className="row justify-content-center">
                    {/* Left: Orders table */}
                    <div className="col-lg-12 col-md-12">
                        <h3 className="mb-3">Your Orders</h3>

                        {/* ════════════════════════════════════════
                            Order policy banner (30-day reorder /
                            auto-remove) — always visible
                            ════════════════════════════════════════ */}
                        <div className="order-policy-banner">
                            <div className="opb-item">
                                <span className="opb-icon opb-icon--reorder" aria-hidden="true">
                                    {/* calendar-refresh icon */}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="5" width="18" height="16" rx="2" />
                                        <path d="M3 9h18" />
                                        <path d="M8 3v4" />
                                        <path d="M16 3v4" />
                                        <path d="M9 15a3 3 0 1 0 1-2.2" />
                                        <polyline points="10 11 10 13 12 13" />
                                    </svg>
                                </span>
                                <div className="opb-text">
                                    <h4>Reorder within 30 days</h4>
                                    <p>You can reorder any of your previous orders within 30 days of the order date.</p>
                                </div>
                            </div>

                            <div className="opb-sep" aria-hidden="true"></div>

                            <div className="opb-item">
                                <span className="opb-icon opb-icon--remove" aria-hidden="true">
                                    {/* trash icon */}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </span>
                                <div className="opb-text">
                                    <h4>Auto remove after 30 days</h4>
                                    <p>Orders will be permanently removed from your history after 30 days from the order date.</p>
                                </div>
                            </div>
                        </div>

                        {orders.length > 0 ? (
                            <>
                                <div className="order-content">
                                    <div className="search-box">
                                        <i className="fa fa-search" ></i>
                                        <input
                                            type="text"
                                            className={`form-control`}
                                            placeholder="Search for order"
                                            name="name"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="order-content-tbl">
                                        <table className="custom-tbl w-100">
                                            <thead>
                                                <tr>
                                                    <th>Sr no.</th>
                                                    <th className="album-name">Order no.</th>
                                                    <th className="album-name">Name</th>
                                                    <th className="album-name">Number of Pages</th>
                                                    <th className="album-name">Size</th>
                                                    <th className="album-name">Cover Type</th>
                                                    <th className="album-name">Paper Quality</th>
                                                    <th>Qty</th>
                                                    <th>Amount</th>
                                                    <th>Status</th>
                                                    <th style={{ width: '10px' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.map((order, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            {index + 1}
                                                        </td>
                                                        <td className="album-name">	{order.order_no}</td>
                                                        <td className="album-name">{order.template_id?.template_name}</td>
                                                        <td>{order.number_of_pages} Pages</td>
                                                        <td>{order.size?.size_name}</td>
                                                        <td>{order.cover_type?.cover_name}</td>
                                                        <td>{order.paper_quality?.paper_name}</td>
                                                        <td>{orderQuantity(order)}</td>
                                                        {/* What was charged (shipping + tax included), which lives in
                                                            grand_total. Orders paid before that field existed stored the
                                                            same figure in total_price, hence the fallback. */}
                                                        <td>${Number(order.grand_total ?? order.total_price).toFixed(2)}</td>
                                                        <td>{order?.status}</td>
                                                        <td>
                                                            <button className="btn btn-link p-0" onClick={() => goToDetail(order._id)}>
                                                                <i className="fa fa-eye" aria-hidden="true"></i>
                                                            </button>   
                                                            <button className="btn btn-link p-0 ms-2" title="Reorder this photobook" onClick={() => handleReorder(order._id)}>
                                                                <i className="fa fa-redo " aria-hidden="true"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div>
                                        {/* Pagination */}
                                        <Pagination
                                            currentPage={currentPage}
                                            totalRecords={totalPages}
                                            pageSize={limit}
                                            onPageChange={(page) => setCurrentPage(page)}
                                        />
                                    </div>
                                </div>

                            </>
                        ) : (
                            // ✅ Order not found section
                            <div className="row justify-content-center">
                                <div className="col-lg-9 col-md-8">
                                    <div className="text-center p-5 border rounded bg-light">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/empty-orders.svg`}
                                            alt="No Orders"
                                            width={120}
                                            className="mb-3"
                                        />
                                        <h5>No orders found</h5>
                                        <p className="text-muted">
                                            You don’t have any orders yet. Start creating your first
                                            photo book now!
                                        </p>
                                        <a href="/" className="btn btn-primary mt-3">
                                            Start Shopping
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
