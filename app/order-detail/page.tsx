"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toastError } from "../api/service/common";
import { apiPost } from "../api/service/api-service";
import { useLoader } from "../context/LoaderContext";
import { useRouter } from "next/navigation";
import HTMLFlipBook from "react-pageflip";
import "./order-detail.css";

/**
 * Suspense lives here, not in main-layout.tsx — a layout-level boundary applies
 * to every route and React marks any boundary over ~12.8 KB of HTML as pending,
 * which made large pages ship an empty <main> and register as a layout shift.
 */
export default function OrderDetailPageRoute() {
    return (
        <Suspense fallback={null}>
            <OrderDetailPage />
        </Suspense>
    );
}

function OrderDetailPage() {
    const searchParams = useSearchParams();
    let id: any = searchParams.get("id");
    const [orderDetail, setOrderDetail] = useState<any>({});
    const [previewHtmls, sePreviewHtmls] = useState<any>([]);
    const { showLoader, hideLoader } = useLoader();
    const router = useRouter();
    const flipBook = useRef<any>(null);

    useEffect(() => {
        apiCallDetail();
    }, [id]);

    const apiCallDetail = async () => {
        if (id) {
            try {
                showLoader();
                const formData = new FormData();
                formData.append("id", id);
                const res = await apiPost<any>("order/detail", formData);
                if (res.status) {
                    setOrderDetail(res.data)
                    sePreviewHtmls(res.data.order_htmls)
                    hideLoader();
                }
            } catch (error) {
                hideLoader();
                console.error("API Error:", error);
            }
        } else {
            await toastError("Your order id has expired");
            router.push("/order");
        }
    };

    // Display helper: returns value or em-dash placeholder
    const val = (v: any) => {
        if (v === null || v === undefined || `${v}`.trim() === "") return "—";
        return v;
    };

    // Round any price-like value to 2 decimals
    const money = (v: any) => {
        const n = Number(v);
        return isNaN(n) ? "0.00" : n.toFixed(2);
    };

    /**
     * Copies ordered. Absent on orders placed before the quantity feature, which
     * were always single copies.
     */
    const quantity = () => {
        const n = Math.floor(Number(orderDetail?.quantity));
        return Number.isFinite(n) && n > 0 ? n : 1;
    };

    /** `total_price` is the price of ONE book, so the line subtotal scales. */
    const lineSubtotal = () => (Number(orderDetail?.total_price) || 0) * quantity();

    /**
     * What the customer was charged: shipping and tax included, coupon deducted.
     * Written to `grand_total` at payment time; orders paid before that field
     * existed had the same figure stored over `total_price` instead.
     */
    const chargedTotal = () =>
        orderDetail?.grand_total ?? orderDetail?.total_price;

    const formatDate = (dateString: any) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "—";
        return date.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatTime = (dateString: any) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "—";
        return date.toLocaleString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
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

    const isSquare = orderDetail.type?.name == "Square";

    return (
        <div className="order-detail-page">
            <div className="pv-page">

                {/* BREADCRUMB */}
                <div className="pv-breadcrumb">
                    <a href="/order">My Orders</a>
                    <span className="sep">/</span>
                    <span className="cur">Order #{val(orderDetail.order_no)}</span>
                </div>

                {/* TITLE */}
                <div className="pv-title-row">
                    <div className="pv-title-left">
                        <h1>Order Details</h1>
                        <div className="pv-status-badge">
                            <span className="pv-status-dot"></span>
                            <span>{val(orderDetail.status || "Order Confirmed")}</span>
                        </div>
                    </div>
                    <div className="pv-actions">
                        <button
                            className="pv-btn-reorder"
                            onClick={() => handleReorder(orderDetail._id)}
                            disabled={!orderDetail?._id}
                        >
                            🔄 Reorder This Photobook
                        </button>
                        
                    </div>
                </div>

                {/* ORDER INFO BAR */}
                <div className="pv-order-bar">
                    <div className="pv-ob-item">
                        <span className="pv-ob-label">Order ID</span>
                        <span className="pv-ob-value">#{val(orderDetail.order_no)}</span>
                    </div>
                    <div className="pv-ob-sep"></div>
                    <div className="pv-ob-item">
                        <span className="pv-ob-label">Order Date</span>
                        <span className="pv-ob-value">{formatDate(orderDetail.created_at)}</span>
                    </div>
                    <div className="pv-ob-sep"></div>
                    <div className="pv-ob-item">
                        <span className="pv-ob-label">Time</span>
                        <span className="pv-ob-value">{formatTime(orderDetail.created_at)}</span>
                    </div>
                    <div className="pv-ob-sep"></div>
                    <div className="pv-ob-item">
                        <span className="pv-ob-label">Source</span>
                        <span className="pv-ob-value">{val(orderDetail.source || "Direct Order")}</span>
                    </div>
                    <div className="pv-ob-sep"></div>
                    <div className="pv-ob-item">
                        <span className="pv-ob-label">Total</span>
                        <span className="pv-ob-value green">${money(chargedTotal())}</span>
                    </div>
                </div>

                {/* ORDER ITEM */}
                <div className="pv-card">
                    <div className="pv-card-head">
                        <div className="pv-card-icon" style={{ background: "#e8f9f9" }}>📖</div>
                        <h2>Order Item</h2>
                    </div>
                    <div className="pv-card-body">
                        <div className="pv-item-info">
                            <span className="pv-type-badge">{val(orderDetail.type?.name || "PhotoBook")}</span>
                            <div className="pv-item-name">{val(orderDetail.template_id?.template_name)}</div>
                            <div className="pv-item-price">
                                ${money(orderDetail.template_id?.base_price)} <span>(Base Price)</span>
                            </div>
                            <div className="pv-specs">
                                <div className="pv-spec">
                                    <div className="pv-spec-lbl">Pages</div>
                                    <div className="pv-spec-val">{val(orderDetail.number_of_pages)} pages</div>
                                </div>
                                <div className="pv-spec">
                                    <div className="pv-spec-lbl">Quantity</div>
                                    <div className="pv-spec-val">
                                        {quantity()} {quantity() > 1 ? "copies" : "copy"}
                                    </div>
                                </div>
                                <div className="pv-spec">
                                    <div className="pv-spec-lbl">Size</div>
                                    <div className="pv-spec-val">
                                        {val(orderDetail.size?.size_name)}
                                        {orderDetail.size?.price != null && (
                                            <span className="pv-spec-extra">+${money(orderDetail.size.price)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="pv-spec">
                                    <div className="pv-spec-lbl">Cover Type</div>
                                    <div className="pv-spec-val">
                                        {val(orderDetail.cover_type?.cover_name)}
                                        {orderDetail.cover_type?.price != null && (
                                            <span className="pv-spec-extra">+${money(orderDetail.cover_type.price)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="pv-spec">
                                    <div className="pv-spec-lbl">Paper Quality</div>
                                    <div className="pv-spec-val">
                                        {val(orderDetail.paper_quality?.paper_name)}
                                        {orderDetail.paper_quality?.price != null && (
                                            <span className="pv-spec-extra">+${money(orderDetail.paper_quality.price)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ALBUM PREVIEW (flipbook) */}
                <div className="pv-card custom-display">
                    <div className="pv-card-head">
                        <div className="pv-card-icon" style={{ background: "#fff0f5" }}>🖼️</div>
                        <h2>Album Preview</h2>
                    </div>
                    <div className="pv-card-body">
                        <div
                            className="pv-flip-stage"
                            style={{
                                width: isSquare ? "1000px" : "1300px",
                                maxWidth: "100%",
                                height: isSquare ? "470px" : "480px",
                                margin: "auto",
                            }}
                        >
                            <HTMLFlipBook
                                width={isSquare ? 480 : 680}
                                height={isSquare ? 410 : 450}
                                className="flip-book"
                                showCover={true}
                                size="stretch"
                                {...({} as any)}
                                ref={flipBook}
                            >
                                {previewHtmls.map((preview: any, index: any) => (
                                    <div className="page" key={`page-${preview.id}-${index}`}>
                                        <div className="fit-content" dangerouslySetInnerHTML={{ __html: preview.order_html }} />
                                    </div>
                                ))}
                            </HTMLFlipBook>
                        </div>
                    </div>
                </div>

                {/* PRICE SUMMARY */}
                <div className="pv-card">
                    <div className="pv-card-head">
                        <div className="pv-card-icon" style={{ background: "#e8f9f9" }}>💳</div>
                        <h2>Price Summary</h2>
                    </div>
                    <div className="pv-card-body">
                        <div className="pv-pt-row">
                            <div className="pv-pt-left">Subtotal</div>
                            <div className="pv-pt-mid">
                                {quantity() > 1
                                    ? `${money(orderDetail.total_price)} × ${quantity()}`
                                    : "—"}
                            </div>
                            <div className="pv-pt-right">${money(lineSubtotal())}</div>
                        </div>
                        <div className="pv-pt-row">
                            <div className="pv-pt-left">Discount <span className="badge-yellow">New Customer</span></div>
                            <div className="pv-pt-mid"></div>
                            <div className="pv-pt-right">$0.00</div>
                        </div>
                        <div className="pv-pt-row">
                            <div className="pv-pt-left">Delivery Charge <span className="badge-green">Free Shipping</span></div>
                            <div className="pv-pt-mid"></div>
                            <div className="pv-pt-right">$0.00</div>
                        </div>
                        <div className="pv-pt-row">
                            <div className="pv-pt-left">Tax <span style={{ color: "#bbb", fontSize: "13px" }}>(0%)</span></div>
                            <div className="pv-pt-mid">—</div>
                            <div className="pv-pt-right">$0.00</div>
                        </div>
                        <div className="pv-pt-total">
                            <span className="lbl">Total</span>
                            <span className="val">${money(chargedTotal())}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
