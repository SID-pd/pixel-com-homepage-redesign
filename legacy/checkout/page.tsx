"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, Suspense } from "react";
// fa-* icons used on this route — see the note in app/layout.tsx.
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./checkout.css";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { toastSuccess, toastError, toastWarning, toastConfirm, toastInformational, } from "../../app/api/service/common";
import HTMLFlipBook from "react-pageflip";
import { apiPost, apiGet } from "../api/service/api-service";
import { getAlbum, clearAlbums } from "../api/service/pdf-storage";
import { loadEditorFonts } from "../seo/editor-fonts";
import { get, removeEncrypted } from "../api/service/storage";
import { getActiveUser, ensureGuestUser } from "../api/service/guest";
import { useLoader } from "../context/LoaderContext";
import { useModal } from "@/app/context/ModalContext";

declare global {
  interface Window {
    Accept?: any;
    ApplePaySession?: any;
    paypal?: any;
  }
}


declare namespace google {
  namespace payments {
    namespace api {
      interface PaymentDataRequest {
        apiVersion: number;
        apiVersionMinor: number;
        allowedPayment_methods: any[];
        merchantInfo: any;
        transactionInfo: any;
      }
    }
  }
}

// Define proper types for the form
interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: any,
  company: string;
  contact: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  zip: string;
  is_billing_address: any;
  is_address_verifed: boolean;
  shipping_same_as_billing: boolean;
  shipping_address: string | null;
  card_number: string;
  expiry: string;
  cvv: string;
  payment_method: string;
  payment_detail: string;
  amount: number;
  discount_id: string;
  billing_first_name: string;
  billing_last_name: string;
  billing_email: string;
  billing_company: string;
  billing_address_1: string;
  billing_address_2: string;
  billing_contact: string;
  billing_city: string;
  billing_state: string;
  billing_zip: string;
}

const CheckoutPage = () => {
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [orderDetail, setOrderDetail] = useState<any>({});
  const [isShowCustomize, setShowCustomize] = useState<boolean>(false);
  const [pagesSizeOptions, setPagesSizeOptions] = useState<any[]>([]);
  let [pageSize, setSize] = useState<any>(null);
  const [billingAddressList, setbillingAddressList] = useState([]);
  const [pagesCoversOptions, setPagesCoversOptions] = useState<any[]>([]);
  const [coverType, setCoverType] = useState<any>(null);
  const [sizeAmount, setSizeAmount] = useState<any>(null);
  const [sizePerPageAmount, setsizePerPageAmount] = useState<any>(null);
  const [coverAmount, setCoverAmount] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [stateList, setStateList] = useState<any[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [templateImage, setTemplateImage] = useState("");
  //===// Terms & Conditions consent — must be accepted before ordering //===//
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const cardFormRef = useRef<HTMLFormElement>(null);
  const flipBook = useRef<any>(null);
  const router = useRouter();
  const savedAddresses = [
    "123 Main St, New York, NY",
    "456 Elm St, Los Angeles, CA",
  ];
  let id: any = searchParams.get("id");
  const [addressList, setAddressList] = useState([]);
  const [form, setForm] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    contact: "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    zip: "",
    is_billing_address: "",
    is_address_verifed: true,
    shipping_same_as_billing: true,
    shipping_address: null,
    card_number: "",
    expiry: "",
    cvv: "",
    payment_method: "card",
    payment_detail: "",
    amount: 0,
    discount_id: "",
    billing_first_name: "",
    billing_last_name: "",
    billing_email: "",
    billing_company: "",
    billing_address_1: "",
    billing_address_2: "",
    billing_contact: "",
    billing_city: "",
    billing_state: "",
    billing_zip: ""
  });
  const [previewImages, setpreviewImages] = useState<any>([]);
  /**
   * Album preview, server side. One entry per page, straight from the order_html
   * collection via order/detail. This is the durable source and the one the
   * flipbook prefers; previewImages (rasters cached in this browser's IndexedDB)
   * is only a fallback for orders placed before order_html existed.
   * See docs/CHECKOUT-PREVIEW.md.
   */
  const [previewHtmls, setPreviewHtmls] = useState<any>([]);
  const previewStageRef = useRef<HTMLDivElement | null>(null);
  const [shippingRates, setShippingRates] = useState<any>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [tax, setTax] = useState<any>(null);
  /**
   * Copies of this book to print. orderDetail.total_price is the UNIT price, so
   * every money figure on this page is `unit x quantity` (+ shipping + tax).
   * Seeded from the order document and written straight back to it on change —
   * payment/store charges from the stored value, so the two must not drift.
   */
  const [quantity, setQuantity] = useState<number>(1);
  const [quantityBusy, setQuantityBusy] = useState<boolean>(false);
  /**
   * The FedEx-resolved shipping address that the current rates were quoted for.
   * Kept so a later quantity change can re-quote (heavier parcel) without making
   * the customer re-validate their address.
   */
  const [resolvedAddress, setResolvedAddress] = useState<any>(null);
  const { showLoader, hideLoader } = useLoader();
  const { openSignIn } = useModal();
  const [isValid, setValid] = useState<boolean>(false); // Address validation disabled
  const [isValidStart, setValidStart] = useState<boolean>(false);
  const [suiteError, setSuiteError] = useState("");
  const [shouldValidateAddress, setShouldValidateAddress] = useState(false);
  const paypalRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    // script.src = "https://jstest.authorize.net/v1/Accept.js";
    script.src = "https://js.authorize.net/v1/Accept.js";
    script.async = true;
    document.body.appendChild(script);


  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://pay.google.com/gp/p/js/pay.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    apiCallDetail();
  }, [id]);

  /**
   * Fit the injected order_html to the flipbook page.
   *
   * The stored markup cannot be reflowed: its .div-canvas carries an inline pixel
   * width/height from the editor canvas and every element inside is absolutely
   * positioned at pixel offsets (element-editing/page.tsx:6752, :7158). So it is
   * painted scaled instead, and the factor has to be measured rather than fixed —
   * getCanvasSize() bakes in 400x400 on desktop/tablet but 300x300 or 350x250 on
   * mobile, so the intrinsic size depends on the device the customer saved from.
   *
   * The flipbook's own size is also runtime-derived: width/height={200} with
   * size="stretch" only pins the 1:1 aspect ratio, and page-flip scales to the
   * container from there.
   *
   * The result is written straight to the DOM as a custom property rather than
   * held in state, for two reasons. It inherits, so one declaration on the
   * wrapper reaches every page. And re-rendering would rebuild the flipbook's
   * children, which page-flip has moved into its own container — React would then
   * try to removeChild them from a parent that no longer owns them. Setting a
   * property on a node is safe wherever that node currently lives.
   */
  useLayoutEffect(() => {
    if (!previewHtmls.length) return;
    const stage = previewStageRef.current;
    if (!stage) return;

    // Only pulled in when a preview actually exists, so checkout's critical path
    // stays free of fonts.googleapis.com.
    loadEditorFonts();

    let observedPage: HTMLElement | null = null;

    const measure = () => {
      const page = stage.querySelector<HTMLElement>(".checkout-flip-html");
      if (!page) return;
      // Watch the page box itself once it exists. Safe from feedback: the scale is
      // applied with a transform, and transforms do not affect layout.
      if (page !== observedPage) {
        if (observedPage) resizeObserver.unobserve(observedPage);
        observedPage = page;
        resizeObserver.observe(page);
      }
      const canvas = page.querySelector<HTMLElement>(".div-canvas");
      if (!canvas || !canvas.offsetWidth || !canvas.offsetHeight) return;
      if (!page.clientWidth || !page.clientHeight) return;
      const scale = Math.min(
        page.clientWidth / canvas.offsetWidth,
        page.clientHeight / canvas.offsetHeight
      );
      stage.style.setProperty("--preview-scale", String(scale));
    };

    const resizeObserver = new ResizeObserver(measure);

    /**
     * The pages do not exist yet at this point, and will not for two more passes:
     * react-pageflip renders its children from its own state, populated in a
     * passive effect, and page-flip then moves them into .stf__block and sizes
     * them. So measuring now always bails, and watching only the wrapper would
     * leave the scale unset if the wrapper happened to settle before the pages
     * did. Watching the subtree removes the race — measure runs when the pages
     * appear, when page-flip sizes them, and on every later resize or rotation.
     */
    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(stage, { childList: true, subtree: true });
    resizeObserver.observe(stage);
    measure();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [previewHtmls]);


  const saveShippingAddressIfNew = async () => {
    const storedUser = get<any>("user");
    if (!storedUser?._id) return;

    // If user picked an existing saved address, is_billing_address holds its _id.
    // Skip save in that case (it's already in the table).
    if (form.is_billing_address && addressList.some((a: any) => a._id === form.is_billing_address)) {
      return;
    }

    // Value-level dedupe: a different _id but same address fields means it's already saved.
    const norm = (v: string) => (v || "").trim().toLowerCase();
    const isDuplicate = addressList.some((a: any) =>
      norm(a.address || a.address_1) === norm(form.address_1) &&
      norm(a.city) === norm(form.city) &&
      norm(a.zip) === norm(form.zip)
    );
    if (isDuplicate) return;

    if (addressList.length >= 5) {
      toastInformational?.(
        "Address not saved",
        "You've reached the 5 saved-address limit, so this address wasn't added to your profile."
      );
      return;
    }

    try {
      const payload = {
        address: form.address_1,
        address2: form.address_2,
        country: "US",
        city: form.city,
        zip: form.zip,
        phone_number: form.phone || "",
      };
      const res = await apiPost<any>("shipping-address/store", payload);
      if (res?.status) {
        fetchShippingAddresses();
      } else {
        console.warn("Save shipping address failed:", res?.message);
      }
    } catch (err) {
      console.warn("Save shipping address threw:", err);
      // Intentionally swallowed — do not block order.
    }
  };
  const fetchAddresses = async () => {
    let storedUser = get<any>("user");
    const res = await apiPost<any>("payment/order-address-get", {
      user_id: storedUser._id,
    });
    if (res.status) {
      // setbillingAddressList(res.data.orders_address);
      // const selectedAddress =
      //   res.data.orders_address[0];
      if (res.data.orders_address.length > 0) {
        setbillingAddressList(res.data.orders_address);
        const selectedAddress =
          res.data.orders_address[0];

        setForm((prev) => ({
          ...prev,

          is_billing_address: selectedAddress._id,

          address_1: (selectedAddress.address ? selectedAddress.address : selectedAddress.address_1) || "",
          address_2: selectedAddress.address_2 ? selectedAddress.address_2 : "",

          city: selectedAddress.city || "",

          state: selectedAddress.state || "",

          zip: selectedAddress.zip || "",
        }));

        setShouldValidateAddress(true);
      }
    } else {
      toastError(res.message);
    }
  };
  useEffect(() => {

    if (!shouldValidateAddress)
      return;

    if (
      form.address_1 &&
      form.city &&
      form.state &&
      form.zip
    ) {

      addressValidate();

      /*
        RESET
      */
      setShouldValidateAddress(false);

    }

  }, [shouldValidateAddress]);

  const fetchStates = async () => {
    try {
      const localToken = getActiveUser() || (await ensureGuestUser()) || { token: null };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/front-end\/?$/, "/") || "https://api.pixovo.com/api/";
      const res = await fetch(`${apiUrl}state_tax/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localToken.token}`,
          // "X-locale": "en_US",
        },
      });
      const data = await res.json();

      if (data.status) {
        setStateList(data.data || []);
      } else {
        toastError(data.message || "Failed to load states");
      }
    } catch (error) {
      toastError("Failed to load states");
      console.log(error);
    }
  };
  // const fetchStates = async () => {
  //   try {
  //     const res = await apiGet<any>("state_tax/list");

  //     if (res.status) {
  //       setStateList(res.data || []);
  //     } else {
  //       toastError(res.message);
  //     }
  //   } catch (error) {
  //     toastError("Failed to load states");
  //   }
  // };

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchShippingAddresses = async () => {
    const res = await apiGet<any>("shipping-address/list");
    if (res.status) {
      setAddressList(res.data);
    } else {
      toastError(res.message);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      showLoader();
      let storedUser: any = getActiveUser();
      if (!storedUser) {
        storedUser = await ensureGuestUser();
      }
      const res = await apiPost<any>("order/apply-promotion", {
        code: couponCode,
        user_id: storedUser?._id || "",
      });
      if (res.status) {
        // Discount applies to the whole line (unit x copies), which is what
        // sub_total_price already holds. couponFiguresFor is shared with
        // repriceForQuantity so a later quantity change re-derives the discount
        // identically instead of leaving it pinned to the old subtotal.
        const subtotal = getLineSubtotal();
        const { discount, discountedSubtotal } = couponFiguresFor(subtotal, res.data);

        if (res.data.promotion_type.toUpperCase() == "VALUE" && discount >= subtotal) {
          toastWarning("Coupon price invalid");
        } else {
          setOrderDetail((prev: any) => ({
            ...prev,
            sub_total: discountedSubtotal.toFixed(2),
          }));
          setDiscountAmount(discount);
          // Tax is levied on the discounted price, so applying a coupon has to
          // re-derive it. Without this the tax figure calculated during address
          // validation stayed frozen at the undiscounted amount — and because the
          // customer can apply the coupon before OR after validating, the order
          // they did things in changed what they were charged.
          setTax((prev: any) =>
            prev
              ? { ...prev, tax_price: taxPriceFor(Math.max(0, subtotal - discount), prev) }
              : prev
          );
          hideLoader();
          setAppliedCoupon(res.data);
          setCouponError("");
          toastSuccess("Coupon applied successfully!");
        }
      } else {
        setCouponError(res.message || "Invalid coupon code");
        setAppliedCoupon(null);
        setDiscountAmount(0);
        hideLoader();
      }
    } catch (error) {
      setCouponError("Failed to apply coupon");
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      hideLoader();
    }
  };

  // ─── Quantity ──────────────────────────────────────────────────────────────

  const MAX_QUANTITY = 99;

  const clampQuantity = (value: any) => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(MAX_QUANTITY, n));
  };

  /** Price of ONE book — what the order document stores in total_price. */
  const getUnitPrice = () => {
    const unit = Number(orderDetail?.total_price || 0);
    return Number.isFinite(unit) ? unit : 0;
  };

  /** Line subtotal before shipping, tax and any coupon. */
  const getLineSubtotal = (qty: number = quantity) =>
    getUnitPrice() * clampQuantity(qty);

  /**
   * The amount tax is actually levied on: the subtotal AFTER the coupon.
   *
   * A coupon reduces the taxable sale price, so tax follows the discount. This
   * used to be computed against the full subtotal, which over-collected on every
   * discounted order — a 99.99%-off $39.98 order still charged $2.00 of tax.
   *
   * `discount` is a parameter rather than being read from `discountAmount`
   * directly because callers that have just recalculated a discount cannot read
   * it back from state within the same render — they must pass the fresh value.
   */
  const getTaxableBase = (
    qty: number = quantity,
    discount: number = discountAmount
  ) => Math.max(0, getLineSubtotal(qty) - (Number(discount) || 0));

  /**
   * Coupon figures for a given subtotal. Extracted from applyCoupon so that a
   * quantity change re-prices an already-applied coupon with exactly the same
   * arithmetic — otherwise the discount would stay pinned to the subtotal it was
   * first calculated against.
   */
  const couponFiguresFor = (subtotal: number, coupon: any) => {
    if (!coupon) return { discount: 0, discountedSubtotal: subtotal };
    const price = Number(coupon.price) || 0;
    const isValue = String(coupon.promotion_type || "").toUpperCase() === "VALUE";
    const discount = isValue
      ? price
      : Number(((subtotal * price) / 100).toFixed(2));
    return { discount, discountedSubtotal: Math.max(0, subtotal - discount) };
  };

  /**
   * The amount the customer is charged: copies x unit price, plus shipping and
   * tax, less any coupon.
   *
   * Tax used to be added to the *displayed* Grand Total but omitted here, so
   * customers were quoted a tax-inclusive figure and billed a smaller one. It is
   * now included, and payment_controllers recomputes the identical figure
   * server-side (it re-reads the state_taxes rate rather than trusting this) —
   * if the two ever disagree, Authorize.net verification rejects the order, so
   * they must be kept in step.
   */
  const calculateFinalTotal = () => {
    let total = getLineSubtotal();
    if (isNaN(total)) total = 0;
    if (selectedRate && selectedRate.price) {
      total = total + Number(selectedRate.price);
    }
    if (tax && tax.tax_price) {
      total = total + Number(tax.tax_price);
    }
    const finalTotal = total - discountAmount;
    return Math.max(0, finalTotal).toFixed(2);
  };

  /** Tax for a subtotal at the rate already resolved for the shipping state. */
  const taxPriceFor = (subtotal: number, taxInfo: any) => {
    const rate = Number(taxInfo?.tax_value || 0);
    if (!Number.isFinite(rate) || rate <= 0) return 0;
    return Number(((subtotal * rate) / 100).toFixed(2));
  };

  /**
   * Recompute every subtotal-derived figure for a new copy count, including the
   * coupon and the tax that follows it.
   */
  const repriceForQuantity = (qty: number) => {
    const subtotal = getLineSubtotal(qty);
    const { discount, discountedSubtotal } = couponFiguresFor(subtotal, appliedCoupon);
    setDiscountAmount(discount);
    setOrderDetail((prev: any) => ({
      ...prev,
      sub_total_price: subtotal.toFixed(2),
      sub_total: appliedCoupon ? discountedSubtotal.toFixed(2) : prev?.sub_total,
    }));
    // Pass the discount just computed above — `discountAmount` still holds the
    // previous render's value at this point.
    setTax((prev: any) =>
      prev ? { ...prev, tax_price: taxPriceFor(getTaxableBase(qty, discount), prev) } : prev
    );
  };

  const apiCallDetail = async () => {
    /**
     * Locally cached rasters — now only a fallback for orders placed before
     * order_html existed. Isolated in its own try/catch because it used to sit
     * bare above the fetch below: a null id throws DataError out of
     * IDBObjectStore.get, and a rejection here aborted apiCallDetail before
     * order/detail was ever called, taking the whole order summary down with it.
     * Browser storage must never be able to block the server-side preview.
     */
    let data: any = null;
    if (id) {
      try {
        data = await getAlbum(id);
      } catch (err) {
        console.warn("Cached album preview unavailable, using the server copy", err);
      }
    }
    // NB: deliberately not setpreviewImages(data) here. page-flip moves the page
    // nodes into its own container, so swapping the flipbook's children after it
    // has mounted makes React call removeChild on a parent that no longer owns
    // them ("The node to be removed is not a child of this node"). The source is
    // therefore chosen exactly once, below, when both candidates are known.
    if (id) {
      try {
        showLoader();
        const formData = new FormData();
        formData.append("id", id);
        const res = await apiPost<any>("order/detail", formData);
        if (res.status && res.data) {
          setTemplateImage(res.data.template_image);
          // total_price is the UNIT price; the subtotal is that times the copy
          // count stored on the order (absent on pre-quantity orders => 1).
          const loadedQuantity = clampQuantity(res.data.quantity ?? 1);
          setQuantity(loadedQuantity);
          res.data.sub_total_price = (
            Number(res.data.total_price || 0) * loadedQuantity
          ).toFixed(2);
          // let exTraPagePrice: any = res.data.extra_page ? res.data.extra_page * res.data.size.per_page_price : 0.00;
          // res.data.sub_total_price = exTraPagePrice ? parseFloat(res.data.total_price) + parseFloat(exTraPagePrice) : res.data.total_price;
          // res.data.total_price = exTraPagePrice ? parseFloat(res.data.total_price) + parseFloat(exTraPagePrice) : res.data.total_price;
          // console.log("res.data.sub_total_price", res.data.sub_total_price);

          let storedUser = get<any>("user");
          if (storedUser) {
            fetchShippingAddresses();
            fetchAddresses();
          }
          setOrderDetail(res.data);


          const user = res.data.users_details?.[0];
          // Treat guest placeholder emails as empty so the customer types a real one.
          const isGuestUser =
            user?.type === "guest" ||
            (typeof user?.email === "string" && /^guest_[a-f0-9]+@guest\.pixovo$/i.test(user.email));
          const displayEmail = isGuestUser ? "" : (user?.email || "");

          setForm((prev) => ({
            ...prev,
            first_name: user ? `${user.first_name || ""}`.trim() : "",
            last_name: user ? `${user.last_name || ""}`.trim() : "",
            email: displayEmail,
            phone: user?.phone || "",

            billing_first_name: user ? `${user.first_name || ""}`.trim() : "",
            billing_last_name: user ? `${user.last_name || ""}`.trim() : "",
            billing_email: displayEmail,
            billing_contact: user?.phone || "",

            // ⚠️ Address not coming in API → keep empty
            address: "",
            city: "",
            state: "",
            zip: "",
          }));
          /**
           * Pick the preview source once, in priority order, and never change it
           * again for this mount — see the note next to the getAlbum call above.
           *
           * 1. order_html from the server. Written on every order/store and
           *    returned by every order/detail, so unlike the rasters it survives a
           *    new device, cleared site data, private mode and clearAlbums().
           * 2. rasters cached in this browser, for orders placed before
           *    order_html existed.
           * 3. order_image rows. Always empty in practice — every writer to that
           *    collection is dead — but harmless to keep as a last resort.
           *
           * `.length` rather than the array itself on 2 and 3: [] is truthy, which
           * is what used to let the "fallback" succeed with nothing and silently
           * blank the preview. See docs/CHECKOUT-PREVIEW.md.
           */
          res.data.order_images?.forEach((item: any) => {
            item.imageUrl = item.image_path;
          });

          const htmls = res.data.order_htmls || [];
          if (htmls.length) {
            setPreviewHtmls(htmls);
          } else if (data?.length) {
            setpreviewImages(data);
          } else if (res.data.order_images?.length) {
            setpreviewImages(res.data.order_images);
          }
          const formData = new FormData();
          formData.append("id", res.data.template_id._id);
          const subRes = await apiPost<any>("template/detail", formData);
          if (subRes.status && subRes.data) {
            setPagesSizeOptions(subRes.data.sizes);
            const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/front-end\/?$/, "") || "https://api.pixovo.com";
            const sanitizedCovers = (subRes.data.covers || []).map((cover: any) => ({
              ...cover,
              cover_image: cover.cover_image?.replace(new RegExp(`^${apiBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(https?://)`), "$1") ?? cover.cover_image,
            }));
            setPagesCoversOptions(sanitizedCovers);
          }
        } else {
          // No server copy to prefer, so the cached rasters are all there is.
          if (data?.length) setpreviewImages(data);
          toastError(res?.message || "Could not load your order. Please try again.");
        }
      } catch (error) {
        if (data?.length) setpreviewImages(data);
        console.error("API Error:", error);
      } finally {
        // Always clear the loader, no matter how order/detail or the follow-up
        // template/detail call resolves — otherwise a non-success response or a
        // timed-out request leaves the page stuck on "Loading..." forever.
        hideLoader();
      }
    } else {
      await toastError("Your checkout id has expired");
      router.push("/thank-you");
    }
  };

  const fetchCityStateFromZip = async (zip: string) => {
    try {
      const resData = await apiPost<any>("fedex/validate-address", {
        streetLines: [form.address_1 || "123 Main St"],
        postalCode: zip,
        countryCode: "US",
      });

      const result = resData?.data ?? resData;
      const resolved = result?.output?.resolvedAddresses?.[0];
      console.log('testtest', resolved?.streetLinesToken);

      if (resolved) {
        setForm((prev) => ({
          ...prev,
          // city: resolved.cityToken?.[0]?.value || "",
          // state: resolved.stateOrProvinceCode || "",
          address: form.address_1,
          city: resolved.cityToken?.[0]?.value || form.city,
          state: resolved.stateOrProvinceCode || form.state,
          // address: resolved.streetLinesToken || "",
        }));

        setErrors((prev) => ({
          ...prev,
          city: "",
          state: "",
          zip: "",
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;


    if (name === "zip") {
      const zipValue = value.replace(/\D/g, "");

      setForm((prev) => ({
        ...prev,
        zip: zipValue,
      }));

      if (zipValue.length === 5) {
        fetchCityStateFromZip(zipValue);
      }

      return;
    }

    if (name === "card_number") {
      let number = cardType === "amex" ? 15 : 16;
      let formattedValue = value.replace(/\D/g, "");
      if (formattedValue.length > number)
        formattedValue = formattedValue.slice(0, number);
      formattedValue = formattedValue.replace(/(\d{4})(?=\d)/g, "$1 ");
      setForm((prev) => ({ ...prev, [name]: formattedValue }));
    } else if (name === "expiry") {
      let formattedValue = value.replace(/[^\d]/g, "");
      if (formattedValue.length > 4)
        formattedValue = formattedValue.slice(0, 4);
      if (formattedValue.length >= 3) {
        formattedValue =
          formattedValue.slice(0, 2) + "/" + formattedValue.slice(2);
      }
      if (formattedValue.length >= 2) {
        let month = parseInt(formattedValue.slice(0, 2), 10);
        if (month < 1) month = 1;
        if (month > 12) month = 12;
        formattedValue =
          String(month).padStart(2, "0") + formattedValue.slice(2);
      }
      setForm((prev) => ({ ...prev, [name]: formattedValue }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    // if (["address", "city", "zip","state"].includes(name)) {
    //   setValid(false);
    // }
    if (["address", "city", "zip", "state"].includes(name)) {
      setValid(false);

      setShippingRates([]);
      setSelectedRate(null);
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // const validate = () => {
  //   let newErrors: { [key: string]: string } = {};
  //   let updatedAmount = Number(calculateFinalTotal());

  //   if (!form.name.trim()) newErrors.name = "Full name is required";
  //   if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
  //     newErrors.email = "Enter a valid email";
  //   if (!form.address.trim()) newErrors.address = "Address is required";
  //   if (!form.city.trim()) newErrors.city = "City is required";
  //   if (!form.zip.trim()) newErrors.zip = "ZIP is required";
  //   // if (!form.zip.match(/^\d{4,6}$/)) newErrors.zip = "ZIP must be 4–6 digits";

  //   if (form.payment_method === "card" && updatedAmount > 0) {
  //     if (!form.card_number.replace(/\s+/g, "").match(/^\d{16}$/))
  //       newErrors.card_number = "Card number must be 16 digits";
  //     if (!form.expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/))
  //       newErrors.expiry = "Expiry must be in MM/YY format";
  //     if (!form.cvv.match(/^\d{3}$/)) newErrors.cvv = "CVV must be 3 digits";
  //   }

  //   if (!form.shipping_same_as_billing && !form.shipping_address)
  //     newErrors.shippingAddress = "Select a shipping address";

  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

  const validate = () => {
    let newErrors: { [key: string]: string } = {};
    let updatedAmount = Number(calculateFinalTotal());

    const cardNumber = form.card_number.replace(/\s+/g, "");
    const cardType = getCardType(cardNumber);

    if (!form.first_name.trim()) newErrors.name = "First name is required";
    if (!form.last_name.trim()) newErrors.name = "Last name is required";

    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = "Enter a valid email";

    if (!form.address_1.trim()) newErrors.address = "Address line 1 is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.zip.trim()) newErrors.zip = "ZIP is required";
    if (!form.state.trim()) newErrors.state = "State is required";

    if (form.payment_method === "card" && updatedAmount > 0) {
      if ((cardType === "amex" && !/^\d{15}$/.test(cardNumber)) || (cardType !== "amex" && !/^\d{16}$/.test(cardNumber))) {
        newErrors.card_number = cardType === "amex" ? "Amex card must be 15 digits" : "Card must be 16 digits";
      }
      if (!form.expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
        newErrors.expiry = "Expiry must be in MM/YY format";
      }

      if ((cardType === "amex" && !/^\d{4}$/.test(form.cvv)) || (cardType !== "amex" && !/^\d{3}$/.test(form.cvv))) {
        newErrors.cvv = cardType === "amex" ? "Amex CVV must be 4 digits" : "CVV must be 3 digits";
      }
    }

    if (!form.shipping_same_as_billing) {
      if (!form.billing_first_name.trim()) newErrors.billing_first_name = "First name is required";
      if (!form.billing_last_name.trim()) newErrors.billing_last_name = "Last name is required";
      if (!form.billing_email.trim() || !form.billing_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
        newErrors.billing_email = "Enter a valid email";
      if (!form.billing_address_1.trim()) newErrors.billing_address_1 = "Address is required";
      if (!form.billing_city.trim()) newErrors.billing_city = "City is required";
      if (!form.billing_state.trim()) newErrors.billing_state = "State is required";
      if (!form.billing_zip.trim()) newErrors.billing_zip = "ZIP is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // useEffect(() => {
  //   // let cover_type = localStorage.getItem("cover_type")
  //   console.log(pagesCoversOptions)
  //   // find id by cover name from fetched templates covers options
  //  let cover = pagesCoversOptions.find((c) => c.cover_name.toLowerCase().replace(/\s+/g, "") === cover_type?.toLowerCase().replace(/\s+/g, ""));
  //   // console.log("cover", cover, cover_type);


  //   // if (cover) {
  //   //   setCoverType(cover._id);
  //   //   setCoverAmount(cover.price);
  //   // }
  // }, [pagesCoversOptions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    //===// Consent is required before an order can be placed //===//
    if (!acceptedTerms) {
      setTermsError(true);
      toastWarning("Please accept the Terms & Conditions to continue.");
      return;
    }

    if (!isValid) {
      toastError("Please wait, we are validating your shipping address.");
      addressValidate();
      return
    }

    let storedUser: any = getActiveUser();
    if (!storedUser) {
      storedUser = await ensureGuestUser();
    }
    if (!storedUser || !storedUser._id) {
      toastError("Could not start checkout. Please try again.");
      return;
    }

    if (!selectedRate) {
      toastError("Please select shipping method");
      return
    }

    await saveShippingAddressIfNew();
    let updatedAmount = Number(calculateFinalTotal());
    const isShippingSame = !!form.shipping_same_as_billing;

    // Use destructuring to create payload - exclude shipping_address and then conditionally add it
    const { shipping_address, ...formWithoutShipping } = form;
    const finalShippingAddress = isShippingSame ? null : shipping_address || null;

    //Static amount 
    // updatedAmount = Number(0.01);
    const payload = {
      ...formWithoutShipping,
      order_id: id,
      trans_id: "",
      discount_id: appliedCoupon ? appliedCoupon._id : "",
      payment_detail: "",
      amount: updatedAmount,
      shipping_same_as_billing: isShippingSame,
      // shipping_address must be null when shipping is same as billing
      shipping_address: isShippingSame ? null : shipping_address,
      billing_first_name: isShippingSame ? "" : form.billing_first_name,
      billing_last_name: isShippingSame ? "" : form.billing_last_name,
      billing_email: isShippingSame ? "" : form.billing_email,
      billing_company: isShippingSame ? "" : form.billing_company,
      billing_address_1: isShippingSame ? "" : form.billing_address_1,
      billing_address_2: isShippingSame ? "" : form.billing_address_2,
      billing_contact: isShippingSame ? "" : form.billing_contact,
      billing_city: isShippingSame ? "" : form.billing_city,
      billing_state: isShippingSame ? "" : form.billing_state,
      billing_zip: isShippingSame ? "" : form.billing_zip,
      paymentData: null,
      sku_code: '',
      selectedRate: selectedRate,
      total_price: getTotal(),
      // Cross-check only — the backend charges from the order document's own
      // quantity and rejects the request if this disagrees with it.
      quantity: quantity,
      // The state the tax shown to the customer was actually quoted for: FedEx's
      // resolved state code, which can differ from the raw `state` field. The
      // backend re-derives the tax rate itself (it never trusts a client-sent
      // amount) but must look it up for the SAME state, or its expected_amount
      // won't match the charge and the payment is rejected.
      tax_state: tax?.state_code || form.state
    };

    showLoader();
    if (updatedAmount <= 0) {
      try {
        payload.sku_code = skuCalculation();

        const res = await apiPost<any>("payment/store", payload);
        if (res.status && res.data) {
          toastSuccess("Form submitted successfully!");
          console.log("Form Data:", payload);
          clearAlbums();
          router.push("/thank-you");
          hideLoader();
        } else {
          toastError(res?.message || "Failed to place order. Please try again.");
          hideLoader();
        }
      } catch (error: any) {
        toastError(error?.message || "Something went wrong. Please try again.");
        hideLoader();
      }
    } else {
      if (!window.Accept) return alert("Accept.js not loaded");

      const authData = {
        clientKey: process.env.NEXT_PUBLIC_AUTH_NET_CLIENT_KEY,
        apiLoginID: process.env.NEXT_PUBLIC_AUTH_NET_API_LOGIN_ID,
      };
      console.log('authData.', authData)
      const cardData = {
        cardNumber: form.card_number.replace(/\s+/g, ""),
        month: form.expiry.split("/")[0],
        year: form.expiry.split("/")[1],
        cardCode: form.cvv,
      };
      console.log('cardData.', cardData)

      console.log('payload', payload)

      window.Accept.dispatchData({ authData, cardData }, async (response: any) => {
        console.log('response.messages.', response.messages)

        if (response.messages.resultCode === "Error") {
          alert(response.messages.message[0].text);
        } else {
          console.log("response.opaqueData", response.opaqueData);
          let paymentResponse = await sendPayment(response.opaqueData, updatedAmount, formWithoutShipping.first_name + ' ' + formWithoutShipping.last_name, formWithoutShipping.email, formWithoutShipping.address_1, formWithoutShipping.address_2, formWithoutShipping.city, formWithoutShipping.zip);
          if (paymentResponse) {

            if (paymentResponse.transactionResponse) {
              if ((paymentResponse.transactionResponse.errors && paymentResponse.transactionResponse.errors.length > 0)) {
                // toastError(paymentResponse.transactionResponse.errors[0].errorText);
                toastError("Payment failed.due to some reason, please check your card details and try again.");
                hideLoader();
                return false;
              } else {
                const txn = paymentResponse.transactionResponse;
                const avs = txn?.avsResultCode;
                if (avs && ["N", "A", "Z"].includes(avs)) {
                  toastError("ZIP code does not match card records.");
                  hideLoader();
                  return;
                }
                payload.trans_id = txn.transId;
                payload.payment_detail = JSON.stringify(paymentResponse);
                payload.sku_code = skuCalculation();
                console.log("Payload shipping_same_as_billing:", isShippingSame);
                console.log("Payload shipping_address:", isShippingSame ? null : shipping_address);
                console.log("Full Payload:", payload);
                const res = await apiPost<any>("payment/store", payload);
                if (res.status && res.data) {
                  toastSuccess("Form submitted successfully!");
                  console.log("Form Data:", payload);
                  clearAlbums();
                  router.push("/thank-you");
                  hideLoader();
                } else {
                  hideLoader();
                }
              }
            }
          }
        }
      });
    }

    hideLoader();
  };

  const sendPayment = async (opaqueData: any, amount: any, name: any, email: any, address_1: any, address_2: any, city: any, zip: any) => {
    const res = await apiPost<any>("authorizenet/charge", {
      opaqueData,
      amount,
      name,
      email,
      address_1,
      address_2,
      city,
      zip,
    });
    console.log("Payment Response:", res);

    // The backend wraps in make_response; unwrap the inner data for Authorize.net fields
    return res?.data ?? res;
  };

  const handleDigitalPayment = async (method: any) => {
    if (!window.Accept) return alert("Accept.js not loaded");
    if (method === "google") {
      try {
        const paymentsClient = new (window as any).google.payments.api.PaymentsClient({
          environment: "TEST",
        });

        const paymentDataRequest: google.payments.api.PaymentDataRequest = {
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPayment_methods: [
            {
              type: "CARD",
              parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ["VISA", "MASTERCARD"],
              },
              tokenizationSpecification: {
                type: "PAYMENT_GATEWAY",
                parameters: {
                  gateway: "cardconnect",
                  gatewayMerchantId: process.env.NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID,
                  authorizenetKeyId: process.env.NEXT_PUBLIC_AUTHORIZE_NET_KEY_Id,
                },
              },
            },
          ],
          merchantInfo: {
            merchantName: "My Test Store",
          },
          transactionInfo: {
            totalPriceStatus: "FINAL",
            // calculateFinalTotal, not orderDetail.total_price — that is the price
            // of a single book, excluding copies, shipping and tax.
            totalPrice: calculateFinalTotal(),
            currencyCode: "USD",
          },
        };

        const paymentData = await paymentsClient.loadPaymentData(
          paymentDataRequest
        );

        const token = paymentData.payment_methodData.tokenizationData.token;

        const opaqueData = {
          dataDescriptor: "COMMON.ACCEPT.INAPP.PAYMENT",
          dataValue: token,
        };
      } catch (err) {
        console.error("Google Pay error:", err);
        toastError("Google Pay failed or was cancelled.");
      }
    }

    if (method === "apple") {
      if (typeof window === "undefined") return;
      console.log("ApplePaySession.canMakePayments()", ApplePaySession.canMakePayments());

      if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
        alert("Apple Pay not supported.");
        return;
      }

      const request: ApplePayJS.ApplePayPaymentRequest = {
        countryCode: "US",
        currencyCode: "USD",
        merchantCapabilities: ["supports3DS"],
        supportedNetworks: ["visa", "masterCard", "amex"],
        total: { label: "Pixovo Test Store", amount: "10.00" }
      };


      // 🔵 1. Merchant Validation — call your API here
      const session = new ApplePaySession(4, request);
      session.onvalidatemerchant = async (event: any) => {
        const merchantSession = await apiPost<any>("apple-pay/validate-merchant", {
          validationURL: event.validationURL,
        });
        // Backend wraps in make_response; unwrap for Apple Pay
        session.completeMerchantValidation(merchantSession?.data ?? merchantSession);
      };

      // 🔵 2. Payment Authorization
      session.onpaymentauthorized = (event) => {
        const token = event.payment.token.paymentData;
        const opaqueData = {
          dataDescriptor: "COMMON.APPLE.INAPP.PAYMENT",
          dataValue: JSON.stringify(token), // send this to Authorize.net
        };
        session.completePayment(ApplePaySession.STATUS_SUCCESS);
      };

      session.begin();
    }

    if (method === "paypal") {
      setTimeout(() => {
        console.log("window.paypal", paypalRef);
        if (typeof window !== "undefined" && window.paypal) {

          window.paypal.Buttons({
            createOrder: async (data: any, actions: any) => {
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    // See the Google Pay note above: this must be the full charged
                    // amount, not the single-book price.
                    value: calculateFinalTotal(),
                    currency_code: 'USD',
                    description: 'Description'
                  }
                }]
              });
            },
            onApprove: async (data: any, actions: any) => {
              return actions.order.capture().then((details: any) => {
                console.log("details", details);

              });
            },

            onError: (err: any) => {
              console.error("PayPal error:", err);
            }
          }).render(paypalRef.current);
        }
      });
    }
  };

  const handleCustomize = () => {
    setShowCustomize(true);
  };

  const handleClose = () => {
    setShowCustomize(false);
  };

  const saveCustomize = async () => {
    const minPages = parseFloat(orderDetail.template_id.min_page);
    const basePrice: any = parseFloat(orderDetail.base_price) || 0;
    const pageMultiplier: any = (orderDetail.number_of_pages / minPages) || 0;
    const pagePrice = basePrice * parseFloat(pageMultiplier) || 0;
    const step = 20;
    const pagesArray: number[] = [];
    for (let i = orderDetail.template_id.min_page; i <= orderDetail.number_of_pages; i += step) {
      pagesArray.push(i);
    }

    let total = (pagePrice + (sizeAmount * pagesArray.length || 0) + (coverAmount || 0) + (orderDetail.paper_quality.price || 0)).toFixed(2);

    let exTraPagePrice: any = orderDetail.extra_page ? orderDetail.extra_page * sizePerPageAmount : 0.00;
    total = orderDetail.extra_page ? parseFloat(total) + parseFloat(exTraPagePrice) : total;
    let storedUser = get<any>("user");

    const formData = new FormData();
    formData.append("user_id", storedUser._id);
    formData.append("orderId", id);
    formData.append("size", pageSize);
    formData.append("size_amount", sizeAmount);
    formData.append("cover_type", coverType);
    formData.append("cover_amount", coverAmount);
    formData.append("total_price", total);

    const res = await apiPost<any>("order/update", formData);
    if (res.status) {
      toastSuccess(res.message);
      apiCallDetail();
      setShowCustomize(false);
    } else {
      toastError(res.message);
    }
  };

  const goNext = async () => {
    if (flipBook.current) {
      flipBook.current.pageFlip().flipNext();
    }
  };

  const goPrev = () => {
    if (flipBook.current) {
      flipBook.current.pageFlip().flipPrev();
    }
  };

  const parseSize = (sizeName: string) => {
    // Replace any kind of x or × with lowercase x
    const normalized = sizeName.replace(/[×X]/g, "x");
    const [w, h] = normalized.split("x").map(Number);
    return { width: w, height: h };
  };

  // const addressValidate = async () => {
  //   setValidStart(true);
  //   const addressData = {
  //     streetLines: [form.address],
  //     city: form.city,
  //     stateOrProvinceCode: form.state,
  //     // stateOrProvinceCode: "df",
  //     postalCode: form.zip,
  //     countryCode: "US",
  //   };

  //   const resData = await fetch("/api/fedex-validate", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(addressData),
  //   });

  //   const result = await resData.json();
  //   const valid = isAddressValid(result);
  //   console.log("valid", valid);

  //   if (valid) {
  //     console.log(result);
  //     let StreetLines = []
  //     console.log("orderDetail.ship_from.address_1", orderDetail);

  //     if (orderDetail?.ship_from?.address_1) {
  //       StreetLines = [orderDetail.ship_from.address_1];
  //     } else if (orderDetail?.ship_from?.address_2) {
  //       StreetLines.push(orderDetail.ship_from.address_2);
  //     }

  //     const rateData = {
  //       fromPostalCode: orderDetail.ship_from ? orderDetail.ship_from.zip_code : "32097",
  //       fromStreetLines: StreetLines ? StreetLines : ["Danielson Court"],
  //       fromCity: orderDetail.ship_from ? orderDetail.ship_from.city : "Poway",
  //       fromStateOrProvinceCode: orderDetail.ship_from ? orderDetail.ship_from.state_code : "CA",
  //       fromCountryCode: orderDetail.ship_from ? orderDetail.ship_from.country : "US",

  //       toPostalCode: result.output.resolvedAddresses[0].parsedPostalCode.base,
  //       toStreetLines: result.output.resolvedAddresses[0].streetLinesToken,
  //       toCity: result.output.resolvedAddresses[0].cityToken.value,
  //       toStateOrProvinceCode: result.output.resolvedAddresses[0].stateOrProvinceCode,
  //       toCountryCode: result.output.resolvedAddresses[0].countryCode,
  //       weight: orderDetail?.size?.wight
  //     };

  //     const rateRes = await fetch("/api/fedex-rates", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(rateData),
  //     });

  //     const rateResult = await rateRes.json();
  //     if (rateResult && rateResult.options) {
  //       setShippingRates(rateResult.options)
  //     }
  //     setValidStart(false);
  //     toastSuccess("Address validation successful! Shipping rate updated.");
  //     const formData = new FormData();
  //     formData.append("state_code", result.output.resolvedAddresses[0].stateOrProvinceCode);
  //     const res = await apiPost<any>("order/get-tax", formData);
  //     if (res.status) {
  //       const subTotal = Number(orderDetail?.sub_total_price);
  //       const taxRate = Number(res.data.tax_value);

  //       const tax = (subTotal * taxRate) / 100;
  //       res.data.tax_price = Number(tax.toFixed(2));
  //       setTax(res.data)
  //     } else {
  //       toastError(res.message);
  //     }
  //   } else {
  //     toastError("Please provide a valid address.");
  //   }
  //   setValid(valid)
  //   setValidStart(false);
  // }



  /**
   * Quote FedEx for `qty` copies going to an already-resolved address.
   *
   * Split out of addressValidate because shipping now depends on the copy count:
   * the parcel weight scales, so changing the quantity has to re-quote. The
   * previously chosen service is kept if it still comes back, otherwise the
   * selection is cleared so the customer has to pick from the new prices rather
   * than silently keeping a stale one.
   */
  const quoteShipping = async (resolved: any, qty: number) => {
    if (!resolved) return;

    let StreetLines: any[] = [];
    if (orderDetail?.ship_from?.address_1) {
      StreetLines = [orderDetail.ship_from.address_1];
    } else if (orderDetail?.ship_from?.address_2) {
      StreetLines.push(orderDetail.ship_from.address_2);
    }

    // `wight` (sic — that is the field name on the size document) is the weight of
    // a single book. The backend falls back to 5 when it receives nothing, so
    // mirror that default here instead of sending 0, which would silently collapse
    // a multi-copy parcel back to a one-book quote.
    const unitWeight = Number(orderDetail?.size?.wight) > 0
      ? Number(orderDetail.size.wight)
      : 5;

    const rateData = {
      fromPostalCode: orderDetail.ship_from ? orderDetail.ship_from.zip_code : "32097",
      fromStreetLines: StreetLines ? StreetLines : ["Danielson Court"],
      fromCity: orderDetail.ship_from ? orderDetail.ship_from.city : "Poway",
      fromStateOrProvinceCode: orderDetail.ship_from ? orderDetail.ship_from.state_code : "CA",
      fromCountryCode: orderDetail.ship_from ? orderDetail.ship_from.country : "US",

      toPostalCode: resolved.parsedPostalCode.base,
      toStreetLines: resolved.streetLinesToken,
      toCity: resolved.cityToken.value,
      toStateOrProvinceCode: resolved.stateOrProvinceCode,
      toCountryCode: resolved.countryCode,
      weight: unitWeight * clampQuantity(qty)
    };

    const rateResult = await apiPost<any>("fedex/rates", rateData);
    const rateResultData = rateResult?.data ?? rateResult;
    if (rateResultData && rateResultData.options) {
      const options = rateResultData.options;

      // const options = [...rateResultData.options];

      /* ─────────────────── TEST ONLY — REMOVE AFTER TESTING ───────────────────
         A $0 shipping option, so checkout can be run end to end without paying a
         real FedEx rate.

         No backend change is needed: payment/store derives shipping from the
         selected rate's own price (`request.selectedRate["price"]`), so picking
         this makes the server expect $0 shipping too — the charged amount and
         the displayed Grand Total still agree.

         Comment out or delete this whole block when testing is finished; the
         line above and below it stand on their own.                            */
      // options.push({
      //   serviceType: "FREE_SHIPPING",
      //   service: "5-7 business days",
      //   description: "Test-only free shipping",
      //   price: 0,
      //   currency: "USD",
      // });
      /* ───────────────────────── END TEST ONLY ────────────────────────────── */

      setShippingRates(options);
      setSelectedRate((prev: any) =>
        prev
          ? options.find((o: any) => o.serviceType === prev.serviceType) || null
          : null
      );
    }
  };

  /**
   * Change the copy count. The order document is updated first, because
   * payment/store charges from the *stored* quantity — if this page's number and
   * the order's ever disagreed, the card charge would not match the amount the
   * backend expects and the payment would be rejected.
   */
  const changeQuantity = async (next: number) => {
    const qty = clampQuantity(next);
    if (!id || quantityBusy || qty === quantity) return;

    setQuantityBusy(true);
    try {
      const res = await apiPost<any>("order/update-quantity", {
        order_id: id,
        quantity: qty,
      });
      if (!res?.status) {
        toastError(res?.message || "Could not update the quantity.");
        return;
      }

      setQuantity(qty);
      repriceForQuantity(qty);

      // Shipping was quoted for the old weight; re-quote so the customer is not
      // shown (or charged) a one-book shipping price for several books.
      if (resolvedAddress) {
        await quoteShipping(resolvedAddress, qty);
      }
    } catch (err) {
      console.error("Quantity update failed", err);
      toastError("Could not update the quantity.");
    } finally {
      setQuantityBusy(false);
    }
  };

  const addressValidate = async () => {
    setValidStart(true);
    setSuiteError("");

    setErrors((prev) => ({
      ...prev,
      address: "",
      city: "",
      state: "",
      zip: "",
    }));

    let addressData: any = {
      streetLines: [],
      city: form.city,
      stateOrProvinceCode: form.state,
      postalCode: form.zip,
      countryCode: "US",
    };

    if (form.address_1) {
      addressData.streetLines.push(form.address_1);
    }

    if (form.address_2) {
      addressData.streetLines.push(form.address_2);
    }

    try {
      const resData = await apiPost<any>("fedex/validate-address", addressData);
      const result = resData?.data ?? resData;
      const resolved = result?.output?.resolvedAddresses?.[0];

      const attr = resolved?.attributes || {};
      const stateToken = resolved?.stateOrProvinceCodeToken?.changed;
      const cityToken = resolved?.cityToken;
      // customerMessages from FedEx is an array of {code, message} objects, not a string —
      // flatten it to plain text before it's ever put into JSX-rendered state.
      const rawCustomerMessages = resolved?.customerMessages || result.errors?.[0]?.message;
      const customerMessages = Array.isArray(rawCustomerMessages)
        ? rawCustomerMessages.map((m: any) => m?.message || m?.text || "").filter(Boolean).join(" ")
        : rawCustomerMessages;

      // ---------- Dynamic Validation ----------
      let fieldErrors: any = {};

      if (attr.ValidlyFormed === "false") {
        fieldErrors.address = "Address format is invalid.";
      }

      if (attr.CityStateValidated === "false") {
        fieldErrors.city = "City is incorrect.";
        // fieldErrors.state = "City or State is incorrect.";
      }

      if (attr.PostalValidated === "false") {
        fieldErrors.zip = "ZIP code is incorrect.";
      }

      if (attr.StreetValidated === "false") {
        fieldErrors.address = "Street address is incorrect.";
      }

      if (stateToken === "false") {
        fieldErrors.state = "State is incorrect.";
      }

      if (cityToken?.changed === "false") {
        fieldErrors.city = "City is incorrect.";
      }

      // if (attr.DPV === "false") {
      //   fieldErrors.push("Address is not deliverable.");
      // }

      // if (attr.Matched === "false") {
      //   fieldErrors.push("Address not found.");
      // }

      // if (attr.Resolved === "false") {
      //   fieldErrors.push("Address could not be resolved.");
      // }

      // const suiteMsg = customerMessages.find(
      //   (msg: any) => msg.code === "SUITE.NUMBER.REQUIRED"
      // );

      // if (suiteMsg) {

      if (customerMessages.length > 0) {
        setSuiteError(customerMessages || "Invalid field value in the input");
      }
      // }
      console.log('setSuiteError', suiteError);


      const valid = isAddressValid(result);
      console.log("valid", valid);

      if (valid) {
        setValid(true);
        setErrors((prev) => ({
          ...prev,
          address: "",
          city: "",
          state: "",
          zip: "",
        }));

        // Remembered so a later quantity change can re-quote the (now heavier)
        // parcel without making the customer validate their address again.
        const resolved = result.output.resolvedAddresses[0];
        setResolvedAddress(resolved);

        await quoteShipping(resolved, quantity);
        setValidStart(false);
        toastSuccess("Address validation successful! Shipping rate updated.");

        // ---------- Tax ----------

        const formData = new FormData();
        formData.append("state_code", resolved.stateOrProvinceCode);
        const res = await apiPost<any>("order/get-tax", formData);
        if (res.status) {
          // Tax follows the discount, so it is levied on the subtotal net of any
          // coupon the customer has already applied — not the list subtotal.
          res.data.tax_price = taxPriceFor(getTaxableBase(quantity), res.data);
          setTax(res.data)
        } else {
          toastError(res.message);
          setValid(true);
        }
      }
      else {
        setValid(false);


        setErrors((prev) => ({
          ...prev,
          ...fieldErrors,
        }));
      }
    } catch (error) {
      setValid(false);
      console.error(error);
      setErrors((prev) => ({
        ...prev,
        address: "Something went wrong while validating address.",
      }));
    } finally {
      setValidStart(false);
    }
  };

  // function isAddressValid(response: any): boolean {
  //   const addr = response?.output?.resolvedAddresses?.[0]?.attributes;
  //   if (!addr) return false;
  //   if (response?.output?.alerts?.[0]?.code === "VIRTUAL.RESPONSE") {
  //     console.warn("⚠️ Virtual Response: Sandbox mode only, not real validation.");
  //   }

  //   return addr.CountrySupported === "true" && addr.ValidlyFormed === "true" && addr.Matched === "true";
  // }

  function isAddressValid(response: any): boolean {
    const resolved = response?.output?.resolvedAddresses?.[0];
    const attr = resolved?.attributes;

    if (!attr) return false;

    // Sandbox warning (optional)
    if (response?.output?.alerts?.[0]?.code === "VIRTUAL.RESPONSE") {
      console.warn("⚠️ Virtual Response: Sandbox mode only, not real validation.");
    }

    const isValid =
      attr.DPV === "true" &&       // ✅ MUST (deliverable)
      attr.Matched === "true" &&   // ✅ Found in database
      attr.Resolved === "true";    // ✅ Fully resolved

    return isValid;
  }

  const navigate = (patch: any) => {
    router.push(patch);
  };

  const skuCalculation = () => {
    const frontName = orderDetail?.category?.sku + "-" || "";
    const sizeName = (orderDetail?.size?.size_name || "").replace(/\s+/g, "") + "-";
    const typeSku = orderDetail?.type?.sku + "-" || "";
    const coverSku = orderDetail?.cover_type?.sku + "-" || "";
    const paperQuality = orderDetail?.paper_quality?.sku + "-" || "";
    const pageNum = orderDetail?.number_of_pages || "";
    if (sizeName && typeSku && coverSku && paperQuality && pageNum) {
      return `${frontName}${coverSku}${sizeName}${typeSku}${paperQuality}${pageNum}`;
    } else {
      return "";
    }
  };

  const getDayName = (dayCode: any) => {
    const days: any = {
      MON: "Monday",
      TUE: "Tuesday",
      WED: "Wednesday",
      THU: "Thursday",
      FRI: "Friday",
      SAT: "Saturday",
      SUN: "Sunday"
    };

    return days[dayCode] || dayCode;
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
    );
  };


  /**
   * The Grand Total shown in the Order Summary. Deliberately the *same function*
   * that computes the charged amount: these were two separate calculations that
   * had drifted apart (this one added tax, the charge did not), so a customer
   * could be shown one number and billed another. Keeping one implementation
   * makes that class of bug impossible.
   */
  const getTotal = () => calculateFinalTotal();

  // Detect card type
  const getCardType = (number: any) => {
    const num = number.replace(/\s/g, "");
    if (/^4/.test(num)) return "visa";
    if (/^5[1-5]/.test(num)) return "mastercard";
    if (/^3[47]/.test(num)) return "amex";
    return "";
  };
  const cardType = getCardType(form.card_number);

  console.log("cardType", cardType);

  const getAddress = (addr: any) => {

    setForm((prev) => ({
      ...prev,
      is_billing_address: addr._id,

      address_1: (addr.address ? addr.address : addr.address_1) || "",
      address_2: addr.address_2 ? addr.address_2 : "",

      city: addr.city || "",

      state: addr.state || "",

      zip: addr.zip || "",

    }))
    addressValidate();
  };

  return (
    <>
      <div className="container my-5 chackout-page">
        <h1 className="mb-4 text-center checkout-heading">Checkout</h1>
        <div className="row">
          {/* Billing & Payment */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-body billing-card-block">
                <h4 className="maim-lable card-title mb-3">Shipping Details</h4>
                <form id="checkoutForm" onSubmit={handleSubmit} className="billing-form">
                  {/* Name */}
                  {/* <div className="mb-2">
                    <label htmlFor="fullname" className="form-label">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? "is-invalid" : ""}`}
                      placeholder="Enter your full name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name}</div>
                    )} */}
                  <div className="row">
                    <div className="mb-2 col-md-6">
                      <label htmlFor="fullname" className="form-label">
                        First Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.first_name ? "is-invalid" : ""}`}
                        placeholder="Enter your full name"
                        name="first_name"
                        value={form.first_name}
                        onChange={handleChange}
                      />
                      {errors.first_name && (
                        <div className="invalid-feedback">{errors.first_name}</div>
                      )}
                    </div>
                    <div className="mb-2 col-md-6">
                      <label htmlFor="fullname" className="form-label">
                        Last Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.last_name ? "is-invalid" : ""}`}
                        placeholder="Enter your full name"
                        name="last_name"
                        value={form.last_name}
                        onChange={handleChange}
                      />
                      {errors.last_name && (
                        <div className="invalid-feedback">{errors.last_name}</div>
                      )}
                    </div>
                  </div>


                  {/* Email */}
                  <div className="mb-2">
                    <label htmlFor="fullname" className="form-label">
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                      placeholder="Enter your email address"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="mb-2">
                    <label htmlFor="company" className="form-label">
                      Company
                    </label>
                    <input
                      type="tel"
                      className={`form-control`}
                      placeholder="Enter your company name"
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mb-2">
                    <label htmlFor="contact" className="form-label">
                      Phone Number
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter phone number"
                      name="contact"
                      value={form.contact}
                      onChange={handleChange}
                      maxLength={35}
                    />
                  </div>

                  {/* Address */}
                  <div className="mb-2">
                    <label htmlFor="phone" className="form-label">
                      Address line 1 <span className="text-danger">*</span>                    </label>
                    <input
                      className={`form-control ${errors.address_1 ? "is-invalid" : ""}`}
                      placeholder="Address line 1"
                      name="address_1"
                      maxLength={30}
                      value={form.address_1}
                      onChange={handleChange}
                    />
                    {errors.address_1 && (
                      <div className="invalid-feedback">{errors.address_1}</div>
                    )}
                  </div>

                  {/* // Should add an optional address line 2 with placeholder value of &quot;Apartment/ Suite&quot; and */}
                  <div className="mb-2">
                    <label htmlFor="phone" className="form-label">
                      Address line 2
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.address_2 ? "is-invalid" : ""}`}
                      placeholder="Apartment / Suite"
                      name="address_2"
                      maxLength={30}
                      value={form.address_2}
                      onChange={handleChange}
                    />
                  </div>


                  <div className="mb-2">
                    <label htmlFor="country" className="form-label">
                      Country / Region
                    </label>
                    <input
                      id="country"
                      type="text"
                      className="form-control country-field"
                      value="United States"
                      readOnly
                      aria-describedby="shipping-region-note"
                    />
                    <div id="shipping-region-note" className="checkout-shipping-note">
                      We currently ship only within the USA, including Alaska and Hawaii.
                    </div>
                  </div>

                  {/* City + ZIP */}
                  <div className="row mb-2">
                    <div className="col">
                      <label htmlFor="phone" className="form-label">
                        ZIP <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.zip ? "is-invalid" : ""}`}
                        placeholder="ZIP"
                        name="zip"
                        value={form.zip}
                        onChange={handleChange}
                      />
                      {errors.zip && (
                        <div className="invalid-feedback">{errors.zip}</div>
                      )}
                    </div>
                    <div className="col">
                      <label htmlFor="phone" className="form-label">
                        City <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.city ? "is-invalid" : ""}`}
                        placeholder="City"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                      />
                      {errors.city && (
                        <div className="invalid-feedback">{errors.city}</div>
                      )}
                    </div>

                    {/* State */}
                    <div className="col">
                      <div className="mb-2">
                        <label className="form-label">
                          State <span className="text-danger">*</span>
                        </label>
                        {/* <input
                          type="text"
                          className={`form-control ${errors.state ? "is-invalid" : ""}`}
                          placeholder="State (e.g. CA)"
                          name="state"
                          value={form.state}
                          onChange={handleChange}
                        /> */}
                        <select
                          className={`form-control ${errors.state ? "is-invalid" : ""}`}
                          name="state"
                          value={form.state}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              state: e.target.value,
                              is_address_verifed: false,
                            }))
                          }
                        >
                          <option value="">Select State</option>
                          {stateList.map((item: any, index: number) => (
                            <option key={index} value={item.state_code}>
                              {item.state_name}
                            </option>
                          ))}
                        </select>
                        {errors.state && (
                          <div className="invalid-feedback">{errors.state}</div>
                        )}
                      </div>
                    </div>


                    {addressList.length > 0 && (
                      <div className="col-12">
                        <label className="form-label">
                          Choose Previous Shipping Address
                        </label>
                        <div className="row g-3">
                          {addressList.map((addr: any) => (
                            <div className="col-12 col-md-6" key={addr._id}>
                              <div
                                className={`card p-2 ${form.is_billing_address === addr._id
                                  ? "border-primary"
                                  : ""
                                  }`}
                              >
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="shippingAddress"
                                    id={`addr-${addr._id}`}
                                    value={addr._id}
                                    checked={form.is_billing_address === addr._id}
                                    onChange={() => {
                                      console.log(form.is_billing_address, "===", addr._id);
                                      getAddress(addr);
                                    }}
                                  />
                                  <label
                                    className="form-check-label ms-2"
                                    htmlFor={`addr-${addr._id}`}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <div>
                                      <strong>{addr.address ? addr.address : addr.address_1}{addr.address_2 ? ',' + addr.address_2 : ''}</strong>                                      <p className="mb-0">
                                        {addr.city}, {addr.state}, {addr.zip}
                                      </p>
                                    </div>
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* {addressError && (
              <div className="alert alert-danger py-2 mb-2">
                {addressError}
              </div>
            )} */}
                  {/* Address validation button disabled */}
                  <div>
                    {suiteError && (
                      <div className="invalid-feedback mb-2">
                        {suiteError}
                      </div>
                    )}
                    <button type="button" onClick={addressValidate} className="btn btn-outline" data-action="validate-address">
                      {isValidStart ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        !isValid ? "Validate Address" : <div><i className="fa fa-check-circle text-success font-set" aria-hidden="true"></i> Validate Address</div>
                      )}
                    </button>
                  </div>

                  {/* Shipping Checkbox */}
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="sameShipping"
                      checked={form.shipping_same_as_billing}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          shipping_same_as_billing: e.target.checked,
                          // Set shipping_address to null when same-as-billing is enabled
                          shipping_address: e.target.checked
                            ? null
                            : prev.shipping_address,

                          // billing_first_name: e.target.checked ? "" : prev.billing_first_name,
                          // billing_last_name: e.target.checked ? "" : prev.billing_last_name,
                          // billing_email: e.target.checked ? "" : prev.billing_email,
                          // billing_company: e.target.checked ? "" : prev.billing_company,
                          billing_address_1: e.target.checked ? "" : prev.billing_address_1,
                          billing_address_2: e.target.checked ? "" : prev.billing_address_2,
                          // billing_contact: e.target.checked ? "" : prev.billing_contact,
                          billing_city: e.target.checked ? "" : prev.billing_city,
                          billing_state: e.target.checked ? "" : prev.billing_state,
                          billing_zip: e.target.checked ? "" : prev.billing_zip,
                        }))


                      }
                    />
                    <label className="form-check-label" htmlFor="sameShipping">
                      Billing address same as shipping address
                    </label>
                  </div>
                  {/* Shipping Addresses */}
                  {!form.shipping_same_as_billing && (
                    <div className="mb-3">
                      <label className="form-label">
                        Select Billing Address
                      </label>
                      <div className="row g-3">
                        {/* {billingAddressList.map((addr: any, idx: number) => (
                          <div className="col-12 col-md-6" key={addr._id}>
                            <div
                              className={`card p-2 ${form.shipping_address === addr._id
                                ? "border-primary"
                                : ""
                                }`}
                            >
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="shippingAddress"
                                  id={`addr-${addr._id}`}
                                  value={addr._id}
                                  checked={form.shipping_address === addr._id}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      shipping_address: e.target.value,
                                      billing_first_name: addr.first_name || prev.first_name || "",
                                      billing_last_name: addr.last_name || prev.last_name || "",
                                      billing_address_1: (addr.address ? addr.address : addr.address_1) || "",
                                      billing_contact: addr.contact || addr.phone || prev.phone || "",
                                      billing_city: addr.city || "",
                                      billing_state: addr.state || "",
                                      billing_zip: addr.zip || "",
                                    }))
                                  }
                                />
                                <label
                                  className="form-check-label ms-2"
                                  htmlFor={`addr-${addr._id}`}
                                  style={{ cursor: "pointer" }}
                                >
                                  <div>
                                    <strong>{addr.address ? addr.address : addr.address_1}{addr.address_2 ? ', ' + addr.address_2 : ''}</strong>

                                    + <p className="mb-0">
                                      +   {addr.city}, {addr.state}, {addr.zip}
                                      + </p>
                                  </div>
                                </label>
                              </div>
                            </div>
                          </div>
                        ))} */}

                        {/* ───── New billing address form ───── */}
                        <div className="row g-2 mt-3 billing-form-block">
                          <div className="col-12">
                            <hr className="my-2" />
                            {/* <div className="text-muted small mb-2">
                              Or enter a new billing address
                            </div> */}
                          </div>

                          <div className="col-md-6">
                            <label htmlFor="billing_first_name" className="form-label">
                              First Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              id="billing_first_name"
                              name="billing_first_name"
                              className={`form-control ${errors.billing_first_name ? "is-invalid" : ""}`}
                              placeholder="First name"
                              value={form.billing_first_name}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  billing_first_name: e.target.value,
                                  shipping_address: null,
                                }))
                              }
                            />
                            {errors.billing_first_name && (
                              <div className="invalid-feedback">{errors.billing_first_name}</div>
                            )}
                          </div>

                          <div className="col-md-6">
                            <label htmlFor="billing_last_name" className="form-label">
                              Last Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              id="billing_last_name"
                              name="billing_last_name"
                              className={`form-control ${errors.billing_last_name ? "is-invalid" : ""}`}
                              placeholder="Last name"
                              value={form.billing_last_name}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  billing_last_name: e.target.value,
                                  shipping_address: null,
                                }))
                              }
                            />
                            {errors.billing_last_name && (
                              <div className="invalid-feedback">{errors.billing_last_name}</div>
                            )}
                          </div>

                          <div className="col-12">
                            <label htmlFor="billing_email" className="form-label">
                              Email <span className="text-danger">*</span>
                            </label>
                            <input
                              type="email"
                              id="billing_email"
                              name="billing_email"
                              className={`form-control ${errors.billing_email ? "is-invalid" : ""}`}
                              placeholder="Enter your email address"
                              value={form.billing_email}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  billing_email: e.target.value,
                                  shipping_address: null,
                                }))
                              }
                            />
                            {errors.billing_email && (
                              <div className="invalid-feedback">{errors.billing_email}</div>
                            )}
                          </div>

                          <div className="col-12">
                            <label htmlFor="billing_company" className="form-label">
                              Company
                            </label>
                            <input
                              type="text"
                              id="billing_company"
                              name="billing_company"
                              className="form-control"
                              placeholder="Enter your company name"
                              value={form.billing_company}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  billing_company: e.target.value,
                                  shipping_address: null,
                                }))
                              }
                            />
                          </div>

                          <div className="col-12">
                            <label htmlFor="billing_contact" className="form-label">
                              Phone Number
                            </label>
                            <input
                              type="text"
                              id="billing_contact"
                              name="billing_contact"
                              maxLength={35}
                              className="form-control"
                              placeholder="Enter phone number"
                              value={form.billing_contact}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  billing_contact: e.target.value,
                                  shipping_address: null,
                                }))
                              }
                            />
                          </div>

                          <div className="col-12">
                            <label htmlFor="billing_address_1" className="form-label">
                              Address line 1 <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              id="billing_address_1"
                              name="billing_address_1"
                              maxLength={30}
                              className={`form-control ${errors.billing_address_1 ? "is-invalid" : ""}`}
                              placeholder="Billing address"
                              value={form.billing_address_1}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  billing_address_1: e.target.value,
                                  shipping_address: null,
                                }))
                              }
                            />
                            {errors.billing_address_1 && (
                              <div className="invalid-feedback">{errors.billing_address_1}</div>
                            )}
                          </div>

                          <div className="col-12">
                            <label htmlFor="billing_address_2" className="form-label">
                              Address line 2
                            </label>
                            <input
                              type="text"
                              id="billing_address_2"
                              name="billing_address_2"
                              maxLength={30}
                              className="form-control"
                              placeholder="Apartment / Suite"
                              value={form.billing_address_2}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  billing_address_2: e.target.value,
                                  shipping_address: null,
                                }))
                              }
                            />
                          </div>

                          <div className="col-12">
                            <label htmlFor="billing_country" className="form-label">
                              Country / Region
                            </label>
                            <input
                              id="billing_country"
                              type="text"
                              className="form-control country-field"
                              value="United States"
                              readOnly
                              aria-describedby="billing-region-note"
                            />
                            <div id="billing-region-note" className="checkout-shipping-note">
                              We currently ship only within the USA, including Alaska and Hawaii.
                            </div>
                          </div>

                          <div className="col-12">
                            <div className="row">
                              <div className="col">
                                <label htmlFor="billing_zip" className="form-label">
                                  ZIP <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  id="billing_zip"
                                  name="billing_zip"
                                  className={`form-control ${errors.billing_zip ? "is-invalid" : ""}`}
                                  placeholder="ZIP"
                                  value={form.billing_zip}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      billing_zip: e.target.value,
                                      shipping_address: null,
                                    }))
                                  }
                                />
                                {errors.billing_zip && (
                                  <div className="invalid-feedback">{errors.billing_zip}</div>
                                )}
                              </div>

                              <div className="col">
                                <label htmlFor="billing_city" className="form-label">
                                  City <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  id="billing_city"
                                  name="billing_city"
                                  className={`form-control ${errors.billing_city ? "is-invalid" : ""}`}
                                  placeholder="City"
                                  value={form.billing_city}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      billing_city: e.target.value,
                                      shipping_address: null,
                                    }))
                                  }
                                />
                                {errors.billing_city && (
                                  <div className="invalid-feedback">{errors.billing_city}</div>
                                )}
                              </div>

                              <div className="col">
                                <label htmlFor="billing_state" className="form-label">
                                  State <span className="text-danger">*</span>
                                </label>
                                <select
                                  id="billing_state"
                                  name="billing_state"
                                  className={`form-control ${errors.billing_state ? "is-invalid" : ""}`}
                                  value={form.billing_state}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      billing_state: e.target.value,
                                      shipping_address: null,
                                    }))
                                  }
                                >
                                  <option value="">Select State</option>
                                  {stateList.map((item: any, index: number) => (
                                    <option key={index} value={item.state_code}>
                                      {item.state_name}
                                    </option>
                                  ))}
                                </select>
                                {errors.billing_state && (
                                  <div className="invalid-feedback">{errors.billing_state}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* ───── /New billing address form ───── */}
                      </div>
                      {billingAddressList.length === 0 && (
                        <div className="text-muted small mt-2">
                          No saved addresses found. Please add a new address.
                        </div>
                      )}
                      {errors.shippingAddress && (
                        <div className="text-danger small mt-1">
                          {errors.shippingAddress}
                        </div>
                      )}
                    </div>
                  )}

                  {isValid && shippingRates?.length > 0 && (
                    <div className="mb-3">
                      <h4 className="maim-lable card-title mb-3 payment-detail-heading">
                        Shipping method
                      </h4>
                      <div className="shipping-wrapper">
                        <div className="shipping-list">

                          {shippingRates.map((rate: any, idx: number) => {

                            const isSelected = selectedRate?.serviceType === rate.serviceType;

                            return (
                              <div key={idx} className={`shipping-card ${isSelected ? "active" : ""}`} onClick={() => setSelectedRate(rate)} >
                                <div className="shipping-left">
                                  <input type="radio" checked={isSelected} onChange={() => setSelectedRate(rate)} />
                                  <div className="shipping-info">
                                    <div className="service-name">
                                      {rate.serviceType.replaceAll("_", " ")}
                                    </div>

                                    <div className="delivery-time">
                                      Delivery: {rate.service}
                                    </div>
                                  </div>
                                </div>

                                <div className="shipping-price">
                                  ${rate.price}
                                </div>
                              </div>
                            );
                          })}

                        </div>
                      </div>
                    </div>
                  )}

                  <h4 className="maim-lable card-title mb-3 payment-detail-heading">
                    Payment Details
                  </h4>
                  <div className="form-section">
                    <h3>Payment Method</h3>
                    {/* <div className="payment-methods">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="payment_method"
                          value="apple-pay"
                          checked={form.payment_method === "apple-pay"}
                          onChange={(e) => { handleChange(e); handleDigitalPayment("apple") }}
                        />
                        Apple Pay
                      </label>

                      <label className="radio-label">
                        <input
                          type="radio"
                          name="payment_method"
                          value="google-pay"
                          checked={form.payment_method === "google-pay"}
                          onChange={(e) => { handleChange(e); handleDigitalPayment("google") }}
                        />
                        Google Pay
                      </label>

                      <label className="radio-label">
                        <input
                          type="radio"
                          name="payment_method"
                          value="card"
                          checked={form.payment_method === "card"}
                          onChange={handleChange}
                        />
                        Card
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="payment_method"
                          value="paypal"
                          checked={form.payment_method === "paypal"}
                          onChange={(e) => { handleChange(e); handleDigitalPayment("paypal") }}
                        />
                        PayPal
                      </label>
                    </div> */}
                  </div>
                  {form.payment_method === "card" && (
                    <>
                      <div className="mb-3 position-relative">
                        <input
                          type="text"
                          className={`form-control ${errors.card_number ? "is-invalid" : ""}`}
                          placeholder="Card Number"
                          name="card_number"
                          value={form.card_number}
                          onChange={handleChange}
                        />
                        {/* Card Icons */}
                        <div className="card-icons">
                          <img src="https://img.icons8.com/color/48/visa.png" className={cardType === "visa" ? "active" : ""} alt="visa" />
                          <img src="https://img.icons8.com/color/48/mastercard.png" className={cardType === "mastercard" ? "active" : ""} alt="mastercard" />
                          <img src="https://img.icons8.com/color/48/amex.png" className={cardType === "amex" ? "active" : ""} alt="amex" />
                        </div>
                        {errors.card_number && (
                          <div className="invalid-feedback">
                            {errors.card_number}
                          </div>
                        )}
                      </div>

                      {/* Expiry + CVV */}
                      <div className="row mb-3">
                        <div className="col">
                          <input
                            type="text"
                            className={`form-control ${errors.expiry ? "is-invalid" : ""}`}
                            placeholder="Expiry MM/YY"
                            name="expiry"
                            value={form.expiry}
                            onChange={handleChange}
                          />
                          {errors.expiry && (
                            <div className="invalid-feedback">
                              {errors.expiry}
                            </div>
                          )}
                        </div>
                        <div className="col">
                          <input
                            maxLength={cardType === "amex" ? 4 : 3}
                            type="text"
                            className={`form-control ${errors.cvv ? "is-invalid" : ""}`}
                            placeholder="CVV"
                            name="cvv"
                            value={form.cvv}
                            onChange={handleChange}
                          />
                          {errors.cvv && (
                            <div className="invalid-feedback">{errors.cvv}</div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* PAYPAL */}
                  {form.payment_method === "paypal" && (
                    <div>
                      <div id="paypal-button-container" ref={paypalRef}></div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-lg-6">
            <div className="card shadow-sm order-summary-block">
              <div className="card-body">
                <h4 className="maim-lable card-title mb-3">Order Summary</h4>
                <div>
                  {(previewHtmls.length > 0 || previewImages.length > 0) && (
                    <div
                      ref={previewStageRef}
                      className="flipbook-wrapper d-flex flex-column align-items-center mb-3"
                    >
                      <>
                        <div className="navigation">
                          <button onClick={goPrev} className="next">
                            <i className="fa fa-arrow-left" aria-hidden="true"></i>
                          </button>

                          <button onClick={goNext} className="preview">
                            <i className="fa fa-arrow-right" aria-hidden="true"></i>
                          </button>
                        </div>
                        {/* key: page-flip relocates the page nodes out from under
                            React, so its children must never be reconciled in
                            place. If the source ever does change, this remounts
                            the whole component — React then removes only the root
                            div it still owns — instead of throwing NotFoundError
                            from removeChild. The source is also settled once in
                            apiCallDetail, so in practice this never fires. */}
                        <HTMLFlipBook
                          key={previewHtmls.length > 0 ? `html-${previewHtmls.length}` : `img-${previewImages.length}`}
                          width={200}
                          height={200}
                          className="flip-book"
                          showCover={true}
                          size="stretch"
                          {...({} as any)}
                          ref={flipBook}
                        >
                          {/* Server HTML first — it is the only source that
                              survives cleared browser storage. The cached rasters
                              remain for orders placed before order_html existed.
                              Same markup /order-detail renders; the trust level is
                              unchanged since our own editor generates it. */}
                          {previewHtmls.length > 0
                            ? previewHtmls.map((preview: any, index: any) => (
                              <div className="page" key={`page-${preview._id}-${index}`}>
                                <div
                                  className="checkout-flip-html"
                                  dangerouslySetInnerHTML={{ __html: preview.order_html }}
                                />
                              </div>
                            ))
                            : previewImages.map((preview: any, index: any) => (
                              <div className="page" key={`page-${preview.id}-${index}`}>
                                <img
                                  src={preview.imageUrl}
                                  alt={`Preview ${index}`}
                                  style={{ height: "100%" }}
                                  className="img-fluid border rounded"
                                />
                              </div>
                            ))}
                        </HTMLFlipBook>
                      </>
                    </div>
                  )}
                  <div className="d-flex justify-content-end mb-2 flip-customize-btn">

                    {/* { <button className="btn btn-secondary" onClick={() => navigate(`/element-editing?id=${id}`)}>
                      Edit
                    </button> */}

                  </div>
                  <div className="d-flex align-items-center mb-sm-3">
                    <div className="flex-grow-1">
                      <h3 className="album-title mb-0">
                        {orderDetail?.template_id?.template_name}
                      </h3>
                      <small>{orderDetail?.type?.name}</small>
                    </div>
                    <strong>${Number(orderDetail?.base_price || 0).toFixed(2)}</strong>
                  </div>
                  <div className="product-detail">
                    <div className="d-flex justify-content-between align-items-center qty-row">
                      <span>Quantity</span>
                      <div className="quantity-block">
                        <button
                          type="button"
                          className="qty-btn"
                          aria-label="Decrease quantity"
                          disabled={quantityBusy || quantity <= 1}
                          onClick={() => changeQuantity(quantity - 1)}
                        >
                          −
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="qty-input"
                          aria-label="Quantity"
                          value={quantity}
                          disabled={quantityBusy}
                          onChange={(e) => setQuantity(clampQuantity(e.target.value))}
                          // Typing is applied on blur/Enter rather than per keystroke
                          // so a half-typed number never reaches the server.
                          onBlur={(e) => changeQuantity(clampQuantity(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              changeQuantity(clampQuantity((e.target as HTMLInputElement).value));
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="qty-btn"
                          aria-label="Increase quantity"
                          disabled={quantityBusy || quantity >= MAX_QUANTITY}
                          onClick={() => changeQuantity(quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {quantity > 1 && (
                      <div className="d-flex justify-content-between">
                        <span>Price per book</span>
                        <span>
                          ${getUnitPrice().toFixed(2)} × {quantity} = $
                          {getLineSubtotal().toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between">
                      <span>Number of Pages</span>
                      <span>{orderDetail?.number_of_pages} Pages {orderDetail.extra_page ? '(+' + orderDetail.extra_page + ')' : ''}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Size</span>
                      <span>
                        {orderDetail?.size ? orderDetail?.size?.size_name : '—'} {orderDetail?.size ? `(+$${Number(orderDetail?.size?.price || 0).toFixed(2)})` : ''}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Cover Type</span>
                      <span>
                        {orderDetail?.cover_type?.cover_name || '—'} {orderDetail?.cover_type ? `(+$${Number(orderDetail?.cover_type?.price || 0).toFixed(2)})` : ''}
                      </span>
                    </div>
                    {/* <div className="d-flex justify-content-between">
                      <span>Paper Quality</span>
                      <span>
                        {orderDetail.paper_quality?.paper_name} (+$
                        {orderDetail.paper_quality?.price})
                      </span>
                    </div> */}
                  </div>
                </div>
                <hr />
                <div className="total-calculation">
                  <div className="d-flex justify-content-between">
                    <span>Subtotal</span>
                    <span>
                      ${Number(orderDetail?.sub_total_price || 0).toFixed(2)}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <>
                      <div className="d-flex justify-content-between text-success">
                        <span>
                          Coupon Discount (
                          {appliedCoupon.promotion_type.toUpperCase() == "PERCENTAGE"
                            ? appliedCoupon.price + "%"
                            : appliedCoupon.price}
                          )
                        </span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                      <hr className="mb-0" />
                      <div className="d-flex justify-content-between fw-bold fs-5">
                        <span>Total</span>
                        <span>
                          ${Number(orderDetail?.sub_total).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="d-flex justify-content-between">
                    <span>Tax ({tax ? tax.tax_value : 0}%)</span>
                    <span>${Number(tax?.tax_price || 0).toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Shipping Charge:</span>
                    <span>${selectedRate?.price || 0.00}</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold fs-5 mt-2">
                    <span>Grand Total</span>
                    <span>${getTotal()}</span>
                  </div>
                  {/* Add coupon input section */}
                  <div className="coupon-section mt-3">
                    <div className="input-group">
                      <input
                        type="text"
                        className={`form-control ${couponError ? "is-invalid" : ""
                          }`}
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                        disabled={discountAmount ? true : false}
                      />
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={applyCoupon}
                        disabled={discountAmount ? true : false}
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <div className="text-danger small mt-1">
                        {couponError}
                      </div>
                    )}
                    {appliedCoupon && (
                      <div className="text-success small mt-1">
                        Coupon applied successfully!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* ---- Terms & Conditions consent ----
             Sits between the order summary and Place Order. handleSubmit blocks
             the order until this is ticked, so the button stays enabled and the
             reason is announced rather than the control silently doing nothing. */}
            <div className={`terms-consent mt-3 ${termsError ? "has-error" : ""}`}>
              <label className="terms-consent-label" htmlFor="acceptTerms">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (e.target.checked) setTermsError(false);
                  }}
                  aria-describedby={termsError ? "termsError" : undefined}
                />
                <span>
                  I have read and agree to the{" "}
                  <a href="/terms/" target="_blank" rel="noopener noreferrer">
                    Terms &amp; Conditions
                  </a>
                </span>
              </label>
              {termsError && (
                <div id="termsError" className="terms-consent-error" role="alert">
                  Please accept the Terms &amp; Conditions to place your order.
                </div>
              )}
            </div>
            <div className="d-flex justify-content-end mt-3 checkout-submit-btn">
              <button className="btn btn-secondary" form="checkoutForm">
                Place Order
              </button>
            </div>
          </div>
        </div>



      </div>

      {/* Modal Backdrop */}
      {isShowCustomize && (
        <>
          <div className="modal-backdrop fade show"></div>

          <div
            className="modal fade show d-block checkout-popoup"
            id="Sign-in-modal"
            tabIndex={-1}
            aria-labelledby="Sign-in-modal-Label"
            aria-hidden="true"
            data-bs-backdrop="true"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="exampleModalLabel">
                    Customize Pages
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleClose}
                  >
                    <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/close-icon.png`} />
                  </button>
                </div>
                <div className=" modal-body">
                  {/* Size Options */}
                  <div className="form-group customize-size-selection">
                    <label className="form-label mb-3">Size</label>
                    <div className="size-options">
                      {pagesSizeOptions
                        .sort((a, b) => {
                          const getDimensions = (sizeName: string) => {
                            const normalized = sizeName.replace(/[×X]/g, "x"); // handle 12x12, 12X12, 12×12
                            const [w, h] = normalized.split("x").map((num) => parseFloat(num.trim()));
                            return [isNaN(w) ? 0 : w, isNaN(h) ? 0 : h];
                          };

                          const [aWidth, aHeight] = getDimensions(a.size_name);
                          const [bWidth, bHeight] = getDimensions(b.size_name);

                          const aMax = Math.max(aWidth, aHeight);
                          const bMax = Math.max(bWidth, bHeight);

                          if (aMax !== bMax) return aMax - bMax;
                          const aMin = Math.min(aWidth, aHeight);
                          const bMin = Math.min(bWidth, bHeight);
                          return aMin - bMin;
                        })

                        .map((size, index) => {
                          const { width, height } = parseSize(size.size_name);

                          // --- Adaptive Scaling ---
                          const maxDimension = Math.max(width, height);
                          const baseScale = 3; // Adjust this for desired visual scaling
                          const dynamicScale = maxDimension > 20 ? 12 : maxDimension > 10 ? 16 : maxDimension > 5 ? 18 : 12;
                          const scaledWidth = width * dynamicScale;
                          const scaledHeight = height * dynamicScale;
                          const imageStyle: any = {
                            width: `${scaledWidth}px`,
                            height: `${scaledHeight}px`,
                            borderRadius: "8px",
                            objectFit: "cover",
                            border: "1px solid #ccc",
                            backgroundColor: "#f8f9fa",
                            transition:
                              "transform 0.3s ease, box-shadow 0.3s ease",
                          };

                          return (
                            <div className="size-option-box">
                              <label
                                key={size._id + index}
                                className={`size-option ${size._id === pageSize ? "selected" : ""
                                  }`}
                              >
                                {size.size_badge_active && (
                                  <span className="ribbon red">
                                    <span>{size.size_badge}</span>
                                  </span>
                                )}

                                <img src={previewImages[0]?.imageUrl || templateImage}
                                  alt={size.size_name}
                                  style={imageStyle}
                                />

                                <input
                                  type="radio"
                                  name="size"
                                  value={size._id}
                                  checked={size._id === pageSize}
                                  onChange={(e) => {
                                    setSize(e.target.value);
                                    setSizeAmount(size.price);
                                    setsizePerPageAmount(size.per_page_price)
                                  }}
                                  hidden
                                />

                                <div className="size-option__name">
                                  {size.size_name}
                                </div>
                                <div className="size-option__price">
                                  ${size.price}
                                </div>
                              </label>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="form-group mt-3 mb-0">
                    <label>Cover Type</label>
                    <div className="cover-options">
                      {pagesCoversOptions.map((type) => (
                        <label
                          className={`cover-option ${coverType === type._id ? "selected" : ""
                            }`}
                          key={type._id}
                        >
                          {type.cover_badge_active && (
                            <span className="ribbon red">
                              <span>{type.cover_badge}</span>
                            </span>
                          )}

                          <img src={type.cover_image} alt="" />
                          <input
                            type="radio"
                            name="coverType"
                            value={type._id}
                            checked={coverType === type._id}
                            onChange={(e) => {
                              setCoverType(e.target.value);
                              setCoverAmount(type.price);
                            }}
                          />
                          <div className="cover-option__content">
                            <div className="cover-option__name">
                              {type.cover_name.charAt(0).toUpperCase() +
                                type.cover_name.slice(1)}
                            </div>
                            <div className="cover-option__desc">
                              {type.desc}
                            </div>
                            <div className="cover-option__price">
                              +${type.price}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer mt-0 p-2">
                  <button className="custom-btn" onClick={saveCustomize}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

/**
 * useSearchParams() suspends during the static export's prerender, so it needs a
 * Suspense boundary. It lives here rather than in main-layout.tsx: a boundary at
 * layout level applies to every route, and React marks any boundary as pending
 * once its HTML passes ~12.8 KB — which made the big pages ship an empty <main>
 * and register as a large layout shift.
 */
export default function CheckoutPageRoute() {
  return (
    <Suspense fallback={null}>
      <CheckoutPage />
    </Suspense>
  );
}
