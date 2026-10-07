"use client";
import React, { useState, useEffect, useRef } from "react";
import { get } from "../app/api/service/storage";
import { getActiveUser, ensureGuestUser } from "../app/api/service/guest";
import { toastWarning, toastError, toastSuccess, toastConfirm, toastInformational } from "../app/api/service/common";
import { useRouter } from "next/navigation";
import { apiPost } from "../app/api/service/api-service";
import { useUser } from "../app/context/UserContext";
import { useLoader } from "../app/context/LoaderContext";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

interface Step3Props {
  isShowAi: boolean;
  setStep: () => void;
  onContinue: () => void;
}

interface UploadFile {
  id?: string;
  file?: File | any;
  url?: string;
  previewBlobUrl?: string;
  status?: string;
  progress: number;
  speed: number; // in MB/s
  eta: number; // in seconds
  width?: any;
  height?: any;
  image_type?: string;
}

const Step3: React.FC<Step3Props> = ({ isShowAi, setStep, onContinue }) => {
  const [images, setImages] = useState<any[]>([]);
  const [imagesFilter, setImagesFilter] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [AICurationShow, setAICurationShow] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  let storedUser = get<any>("user");
  const startYear = 2003;
  const endYear = new Date().getFullYear() - 1;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",];
  const [activeTab, setActiveTab] = useState("Year");
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedMonth, setSelectedMonth] = useState<any>("Jan");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [getAllFacebookPhoto, setAllFacebookPhoto] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const filesRef = useRef<any[]>([]);
  const { showLoader, hideLoader } = useLoader();
  const facebook_appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "";
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  let temp_id = typeof window !== "undefined" ? localStorage.getItem("temp_id") || "" : "";
  const selectedCount = getAllFacebookPhoto.filter((photo) => photo.isActive).length;
  const [photos, setFbPhotos] = useState<any[]>([]);

  const resolvePreviewUrl = (path?: string | null) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path) || path.startsWith("blob:") || path.startsWith("data:")) {
      return path;
    }

    const apiOrigin = apiBaseUrl.replace(/\/api\/front-end\/?$/, "").replace(/\/$/, "");
    if (!apiOrigin) return path;

    return `${apiOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  useEffect(() => {
    if (temp_id) {
      fetchImages();
    }

    //======//  Facebook SDK script loaded //======//
    if (document.getElementById("facebook-jssdk")) return;
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("✅ FB SDK script loaded");

      (window as any).FB.init({
        appId: facebook_appId, // <-- your App ID
        cookie: true,
        xfbml: true,
        version: "v20.0",
      });

      console.log("✅ FB SDK initialized");
    };

    document.body.appendChild(script);
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, []);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    fetchImages();
  }, [user]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);

    setAllFacebookPhoto((prev) =>
      prev.map((photo) => ({
        ...photo,
        isActive: checked,
      }))
    );
  };

  const togglePhoto = (facebookId: string) => {
    setAllFacebookPhoto((prev) =>
      prev.map((photo) =>
        photo.facebook_id === facebookId
          ? { ...photo, isActive: !photo.isActive }
          : photo
      )
    );
  };

  // 🔹 Fetch images from API (already uploaded → completed)
  const fetchImages = async () => {
    storedUser = get<any>("user");
    // if (storedUser) {
    try {
      showLoader();
      const res = await apiPost<any>("image/list", {

        isLowQuality: 0,
        user_id: storedUser ? storedUser._id : temp_id
      });

      if (res.status && Array.isArray(res.data.records)) {
        const apiImages: any = res.data.records.map((item: any) => ({
          id: item._id,
          type: "API",
          url: resolvePreviewUrl(item.image_compressed),
          width: item.width,
          height: item.height,
          progress: 100,
          speed: "",
          timeLeft: "Completed",
          status: "completed",
          image_type: item.image_type,
        }));

        const fileArray = res.data.records.map((item: any) => ({
          id: item._id,
          status: "Completed",
          url: resolvePreviewUrl(item.image_compressed),
          progress: 100,
          speed: 0,
          eta: 0,
          image_type: item.image_type,
        }));
        setFiles((prev) => {
          const existingIds = new Set(prev.map((f) => f.id).filter(Boolean));
          const newRecords = fileArray.filter((f: any) => !existingIds.has(f.id));
          return [...prev, ...newRecords];
        });
        setAllFacebookPhoto((prev) => {
          const existingIds = new Set(prev.map((f) => f.id).filter(Boolean));
          const newRecords = fileArray.filter((f: any) => !existingIds.has(f.id));
          return [...prev, ...newRecords];
        });
        setImages((prev) => {
          const existingIds = new Set(prev.map((img) => img.id));
          const newOnes = apiImages.filter((img: any) => !existingIds.has(img.id));
          return [...prev, ...newOnes];
        });
        hideLoader();
      } else {
        hideLoader();
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
      hideLoader();
    }
  };

  /**
   * Mark a row failed AND drop its blob preview.
   *
   * The failure branches used to set only `status`, leaving the
   * URL.createObjectURL preview on `url`. Step 3's state is not persisted (the
   * editor re-reads from image/list), so this was harmless here — but the same
   * pattern copied into element-editing is what put `blob:` URLs into a saved
   * order and printed blank pages. Kept aligned so the safe version is the one
   * that gets copied next time.
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

  const uploadFile = (fileObj: UploadFile, index: number): Promise<void> => {
    return new Promise<void>((resolve) => {
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

        if (
          xhr.status >= 200 &&
          xhr.status < 300 &&
          responseData?.data?.inserted?.length
        ) {
          setFiles((prev) => {
            const updated: any = [...prev];
            if (updated[index]) {
              const inserted = responseData.data.inserted[0];
              const s3Url = resolvePreviewUrl(inserted.image_compressed);
              updated[index] = {
                ...updated[index],
                status: "Completed",
                image_type: "computer",
                progress: 100,
                speed: 0,
                eta: 0,
                height: inserted.height || null,
                width: inserted.width || null,
                url: s3Url || updated[index].previewBlobUrl || null,
                previewBlobUrl: updated[index].previewBlobUrl,
                id: inserted._id || null,
              };
            }
            return updated;
          });
        } else {
          markFailed(index);
        }
        resolve();
      };

      xhr.onerror = () => {
        markFailed(index);
        resolve();
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
  };


  //===// Handle file selection //===//
  const handleFiles = async (fileList: any) => {
    let storedUser = get<any>("user");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const imageFiles = Array.from(fileList).filter((file: any) =>
      allowedTypes.includes(file.type)
    );

    if (imageFiles.length === 0) {
      toastWarning("Only image files (JPG, PNG, WebP, GIF) are allowed.");
      return;
    }

    const newFiles: UploadFile[] = imageFiles.map((file: any) => {
      const blobUrl = URL.createObjectURL(file);
      return {
        file,
        status: "Pending",
        url: blobUrl,
        previewBlobUrl: blobUrl,
        progress: 0,
        speed: 0,
        eta: 0,
        image_type: "computer",
      };
    });

    const baseIndex = filesRef.current.length;
    setFiles((prev) => [...prev, ...newFiles]);
    const BATCH_SIZE = 3;
    for (let i = 0; i < newFiles.length; i += BATCH_SIZE) {
      const batch = newFiles.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((fileObj: any, j: number) => startUpload(fileObj, baseIndex + i + j))
      );
    }
  };

  //===// Upload single file //===//
  const startUpload = (fileObj: UploadFile, index: number): Promise<void> => {
    setFiles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: "InProgress" };
      return updated;
    });
    return uploadFile(fileObj, index);
  };

  //===// handle drag events //===//
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  //===// handle drop //===//
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const nextStep = async () => {
    storedUser = getActiveUser();
    if (!storedUser) {
      storedUser = await ensureGuestUser();
    }
    if (!files.length) {
      toastWarning("Please upload your photos.");
      return;
    }

    // Failed uploads never reached the server, so those photos simply will not
    // be in the editor's library. Continuing is still allowed — unlike the
    // editor's add-photos modal, nothing broken can be carried forward from
    // here — but say so rather than letting the customer discover it later.
    const failedCount = files.filter((f: any) => f.status === "Failed").length;
    if (failedCount > 0) {
      toastWarning(
        `${failedCount} photo${failedCount > 1 ? "s" : ""} didn't upload and won't be available in the editor.`
      );
    }

    // 🔹 API call <= that not need for now that old code needed for app images save
    showLoader();
    if (imageFiles.length) {
      const isGuest = !storedUser || storedUser.type === "guest";
      const formData = new FormData();
      formData.append("image_type", "computer");
      if (storedUser?._id) formData.append("user_id", storedUser._id);
      imageFiles.forEach((file) => {
        formData.append("images", file.img);
      });
      const res = await apiPost<any>(isGuest ? "image/temp-add" : "image/add", formData);
      if (res.status) {
        hideLoader();
        router.push("/element-editing");
        toastSuccess(res.message);
      } else {
        hideLoader();
        toastError(res.message);
      }
    } else {
      await hideLoader();
      router.push("/element-editing");
    }
  };

  const AiCuration = async () => {
    const el = document.getElementById("step-3");
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 10;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    setAICurationShow(true);
  };

  const AiCurationBack = async () => {
    if (AICurationShow) {
      const el = document.getElementById("step-3");
      if (el) {
        const y = el.getBoundingClientRect().top + window.pageYOffset - 10;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
      setAICurationShow(false);
    } else {
      console.log("setStepzxdZX");

      // router.push("/photo-book?stepId=2");
      setStep();
    }
  };

  const removeImage = async (item: any, ind: number) => {
    try {
      if (item.id) {
        setFiles((prev) => prev.filter((f) => (f.id && item.id ? f.id !== item.id : f !== item)));
        setImages((prev) => prev.filter((img) => (img.id && item.id ? img.id !== item.id : img !== item)));
        setImageFiles((prev) => prev.filter((_, index) => index !== ind));
        setImagesFilter((prev) => prev.filter((img) => (img.id && item.id ? img.id !== item.id : img !== item)));
        const formData = new FormData();
        formData.append("id", item.id);
        let apiResponse: any = await apiPost(`image/delete`, formData);
        if (apiResponse.status) {
          toastSuccess(apiResponse.message);
        }
      } else {
        setFiles((prev) => prev.filter((f) => f !== item));
      }
      // The preview blob lives on `url` or `previewBlobUrl`, not `img` — this read `item.img`,
      // which is undefined here, so .startsWith threw into the catch below and
      // the object URL was never released. Every preview leaked until the tab
      // closed. Check all keys defensively.
      const previewUrl = item?.url ?? item?.previewBlobUrl ?? item?.img;
      if (typeof previewUrl === "string" && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch (err) {
      console.error("Failed to delete image:", err);
    }
  };

  // Function to remove a file from the list
  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      updated.splice(index, 1); // remove file at index
      return updated;
    });
  };

  async function checkLoginAndFetchPhotos() {
    let result = toastInformational('Privacy Notice', 'Photos are not used for advertising, profiling, analytics, or sharing.');
    if ((await result).isConfirmed) {
      if (!storedUser || !storedUser._id) {
        hideLoader();
        toastWarning("You need to sign in before accessing Facebook photos.");
        return;
      }
      setShowModal(true);
    }
  }

  function getFacebookImage() {
    showLoader();
    (window as any).FB.getLoginStatus(function (response: any) {
      if (response.status === "connected") {
        handleFetchPhotos(response.authResponse.accessToken);
      } else {
        (window as any).FB.login(function (loginResponse: any) {
          if (loginResponse.authResponse) {
            hideLoader();
            handleFetchPhotos(loginResponse.authResponse.accessToken);
          }
        },
          { scope: "user_photos" }
        );
      }
    });
  }

  // Function to trigger fetch
  const handleFetchPhotos = (accessToken: string) => {
    if (activeTab === "Year" && selectedYear) {
      getFacebookPhotos(accessToken, { year: selectedYear });
    } else if (activeTab === "Month" && selectedYear && selectedMonth) {
      const monthName = months.indexOf(selectedMonth) + 1;
      getFacebookPhotos(accessToken, { year: selectedYear, month: monthName });
    } else if (activeTab === "Custom" && fromDate && toDate) {
      getFacebookPhotos(accessToken, { from: fromDate, to: toDate });
    } else {
      alert("Please select valid filters.");
    }
  };

  const getFacebookPhotos = (accessToken: string, filter: { year?: number; month?: number; from?: string; to?: string }) => {
    let params: any = {
      access_token: accessToken,
      fields: "id,album,images,name,picture,created_time",
      limit: 100,
    };

    // Year filter
    if (filter.year && !filter.month) {
      params.since = `${filter.year}-01-01`;
      params.until = `${filter.year}-12-31`;
    }

    // Year + Month filter
    if (filter.year && filter.month) {
      const monthStr = filter.month.toString().padStart(2, "0");
      const startDate = `${filter.year}-${monthStr}-01`;
      const endDate = new Date(filter.year, filter.month, 0).toISOString().split("T")[0];
      params.since = startDate;
      params.until = endDate;
    }

    // Custom date range filter
    if (filter.from && filter.to) {
      params.since = filter.from;
      params.until = filter.to;
    }

    (window as any).FB.api("/me/photos/uploaded", "GET", params,
      async (response: any) => {
        if (response && !response.error) {
          const newFiles = response.data.map((file: any) => ({
            id: null,
            facebook_id: file.id,
            type: "Facebook",
            image_type: 'facebook',
            status: "Completed",
            speed: 0,
            eta: 0,
            url: file.images[0].source,
            created: file.created_time,
            isActive: false,
          }));
          if (newFiles && newFiles.length) {
            setAllFacebookPhoto(newFiles);
            setShowPhotos(true);
            setShowModal(false);
          }

          if (response.data.length) {
            const photos = response.data.map((item: any) => {
              const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
              return {
                id: item.id,
                source: firstImage?.source || "",
                height: firstImage?.height || 0,
                width: firstImage?.width || 0,
                created: item.created_time || "",
              };
            });

            if (photos && photos.length) {
              setFbPhotos(photos);
            }
          } else {
            hideLoader();
            setShowModal(false);
            toastWarning("Facebook photos not found");
          }
        } else {
          hideLoader();
          setShowModal(false);
          toastError("Error fetching photos");
          console.error("Error fetching photos:", response.error);
        }
      }
    );
  };

  const LowQulity = (e: any) => {
    let LowQulityImageCheck = e.target.checked;
    if (LowQulityImageCheck) {
      const newImages = images.filter(
        (d, i) => d.width >= 1440 && d.height >= 960
      );
      console.log("newImages", newImages);
      setImagesFilter(newImages);
    } else {
      const newImages = images;
      console.log("newImages-else", newImages);
      setImagesFilter(newImages);
    }
  };

  const RemoveQulity = (e: any) => {
    let LowQulityImageCheck = e.target.checked;
    if (LowQulityImageCheck) {
      const newImages = images.filter((d, i) => i !== 5);
      setImagesFilter(newImages);
    } else {
      const newImages = images;
      setImagesFilter(newImages);
    }
  };

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const confirmSelection = async () => {
    if (!selectedCount) {
      toastWarning("Please select at least one photo");
      return;
    }
    const activePhotos = getAllFacebookPhoto.filter((photo) => photo.isActive);
    const payload = {
      image_type: "facebook",
      user_id: storedUser._id,
      images: photos,
    };

    const res = await apiPost<any>("image/store-facebook", payload);
    if (res.status) {
      setFiles((prev) => [...prev, ...activePhotos]);
      setImages((prev) => [...prev, ...activePhotos]);
      setImagesFilter((prev) => [...prev, ...activePhotos]);
      hideLoader();
      setShowPhotos(false);
      toastSuccess(`Fetched ${activePhotos.length} photos ✅`);
    } else {
      toastError(res.message);
      hideLoader();
    }
  };

  const openCenteredPopup = (url: string) => {
    const width = 600;
    const height = 700;

    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    return window.open(
      url,
      "photosPicker",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };


  const openGooglePhotosPicker = (accessToken: any) => {
    try {
      const createSession = async () => {
        const res = await fetch(
          "https://photospicker.googleapis.com/v1/sessions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const session = await res.json();
        return session;
      };

      const pollSession = async (sessionId: string, pickerUri: string) => {
        let popup = openCenteredPopup(pickerUri);
        const interval = setInterval(async () => {
          const res = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          const data = await res.json();

          if (data.mediaItemsSet) {
            clearInterval(interval);
            popup?.close();
            const itemsRes = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
            const items = await itemsRes.json();
            console.log("items", items.mediaItems);
            await loadImages(items.mediaItems, accessToken);

          }
        }, 2000);
      };

      createSession().then((session) => {
        pollSession(session.id, session.pickerUri);
      });
    } catch (error) {
      console.log("error", error);

    }
  };

  const login = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/photospicker.mediaitems.readonly",
    flow: "implicit",
    onSuccess: async (res) => {
      openGooglePhotosPicker(res.access_token);
    },
    onError: (err) => console.error("Login failed:", err),
  });

  const handleConnect = () => {
    login();
  };


  const fetchImage = async (item: any, token: string) => {
    try {
      const url = `${item.mediaFile.baseUrl}=w800`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const blob = await res.blob();
      const file = new File([blob], item.mediaFile.filename || "photo.jpg", {
        type: item.mediaFile.mimeType || blob.type,
      });

      const previewUrl = URL.createObjectURL(blob);
      return { file, previewUrl };
    } catch (err) {
      console.error("Error fetching image:", err);
      return null;
    }
  };

  const loadImages = async (mediaItems: any[], token: string) => {
    const validItems = mediaItems.filter((i) => i.type === "PHOTO");
    const startIndex = files.length;

    // ✅ Step 1: Pehle saari placeholder entries ek saath add karo
    setFiles((prev: any) => [
      ...prev,
      ...validItems.map(() => ({
        status: "InProgress",
        image_type: "computer",
        progress: 0,
        speed: 0,
        eta: 0,
        url: null,
      })),
    ]);

    // ✅ Step 2: 5-5 images ke batch mein parallel process karo
    const BATCH_SIZE = 5;

    for (let b = 0; b < validItems.length; b += BATCH_SIZE) {
      const batch = validItems.slice(b, b + BATCH_SIZE);

      await Promise.all(
        batch.map(async (item: any, i: number) => {
          const globalIndex = startIndex + b + i;
          const result = await fetchImage(item, token);

          if (result) {
            // ✅ Preview URL set karo
            setFiles((prev: any) => {
              const updated = [...prev];
              updated[globalIndex] = {
                ...updated[globalIndex],
                url: result.previewUrl,
              };
              return updated;
            });

            // ✅ Upload shuru karo
            uploadWithProgress(result.file, globalIndex);
          } else {
            // ✅ Fetch fail hone par Failed status
            setFiles((prev: any) => {
              const updated = [...prev];
              updated[globalIndex] = {
                ...updated[globalIndex],
                status: "Failed",
              };
              return updated;
            });
          }
        })
      );
    }
  };

  const uploadWithProgress = (file: File, index: number) => {
    const formData = new FormData();
    formData.append("images", file);
    formData.append("image_type", "computer");

    if (storedUser && storedUser._id) {
      formData.append("user_id", storedUser._id);
    } else if (temp_id) {
      formData.append("user_id", temp_id);
    }

    const url =
      !storedUser || !storedUser._id
        ? `${process.env.NEXT_PUBLIC_API_URL}image/temp-add`
        : `${process.env.NEXT_PUBLIC_API_URL}image/add`;

    const xhr = new XMLHttpRequest();
    const startTime = Date.now();
    let lastUpdateTime = 0;

    xhr.open("POST", url);
    if (storedUser?.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${storedUser.token}`);
    }
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      const now = Date.now();
      if (now - lastUpdateTime < 200) return;
      lastUpdateTime = now;

      const progress = (event.loaded / event.total) * 100;
      const elapsed = (now - startTime) / 1000;
      const speed = event.loaded / (1024 * 1024) / elapsed;
      const eta =
        speed > 0 ? (event.total - event.loaded) / (speed * 1024 * 1024) : 0;

      setFiles((prev: any) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: "InProgress",
          progress: Math.round(progress),
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

      // Require a usable image_compressed before calling this a success. It
      // used to fall back to `updated[index].url` — the local blob preview —
      // so a 2xx with a missing URL was marked "Completed" while still holding
      // a blob, indistinguishable from a healthy row.
      const inserted = responseData?.data?.inserted?.[0];
      const uploadedUrl = inserted ? resolvePreviewUrl(inserted.image_compressed) : null;

      if (xhr.status >= 200 && xhr.status < 300 && uploadedUrl) {
        setFiles((prev: any) => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              status: "Completed",
              progress: 100,
              speed: 0,
              eta: 0,
              height: inserted.height || null,
              width: inserted.width || null,
              url: uploadedUrl || updated[index].previewBlobUrl || null,
              previewBlobUrl: updated[index].previewBlobUrl,
              id: inserted._id || null,
            };
          }
          return updated;
        });
      } else {
        setFiles((prev: any) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            status: "Failed",
          };
          return updated;
        });
      }
    };


    xhr.onerror = () => {
      setFiles((prev: any) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: "Failed",
        };
        return updated;
      });
    };

    xhr.send(formData);
  };


  return (
    <>
      <div className="p-book-upload-step step-3" id="step-3">
        <div className="d-flex justify-content-center gx-2">
          <button className="btn btn-secondary upload-img-btn"
            onClick={() => {
              const input = document.getElementById("upload-your-photos") as HTMLInputElement | null;
              if (input) input.click();
            }}>
            <span>Upload from Device </span>
            <img src="https://pixovo.com/images/com-phone-icon-2.png" className="com-phone-img" />
          </button>

          {/* <button className="btn btn-primary" onClick={checkLoginAndFetchPhotos}>
            Import Photos from Facebook
          </button> */}

          <button className="btn btn-primary upload-img-btn" onClick={handleConnect}>
            <span>Import Photos from Google Photos</span>
            <img src="https://pixovo.com/images/g-photo.png" className="g-photo-img" />
          </button>
        </div>

        {AICurationShow ? (
          <>
            <h3>Ai Filter</h3>
            <div className="row curation-filters mb-3">
              <div className="filter-group col-md-4">
                <label className="form-label">Filter by Emotion</label>
                <select className="form-control" id="emotion-filter">
                  <option value="">All Emotions</option>
                  <option value="happy">Happy</option>
                  <option value="sad">Sad</option>
                  <option value="nice">Nice</option>
                </select>
              </div>
              <div className="filter-group col-md-4">
                <label className="form-label">Filter by Date</label>
                <select className="form-control" id="date-filter">
                  <option value="">All Dates</option>
                  <option value="month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
              <div className="filter-group col-md-4">
                <label className="form-label">Filter by Location</label>
                <select className="form-control" id="location-filter">
                  <option value="">All Locations</option>
                  <option value="texas">Texas</option>
                  <option value="atlanta">Atlanta</option>
                </select>
              </div>
            </div>

            <div className="curation-options">
              <label className="checkbox-label me-5">
                <input
                  type="checkbox"
                  id="remove-low-quality"
                  onChange={(e: any) => LowQulity(e)}
                />{" "}
                Remove Low Quality Images
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  id="remove-duplicates"
                  onChange={(e: any) => RemoveQulity(e)}
                />{" "}
                Remove Duplicate Images
              </label>
            </div>
          </>
        ) : (
          <>
            <h3>Upload Your Photos </h3>
            <div
              className={`p-book-upload-block ${dragActive ? "drag-active" : ""
                }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                id="upload-your-photos"
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />

              {/* Styled label */}
              <label htmlFor="upload-your-photos" className="upload-drop-label">
                <div className="upload-drop-text">
                  {/* Cloud upload icon (inline SVG, version-independent) */}
                  <span className="upload-drop-icon" aria-hidden="true">
                    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M46 44a10 10 0 0 0 1-19.9A14 14 0 0 0 19 26a10 10 0 0 0-2 19.8" />
                      <path d="M32 28v22" />
                      <polyline points="24 36 32 28 40 36" />
                    </svg>
                  </span>
                  <h2>
                    {dragActive
                      ? "Drop files here 📂"
                      : "Drag & Drop Photos Here"}
                  </h2>
                  <p className="browse-text">
                    or click to browse from your device
                  </p>

                  <div className="file-types">
                    Supports: PNG, JPG, JPEG
                  </div>
                </div>

                {/* Photo Visibility & Storage — inside the drop zone, right side; hidden on mobile */}
                <div
                  className="photo-storage-card"
                  role="region"
                  aria-label="Photo visibility and storage policy"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <h4 className="ps-title">Photo Visibility &amp; Storage</h4>

                  <div className="ps-item">
                    <span className="ps-avatar ps-avatar--guest" aria-hidden="true">
                      {/* user icon */}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4"></circle>
                        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"></path>
                      </svg>
                    </span>
                    <div className="ps-info">
                      <strong>Guest Users</strong>
                      <p>Your uploaded photos will be removed immediately after use.</p>
                    </div>
                    <span className="ps-tag ps-tag--trash" aria-hidden="true">
                      {/* trash icon (inline SVG — version-independent) */}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </span>
                  </div>

                  <div className="ps-divider" aria-hidden="true"></div>

                  <div className="ps-item">
                    <span className="ps-avatar ps-avatar--member" aria-hidden="true">
                      {/* user-with-check icon */}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="10" cy="8" r="4"></circle>
                        <path d="M2 21c0-4.4 3.6-8 8-8 1.6 0 3.1.5 4.4 1.3"></path>
                        <polyline points="15 18 17 20 22 15"></polyline>
                      </svg>
                    </span>
                    <div className="ps-info">
                      <strong>Logged-in Users</strong>
                      <p>
                        Your uploaded photos will be available for{" "}
                        <span className="ps-highlight">7 days</span>. After that,
                        they will be automatically removed.
                      </p>
                    </div>
                    <span className="ps-tag ps-tag--days">
                      <b>7</b>
                      <small>DAYS</small>
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </>
        )}

        {/* Image Previews */}
        <div className="uploaded-photos">
          <div className="row mt-3">
            <div className="col-12 col-md-6 mb-3 uploaded-p-1">
              <h4>
                Uploaded Photos (
                <span id="photoCount">
                  {files.filter((f: any) => f.status.toLowerCase() !== "completed").length}
                </span>
                )
              </h4>
              <div className="progress-scroll">
                {files
                  .filter((f: any) => f.status.toLowerCase() !== "completed")
                  .map((f, i) => {
                    const originalIndex = files.findIndex((file) => file === f);

                    return (
                      <div key={i} className="mb-3 image-progress-card">
                        <img crossOrigin="anonymous" src={f.url} alt="preview" className="preview-img" />

                        <div
                          key={i}
                          className="progress-file-info"
                          style={{ marginTop: "10px" }}
                        >
                          <div className="file-info">
                            <div className="file-name">
                              {f.file && f.file.name}
                            </div>
                            <div className="meta-speed text-sm text-gray-600 flex gap-1">
                              <div>
                                {f.file &&
                                  f.file &&
                                  formatBytes(f.file && f.file.size)}{" "}
                                |
                              </div>
                              <div>{f.speed.toFixed(2)} MB/s</div>
                            </div>
                          </div>
                          <div className="progress-container">
                            <div
                              className="progress-outer"
                              style={{
                                width: "100%",
                                background: "#eee",
                                height: "10px",
                              }}
                            >
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
                              {f.status !== "Failed"
                                ? f.eta.toFixed(2) + "s"
                                : f.status}
                            </div>
                          </div>
                        </div>
                        {f.status == "Failed" && (
                          <div>
                            <button
                              className="btn btn-danger btn-sm m-2"
                              onClick={() => removeFile(originalIndex)}
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
            <div className="col-12 col-md-6 uploaded-p-2">
              <h4>
                Completed Photos (
                <span id="photoCount">
                  {files.filter((f) => f.status === "Completed").length}
                </span>
                )
              </h4>

              {/* <div className="completed-images">
                                {files.filter((f) => f.status === "Completed").map((img, index) => {
                                    return (
                                        <div key={index} className="mb-3">
                                            <div className="position-relative">
                                                <img src={img.url} alt="completed" className="img-fluid mb-2 border rounded" loading="lazy" />
                                                <button className="photo-item__remove m-2" onClick={() => removeImage(img, index)}>
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="text-success fw-bold">Completed</div>
                                        </div>
                                    )
                                }
                                )} */}
              <div className="completed-images">
                {files
                  .filter((f) => f.status === "Completed")
                  .map((img: any, index) => {
                    return (
                      <div key={img.id || index} className="mb-3">
                        <div className="position-relative">
                          <img
                            src={img.url || img.previewBlobUrl || "/placeholder.png"}
                            alt={img.file?.name || "Uploaded photo"}
                            width={400}
                            height={300}
                            className="img-fluid mb-2 border rounded"
                            loading="lazy"
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              const target = e.currentTarget;
                              if (img.previewBlobUrl && target.src !== img.previewBlobUrl) {
                                target.src = img.previewBlobUrl;
                              } else if (!target.src.endsWith("/placeholder.png")) {
                                target.src = "/placeholder.png";
                              }
                            }}
                            style={{
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                          />
                          <button
                            className="photo-item__remove m-2"
                            onClick={() => removeImage(img, index)}
                          >
                            ✕
                          </button>
                        </div>
                        <div className="text-success fw-bold">Completed</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between">
          <button className="btn btn-secondary mt-4" onClick={AiCurationBack}>
            Back
          </button>
          {isShowAi && !AICurationShow && (
            <button className="btn btn-secondary mt-4" onClick={AiCuration}>
              AI Curation
            </button>
          )}
          {(!isShowAi || AICurationShow) && (
            <div className="d-flex flex-column">
              <button
                className="btn btn-secondary mt-4"
                onClick={nextStep}
                disabled={
                  !files.every(
                    (f) => f.status === "Completed" || f.status === "Failed"
                  )
                }
              >
                Continue to design
              </button>
            </div>
          )}
        </div>

        {/* Privacy reassurance strip */}
       
        <div className="upload-privacy-strip">
          <div className="ups-item">
            <span className="ups-icon ups-icon--shield" aria-hidden="true">
              {/* shield icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </span>
            <div className="ups-text">
              <strong>Your Privacy, Our Priority</strong>
              <p>We never share your photos with anyone.</p>
            </div>
          </div>
          <div className="ups-item">
            <span className="ups-icon ups-icon--lock" aria-hidden="true">
              {/* lock icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 1 1 8 0v3" />
              </svg>
            </span>
            <div className="ups-text">
              <strong>100% Secure</strong>
              <p>Your memories are safe with us, always.</p>
            </div>
          </div>
          <div className="ups-item">
            <span className="ups-icon ups-icon--clock" aria-hidden="true">
              {/* clock / auto-removal icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 14" />
              </svg>
            </span>
            <div className="ups-text">
              <strong>Auto Removal</strong>
              <p>Photos are automatically removed as per policy.</p>
            </div>
          </div>
          <div className="ups-item">
            <span className="ups-icon ups-icon--quality" aria-hidden="true">
              {/* picture / quality icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="1.6" />
                <polyline points="21 16 16 11 5 20" />
              </svg>
            </span>
            <div className="ups-text">
              <strong>Quality Assured</strong>
              <p>High quality prints crafted with care.</p>
            </div>
          </div>
        

     </div>
      </div>

      {/* Modal Backdrop */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div
            className="modal fade show d-block"
            id="Sign-up-modal"
            tabIndex={-1}
            aria-labelledby="Sign-in-modal-Label"
            aria-hidden="true"
            data-bs-backdrop="true"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header justify-content-center">
                  <h5 className="modal-title" id="exampleModalLabel">
                    Choose Facebook Profile Photo Year
                  </h5>
                  {/* <button type="button" className="btn-close" onClick={() => setShowModal(false)}>
                                        <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/close-icon.png`} />
                                    </button> */}

                  <button
                    className="modal-close-btn"
                    onClick={() => setShowModal(false)}
                  >
                    ✕
                  </button>

                  {/* Existing modal content here */}
                </div>
                <div className="modal-body">
                  {/* Tabs */}
                  <div className="btn-group mb-3 w-100">
                    {["Year", "Month", "Custom"].map((tab) => (
                      <button
                        key={tab}
                        className={`btn ${activeTab === tab
                          ? "btn-info text-white"
                          : "btn-light"
                          }`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Year selection */}
                  {(activeTab === "Year" || activeTab === "Month") && (
                    <div className="button-list top-border-set d-flex flex-wrap justify-content-center gap-2 mb-3">
                      {years.map((year) => (
                        <button
                          key={year}
                          className={`btn ${selectedYear === year
                            ? "btn-info text-white"
                            : "btn-light"
                            }`}
                          onClick={() => setSelectedYear(year)}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Month selection */}
                  {activeTab === "Month" && (
                    <div className="button-list top-border-set d-flex flex-wrap justify-content-center gap-2 mb-3">
                      {months.map((month) => (
                        <button
                          key={month}
                          className={`btn ${selectedMonth === month
                            ? "btn-info text-white"
                            : "btn-light"
                            }`}
                          onClick={() => setSelectedMonth(month)}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Custom date range */}
                  {activeTab === "Custom" && (
                    <div className="top-border-set d-flex justify-content-center gap-2 mb-3">
                      <input
                        type="date"
                        placeholder="From..."
                        className="form-control"
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                      <input
                        type="date"
                        placeholder="To..."
                        className="form-control"
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div className="modal-footer justify-content-center mt-0 pt-2">
                  <button className="custom-btn" onClick={getFacebookImage}>
                    Fetch Photos From Facebook
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showPhotos && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" id="photo-up-modal" tabIndex={-1} aria-labelledby="photo-in-modal-Label" aria-hidden="true"
            data-bs-backdrop="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header justify-content-center">
                  <h5 className="modal-title" id="exampleModalLabel">
                    Choose Facebook Photo
                  </h5>
                  <button className="modal-close-btn" onClick={() => setShowPhotos(false)}>
                    ✕
                  </button>
                </div>
                <div className="modal-body">
                  <div className="photo-box-checkAll form-check mb-3">
                    <input type="checkbox" className="form-check-input" id="selectAll" checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)} />
                    <label className="form-check-label" htmlFor="selectAll">
                      Select all photos
                    </label>
                  </div>
                  <div className="row g-2" style={{ maxHeight: "450px", overflowY: "auto" }}>
                    {getAllFacebookPhoto.map((photo) => (
                      <div className="col-6 col-md-4 col-lg-3" key={photo.id}>
                        <div
                          className={`photo-box ${photo.isActive ? "active" : ""}`}
                          onClick={() => togglePhoto(photo.facebook_id)}
                        >
                          <img src={photo.url} alt="" />

                          <div className={`check-icon ${photo.isActive ? "show" : ""}`}>
                            <i className="fa fa-check"></i>
                          </div>
                        </div>
                      </div>
                    ))}

                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={confirmSelection}>
                    Continue ({selectedCount})
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

export default Step3;