"use client";

import { useState, useEffect, useRef } from "react";
import { apiGet, apiPost } from "../api/service/api-service";
import { toastError, toastSuccess, toastConfirm } from "../api/service/common";
import { useLoader } from "../context/LoaderContext";
import { useRouter } from "next/navigation";
import Pagination from "@/components/pagination/Pagination";
import { useUser } from "../context/UserContext";
// fa-* icons are used on this route (and by Components/pagination). Imported
// per-route rather than globally — see the note in app/layout.tsx.
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./cart.css";

export default function CartPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isloded, setLoader] = useState<any>(true);
  const [carts, setCarts] = useState<any[]>([]);
  const [limit, setLimit] = useState(10);
  let [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Order id whose quantity is mid-save, so its stepper can be disabled.
  const [pendingQtyId, setPendingQtyId] = useState<string | null>(null);
  const router = useRouter();
  const { setCartCount } = useUser();

  useEffect(() => {
    fetchCart();
  }, [currentPage]);

  const fetchCart = async () => {
    try {
      setLoader(true);
      setCarts([]);
      const res = await apiGet<any>(`order/user-order-cart?page=${currentPage}&limit=${limit}`);
      if (res.status && res.data.cart_data) {
        setCarts(res.data.cart_data || []);
        setTotalPages(res.data.total);
        setCartCount(res.data.total || 0);
        setLoader(false);
      } else {
        setLoader(false);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setLoader(false);
    } finally {
      setLoader(false);
    }
  };

  const navigate = (patch: any) => {
    router.push(patch);
  };

  const deleteCart = async (obj: any) => {
    let isConfirmed: any = false;
    isConfirmed = await toastConfirm(
      "Are you sure you want to remove this item from your cart?",
      "Yes, Remove",
      "Cancel"
    );

    if (isConfirmed) {
      setLoader(true);
      const res = await apiPost<any>("order/user-order-cart-delete", { order_id: obj._id });
      if (res.status) {
        // Calculate pages after delete
        const updatedCart = carts.filter((item: any) => item._id !== obj._id);
        setCarts(updatedCart);
        if (updatedCart.length === 0 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
          await fetchCart();
        } else {
          await fetchCart();
        }
        toastSuccess(res.message);
      } else {
        toastError(res.message);
      }
    }
  };

  // ─── Quantity ──────────────────────────────────────────────────────────────
  // `total_price` on an order is the price of ONE book; `quantity` is how many
  // copies. Orders created before the quantity feature have no field at all, so
  // it always has to be defaulted to 1 rather than read directly.
  const MAX_QUANTITY = 99;

  const clampQuantity = (value: any) => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(MAX_QUANTITY, n));
  };

  const itemQuantity = (item: any) => clampQuantity(item?.quantity ?? 1);

  const itemLineTotal = (item: any) =>
    (Number(item?.total_price) || 0) * itemQuantity(item);

  const changeQuantity = async (order: any, next: number) => {
    const qty = clampQuantity(next);
    if (qty === itemQuantity(order) || pendingQtyId) return;

    setPendingQtyId(order._id);
    try {
      const res = await apiPost<any>("order/update-quantity", {
        order_id: order._id,
        quantity: qty,
      });
      if (!res?.status) {
        toastError(res?.message || "Could not update the quantity.");
        return;
      }
      // Patch just this row — refetching would reset the page and scroll.
      setCarts((prev) =>
        prev.map((c) => (c._id === order._id ? { ...c, quantity: qty } : c))
      );
    } catch (err) {
      console.error("Quantity update failed", err);
      toastError("Could not update the quantity.");
    } finally {
      setPendingQtyId(null);
    }
  };

  const calculateCartTotal = (carts: any[]) => {
    if (!Array.isArray(carts) || carts.length === 0) return 0;
    let total = 0;
    carts.forEach((item) => {
      total += itemLineTotal(item);
    });

    // Round to 2 decimals for display
    return parseFloat(total.toFixed(2));
  };

  return (
    <>
      <div className="order-page">
        <div className="container">
          {isloded ? (
            <div className="order-content text-center">
              <span
                className="spinner-border spinner-border-sm text-secondary"
                role="status"
              ></span>
            </div>
          ) : carts.length > 0 ? (
            <div className="row justify-content-end">
              <div className="col-lg-12 col-md-12">
                {/* <h3 className="wow fadeInUp" data-wow-delay="200ms">Your Orders</h3> */}
                <div
                  className="order-content wow fadeInUp"
                  data-wow-delay="400ms"
                >
                  <div className="order-content-tbl">
                    <table className="custom-tbl">
                      <thead>
                        <tr>
                          <th>Sr no.</th>
                          <th>Album</th>
                          <th className="album-name">Name</th>
                          <th>Status</th>
                          <th>Cover Type</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {carts.map((order, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                              <img
                                className="order-thumb-img"
                                src={
                                  order.template_image
                                    ?.replace(/^https?:\/\/api\.pixovo\.com(?=https?:\/\/)/, "") || ""
                                }
                              />
                            </td>
                            <td className="album-name">
                              {order.template_id?.template_name} (
                              {order.size?.size_name} inches)
                            </td>
                            <td>{order.status}</td>
                            <td>{order.cover_type?.cover_name}</td>
                            <td>
                              <div className="quantity-block">
                                <button
                                  type="button"
                                  className="qty-btn"
                                  aria-label="Decrease quantity"
                                  disabled={pendingQtyId === order._id || itemQuantity(order) <= 1}
                                  onClick={() => changeQuantity(order, itemQuantity(order) - 1)}
                                >
                                  −
                                </button>
                                <span className="qty-value">{itemQuantity(order)}</span>
                                <button
                                  type="button"
                                  className="qty-btn"
                                  aria-label="Increase quantity"
                                  disabled={pendingQtyId === order._id || itemQuantity(order) >= MAX_QUANTITY}
                                  onClick={() => changeQuantity(order, itemQuantity(order) + 1)}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td>
                              ${itemLineTotal(order).toFixed(2)}
                              {itemQuantity(order) > 1 && (
                                <small className="qty-unit-hint">
                                  ${Number(order.total_price).toFixed(2)} each
                                </small>
                              )}
                            </td>
                            <td>
                              <div className="action-box">
                                <a
                                  className="btn btn-primary"
                                  onClick={() =>
                                    navigate(`/checkout?id=${order._id}`)
                                  }
                                >
                                  Process To Checkout
                                </a>
                                <a onClick={() => navigate(`/element-editing?id=${order._id}`)}>
                                  <i className="far fa-edit" aria-hidden="true"></i>
                                </a>
                                <a onClick={() => deleteCart(order)}>
                                  <i className="far fa-trash-alt" aria-hidden="true"></i>
                                </a>
                              </div>
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
              </div>
              {/* <div className="col-lg-4 col-md-4 mt-4">
                <div
                  className="order-content sub-total-block wow fadeInUp"
                  data-wow-delay="800ms"
                >
                  <table className="w-100">
                    <tbody>
                      <tr>
                        <td>Subtotal:</td>
                        <td> ${calculateCartTotal(carts)} </td>
                      </tr>
                      <tr>
                        <td>Shipping</td>
                        <td> $0 </td>
                      </tr>
                      <tr>
                        <td>Sale tax</td>
                        <td> $0 </td>
                      </tr>
                      <tr>
                        <td>Total:</td>
                        <td> ${calculateCartTotal(carts)} </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div> */}
            </div>
          ) : (
            <div className="row justify-content-center">
              <div className="col-lg-9 col-md-8">
                <div className="text-center p-5 border rounded bg-light">
                  <img
                    src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/empty-orders.svg`}
                    alt="No Orders"
                    width={120}
                    className="mb-3"
                  />
                  <h5>Your cart is empty</h5>
                  <p className="text-muted">
                    You don’t have any cart yet. Start creating your first photo
                    book now!
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
    </>
  );
}
