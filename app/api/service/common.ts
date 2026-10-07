import type SwalType from "sweetalert2";

/**
 * sweetalert2 is loaded on demand.
 *
 * This module is imported by api-service.ts and strapi.ts — the shared HTTP
 * layer — so a top-level `import Swal from "sweetalert2"` put the whole library
 * plus its CSS into the initial bundle of every page, including the home page.
 * The old module-scope `Swal.mixin(...)` also defeated tree-shaking outright.
 *
 * Both the library and the toast mixin are now created on first use and cached,
 * so nothing downloads until something actually fires a toast.
 */
let swalPromise: Promise<typeof SwalType> | null = null;

const getSwal = (): Promise<typeof SwalType> => {
  if (!swalPromise) {
    swalPromise = import("sweetalert2").then((m) => m.default);
  }
  return swalPromise;
};

let toastPromise: Promise<typeof SwalType> | null = null;

const getToast = (): Promise<typeof SwalType> => {
  if (!toastPromise) {
    toastPromise = getSwal().then((Swal) =>
      Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      })
    );
  }
  return toastPromise;
};

/**
 * Fire-and-forget so the four toast helpers keep their `void` signature and
 * every existing `toastError("...")` call site works unchanged.
 */
const fireToast = (icon: "success" | "error" | "info" | "warning", title: string) => {
  void getToast()
    .then((Toast) => Toast.fire({ icon, title }))
    .catch((err) => console.error("Failed to show toast:", err));
};

export const toastSuccess = (title: string) => fireToast("success", title);

export const toastError = (title: string) => fireToast("error", title);

export const toastInfo = (title: string) => fireToast("info", title);

export const toastWarning = (title: string) => fireToast("warning", title);

export const toastInformational = async (title: string, message: string) => {
  const Swal = await getSwal();
  return Swal.fire({
    icon: 'info',
    title: title,
    text: message,
    confirmButtonText: 'Got it',
  });
}

export const toastConfirm = async (
  message: string,
  confirmButtonText: string = "Yes",
  cancelButtonText?: any,
  title: any = "Are you sure?"
): Promise<boolean> => {
  const Swal = await getSwal();
  const result = await Swal.fire({
    title: title,
    text: message,
    icon: "warning",
    showCancelButton: !!cancelButtonText,
    confirmButtonText,
    cancelButtonText: cancelButtonText || "",
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  return result.isConfirmed;
};


export const toastHtmlConfirm = async (message: string, confirmButtonText: string = "Yes", cancelButtonText: string = "No"): Promise<boolean> => {
  const Swal = await getSwal();
  const result = await Swal.fire({
    title: "Please Confirm",
    html: `
      <div style="
        font-size: 16px;
        line-height: 1.6;
        text-align: left;
        color: #333;
      ">
        ${message}
      </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: "#0ba28d",
    cancelButtonColor: "#aaa",
    width: 600,
    background: "#fff",
  });

  return result.isConfirmed;
};
