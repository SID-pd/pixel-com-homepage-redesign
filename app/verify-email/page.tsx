"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiPost } from "../api/service/api-service";
import { set } from "../api/service/storage";
import { claimGuestSessionIfAny } from "../api/service/guest";
import { useUser } from "../context/UserContext";

type Status = "verifying" | "success" | "already" | "expired" | "invalid" | "error";

/**
 * Suspense lives here, not in main-layout.tsx — see order-detail/page.tsx for why.
 */
export default function VerifyEmailPageRoute() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPage />
    </Suspense>
  );
}

function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUser();

  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState<string>("Verifying your email...");
  const [email, setEmail] = useState<string>("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("invalid");
      setMessage("Missing verification token in the link.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await apiPost<any>("verify-email", { token });

        if (cancelled) return;

        if (res?.status && res?.data?.auto_login && res?.data?.token) {
          // Successful first-time verification — backend returned a fresh JWT.
          const { token: jwt, token_type: _tt, ...userFields } = res.data;
          const userData = { _id: userFields._id || userFields.id, ...userFields, token: jwt };
          set("user", userData);
          await claimGuestSessionIfAny();
          setUser(userData);
          setStatus("success");
          setMessage("Email verified — welcome to Pixovo!");
          // Brief delay then route to home.
          setTimeout(() => router.replace("/"), 1200);
          return;
        }

        if (res?.status && res?.data?.auto_login === false) {
          setStatus("already");
          setMessage(res.message || "Email already verified. Please sign in.");
          if (res.data?.email) setEmail(res.data.email);
          return;
        }

        if (!res?.status && res?.data?.expired) {
          setStatus("expired");
          setMessage(res.message || "Verification link expired.");
          if (res.data?.email) setEmail(res.data.email);
          return;
        }

        setStatus("invalid");
        setMessage(res?.message || "Invalid verification link.");
      } catch (err: any) {
        if (cancelled) return;
        setStatus("error");
        setMessage(err?.message || "Something went wrong while verifying your email.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, setUser]);

  const handleResend = async () => {
    if (!email) return;
    try {
      setResending(true);
      setResendMsg("");
      const res = await apiPost<any>("resend-verification", { email });
      setResendMsg(res?.message || (res?.status
        ? "Verification email sent. Please check your inbox."
        : "Could not resend. Please try again later."));
    } catch (err: any) {
      setResendMsg(err?.message || "Could not resend. Please try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "Arial, Helvetica, sans-serif",
    }}>
      <div style={{
        maxWidth: 480,
        width: "100%",
        background: "#fff",
        borderRadius: 8,
        padding: "32px 28px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        textAlign: "center",
      }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 22, color: "#222" }}>
          {status === "verifying" && "Verifying..."}
          {status === "success" && "Email verified"}
          {status === "already" && "Already verified"}
          {status === "expired" && "Link expired"}
          {status === "invalid" && "Invalid link"}
          {status === "error" && "Something went wrong"}
        </h2>
        <p style={{ margin: "0 0 20px", color: "#555", lineHeight: 1.6 }}>{message}</p>

        {(status === "expired" || (status === "invalid" && email)) && email && (
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{
                padding: "10px 22px",
                background: "#e6356b",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                cursor: resending ? "not-allowed" : "pointer",
              }}
            >
              {resending ? "Sending..." : "Resend verification email"}
            </button>
            {resendMsg && <p style={{ marginTop: 12, fontSize: 13, color: "#444" }}>{resendMsg}</p>}
          </div>
        )}

        {(status === "already" || status === "success" || status === "invalid" || status === "error") && (
          <Link href="/" style={{ color: "#e6356b", fontWeight: 600 }}>Go to home</Link>
        )}
      </div>
    </div>
  );
}
