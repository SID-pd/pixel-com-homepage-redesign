import React, { useState, useEffect } from "react";
import { apiPost } from "../app/api/service/api-service";
import { toastError, toastSuccess, toastWarning, toastConfirm } from "../app/api/service/common";
import { useLoader } from "../app/context/LoaderContext";
import { useUser } from "../app/context/UserContext";
import { get } from "../app/api/service/storage";
import { useRouter } from "next/navigation";
import { FiBookOpen, FiCopy, FiBook, FiArrowRight } from "react-icons/fi";


const coverOptions = [
  {
    _id: "69b26242ff6f88df5f41340e",
    template_id: "default",
    cover_name: "Hardcover",
    desc: "Hardcover",
    cover_badge: "most seller",
    cover_badge_active: false,
    price: 7.0,
    spine: 0.289,
    cover_image: "",
    sku: "HC",
    is_delete: 0,
    created_at: "",
    updated_at: ""
  },
  {
    _id: "69b26242ff6f88df5f41340d",
    template_id: "default",
    cover_name: "Softcover",
    desc: "Softcover",
    cover_badge: "most popular",
    cover_badge_active: true,
    price: 0,
    spine: 0.039,
    cover_image: "",
    sku: "SC",
    is_delete: 0,
    created_at: "",
    updated_at: ""
  },

];

// Normalize "10 X 10" / "10x10" / "10×10" → "10x10" so the home cards
// (which use "8x8"/"10x10"/"12x12") match the API size_name ("10 X 10").
const normalizeSizeName = (name: string) =>
  (name || "").replace(/[×xX]/g, "x").replace(/\s+/g, "").toLowerCase();

interface Step1Props {
  onContinue: (selectedId: string) => void;
  initialSize?: string | null;
}

const Step1: React.FC<Step1Props> = ({ onContinue, initialSize }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateData, setTemplateData] = useState<any>([]);
  const [pagesSize, setPagesSize] = useState<any>([]);
  const { showLoader, hideLoader } = useLoader();
  const [closeModal, setCloseModal] = useState(false);
  const [cover, setCovers] = useState<any[]>([]);
  const [pagesOptions, setPagesOptions] = useState<number[]>([]);
  const [cartCount, setCartCount] = useState<string | null>(null);
  let [pages, setPages] = useState<any>(null);
  let [size, setSize] = useState<any>(null);
  const { user, countCart } = useUser();
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedCover, setSelectedCover] = useState<any>(
    coverOptions.find(c => c.cover_name === "Hardcover")
  );



  useEffect(() => {
    fetchData();
    // setTemplateData([
    //   {
    //     _id: 1,
    //     image: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/10x10-inches-photobook.png`,
    //     template_name: 'Test 1',
    //     type: {
    //       name: "Shortcover"
    //     }
    //   },
    //   {
    //     _id: 2,
    //     image: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/10x10-inches-photobook.png`,
    //     template_name: 'Test 1',
    //     type: {
    //       name: "Shortcover"
    //     }
    //   },
    //   {
    //     _id: 3,
    //     image: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/10x10-inches-photobook.png`,
    //     template_name: 'Test 1',
    //     type: {
    //       name: "Shortcover"
    //     }
    //   },
    //   {
    //     _id: 4,
    //     image: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/10x10-inches-photobook.png`,
    //     template_name: 'Test 1',
    //     type: {
    //       name: "Shortcover"
    //     }
    //   }
    // ]);
  }, []);

  const parseSize = (sizeName: string) => {
    // Replace any kind of x or × with lowercase x
    const normalized = sizeName.replace(/[×X]/g, "x");
    const [w, h] = normalized.split("x").map(Number);
    return { width: w, height: h };
  };

  const fetchData = async () => {
    showLoader();
    try {
      const response: any = await apiPost<any>("template/list", {
        page: 1,
        limit: 10,
        search: "",
      });
      if (response.status) {
        const templates = response.data.records || [];
        setTemplateData(templates);
        if (templates.length > 0) {
          setPagesSize(templates[0].sizes)
          // Prefer the size requested via ?size= (from the home cards),
          // else fall back to 10 X 10, else the first available size.
          const wanted = initialSize ? normalizeSizeName(initialSize) : null;
          const requestedSize = wanted
            ? templates[0].sizes.find((s: any) => normalizeSizeName(s.size_name) === wanted)
            : null;
          const defaultSize =
            requestedSize ||
            templates[0].sizes.find((s: any) => s.size_name === "10 X 10");

          setSize(defaultSize || templates[0].sizes[0]);
          const defaultTemplate = templates[0];
          setSelectedId(defaultTemplate._id);
          const step = 20;
          const pagesArray: number[] = [];
          for (let i = defaultTemplate.min_page; i <= defaultTemplate.max_page; i += step) {
            pagesArray.push(i);
          }
          setPages(defaultTemplate.min_page);
          setPagesOptions(Array.from(new Set(pagesArray)));
          setCloseModal(true);
        }
      } else {
        toastError(response.message);
        console.log("Template fetch error");
      }
    } catch (error: any) {
      toastError(error.message || "Something went wrong");
      console.log("Template fetch error:", error);
    } finally {
      hideLoader();
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const matchedObject = templateData.find((t: any) => t._id === id);
    if (!matchedObject) return;

    const step = 20;
    const pagesArray: number[] = [];
    for (let i = matchedObject.min_page; i <= matchedObject.max_page; i += step) {
      pagesArray.push(i);
    }
    console.log("matchedObject", matchedObject);

    const wanted = initialSize ? normalizeSizeName(initialSize) : null;
    const requestedSize = wanted
      ? matchedObject.sizes.find((s: any) => normalizeSizeName(s.size_name) === wanted)
      : null;
    const defaultSize =
      requestedSize ||
      matchedObject.sizes.find((s: any) => s.size_name === "10 X 10");
    setPagesSize(matchedObject.sizes)
    setCovers(matchedObject.covers);
    const defaultHardCover = coverOptions.find((c) => c.cover_name === "Hardcover");

    setSelectedCover(defaultHardCover || matchedObject.covers?.[0] || null);

    setSize(defaultSize || matchedObject.sizes[0])

    setPages(matchedObject.min_page);
    setPagesOptions(Array.from(new Set(pagesArray)));
    setCloseModal(true);
  };

  const handleContinue = async () => {
    // add cover type on local storage
    // localStorage.setItem("cover_type", cover || "SoftCover");

    // let storedUser = get<any>("user");
    // if (storedUser) {
    //   if (countCart) {
    //     let isConfirmed: any = false;
    //     isConfirmed = await toastConfirm(
    //       `You already have ${countCart} pending order in your cart. Please complete or remove it before proceeding.`,
    //       "Go to cart",
    //       null,
    //       "Pending Order in Cart"
    //     );

    //     if (isConfirmed) {
    //       router.push("/cart");
    //     }
    //     return
    //   }
    // }


    if (!selectedId) {
      toastWarning("Please select a template before continuing.");
      return;
    }

    const formData = new FormData();
    formData.append("id", selectedId);
    const response: any = await apiPost<any>("template/detail", formData);

    if (response.status) {
      const data = response.data;

      const minPages = data.min_page;
      const basePrice = data.base_price;

      const pageMultiplier = pages / minPages;
      const pagePrice = basePrice * pageMultiplier;

      let formdata = {
        templateId: selectedId,
        card_size_type: data.type,
        category: data.category,
        number_of_pages: pages,
        page_size: size,
        // page_size: data.sizes[0],
        cover_type: selectedCover,
        paper_quality: data.papers[0],
        base_price: data.base_price.toFixed(2),
        total_price: (
          pagePrice +
          selectedCover.price +
          // data.covers[0].price +
          data.papers[0].price
        ).toFixed(2),
        marriageDetails: {},
        min_page: data.min_page,
        max_page: data.max_page
      };

      console.log("formdata", formdata);
      let storedUser = get<any>("user");
      if (!storedUser) {
        let temp_id = localStorage.getItem("temp_id") || "";
        if (!temp_id) {
          const formData = new FormData();
          formData.append("image_type", "guest");
          const res = await apiPost<any>("guest-register", formData);
          if (res.status) {
            localStorage.setItem("temp_id", res.data.id);
            localStorage.setItem("customize_data", JSON.stringify(formdata));
            onContinue(selectedId);
          } else {
            toastError(res.message);
          }
        } else {
          await apiPost<any>("image/clear-user-library", { user_id: temp_id }).catch((e) =>
            console.error("Failed to clear image library:", e)
          );
          localStorage.setItem("customize_data", JSON.stringify(formdata));
          onContinue(selectedId);
        }
      } else {
        await apiPost<any>("image/clear-user-library", { user_id: storedUser._id }).catch((e) =>
          console.error("Failed to clear image library:", e)
        );
        localStorage.setItem("customize_data", JSON.stringify(formdata));
        onContinue(selectedId);
      }
    } else {
      toastError(response.message);
    }
  };

  const handleClose = () => {
    setCloseModal(false);
  };


  console.log("size", size);
  const setCoverType = (coverType: string) => {
    // toastWarning("Cover type selection is not implemented yet.");
    // setCover(coverType);
    // console.log("Selected cover type:", coverType);
  }

  return (
    <>
      <div className="p-book-step-content step-1">
        {closeModal && (
          <>
            {/* ---- Choose Your Book Size ---- */}
            <div className="pb-card">
              <div className="pb-card-head">
                <span className="pb-card-icon pink">
                  <FiBookOpen />
                </span>
                <h3>Choose Your Book Size</h3>
              </div>
              <h4 className="pb-card-sub">Pages Size (Select Size)</h4>
              <div className="d-desktop">
                <div className="row justify-content-around align-items-center">
                  {pagesSize.sort((a: any, b: any) => {
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
                  }).map((page: any, index: any) => {
                    const { width, height } = parseSize(page.size_name);

                    // --- Adaptive Scaling ---
                    const maxDimension = Math.max(width, height);
                    const baseScale = 3; // Adjust this for desired visual scaling
                    const dynamicScale = maxDimension > 20 ? 12 : maxDimension > 10 ? 16 : maxDimension > 5 ? 18 : 12;
                    const scaledSize = maxDimension * dynamicScale;
                    const imageStyle: any = {
                      width: `${scaledSize}px`,
                      height: `${scaledSize}px`,
                      maxWidth: "none",
                      aspectRatio: "1 / 1",
                      borderRadius: "8px",
                      objectFit: "cover",
                      border: "1px solid #e3dccd",
                      backgroundColor: "#ffffff",
                      transition:
                        "transform 0.3s ease, box-shadow 0.3s ease",
                    };
                    return (
                      <div className="col-lg-2 p-1 " key={index}>
                        <img src="/images/choose_your_size_1.webp"
                          alt={page.size_name}
                          width={1254}
                          height={1254}
                          // loading="lazy"
                          fetchPriority="high"
                          // decoding="async"
                          style={imageStyle}
                          onClick={() => setSize(page)}
                        />
                        <br />
                        <input
                          type="radio"
                          name="size_name"
                          id={`size-id-${index}`}
                          onChange={() => setSize(page)}
                          checked={size === page}
                        />{" "}
                        <label htmlFor={`size-id-${index}`}>{page.size_name}</label>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="d-mobile">
                <select
                  className="form-control"
                  value={size?._id || ""}
                  onChange={(e) => {
                    const selected = pagesSize.find((p: any) => p._id === e.target.value);
                    setSize(selected);
                  }}
                >
                  {pagesSize.map((page: any, index: any) => (
                    <option key={index} value={page._id}>
                      {page.size_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ---- Number of Pages ---- */}
            <div className="pb-card">
              <div className="pb-card-head">
                <span className="pb-card-icon green">
                  <FiCopy />
                </span>
                <h3>Number of Pages</h3>
              </div>
              <h4 className="pb-card-sub">Number of Pages (Select Pages)</h4>
              <div className="d-desktop">
                <div className="row">
                  {pagesOptions.map((page, index) => (
                    <div className="col-lg-2 p-1" key={index}>
                      <input
                        type="radio"
                        name="page_name"
                        id={`pages-id-${index}`}
                        onChange={() => setPages(page)}
                        checked={pages === page}
                      />{" "}
                      <label htmlFor={`pages-id-${index}`}>{page} Page</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="d-mobile">
                <select
                  className="form-control"
                  value={pages || ""}
                  onChange={(e) => setPages(Number(e.target.value))}
                >
                  {pagesOptions.map((page, index) => (
                    <option key={index} value={page}>
                      {page} 
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ---- Cover Types ---- */}
            <div className="pb-card">
              <div className="pb-card-head">
                <span className="pb-card-icon blue">
                  <FiBook />
                </span>
                <h3>Cover Types</h3>
              </div>
              <h4 className="pb-card-sub">Cover Types (Select Cover)</h4>
              <div className="d-desktop">
                <div className="row">
                  {coverOptions.map((cover: any, index: any) => (
                    <div className="col-lg-2 p-1" key={index}>
                      <input
                        type="radio"
                        name="cover_name"
                        id={`cover-id-${index}`}
                        onChange={() => setSelectedCover(cover)}
                        checked={selectedCover?._id === cover._id}
                      />{" "}
                      <label htmlFor={`cover-id-${index}`}>
                        {cover.cover_name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="d-mobile">
                <select
                  className="form-control"
                  value={selectedCover?._id}
                  onChange={(e) => {
                    const selected = coverOptions.find(c => c._id === e.target.value);
                    setSelectedCover(selected);
                  }}>
                  {coverOptions.map((cover: any, index: any) => (
                    <option key={index} value={cover._id}>
                      {cover.cover_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        <button className="btn btn-secondary mt-4 pb-continue" onClick={handleContinue}>
          Continue <FiArrowRight />
        </button>
      </div>
    </>
  );
};

export default Step1;

