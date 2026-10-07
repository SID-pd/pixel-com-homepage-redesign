"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import Bgcolor from "./bgcolor/bgcolor";
import Stickers from "./stickers/stickers";
import FontSize from "./font-size/font-size";
import FontFamily from "./font-family/font-family";
import TextColor from "./text-color/text-color";
import Scale from "./scale/scale";
import Rotation from "./rotation/rotation";
import ImageLayout from "./ImageLayout/ImageLayout";
import Swal from "sweetalert2";
import HTMLFlipBook from 'react-pageflip';
// fa-* icons used heavily on this route — see the note in app/layout.tsx.
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./element-editing-tool.css";
import { apiPost } from "../api/service/api-service";
import { get, removeEncrypted } from "../api/service/storage";
import { ensureGuestUser } from "../api/service/guest";
import { toastWarning, toastError, toastSuccess, toastConfirm, toastHtmlConfirm } from "../api/service/common";
import { savePDF, saveAlbum, clearAlbums, getAlbum } from "../api/service/pdf-storage";
import { useRouter } from "next/navigation";
import { useModal } from "@/app/context/ModalContext";
import { useUser } from "../context/UserContext";
import { useSearchParams } from "next/navigation";

/**
 * Heavy editor-only libraries, kept out of the route's initial chunk.
 *
 * DraggableCanvas is prop-only, so next/dynamic is safe and it takes
 * react-dnd + react-dnd-html5-backend with it.
 *
 * react-pageflip stays a static import on purpose: <HTMLFlipBook> is driven by
 * ref={flipBook} and next/dynamic does not forward refs, so lazy-loading it
 * would silently break page-turn control.
 */
const DraggableCanvas = dynamic(() => import("./arrange-pages/arrange-pages"), {
  ssr: false,
});

const loadHtml2Canvas = () => import("html2canvas").then((m) => m.default);
const loadJSZip = () => import("jszip").then((m) => m.default);
const loadEmojiPicker = async () => {
  const [{ Picker }, { default: data }] = await Promise.all([
    import("emoji-mart"),
    import("@emoji-mart/data"),
  ]);
  return { Picker, data };
};

/**
 * Last line of defence before an album is saved to an order.
 *
 * `blob:` URLs come from URL.createObjectURL and only resolve inside the
 * document that created them — they cannot be fetched by a server or a fresh
 * browser context. If one reaches `card_data` / `card_html` it is stored with
 * the order and the print renderer produces a BLANK page for it, with no error
 * anywhere in the pipeline. (This happened in production: one order was saved
 * with 31 blob URLs and printed empty.)
 *
 * The upstream causes are fixed, but this guard means a regression surfaces as
 * a message the customer can act on instead of a silently ruined book.
 */
const containsBlobUrl = (...payloads: unknown[]): boolean =>
  payloads.some((payload) => {
    try {
      return JSON.stringify(payload ?? null)?.includes("blob:") ?? false;
    } catch {
      // Circular/unserialisable payload — the real JSON.stringify below would
      // throw too, so let that surface rather than blocking here.
      return false;
    }
  });

const BLOB_IN_ORDER_MESSAGE =
  "Some photos didn't finish uploading. Please remove and re-add them, then try again.";

// Type definitions
interface ElementObject {
  id: string;
  type:
  | "text"
  | "layoutText"
  | "image"
  | "shape"
  | "emoji"
  | "sticker"
  | "video"
  | "audio"
  | "handwriting-background";
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  selected: boolean;
  locked: boolean;
  editable: boolean;
  data?: any;
  clipPath?: string;
  shapeImage?: any;
  containerShape?: any;
  zIndex?: number;
  originalData?: any;
}

interface ElementTextObject extends ElementObject {
  type: "text" | "layoutText";
  data: {
    text: string;
    fontSize: number;
    fontFamily: string;
    fontFamilyName?: any;
    fill: string;
    textAlign: "left" | "center" | "right";
    textColor?: string;
    stroke?: string;
    strokeWidth?: number;
  };
  originalData?: any;
}

interface ElementImageObject extends ElementObject {
  type: "image";
  data: {
    src: string;
    preserveAspectRatio: string;
    coverCanvas?: boolean;
    image_date?: any;
    imageHeight?: any;
    imageWidth?: any;
    objectPosition?: string;
  };
  containerShape?: string;
  originalData?: any;
}

interface ElementShapeObject extends ElementObject {
  type: "shape";
  data: {
    shapeType: "square" | "circle" | "rectangle";
    fill: string;
    stroke: string;
    strokeWidth: number;
    strokeDashArray?: string;
  };
  shapeImage?: {};
  originalData?: any;
}

const BLEED_PX = 12;




const ElementEditingTool = (props: { params: Promise<{ id: string }> }) => {
  const { id } = React.use(props.params);
  const { openSignIn } = useModal();

  //===// State management //===//
  const [loading, setLoading] = useState(false);
  const [firstLoading, setFirstLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  //===// Canvas properties //===//
  // const [canvasWidth] = useState(567);
  // const [canvasHeight] = useState(350);

  let [canvasWidth, setCanvasWidth] = useState(600);
  let [canvasHeight, setCanvasHeight] = useState(400);

  const [canvasPrevieWidth, setCanvasPreviewWidth] = useState(120);
  const [canvasPrevieHeight, setCanvasPreviewHeight] = useState(120);
  const [canvasActiveIndex, setCanvasActiveIndex] = useState<any>(0);
  let [canvasObjects, setCanvasObjects] = useState<ElementObject[][]>([[], [],]);
  const [canvasBackgrounds, setCanvasBackgrounds] = useState(["white", "white",]);
  const [selectedObject, setSelectedObject] = useState<ElementObject | any>(null);

  //===// Interaction states //===//
  const [isDragging, setIsDragging] = useState(false);
  const [isShapeImageDragging, setIsShapeImageDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<any>({ x: 0, y: 0 });
  const [dragStartObjPos, setDragStartObjPos] = useState({ x: 0, y: 0 });
  // inside your component
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: any; height: any; } | null>(null);
  const [resizeHandle, setResizeHandle] = useState("");
  const [rotationStartAngle, setRotationStartAngle] = useState(0);

  //===// Text editing //===//
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [originalTextValue, setOriginalTextValue] = useState("");

  //===// UI panels //===//
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [showImageLibraryPanel, setShowImageLibraryPanel] = useState(false);
  const [showLayoutPanel, setShowLayoutPanel] = useState(false);
  const [showAdditionalPanel, setShowAdditionalPanel] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showEmojiChildPanel, setShowEmojiChildPanel] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [showStickerChildPanel, setShowStickerChildPanel] = useState(false);
  const [showBgColorPanel, setShowBgColorPanel] = useState(false);
  const [showArrangePagesPanel, setArrangePagesPanel] = useState(false);
  const [showTextSizePanel, setShowTextSizePanel] = useState(false);
  const [showTextFontPanel, setShowTextFontPanel] = useState(false);
  const [showTextColorPanel, setShowTextColorPanel] = useState(false);
  const [showScalePanel, setShowScalePanel] = useState(false);
  const [showRotationPanel, setShowRotationPanel] = useState(false);
  const [showImageLayout, setShowImageLayout] = useState(false);
  const [showDatesPanel, setShowDatesPanel] = useState(false);
  const [showShapesLibraryPanel, setShowShapesLibraryPanel] = useState(false);
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [showHandwritingPanel, setShowHandwritingPanel] = useState(false);
  const [copiedObject, setCopiedObject] = useState<any>(null);

  //===// Selection properties //===//
  const [selectedSize, setSelectedSize] = useState(40);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedBgColor, setSelectedBgColor] = useState("#FFFFFF");
  const [selectedFontFamily, setSelectedFontFamily] = useState({ fontFamily: "Arial" });
  const [selectedAngle, setSelectedAngle] = useState(0);
  const [selectedScale, setSelectedScale] = useState(1.0);
  const [selectedType, setSelectedType] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [elementsList, setElementsList] = useState<{ id: string; type: string; name: string }[]>([]);

  //===// Shape image container mode //===//
  const [isShapeImageMode, setIsShapeImageMode] = useState(false);

  //===// Preview and UI //===//
  const [mainToolsLeft, setMainToolsLeft] = useState("20px");
  let [mainObject, setMainObject] = useState<any>([]);
  const [previewCartId, setpreviewCartId] = useState<any>(null);
  const [isShowEditing, setShowEditing] = useState(false);

  //===// Video/Audio states //===//
  const [uploadingProcess, setUploadingProcess] = useState(false);
  const [videoSize, setVideoSize] = useState<number | null>(null);
  const [videoDuration, setVideoDuration] = useState<string | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [showAudioPreview, setShowAudioPreview] = useState(false);
  const [audioSize, setAudioSize] = useState<number | null>(null);
  const [audioDuration, setAudioDuration] = useState<string | null>(null);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  let [previewImages, setPreviewImages] = useState<any>([]);
  const [isOpen, setIsOpen] = useState(false);
  let [previewLoadImages, setPreviewLoadImages] = useState<any>([]);
  let [previewImagesFile, setpreviewImagesFile] = useState<any>([]);
  let [cardHtml, setcardHtml] = useState<any>([]);
  let [cardArrayData, setcardData] = useState<any>([]);
  const [preventScroll, setPreventScroll] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  //===// History for undo/redo //===//
  const [historyStack, setHistoryStack] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [pageHistoryStacks, setPageHistoryStacks] = useState<Record<number, any[]>>({});
  const [pageHistoryIndices, setPageHistoryIndices] = useState<Record<number, number>>({});
  const [maxHistorySize] = useState(50);
  const [isUndoRedoOperation, setIsUndoRedoOperation] = useState(false);
  const [isAIprocces, setAIprocces] = useState(false);
  const [svaImageIds, setvaImageIds] = useState<any[]>([]);
  const [format, setFormat] = useState("MMMM DD, YYYY"); // default: August 20, 2020
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  let [apiImages, setApiImages] = useState<any[]>([]);

  //===// Refs //===//
  const filesRef = useRef<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardPreviewRef = useRef<(HTMLDivElement | null)[]>([]);
  const previewWindowRef = useRef<HTMLDivElement>(null);
  const editingToolWindowRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const previewUpdateTimeoutRef = useRef<any | null>(null);
  const flipBook = useRef<any>(null);
  const router = useRouter();
  // const [currentIndex, setCurrentIndex] = useState(0);
  // const maxIndex = 101;
  const [progress, setProgress] = React.useState(0);
  const [isPrepareBook, setPrepareBook] = useState(false);;
  const layerOptions: any[] = [
    { value: "bring-forward", label: "Bring forward", icon: "/img/bring-to-front.svg" },
    { value: "bring-to-front", label: "Bring to front", icon: "/img/bring-forward.svg" },
    { value: "send-to-back", label: "Send to back", icon: "/img/send-to-back.svg" },
    { value: "send-backward", label: "Send backward", icon: "/img/send-backward.svg" },
  ];
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split("T")[0];
  const [userData, setUserData]: any = useState({})
  const { user, setUser } = useUser();
  const lastTapRef = useRef<number | null>(null);
  const searchParams = useSearchParams();
  let orderId: any = searchParams.get("id");
  // Set by the Pixie chat widget when it hands off a freshly-uploaded,
  // auto-designed album — see src/Components/AIOrderChat/buildAlbum.ts.
  const source = searchParams.get("source");
  const [openChat, setOpenChat] = useState(false);
  const [extrapage, setExtrapage] = useState<any>(0);

  useEffect(() => {
    const user = get<any>("user");
    setUserData(user);
  }, [user])

  useEffect(() => {
    fetchImages();
    observeResolution();
    saveHistory();

    //===// Cleanup on unmount //===//
    return () => {
      if (previewUpdateTimeoutRef.current) {
        clearTimeout(previewUpdateTimeoutRef.current);
      }
    };
  }, []);

  //===// Flag "the editing canvas is showing" on <body> so page-level chrome that
  //===// lives OUTSIDE this component's DOM subtree can react to it. Currently used
  //===// to hide the floating Pixie chat launcher on mobile, where it is painted on
  //===// top of the fixed bottom toolbar and blocks its tools (see the
  //===// body.editor-canvas-mode rule in AIOrderChat.module.css). Preview mode keeps
  //===// the launcher, so the class is removed the moment previewMode flips on.
  //===// The unmount cleanup matters: without it the class would leak to other
  //===// routes and hide the launcher site-wide after leaving the editor.
  useEffect(() => {
    document.body.classList.toggle("editor-canvas-mode", !previewMode);
    return () => document.body.classList.remove("editor-canvas-mode");
  }, [previewMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      //==// Copy (Ctrl+C or Cmd+C) //==//
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        const selectedObj = mainObject.find((obj: any) => obj.selected);
        if (selectedObj) {
          setCopiedObject({ ...selectedObj, id: Date.now() });
        }
      }

      //==// Paste (Ctrl+V or Cmd+V) //==//
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        if (copiedObject) {
          const newObj = {
            ...copiedObject,
            id: `image-${Date.now()}-${Math.random()}`,
            x: copiedObject.x + 20,
            y: copiedObject.y + 20,
            selected: true,
          };

          selectObject(newObj, { stopPropagation: () => { } } as React.MouseEvent, 0);
          setMainObject((updatedObjects: any) => [...updatedObjects, newObj]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mainObject, copiedObject]);

  useEffect(() => {
    const preventTouchMove = (e: TouchEvent) => {
      if (preventScroll && e.cancelable) {
        e.preventDefault();
      }
    };

    if (preventScroll) {
      document.body.style.overflow = "hidden";
      document.addEventListener("touchmove", preventTouchMove, { passive: false });
    } else {
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", preventTouchMove);
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", preventTouchMove);
    };
  }, [preventScroll]);

  useEffect(() => {
    const updateSize = () => {
      const size = getCanvasSize();
      canvasWidth = size.width
      setCanvasWidth(canvasWidth);
      canvasHeight = size.height
      setCanvasHeight(canvasHeight);
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const getCanvasSize = () => {
    if (typeof window === "undefined") return { width: 600, height: 400 };

    const storedData = localStorage.getItem("customize_data");
    const storedPages = storedData ? JSON.parse(storedData) : { card_size_type: { name: "Square" } };
    const width = window.innerWidth;
    const isSquare = storedPages.card_size_type.name === "Square";

    if (width < 640) {
      //==// Mobile //==//
      const mobileWidth = Math.min(width - 40, 350);
      return {
        width: isSquare ? Math.min(mobileWidth, 300) : mobileWidth,
        height: isSquare ? Math.min(mobileWidth, 300) : 250
      };
    } else if (width < 1024) {
      //==// Tablet //==//
      return {
        width: isSquare ? 400 : 400,
        height: isSquare ? 400 : 400
      };
    } else {
      //==// Desktop //==//
      return {
        width: isSquare ? 400 : 400,
        height: 400
      };
    }
  };


  const apiCallDetail = async (id: any) => {
    try {
      const formData = new FormData();
      formData.append("id", id);
      const res = await apiPost<any>("order/detail", formData);
      if (res.status && res.data) {
        let data = [];
        for (let index = 0; index < res.data.order_htmls.length; index++) {
          const element = JSON.parse(res.data.order_htmls[index].order_arrayData);
          data.push(element);
        }
        let formdata = {
          templateId: res.data.template_id._id,
          card_size_type: res.data.type,
          category: res.data.category,
          number_of_pages: res.data.number_of_pages,
          page_size: res.data.size,
          cover_type: res.data.cover_type,
          paper_quality: res.data.paper_quality,
          total_price: res.data.total_price,
          base_price: res.data.base_price,
          marriageDetails: null,
          min_page: res.data.template_id?.min_page,
          max_page: res.data.template_id?.max_page
        }

        localStorage.setItem('customize_data', JSON.stringify(formdata))
        const size = getCanvasSize();
        canvasWidth = size.width
        setCanvasWidth(canvasWidth);
        canvasHeight = size.height
        setCanvasHeight(canvasHeight);
        const allOriginalData = data[0].filter((item: any) => Array.isArray(item.originalData)).flatMap((item: any) => item.originalData);
        const uniqueOriginalData = allOriginalData.filter((obj: any, index: number, self: any) => index === self.findIndex((o: any) => o.id === obj.id));
        setMainObject(uniqueOriginalData);
        setCanvasObjects(data);
      }
    } catch (error) {
      console.error("API Error:", error);
    }
  }

  const fetchImages = async () => {
    setFirstLoading(true);
    try {
      //==//===// Call API (GET or POST depending on backend) //==//
      let storedUser = get<any>("user");
      let temp_id = localStorage.getItem('temp_id') || '';
      const res = await apiPost<any>("image/list", { isLowQuality: 0, user_id: storedUser ? storedUser._id : temp_id });
      if (res.status && Array.isArray(res.data.records)) {
        apiImages = res.data.records.map((item: any) => ({
          id: item._id || crypto.randomUUID(),
          image_date: item.image_date ? new Date(item.image_date) : null,
          src: item.image_compressed,
          // src: item.image,
          imageHeight: item.height,
          imageWidth: item.width,
        }));

        // image/list has no per-order scoping on the backend — it returns the
        // guest/user's ENTIRE photo library. When Pixie hands off a freshly
        // built album, scope the canvas to just the photos it just uploaded
        // (see chat_image_ids in AIOrderChat/buildAlbum.ts) so older photos
        // from a previous session don't leak into this album.
        if (!orderId && source === "chat") {
          const storedRaw = localStorage.getItem("customize_data");
          const chatImageIds: string[] = storedRaw ? JSON.parse(storedRaw)?.chat_image_ids || [] : [];
          if (chatImageIds.length) {
            const idSet = new Set(chatImageIds);
            const scoped = apiImages.filter((img: any) => idSet.has(img.id));
            if (scoped.length) apiImages = scoped;
          }
        }

        setApiImages([...apiImages])
        if (orderId) {
          await apiCallDetail(orderId);
        } else {
          await loadImagesToCanvas();
          if (source === "chat") {
            // loadImagesToCanvas() clears the loading overlay at its own end;
            // keep it up through the handoff below instead of letting it flash off.
            setFirstLoading(true);
            // Let the freshly-populated pages actually paint before we
            // snapshot them for the auto-save below.
            await new Promise((resolve) => setTimeout(resolve, 300));
            await autoSaveAndEnterPreview();
          }
        }
        setUploadedImages(apiImages);
        setTimeout(() => {
          setSelectedObject(null)
        }, 50);

        setTimeout(() => {
          if (!pageHistoryStacks[0]) {
            console.log("📝 Initializing history for page 0");
            saveHistory();
          }
        }, 500);
      } else {
        loadImagesToCanvas();
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
      toastError("Failed to fetch images:" + err)
    } finally {
      setFirstLoading(false);
    }
  };

  const loadImagesToCanvas = async () => {
    const storedPages = JSON.parse(localStorage.getItem("customize_data") || '{}');
    const totalPages = storedPages?.number_of_pages ? parseInt(storedPages.number_of_pages) + 2 : 2;

    setCanvasWidth(canvasWidth);
    setCanvasHeight(canvasHeight);

    //==// Initialize canvasBackgrounds //==//
    setCanvasBackgrounds(Array.from({ length: totalPages }, () => "white"));

    //==// Initialize empty canvasObjects //==//
    const newCanvasObjects = Array.from({ length: totalPages }, () => []);
    canvasObjects = newCanvasObjects;
    setCanvasObjects(canvasObjects);

    //==// Loop through data and add images //==//
    if (newCanvasObjects.length == totalPages) {


      //==// Generate pages of images (2-4 images per page) sorted by size descending //==//
      let pages = generateImagePages(apiImages, totalPages);
      const lastPageIdx = totalPages - 1;
      const isCoverIndex = (i: number) => i === 0 || i === lastPageIdx;

      const loadImagesRecursive = async (
        images: any,
        index = 0,
        start = 0,
        totalPages = 22
      ): Promise<void> => {
        if (index >= totalPages) return;

        if (images.length >= totalPages) {
          if (isCoverIndex(index) && index < pages.length && pages[index][0]) {
            const coverImg = pages[index][0];
            await addBgImage(coverImg, "image", index, storedPages, coverImg.id, true, true);
          } else if (index < pages.length && pages[index].length > 0) {
            const collageSet = pages[index];
            await addCollageImages(collageSet, index, storedPages, true);
          }

          return loadImagesRecursive(
            images,
            index + 1,
            start + (pages[index]?.length || 0),
            totalPages
          );
        } else {
          if (index === 0) {
            if (images.length >= 1) {
              const img = images[0];
              await addBgImage(img, "image", 0, storedPages, img.id, true, true);
            }
            return loadImagesRecursive(images, 1, 1, totalPages);
          }

          if (index === lastPageIdx) {
            if (images.length >= 2) {
              const img = images[images.length - 1];
              await addBgImage(img, "image", lastPageIdx, storedPages, img.id, true, true);
            }
            return loadImagesRecursive(images, index + 1, start, totalPages);
          }

          const middleAvailable = Math.max(0, images.length - 1);
          const reservedForBack = images.length >= 2 ? 1 : 0;
          const middleEnd = 1 + (middleAvailable - reservedForBack);

          if (start < middleEnd && start < images.length - reservedForBack) {
            const img = images[start];
            let data = generateImageSinglePages(img, index);
            await addBgImage(data.image, "image", index, storedPages, img.id, true);
            return loadImagesRecursive(images, index + 1, start + 1, totalPages);
          }

          return loadImagesRecursive(images, index + 1, start, totalPages);
        }
      };

      await loadImagesRecursive(apiImages, 0, 0, totalPages);

      setCanvasObjects([...canvasObjects]);
      setMainObject([...mainObject]);


      // const loadImagesRecursive = async (images: any[], index: number = 0, start: number = 0
      // ): Promise<void> => {
      //   if (start >= images.length || index >= totalPages) return;
      //   const img = images[start];
      //   await addBgImage(img.src, "image", index, storedPages, img.id);

      //   return loadImagesRecursive(images, index + 1, start + 1);
      // };

      // if (apiImages.length <= 22) {
      //   await loadImagesRecursive(apiImages);
      // } else {
      //   await addCollageImages(apiImages, totalPages);
      // }
      // usage

      setFirstLoading(false);
      clearAlbums();
      if (storedPages && (storedPages.marriageDetails && storedPages.marriageDetails.groomName && storedPages.marriageDetails.brideName)) {
        addMarrageText(`Our Forever Begins Here`, 280, 250, 18)
        addMarrageText(`${storedPages.marriageDetails.groomName} & ${storedPages.marriageDetails.brideName}`, 280, 270, 20)
        addMarrageText(`${formatDateDDMMYYYY(storedPages.marriageDetails.weddingDate)}`, 280, 300, 20)
      }
      // Pixie-built albums (see buildAlbum.ts): the occasion heading and the
      // AI-generated cover caption, placed on the front page as regular
      // editable text objects — same mechanism as the "AI text" studio button.
      if (storedPages?.album_title) {
        addMarrageText(storedPages.album_title, 280, 40, 28);
      }
      if (storedPages?.ai_caption) {
        addMarrageText(storedPages.ai_caption, 280, 78, 16);
      }
    }
  };

  function formatDateDDMMYYYY(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }


  function generateImagePages(images: any[], totalPages = 22) {

    const pages: any[][] = [];
    if (!images || images.length === 0) return pages;

    let remainingImages = [...images];

    const minRequired = Math.min(totalPages, remainingImages.length);
    const basePages: any[][] = Array.from({ length: minRequired }, () => []);

    const lastIdx = minRequired - 1;
    const hasBackCover = minRequired >= 2;

    if (minRequired >= 1 && remainingImages.length > 0) {
      basePages[0].push(remainingImages.shift());
    }

    if (hasBackCover && remainingImages.length > 0) {
      basePages[lastIdx].push(remainingImages.shift());
    }

    for (let i = 1; i < lastIdx; i++) {
      if (remainingImages.length === 0) break;
      basePages[i].push(remainingImages.shift());
    }

    const middleStart = 1;
    const middleEnd = hasBackCover ? lastIdx : minRequired;
    const middleCount = Math.max(0, middleEnd - middleStart);

    while (remainingImages.length > 0 && middleCount > 0) {
      const randomPageIndex = middleStart + Math.floor(Math.random() * middleCount);

      if (basePages[randomPageIndex].length < 4) {
        basePages[randomPageIndex].push(remainingImages.shift());
      } else {
        const allFull = basePages
          .slice(middleStart, middleEnd)
          .every((p) => p.length >= 4);
        if (allFull) break;
      }
    }

    while (basePages.length < totalPages) {
      basePages.push([]);
    }


    //==// Step 4: Layout logic same as your code //==//
    return basePages.map((pageImagesRaw, i) => {
      const pageImages: any[] = [];
      const canvasWidth = 1000;
      const canvasHeight = 1000;
      const count = pageImagesRaw.length;
      if (count === 0) return [];

      if (i === 0 && count > 0) {
        const img = pageImagesRaw[0];
        pageImages.push({
          ...fitToCanvas(img, canvasWidth, canvasHeight),
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
        });
      } else if (count === 1) {
        const img = pageImagesRaw[0];
        const aspect = img.imageWidth / img.imageHeight;
        let width = canvasWidth / 2;
        let height = canvasHeight;
        if (aspect > 1.2) width = canvasWidth;
        pageImages.push({
          ...fitToCanvas(img, width, height),
          x: 0,
          y: 0,
          width,
          height,
        });
      } else if (count === 2) {
        pageImagesRaw.forEach((img, idx) => {
          const width = canvasWidth / 2;
          const height = canvasHeight / 2;
          const x = canvasWidth / 2;
          const y = idx * height;
          pageImages.push({
            ...fitToCanvas(img, width, height),
            x,
            y,
            width,
            height,
          });
        });
      } else if (count === 3) {
        const [img1, img2, img3] = pageImagesRaw;
        pageImages.push({
          ...fitToCanvas(img1, canvasWidth / 2, canvasHeight),
          x: 0,
          y: 0,
          width: canvasWidth / 2,
          height: canvasHeight,
        });
        [img2, img3].forEach((img, idx) => {
          pageImages.push({
            ...fitToCanvas(img, canvasWidth / 2, canvasHeight / 2),
            x: canvasWidth / 2,
            y: idx * (canvasHeight / 2),
            width: canvasWidth / 2,
            height: canvasHeight / 2,
          });
        });
      } else {
        pageImagesRaw.forEach((img, idx) => {
          const width = canvasWidth / 2;
          const height = canvasHeight / 2;
          const x = (idx % 2) * width;
          const y = Math.floor(idx / 2) * height;
          pageImages.push({
            ...fitToCanvas(img, width, height),
            x,
            y,
            width,
            height,
          });
        });
      }

      return pageImages;
    });
  }

  function generateImageSinglePages(img: any, index: any) {
    const pages: any[] = [];
    const aspect = img.imageWidth / img.imageHeight;
    let width = canvasWidth / 2;
    let height = canvasHeight;
    if (aspect > 1.2) width = canvasWidth;

    const pageImage = {
      id: img.id || `img-${index}-${Date.now()}`,
      image: {
        ...fitToCanvas(img, width, height),
        x: 0,
        y: 0,
        width,
        height,
      },
      pageNumber: index + 1,
    };

    return pageImage;
  }


  //==// Scale image proportionally to fit inside canvas //==//
  function fitToCanvas(img: any, canvasWidth: number, canvasHeight: number) {
    const aspectRatio = img.imageWidth / img.imageHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let newWidth = img.imageWidth;
    let newHeight = img.imageHeight;

    if (aspectRatio > canvasRatio) {
      //==// Wider than canvas -> fit width //==//
      newWidth = canvasWidth;
      newHeight = Math.round(canvasWidth / aspectRatio);
    } else {
      //==// Taller than canvas -> fit height //==//
      newHeight = canvasHeight;
      newWidth = Math.round(canvasHeight * aspectRatio);
    }

    return {
      ...img,
      fittedWidth: newWidth,
      fittedHeight: newHeight,
    };
  }



  //===// Keyboard shortcuts //===//
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case "z":
            if (event.shiftKey) {
              event.preventDefault();
              redo();
            } else {
              event.preventDefault();
              undo();
            }
            break;
          case "y":
            event.preventDefault();
            redo();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, historyStack]);


  const updateMainToolsPosition = (cardIndex: any) => {
    const cardElement = document.getElementById(`div-canvas${cardIndex}`);
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
      const panelLeft: any = rect.left + scrollLeft - 80;
      setMainToolsLeft(panelLeft);
    }
  };

  useEffect(() => {
    const handleResizeOrScroll = () => {
      if (canvasActiveIndex !== null) {
        updateMainToolsPosition(canvasActiveIndex);
      }
    };
    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll);
    return () => {
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll);
    };
  }, [canvasActiveIndex]);

  //===// Window resize handler //===//
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasActiveIndex]);

  //===// Core utility functions //===//
  const guid = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  const observeResolution = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  const getCurrentCanvasObjects = (): ElementObject[] => {
    return canvasObjects[canvasActiveIndex] || [];
  };

  const getCurrentBackground = (): string => {
    return canvasBackgrounds[canvasActiveIndex] || "white";
  };

  //===// Transform utilities //===//
  const getElementTransform = (obj: ElementObject): string => {
    return `rotate(${obj.rotation}deg) scale(${obj.scaleX}, ${obj.scaleY})`;
  };

  const getTextJustification = (textAlign: string): string => {
    switch (textAlign) {
      case "left":
        return "flex-start";
      case "center":
        return "center";
      case "right":
        return "flex-end";
      default:
        return "center";
    }
  };

  const getShapeClass = (shapeType: string): string => {
    switch (shapeType) {
      case "rectangle":
        return "shape-rectangle";
      case "circle":
        return "shape-circle";
      case "square":
      default:
        return "shape-square";
    }
  };

  const getCardClasses = (index: number): string => {
    return index === canvasActiveIndex ? "active" : "";
  };

  //===// Event handlers //===//
  const onCanvasClick = (event: React.MouseEvent, canvasIndex: number) => {
    if (event.target === event.currentTarget) {
      clearSelection();
      showMainTools();
    }

    if (canvasIndex !== canvasActiveIndex) {
      onCanvasSelect(canvasIndex);
    }
  };

  const onCanvasDoubleClick = (
    event: React.MouseEvent,
    canvasIndex: number
  ) => {
    event.stopPropagation();
    if (
      selectedObject?.locked ||
      (selectedObject?.type === "text" && !selectedObject?.editable)
    )
      return;

    const sel: any = selectedObject;
    if (sel?.type === "image" && sel?.data?.coverCanvas === true) {
      const updatedMain = mainObject.map((o: any) =>
        o.id === sel.id
          ? { ...o, data: { ...(o.data || {}), objectPosition: "50% 50%" } }
          : o
      );
      setMainObject(updatedMain);

      const updatedPage = canvasObjects[canvasActiveIndex].map((o: any) => {
        if (Array.isArray(o.originalData) && o.originalData[0]?.id === sel.id) {
          return {
            ...o,
            data: { ...(o.data || {}), objectPosition: "50% 50%" },
            originalData: [
              {
                ...o.originalData[0],
                data: {
                  ...(o.originalData[0]?.data || {}),
                  objectPosition: "50% 50%",
                },
              },
            ],
          };
        }
        return o;
      });

      const newCanvasObjects = [...canvasObjects];
      newCanvasObjects[canvasActiveIndex] = updatedPage;
      setCanvasObjects(newCanvasObjects);
      return;
    }


    setEditingTextId(selectedObject?.id || null);
    setOriginalTextValue(selectedObject?.data?.text || "");

    setTimeout(() => {
      const input = document.querySelector(
        ".text-edit-input, .layout-text-input"
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  };



  const touchStartDrag = (obj: ElementObject, event: React.TouchEvent) => {
    if (!obj || obj.locked || isEditingText(obj)) return;

    event.stopPropagation();

    const touch = event.touches[0];
    const canvasRef = canvasRefs.current[0];

    if (canvasRef && touch) {
      const rect = canvasRef.getBoundingClientRect();
      setDragStartPos({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
      setDragStartObjPos({ x: obj.x, y: obj.y });
      setIsDragging(true);
      selectObject(obj, { stopPropagation: () => { } } as React.MouseEvent, 0);
    }
    setPreventScroll(true);
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setPreventScroll(false);
    setResizeHandle("");

    const isAllEmpty = canvasObjects.every((arr) => arr.length === 0);
    if (!isAllEmpty) {
      saveHistory();
    }
  };

  const onTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!selectedObject) return;

    const touch = event.touches[0];
    if (!touch) return;

    // Prevent default scrolling
    // event.preventDefault();

    // Drag
    if (isDragging && !selectedObject.locked) {
      handleTouchMove(event);
    }

    if (isResizing && selectedObject) {
      handleTouchResize(event);
    }

    // Rotate
    if (isRotating) {
      handleTouchRotation(event);
    }
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!selectedObject || !isDragging) return;

    // event.preventDefault();
    const touch = event.touches[0];
    if (!touch) return;

    const canvasRef = canvasRefs.current[0];

    if (canvasRef) {
      const rect = canvasRef.getBoundingClientRect();
      const currentPos = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };

      const sel: any = selectedObject;
      const isCoverPan =
        sel?.type === "image" &&
        sel?.data?.coverCanvas === true &&
        (sel?.scaleX || 1) >= 1;

      if (isCoverPan) {
        const deltaX = currentPos.x - dragStartPos.x;
        const deltaY = currentPos.y - dragStartPos.y;

        const parsePct = (s: string | undefined) => {
          if (!s) return { x: 50, y: 50 };
          const parts = String(s).trim().split(/\s+/);
          const px = parseFloat(parts[0]);
          const py = parseFloat(parts[1] ?? parts[0]);
          return { x: isNaN(px) ? 50 : px, y: isNaN(py) ? 50 : py };
        };

        const start = parsePct(sel?.data?.objectPosition || "50% 50%");
        const dxPct = (deltaX / Math.max(1, canvasWidth)) * 100;
        const dyPct = (deltaY / Math.max(1, canvasHeight)) * 100;
        const newXpct = Math.max(0, Math.min(100, start.x - dxPct));
        const newYpct = Math.max(0, Math.min(100, start.y - dyPct));
        const newPos = `${newXpct.toFixed(2)}% ${newYpct.toFixed(2)}%`;

        const updatedMain = mainObject.map((o: any) =>
          o.id === sel.id
            ? { ...o, data: { ...(o.data || {}), objectPosition: newPos } }
            : o
        );
        setMainObject(updatedMain);

        const updatedPage = canvasObjects[canvasActiveIndex].map((o: any) => {
          if (Array.isArray(o.originalData) && o.originalData[0]?.id === sel.id) {
            return {
              ...o,
              data: { ...(o.data || {}), objectPosition: newPos },
              originalData: [
                {
                  ...o.originalData[0],
                  data: { ...(o.originalData[0]?.data || {}), objectPosition: newPos },
                },
              ],
            };
          }
          return o;
        });

        const newCanvasObjects = [...canvasObjects];
        newCanvasObjects[canvasActiveIndex] = updatedPage;
        setCanvasObjects(newCanvasObjects);
        return;
      }


      const newX = dragStartObjPos.x + (currentPos.x - dragStartPos.x);
      const newY = dragStartObjPos.y + (currentPos.y - dragStartPos.y);
      const objWidth = selectedObject.width || 100;
      const objHeight = selectedObject.height || 100;

      // Update main object
      const updatedObjects = mainObject.map((obj: ElementObject) => {
        if (obj.id === selectedObject.id) {
          if (obj.type === "handwriting-background") {
            return { ...obj, x: newX, y: newY };
          } else {
            return {
              ...obj,
              x: Math.max(objWidth / 2, Math.min(canvasWidth - objWidth / 2, newX)),
              y: Math.max(objHeight / 2, Math.min(canvasHeight - objHeight / 2, newY)),
            };
          }
        }
        return obj;
      });
      setMainObject(updatedObjects);

      // Update page-wise preview
      const scaleX = canvasPrevieWidth / canvasWidth;
      const scaleY = canvasPrevieHeight / canvasHeight;

      const newXPage = (dragStartObjPos.x + (currentPos.x - dragStartPos.x)) * scaleX;
      const newYPage = (dragStartObjPos.y + (currentPos.y - dragStartPos.y)) * scaleY;

      const objWidthPage = (selectedObject.width || 100) * scaleX;
      const objHeightPage = (selectedObject.height || 100) * scaleY;

      const updatedObjectsPage = canvasObjects[canvasActiveIndex].map((obj: ElementObject) => {
        if (obj.originalData[0].id === selectedObject.id) {
          if (obj.type === "handwriting-background") {
            return { ...obj, x: newXPage, y: newYPage };
          } else {
            const boundedX = Math.max(objWidth / 2, Math.min(canvasWidth - objWidth / 2, newX));
            const boundedY = Math.max(objHeight / 2, Math.min(canvasHeight - objHeight / 2, newY));

            return {
              ...obj,
              x: Math.max(objWidthPage / 2, Math.min(canvasPrevieWidth - objWidthPage / 2, newXPage)),
              y: Math.max(objHeightPage / 2, Math.min(canvasPrevieHeight - objHeightPage / 2, newYPage)),
              originalData: obj.originalData
                ? [{ ...obj.originalData[0], x: boundedX, y: boundedY }]
                : obj.originalData,
            };
          }
        }
        return obj;
      });

      const newCanvasObjects = [...canvasObjects];
      newCanvasObjects[canvasActiveIndex] = updatedObjectsPage;
      setCanvasObjects(newCanvasObjects);
    }
  };

  const handleTouchResize = (event: React.TouchEvent) => {
    if (!selectedObject || !isResizing || !resizeStart) return;

    const touch = event.touches[0];
    if (!touch) return;

    const canvasRef = canvasRefs.current[0];
    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const canvasWidth = (canvasRef as any as HTMLCanvasElement).width || canvasRef.offsetWidth;
    const canvasHeight = (canvasRef as any as HTMLCanvasElement).height || canvasRef.offsetHeight;

    // Scale based on screen-to-canvas ratio
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;

    // Compute touch position relative to canvas
    const currentPos = {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };

    // Apply smoothness factor (speed limiter)
    const smoothFactor = 0.8;
    const deltaX = (currentPos.x - dragStartPos.x / 0.8) * smoothFactor;
    const deltaY = (currentPos.y - dragStartPos.y) * smoothFactor;

    const minSize = 25;

    //===// Update main object (live resize) //===//
    const updatedObjects = mainObject.map((obj: ElementObject) => {
      if (obj.id !== selectedObject.id) return obj;
      let { width, height, x, y } = resizeStart;
      switch (resizeHandle) {
        case "se":
          width = Math.max(minSize, width + deltaX) / 1.8;
          height = Math.max(minSize, height + deltaY) / 1.8;

          console.log("width2", width, "height2", height);
          break;
        case "sw":
          width = Math.max(minSize, width - deltaX) / 1.8;
          height = Math.max(minSize, height + deltaY) / 1.8;
          x += deltaX / 2;
          break;
        case "ne":
          width = Math.max(minSize, width + deltaX) / 1.8;
          height = Math.max(minSize, height - deltaY) / 1.8;
          y += deltaY / 2;
          break;
        case "nw":
          width = Math.max(minSize, width - deltaX) / 1.8;
          height = Math.max(minSize, height - deltaY) / 1.8;
          x += deltaX / 2;
          y += deltaY / 2;
          break;
      }

      return { ...obj, width, height, x, y };
    });

    setMainObject(updatedObjects);

    //===// Update mirrored canvas object //===//
    const updatedObjectsPages = canvasObjects[canvasActiveIndex].map(
      (obj: ElementObject) => {
        if (!obj.originalData?.[0] || obj.originalData[0].id !== selectedObject.id)
          return obj;

        let { width, height, x, y } = resizeStart;

        switch (resizeHandle) {
          case "se":
            width = Math.max(minSize, width + deltaX);
            height = Math.max(minSize, height + deltaY);
            break;
          case "sw":
            width = Math.max(minSize, width - deltaX);
            height = Math.max(minSize, height + deltaY);
            x += deltaX / 2;
            break;
          case "ne":
            width = Math.max(minSize, width + deltaX);
            height = Math.max(minSize, height - deltaY);
            y += deltaY / 2;
            break;
          case "nw":
            width = Math.max(minSize, width - deltaX);
            height = Math.max(minSize, height - deltaY);
            x += deltaX / 2;
            y += deltaY / 2;
            break;
        }

        const cardEl = cardPreviewRef.current[canvasActiveIndex];
        if (cardEl) {
          const cardWidth = cardEl.offsetWidth;
          const cardHeight = cardEl.offsetHeight;
          x = Math.max(width / 2, Math.min(cardWidth - width / 2, x));
          y = Math.max(height / 2, Math.min(cardHeight - height / 2, y));
        }

        return {
          ...obj,
          width: width / 4,
          height: height / 3.5,
          originalData: [{ ...obj.originalData[0], width, height }],
        };
      }
    );

    const newCanvasObjects = [...canvasObjects];
    newCanvasObjects[canvasActiveIndex] = updatedObjectsPages;
    setCanvasObjects(newCanvasObjects);
  };


  const handleTouchRotation = (event: React.TouchEvent) => {
    if (!selectedObject || !isRotating) return;

    // event.preventDefault();
    const touch = event.touches[0];
    if (!touch) return;

    const canvasRef = canvasRefs.current[0];
    if (canvasRef) {
      const rect = canvasRef.getBoundingClientRect();
      const centerX = selectedObject.x + rect.left;
      const centerY = selectedObject.y + rect.top;
      const currentAngle = (Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * 180) / Math.PI;
      const updatedObjects = mainObject.map((obj: ElementObject) =>
        obj.id === selectedObject.id ? { ...obj, rotation: currentAngle - rotationStartAngle } : obj
      );

      setMainObject(updatedObjects);

      const updatedObjectsPages = canvasObjects[canvasActiveIndex].map((obj: ElementObject) =>
        obj.originalData[0].id === selectedObject.id
          ? {
            ...obj,
            rotation: currentAngle - rotationStartAngle,
            originalData: obj.originalData
              ? [{ ...obj.originalData[0], rotation: currentAngle - rotationStartAngle }]
              : obj.originalData
          }
          : obj
      );

      const newCanvasObjects = [...canvasObjects];
      newCanvasObjects[canvasActiveIndex] = updatedObjectsPages;
      setCanvasObjects(newCanvasObjects);
    }
  };

  const onMouseMove = (event: React.MouseEvent, canvasIndex: number) => {
    if (isDragging && selectedObject && !selectedObject.locked) {
      handleDrag(event);
    }
    if (isResizing && selectedObject) {
      handleResize(event);
    }

    if (isRotating && selectedObject) {
      handleRotation(event);
    }
    //===// Stop dragging/resizing/rotating if mouse is outside the canvas //===//
    const canvasEl = canvasRefs.current[canvasIndex];
    if (canvasEl) {
      const rect = canvasEl.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        setIsDragging(false);
        setIsResizing(false);
        setIsRotating(false);
        setSelectedObject(null);
      }
    }
  };


  useEffect(() => {
    if (isDragging || isResizing || isRotating) {
      const handleMove = (e: MouseEvent) => {
        onMouseMove({ clientX: e.clientX, clientY: e.clientY } as unknown as React.MouseEvent, canvasActiveIndex);
      };

      const handleUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setIsRotating(false);
        setSelectedObject(null);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);

      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
    }
  }, [isDragging, isResizing, isRotating, selectedObject, canvasActiveIndex]);

  const onMouseUp = (event: React.MouseEvent, canvasIndex: number) => {
    setIsDragging(false);
    setIsShapeImageDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setPreventScroll(false);
    setResizeHandle("");

    const isAllEmpty = canvasObjects.every((arr) => arr.length === 0);
    if (!isAllEmpty) {
      saveHistory();
    }
  };


  const startDrag = (obj: ElementObject, event: React.MouseEvent) => {
    if (!obj.locked && !isEditingText(obj) && !isShapeImageDragging) {
      event.preventDefault();
      event.stopPropagation();

      const canvasRef = canvasRefs.current[canvasActiveIndex];
      if (canvasRef) {
        const rect = canvasRef.getBoundingClientRect();
        setDragStartPos({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
        setDragStartObjPos({ x: obj.x, y: obj.y });
        console.log("dragStartObjPos>>>>", obj);

      }

      setIsDragging(true);
      console.log(isDragging);

    }
  };

  const handleDrag = (event: React.MouseEvent) => {
    if (!selectedObject || !isDragging) return;
    const canvasRef = canvasRefs.current[0]; // अब सिर्फ़ main canvas है
    if (canvasRef) {
      const rect = canvasRef.getBoundingClientRect();
      const currentPos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      const sel: any = selectedObject;
      const isCoverPan =
        sel?.type === "image" &&
        sel?.data?.coverCanvas === true &&
        (sel?.scaleX || 1) >= 1;

      if (isCoverPan) {
        const deltaX = currentPos.x - dragStartPos.x;
        const deltaY = currentPos.y - dragStartPos.y;

        const parsePct = (s: string | undefined) => {
          if (!s) return { x: 50, y: 50 };
          const parts = String(s).trim().split(/\s+/);
          const px = parseFloat(parts[0]);
          const py = parseFloat(parts[1] ?? parts[0]);
          return { x: isNaN(px) ? 50 : px, y: isNaN(py) ? 50 : py };
        };

        const start = parsePct(sel?.data?.objectPosition || "50% 50%");
        const dxPct = (deltaX / Math.max(1, canvasWidth)) * 100;
        const dyPct = (deltaY / Math.max(1, canvasHeight)) * 100;
        const newXpct = Math.max(0, Math.min(100, start.x - dxPct));
        const newYpct = Math.max(0, Math.min(100, start.y - dyPct));
        const newPos = `${newXpct.toFixed(2)}% ${newYpct.toFixed(2)}%`;

        const updatedMain = mainObject.map((o: any) =>
          o.id === sel.id
            ? { ...o, data: { ...(o.data || {}), objectPosition: newPos } }
            : o
        );
        setMainObject(updatedMain);

        const updatedPage = canvasObjects[canvasActiveIndex].map((o: any) => {
          if (Array.isArray(o.originalData) && o.originalData[0]?.id === sel.id) {
            return {
              ...o,
              data: { ...(o.data || {}), objectPosition: newPos },
              originalData: [
                {
                  ...o.originalData[0],
                  data: { ...(o.originalData[0]?.data || {}), objectPosition: newPos },
                },
              ],
            };
          }
          return o;
        });

        const newCanvasObjects = [...canvasObjects];
        newCanvasObjects[canvasActiveIndex] = updatedPage;
        setCanvasObjects(newCanvasObjects);
        return;
      }



      const newX = dragStartObjPos.x + (currentPos.x - dragStartPos.x);
      const newY = dragStartObjPos.y + (currentPos.y - dragStartPos.y);
      const objWidth = selectedObject.width || 100;
      const objHeight = selectedObject.height || 100;

      const updatedObjects = mainObject.map((obj: ElementObject) => {
        if (obj.id === selectedObject.id) {
          if (obj.type === "handwriting-background") {
            return { ...obj, x: newX, y: newY };
          } else {
            return {
              ...obj,
              x: Math.max(objWidth / 2, Math.min(canvasWidth - objWidth / 2, newX)),
              y: Math.max(objHeight / 2, Math.min(canvasHeight - objHeight / 2, newY)),
            };
          }
        }
        return obj;
      });
      setMainObject(updatedObjects);

      //====// page-wise update //====//
      const pageCanvasRef = canvasRefs.current[0];
      if (pageCanvasRef) {
        const rectPage = pageCanvasRef.getBoundingClientRect();
        const currentPosPage = {
          x: event.clientX - rectPage.left,
          y: event.clientY - rectPage.top,
        };

        //====//===// scaling factors between main canvas and preview //====//
        const scaleX = canvasPrevieWidth / canvasWidth;
        const scaleY = canvasPrevieHeight / canvasHeight;
        const newXPage = (dragStartObjPos.x + (currentPosPage.x - dragStartPos.x)) * scaleX;
        const newYPage = (dragStartObjPos.y + (currentPosPage.y - dragStartPos.y)) * scaleY;
        const objWidthPage = (selectedObject.width || 100) * scaleX;
        const objHeightPage = (selectedObject.height || 100) * scaleY;

        const updatedObjectsPage = canvasObjects[canvasActiveIndex].map((obj: ElementObject) => {
          const foundItem = obj.originalData.find((obj: any) => obj.id === selectedObject.id);
          if (obj.originalData[0].id === selectedObject.id) {
            if (obj.type === "handwriting-background") {
              return { ...obj, x: newXPage, y: newYPage };
            } else {
              const boundedX = Math.max(objWidth / 2, Math.min(canvasWidth - objWidth / 2, newX));
              const boundedY = Math.max(objHeight / 2, Math.min(canvasHeight - objHeight / 2, newY));

              return {
                ...obj,
                x: Math.max(objWidthPage / 2, Math.min(canvasPrevieWidth - objWidthPage / 2, newXPage)),
                y: Math.max(objHeightPage / 2, Math.min(canvasPrevieHeight - objHeightPage / 2, newYPage)),
                originalData: obj.originalData ? [{ ...obj.originalData[0], x: boundedX, y: boundedY }] : obj.originalData
              };
            }
          }
          return obj;
        });

        const newCanvasObjects = [...canvasObjects];
        newCanvasObjects[canvasActiveIndex] = updatedObjectsPage;
        setCanvasObjects(newCanvasObjects);
      }
    }
  };


  //===// Resize handlers (simplified version) //===//
  const startResize = (element: ElementObject, direction: string, event: React.MouseEvent) => {

    // event.preventDefault();
    event.stopPropagation();

    const canvasRef = canvasRefs.current[0];
    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    setIsResizing(true);

    setResizeHandle(direction);
    setDragStartPos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    setResizeStart({
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    });
  };


  const handleResize = (event: React.MouseEvent) => {
    if (!selectedObject || !isResizing || !resizeStart) return;
    const canvasRef = canvasRefs.current[0];
    if (!canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const currentPos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    const deltaX = currentPos.x - dragStartPos.x;
    const deltaY = currentPos.y - dragStartPos.y;
    const minSize = 10;

    const updatedObjects = mainObject.map((obj: ElementObject) => {
      if (obj.id === selectedObject.id) {
        let { width, height, x, y } = resizeStart; // use original snapshot

        switch (resizeHandle) {
          case "se":
            width = Math.max(minSize, width + deltaX);
            height = Math.max(minSize, height + deltaY);
            break;

          case "sw":
            width = Math.max(minSize, width - deltaX);
            height = Math.max(minSize, height + deltaY);
            x += deltaX; // shift left side
            break;

          case "ne":
            width = Math.max(minSize, width + deltaX);
            height = Math.max(minSize, height - deltaY);
            y += deltaY; // shift top side
            break;

          case "nw":
            width = Math.max(minSize, width - deltaX);
            height = Math.max(minSize, height - deltaY);
            x += deltaX;
            y += deltaY;
            break;
        }
        return { ...obj, width, height, x, y };
      }
      return obj;
    });

    setMainObject(updatedObjects);

    const updatedObjectsPages = canvasObjects[canvasActiveIndex].map((obj: ElementObject) => {
      if (obj.originalData[0].id === selectedObject.id) {
        let { width, height, x, y } = resizeStart;

        switch (resizeHandle) {
          case "se":
            width = Math.max(minSize, width + deltaX);
            height = Math.max(minSize, height + deltaY);
            break;
          case "sw":
            width = Math.max(minSize, width - deltaX);
            height = Math.max(minSize, height + deltaY);
            x += deltaX / 2; // shift position to keep element within card
            break;
          case "ne":
            width = Math.max(minSize, width + deltaX);
            height = Math.max(minSize, height - deltaY);
            y += deltaY / 2; // shift position to keep element within card
            break;
          case "nw":
            width = Math.max(minSize, width - deltaX);
            height = Math.max(minSize, height - deltaY);
            x += deltaX / 2;
            y += deltaY / 2;
            break;
        }

        // Clamp position to card boundaries
        const cardEl = cardPreviewRef.current[canvasActiveIndex];
        if (cardEl) {
          const cardWidth = cardEl.offsetWidth;
          const cardHeight = cardEl.offsetHeight;

          x = Math.max(width / 2, Math.min(cardWidth - width / 2, x));
          y = Math.max(height / 2, Math.min(cardHeight - height / 2, y));

        }
        let newWidth = width / 4;
        let newHeight = height / 3.5;

        return { ...obj, width: newWidth, height: newHeight, originalData: obj.originalData ? [{ ...obj.originalData[0], width, height, }] : obj.originalData };
      }
      return obj;
    });


    const newCanvasObjects = [...canvasObjects];
    newCanvasObjects[canvasActiveIndex] = updatedObjectsPages;
    setCanvasObjects(newCanvasObjects);

  };

  //===// Rotation handlers //===//
  const startRotation = (obj: ElementObject, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    setIsRotating(true);

    const canvasRef = canvasRefs.current[0];
    if (canvasRef) {
      const rect = canvasRef.getBoundingClientRect();
      const centerX = obj.x + rect.left;
      const centerY = obj.y + rect.top;
      setRotationStartAngle(
        (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) /
        Math.PI - obj.rotation
      );
    }
  };

  const handleRotation = (event: React.MouseEvent) => {
    if (!selectedObject || !isRotating) return;
    const canvasRef = canvasRefs.current[0];
    if (canvasRef) {
      const rect = canvasRef.getBoundingClientRect();
      const centerX = selectedObject.x + rect.left;
      const centerY = selectedObject.y + rect.top;
      const currentAngle = (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;
      const updatedObjects = mainObject.map((obj: ElementObject) =>
        obj.id === selectedObject.id ? { ...obj, rotation: currentAngle - rotationStartAngle } : obj
      );

      setMainObject(updatedObjects);

      const updatedObjectsPages = canvasObjects[canvasActiveIndex].map((obj: ElementObject) =>
        obj.originalData[0].id === selectedObject.id ? { ...obj, rotation: currentAngle - rotationStartAngle, originalData: obj.originalData ? [{ ...obj.originalData[0], rotation: currentAngle - rotationStartAngle }] : obj.originalData } : obj
      );

      const newCanvasObjects = [...canvasObjects];
      newCanvasObjects[canvasActiveIndex] = updatedObjectsPages;
      setCanvasObjects(newCanvasObjects);
    }
  };

  // === Object selection for mainObject === //
  const selectObject = (obj: ElementObject, event: MouseEvent | React.MouseEvent, index: any) => {
    event.stopPropagation();
    if (editingTextId) return;
    clearSelection();
    const updatedObjects = mainObject.map((o: ElementObject) =>
      o.id === obj.id ? { ...o, selected: true } : { ...o, selected: false }
    );

    setMainObject(updatedObjects);

    // set states
    setDragStartPos({ x: 0, y: 0 });
    setDragStartObjPos({ x: 0, y: 0 });
    // setResizeStart(null);
    // setResizeHandle("")
    setSelectedObject({ ...obj, selected: true });
    setIsLocked(obj.locked);
    setIsEditable(obj.editable);
    setIsShapeImageMode(false);

    updateUIForSelectedObject(obj);
    showObjectTools();
  };

  const clearSelection = () => {
    const updatedObjects = mainObject.map((obj: ElementObject) => ({
      ...obj,
      selected: false,
      ...(obj.shapeImage?.data && {
        shapeImage: { ...obj.shapeImage, selected: false },
      }),
    }));

    setMainObject(updatedObjects);
    setSelectedObject(null);
    setIsLocked(false);
    setIsEditable(true);
    setIsShapeImageMode(false);
    setDropdownOpen(false);
    finishTextEditIfActive();
    setPreventScroll(false);
  };

  const handleDubbleTap = (obj: any, e: React.TouchEvent) => {
    const currentTime = Date.now();
    const tapGap = currentTime - (lastTapRef.current || 0);
    if (tapGap < 300 && tapGap > 0) {
      // Double tap detected
      startTextEdit(obj, e);
    }

    lastTapRef.current = currentTime;
  };


  //===// Text editing //===//
  const startTextEdit = (obj: ElementObject, event: React.MouseEvent | React.TouchEvent) => {
    console.log(obj);
    event.stopPropagation();
    if (obj.locked || (obj.type === "layoutText" && !obj.editable)) return;

    setEditingTextId(obj.id);
    setOriginalTextValue(obj.data?.text || "");

    setTimeout(() => {
      const input = document.querySelector(
        ".text-edit-input, .layout-text-input"
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  };

  const finishTextEdit = (inndexId: any, event: | React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    const newText = target.value.trim();
    console.log(mainObject);
    mainObject[inndexId].data.text = newText || originalTextValue;
    setMainObject(mainObject);

    const updatedObjects = [...canvasObjects];
    const objIndex = updatedObjects[canvasActiveIndex].findIndex((o) => o.originalData[0].id === selectedObject?.id);
    if (objIndex !== -1) {
      updatedObjects[canvasActiveIndex][objIndex].data.text = newText || originalTextValue;
      updatedObjects[canvasActiveIndex][objIndex].data.text = newText || originalTextValue;
      setCanvasObjects(updatedObjects);
    }

    saveHistory();
    setEditingTextId(null);
    setOriginalTextValue("");
  };

  const cancelTextEdit = (obj: ElementObject) => {
    const updatedObjects = mainObject.map((o: ElementObject) =>
      o.id === obj.id ? { ...o, data: { ...o.data, text: originalTextValue, }, } : o
    );

    setMainObject(updatedObjects);
    setEditingTextId(null);
    setOriginalTextValue("");
  };


  const isEditingText = (obj: ElementObject): boolean => {
    return editingTextId === obj.id;
  };

  const finishTextEditIfActive = () => {
    if (editingTextId) {
      setEditingTextId(null);
    }
  };


  //===// Object creation //===//
  const addText = () => {
    const newText: ElementTextObject = {
      id: `text-${Date.now()}-${Math.random()}`,
      type: "text",
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      width: 200,
      height: 50,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      selected: false,
      locked: false,
      editable: true,
      zIndex: getCurrentCanvasObjects().length,
      data: {
        text: "Your Text Here",
        fontSize: 24,
        fontFamily: "Arial",
        fontFamilyName: "Arial",
        fill: "#000000",
        textAlign: "center",
      },
    };

    const updatedObjects = [...canvasObjects];
    if (!updatedObjects[canvasActiveIndex]) {
      updatedObjects[canvasActiveIndex] = [];
    }
    mainObject.push(newText);
    setMainObject(mainObject);

    let PreviewUpdateData: any = {
      id: `text-${Date.now()}-${Math.random()}`,
      type: "text",
      x: canvasPrevieWidth / 2,
      y: canvasPrevieHeight / 2,
      width: 100,
      height: 25,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      selected: false,
      locked: false,
      editable: false,
      zIndex: getCurrentCanvasObjects().length,
      originalData: [newText],
      data: {
        text: "Your Text Here",
        fontSize: 10,
        fontFamily: "Arial",
        fill: "#000000",
        textAlign: "center",
      },
    };
    setpreviewCartId(PreviewUpdateData);
    canvasObjects[canvasActiveIndex].push(PreviewUpdateData);
    setCanvasObjects(canvasObjects);

    setShowAdditionalPanel(false);
    selectObject(
      newText,
      { stopPropagation: () => { } } as React.MouseEvent,
      canvasActiveIndex
    );

    const updatedElementsList = [...elementsList];
    updatedElementsList.push({ id: newText.id, type: "text", name: "Text" });
    setElementsList(updatedElementsList);

    saveHistory();
    setTimeout(
      () =>
        startTextEdit(newText, {
          stopPropagation: () => { },
        } as React.MouseEvent),
      100
    );
  };

  // const addImageToCanvas = async (imageSrc: string, type: string = "") => {
  //   if (
  //     type === "shape-container" &&
  //     selectedObject?.type === "shape" &&
  //     isShapeImageMode
  //   ) {
  //     addImageToShape(imageSrc, selectedObject as ElementShapeObject);
  //     hideAdditionalPanel();
  //     return;
  //   }

  //   if (
  //     selectedObject &&
  //     selectedObject.type === "image" &&
  //     selectedObject.editable !== false
  //   ) {
  //     const updatedObjects = [...canvasObjects];
  //     const objIndex = updatedObjects[canvasActiveIndex].findIndex(
  //       (o) => o.id === selectedObject.id
  //     );
  //     if (objIndex !== -1) {
  //       (
  //         updatedObjects[canvasActiveIndex][objIndex] as ElementImageObject
  //       ).data.src = imageSrc;
  //       setCanvasObjects(updatedObjects);
  //     }
  //     hideAdditionalPanel();
  //     return;
  //   }

  //   type = type === "" ? "image" : type;

  //   const newImage: ElementImageObject = {
  //     id: `${type}-${Date.now()}`,
  //     type: "image",
  //     x: canvasWidth / 2,
  //     y: canvasHeight / 2,
  //     width: 150,
  //     height: 150,
  //     rotation: 0,
  //     scaleX: 1,
  //     scaleY: 1,
  //     selected: false,
  //     locked: false,
  //     editable: true,
  //     zIndex: getCurrentCanvasObjects().length,
  //     data: {
  //       src: imageSrc,
  //       preserveAspectRatio: "xMidYMid meet",
  //     },
  //   };

  //   const updatedObjects = [...canvasObjects];
  //   if (!updatedObjects[canvasActiveIndex]) {
  //     updatedObjects[canvasActiveIndex] = [];
  //   }
  //   updatedObjects[canvasActiveIndex].push(newImage);
  //   setCanvasObjects(updatedObjects);

  //   selectObject(
  //     newImage,
  //     { stopPropagation: () => { } } as React.MouseEvent,
  //     canvasActiveIndex
  //   );

  //   const updatedElementsList = [...elementsList];
  //   updatedElementsList.push({
  //     id: newImage.id,
  //     type,
  //     name: type === "sticker" ? "Sticker" : "Image",
  //   });
  //   setElementsList(updatedElementsList);

  //   hideAdditionalPanel();
  //   setShowLeftPanel(false);
  //   saveHistory();
  // };

  // const addCollageImages = async (images: any, index: number, isMarraged: any) => {
  //   if (!images || images.length === 0) return;
  //   const count = Math.min(Math.max(images.length, 3), 4);
  //   const gap = 10;

  //   const collageImages: ElementImageObject[] = [];
  //   const firstLoop = async () => {
  //     for (let i = 0; i < count; i++) {
  //       const img = images[i];
  //       if (!img) continue;

  //       let x = 0, y = 0, w = 0, h = 0;

  //       if (count === 2) {
  //         // 2 side by side
  //         w = (canvasWidth - gap * 3) / 2;
  //         h = canvasHeight - gap * 2;
  //         x = gap + i * (w + gap) + w / 2; // ✅ center X
  //         y = gap + h / 2;                 // ✅ center Y
  //       } else if (count === 3) {
  //         if (i === 0) {
  //           // top full
  //           w = canvasWidth - gap * 2;
  //           h = (canvasHeight - gap * 3) / 2;
  //           x = gap + w / 2;
  //           y = gap + h / 2;
  //         } else {
  //           // bottom 2
  //           w = (canvasWidth - gap * 3) / 2;
  //           h = (canvasHeight - gap * 3) / 2;
  //           x = gap + (i - 1) * (w + gap) + w / 2;
  //           y = h + gap * 2 + h / 2;
  //         }
  //       } else if (count === 4) {
  //         // 2x2
  //         w = (canvasWidth - gap * 3) / 2;
  //         h = (canvasHeight - gap * 3) / 2;
  //         x = gap + (i % 2) * (w + gap) + w / 2;
  //         y = gap + Math.floor(i / 2) * (h + gap) + h / 2;
  //       }

  //       const newImage: ElementImageObject = {
  //         id: img.id,
  //         type: "image",
  //         x, // ✅ stored as CENTER
  //         y,
  //         width: w,
  //         height: h,
  //         rotation: 0,
  //         scaleX: 1,
  //         scaleY: 1,
  //         selected: false,
  //         locked: false,
  //         editable: true,
  //         zIndex: mainObject.length,
  //         data: {
  //           src: img.src,
  //           preserveAspectRatio: "xMidYMid slice",
  //         },
  //       };
  //       collageImages.push(newImage);
  //       if (index == 0) {
  //         mainObject.push(newImage);
  //       }
  //     }
  //   };
  //   await firstLoop();

  //   const secondLoop = async () => {
  //     for (let i = 0; i < count; i++) {
  //       const img = images[i];
  //       if (!img) continue;

  //       const gapPreview = 5;
  //       let xPreview = 0, yPreview = 0, wPreview = 0, hPreview = 0;

  //       if (count === 2) {
  //         // 2 side by side
  //         wPreview = (canvasPrevieWidth - gapPreview * 3) / 2;
  //         hPreview = canvasPrevieHeight - gapPreview * 2;
  //         xPreview = gapPreview + i * (wPreview + gapPreview) + wPreview / 2; // ✅ center XPreview
  //         yPreview = gapPreview + hPreview / 2;                 // ✅ center YPreview
  //       } else if (count === 3) {
  //         if (i === 0) {
  //           // top full
  //           wPreview = canvasPrevieWidth - gapPreview * 2;
  //           hPreview = (canvasPrevieHeight - gapPreview * 3) / 2;
  //           xPreview = gapPreview + wPreview / 2;
  //           yPreview = gapPreview + hPreview / 2;
  //         } else {
  //           // bottom 2
  //           wPreview = (canvasPrevieWidth - gapPreview * 3) / 2;
  //           hPreview = (canvasPrevieHeight - gapPreview * 3) / 2;
  //           xPreview = gapPreview + (i - 1) * (wPreview + gapPreview) + wPreview / 2;
  //           yPreview = hPreview + gapPreview * 2 + hPreview / 2;
  //         }
  //       } else if (count === 4) {
  //         // 2x2
  //         wPreview = (canvasPrevieWidth - gapPreview * 3) / 2;
  //         hPreview = (canvasPrevieHeight - gapPreview * 3) / 2;
  //         xPreview = gapPreview + (i % 2) * (wPreview + gapPreview) + wPreview / 2;
  //         yPreview = gapPreview + Math.floor(i / 2) * (hPreview + gapPreview) + hPreview / 2;
  //       }

  //       // store collage preview
  //       const newImagePreview: ElementImageObject = {
  //         id: `collage-${Date.now()}-${Math.random()}`,
  //         type: "image",
  //         x: xPreview,
  //         y: yPreview,
  //         width: wPreview,
  //         height: hPreview,
  //         rotation: 0,
  //         scaleX: 1,
  //         scaleY: 1,
  //         selected: false,
  //         locked: false,
  //         editable: true,
  //         zIndex: canvasObjects[index].length,
  //         originalData: collageImages,
  //         data: {
  //           src: img.src, // just placeholder
  //           preserveAspectRatio: "xMidYMid meet",
  //         },
  //       };

  //       canvasObjects[index].push(newImagePreview);
  //     }
  //   }
  //   await secondLoop();
  //   setCanvasObjects([...canvasObjects]);
  //   setMainObject([...mainObject]);
  //   // saveHistory();
  //   console.log("canvasObjects>>", canvasObjects);

  // };



  //===// helper to fit image proportionally inside slot //===//
  function fitInside(imgW: number, imgH: number, slotW: number, slotH: number) {
    const scale = Math.min(slotW / imgW, slotH / imgH);
    const newW = imgW * scale;
    const newH = imgH * scale;
    return { width: newW, height: newH };
  }

  const addCollageImages = async (
    images: any[],
    index: number,
    isMarraged: any,
    deferStateUpdate: boolean = false
  ) => {
    if (!images || images.length === 0) return;
    const count = images.length;
    const gap = 10;
    const collageImages: ElementImageObject[] = [];

    let count2Layout: "side" | "stacked" | "portraitFirst" = "side";
    let count2A1 = 1;
    let count2A2 = 1;
    let count2PortraitIdx = 0;

    if (count === 2 && images[0] && images[1]) {
      count2A1 = (images[0].imageWidth || 1) / (images[0].imageHeight || 1);
      count2A2 = (images[1].imageWidth || 1) / (images[1].imageHeight || 1);

      let sideSlotW = (canvasWidth - gap * 3) / 2;
      let sideH1 = sideSlotW / count2A1;
      let sideH2 = sideSlotW / count2A2;
      const sideHmax = Math.max(sideH1, sideH2);
      const sideHavail = canvasHeight - gap * 2;
      if (sideHmax > sideHavail) {
        const sf = sideHavail / sideHmax;
        sideSlotW *= sf;
        sideH1 *= sf;
        sideH2 *= sf;
      }
      const sideArea = sideSlotW * sideH1 + sideSlotW * sideH2;

      const stackHavail = canvasHeight - gap * 3;
      const stackInv1 = 1 / count2A1;
      const stackInv2 = 1 / count2A2;
      let stackH1 = stackHavail * (stackInv1 / (stackInv1 + stackInv2));
      let stackH2 = stackHavail * (stackInv2 / (stackInv1 + stackInv2));
      let stackW1 = stackH1 * count2A1;
      let stackW2 = stackH2 * count2A2;
      const stackWavail = canvasWidth - gap * 2;
      if (stackW1 > stackWavail) {
        const sf = stackWavail / stackW1;
        stackH1 *= sf;
        stackH2 *= sf;
        stackW1 *= sf;
        stackW2 *= sf;
      }
      const stackArea = stackW1 * stackH1 + stackW2 * stackH2;

      let portraitArea = 0;
      let portraitIdx = -1;
      const tryPortraitFirst = (pIdx: number) => {
        const aP = pIdx === 0 ? count2A1 : count2A2;
        const aR = pIdx === 0 ? count2A2 : count2A1;
        if (aP >= 1) return 0;

        let leftH = canvasHeight - gap * 2;
        let leftW = leftH * aP;
        if (leftW > canvasWidth - gap * 3) {
          leftW = canvasWidth - gap * 3;
          leftH = leftW / aP;
        }

        const remainingW = canvasWidth - gap * 3 - leftW;
        if (remainingW <= 0) return 0;

        let rightW = remainingW;
        let rightH = rightW / aR;
        if (rightH > canvasHeight - gap * 2) {
          rightH = canvasHeight - gap * 2;
          rightW = rightH * aR;
        }

        return leftW * leftH + rightW * rightH;
      };

      const pa0 = tryPortraitFirst(0);
      const pa1 = tryPortraitFirst(1);
      if (pa0 >= pa1 && pa0 > 0) {
        portraitArea = pa0;
        portraitIdx = 0;
      } else if (pa1 > 0) {
        portraitArea = pa1;
        portraitIdx = 1;
      }

      if (portraitArea > stackArea && portraitArea > sideArea) {
        count2Layout = "portraitFirst";
        count2PortraitIdx = portraitIdx;
      } else if (stackArea > sideArea) {
        count2Layout = "stacked";
      } else {
        count2Layout = "side";
      }
    }

    let count3SortedIdx: number[] = [0, 1, 2];
    const count3Aspects: number[] = [1, 1, 1];
    if (count === 3 && images[0] && images[1] && images[2]) {
      const indexed = [0, 1, 2].map((k) => ({
        idx: k,
        h: images[k].imageHeight || 1,
        w: images[k].imageWidth || 1,
      }));
      indexed.sort((a, b) => b.h - a.h);
      count3SortedIdx = indexed.map((x) => x.idx);
      for (let k = 0; k < 3; k++) {
        const ix = count3SortedIdx[k];
        count3Aspects[k] = (images[ix].imageWidth || 1) / (images[ix].imageHeight || 1);
      }
    }

    const count4Aspects: number[] = [1, 1, 1, 1];
    if (count === 4 && images[0] && images[1] && images[2] && images[3]) {
      for (let k = 0; k < 4; k++) {
        count4Aspects[k] = (images[k].imageWidth || 1) / (images[k].imageHeight || 1);
      }
    }

    for (let i = 0; i < count; i++) {
      let img = images[i];
      if (!img) continue;

      let slotX = 0;
      let slotY = 0;
      let slotW = 0;
      let slotH = 0;

      if (index === 0 && i === 0) {
        slotW = canvasWidth;
        slotH = canvasHeight;
        slotX = 0;
        slotY = 0;
      } else if (count === 1) {
        slotW = canvasWidth;
        slotH = canvasHeight;
        slotX = 0;
        slotY = 0;
      } else if (count === 2) {
        if (count2Layout === "portraitFirst") {
          const aP = count2PortraitIdx === 0 ? count2A1 : count2A2;
          const aR = count2PortraitIdx === 0 ? count2A2 : count2A1;
          const leftH = canvasHeight - gap * 2;
          const leftW = leftH * aP;
          let rightW = canvasWidth - gap * 3 - leftW;
          let rightH = rightW / aR;
          if (rightH > canvasHeight - gap * 2) {
            rightH = canvasHeight - gap * 2;
            rightW = rightH * aR;
          }

          if (i === count2PortraitIdx) {
            slotW = leftW;
            slotH = leftH;
            slotX = gap;
            slotY = gap;
          } else {
            slotW = rightW;
            slotH = rightH;
            slotX = gap + leftW + gap;
            slotY = (canvasHeight - rightH) / 2;
          }
        } else if (count2Layout === "stacked") {
          const havail = canvasHeight - gap * 3;
          const inv1 = 1 / count2A1;
          const inv2 = 1 / count2A2;
          let h1 = havail * (inv1 / (inv1 + inv2));
          let h2 = havail * (inv2 / (inv1 + inv2));
          let w1 = h1 * count2A1;
          let w2 = h2 * count2A2;
          const wavail = canvasWidth - gap * 2;
          if (w1 > wavail) {
            const sf = wavail / w1;
            h1 *= sf;
            h2 *= sf;
            w1 *= sf;
            w2 *= sf;
          }

          slotH = i === 0 ? h1 : h2;
          slotW = i === 0 ? w1 : w2;
          slotX = (canvasWidth - slotW) / 2;
          const totalH = h1 + h2 + gap;
          const startY = (canvasHeight - totalH) / 2;
          slotY = i === 0 ? startY : startY + h1 + gap;
        } else {
          let w = (canvasWidth - gap * 3) / 2;
          let h1 = w / count2A1;
          let h2 = w / count2A2;
          const hmax = Math.max(h1, h2);
          const havail = canvasHeight - gap * 2;
          if (hmax > havail) {
            const sf = havail / hmax;
            w *= sf;
            h1 *= sf;
            h2 *= sf;
          }

          slotW = w;
          slotH = i === 0 ? h1 : h2;
          slotY = (canvasHeight - slotH) / 2;
          const totalW = 2 * slotW + gap;
          slotX = (canvasWidth - totalW) / 2 + i * (slotW + gap);
        }
      } else if (count === 3) {
        img = images[count3SortedIdx[i]];
        const a0 = count3Aspects[0];
        const a1 = count3Aspects[1];
        const a2 = count3Aspects[2];

        let topW = canvasWidth - gap * 2;
        let topH = topW / a0;
        let bottomH = (canvasWidth - gap * 3) / (a1 + a2);
        let bottomW1 = bottomH * a1;
        let bottomW2 = bottomH * a2;

        if (topH + bottomH + gap * 3 > canvasHeight) {
          const sf = (canvasHeight - gap * 3) / (topH + bottomH);
          topH *= sf;
          topW *= sf;
          bottomH *= sf;
          bottomW1 *= sf;
          bottomW2 *= sf;
        }

        const totalH = topH + bottomH + gap * 3;
        const startY = (canvasHeight - totalH) / 2 + gap;

        if (i === 0) {
          slotW = topW;
          slotH = topH;
          slotX = (canvasWidth - topW) / 2;
          slotY = startY;
        } else {
          slotH = bottomH;
          slotW = i === 1 ? bottomW1 : bottomW2;
          const rowTotalW = bottomW1 + bottomW2 + gap;
          const rowStartX = (canvasWidth - rowTotalW) / 2;
          slotX = i === 1 ? rowStartX : rowStartX + bottomW1 + gap;
          slotY = startY + topH + gap;
        }
      } else if (count === 4) {
        const aSum0 = count4Aspects[0] + count4Aspects[1];
        const aSum1 = count4Aspects[2] + count4Aspects[3];
        let h0 = (canvasWidth - gap * 3) / aSum0;
        let h1 = (canvasWidth - gap * 3) / aSum1;

        if (h0 + h1 + gap * 3 > canvasHeight) {
          const sf = (canvasHeight - gap * 3) / (h0 + h1);
          h0 *= sf;
          h1 *= sf;
        }

        const row = Math.floor(i / 2);
        const col = i % 2;
        const rowH = row === 0 ? h0 : h1;
        const a0InRow = row === 0 ? count4Aspects[0] : count4Aspects[2];
        const a1InRow = row === 0 ? count4Aspects[1] : count4Aspects[3];
        const a = col === 0 ? a0InRow : a1InRow;

        slotH = rowH;
        slotW = a * rowH;
        const totalH = h0 + h1 + gap * 3;
        const startY = (canvasHeight - totalH) / 2 + gap;
        slotY = row === 0 ? startY : startY + h0 + gap;
        const rowTotalW = (a0InRow + a1InRow) * rowH + gap;
        const rowStartX = (canvasWidth - rowTotalW) / 2;
        slotX = col === 0 ? rowStartX : rowStartX + a0InRow * rowH + gap;
      }

      const { width: fittedW, height: fittedH } = fitInside(
        img.imageWidth,
        img.imageHeight,
        slotW,
        slotH
      );

      const cx = slotX + slotW / 2;
      const cy = slotY + slotH / 2;

      const newImage: ElementImageObject = {
        id: img.id,
        type: "image",
        x: cx,
        y: cy,
        width: fittedW,
        height: fittedH,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        selected: false,
        locked: false,
        editable: true,
        zIndex: mainObject.length,
        data: {
          src: img.src,
          preserveAspectRatio: "xMidYMid meet",
          image_date: img.image_date,
          imageHeight: img.imageHeight,
          imageWidth: img.imageWidth,
        },
      };

      collageImages.push(newImage);
      if (index === 0) {
        mainObject.push(newImage);
      }
    }

    const gapPreview = 5;

    for (let i = 0; i < count; i++) {
      let img = images[i];
      if (!img) continue;

      let slotX = 0;
      let slotY = 0;
      let slotW = 0;
      let slotH = 0;

      if (count === 1) {
        slotW = canvasPrevieWidth;
        slotH = canvasPrevieHeight;
        slotX = 0;
        slotY = 0;
      } else if (count === 2) {
        if (count2Layout === "portraitFirst") {
          const aP = count2PortraitIdx === 0 ? count2A1 : count2A2;
          const aR = count2PortraitIdx === 0 ? count2A2 : count2A1;
          const leftH = canvasPrevieHeight - gapPreview * 2;
          const leftW = leftH * aP;
          let rightW = canvasPrevieWidth - gapPreview * 3 - leftW;
          let rightH = rightW / aR;
          if (rightH > canvasPrevieHeight - gapPreview * 2) {
            rightH = canvasPrevieHeight - gapPreview * 2;
            rightW = rightH * aR;
          }

          if (i === count2PortraitIdx) {
            slotW = leftW;
            slotH = leftH;
            slotX = gapPreview;
            slotY = gapPreview;
          } else {
            slotW = rightW;
            slotH = rightH;
            slotX = gapPreview + leftW + gapPreview;
            slotY = (canvasPrevieHeight - rightH) / 2;
          }
        } else if (count2Layout === "stacked") {
          const havail = canvasPrevieHeight - gapPreview * 3;
          const inv1 = 1 / count2A1;
          const inv2 = 1 / count2A2;
          let h1 = havail * (inv1 / (inv1 + inv2));
          let h2 = havail * (inv2 / (inv1 + inv2));
          let w1 = h1 * count2A1;
          let w2 = h2 * count2A2;
          const wavail = canvasPrevieWidth - gapPreview * 2;
          if (w1 > wavail) {
            const sf = wavail / w1;
            h1 *= sf;
            h2 *= sf;
            w1 *= sf;
            w2 *= sf;
          }

          slotH = i === 0 ? h1 : h2;
          slotW = i === 0 ? w1 : w2;
          slotX = (canvasPrevieWidth - slotW) / 2;
          const totalH = h1 + h2 + gapPreview;
          const startY = (canvasPrevieHeight - totalH) / 2;
          slotY = i === 0 ? startY : startY + h1 + gapPreview;
        } else {
          let w = (canvasPrevieWidth - gapPreview * 3) / 2;
          let h1 = w / count2A1;
          let h2 = w / count2A2;
          const hmax = Math.max(h1, h2);
          const havail = canvasPrevieHeight - gapPreview * 2;
          if (hmax > havail) {
            const sf = havail / hmax;
            w *= sf;
            h1 *= sf;
            h2 *= sf;
          }

          slotW = w;
          slotH = i === 0 ? h1 : h2;
          slotY = (canvasPrevieHeight - slotH) / 2;
          const totalW = 2 * slotW + gapPreview;
          slotX = (canvasPrevieWidth - totalW) / 2 + i * (slotW + gapPreview);
        }
      } else if (count === 3) {
        img = images[count3SortedIdx[i]];
        const a0 = count3Aspects[0];
        const a1 = count3Aspects[1];
        const a2 = count3Aspects[2];

        let topW = canvasPrevieWidth - gapPreview * 2;
        let topH = topW / a0;
        let bottomH = (canvasPrevieWidth - gapPreview * 3) / (a1 + a2);
        let bottomW1 = bottomH * a1;
        let bottomW2 = bottomH * a2;

        if (topH + bottomH + gapPreview * 3 > canvasPrevieHeight) {
          const sf = (canvasPrevieHeight - gapPreview * 3) / (topH + bottomH);
          topH *= sf;
          topW *= sf;
          bottomH *= sf;
          bottomW1 *= sf;
          bottomW2 *= sf;
        }

        const totalH = topH + bottomH + gapPreview * 3;
        const startY = (canvasPrevieHeight - totalH) / 2 + gapPreview;

        if (i === 0) {
          slotW = topW;
          slotH = topH;
          slotX = (canvasPrevieWidth - topW) / 2;
          slotY = startY;
        } else {
          slotH = bottomH;
          slotW = i === 1 ? bottomW1 : bottomW2;
          const rowTotalW = bottomW1 + bottomW2 + gapPreview;
          const rowStartX = (canvasPrevieWidth - rowTotalW) / 2;
          slotX = i === 1 ? rowStartX : rowStartX + bottomW1 + gapPreview;
          slotY = startY + topH + gapPreview;
        }
      } else if (count === 4) {
        const aSum0 = count4Aspects[0] + count4Aspects[1];
        const aSum1 = count4Aspects[2] + count4Aspects[3];
        let h0 = (canvasPrevieWidth - gapPreview * 3) / aSum0;
        let h1 = (canvasPrevieWidth - gapPreview * 3) / aSum1;

        if (h0 + h1 + gapPreview * 3 > canvasPrevieHeight) {
          const sf = (canvasPrevieHeight - gapPreview * 3) / (h0 + h1);
          h0 *= sf;
          h1 *= sf;
        }

        const row = Math.floor(i / 2);
        const col = i % 2;
        const rowH = row === 0 ? h0 : h1;
        const a0InRow = row === 0 ? count4Aspects[0] : count4Aspects[2];
        const a1InRow = row === 0 ? count4Aspects[1] : count4Aspects[3];
        const a = col === 0 ? a0InRow : a1InRow;

        slotH = rowH;
        slotW = a * rowH;
        const totalH = h0 + h1 + gapPreview * 3;
        const startY = (canvasPrevieHeight - totalH) / 2 + gapPreview;
        slotY = row === 0 ? startY : startY + h0 + gapPreview;
        const rowTotalW = (a0InRow + a1InRow) * rowH + gapPreview;
        const rowStartX = (canvasPrevieWidth - rowTotalW) / 2;
        slotX = col === 0 ? rowStartX : rowStartX + a0InRow * rowH + gapPreview;
      }

      const { width: fittedW, height: fittedH } = fitInside(
        img.imageWidth,
        img.imageHeight,
        slotW,
        slotH
      );
      const cx = slotX + slotW / 2;
      const cy = slotY + slotH / 2;

      const newImagePreview: ElementImageObject = {
        id: `collage-${Date.now()}-${Math.random()}`,
        type: "image",
        x: cx,
        y: cy,
        width: fittedW,
        height: fittedH,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        selected: false,
        locked: false,
        editable: true,
        zIndex: canvasObjects[index].length,
        originalData: [collageImages[i]],
        data: {
          src: img.src,
          preserveAspectRatio: "xMidYMid meet",
        },
      };

      canvasObjects[index].push(newImagePreview);
    }

    if (!deferStateUpdate) {
      setCanvasObjects([...canvasObjects]);
      setMainObject([...mainObject]);
    }
  };

  const addBgImage = async (
    imageData: any,
    type: string = "",
    index: number,
    isMarraged: any,
    id: any,
    deferStateUpdate: boolean = false,
    useCover: boolean = false
  ) => {
    if (!imageData) return;

    const srcW = imageData.imageWidth || canvasWidth;
    const srcH = imageData.imageHeight || canvasHeight;
    const { width: fittedW, height: fittedH } = fitInside(srcW, srcH, canvasWidth, canvasHeight);
    const wrapperW = useCover ? canvasWidth : fittedW;
    const wrapperH = useCover ? canvasHeight : fittedH;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const newImage: ElementImageObject = {
      id: id,
      type: "image",
      x: centerX,
      y: centerY,
      width: wrapperW,
      height: wrapperH,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      selected: false,
      locked: false,
      editable: true,
      zIndex: mainObject.length,
      data: {
        src: imageData.src,
        preserveAspectRatio: "xMidYMid meet",
        imageHeight: imageData.imageHeight,
        imageWidth: imageData.imageWidth,
        coverCanvas: useCover || undefined,
        objectPosition: useCover ? "50% 50%" : undefined,
      },
    };

    if (index == 0) {
      mainObject.push(newImage);
      if (!deferStateUpdate) {
        setMainObject(mainObject);
      }
    }

    const { width: fittedPreviewW, height: fittedPreviewH } = fitInside(
      srcW,
      srcH,
      canvasPrevieWidth,
      canvasPrevieHeight
    );
    const previewW = useCover ? canvasPrevieWidth : fittedPreviewW;
    const previewH = useCover ? canvasPrevieHeight : fittedPreviewH;

    const centerPreviewX = canvasPrevieWidth / 2;
    const centerPreviewY = canvasPrevieHeight / 2;

    const newImagePreview: ElementImageObject = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type: "image",
      x: centerPreviewX,
      y: centerPreviewY,
      width: previewW,
      height: previewH,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      selected: false,
      locked: false,
      editable: true,
      zIndex: canvasObjects[index]?.length || 0,
      originalData: [newImage],
      data: {
        src: imageData.src,
        preserveAspectRatio: "xMidYMid meet",
        coverCanvas: useCover || undefined,
        objectPosition: useCover ? "50% 50%" : undefined,
      },
    };

    if (!canvasObjects[index]) canvasObjects[index] = [];
    canvasObjects[index].push(newImagePreview);

    if (!deferStateUpdate) {
      setCanvasObjects([...canvasObjects]);
    }

    if (deferStateUpdate) {
      return;
    }

    selectObject(newImage, { stopPropagation: () => { } } as React.MouseEvent, 0);

    const updatedElementsList = [
      ...elementsList,
      {
        id: newImage.id,
        type,
        name: type === "sticker" ? "Sticker" : "Image",
      },
    ];
    setElementsList(updatedElementsList);
    hideAdditionalPanel();
    setShowLeftPanel(false);
    saveHistory();
  };


  const addMarrageText = (text: any, x: any, y: any, font: any) => {
    const newText: ElementTextObject = {
      id: `text-${Date.now()}-${Math.random()}`,
      type: "text",
      x: x,
      y: y,
      width: 300,
      height: 50,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      selected: false,
      locked: false,
      editable: true,
      zIndex: 9999,
      data: {
        text: text,
        fontSize: font,
        fontFamily: "Arial",
        fill: "#000000",
        textAlign: "center",
      },
    };

    const updatedObjects = [...canvasObjects];
    if (!updatedObjects[0]) {
      updatedObjects[0] = [];
    }
    mainObject.push(newText);
    setMainObject(mainObject);

    let PreviewUpdateData: any = {
      id: `text-${Date.now()}-${Math.random()}`,
      type: "text",
      x: x - 300,
      y: y - 45,
      width: 100,
      height: 20,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      selected: false,
      locked: false,
      editable: false,
      zIndex: getCurrentCanvasObjects().length,
      originalData: [newText],
      data: {
        text: text,
        fontSize: 10,
        fontFamily: "Arial",
        fill: "#000000",
        textAlign: "center",
      },
    };
    setpreviewCartId(PreviewUpdateData);
    canvasObjects[0].push(PreviewUpdateData);
    setCanvasObjects(canvasObjects);

    setShowAdditionalPanel(false);
    selectObject(
      newText,
      { stopPropagation: () => { } } as React.MouseEvent,
      0
    );

    const updatedElementsList = [...elementsList];
    updatedElementsList.push({ id: newText.id, type: "text", name: "Text" });
    setElementsList(updatedElementsList);
    saveHistory();
    setTimeout(
      () =>
        startTextEdit(newText, {
          stopPropagation: () => { },
        } as React.MouseEvent),
      100
    );
  };


  const addImageToCanvas = async (imageSrc: string, type: string = "") => {
    if (type === "shape-container" && selectedObject?.type === "shape" && isShapeImageMode) {
      addImageToShape(imageSrc, selectedObject as ElementShapeObject);
      hideAdditionalPanel();
      return;
    }

    if (selectedObject && selectedObject.type === "image" && selectedObject.editable !== false) {
      Swal.fire({
        title: "Do you want to change this image?",
        text: "This action will replace the current image.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, change it",
        cancelButtonText: "No, keep it",
      }).then((result) => {
        if (result.isConfirmed) {
          const updatedObjects = [...mainObject];
          const objIndex = updatedObjects.findIndex((o) => o.id === selectedObject.id);
          if (objIndex !== -1) {
            (updatedObjects[objIndex] as ElementImageObject).data.src = imageSrc;
            setMainObject(updatedObjects);
          }

          const objMainIndex = canvasObjects[canvasActiveIndex].findIndex(
            (o: any) => o.originalData[0].id === selectedObject.id
          );

          if (objMainIndex !== -1) {
            (canvasObjects[canvasActiveIndex][objMainIndex] as ElementImageObject).data.src = imageSrc;
            setCanvasObjects(canvasObjects);
          }
          hideAdditionalPanel();
        }
      });

      return;
    }

    type = type === "" ? "image" : type;
    const isRegularImage = type === "image";

    const finalizeAdd = (
      mainW: number,
      mainH: number,
      prevW: number,
      prevH: number,
      withCover: boolean
    ) => {
      const newImage: ElementImageObject = {
        id: `${type}-${Date.now()}-${Math.random()}`,
        type: "image",
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        width: mainW,
        height: mainH,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        selected: false,
        locked: false,
        editable: true,
        zIndex: mainObject.length,
        data: {
          src: imageSrc,
          coverCanvas: withCover,
          preserveAspectRatio: "xMidYMid meet",
        },
      };

      mainObject.push(newImage);
      setMainObject(mainObject);

      const newImagePreview: ElementImageObject = {
        id: `${type}-${Date.now()}-${Math.random()}`,
        type: "image",
        x: (canvasPrevieHeight + 55) / 2,
        y: canvasPrevieHeight / 2,
        width: prevW,
        height: prevH,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        selected: false,
        locked: false,
        editable: true,
        zIndex: canvasObjects[canvasActiveIndex].length,
        originalData: [newImage],
        data: {
          src: imageSrc,
          coverCanvas: withCover,
          preserveAspectRatio: "xMidYMid meet",
        },
      };

      canvasObjects[canvasActiveIndex].push(newImagePreview);
      setCanvasObjects(canvasObjects);
      selectObject(newImage, { stopPropagation: () => { } } as React.MouseEvent, 0);

      const updatedElementsList = [...elementsList];
      updatedElementsList.push({
        id: newImage.id,
        type,
        name: type === "sticker" ? "Sticker" : "Image",
      });

      setElementsList(updatedElementsList);
      hideAdditionalPanel();
      setShowLeftPanel(false);
      saveHistory();
    };

    if (isRegularImage) {
      const probe = new window.Image();
      probe.crossOrigin = "anonymous";
      probe.onload = () => {
        const srcW = probe.naturalWidth || canvasWidth;
        const srcH = probe.naturalHeight || canvasHeight;
        const main = fitInside(srcW, srcH, canvasWidth, canvasHeight);
        const prev = fitInside(srcW, srcH, canvasPrevieWidth, canvasPrevieHeight);
        finalizeAdd(main.width, main.height, prev.width, prev.height, false);
      };
      probe.onerror = () => {
        finalizeAdd(canvasWidth, canvasHeight, canvasPrevieWidth, canvasPrevieHeight, true);
      };
      probe.src = imageSrc;
    } else {
      finalizeAdd(150, 150, 150 / 4, 150 / 4, false);
    }
  };


  const addShape = (shapeType: "square" | "circle" | "rectangle") => {
    const newShape: ElementShapeObject = {
      id: `shape-${shapeType}-${Date.now()}-${Math.random()}`,
      type: "shape",
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      width: shapeType === "circle" ? 120 : 150,
      height: shapeType === "circle" ? 120 : 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      selected: false,
      locked: false,
      editable: true,
      zIndex: mainObject.length,
      shapeImage: {},
      data: {
        shapeType,
        fill: "#fff",
        stroke: "#0ba28d4d",
        strokeWidth: 3,
        strokeDashArray: "",
      },
    };

    //===// mainObject में नया shape डालना //===//
    mainObject.push(newShape);
    setMainObject(mainObject);
    const newShapePreview: ElementShapeObject = {
      id: `shape-${shapeType}-${Date.now()}-${Math.random()}`,
      type: "shape",
      x: canvasPrevieWidth / 2,
      y: canvasPrevieHeight / 2,
      width: shapeType === "circle" ? 120 / 3 : 150 / 3,
      height: shapeType === "circle" ? 120 / 3 : 100 / 3,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      selected: false,
      locked: false,
      editable: true,
      zIndex: canvasObjects[canvasActiveIndex].length,
      shapeImage: {},
      originalData: [newShape],
      data: {
        shapeType,
        fill: "#fff",
        stroke: "#0ba28d4d",
        strokeWidth: 3,
        strokeDashArray: "",
      },
    };

    canvasObjects[canvasActiveIndex].push(newShapePreview);
    setCanvasObjects(canvasObjects);
    selectObject(newShape, { stopPropagation: () => { } } as React.MouseEvent, 0);

    //===// elementsList update करना //===//
    const updatedElementsList = [...elementsList];
    updatedElementsList.push({
      id: newShape.id,
      type: "shape",
      name: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} Shape`,
    });
    setElementsList(updatedElementsList);
    hideChildPanel();
    saveHistory();
  };


  //===// Shape image container methods //===//
  const addImageToShape = (imageSrc: string, shape: ElementShapeObject) => {
    const newImage: ElementImageObject = {
      id: `contained-image-${Date.now()}-${Math.random()}`,
      type: "image",
      x: 0,
      y: 0,
      width: Math.min(shape.width || 100, 150),
      height: Math.min(shape.height || 100, 150),
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      selected: false,
      locked: false,
      editable: true,
      containerShape: shape.id,
      data: {
        src: imageSrc,
        preserveAspectRatio: "xMidYMid slice",
      },
    };

    const updatedObjects = [...mainObject];
    const objIndex = updatedObjects.findIndex((o) => o.id === shape.id);

    if (objIndex !== -1) {
      (updatedObjects[objIndex] as ElementShapeObject).shapeImage = newImage;
      setMainObject(updatedObjects);
    }
  };

  function createLayoutTextObject(text: any, x: any, y: any, width: any, height: any) {
    return {
      id: `layout-text-${Date.now()}-${Math.random()}`,
      type: "layoutText",
      x,
      y,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      selected: false,
      locked: false,
      editable: true,
      zIndex: getCurrentCanvasObjects().length,
      data: {
        text,
        fontSize: Math.min(Math.max(Math.floor(height / 4), 16), 20),
        fontFamily: "Arial",
        fill: "rgba(11, 162, 141, 0.1)",
        textAlign: "center",
        textColor: "#333333",
        stroke: "#0ba28d",
        strokeWidth: 2,
      },
    };
  }

  const onApplyLayout = (layout: any) => {
    const layoutExists = elementsList.some((el) => el.name === "layout");

    if (layoutExists) {
      Swal.fire({
        title: "You're about to change layouts",
        text: "Existing customizations will be lost",
        confirmButtonText: "Yes",
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          clearLayout();
          createLayout(layout);
        }
      });
    } else {
      createLayout(layout);
    }
  };

  const createLayout = (layout: any) => {
    let newCanvasObjects = [...mainObject];
    const canvas = [...newCanvasObjects];
    const newElementsList = [...elementsList];
    const margin = 40;
    const gap = 20;
    const availableWidth = canvasWidth - 2 * margin + 40;
    const availableHeight = canvasHeight - 2 * margin;

    if (layout === 1) {
      const sectionHeight = (availableHeight - gap) / 2;
      const section1: any = createLayoutTextObject(
        "Add Text",
        canvasWidth / 2,
        margin + sectionHeight / 2,
        availableWidth,
        sectionHeight
      );

      const section2: any = createLayoutTextObject(
        "Add Text",
        canvasWidth / 2,
        margin + sectionHeight + gap + sectionHeight / 2,
        availableWidth,
        sectionHeight
      );

      canvas.push(section1, section2);
      newElementsList.push(
        { id: section1.id, type: "layoutText", name: "layout" },
        { id: section2.id, type: "layoutText", name: "layout" }
      );
    } else if (layout === 2) {
      //===// 3 horizontal sections //===//
      const sectionHeight = (availableHeight - 2 * gap) / 3;
      const sections: any = [0, 1, 2].map((i) => {
        const y = margin + i * (sectionHeight + gap) + sectionHeight / 2;
        return createLayoutTextObject(
          "Add Text",
          canvasWidth / 2,
          y,
          availableWidth,
          sectionHeight
        );
      });

      canvas.push(...sections);
      sections.forEach((section: any) => {
        newElementsList.push({
          id: section.id,
          type: "layoutText",
          name: "layout",
        });
      });
    } else if (layout === 3) {
      //===// Mixed layout //===//
      const leftWidth = (availableWidth - gap) * 0.6;
      const rightWidth = (availableWidth - gap) * 0.4;
      const rightHeight = (availableHeight - gap) / 2;

      const leftSection: any = createLayoutTextObject(
        "Main Content Area",
        margin - 20 + leftWidth / 2,
        canvasHeight / 2,
        leftWidth,
        availableHeight
      );

      const rightTop: any = createLayoutTextObject(
        "Header Text",
        margin - 20 + leftWidth + gap + rightWidth / 2,
        margin + rightHeight / 2,
        rightWidth,
        rightHeight
      );

      const rightBottom: any = createLayoutTextObject(
        "Footer Text",
        margin - 20 + leftWidth + gap + rightWidth / 2,
        margin + rightHeight + gap + rightHeight / 2,
        rightWidth,
        rightHeight
      );

      canvas.push(leftSection, rightTop, rightBottom);
      [leftSection, rightTop, rightBottom].forEach((section) => {
        newElementsList.push({
          id: section.id,
          type: "layoutText",
          name: "layout",
        });
      });
    }

    newCanvasObjects = canvas;
    setMainObject(canvas);
    setElementsList(newElementsList);
    createPagePrevieLayout(layout, newCanvasObjects);
    saveHistory();
  };

  const clearLayout = () => {
    return new Promise<void>((resolve) => {
      let newminObject = mainObject;
      const canvas = [...newminObject];
      const newElementsList = [...elementsList];
      const layoutIndices: number[] = [];


      //===// loop backwards so splice doesn't mess indices //===//
      for (let i = canvas.length - 1; i >= 0; i--) {
        const obj = canvas[i];
        const elemIndex = newElementsList.findIndex(
          (el) => el.id === obj.id && el.name === "layout"
        );
        if (elemIndex > -1) {
          layoutIndices.push(i);
          newElementsList.splice(elemIndex, 1);
        }
      }
      //===// remove layouts from canvas //===//
      layoutIndices.forEach((index) => canvas.splice(index, 1));

      //===// update canvasObjects //===//
      newminObject = canvas;
      // setCanvasObjects(newminObject);
      setElementsList(newElementsList);
      mainObject = newminObject;
      setMainObject(newminObject);

      //===============// main pages remove //===============//
      let newminObjectPreview = [...canvasObjects];
      const canvasPreview = [...newminObjectPreview[canvasActiveIndex]];
      const newElementsListPreview = [...elementsList];
      const layoutIndicesPreview: number[] = [];
      for (let i = canvasPreview.length - 1; i >= 0; i--) {
        const obj = canvasPreview[i];
        const elemIndex = newElementsListPreview.findIndex((el) => el.id === obj.id && el.name === "layout");
        if (elemIndex > -1) {
          layoutIndicesPreview.push(i);
          newElementsListPreview.splice(elemIndex, 1);
        }
      }
      //===// remove layouts from canvas //===//
      layoutIndicesPreview.forEach((index) => canvas.splice(index, 1));

      //===// update canvasObjects //===//
      canvasObjects[canvasActiveIndex] = canvas;
      setCanvasObjects(newminObjectPreview);
      console.log(canvasObjects);

      resolve();
    });
  };

  const createPagePrevieLayout = (layout: any, originalData: any) => {
    const newCanvasObjects = [...canvasObjects];
    const canvas: any = [...newCanvasObjects[canvasActiveIndex]];
    const newElementsList = [...elementsList];
    const margin = 40;
    const gap = 20;

    const availableWidth = canvasPrevieWidth - 2 * margin + 40;
    const availableHeight = (canvasPrevieHeight + 40) - 2 * margin;

    console.log(availableHeight);


    if (layout === 1) {
      // 2 horizontal sections
      const sectionHeight = (availableHeight - gap) / 2;

      const section1: any = createLayoutPagePreview(
        "Add Text",
        canvasPrevieWidth / 2,
        (margin + sectionHeight + 10) / 2,
        availableWidth + 20,
        sectionHeight + 10
      );

      const section2: any = createLayoutPagePreview(
        "Add Text",
        canvasPrevieWidth / 2,
        (margin - 20) + sectionHeight + gap + sectionHeight / 2,
        availableWidth + 20,
        sectionHeight + 10
      );

      canvas.push(section1, section2);
      newElementsList.push(
        { id: section1.id, type: "layoutText", name: "layout" },
        { id: section2.id, type: "layoutText", name: "layout" }
      );
    } else if (layout === 2) {
      // 3 horizontal sections
      const sectionHeight = (availableHeight - 2 * gap) / 3;

      const sections: any = [0, 1, 2].map((i) => {
        const y = (margin - 20) + i * (sectionHeight + gap) + sectionHeight / 2;
        return createLayoutPagePreview(
          "Add Text",
          canvasPrevieWidth / 2,
          y,
          availableWidth + 20,
          sectionHeight + 10
        );
      });

      canvas.push(...sections);
      sections.forEach((section: any) => {
        newElementsList.push({
          id: section.id,
          type: "layoutText",
          name: "layout",
        });
      });
    } else if (layout === 3) {
      // Mixed layout
      const leftWidth = (availableWidth - gap) * 0.6;
      const rightWidth = (availableWidth - gap) * 0.4;
      const rightHeight = (availableHeight - gap) / 2;

      const leftSection: any = createLayoutPagePreview(
        "Main Content Area",
        margin - 20 + leftWidth / 2,
        canvasPrevieHeight / 2,
        leftWidth + 20,
        availableHeight + 10
      );

      const rightTop: any = createLayoutPagePreview(
        "Header Text",
        margin - 20 + leftWidth + gap + rightWidth / 2,
        (margin - 20) + rightHeight / 2,
        rightWidth + 10,
        rightHeight + 10
      );

      const rightBottom: any = createLayoutPagePreview(
        "Footer Text",
        margin - 20 + leftWidth + gap + rightWidth / 2,
        (margin - 20) + rightHeight + gap + rightHeight / 2,
        rightWidth + 10,
        rightHeight + 10
      );

      canvas.push(leftSection, rightTop, rightBottom);
      [leftSection, rightTop, rightBottom].forEach((section) => {
        newElementsList.push({
          id: section.id,
          type: "layoutText",
          name: "layout",
        });
      });
    }

    let mergedData = canvas.map((item: any, index: any) => ({
      ...item,
      originalData: [originalData[index]]
    }));

    newCanvasObjects[canvasActiveIndex] = mergedData;

    setCanvasObjects(newCanvasObjects);
    hideChildPanel();
    saveHistory();
  };

  function createLayoutPagePreview(text: any, x: any, y: any, width: any, height: any) {
    return {
      id: `layout-text-${Date.now()}-${Math.random()}`,
      type: "layoutText",
      x,
      y,
      width,
      height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      selected: false,
      locked: false,
      editable: true,
      zIndex: getCurrentCanvasObjects().length,
      data: {
        text,
        fontSize: 8,
        fontFamily: "Arial",
        fill: "rgba(11, 162, 141, 0.1)",
        textAlign: "center",
        textColor: "#333333",
        stroke: "#0ba28d",
        strokeWidth: 2,
      },
    };
  }


  const onFontSizeSelect = (event: { size: number; forall?: boolean }) => {

    const updatedObjects = [...canvasObjects];

    if (event.forall !== true) {
      //===// Update only selected object //===//
      if (selectedObject && (selectedObject.type === "text" || selectedObject.type === "layoutText")) {
        const objIndex = updatedObjects[canvasActiveIndex].findIndex(
          (o) => o.originalData[0].id === selectedObject.id
        );
        if (objIndex !== -1) {
          updatedObjects[canvasActiveIndex][objIndex] = {
            ...updatedObjects[canvasActiveIndex][objIndex],
            data: {
              ...updatedObjects[canvasActiveIndex][objIndex].data,
              fontSize: event.size / 3,
            },
          };
          updatedObjects[canvasActiveIndex][objIndex].originalData[0].data.fontSize = event.size;
          mainObject[0].data.fontSize = event.size;
        }
      }
    } else {
      //===// Apply to all text/layoutText objects on this canvas //===//
      updatedObjects[canvasActiveIndex] = updatedObjects[canvasActiveIndex].map((obj) =>
        obj.type === "text" || obj.type === "layoutText" ? { ...obj, data: { ...obj.data, fontSize: event.size }, } : obj);
    }


    setSelectedSize(event.size);
    saveHistory();
  };

  const onFontSelect = (event: { font: any; forall?: boolean }) => {
    const updatedObjects = [...canvasObjects];
    if (event.forall !== true) {
      if (selectedObject && (selectedObject.type === "text" || selectedObject.type === "layoutText")) {
        const objIndex = updatedObjects[canvasActiveIndex].findIndex(
          (o) => o.originalData[0].id === selectedObject.id
        );
        if (objIndex !== -1) {
          updatedObjects[canvasActiveIndex][objIndex] = {
            ...updatedObjects[canvasActiveIndex][objIndex],
            data: {
              ...updatedObjects[canvasActiveIndex][objIndex].data,
              fontFamily: event.font.fontFamily,
              fontFamilyName: event.font.name,
            },
          };
          updatedObjects[canvasActiveIndex][objIndex].originalData[0].data.fontFamily = event.font.fontFamily;
          updatedObjects[canvasActiveIndex][objIndex].originalData[0].data.fontFamilyName = event.font.name;
          mainObject[0].data.fontFamily = event.font.fontFamily;
          mainObject[0].data.fontFamilyName = event.font.name;
        }
      }
      setMainObject(mainObject);
      console.log(mainObject);

    } else {
      setCanvasObjects((prev) => {
        const updated = [...prev];
        updated[canvasActiveIndex] = updated[canvasActiveIndex].map((obj) =>
          obj.type === "text" || obj.type === "layoutText"
            ? { ...obj, data: { ...obj.data, fontFamily: event.font } }
            : obj
        );
        return updated;
      });
    }

    setSelectedFontFamily(event.font);
    saveHistory();
  };

  const deleteObject = () => {
    if (selectedObject) {
      // 1. Remove from mainObject
      const updatedObjects = mainObject.filter(
        (obj: ElementObject) => obj.id !== selectedObject.id
      );
      setMainObject(updatedObjects);

      // 2. Remove from elementsList
      const updatedElementsList = elementsList.filter(
        (el) => el.id !== selectedObject.id
      );
      setElementsList(updatedElementsList);

      // 2. Remove from all pages array
      const updatedPagesObjects: any = canvasObjects[canvasActiveIndex].filter(
        (obj: any) => obj.originalData[0].id !== selectedObject.id
      );
      canvasObjects[canvasActiveIndex] = updatedPagesObjects;
      setCanvasObjects(canvasObjects);

      // 3. Clear selection
      setSelectedObject(null);
      saveHistory();
    }
  };


  const onCanvasSelect = (index: number) => {
    const selectedCanvas = canvasObjects?.[index] || [];
    if (selectedCanvas.length > 0 && "originalData" in selectedCanvas[0]) {
      const allOriginalData = selectedCanvas.filter((item: any) => Array.isArray(item.originalData)).flatMap((item: any) => item.originalData);
      const uniqueOriginalData = allOriginalData.filter((obj: any, index: number, self: any) => index === self.findIndex((o: any) => o.id === obj.id));
      mainObject = uniqueOriginalData;
    } else {
      mainObject = selectedCanvas;
    }

    const updatedBackgrounds = [...canvasBackgrounds];
    // setCanvasBackgrounds(updatedBackgrounds);
    setSelectedBgColor(updatedBackgrounds[index]);
    setMainObject(mainObject);
    clearSelection();
    setCanvasActiveIndex(index);
    showMainTools();
  };


  //===// UI panel management //===//
  const showMainTools = () => {
    hideChildPanel();
    setShowLeftPanel(true);
    setShowImagePanel(false);
    setSelectedObject(null);

    if (!showBgColorPanel) {
      setShowAdditionalPanel(false);
    }
  };

  const showObjectTools = () => {
    setShowLeftPanel(false);
    setShowImagePanel(true);
  };

  const updateUIForSelectedObject = (obj: ElementObject) => {
    setSelectedType(obj.type);
    switch (obj.type) {
      case "text":
      case "layoutText":
        setSelectedSize(obj.data.fontSize);
        setSelectedColor(obj.data.fill);
        setSelectedFontFamily(obj.data);
        break;
    }

    setSelectedAngle(obj.rotation);
    setSelectedScale(obj.scaleX);
  };

  const hideAdditionalPanel = () => {
    setShowImageLibraryPanel(false);
    setShowLayoutPanel(false);
    setArrangePagesPanel(false)
    setShowShapesLibraryPanel(false);
    setShowAdditionalPanel(false);
    setShowImagePanel(false);
    setShowBgColorPanel(false);
    setShowVideoPanel(false);
    setShowAudioPanel(false);
    setShowHandwritingPanel(false);
    setShowDatesPanel(false);
    setShowImageLayout(false);
    setShowLeftPanel(true);
  };

  const openSidePannel = () => {
    setIsOpen(!isOpen);
  };

  const hideChildPanel = () => {
    setShowShapesLibraryPanel(false);
    setShowAdditionalPanel(false);
    setShowImageLibraryPanel(false);
    setShowTextSizePanel(false);
    setShowTextFontPanel(false);
    setShowTextColorPanel(false);
    setShowScalePanel(false);
    setShowRotationPanel(false);
    setShowImageLayout(false);
    setShowBgColorPanel(false);
    setShowStickerChildPanel(false);
    setShowEmojiChildPanel(false);
    setShowVideoPanel(false);
    setShowAudioPanel(false);
    setShowHandwritingPanel(false);
    setShowLayoutPanel(false);
    setArrangePagesPanel(false)
    setShowDatesPanel(false);
  };

  //===// Panel opening methods //===//
  const openImageLibrary = () => {
    hideChildPanel();
    setShowImagePanel(true);
    setShowImageLibraryPanel(true);
    setShowAdditionalPanel(true);
    setShowLeftPanel(true);
  };

  const openDates = () => {
    hideChildPanel();
    setShowDatesPanel(true)
    setShowAdditionalPanel(true);
    setShowLeftPanel(true);
  }

  const handleDateIconTap = (id: string, index: number) => {
    const input = document.getElementById(`${id}-${index}`) as HTMLInputElement | null;
    if (!input) return;

    //===// Temporarily make input visible for iOS/Android to trigger picker //===//
    input.style.visibility = "visible";
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.style.pointerEvents = "auto";
    input.focus();

    //===// Small delay for iOS to detect focus before click //===//
    setTimeout(() => {
      try {
        if (typeof input.showPicker === "function") {
          input.showPicker();
        } else {
          input.click();
        }
      } catch {
        input.click();
      }

      // Hide again after a short delay
      // setTimeout(() => {
      //   input.style.visibility = "hidden";
      //   input.style.position = "absolute";
      //   input.style.pointerEvents = "none";
      // }, 500);
    }, 50);
  };




  const openShapeLibrary = () => {
    hideChildPanel();
    setShowShapesLibraryPanel(true);
    setShowImagePanel(false);
    setShowAdditionalPanel(true);
    setShowLeftPanel(false);
  };

  const openBgColor = () => {
    hideChildPanel();
    setShowLeftPanel(true);
    setShowAdditionalPanel(true);
    setShowBgColorPanel(true);
  };

  const openLayout = () => {
    hideChildPanel();
    setShowLeftPanel(true);
    setShowLayoutPanel(true);
    setShowAdditionalPanel(true);
  };

  const openArrangePages = () => {
    hideChildPanel();
    setShowLeftPanel(true);
    setArrangePagesPanel(true);
    setShowAdditionalPanel(true);
  }

  const openVideoPanel = () => {
    const videoElements = elementsList.filter((x) => x.type === "video");
    const audioElements = elementsList.filter((x) => x.type === "audio");

    if (videoElements.length > 0) {
      const elementId = videoElements[0].id;
      const canvasEl: any = canvasObjects[canvasActiveIndex]?.find(
        (x: any) => x.id === elementId
      );
      selectObject(
        canvasEl,
        { stopPropagation: () => { } } as React.MouseEvent,
        canvasActiveIndex
      );
    } else {
      if (audioElements.length > 0) {
        Swal.fire({
          title: "We can't support both!",
          text: "If you want to add a video message, it will replace audio.",
          confirmButtonText: "Replace",
          showCancelButton: true,
        }).then((result) => {
          if (result.isConfirmed) {
            hideChildPanel();
            setShowVideoPanel(true);
            setShowAdditionalPanel(true);
            setIsTermsAccepted(false);
            // In React, you'd call a state updater or context instead of `this.additionalPanel$.next(true)`
          }
        });
      } else {
        hideChildPanel();
        setShowVideoPanel(true);
        setShowAdditionalPanel(true);
        setIsTermsAccepted(false);
      }
    }
  };

  const openAudioPanel = () => {
    const audioElements = elementsList.filter((x) => x.type === "audio");
    const videoElements = elementsList.filter((x) => x.type === "video");

    if (audioElements.length > 0) {
      const elementId = audioElements[0].id;
      const canvasEl: any = canvasObjects[canvasActiveIndex]?.find(
        (x: any) => x.id === elementId
      );
      selectObject(
        canvasEl,
        { stopPropagation: () => { } } as React.MouseEvent,
        canvasActiveIndex
      );
    } else {
      if (videoElements.length > 0) {
        Swal.fire({
          title: "We can't support both!",
          text: "If you want to add an audio message, it will replace video.",
          confirmButtonText: "Replace",
          showCancelButton: true,
        }).then((result) => {
          if (result.isConfirmed) {
            hideChildPanel();
            setShowAudioPanel(true);
            setShowAdditionalPanel(true);
            setIsTermsAccepted(false);
          }
        });
      } else {
        hideChildPanel();
        setShowAudioPanel(true);
        setShowAdditionalPanel(true);
        setIsTermsAccepted(false);
      }
    }
  };

  const openEmojiPanel = () => {
    hideChildPanel();
    setShowLeftPanel(true);
    setShowAdditionalPanel(true);
    setShowEmojiPanel(true);
    setShowEmojiChildPanel(true);

    setTimeout(() => {
      const emojiPanelEl = document.querySelector("#emojiPanel");
      if (!emojiPanelEl || emojiPanelEl.childElementCount === 0) {
        emojiPicker();
      }
    }, 250);
  };

  function openStickerPanel() {
    hideChildPanel();
    setShowLeftPanel(true);
    setShowAdditionalPanel(true);
    setShowStickerPanel(true);
    setShowStickerChildPanel(true);
  }


  const emojiPicker = async () => {
    const { Picker, data } = await loadEmojiPicker();
    new Picker({
      parent: document.querySelector("#emojiPanel"),
      data: data,
      emojiButtonSize: 50,
      emojiSize: 38,
      dynamicWidth: true,
      maxFrequentRows: 0,
      previewPosition: "none",
      navPosition: "none",
      onEmojiSelect: (event: any) => {
        const emojiImageUrl = getEmojiImageUrl(
          event.unified || event.id || event.native
        );

        const newEmoji: any = {
          id: `emoji-${Date.now()}-${Math.random()}`,
          type: "emoji",
          x: canvasWidth / 2,
          y: canvasHeight / 2,
          width: 60,
          height: 60,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          selected: false,
          locked: false,
          editable: false,
          zIndex: mainObject.length,
          data: {
            src: emojiImageUrl,
            preserveAspectRatio: "xMidYMid meet",
          },
        };
        mainObject.push(newEmoji);
        setMainObject(mainObject);

        //===============// main pages Add //===============//
        const newEmojiPreview: any = {
          id: `emoji-${Date.now()}-${Math.random()}`,
          type: "emoji",
          x: canvasPrevieWidth / 2,
          y: canvasPrevieHeight / 2,
          width: 60 / 3,
          height: 60 / 3,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          selected: false,
          locked: false,
          editable: false,
          zIndex: canvasObjects[canvasActiveIndex].length,
          originalData: [newEmoji],
          data: {
            src: emojiImageUrl,
            preserveAspectRatio: "xMidYMid meet",
          },
        };

        canvasObjects[canvasActiveIndex].push(newEmojiPreview);
        setCanvasObjects(canvasObjects);

        // Select emoji
        selectObject(newEmoji, { stopPropagation: () => { } } as React.MouseEvent, 0);

        // Add in elements list
        setElementsList((prev) => [
          ...prev,
          { id: newEmoji.id, type: "emoji", name: event.name || "Emoji" },
        ]);

        hideChildPanel();
        saveHistory();
      },
    });
  };


  // Put this inside your component (above emojiPicker or at top of file)
  const getEmojiImageUrl = (unified: string): string => {
    if (unified) {
      return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${unified.toLowerCase()}.png`;
    }
    return "";
  };

  const doneWithSelection = () => {
    clearSelection();
    showMainTools();
  };

  //===== OBJECT PROPERTY PANELS =====//
  const _showScalePanel = () => {
    hideChildPanel();
    setShowAdditionalPanel(true);
    setShowScalePanel(true);
  };

  const _showRotationPanel = () => {
    hideChildPanel();
    setShowAdditionalPanel(true);
    setShowRotationPanel(true);
  };

  const _showTextSizePanel = () => {
    hideChildPanel();
    setShowAdditionalPanel(true);
    setShowTextSizePanel(true);
  };

  const _showTextFontPanel = () => {
    hideChildPanel();
    setShowAdditionalPanel(true);
    setShowTextFontPanel(true);
  };

  const _showTextColorPanel = () => {
    hideChildPanel();
    setShowAdditionalPanel(true);
    setShowTextColorPanel(true);
  };

  //===// Property update methods //===//
  const onBgColorSelect = (color: any) => {
    const updatedBackgrounds = [...canvasBackgrounds];
    updatedBackgrounds[canvasActiveIndex] = color.color;
    setCanvasBackgrounds(updatedBackgrounds);
    setSelectedBgColor(color.color);
    saveHistory();
  };

  const onColorSelect = (color: any, forAll = false) => {
    let updated = [...mainObject];
    let updatedPreview: any = [...canvasObjects];

    if (!forAll && selectedObject) {
      updated = updated.map((obj: ElementObject) => {
        if (obj.id === selectedObject.id) {
          if (obj.type === "layoutText") {
            return {
              ...obj,
              data: {
                ...obj.data,
                textColor: color.color,
              },
            };
          } else if (obj.type === "text") {
            return {
              ...obj,
              data: {
                ...obj.data,
                fill: color.color,
              },
            };
          }
        }
        return obj;
      });
      //====// for Page Preview //====//
      updatedPreview[canvasActiveIndex] = updatedPreview[canvasActiveIndex].map((obj: any) => {
        if (obj.originalData[0].id === selectedObject.id) {
          if (obj.type === "layoutText") {
            obj.originalData[0].data.textColor = color.color;
            return {
              ...obj,
              data: {
                ...obj.data,
                textColor: color.color,
              },
            };
          } else if (obj.type === "text") {
            obj.originalData[0].data.fill = color.color;
            return {
              ...obj,
              data: {
                ...obj.data,
                fill: color.color,
              },
            };
          }
        }
        return obj;
      });
    } else if (forAll) {
      updated = updated.map((obj: ElementObject) => {
        if (obj.type === "text" || obj.type === "layoutText") {
          return {
            ...obj,
            data: {
              ...obj.data,
              [obj.type === "layoutText" ? "textColor" : "fill"]: color.color,
            },
          };
        }
        return obj;
      });
    }

    setMainObject(updated);
    setCanvasObjects(updatedPreview)
    // setSelectedColor(color.color); // optional state update
    saveHistory();
  };


  //===// Scale change Update //===//
  const onScaleUpdate = (scale: number) => {
    if (selectedObject) {
      const updated = mainObject.map((obj: ElementObject) => obj.id === selectedObject.id
        ? { ...obj, scaleX: scale, scaleY: scale } : obj
      );
      setMainObject(updated);
    }

    setSelectedScale(scale);
    saveHistory();
  };

  //===// Angle change Update //===//
  const onAngleUpdate = (angle: number) => {
    if (selectedObject) {
      const updated = mainObject.map((obj: ElementObject) =>
        obj.id === selectedObject.id ? { ...obj, rotation: angle } : obj
      );
      setMainObject(updated);
    }

    setSelectedAngle(angle);
    saveHistory();
  };

  //===// File upload handler (single state update) //===//
  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const storedUser = get<any>("user");
    let temp_id = localStorage.getItem('temp_id') || '';
    if (!files || files.length === 0) return;

    // Declared outside the try so the catch can remove the placeholder row too.
    const tempId = guid();

    try {
      setUploadedImages((prev) => [{ id: tempId, src: "/spinner.gif", skeleton: true }, ...prev]);
      const formData = new FormData();
      formData.append("image_type", "computer");
      if (storedUser && storedUser._id) {
        formData.append("user_id", storedUser._id);
      } else if (temp_id) {
        formData.append("user_id", temp_id);
      }
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });
      let url = "";
      if (!storedUser || !storedUser._id) {
        url = `image/temp-add`;
      } else {
        url = `image/add`;
      }
      const res = await apiPost<any>(url, formData);
      const inserted = res?.data?.inserted?.[0];

      /**
       * Use the S3 URL the server just returned — never a local object URL.
       *
       * This previously did `src: URL.createObjectURL(files[0])` even on a
       * successful upload, throwing away `image_compressed`. Clicking that
       * thumbnail put a `blob:` URL into canvasObjects[].data.src, which is then
       * serialised into card_data/card_html and stored with the order. A blob URL
       * only resolves inside the document that created it, so the print renderer
       * — a fresh browser context — saw nothing and produced blank pages.
       */
      if (res.status && inserted?.image_compressed) {
        setUploadedImages((prev) =>
          prev.map((img) =>
            img.id === tempId
              ? { id: inserted._id || guid(), src: inserted.image_compressed, skeleton: false }
              : img
          )
        );
        toastSuccess(res.message);
      } else {
        // Drop the placeholder row. Leaving it behind left a clickable
        // /spinner.gif in the library that could be added to the canvas.
        setUploadedImages((prev) => prev.filter((img) => img.id !== tempId));
        toastError(res?.message || "Upload failed. Please try that photo again.");
      }
    } catch (error) {
      console.error(error);
      setUploadedImages((prev) => prev.filter((img) => img.id !== tempId));
      toastError("Something went wrong while uploading");
    }
  };

  // 2. CORRECTED saveHistory function:
  const saveHistory = () => {
    if (isUndoRedoOperation) return;

    try {
      const pageIndex = canvasActiveIndex;

      // Save the ENTIRE canvasObjects array AND current page's mainObject
      const currentState = {
        canvasObjects: JSON.parse(JSON.stringify(canvasObjects)),
        mainObject: JSON.parse(JSON.stringify(mainObject)),
        canvasBackgrounds: JSON.parse(JSON.stringify(canvasBackgrounds)),
        selectedObjectId: selectedObject?.id || null,
        timestamp: Date.now(),
      };

      // Get current page's history stack
      const currentStack = pageHistoryStacks[pageIndex] || [];
      const currentIndex = pageHistoryIndices[pageIndex] ?? -1;

      // Remove any history after current index (for branching)
      const newHistoryStack = currentStack.slice(0, currentIndex + 1);

      // Add new state
      newHistoryStack.push(currentState);

      // Limit history size
      if (newHistoryStack.length > maxHistorySize) {
        newHistoryStack.shift();
      }

      // Update page-specific history
      setPageHistoryStacks({
        ...pageHistoryStacks,
        [pageIndex]: newHistoryStack,
      });

      setPageHistoryIndices({
        ...pageHistoryIndices,
        [pageIndex]: newHistoryStack.length - 1,
      });

      console.log(`✅ History saved for page ${pageIndex}, stack size: ${newHistoryStack.length}`);
    } catch (error) {
      console.error("❌ Error saving history:", error);
    }
  };

  // 3. CORRECTED undo function:
  const undo = () => {
    if (!canUndo()) return;

    setIsUndoRedoOperation(true);
    const pageIndex = canvasActiveIndex;
    const currentStack = pageHistoryStacks[pageIndex] || [];
    const currentIndex = pageHistoryIndices[pageIndex] ?? -1;
    const newIndex = currentIndex - 1;
    const previousState = currentStack[newIndex];

    if (previousState) {
      restoreState(previousState, pageIndex);
      setPageHistoryIndices({
        ...pageHistoryIndices,
        [pageIndex]: newIndex,
      });
    }

    setTimeout(() => setIsUndoRedoOperation(false), 100);
  };

  // 4. CORRECTED redo function:
  const redo = () => {
    if (!canRedo()) return;

    setIsUndoRedoOperation(true);

    const pageIndex = canvasActiveIndex;
    const currentStack = pageHistoryStacks[pageIndex] || [];
    const currentIndex = pageHistoryIndices[pageIndex] ?? -1;

    const newIndex = currentIndex + 1;
    const nextState = currentStack[newIndex];

    if (nextState) {
      restoreState(nextState, pageIndex);

      setPageHistoryIndices({
        ...pageHistoryIndices,
        [pageIndex]: newIndex,
      });
    }

    setTimeout(() => setIsUndoRedoOperation(false), 100);
  };

  // 5. canUndo function:
  const canUndo = (): boolean => {
    const pageIndex = canvasActiveIndex;
    const currentIndex = pageHistoryIndices[pageIndex] ?? -1;
    const currentStack = pageHistoryStacks[pageIndex] || [];
    return currentIndex > 0 && currentStack.length > 0;
  };

  // 6. canRedo function:
  const canRedo = (): boolean => {
    const pageIndex = canvasActiveIndex;
    const currentIndex = pageHistoryIndices[pageIndex] ?? -1;
    const currentStack = pageHistoryStacks[pageIndex] || [];
    return currentIndex < currentStack.length - 1;
  };

  // 7. CORRECTED restoreState function:
  const restoreState = (state: any, pageIndex: number) => {
    try {
      console.log("🔄 Restoring state for page:", pageIndex);
      console.log("🔄 Restoring state for page:", state);

      // Deep clone to prevent reference issues
      const restoredCanvasObjects = JSON.parse(JSON.stringify(state.canvasObjects));
      const restoredMainObject = JSON.parse(JSON.stringify(state.mainObject));
      const restoredBackgrounds = JSON.parse(JSON.stringify(state.canvasBackgrounds));
      console.log("restoredCanvasObjects", restoredCanvasObjects);

      // ✅ Update ALL canvasObjects (all pages)
      setCanvasObjects(restoredCanvasObjects);

      // ✅ Update mainObject (current editing canvas)
      mainObject = restoredMainObject;
      setMainObject(mainObject);

      // ✅ Update ALL backgrounds
      setCanvasBackgrounds(restoredBackgrounds);
      setSelectedBgColor(restoredBackgrounds[pageIndex]);

      // Clear selection
      clearSelection();

      // Restore selection if it exists
      if (state.selectedObjectId && restoredMainObject.length > 0) {
        const selectedObj = restoredMainObject.find(
          (obj: any) => obj && obj.id === state.selectedObjectId
        );

        if (selectedObj) {
          setTimeout(() => {
            selectObject(
              selectedObj,
              { stopPropagation: () => { } } as React.MouseEvent,
              pageIndex
            );
          }, 50);
        }
      }

      console.log("✅ State restored successfully");
    } catch (error) {
      console.error("❌ Error restoring state:", error);

      // Don't reset - keep current state on error
      clearSelection();
    }
  };

  const backTo = () => {
    router.push("/photo-book");
  }

  const logOut = () => {
    removeEncrypted("user");
    setUser(null)
    router.push("/");
  }

  // const addCard = () => {
  //   const updatedObjects = [...canvasObjects];
  //   const updatedBackgrounds = [...canvasBackgrounds];
  //   const insertIndex = updatedObjects.length - 1;
  //   updatedObjects.splice(insertIndex, 0, []);
  //   updatedBackgrounds.splice(insertIndex, 0, "white");
  //   setCanvasObjects(updatedObjects);
  //   setCanvasBackgrounds(updatedBackgrounds);
  // };


  const addCard = () => {
    const updatedObjects = [...canvasObjects];
    const updatedBackgrounds = [...canvasBackgrounds];
    const insertIndex = updatedObjects.length - 1;
    const maxInnerPages = 100;
    const currentInnerPages = Math.max(0, updatedObjects.length - 2);
    const remaining = maxInnerPages - currentInnerPages;

    if (remaining <= 0) {
      toastWarning("You can add up to 100 pages.");
      return;
    }

    const pagesToAdd = Math.min(20, remaining);
    for (let i = 0; i < pagesToAdd; i++) {
      updatedObjects.splice(insertIndex, 0, []);
      updatedBackgrounds.splice(insertIndex, 0, "white");
    }

    setCanvasObjects(updatedObjects);
    setCanvasBackgrounds(updatedBackgrounds);
    setExtrapage(pagesToAdd);
    toastSuccess(`${pagesToAdd} Pages added successfully.`)
  };

  const removeCard = async (index: number) => {
    let isConfirmed: any = false;
    isConfirmed = await toastConfirm("Are you sure you want to remove last 20 pages from the album?",
      "Remove",
      "Keep"
    );

    if (isConfirmed) {
      const updatedObjects = [...canvasObjects];
      const updatedBackgrounds = [...canvasBackgrounds];
      if (updatedObjects.length > 22) {
        updatedObjects.splice(index, 20);
        updatedBackgrounds.splice(index, 20);
        setCanvasObjects(updatedObjects);
        setCanvasBackgrounds(updatedBackgrounds);
        toastSuccess("20 Pages removed successfully.")
      } else {
        toastWarning("At least 20 pages must remain.")
      }
    }
  };

  // Pre-load all S3 image URLs with crossOrigin="anonymous" so the browser
  // cache contains CORS-enabled responses before html2canvas tries to fetch them.
  const preloadImagesForCORS = (objects: any[]): Promise<void[]> => {
    const srcs = new Set<string>();
    const collectSrcs = (objs: any[]) => {
      objs.forEach((obj: any) => {
        if (obj.type === "image" && obj.data?.src) srcs.add(obj.data.src as string);
        if (Array.isArray(obj.originalData)) collectSrcs(obj.originalData);
      });
    };
    collectSrcs(objects);
    return Promise.all(
      Array.from(srcs).map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = src;
          })
      )
    );
  };

  const previewCard = async () => {
    const unedited: ElementObject[] = [];
    canvasObjects.forEach(canvas =>
      canvas.forEach(obj => {
        if ((obj.editable === true || obj.editable === undefined) && (obj.type === "text" || obj.type === "layoutText")) {
          const txt = obj.data?.text?.trim();
          if (!txt || ["Add Text", "Your Text Here", "Main Content Area", "Header Text", "Footer Text"].includes(txt)) {
            unedited.push(obj);
          }
        }
      })
    );

    if (unedited.length) {
      Swal.fire({
        title: "Please finish all editable fields",
        icon: "warning",
        confirmButtonText: "Ok",
      });
      return;
    }
    const hasContent = (canvasObjects: any[][]): boolean => { return canvasObjects.every(innerArray => innerArray.length > 0); };
    const getCanvasObjectsCount = (arr: any[][]) => { return arr.filter(item => item.length > 0).length; };
    let isConfirmed: any = false;
    let exitingData = getCanvasObjectsCount(canvasObjects);
    let nonExitingData = Math.abs((canvasObjects.length - 1) - (exitingData - 1));
    if (!hasContent(canvasObjects)) {
      isConfirmed = await toastHtmlConfirm(
        `There are ${exitingData - 1} pages in your photo book. We require at least ${canvasObjects.length} pages to print the book.<br><br>
        Please add ${nonExitingData} more pages to the book, or print the book with empty pages`,
        "Print with empty pages",
        `I will add ${nonExitingData} pages`);
    } else {
      isConfirmed = true;
    }

    if (isConfirmed) {
      setFirstLoading(true);
      setPrepareBook(true);
      clearSelection();
      hideChildPanel();
      hideAdditionalPanel();
      const { previews } = await generatePreviewsRecursively();
      previewImages = previews;
      setPreviewImages(previewImages);
      setPreviewMode(true);
      setProgress(0);
      setShowEditing(true);
      setPrepareBook(false);
      setFirstLoading(false);
    } else {
      openModal()
    }
  }

  async function generatePreviewsRecursively(): Promise<any> {
    const previews: any = [];
    const imageFiles: File[] = [];
    const imageHtml: any = [];
    const imageData: any = [];
    /** Pages whose preview raster failed — reported once at the end instead of
     *  being swallowed per page. */
    const renderFailures: number[] = [];
    mainObject = [];
    setvaImageIds([]);
    setcardHtml([]);
    setcardData([]);
    setPreviewLoadImages([]);

    const processCanvas = async (index: number): Promise<void> => {
      if (index >= canvasObjects.length) return;
      if (canvasObjects[index].length > 0 && "originalData" in canvasObjects[index][0]) {
        const allOriginalData = canvasObjects[index].filter((item: any) => Array.isArray(item.originalData)).flatMap((item: any) => item.originalData);
        const uniqueOriginalData = allOriginalData.filter((obj: any, index: number, self: any) => index === self.findIndex((o: any) => o.id === obj.id));
        mainObject = uniqueOriginalData;
      } else {
        mainObject = canvasObjects[index];
      }

      // if (index === canvasObjects.length - 1) {
      // if (mainObject.length || index === canvasObjects.length - 1) {
      const updatedBackgrounds = [...canvasBackgrounds];
      setSelectedBgColor(updatedBackgrounds[index])
      setMainObject(mainObject);
      await new Promise(resolve => setTimeout(resolve, 150));
      await preloadImagesForCORS(mainObject);
      let file: any = "";
      try {
        const CanvasRef: any = canvasRefs.current[0];
        const htmlContent = CanvasRef?.outerHTML || "";
        imageHtml.push(htmlContent)
        imageData.push(canvasObjects[index])
        //==// Capture at high pixel density so the rasterised PNG (consumed //==//
        //==// by saveAlbum/checkout/PDF) stays sharp. Min scale 3; bumps to  //==//
        //==// devicePixelRatio*2 on retina (4x on DPR 2). Higher than this   //==//
        //==// mostly wastes memory/upload size for on-screen use.            //==//
        const captureScale = Math.max(
          3,
          typeof window !== "undefined" ? (window.devicePixelRatio || 1) * 2 : 3
        );
        const html2canvas = await loadHtml2Canvas();
        const canvas = await html2canvas(CanvasRef, {
          scale: captureScale,
          useCORS: true,
          allowTaint: false,
          backgroundColor: canvasBackgrounds[index] || "#ffffff",
          x: BLEED_PX,
          y: BLEED_PX,
          width: Math.max(1, canvasWidth - 2 * BLEED_PX),
          height: Math.max(1, canvasHeight - 2 * BLEED_PX),
          ignoreElements: (el) =>
            el.classList.contains("selection-box") ||
            el.classList.contains("control-points") ||
            el.classList.contains("bleed-line") ||
            el.classList.contains("safety-area-label"),
        });

        const dataUrl = canvas.toDataURL("image/png", 0.5);
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        file = new File([blob], `page_${index + 1}.png`, { type: "image/png", });
        imageFiles.push(file);
        previews.push({ id: index, imageUrl: dataUrl });
        setPreviewLoadImages((prev: any) => [...prev, { id: index, imageUrl: dataUrl }]);
        console.log(`canvas at index ${index}:`);
      } catch (error) {
        // Keep the placeholder so page indices stay aligned, but do NOT let the
        // failure pass silently. This only affects the checkout preview
        // thumbnails — the printed book is built from card_data/card_html, which
        // were pushed above before the raster step — so it is a warning, not a
        // reason to block the order.
        console.error(`Error rendering canvas at index ${index}:`, error);
        renderFailures.push(index + 1);
        previews.push({ id: index, imageUrl: "" });
        setPreviewLoadImages((prev: any) => [...prev, { id: index, imageUrl: "" }]);
      }
      // }

      // ✅ Update progress
      setProgress(Math.round(((index + 1) / canvasObjects.length) * 100));
      await new Promise(async resolve => {
        // await saveSingleImage(file);
        await processCanvas(index + 1);
        resolve(true);
      });
    }

    try {
      await processCanvas(0);
    } catch (error) {
      console.error("Error generating flipbook previews:", error);
    }
    setcardHtml(imageHtml)
    setcardData(imageData)
    setpreviewImagesFile(imageFiles);

    // Surface raster failures once. Previously each one was caught and replaced
    // with an empty preview with no user-visible sign, which is how a broken
    // album could reach checkout looking complete.
    if (renderFailures.length) {
      toastWarning(
        `Preview couldn't be generated for page${renderFailures.length > 1 ? "s" : ""} ${renderFailures.join(", ")}. Your book will still print, but please check those pages.`
      );
    }

    // imageData/imageHtml are returned directly (not just via setcardData/
    // setcardHtml) so a caller in the same tick — e.g. autoSaveAndEnterPreview,
    // which can't wait for a re-render the way a manual button click can —
    // gets the freshly-built values instead of last render's stale state.
    return { previews, imageData, imageHtml };
  }

  // Chat-driven equivalent of "click Preview, then click Checkout's save
  // step" — but automatic, and it stops short of navigating to /checkout so
  // the customer lands on a real read-only preview first. Skips previewCard's
  // "unedited text field" / "add empty pages" confirmation dialogs since a
  // chat-built album is photo-only and already sized to the chosen page count.
  const autoSaveAndEnterPreview = async () => {
    try {
      setFirstLoading(true);
      setPrepareBook(true);
      clearSelection();
      hideChildPanel();
      hideAdditionalPanel();

      const { previews, imageData, imageHtml } = await generatePreviewsRecursively();
      previewImages = previews;
      setPreviewImages(previewImages);
      setProgress(0);

      let storedUser: any = get<any>("user");
      if (!storedUser) {
        storedUser = await ensureGuestUser();
      }
      if (!storedUser || !storedUser._id) {
        toastError("Could not save your album. Please try again.");
        return;
      }

      const storedData = JSON.parse(localStorage.getItem("customize_data") || "{}");
      if (!storedData?.templateId) {
        toastError("Could not save your album. Please try again.");
        return;
      }

      const formData = new FormData();
      formData.append("user_id", storedUser._id);
      formData.append("template_id", storedData.templateId);
      formData.append("category", JSON.stringify(storedData.category));
      formData.append("number_of_pages", storedData.number_of_pages);
      formData.append("size", JSON.stringify(storedData.page_size));
      formData.append("size_amount", storedData.page_size?.price ?? 0);
      formData.append("cover_type", JSON.stringify(storedData.cover_type));
      formData.append("cover_amount", storedData.cover_type?.price ?? 0);
      formData.append("paper_quality", JSON.stringify(storedData.paper_quality));
      formData.append("paper_quality_amount", storedData.paper_quality?.price ?? 0);
      formData.append("base_price", storedData.base_price);
      // total_price is the price of ONE book. A new album always starts at a
      // single copy; the customer changes it with the cart/checkout stepper.
      formData.append("total_price", storedData.total_price);
      formData.append("quantity", String(storedData.quantity ?? 1));
      formData.append("extra_page", extrapage || 0);
      // Never persist an album that still references a local object URL.
      if (containsBlobUrl(imageData, imageHtml)) {
        console.error("Blocked order/store: card_data contained a blob: URL");
        toastError(BLOB_IN_ORDER_MESSAGE);
        return;
      }

      formData.append("card_data", JSON.stringify(imageData));
      formData.append("card_html", JSON.stringify(imageHtml));

      const res = await apiPost<any>("order/store", formData);
      if (res.status && res.data?._id) {
        await saveAlbum(res.data._id, previewImages);
        setPreviewMode(true);
        setShowEditing(true);
        // Lets Pixie notice when this order later gets paid for — see
        // checkPendingOrder() in src/Components/AIOrderChat/buildAlbum.ts,
        // polled once whenever the chat widget mounts on any page.
        localStorage.setItem("pixie_pending_order_id", res.data._id);
        router.replace(`/element-editing?id=${res.data._id}&source=chat`);
      } else {
        toastError(res.message || "Could not save your album.");
      }
    } catch (error: any) {
      console.error("autoSaveAndEnterPreview failed:", error);
      toastError("Could not save your album. Please try again.");
    } finally {
      setPrepareBook(false);
      setFirstLoading(false);
    }
  };

  async function saveSingleImage(file: any) {
    let storedUser = get<any>("user");
    const formData = new FormData();
    formData.append("user_id", storedUser._id);
    formData.append("image", file);
    const res = await apiPost<any>("order/order-store-image", formData);
    setvaImageIds((prev: any) => [...prev, res.data.image_id]);
  }

  const hasContent = (canvasObjects: any[][]): boolean => {
    return canvasObjects.every(innerArray => innerArray.length > 0);
  };

  const imageSaveCheckout = async () => {
    let storedUser = get<any>("user");
    // if (!storedUser) {
    //   const isUsetNotLogin = await toastConfirm(
    //     "You need to sign in to checkout. Please sign in to continue.",
    //     "Sign In",
    //     "Cancel"
    //   );

    //   if (isUsetNotLogin) {
    //     openSignIn();
    //   }
    //   return
    // }

    const getCanvasObjectsCount = (arr: any[][]) => {
      return arr.filter(item => item.length > 0).length;
    };

    let isConfirmed: any = false;
    let exitingData = getCanvasObjectsCount(canvasObjects);
    let nonExitingData = (canvasObjects.length - 1) - (exitingData - 1);

    if (!hasContent(canvasObjects)) {
      isConfirmed = await toastHtmlConfirm(
        `There are ${exitingData - 1} pages in your photo book. We require at least ${canvasObjects.length} pages to print the book.<br><br>
        Please add ${nonExitingData} more pages to the book, or print the book with empty pages`,
        "Print with empty pages",
        `I will add ${nonExitingData} pages`);
    } else {
      isConfirmed = true;
    }

    if (isConfirmed) {
      setFirstLoading(true);
      setPrepareBook(true);
      setvaImageIds([]);
      setPreviewLoadImages([]);
      clearSelection();
      hideChildPanel();
      hideAdditionalPanel();
      const imageFiles: File[] = [];
      const prevewiImage: any = [];
      const imageHtml: any = [];
      const imageData: any = [];

      const processCanvas = async (index: number): Promise<void> => {
        if (index >= canvasObjects.length) return;
        if (canvasObjects[index].length > 0 && "originalData" in canvasObjects[index][0]) {
          const allOriginalData = canvasObjects[index].filter((item: any) => Array.isArray(item.originalData)).flatMap((item: any) => item.originalData);
          const uniqueOriginalData = allOriginalData.filter((obj: any, index: number, self: any) => index === self.findIndex((o: any) => o.id === obj.id));
          mainObject = uniqueOriginalData;
        } else {
          mainObject = canvasObjects[index];
        }
        console.log("mainObject", mainObject);
        console.log("canvasObjects", canvasObjects);
        console.log("index", index);

        // if (index === canvasObjects.length - 1) {
        // if (mainObject.length || index === canvasObjects.length - 1) {
        const updatedBackgrounds = [...canvasBackgrounds];
        setSelectedBgColor(updatedBackgrounds[index])
        setMainObject(mainObject);

        await new Promise((resolve) => setTimeout(resolve, 150));
        await preloadImagesForCORS(mainObject);
        let file: any = "";
        try {
          const CanvasRef: any = canvasRefs.current[0];
          const htmlContent = CanvasRef?.outerHTML || "";
          imageHtml.push(htmlContent)
          imageData.push(canvasObjects[index])
          //==// Print-grade pixel density (~300 DPI for a ~6in spread:        //==//
          //==// 600 CSS px -> 3600 native px). PNG stays lossless. Bump only  //==//
          //==// if the canvas physical size changes (300 DPI = 50 px/in per   //==//
          //==// scale unit, so a 12in wide spread would use 12).               //==//
          const PRINT_SCALE = 6;
          const html2canvas = await loadHtml2Canvas();
          const canvas = await html2canvas(CanvasRef, {
            scale: PRINT_SCALE,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#ffffff",
            x: BLEED_PX,
            y: BLEED_PX,
            width: Math.max(1, canvasWidth - 2 * BLEED_PX),
            height: Math.max(1, canvasHeight - 2 * BLEED_PX),
            ignoreElements: (el) =>
              el.classList.contains("selection-box") ||
              el.classList.contains("control-points") ||
              el.classList.contains("bleed-line") ||
              el.classList.contains("safety-area-label"),
          });


          const dataUrl = canvas.toDataURL("image/png", 0.8);
          prevewiImage.push({ id: index, imageUrl: dataUrl });
          setPreviewLoadImages((prev: any) => [...prev, { id: index, imageUrl: dataUrl }]);
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          file = new File([blob], `page_${index + 1}.png`, { type: "image/png", });

          imageFiles.push(file);
        } catch (error) {
          // Placeholder keeps page indices aligned; the warning below makes the
          // failure visible instead of letting it slip through silently.
          prevewiImage.push({ id: index, imageUrl: "" });
          //====//  Update state //====//
          setPreviewLoadImages((prev: any) => [...prev, { id: index, imageUrl: "" }]);
          console.error(`Error rendering canvas at index ${index}:`, error);
          toastWarning(`Preview couldn't be generated for page ${index + 1}.`);
        }
        // }

        setProgress(Math.round(((index + 1) / canvasObjects.length) * 100));
        // await saveSingleImage(file);
        await processCanvas(index + 1);
      };

      await processCanvas(0);

      //====// Create FormData and send to Next.js API route //====//
      const storedData = JSON.parse(localStorage.getItem("customize_data") || '{}');
      // let extra_page: any = 0;
      // if (canvasObjects.length > (storedData.number_of_pages + 2)) {
      //   extra_page = canvasObjects.length - (storedData.number_of_pages + 2)
      // }

      const order_id = localStorage.getItem("order_id");
      let storedUser: any = get<any>("user");
      if (!storedUser) {
        storedUser = await ensureGuestUser();
      }
      if (!storedUser || !storedUser._id) {
        toastError("Could not start checkout. Please try again.");
        setFirstLoading(false);
        setPrepareBook(false);
        return;
      }

      const step = 20;
      const pagesArray: number[] = [];
      for (let i = storedData.min_page; i <= storedData.number_of_pages; i += step) {
        pagesArray.push(i);
      }
      let total: any = Number(storedData.total_price).toFixed(2);
      if (pagesArray.length && storedData.page_size.price) {
        let totalPerPage = Number(storedData.page_size.price * pagesArray.length).toFixed(2);
        total = parseFloat(Number(total).toFixed(0)) + parseFloat(Number(totalPerPage).toFixed(2));
      }
      console.log("extrapage", extrapage);

      let exTraPagePrice: any = extrapage ? extrapage * storedData.page_size.per_page_price : 0.00;
      console.log("extrapage", extrapage, "*", storedData.page_size.per_page_price);

      console.log("total>>>>>>1", exTraPagePrice);
      total = extrapage ? total + parseFloat(exTraPagePrice) : total;
      console.log("total>>>>>>2", total);

      if (storedData) {
        const formData = new FormData();
        if (orderId) {
          formData.append("orderId", orderId);
        }
        formData.append("user_id", storedUser && storedUser._id );
        formData.append("template_id", storedData.templateId);
        formData.append("category", JSON.stringify(storedData.category));
        formData.append("number_of_pages", storedData.number_of_pages);
        formData.append("size", JSON.stringify(storedData.page_size));
        formData.append("size_amount", storedData.page_size.price);
        formData.append("cover_type", JSON.stringify(storedData.cover_type));
        formData.append("cover_amount", storedData.cover_type.price);
        formData.append("paper_quality", JSON.stringify(storedData.paper_quality));
        formData.append("paper_quality_amount", storedData.paper_quality.price);
        formData.append("base_price", storedData.base_price);
        formData.append("total_price", total);
        formData.append("extra_page", extrapage);

        // imageFiles.forEach((file, i) => {
        //   formData.append("images", file);
        // });
        // Never persist an album that still references a local object URL.
        if (containsBlobUrl(imageData, imageHtml)) {
          console.error("Blocked order/store: card_data contained a blob: URL");
          setFirstLoading(false);
          setPrepareBook(false);
          toastError(BLOB_IN_ORDER_MESSAGE);
          return;
        }

        formData.append("card_data", JSON.stringify(imageData));
        formData.append("card_html", JSON.stringify(imageHtml));
        const res = await apiPost<any>("order/store", formData);
        if (res.status) {
          await saveAlbum(res.data._id, prevewiImage);
          setFirstLoading(false);
          setPrepareBook(false);
          localStorage.removeItem('order_id');
          localStorage.removeItem('customize_data');
          localStorage.removeItem('template_id');
          router.push(`/checkout?id=${res.data._id}`);
          toastSuccess(res.message);
        } else {
          setFirstLoading(false);
          setPrepareBook(false);
          toastError(res.message);
        }
      }
    } else {
      openModal()
    }
  }

  const onBackToEdit = async () => {
    setPreviewMode(false);
    setShowEditing(false);
    onCanvasSelect(canvasActiveIndex);
  }

  const continueToPay = async () => {
    try {
      let storedUser: any = get<any>("user");
      if (!storedUser) {
        storedUser = await ensureGuestUser();
      }
      if (!storedUser || !storedUser._id) {
        alert("Could not start checkout. Please try again.");
        return;
      }
      // if (!storedUser) {
      //   const isUsetNotLogin = await toastConfirm(
      //     "You need to sign in to checkout. Please sign in to continue.",
      //     "Sign In",
      //     "Cancel"
      //   );
      //   console.log("isUsetNotLogin", isUsetNotLogin);
      //   if (isUsetNotLogin) {
      //     await openSignIn();
      //   }
      //   return
      // }

      if (previewImages.length < 2) {
        alert("Need at least front and back pages.");
        return;
      }


      // ✅ Create FormData and send to Next.js API route
      const storedData = JSON.parse(localStorage.getItem("customize_data") || '{}');
      // let extra_page: any = 0;
      // if (canvasObjects.length > (storedData.number_of_pages + 2)) {
      //   extra_page = canvasObjects.length - (storedData.number_of_pages + 2)
      // }
      const order_id = localStorage.getItem("order_id");

      const step = 20;
      const pagesArray: number[] = [];
      for (let i = storedData.min_page; i <= storedData.number_of_pages; i += step) {
        pagesArray.push(i);
      }
      let total: any = Number(storedData.total_price).toFixed(2);
      if (pagesArray.length && storedData.page_size.price) {
        let totalPerPage = Number(storedData.page_size.price * pagesArray.length).toFixed(2);
        total = parseFloat(Number(total).toFixed(0)) + parseFloat(Number(totalPerPage).toFixed(2));
      };

      let exTraPagePrice: any = extrapage ? extrapage * storedData.page_size.per_page_price : 0.00;
      total = extrapage ? total + parseFloat(exTraPagePrice) : total;


      if (storedData) {
        setFirstLoading(true);
        const formData = new FormData();
        if (orderId) {
          formData.append("orderId", orderId);
        }
        formData.append("user_id", storedUser._id);
        formData.append("template_id", storedData.templateId);
        formData.append("category", JSON.stringify(storedData.category));
        formData.append("number_of_pages", storedData.number_of_pages);
        formData.append("size", JSON.stringify(storedData.page_size));
        formData.append("size_amount", storedData.page_size.price);
        formData.append("cover_type", JSON.stringify(storedData.cover_type));
        formData.append("cover_amount", storedData.cover_type.price);
        formData.append("paper_quality", JSON.stringify(storedData.paper_quality));
        formData.append("paper_quality_amount", storedData.paper_quality.price);
        formData.append("base_price", storedData.base_price);
        formData.append("total_price", total);
        formData.append("extra_page", extrapage);
        // previewImagesFile.forEach((file: any, i: any) => {
        //   formData.append("images", file);
        // });
        // console.log("cardHtml", cardHtml);

        // Never persist an album that still references a local object URL.
        if (containsBlobUrl(cardArrayData, cardHtml)) {
          console.error("Blocked order/store: card_data contained a blob: URL");
          setFirstLoading(false);
          setPrepareBook(false);
          toastError(BLOB_IN_ORDER_MESSAGE);
          return;
        }

        formData.append("card_data", JSON.stringify(cardArrayData));
        formData.append("card_html", JSON.stringify(cardHtml));
        // formData.append("images_id", JSON.stringify(svaImageIds));

        const res = await apiPost<any>("order/store", formData);
        if (res.status) {
          await saveAlbum(res.data._id, previewImages);
          localStorage.removeItem('order_id');
          localStorage.removeItem('customize_data');
          localStorage.removeItem('template_id');
          await setFirstLoading(false);
          await toastSuccess(res.message);
          router.push(`/checkout?id=${res.data._id}`);
        } else {
          await toastError(res.message);
          setFirstLoading(false);
        }
      }
    } catch (error: any) {
      error && error.message ? await toastError(error.message) : '';
      setFirstLoading(false);
    }
  };

  const uploadImagesAsZip = async (files: File[]) => {
    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();

      // Add each file with compression
      files.forEach((file) => {
        zip.file(file.name, file, { compression: "DEFLATE" });
      });

      // Generate ZIP with compression
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      console.log("ZIP Size (MB):", (zipBlob.size / 1024 / 1024).toFixed(2));
      return zipBlob;
    } catch (err) {
      console.error("Error creating/uploading ZIP:", err);
    }
  };


  const generateAndDownload = async (images: any[], filename: string) => {
    if (images.length === 0) return;

    // Call backend CMYK PDF endpoint (binary streaming response)
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/front-end/";
    const res = await fetch(`${apiBase}cmyk-pdf/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ previewImages: images }),
    });

    if (!res.ok) {
      alert("Failed to generate PDF: " + filename);
      return;
    }

    const blob = await res.blob();
    // await savePDF(filename, blob);

    // return url;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const onImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.display = "none";
  };

  const navigate = (patch: any) => {
    router.push(patch);
  };

  const goNext = async () => {
    // await generateNextPreview((record) => {
    //   setPreviewImages((prev: any) => [...prev, record]);
    // });


    if (flipBook.current) {
      flipBook.current.pageFlip().flipNext();
    }
  };

  const goPrev = () => {
    if (flipBook.current) {
      flipBook.current.pageFlip().flipPrev();
    }
  };

  //===// Call API (GET or POST depending on backend) //===//
  const openAI = async () => {
    if (selectedObject && selectedObject.id) {
      setAIprocces(true);
      const formData = new FormData();
      formData.append("id", selectedObject.id);
      const res = await apiPost<any>("image/image-ai-text", formData);
      if (res.status) {
        addMarrageText(res.data.ai_text, 200, 380, 18);
        setAIprocces(false);
      }
    }
  }

  //===// Get the selected layer of any type //===//
  const handleLayerAction = (action: string) => {
    const selectedLayer = mainObject.find((obj: any) => obj.selected);
    if (!selectedLayer) return;

    let updatedLayers = [...mainObject];
    const maxZ = Math.max(...updatedLayers.map((l) => l.zIndex));
    const minZ = Math.min(...updatedLayers.map((l) => l.zIndex));

    switch (action) {
      case "bring-forward":
        if (selectedLayer.zIndex < maxZ) {
          const nextLayer = updatedLayers.find((l) => l.zIndex === selectedLayer.zIndex + 1);
          if (nextLayer) nextLayer.zIndex -= 1;
          selectedLayer.zIndex += 1;
        }
        break;

      case "send-backward":
        if (selectedLayer.zIndex > 0) {
          const prevLayer = updatedLayers.find((l) => l.zIndex === selectedLayer.zIndex - 1);
          if (prevLayer) prevLayer.zIndex += 1;
          selectedLayer.zIndex -= 1;
        }
        break;

      case "bring-to-front":
        if (selectedLayer.zIndex < maxZ) selectedLayer.zIndex = maxZ + 1;
        break;

      case "send-to-back":
        if (selectedLayer.zIndex > 0) selectedLayer.zIndex = 0;
        updatedLayers.forEach((l) => {
          if (l.id !== selectedLayer.id && l.zIndex === 0) l.zIndex += 1;
        });
        break;
    }

    //===// Sort by zIndex so rendering order is correct //===//
    updatedLayers.sort((a, b) => a.zIndex - b.zIndex);
    setMainObject(updatedLayers);
  };

  const changeLayout = (index: any) => {
    hideChildPanel();
    setShowAdditionalPanel(true);
    setShowImageLayout(true)
  }

  const handleLayoutSelect = (item: any, idx: number, layout: any[]) => {
    const imageObjects = mainObject.filter((obj: any) => obj.type === "image");
    const updatedMainObject = [...mainObject];

    imageObjects.forEach((imgObj: any, i: number) => {
      if (layout[i] && layout[i].imageObjects) {
        const mainIndex = updatedMainObject.findIndex((o: any) => o.id === imgObj.id);
        if (mainIndex > -1) {
          updatedMainObject[mainIndex] = {
            ...updatedMainObject[mainIndex],
            x: layout[i].imageObjects.x,
            y: layout[i].imageObjects.y,
            width: layout[i].imageObjects.width,
            height: layout[i].imageObjects.height,
            data: { src: layout[i].imageObjects.data.src },
          };
        }
      }
    });
    setMainObject(updatedMainObject);
    const imageCanvasObjects = canvasObjects[canvasActiveIndex].filter((obj: any) => obj.type === "image");
    const updatedCanvasObjects = [...canvasObjects];
    imageCanvasObjects.forEach((mainObj: any, i: number) => {
      if (layout[i] && layout[i].imageObjects) {
        const mainIndex = updatedCanvasObjects[canvasActiveIndex].findIndex((o: any) => o.originalData[0].id === mainObj.originalData[0].id);
        updatedCanvasObjects[canvasActiveIndex][mainIndex] = {
          ...updatedCanvasObjects[canvasActiveIndex][mainIndex],
          originalData: [
            {
              ...updatedCanvasObjects[canvasActiveIndex][mainIndex].originalData?.[0],
              x: layout[i].imageObjects.x,
              y: layout[i].imageObjects.y,
              width: layout[i].imageObjects.width,
              height: layout[i].imageObjects.height,
              data: { src: layout[i].imageObjects.data.src },
            },
          ],
        };
      }
    });
    setCanvasObjects(updatedCanvasObjects);
  };

  const goToHome = () => {
    router.push("/");
  };

  const formatDate = (date: any, formatType: string) => {
    if (!date) return "";

    //===// Ensure it's a Date object
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) return "";

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    switch (formatType) {
      case "MMMM DD, YYYY":
        return d.toLocaleDateString("en-US", options);
      case "DD MMMM YYYY":
        return d.toLocaleDateString("en-GB", options);
      case "YYYY-MM-DD":
        return d.toISOString().split("T")[0];
      case "MM/DD/YYYY":
        return d.toLocaleDateString("en-US");
      default:
        return d.toLocaleDateString("en-US", options);
    }
  };


  const handleIconClick = () => {
    inputRef.current?.showPicker?.();
    if (!inputRef.current?.showPicker) inputRef.current?.click();
  };

  const handleDateChange = (e: any, index: any) => {
    mainObject[index].data.image_date = e.target.value ? new Date(e.target.value) : "";
    setMainObject([...mainObject]);
  };

  const openModal = async () => {
    if (typeof window !== "undefined") {
      const { Modal } = await import("bootstrap");
      const modalElement = document.getElementById("staticBackdrop");
      if (modalElement) {
        const modal = new Modal(modalElement);
        modal.show();
      }
    }
  };

  const closeModal = async () => {
    if (typeof window !== "undefined") {
      const { Modal } = await import("bootstrap");
      const modalElement = document.getElementById("staticBackdrop");
      if (modalElement) {
        const modal = Modal.getInstance(modalElement);
        modal?.hide();
      }
    }
  };

  //===// Handle file selection //===//
  const handleFiles = async (fileList: any) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const imageFiles = Array.from(fileList).filter((file: any) =>
      allowedTypes.includes(file.type)
    );

    if (imageFiles.length === 0) {
      toastWarning("Only image files (JPG, PNG, WebP, GIF) are allowed.");
      return;
    }

    const newFiles = Array.from(fileList).map((file: any) => ({
      file,
      status: "Pending",
      url: URL.createObjectURL(file),
      progress: 0,
      speed: 0,
      eta: 0,
      image_type: "computer",
    }));

    /**
     * Capture the base index BEFORE the state update and await the whole batch.
     *
     * This used to be `newFiles.forEach(async ...)` reading
     * `filesRef.current.length` inside the callback. forEach discards the
     * promises, so nothing awaited the uploads, and filesRef is only synced by a
     * useEffect — so a second selection made while the first batch was in flight
     * computed colliding indices and one row never got its S3 URL written,
     * silently keeping the blob preview below.
     */
    const baseIndex = files.length;
    setFiles((prev) => [...prev, ...newFiles]);
    await Promise.all(
      newFiles.map((fileObj, idx) => startUpload(fileObj, baseIndex + idx))
    );
  };

  /**
   * Mark a row failed AND drop its preview URL.
   *
   * `url` holds the `URL.createObjectURL(file)` preview created in handleFiles.
   * The failure branches used to write only `status`, leaving that blob in
   * place — and setImageCollare then copied it onto the canvas as `data.src`,
   * where it was serialised into the order. A blob URL is only resolvable in
   * the document that minted it, so the print renderer produced blank pages.
   * Revoking and nulling it here means a failed upload has nothing to leak.
   */
  const markFailed = (index: number) => {
    setFiles((prev) => {
      const updated: any = [...prev];
      const row = updated[index];
      if (!row) return prev;
      if (typeof row.url === "string" && row.url.startsWith("blob:")) {
        URL.revokeObjectURL(row.url);
      }
      updated[index] = { ...row, status: "Failed", url: null, progress: 0 };
      return updated;
    });
  };

  //===// Upload single file //===//
  /** Resolves once the upload has settled, so a batch can be awaited. */
  const startUpload = (fileObj: any, index: number): Promise<void> => {
    setFiles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: "InProgress" };
      return updated;
    });
    return uploadFile(fileObj, index);
  };

  /** Resolves on both success and failure — the caller cares that it finished,
   *  the row's `status` says whether it worked. */
  const uploadFile = (fileObj: any, index: number): Promise<void> =>
    new Promise<void>((resolveUpload) => {
    const storedUser = get<any>("user");
    let temp_id = localStorage.getItem('temp_id') || '';
    const startTime = Date.now();
    let lastUpdateTime = 0;

    const xhr = new XMLHttpRequest();
    let url = ""
    if (!storedUser || !storedUser._id) {
      url = `${process.env.NEXT_PUBLIC_API_URL}image/temp-add`;
    } else {
      url = `${process.env.NEXT_PUBLIC_API_URL}image/add`;
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const now = Date.now();
      if (now - lastUpdateTime < 200) return;
      lastUpdateTime = now;

      const newProgress = (event.loaded / event.total) * 100;
      const elapsed = (now - startTime) / 1000;
      const speed = event.loaded / (1024 * 1024) / elapsed; // MB/s
      const eta = (event.total - event.loaded) / (speed * 1024 * 1024);

      setFiles((prev) => {
        const updated: any = [...prev];
        updated[index] = {
          ...updated[index],
          status: "InProgress",
          progress: newProgress,
          image_type: "computer",
          speed,
          eta,
        };
        return updated;
      });
    };

    xhr.onload = () => {
      let responseData: any = {};
      try {
        responseData = JSON.parse(xhr.responseText);
      } catch (err) {
        console.error("Invalid JSON response", err);
      }

      const inserted = responseData?.data?.inserted?.[0];
      // A 2xx without a usable image_compressed is a failure, not a success —
      // it used to be accepted and left the row holding its blob preview.
      if (xhr.status >= 200 && xhr.status < 300 && inserted?.image_compressed) {
        setFiles((prev) => {
          const updated: any = [...prev];
          updated[index] = {
            ...updated[index],
            status: "Completed",
            image_type: "computer",
            progress: 100,
            speed: 0,
            eta: 0,
            height: inserted.height || null,
            width: inserted.width || null,
            url: inserted.image_compressed,
            id: inserted._id || null,
          };
          return updated;
        });
      } else {
        markFailed(index);
      }
      resolveUpload();
    };

    xhr.onerror = () => {
      markFailed(index);
      resolveUpload();
    };

    xhr.open("POST", url, true);
    if (storedUser?.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${storedUser.token}`);
    }

    const formData = new FormData();
    formData.append("image_type", "computer");
    if (storedUser && storedUser._id) {
      formData.append("user_id", storedUser._id);
    } else if (temp_id) {
      formData.append("user_id", temp_id);
    }
    formData.append("images", fileObj.file);
    xhr.send(formData);
    });

  const setImageCollare = () => {
    /**
     * Only rows that actually uploaded may reach the canvas.
     *
     * Two bugs lived here. `item._id` is never written by the upload — it sets
     * `id` — so `crypto.randomUUID()` always won and the `if (... .id)` guard
     * below passed even for a row that never left the browser. And `src` was
     * `item.url`, which on a failed upload was still the local blob preview.
     * Together they put `blob:` URLs into canvasObjects[].data.src, which are
     * saved with the order and render as blank pages.
     *
     * Now: read the real server id, and require both an id and a non-blob URL.
     */
    let upldedata: any = files
      .filter(
        (item: any) =>
          item.status === "Completed" &&
          item.id &&
          typeof item.url === "string" &&
          !item.url.startsWith("blob:")
      )
      .map((item: any) => ({
        id: item.id,
        image_date: null,
        src: item.url,
        imageHeight: item.height,
        imageWidth: item.width,
      }));

    if (upldedata.length === 0) {
      toastWarning("None of those photos finished uploading. Please try again.");
      return;
    }

    const storedPages = JSON.parse(localStorage.getItem("customize_data") || '{}');
    const emptyIndexes = canvasObjects.map((item, index) => (item.length === 0 ? index : -1)).filter(index => index !== -1);
    emptyIndexes.map(async (item, index) => {
      if (upldedata[index] && upldedata[index].id) {
        const img = upldedata[index];
        let data = generateImageSinglePages(img, item);
        await addBgImage(data.image, "image", item, storedPages, img.id);
      }
    })
    setFiles([]);
    closeModal();
  }

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    document.body.classList.toggle("body_active", !menuOpen);
  };


  return (
    <>
      <div className="element-editing-tool">
        {/* Loading Screen */}
        {firstLoading && (
          <>
            <div className="unique-loader-container">
              <div className="loader-padding">
                <div className="loader-set">
                  <div className="unique-loader">
                    <div className="loader-spinner"></div>
                    <i className="fas fa-pencil-alt pencil-icon"></i>
                  </div>

                  {isPrepareBook && (
                    <>
                      <h2>
                        Preparing your
                        <span className="d-block">Photo Book</span>
                      </h2>

                      {/* Progress Bar */}
                      <div className="progress" style={{ height: "20px", marginTop: "10px" }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: `${progress}%`, transition: "width 0.5s ease" }}
                        >
                          {progress}%
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {isPrepareBook && (
                <>
                  <div className="progress-card text-center">
                    <div className="generated-images-preview">
                      <div
                        className="preview-grid"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                          gap: "5px 0px",
                          justifyItems: "center",
                          alignItems: "center",
                        }}
                      >
                        {previewLoadImages
                          // .slice(0, Math.ceil((progress / 100) * previewLoadImages.length))
                          .map((img: any, idx: number) => (
                            <div key={idx}>
                              {/* <Image
                              src={img.imageUrl || "/placeholder.png"}
                              alt="completed"
                              width={400}
                              height={300}
                              className="img-fluid mb-2 border rounded fade-in-image"
                              quality={70}
                              loading="lazy"
                              style={{ width: "120px", height: "120px", objectFit: "cover", border: "1px solid #ccc", borderRadius: "6px" }}
                              unoptimized
                            /> */}
                              <img
                                src={img.imageUrl}
                                alt={`preview-${idx}`}
                                className="fade-in-image"
                                loading="lazy"
                                crossOrigin="anonymous"
                                style={{
                                  width: "120px",
                                  height: "120px",
                                  objectFit: "cover",
                                  borderRadius: "6px",
                                  border: "1px solid #ccc",
                                }}
                              />
                            </div>
                          ))}
                      </div>
                    </div>

                  </div>

                  {/* Open Button */}
                  {/* <button className="open-button" onClick={() => setOpenChat(true)}>
                    <i className="far fa-comments" aria-hidden="true"></i>
                  </button> */}
                </>
              )}
            </div>
          </>
        )}


        {/* Save/Exit Controls */}
        <div className="save-or-exit">
          <div className="d-flex gap-3 align-items-center">
            <a onClick={goToHome} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              {/* Logo: desktop only */}
              <img
                src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/pixovo.png`}
                alt=""
                className="d-none d-md-block"
              />
              {/* Home icon: mobile only */}
              <i className="fa fa-home d-block  d-md-none  " style={{ fontSize: "48px !important", color: "#0ba28d" }}></i>
            </a>
          </div>

          {/* Undo/Redo Controls */}
          {!previewMode && (
            <div className="undo-redo-controls d-flex gap-2 me-3">
              <button
                className={`btn btn-outline-secondary btn-sm ${canUndo() ? "active-btn" : ""
                  }`}
                onClick={undo}
                disabled={!canUndo()}
                title="Undo (Ctrl+Z)"
              >
                <i className="fa fa-undo" aria-hidden="true"></i>
              </button>
              <button
                className={`btn btn-outline-secondary btn-sm ${canRedo() ? "active-btn" : ""
                  }`}
                onClick={redo}
                disabled={!canRedo()}
                title="Redo (Ctrl+Y)"
              >
                <i className="fas fa-redo" aria-hidden="true"></i>
              </button>
            </div>
          )}

          {!previewMode && (
            <div className="d-flex gap-2 align-items-center">
              <button
                className="btn btn-secondary d-flex align-items-center gap-1"
                onClick={backTo}
                style={{ padding: "8px 12px" }}>
                <i className="fa fa-arrow-left" style={{ fontSize: "18px" }}></i>
                <span className="d-none d-md-block d-xl-block d-xxl-block">
                  Back
                </span>
              </button>
              {isMobile && (<>
                <li className="btn btn-secondary d-flex align-items-center justify-content-center"
                  style={{ padding: "8px 12px", minWidth: "44px", minHeight: "34px" }}
                  onClick={previewCard}>
                  <i className="fa fa-eye" style={{ fontSize: "18px" }} aria-hidden="true"></i>
                </li>
                <li className="btn btn-secondary d-flex align-items-center justify-content-center"
                  style={{ padding: "8px 12px", minWidth: "44px", minHeight: "34px" }}
                  onClick={imageSaveCheckout}>
                  <i className="fa fa-shopping-cart d-sm-none" style={{ fontSize: "18px" }} aria-hidden="true"></i>
                </li>


              </>
              )} {/* <button
              className="custom-btn btn-11"
              onClick={addCard}
              disabled={loading}
            >
              <i className="fa fa-plus me-1"></i>
              Add
            </button> */}


              <button className="btn btn-primary d-none d-md-flex d-xl-flex d-xxl-flex align-items-center" onClick={previewCard} disabled={loading}>
                <i className="fa fa-eye me-1"></i>
                <span className="">
                  Preview
                </span>
              </button>
              <button className="btn btn-primary d-none d-md-flex d-xl-flex d-xxl-flex" onClick={imageSaveCheckout}
                disabled={loading}
              >
                Checkout
              </button>

              {!userData ? (
                <>
                  <button className="d-lg-none d-md-none d-xl-none d-xxl-none">
                    <div
                      className={`mobile-menu-icon ${menuOpen ? "open" : ""}`}
                      onClick={toggleMenu}
                    >
                      <div className="bar bar-1"></div>
                      <div className="bar bar-2"></div>
                      <div className="bar bar-3"></div>
                    </div>
                  </button>

                  {/* Mobile Menu */}
                  <div className={`mobile-menu menu_bar ${menuOpen ? "active" : ""} d-lg-none`}>
                    <ul className="list-unstyled">
                      <li>
                        <a onClick={() => { imageSaveCheckout(); setMenuOpen(false); document.body.classList.remove("body_active"); }} style={{ cursor: "pointer" }}>
                          Checkout
                        </a>
                      </li>
                      <li>
                        <a onClick={() => { previewCard(); setMenuOpen(false); document.body.classList.remove("body_active"); }} style={{ cursor: "pointer" }}>
                          Preview
                        </a>
                      </li>
                      <li>
                        <a onClick={() => { openSignIn(); setMenuOpen(false); document.body.classList.remove("body_active"); }} style={{ cursor: "pointer" }}>
                          Sign In
                        </a>
                      </li>
                    </ul>
                  </div>

                  <button className="btn btn-primary save-sign-in-btn d-none d-lg-block d-md-block d-xl-block d-xxl-block" onClick={openSignIn}>
                    Sign In
                  </button>
                </>
              ) : (
                <div className="profile-menu ">
                  <div className="profile-section px-2">
                    <i className="far fa-user " style={{ color: 'black' }}></i>
                    <span className="d-none d-md-block d-xl-block d-xxl-block"> {userData.first_name} {userData.last_name}</span>
                    <i className="fa fa-caret-down ps-1"></i>
                  </div>

                  <ul className="submenu">

                    <li onClick={() => navigate('/cart')}>
                      <i className="far fa-image pe-2" aria-hidden="true"></i>
                      <span>My Pixovo</span>
                    </li>
                    <li onClick={() => navigate('/order')}>
                      <img className="pe-2" src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/order.svg`} alt="" />
                      <span>Orders</span>
                    </li>
                    <li onClick={() => navigate('/profile')}>
                      <i className="far fa-user-circle pe-2" aria-hidden="true"></i>
                      <span>My Profile </span>
                    </li>
                    <li onClick={logOut}>
                      <i className="fas fa-sign-out-alt pe-2" aria-hidden="true"></i>
                      <span>Signout</span>
                    </li>
                  </ul>
                </div>
              )}


            </div>
          )}

          {previewMode && (
            <div className="preview-actions d-flex gap-3">
              <button className="btn btn-secondary d-flex align-items-center justify-content-center" style={{ padding: "8px 18px", minWidth: "34px", minHeight: "34px" }} onClick={onBackToEdit}>Back to Edit</button>
              {isMobile && (<button
                type="button"
                className="btn d-flex align-items-center justify-content-center text-white "

                style={{ padding: "8px 12px", minWidth: "44px", minHeight: "34px", backgroundColor: '#0ba28d' }}
                onClick={continueToPay}
                aria-label="Checkout"
                title="Checkout"
              >
                <i className="fa fa-shopping-cart text-white" aria-hidden="true"></i>
              </button>)}
              {!isMobile && (
                <button
                  type="button"
                  className=" btn  btn-primary d-flex align-items-center justify-content-center  "

                  style={{ padding: "8px 12px", minWidth: "44px", minHeight: "34px", }}
                  onClick={continueToPay}
                  aria-label="Checkout"
                  title="Checkout"
                >Checkout</button>
              )}
              {!userData ? (
                <button className="btn btn-primary save-sign-in-btn" onClick={openSignIn}>
                  Sign In
                </button>
              ) : ("")}
            </div>
          )
          }
        </div >

        {/* Main Editing Tool Container */}
        {
          !isShowEditing && (
            <div ref={editingToolWindowRef} className="div-editing-tool">
              <div className="editor-container">
                {/* Multi-Card Canvas Area */}
                <div className="canvas-wrapper">

                  {/* All Cards Container */}
                  <div className={`all-cards-container ${isOpen ? "open-tools" : ""}`}>
                    <button
                      onClick={openSidePannel}
                      className={`side-panel ${isOpen ? "menu-active" : ""}`}>
                      <span className="tool-icon">
                        <i className="far fa-edit" aria-hidden="true"></i>
                      </span>
                    </button>
                    {isMobile && (
                      <div className={`${selectedObject ? "" : "d-none"} `}>
                        <h3 className="tool-action-label">Actions</h3>
                        <div className={`modal-editing-footer additional-tools ${isMobile ? "mobile-tools" : ""}`}>


                          {(selectedType === "layoutText" || selectedType === "text") && (
                            <>
                              <div className="mobile-tools-row">
                                <button className="font-family-name" onClick={_showTextFontPanel}>
                                  <span style={{ fontFamily: selectedObject?.data?.fontFamily || 'inherit' }}>
                                    {selectedObject?.data?.fontFamilyName}
                                  </span>

                                </button>


                                <FontSize
                                  selectedFontSize={selectedSize}
                                  onSizeChange={onFontSizeSelect}
                                />

                                <button onClick={_showTextColorPanel}>
                                  <span className="tool-icon">
                                    <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-text-color.svg`} alt="Color" />
                                  </span>
                                  <strong> Color</strong>
                                </button>
                              </div>
                            </>
                          )}

                          {selectedObject && (
                            <>
                              <div className="mobile-tools-row">
                                {selectedType === "image" && (
                                  <>
                                    {/* <button className="ai-btn" aria-label="AI Assistant" onClick={openAI}>
                                <span className="border"></span>
                                <span className="content">
                                  <i className="icon">
                                    AI
                                  </i>
                                </span>
                              </button> */}

                                    <button onClick={openImageLibrary} >
                                      <span className="tool-icon">
                                        <i className="fas fa-exchange-alt"></i>
                                      </span>
                                      <strong>Change</strong>
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={_showScalePanel}
                                  disabled={selectedObject.locked}
                                >
                                  <span className="tool-icon">
                                    <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-text-scale.svg`} alt="Scale" />
                                  </span>
                                  <strong>Scale</strong>
                                </button>
                                <button
                                  onClick={_showRotationPanel}
                                  disabled={selectedObject.locked}
                                >
                                  <span className="tool-icon">
                                    <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-text-rotate.svg`} alt="Rotate" />
                                  </span>
                                  <strong> Rotate</strong>
                                </button>

                                <div className="flex justify-center items-center min-h-screen bg-gray-50">
                                  <div className="w-56" ref={containerRef}>
                                    <button type="button"
                                      className="dropdown-button"
                                      onClick={() => setDropdownOpen(!isDropdownOpen)} >
                                      <span className="flex items-center gap-2">
                                        {selected?.icon && <img src={selected.icon} alt="icon" className="w-5 h-5" />}
                                        {selected ? selected.label : "Layers"}
                                      </span>
                                      <span>▾</span>
                                    </button>

                                    {isDropdownOpen && (
                                      <div className="custom-dropdown">
                                        {layerOptions.map((opt) => {
                                          const selectedLayer = mainObject.find((obj: any) => obj.selected);
                                          let disabled = false;

                                          if (!selectedLayer) {
                                            disabled = true;
                                          } else {
                                            const maxZ = Math.max(...mainObject.map((l: any) => l.zIndex));
                                            const minZ = Math.min(...mainObject.map((l: any) => l.zIndex));
                                            if ((opt.value === "send-backward" || opt.value === "send-to-back") && selectedLayer.zIndex === 0) {
                                              disabled = true;
                                            }
                                            if ((opt.value === "bring-forward" || opt.value === "bring-to-front") && selectedLayer.zIndex === maxZ) {
                                              disabled = true;
                                            }
                                          }

                                          return (
                                            <div
                                              key={opt.value}
                                              onClick={() => !disabled && handleLayerAction(opt.value)}
                                              className={`dropdown-item ${disabled ? "disabled opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"}`}
                                            >
                                              {opt.icon && <img src={opt.icon} alt="icon" className="w-5 h-5" />}
                                              <span>{opt.label}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                  </div>
                                </div>


                                {!isLocked && (
                                  <button onClick={deleteObject}>
                                    <span className="tool-icon">
                                      <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-trash.svg`} alt="Delete" />
                                    </span>
                                    <strong> Delete</strong>
                                  </button>
                                )}
                                <button onClick={doneWithSelection} className="tool-done-btn">
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-done.svg`} alt="Done" width="40" />
                                  <strong> Done</strong>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer Toolbar */}
                    <div className="tools-sidebar">
                      <div className="">
                        <h3 className="tool-action-label">Elements Tools</h3>
                        <div className="modal-editing-footer">
                          <button
                            onClick={addCard}
                            className={showBgColorPanel ? "active" : ""}
                          >
                            <span className="tool-icon">
                              <i className="far fa-plus-square" aria-hidden="true"></i>
                            </span>
                            <strong> Add page</strong>
                          </button>

                          <button
                            onClick={openBgColor}
                            className={showBgColorPanel ? "active" : ""}
                          >
                            <span className="tool-icon">
                              <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-text-color.svg`} alt="Color" />
                            </span>
                            <strong> Background</strong>
                          </button>

                          <button onClick={openArrangePages}>
                            <span className="tool-icon">
                              <i className="fa fa-columns" aria-hidden="true"></i>
                            </span>
                            <strong>Arrange Pages</strong>
                          </button>

                          {/* <button onClick={openLayout}>
                          <span className="tool-icon">
                            <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-layout.svg`} alt="Layout" />
                          </span>
                          <strong>Text Layout</strong>
                        </button> */}

                          <button onClick={addText}>
                            <span className="tool-icon">
                              <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-text.svg`} alt="Text" />
                            </span>
                            <strong>Add Text</strong>
                          </button>

                          <button onClick={openImageLibrary}>
                            <span className="tool-icon">
                              <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-photos.svg`} alt="Image" />
                            </span>
                            <strong>Image</strong>
                          </button>


                          <button onClick={openDates}>
                            <span className="tool-icon">
                              <i className="fa fa-calendar" aria-hidden="true"></i>
                            </span>
                            <strong>Dates</strong>
                          </button>

                          {/* <button onClick={openShapeLibrary}>
                          <span className="tool-icon">
                            <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/shapes.svg`} alt="Shapes" />
                          </span>
                          <strong>Shapes</strong>
                        </button>

                        <button onClick={openEmojiPanel}>
                          <span className="tool-icon">
                            <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-emoji.svg`} alt="Image Icon" />
                          </span>
                          <strong>Emojis</strong>
                        </button>

                        <button onClick={openStickerPanel}>
                          <span className="tool-icon">
                            <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-sticker.svg`} alt="Image Icon" />
                          </span>
                          <strong>Stickers</strong>
                        </button> */}
                        </div>

                        {/* Dynamic Tool Panels */}
                        {!isMobile && (
                          <div className={`${selectedObject ? "" : "d-none"} `}>
                            <h3 className="tool-action-label">Actions</h3>
                            <div className={`modal-editing-footer additional-tools ${isMobile ? "mobile-tools" : ""}`}>
                              {selectedType === "image" && (
                                <>
                                  {/* <button className="ai-btn" aria-label="AI Assistant" onClick={openAI}>
                                <span className="border"></span>
                                <span className="content">
                                  <i className="icon">
                                    AI
                                  </i>
                                </span>
                              </button> */}

                                  <button onClick={openImageLibrary} >
                                    <span className="tool-icon">
                                      <i className="fas fa-exchange-alt"></i>
                                    </span>
                                    <strong>Change</strong>
                                  </button>
                                </>
                              )}

                              {(selectedType === "layoutText" || selectedType === "text") && (
                                <>

                                  <button className="font-family-name" onClick={_showTextFontPanel}>
                                    <span style={{ fontFamily: selectedObject?.data?.fontFamily || 'inherit' }}>
                                      {selectedObject?.data?.fontFamilyName}
                                    </span>
                                    {/* <span className="tool-icon">
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-text-family.svg`} alt="Family" />
                                </span>
                                <strong>Font</strong> */}
                                  </button>

                                  {/* <button onClick={_showTextSizePanel}>
                                <span className="tool-icon">
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-text-size.svg`} alt="Size" />
                                </span>
                                <strong>Size</strong>
                              </button> */}

                                  <FontSize
                                    selectedFontSize={selectedSize}
                                    onSizeChange={onFontSizeSelect}
                                  />

                                  <button onClick={_showTextColorPanel}>
                                    <span className="tool-icon">
                                      <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-text-color.svg`} alt="Color" />
                                    </span>
                                    <strong> Color</strong>
                                  </button>
                                </>
                              )}

                              {selectedObject && (
                                <>
                                  <button
                                    onClick={_showScalePanel}
                                    disabled={selectedObject.locked}
                                  >
                                    <span className="tool-icon">
                                      <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-text-scale.svg`} alt="Scale" />
                                    </span>
                                    <strong>Scale</strong>
                                  </button>
                                  <button
                                    onClick={_showRotationPanel}
                                    disabled={selectedObject.locked}
                                  >
                                    <span className="tool-icon">
                                      <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-text-rotate.svg`} alt="Rotate" />
                                    </span>
                                    <strong> Rotate</strong>
                                  </button>

                                  <div className="flex justify-center items-center min-h-screen bg-gray-50">
                                    <div className="w-56" ref={containerRef}>
                                      <button type="button"
                                        className="dropdown-button"
                                        onClick={() => setDropdownOpen(!isDropdownOpen)} >
                                        <span className="flex items-center gap-2">
                                          {selected?.icon && <img src={selected.icon} alt="icon" className="w-5 h-5" />}
                                          {selected ? selected.label : "Layers"}
                                        </span>
                                        <span>▾</span>
                                      </button>

                                      {isDropdownOpen && (
                                        <div className="custom-dropdown">
                                          {layerOptions.map((opt) => {
                                            const selectedLayer = mainObject.find((obj: any) => obj.selected);
                                            let disabled = false;

                                            if (!selectedLayer) {
                                              disabled = true;
                                            } else {
                                              const maxZ = Math.max(...mainObject.map((l: any) => l.zIndex));
                                              const minZ = Math.min(...mainObject.map((l: any) => l.zIndex));
                                              if ((opt.value === "send-backward" || opt.value === "send-to-back") && selectedLayer.zIndex === 0) {
                                                disabled = true;
                                              }
                                              if ((opt.value === "bring-forward" || opt.value === "bring-to-front") && selectedLayer.zIndex === maxZ) {
                                                disabled = true;
                                              }
                                            }

                                            return (
                                              <div
                                                key={opt.value}
                                                onClick={() => !disabled && handleLayerAction(opt.value)}
                                                className={`dropdown-item ${disabled ? "disabled opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"}`}
                                              >
                                                {opt.icon && <img src={opt.icon} alt="icon" className="w-5 h-5" />}
                                                <span>{opt.label}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                    </div>
                                  </div>


                                  {!isLocked && (
                                    <button onClick={deleteObject}>
                                      <span className="tool-icon">
                                        <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-trash.svg`} alt="Delete" />
                                      </span>
                                      <strong> Delete</strong>
                                    </button>
                                  )}
                                  <button onClick={doneWithSelection} className="tool-done-btn">
                                    <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-done.svg`} alt="Done" width="40" />
                                    <strong> Done</strong>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Additional Tool Panels */}
                        <div className={`modal-editing-sub-footer ${!showAdditionalPanel ? "d-none" : ""}${showArrangePagesPanel ? 'arrange-section' : ''}${showImageLayout ? 'image-layout-section' : ''}${showDatesPanel ? 'date-panel' : ''}`}>
                          {/* Background Color Panel */}
                          {showBgColorPanel && (
                            <div className="w-100 h-100">
                              <div className="panel-header">
                                <h4>Background</h4>
                                <button onClick={hideChildPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>
                              <Bgcolor
                                selectedColor="#ffffff"
                                onSelectColor={onBgColorSelect}
                              />
                            </div>
                          )}

                          {showArrangePagesPanel && (
                            <div className="w-100 h-100">
                              <div className="panel-header">
                                <h4>Rearrange Pages</h4>
                                <button onClick={hideChildPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>
                              <div style={{
                                height: "360px",
                                overflowY: "scroll"
                              }}>
                                <DraggableCanvas
                                  initialItems={canvasObjects as any[]} // must be flat
                                  columns={2}
                                  Width={canvasPrevieWidth}
                                  Height={canvasPrevieHeight}
                                  Backgrounds={canvasBackgrounds}
                                  onChange={(newItems) => setCanvasObjects(newItems)}
                                  setBackgrounds={(newItems) => setCanvasBackgrounds(newItems)}
                                />

                              </div>
                            </div>
                          )}

                          {/* Layout Panel */}
                          {showLayoutPanel && (
                            <div className="w-100 h-100">
                              <div className="panel-header">
                                <h4>Layout</h4>
                                <button onClick={hideChildPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>
                              <div className="row pt-3">
                                {/* Blank */}
                                <div className="col-6 mb-3">
                                  <div className="layout-item h-100 justify-content-center d-flex align-items-center flex-column cursor-pointer"
                                    onClick={clearLayout}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="24" height="24" >
                                      <path fill="transparent" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M11 4H6.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C2 6.28 2 7.12 2 8.8v8.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C4.28 22 5.12 22 6.8 22h8.4c1.68 0 2.52 0 3.162-.327a3 3 0 0 0 1.311-1.311C20 19.72 20 18.88 20 17.2V13M8 16h1.675c.489 0 .733 0 .963-.055.204-.05.4-.13.579-.24.201-.123.374-.296.72-.642L21.5 5.5a2.121 2.121 0 0 0-3-3l-9.563 9.563c-.346.346-.519.519-.642.72a2 2 0 0 0-.24.579c-.055.23-.055.474-.055.963z"
                                      />
                                    </svg>
                                    <span>Blank</span>
                                  </div>
                                </div>

                                {/* 2 Sections */}
                                <div className="col-6 mb-3">
                                  <div className="layout-item cursor-pointer"
                                    onClick={() => onApplyLayout(1)}>
                                    <svg width="100%" height="60" viewBox="0 0 100 60">
                                      <rect x="10" y="10" width="80" height="15" fill="#e0e0e0" stroke="#999" />
                                      <rect x="10" y="35" width="80" height="15" fill="#e0e0e0" stroke="#999" />
                                    </svg>
                                    <div className="text-center mt-1">2 Sections</div>
                                  </div>
                                </div>

                                {/* 3 Sections */}
                                <div className="col-6 mb-3">
                                  <div
                                    className="layout-item cursor-pointer"
                                    onClick={() => onApplyLayout(2)}
                                  >
                                    <svg width="100%" height="60" viewBox="0 0 100 60">
                                      <rect x="10" y="5" width="80" height="12" fill="#e0e0e0" stroke="#999" />
                                      <rect x="10" y="24" width="80" height="12" fill="#e0e0e0" stroke="#999" />
                                      <rect x="10" y="43" width="80" height="12" fill="#e0e0e0" stroke="#999" />
                                    </svg>
                                    <div className="text-center mt-1">3 Sections</div>
                                  </div>
                                </div>

                                {/* Mixed */}
                                <div className="col-6 mb-3">
                                  <div
                                    className="layout-item cursor-pointer"
                                    onClick={() => onApplyLayout(3)}
                                  >
                                    <svg width="100%" height="60" viewBox="0 0 100 60">
                                      <rect x="5" y="10" width="40" height="40" fill="#e0e0e0" stroke="#999" />
                                      <rect x="55" y="10" width="40" height="18" fill="#e0e0e0" stroke="#999" />
                                      <rect x="55" y="32" width="40" height="18" fill="#e0e0e0" stroke="#999" />
                                    </svg>
                                    <div className="text-center mt-1">Mixed</div>
                                  </div>
                                </div>
                              </div>
                              {/* Layout options would go here */}
                            </div>
                          )}

                          {/* Image Library Panel */}
                          {showImageLibraryPanel && (
                            <div className="w-100 h-100">
                              <div className="panel-header">
                                <h4>Images</h4>
                                <button onClick={hideAdditionalPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>
                              <div className="set-gutter row mt-2 pb-4 justify-content-around images-set-scroll">
                                <div className="col-5 sub-item-box border-primary">
                                  <a onClick={() => fileInputRef.current?.click()}
                                    className="text-primary"
                                  >
                                    <i className="fa fa-plus-circle fa-2x"></i>
                                    Add Image
                                  </a>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={uploadImages}
                                    accept="image/*"
                                    hidden
                                  />
                                </div>
                                {uploadedImages.map((element, index) => (
                                  <div key={`${element.id}-${index}`} className="col-5 sub-item-box">
                                    <img
                                      src={element.src}
                                      crossOrigin="anonymous"
                                      className="cursor-pointer w-100 h-100"
                                      onClick={() => addImageToCanvas(element.src)}
                                      alt=""
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Shapes Library Panel */}
                          {showShapesLibraryPanel && (
                            <div className="w-100 h-100">
                              <div className="panel-header">
                                <h4>Shapes</h4>
                                <button onClick={hideAdditionalPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>
                              <div className="row gy-3 mt-2 pb-4 justify-content-around">
                                <div className="col-5 sub-item-box text-center">
                                  <a
                                    onClick={() => addShape("square")}
                                    className="text-success"
                                  >
                                    <span>
                                      <i className="fa fa-square fa-2x"></i>
                                      <br />
                                      Square
                                    </span>
                                  </a>
                                </div>
                                <div className="col-5 sub-item-box text-center">
                                  <a onClick={() => addShape("circle")} className="text-info" >
                                    <span>
                                      <i className="fa fa-circle fa-2x"></i>
                                      <br />
                                      Circle
                                    </span>
                                  </a>
                                </div>
                                <div className="col-5 sub-item-box text-center">
                                  <a onClick={() => addShape("rectangle")} className="text-yellow" >
                                    <span>
                                      <i className="icon-rectangle"></i>
                                      <br />
                                      Rectangle
                                    </span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}

                          {showVideoPanel && (
                            <div className="w-100 h-100">
                              <div className="panel-header d-flex">
                                <h4>Video</h4>
                                <button onClick={hideAdditionalPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>

                              <div className="p-2 Additional-tool-icons d-flex justify-content-center">
                                <input
                                  ref={videoInputRef}
                                  type="file"
                                  // onChange={handleUpload}
                                  accept="video/*"
                                  hidden
                                />

                                {/* Add Video Section */}
                                <div className={`row w-100 ${showVideoPreview ? "d-none" : ""}`}>
                                  <div className="col-12">
                                    <h3 className="text-center">
                                      Add a Video
                                      <br /> Message!
                                    </h3>
                                  </div>
                                  <div className="col-12">
                                    <ul>
                                      <li>Upload video recording</li>
                                      <li>We print QR code in card</li>
                                      <li>Then scan and play the message</li>
                                    </ul>
                                  </div>
                                  <div className="col-12">
                                    <button
                                      className="btn btn-primary w-100"
                                      onClick={() => videoInputRef.current?.click()}
                                    >
                                      Add Video
                                    </button>
                                  </div>
                                </div>

                                {/* Video Preview Section */}
                                <div className={`row w-100 ${!showVideoPreview ? "d-none" : ""}`}>
                                  <div className="col-12">
                                    <video
                                      ref={videoPlayerRef}
                                      controls
                                      className="w-100"
                                      style={{ maxHeight: "200px" }}
                                    >
                                      <source />
                                    </video>
                                  </div>

                                  <div className="col-12 pt-2 video-button">
                                    <span className="d-flex align-items-center">
                                      <i className="fa fa-info me-1"></i> {videoSize} MB
                                    </span>
                                    <span className="d-flex align-items-center">
                                      <i className="fa fa-play me-1"></i> {videoDuration}
                                    </span>
                                  </div>

                                  <div className="col-12 pt-3 video-button">
                                    <a onClick={() => videoInputRef.current?.click()} >
                                      <i className="fas fa-exchange-alt me-1"></i> Replace
                                    </a>
                                    <a href="#">
                                      <i className="fa fa-trash me-1"></i> Delete
                                    </a>
                                  </div>

                                  <div className="col-12 pt-2">
                                    <p>
                                      <label className="form-check-label" htmlFor="accept_video_conditions" >
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          id="accept_video_conditions"
                                          checked={isTermsAccepted}
                                          onChange={(e) =>
                                            setIsTermsAccepted(e.target.checked)
                                          }
                                        />{" "}
                                        I confirm that this video does not violate Forever
                                        Occasions's content rules as outlined in{" "}
                                        <a href="#" target="_blank">
                                          Terms and Conditions
                                        </a>
                                      </label>
                                    </p>
                                  </div>

                                  <div className="col-12 mt-3">
                                    {!uploadingProcess ? (
                                      <button
                                        className="btn btn-primary w-100"
                                        // onClick={addVideo}
                                        disabled={!isTermsAccepted}
                                      >
                                        Upload Video
                                      </button>
                                    ) : (
                                      <label className="btn btn-primary w-100 disabled">
                                        <i className="fas fa-circle-notch fa-spin"></i>{" "}
                                        Uploading...
                                      </label>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {showAudioPanel && (
                            <div className="w-100 h-100">
                              <div className="panel-header d-flex">
                                <h4>Audio</h4>
                                <button onClick={hideAdditionalPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>
                              <div className="p-2 Additional-tool-icons d-flex justify-content-center">
                                <input
                                  ref={audioInputRef}
                                  type="file"
                                  // onChange={uploadAudio}
                                  accept="audio/*"
                                  hidden
                                />

                                {/* No Preview */}
                                <div className={`row w-100 ${showAudioPreview ? "d-none" : ""}`}>
                                  <div className="col-12">
                                    <h3 className="text-center">
                                      Add an Audio
                                      <br /> Message!
                                    </h3>
                                  </div>
                                  <div className="col-12">
                                    <ul>
                                      <li>Upload audio recording</li>
                                      <li>We print QR code in card</li>
                                      <li>Then scan and play the message</li>
                                    </ul>
                                  </div>
                                  <div className="col-12">
                                    <button className="btn btn-primary w-100" onClick={() => audioInputRef.current?.click()}>
                                      Add Audio
                                    </button>
                                  </div>
                                </div>

                                {/* Preview */}
                                <div className={`row w-100 ${!showAudioPreview ? "d-none" : ""}`}>
                                  <div className="col-12">
                                    <audio ref={audioPlayerRef} controls className="w-100">
                                      <source />
                                    </audio>
                                  </div>
                                  <div className="col-12 pt-2 video-button">
                                    <span className="d-flex align-items-center">
                                      <i className="fa fa-info me-1"></i>
                                      {audioSize} MB
                                    </span>
                                    <span className="d-flex align-items-center">
                                      <i className="fa fa-play me-1"></i>
                                      {audioDuration}
                                    </span>
                                  </div>
                                  <div className="col-12 pt-3 video-button">
                                    <a onClick={() => audioInputRef.current?.click()} >
                                      <i className="fas fa-exchange-alt me-1"></i> Replace
                                    </a>
                                    <a href="#">
                                      <i className="fa fa-trash me-1"></i> Delete
                                    </a>
                                  </div>
                                  <div className="col-12 pt-2">
                                    <p>
                                      <label className="form-check-label" htmlFor="accept_video_conditions">
                                        <input
                                          type="checkbox"
                                          className="form-check-input"
                                          id="accept_video_conditions"
                                        />{" "}
                                        I confirm that this audio does not violate Forever
                                        Occasions's content rules as outlined in{" "}
                                        <a href="#" target="_blank" rel="noreferrer">
                                          Terms and Conditions
                                        </a>
                                      </label>
                                    </p>
                                  </div>
                                  <div className="col-12 mt-3">
                                    {!uploadingProcess ? (
                                      <button
                                        className="btn btn-primary w-100"
                                        // onClick={addAudio}
                                        disabled={!isTermsAccepted}
                                      >
                                        Upload Audio
                                      </button>
                                    ) : (
                                      <label className="btn btn-primary w-100 disabled">
                                        <i className="fas fa-circle-notch fa-spin"></i>{" "}
                                        Uploading...
                                      </label>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Emoji Panel */}
                          {showEmojiChildPanel && (
                            <div className="w-100 mh-100">
                              <div className="panel-header">
                                <h4>Emoji</h4>
                                <button onClick={hideAdditionalPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>
                              <div className="w-100 h-100 pt-3" id="emojiPanel"></div>
                            </div>
                          )}

                          {showStickerChildPanel && (
                            <div className="w-100 h-100">
                              <div className="panel-header">
                                <h4>Stickers</h4>
                                <button onClick={hideAdditionalPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>

                              {/* Stickers Component */}
                              <Stickers
                                onStickerSelect={(sticker) =>
                                  addImageToCanvas(sticker, "sticker")
                                }
                              />
                            </div>
                          )}

                          {showTextFontPanel && (
                            <div className="w-100 h-100">
                              <div className="panel-header">
                                <h4>Fonts</h4>
                                <button onClick={hideAdditionalPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>
                              <div className="w-100 h-100 text-font mt-4 mb-3">
                                <FontFamily
                                  selectedFont={selectedFontFamily}
                                  selectedfont={onFontSelect}
                                />
                              </div>
                            </div>
                          )}

                          {showTextColorPanel && (
                            <div className="w-100 h-100">
                              <div className="panel-header">
                                <h4>Colors</h4>
                                <button onClick={hideAdditionalPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>
                              <TextColor
                                selectedColor={selectedColor}
                                onColorSelection={onColorSelect}
                              />
                            </div>
                          )}

                          {showScalePanel && (
                            <div className="w-100 h-100">
                              <div className="panel-header">
                                <h4>Scale</h4>
                                <button onClick={hideAdditionalPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>
                              <Scale
                                zoom={selectedScale}
                                onScaleChanged={onScaleUpdate}
                              />
                            </div>
                          )}

                          {showRotationPanel && (
                            <div className="w-100 h-100">
                              <div className="panel-header">
                                <h4>Rotation</h4>
                                <button onClick={hideAdditionalPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>
                              <Rotation
                                angle={selectedAngle}
                                onAngleChanged={onAngleUpdate}
                              />
                            </div>
                          )}

                          {showImageLayout && (
                            <div className="w-100 h-100">
                              <div className="panel-header">
                                <h4>Change Layout</h4>
                                <button onClick={hideAdditionalPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>
                              <ImageLayout mainObject={mainObject} onLayoutSelect={handleLayoutSelect} canvasCardWidth={canvasWidth} canvasCardHeight={canvasHeight} />
                            </div>
                          )}

                          {showDatesPanel && (
                            <div className="w-100 h-100">
                              <div className="panel-header">
                                <h4>Photo dates</h4>
                                <button onClick={hideAdditionalPanel}>
                                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/icon-close.svg`} alt="Close" />
                                </button>
                              </div>
                              <div className="settings-card">
                                <div className="setting-row">
                                  <label className="label-text">Show dates</label>
                                  <label className="switch">
                                    <input type="checkbox" checked={showDates}
                                      onChange={(e) => setShowDates(e.target.checked)} />
                                    <span className="slider"></span>
                                  </label>
                                </div>

                                <div className="">
                                  <label className="label-text">Date format</label>
                                  {/* Format Dropdown */}
                                  <select
                                    className="select-box"
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value)}
                                    style={{
                                      marginTop: "10px",
                                      display: "block",
                                      padding: "6px",
                                      borderRadius: "6px",
                                      border: "1px solid #ccc",
                                    }}
                                  >
                                    <option value="MMMM DD, YYYY">August 20, 2020</option>
                                    <option value="DD MMMM YYYY">20 August 2020</option>
                                    <option value="YYYY-MM-DD">2020-08-20</option>
                                    <option value="MM/DD/YYYY">08/20/2020</option>
                                  </select>
                                </div>
                              </div>

                            </div>
                          )}

                        </div>
                      </div>
                    </div>

                    {/* Image Section */}
                    <div className="main-section text-center">
                      <div className="card-container">
                        <div
                          className="safety-area-label"
                          aria-hidden="true"
                          style={{ right: `calc(50% + ${canvasWidth / 2}px + 64px)` }}
                        >
                          SAFETY AREA
                        </div>

                        <div className="canvas-border m-0"
                          ref={(el) => {
                            canvasRefs.current[0] = el;
                          }}
                        >
                          {isAIprocces && (
                            <div className="Ai-active"></div>
                          )}

                          <div
                            className={`div-canvas`}
                            style={{
                              width: `${canvasWidth}px`,
                              height: `${canvasHeight}px`,
                              backgroundColor: selectedBgColor,
                              border: "0.6px dashed black",
                              margin: "0px",
                              position: "relative",
                            }}
                            onMouseMove={(e) => onMouseMove(e, 0)}
                            onMouseUp={(e) => onMouseUp(e, 0)}
                            // 👆 TOUCH EVENTS (Mobile)
                            onTouchMove={(e) => onTouchMove(e)}
                            onTouchEnd={(e) => onTouchEnd(e)}
                            onClick={(e) => onCanvasClick(e, canvasActiveIndex)}
                          >
                            {/* Render Main Objects */}
                            {mainObject.map((obj: any, objIndex: any) => (
                              <div
                                key={`${obj.id}-${objIndex}`}
                                className={`canvas-element ${obj.selected ? "selected-element" : ""}`}
                                style={{
                                  position: "absolute",
                                  left: `${obj.x - (obj.width || 100) / 2}px`,
                                  top: `${obj.y - (obj.height || 100) / 2}px`,
                                  width: `${obj.width || 100}px`,
                                  height: `${obj.height || 100}px`,
                                  transform: getElementTransform(obj),
                                  zIndex: obj.zIndex || objIndex,
                                  cursor: obj.locked ? "default" : "move",
                                }}
                                onMouseDown={(e) => startDrag(obj, e)}

                                onClick={(e) => selectObject(obj, e, 0)}
                                onDoubleClick={(e: any) => {
                                  onCanvasDoubleClick(e, objIndex)
                                }
                                }

                                // 👆 TOUCH EVENTS (Mobile)
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                  handleDubbleTap(obj, e);
                                  touchStartDrag(obj, e);
                                }}
                              >
                                {/* Text Objects */}
                                {obj.type === "text" && !isEditingText(obj) && (
                                  <div
                                    className="text-element"
                                    style={{
                                      fontSize: `${obj.data.fontSize}px`,
                                      fontFamily: obj.data.fontFamily,
                                      color: obj.data.fill,
                                      textAlign: obj.data.textAlign,
                                      width: "100%",
                                      height: "100%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: getTextJustification(obj.data.textAlign),
                                    }}
                                    onDoubleClick={(e) => startTextEdit(obj, e)}
                                  >
                                    {obj.data.text}
                                  </div>
                                )}

                                {/* Editable Text Input */}
                                {obj.type === "text" && isEditingText(obj) && (
                                  <input
                                    type="text"
                                    defaultValue={obj.data.text}
                                    style={{
                                      fontSize: `${obj.data.fontSize}px`,
                                      fontFamily: obj.data.fontFamily,
                                      color: obj.data.fill,
                                      textAlign: obj.data.textAlign,
                                      width: "100%",
                                      height: "100%",
                                      border: "none",
                                      outline: "none",
                                      background: "transparent",
                                    }}
                                    className="text-edit-input"
                                    onBlur={(e) => finishTextEdit(objIndex, e)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") finishTextEdit(objIndex, e);
                                      if (e.key === "Escape") cancelTextEdit(obj);
                                    }}
                                    autoFocus
                                  />
                                )}

                                {/* Layout Text */}
                                {obj.type === "layoutText" && (
                                  <div className="layout-text-element"
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      backgroundColor: obj.data.fill || "rgba(11, 162, 141,0.1)",
                                      border: `${obj.data.strokeWidth || 2}px dashed ${obj.data.stroke || "#0ba28d"}`,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    {!obj.editable || !isEditingText(obj) ? (
                                      <div
                                        style={{
                                          fontSize: `${obj.data.fontSize}px`,
                                          color: obj.data.textColor || "#000",
                                          textAlign: "center",
                                        }}
                                        onDoubleClick={(e) => startTextEdit(obj, e)}
                                      >
                                        {obj.data.text || "Add Text"}
                                      </div>
                                    ) : (
                                      <input
                                        type="text"
                                        defaultValue={obj.data.text}
                                        onBlur={(e) => finishTextEdit(objIndex, e)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") finishTextEdit(objIndex, e);
                                          if (e.key === "Escape") cancelTextEdit(obj);
                                        }}
                                        style={{
                                          width: "90%",
                                          height: "80%",
                                          textAlign: "center",
                                          fontSize: `${obj.data.fontSize}px`,
                                          background: "transparent",
                                          border: "none",
                                          outline: "none",
                                        }}
                                        className="layout-text-input"
                                        autoFocus
                                      />
                                    )}
                                  </div>
                                )}

                                {/* Image Objects */}
                                {obj.type === "image" && (
                                  <div
                                    className="image-layout-box"
                                    style={{
                                      width: `${obj.width || 100}px`,
                                      height: `${obj.height || 100}px`,
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundImage: `url(${obj.data.src})`,
                                        backgroundSize:
                                          obj.data.coverCanvas && (obj.scaleX || 1) >= 1
                                            ? "cover"
                                            : "contain",
                                        backgroundPosition: obj.data.objectPosition || "center",
                                        backgroundRepeat: "no-repeat",
                                        clipPath:
                                          obj.clipPath ||
                                          (obj.containerShape ? `url(#clip-${obj.containerShape})` : "none"),
                                      }}
                                      className="image-element"
                                      role="img"
                                      aria-label=""
                                    />
                                    {showDates && (
                                      <div className="image-date-box" style={{ position: "relative" }}>
                                        {obj.data.image_date
                                          ? formatDate(obj.data.image_date, format)
                                          : obj.data.image_date}
                                        <i
                                          className="fa fa-calendar ms-2"
                                          style={{ cursor: "pointer" }}
                                          aria-hidden="true"
                                          onClick={() => handleDateIconTap(obj.id, objIndex)}
                                          onTouchEnd={() => handleDateIconTap(obj.id, objIndex)}
                                        ></i>

                                        <input
                                          type="date"
                                          id={`${obj.id}-${objIndex}`}
                                          onChange={(e) => handleDateChange(e, objIndex)}
                                          max={today}
                                          style={{
                                            visibility: "hidden",
                                            position: "absolute",
                                            pointerEvents: "none",
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}


                                {/* Emoji Objects */}
                                {obj.type === "emoji" && (
                                  <img
                                    src={obj.data.src}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      display: "block",
                                      clipPath: obj.clipPath
                                        ? obj.clipPath
                                        : obj.containerShape
                                          ? `url(#clip-${obj.containerShape})`
                                          : "none",
                                    }}
                                    className="image-element"
                                    draggable={false}
                                    alt="emoji"
                                  />
                                )}

                                {/* Shape Objects */}
                                {obj.type === "shape" && (
                                  <div
                                    className={`shape-element ${getShapeClass(obj.data.shapeType)}`}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      backgroundColor: obj.data.fill,
                                      border: `${obj.data.strokeWidth || 2}px ${obj.data.strokeDashArray ? "dashed" : "solid"
                                        } ${obj.data.stroke || "#0ba28d"}`,
                                      position: "relative",
                                      overflow: "hidden",
                                    }}
                                  />
                                )}

                                {/* Selection Box */}
                                {obj.selected && !obj.locked && (
                                  <div
                                    className="selection-box"
                                    style={{
                                      position: "absolute",
                                      left: "0px",
                                      top: "0px",
                                      width: `100%`,
                                      height: `100%`,
                                      border: "2px dashed #0ba28d",
                                      pointerEvents: "none",
                                    }}
                                  />
                                )}

                                {/* Control Points */}
                                {obj.selected && !obj.locked && obj.type !== "handwriting-background" && (
                                  <div className="control-points">
                                    <div
                                      className="resize-handle nw-resize"
                                      style={{
                                        position: "absolute",
                                        left: "4px",
                                        top: "4px",
                                        width: "12px",
                                        height: "12px",
                                        backgroundColor: "#0ba28d",
                                        borderRadius: "50%",
                                        cursor: "nw-resize",
                                      }}
                                      onPointerDown={(e) => startResize(obj, "nw", e)}
                                    />
                                    <div
                                      className="resize-handle ne-resize"
                                      style={{
                                        position: "absolute",
                                        right: "4px",
                                        top: "4px",
                                        width: "12px",
                                        height: "12px",
                                        backgroundColor: "#0ba28d",
                                        borderRadius: "50%",
                                        cursor: "ne-resize",
                                      }}
                                      onPointerDown={(e) => startResize(obj, "ne", e)}
                                    />
                                    <div
                                      className="resize-handle se-resize"
                                      style={{
                                        position: "absolute",
                                        right: "4px",
                                        bottom: "4px",
                                        width: "12px",
                                        height: "12px",
                                        backgroundColor: "#0ba28d",
                                        borderRadius: "50%",
                                        cursor: "se-resize",
                                      }}
                                      onPointerDown={(e) => startResize(obj, "se", e)}
                                    />
                                    <div
                                      className="resize-handle sw-resize"
                                      style={{
                                        position: "absolute",
                                        left: "4px",
                                        bottom: "4px",
                                        width: "12px",
                                        height: "12px",
                                        backgroundColor: "#0ba28d",
                                        borderRadius: "50%",
                                        cursor: "sw-resize",
                                      }}
                                      onPointerDown={(e) => startResize(obj, "sw", e)}
                                    />

                                    {/* Rotation Handle */}
                                    <div
                                      className="rotation-line"
                                      style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "-30px",
                                        width: "2px",
                                        height: "25px",
                                        backgroundColor: "#0ba28d",
                                        transform: "translateX(-50%)",
                                      }}
                                    />
                                    <div
                                      className="rotation-handle"
                                      style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "-38px",
                                        width: "12px",
                                        height: "12px",
                                        backgroundColor: "#0ba28d",
                                        borderRadius: "50%",
                                        cursor: "grab",
                                        transform: "translateX(-50%)",
                                      }}
                                      // onPointerDown={(e) => startRotation(obj, e)}
                                      onMouseDown={(e) => startRotation(obj, e)}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                            <div className="page-edge" aria-hidden="true" />
                            <div className="bleed-line" aria-hidden="true" />

                          </div>
                        </div>
                        <div className={`page-side-tool`}>
                          {/* Background Color Panel */}
                          <div className="side-tool">
                            <button onClick={() => changeLayout(canvasActiveIndex)}>
                              <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/img/grid.svg`} alt="Close" />
                              <span>Change Layout</span>
                            </button>
                          </div>
                          <div className="side-tool">
                            <button onClick={() => removeCard(canvasActiveIndex)}>
                              <i className="fa fa-trash"></i>
                              <span>Delete Page</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* all Pages show live preview*/}
                    <div className="pages-panel">
                      {canvasObjects.map((canvas, mainIndex) => {
                        const actualCanvasIndex = mainIndex;
                        let label = '';
                        if (mainIndex === 0) {
                          label = 'Front Cover';
                        } else if (mainIndex === canvasObjects.length - 1) {
                          label = 'Back Cover';
                        } else {
                          label = `(${mainIndex}/${canvasObjects.length - 2})`;
                        }

                        return (
                          <div
                            key={actualCanvasIndex}
                            className={`card-container card-view ${getCardClasses(actualCanvasIndex)}${actualCanvasIndex % 2 === 0 ? " left" : " right"}`}
                            onClick={() => { onCanvasSelect(actualCanvasIndex); }} >
                            <div className="canvas-border" id={`div-canvas${actualCanvasIndex}`}
                              ref={(el) => { cardPreviewRef.current[actualCanvasIndex] = el; }}
                              style={{
                                width: `${canvasPrevieWidth}px`,
                                height: `${canvasPrevieHeight}px`,
                              }}>
                              <div
                                className="div-canvas"
                                style={{
                                  width: `100%`,
                                  height: `100%`,
                                  backgroundColor: canvasBackgrounds[actualCanvasIndex],
                                }}
                              >
                                {/* Render Canvas Objects */}
                                {canvas.map((obj, objIndex) => (
                                  <div
                                    key={obj.id}
                                    className={`canvas-element ${obj.selected ? "selected-element" : ""}`}
                                    style={{
                                      position: "absolute",
                                      left: `${obj.x - (obj.width || 100) / 2}px`,
                                      top: `${obj.y - (obj.height || 100) / 2}px`,
                                      width: `${obj.width || 100}px`,
                                      height: `${obj.height || 100}px`,
                                      transform: getElementTransform(obj),
                                      zIndex: obj.zIndex || objIndex,
                                      cursor: obj.locked ? "default" : "pointer",
                                    }}
                                  >
                                    {/* Text Objects */}
                                    {obj.type === "text" && !isEditingText(obj) && (
                                      <div
                                        className="text-element"
                                        style={{
                                          fontSize: `${obj.data.fontSize}px`,
                                          fontFamily: obj.data.fontFamily,
                                          color: obj.data.fill,
                                          textAlign: obj.data.textAlign,
                                          width: "100%",
                                          height: "100%",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: getTextJustification(obj.data.textAlign),
                                        }}
                                        onDoubleClick={(e) => startTextEdit(obj, e)}
                                      >
                                        {obj.data.text}
                                      </div>
                                    )}

                                    {/* Editable text input */}
                                    {obj.type === "text" && isEditingText(obj) && (
                                      <input
                                        type="text"
                                        defaultValue={obj.data.text}
                                        style={{
                                          fontSize: `${obj.data.fontSize}px`,
                                          fontFamily: obj.data.fontFamily,
                                          color: obj.data.fill,
                                          textAlign: obj.data.textAlign,
                                          width: "100%",
                                          height: "100%",
                                          border: "none",
                                          outline: "none",
                                          background: "transparent",
                                        }}
                                        className="text-edit-input"
                                        autoFocus
                                      />
                                    )}

                                    {/* Layout Text Objects */}
                                    {obj.type === "layoutText" && (
                                      <div
                                        className="layout-text-element"
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          backgroundColor: obj.data.fill || "rgba(11, 162, 141, 0.1)",
                                          border: `${obj.data.strokeWidth || 2}px dashed ${obj.data.stroke || "#0ba28d"}`,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          borderWidth: "thin",
                                        }}
                                      >
                                        {(!obj.editable || !isEditingText(obj)) && (
                                          <div
                                            style={{
                                              fontSize: `${obj.data.fontSize}px`,
                                              color: obj.data.textColor || "#000",
                                              textAlign: "center",
                                            }}
                                          >
                                            {obj.data.text || "Add Text"}
                                          </div>
                                        )}

                                        {obj.editable && isEditingText(obj) && (
                                          <input
                                            type="text"
                                            defaultValue={obj.data.text}
                                            style={{
                                              width: "90%",
                                              height: "80%",
                                              textAlign: "center",
                                              fontSize: `${obj.data.fontSize}px`,
                                              background: "transparent",
                                              border: "none",
                                              outline: "none",
                                            }}
                                            className="layout-text-input"
                                            autoFocus
                                          />
                                        )}
                                      </div>
                                    )}

                                    {/* Image Objects */}
                                    {obj.type === "image" && (
                                      <div
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          backgroundImage: `url(${(obj as ElementImageObject).data.src})`,
                                          backgroundSize:
                                            (obj as ElementImageObject).data.coverCanvas &&
                                              (((obj as any).originalData?.[0]?.scaleX ?? (obj as any).scaleX ?? 1) >= 1)
                                              ? "cover"
                                              : "contain",
                                          backgroundPosition:
                                            (obj as any).originalData?.[0]?.data?.objectPosition ||
                                            (obj as ElementImageObject).data.objectPosition ||
                                            "center",
                                          backgroundRepeat: "no-repeat",
                                          clipPath:
                                            obj.clipPath || (obj.containerShape ? `url(#clip-${obj.containerShape})` : "none"),
                                        }}
                                        className="image-element"
                                        role="img"
                                        aria-label=""
                                      />
                                    )}


                                    {/* Emoji Objects */}
                                    {obj.type === "emoji" && (
                                      <img
                                        src={obj.data.src}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          display: "block",
                                          clipPath: obj.clipPath ? obj.clipPath : obj.containerShape ? `url(#clip-${obj.containerShape})` : "none",
                                        }}
                                        className="image-element"
                                        onError={onImageError}
                                        draggable={false}
                                        alt="emoji"
                                      />
                                    )}

                                    {/* Shape Objects */}
                                    {obj.type === "shape" && (
                                      <div
                                        className={`shape-element ${getShapeClass((obj as ElementShapeObject).data.shapeType)}`}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          backgroundColor: (obj as ElementShapeObject).data.fill,
                                          border: `${(obj as ElementShapeObject).data.strokeWidth || 2}px ${(obj as ElementShapeObject).data.strokeDashArray ? "dashed" : "solid"} ${(obj as ElementShapeObject).data.stroke || "#0ba28d"}`,
                                          position: "relative",
                                          overflow: "hidden",
                                        }}
                                      >
                                        {/* Shape image content would go here */}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="page-preview-lable"><span>{label}</span></div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Preview Mode */}
        {
          previewMode && previewImages && (
            <div ref={previewWindowRef} className="preview-window">
              <div className="flipbook-wrapper d-flex flex-column align-items-center justify-content-center">
                <div className="navigation">
                  <button onClick={goPrev} className="next" >
                    <i className="fa fa-arrow-left" aria-hidden="true"></i>
                  </button>

                  <button onClick={goNext} className="preview" >
                    <i className="fa fa-arrow-right" aria-hidden="true"></i>
                  </button>
                </div>
                {/*======================================================================*/}
                {/* Flipbook — rendered DIRECTLY from canvasObjects (master data via    */}
                {/* originalData[0]). We no longer display the html2canvas-rasterised   */}
                {/* PNGs that generatePreviewsRecursively() produces; the browser       */}
                {/* renders each page's native <img>/text/shape elements at full source */}
                {/* resolution, so the on-screen preview matches the editor canvas. The */}
                {/* bitmap pipeline still runs because previewImages / imageFiles are   */}
                {/* consumed by saveAlbum() / continueToPay() for checkout & PDF.        */}
                {/*======================================================================*/}
                <HTMLFlipBook
                  width={canvasWidth}
                  height={canvasHeight}
                  className="flip-book"
                  showCover={true}
                  size="stretch"
                  {...({} as any)}
                  ref={flipBook}
                >
                  {canvasObjects.map((pageElems: any[], pageIdx: number) => {
                    const bgColor = canvasBackgrounds[pageIdx] || "#ffffff";
                    return (
                      <div
                        className="page"
                        key={`preview-page-${pageIdx}`}
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          background: "#c0c0c0",
                          padding: "4px",
                          boxSizing: "border-box",
                        }}
                      >
                        {/* Inner canvas: keeps the editor aspect ratio (inside the     */}
                        {/* safety/bleed inset) regardless of the stretched slot size.  */}
                        <div
                          className="preview-page-canvas"
                          style={{
                            position: "relative",
                            width: "100%",
                            aspectRatio: `${canvasWidth - 2 * BLEED_PX} / ${canvasHeight - 2 * BLEED_PX}`,
                            maxHeight: "100%",
                            backgroundColor: bgColor,
                            overflow: "hidden",
                            boxSizing: "border-box",
                          }}
                        >
                          {pageElems.map((wrapper: any, idx: number) => {
                            //==// Prefer master-sized data (originalData[0]); fall  //==//
                            //==// back to the wrapper for legacy objects.           //==//
                            const obj = wrapper?.originalData?.[0] || wrapper;
                            if (!obj) return null;

                            const w = obj.width || 100;
                            const h = obj.height || 100;
                            const cx = obj.x ?? canvasWidth / 2;
                            const cy = obj.y ?? canvasHeight / 2;
                            //=// Safety-area crop: shift coords by -BLEED_PX so the //=//
                            //=// visible area starts at the green safety line.       //=//
                            const visibleW = canvasWidth - 2 * BLEED_PX;
                            const visibleH = canvasHeight - 2 * BLEED_PX;
                            const leftPct = ((cx - w / 2 - BLEED_PX) / visibleW) * 100;
                            const topPct = ((cy - h / 2 - BLEED_PX) / visibleH) * 100;
                            const widthPct = (w / visibleW) * 100;
                            const heightPct = (h / visibleH) * 100;
                            const transform = `rotate(${obj.rotation || 0}deg) scale(${obj.scaleX ?? 1}, ${obj.scaleY ?? 1})`;

                            const ELEMENT_INSET_PX = 2;
                            const baseStyle: React.CSSProperties = {
                              position: "absolute",
                              left: `calc(${leftPct}% + ${ELEMENT_INSET_PX}px)`,
                              top: `calc(${topPct}% + ${ELEMENT_INSET_PX}px)`,
                              width: `calc(${widthPct}% - ${2 * ELEMENT_INSET_PX}px)`,
                              height: `calc(${heightPct}% - ${2 * ELEMENT_INSET_PX}px)`,
                              transform,
                              zIndex: obj.zIndex ?? idx,
                              overflow: "hidden",
                            };

                            //=// Image — CSS background-image, cover/contain to    //=//
                            //=// preserve aspect, mirroring the editor canvas.      //=//
                            if (obj.type === "image") {
                              const isCover = !!obj.data?.coverCanvas;
                              const useCover = isCover && (obj.scaleX || 1) >= 1;
                              return (
                                <div
                                  key={`${obj.id}-${idx}`}
                                  className="image-layout-box"
                                  style={baseStyle}
                                >
                                  <div
                                    className="image-element"
                                    role="img"
                                    aria-label=""
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      backgroundImage: `url(${obj.data?.src})`,
                                      backgroundSize: useCover ? "cover" : "contain",
                                      backgroundPosition: obj.data?.objectPosition || "center",
                                      backgroundRepeat: "no-repeat",
                                      clipPath:
                                        obj.clipPath ||
                                        (obj.containerShape ? `url(#clip-${obj.containerShape})` : "none"),
                                    }}
                                  />
                                </div>
                              );
                            }

                            //=// Text / layoutText — same render as editor canvas. //=//
                            if (obj.type === "text" || obj.type === "layoutText") {
                              const isLayoutText = obj.type === "layoutText";
                              return (
                                <div
                                  key={`${obj.id}-${idx}`}
                                  style={{
                                    ...baseStyle,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: getTextJustification(obj.data?.textAlign),
                                    fontSize: `${obj.data?.fontSize ?? 24}px`,
                                    fontFamily: obj.data?.fontFamily || "Arial",
                                    color: obj.data?.fill || obj.data?.textColor || "#000",
                                    textAlign: obj.data?.textAlign || "center",
                                    backgroundColor: isLayoutText
                                      ? obj.data?.fill || "rgba(11, 162, 141, 0.1)"
                                      : undefined,
                                    border: isLayoutText
                                      ? `${obj.data?.strokeWidth || 2}px dashed ${obj.data?.stroke || "#0ba28d"}`
                                      : undefined,
                                    borderWidth: isLayoutText ? "thin" : undefined,
                                  }}
                                >
                                  {!isLayoutText ? obj.data?.text : null}
                                </div>
                              );
                            }

                            //=// Shape — rectangle / circle. //=//
                            if (obj.type === "shape") {
                              const shapeType = obj.data?.shapeType || "rectangle";
                              return (
                                <div
                                  key={`${obj.id}-${idx}`}
                                  style={{
                                    ...baseStyle,
                                    backgroundColor: obj.data?.fill || "transparent",
                                    border: obj.data?.strokeWidth
                                      ? `${obj.data.strokeWidth}px solid ${obj.data.stroke || "#000"}`
                                      : undefined,
                                    borderRadius: shapeType === "circle" ? "50%" : undefined,
                                  }}
                                />
                              );
                            }

                            //=// Unknown type — skip (matches old bitmap path). //=//
                            return null;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </HTMLFlipBook>

              </div>
            </div>
          )
        }
      </div >

      {/* Popup */}
      {openChat && (
        <div className="chat-popup">
          <form className="form-container">
            <h2>Note</h2>

            <label>
              <b>Message</b>
            </label>

            <textarea
              placeholder="Type message..."
              required
            ></textarea>
            <div className="button-box d-flex">
              <button type="button" className="btn">
                Submit
              </button>

              <button type="button" className="btn cancel" onClick={() => setOpenChat(false)}>
                Close
              </button>
            </div>
          </form>
        </div>
      )}


      <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex={1} aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title fs-5" id="staticBackdropLabel">
                <i className="fa fa-desktop ps-2 pe-2" aria-hidden="true"></i>
                Upload from your computer
              </h2>
              <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}>
                <i className="fa fa-times" aria-hidden="true"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className={`p-book-upload-block ${dragActive ? "drag-active" : ""}`}
              // onDragEnter={uploadHandleDrag}
              // onDragOver={uploadHandleDrag}
              // onDragLeave={uploadHandleDrag}
              // onDrop={handleDrop}
              >
                <input id="upload-your-photos" type="file" multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} />

                {/* Styled label */}
                <label htmlFor="upload-your-photos">
                  <h2> {dragActive ? "Drop files here 📂" : "Drag & Drop Photos Here"} </h2>
                  <p>or click to browse from your computer</p>
                </label>
              </div>
              <div className=" mt-4"> Uploaded Photos (<span id="photoCount">{files.length}</span>) </div>
              <hr />
              <div className="progress-scroll">

                {files.map((f, i) => {
                  const originalIndex = files.findIndex((file) => file === f);

                  return (
                    <div key={i} className="mb-3 image-progress-card">
                      <img src={f.url} alt="preview" className="preview-img" />
                      <div key={i} className="progress-file-info" style={{ marginTop: "10px" }}>
                        <div className="file-info">
                          <div className="file-name">
                            {f.file && f.file.name}
                          </div>
                          <div className="meta-speed text-sm text-gray-600 flex gap-1">
                            <div>
                              {f.file && formatBytes(f.file && f.file.size)}{" "} |
                            </div>
                            <div>{f.speed.toFixed(2)} MB/s</div>
                          </div>
                        </div>
                        <div className="progress-container">
                          <div className="progress-outer"
                            style={{
                              width: "100%",
                              background: "#eee",
                              height: "10px",
                              borderRadius: "15px"
                            }}>
                            <div
                              style={{
                                width: `${f.progress}%`,
                                height: "100%",
                                background: `${f.status == "Failed" ? "red" : "green"
                                  }`,
                              }}
                            />
                          </div>
                          <div className="small time-left text-gray-500 mt-1">
                            {f.status !== "Failed" && f.status !== "Completed" ? f.eta.toFixed(2) + "s" : f.status}
                          </div>
                        </div>
                      </div>
                      {f.status == "Failed" && (
                        <div>
                          <button className="btn btn-danger btn-sm m-2"
                          // onClick={() => removeFile(originalIndex)}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              {/* Continue requires every upload to have SUCCEEDED. It previously
                  accepted "Failed" too — the gate only asked whether uploads had
                  stopped, not whether they worked — so failed rows (still
                  holding a blob preview) were carried onto the canvas and saved
                  with the order, printing blank. */}
              <button className="btn btn-secondary" onClick={setImageCollare}
                disabled={
                  files.length === 0 ||
                  !files.every((f: any) => f.status === "Completed")
                }>
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};


/**
 * Suspense lives here, not in main-layout.tsx — see order-detail/page.tsx for why.
 * The editor has its own full-screen loading state, so null is the right fallback.
 */
export default function ElementEditingToolRoute(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <ElementEditingTool {...props} />
    </Suspense>
  );
}
