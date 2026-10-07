"use client";

import React, { useState, useEffect } from "react";
import { apiPost } from "../app/api/service/api-service";
import { toastError, toastSuccess } from "../app/api/service/common";
import { set } from "../app/api/service/storage";
import { useUser } from "../app/context/UserContext";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useRouter } from "next/navigation";
import { claimGuestSessionIfAny } from "@/app/api/service/guest";
import Link from "next/link";

interface SigninModalProps {
    router: any,
    show: boolean;
    handleClose: () => void;
    handleOpenSingUp: () => void;
    handleCloseSingUp: () => void;
    onLoginSuccess: (user: any) => void; // ✅ accept user object
}

interface Photo {
    id: string;
    picture: string;
    name?: string;
    link?: string;
}

const SigninModal: React.FC<SigninModalProps> = ({ router, show, handleClose, handleOpenSingUp, handleCloseSingUp, onLoginSuccess }) => {
    const [forData, setForData]: any = useState({ email: '', password: '' });
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [verificationPrompt, setVerificationPrompt] = useState<{ email: string } | null>(null);
    const [resending, setResending] = useState(false);
    const { setUser, countCart } = useUser();

    const handleResendVerification = async () => {
        if (!verificationPrompt?.email) return;
        try {
            setResending(true);
            const res = await apiPost<any>("resend-verification", { email: verificationPrompt.email });
            if (res?.status) {
                toastSuccess(res.message || "Verification email sent. Please check your inbox.");
            } else {
                toastError(res?.message || "Could not resend the verification email.");
            }
        } catch (err: any) {
            toastError(err?.message || "Could not resend the verification email.");
        } finally {
            setResending(false);
        }
    };
    const facebook_appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "";
    const routerNavigate = useRouter();

    useEffect(() => {
        if (show) {
            document.body.classList.add("modal-open");
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = "15px";
        } else {
            setForData({ email: '', password: '' })
            document.body.classList.remove("modal-open");
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        }

        // Avoid adding the script multiple times
        if (document.getElementById("facebook-jssdk")) return;
        console.log("facebook_appId", facebook_appId);


        const script = document.createElement("script");
        script.id = "facebook-jssdk";
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;

        script.onload = () => {
            console.log("✅ FB SDK script loaded");
            (window as any).FB.init({
                appId: facebook_appId,
                cookie: true,
                xfbml: true,
                version: "v17.0",
            });
            console.log("✅ FB SDK initialized");
        };

        document.body.appendChild(script);

        return () => {
            document.body.classList.remove("modal-open");
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        };
    }, [show]);


    //=============// hooks always at top, never inside conditions //=============//
    const login = useGoogleLogin({
        onSuccess: async (Response) => {
            try {
                const res: any = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo",
                    { headers: { Authorization: `Bearer ${Response.access_token}` }, }
                );
                res.data.access_token = Response.access_token;
                res.data.type = "google";
                res.data.first_name = "";
                res.data.id = "";
                res.data.last_name = "";
                res.data.family_name = "";
                let temp_id = localStorage.getItem('temp_id');
                if (temp_id) {
                    res.data.temp_user_id = temp_id;
                } else {
                    res.data.temp_user_id = "";
                }
                const apiResponse = await apiPost<any>("social-login", res.data);
                if (apiResponse.status) {
                    toastSuccess(apiResponse.message);
                    // Social login returns user fields directly in data (not nested under "user")
                    const { token: socialToken, token_type: _tt1, ...socialUserFields } = apiResponse.data || {};
                    const userData = { _id: socialUserFields._id || socialUserFields.id, ...socialUserFields, token: socialToken };
                    set("user", userData);
                    await claimGuestSessionIfAny();   // ← add

                    setUser(userData);
                    onLoginSuccess(userData);
                    handleClose();
                    localStorage.removeItem("temp_id");
                } else {
                    toastError(apiResponse.message);
                }

            } catch (err) {
                console.error("Failed to fetch user info", err);
                toastError("Failed to fetch user info");
            }
        },
        onError: (err: any) => {
            console.log("Google login Failed" + err);
            toastError("Google login Failed");
        },
    });

    if (!show) return null; // don't render if not open

    //=============// Login api calling //=============//
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { email?: string; password?: string } = {};
        if (!forData.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(forData.email)) newErrors.email = "Invalid email format";
        if (!forData.password) newErrors.password = "Password is required";
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            setLoading(true);
            let temp_id = localStorage.getItem('temp_id');
            if (temp_id) {
                forData.temp_user_id = temp_id;
            } else {
                forData.temp_user_id = "";
            }
            const res = await apiPost<any>("login", forData);
            if (res.status) {
                toastSuccess(res.message);
                setVerificationPrompt(null);
                const userData = { _id: res.data?.user?.id, ...res.data?.user, token: res.data?.token };
                set("user", userData);
                await claimGuestSessionIfAny();   // ← new

                setUser(userData);
                onLoginSuccess(userData);
                handleClose();
                localStorage.removeItem("temp_id");
                // 🧠 Check if user was on the editing tool page
                // checkCartOrder();

            } else {
                // Backend signals an unverified email with requires_verification=true.
                if (res?.data?.requires_verification && res?.data?.email) {
                    setVerificationPrompt({ email: res.data.email });
                }
                toastError(res.message);
            }

            setLoading(false);
        } catch (err: any) {
            toastError(err.message || "Login failed");
            setLoading(false);
        }
    };

    const handleOpenSignup = () => {
        setForData({ email: '', password: '' })
        handleClose();
        handleOpenSingUp()
    }

    // const checkCartOrder = async () => {
    //     const count = await getCartCount();
    //     if (router === "/element-editing" && count > 0) {
    //         const isConfirmed = await toastConfirm(
    //             `You already have ${count} pending order${count > 1 ? "s" : ""
    //             } in your cart. Please complete or remove ${count > 1 ? "them" : "it"
    //             } before proceeding.`,
    //             "Go to Cart",
    //             null,
    //             "Pending Order in Cart"
    //         );

    //         if (isConfirmed) {
    //             routerNavigate.push("/cart");
    //         }
    //     }
    // }

    //=============// Facebook Login //=============//
    const handleLogin = () => {
        try {
            if (!(window as any).FB) {
                alert("Facebook SDK not loaded yet!");
                return;
            }

            (window as any).FB.login(
                (response: any) => {
                    console.log("Login Response:", response);
                    if (response.authResponse) {
                        (window as any).FB.api("/me", { fields: `id,name,first_name,last_name,email` }, async (user: any) => {
                            user.access_token = response.authResponse.accessToken;
                            user.type = "facebook";
                            user.sub = "";
                            user.given_name = "";
                            user.family_name = "";
                            user.picture = "";
                            user.email_verified = true;
                            let temp_id = localStorage.getItem('temp_id');
                            if (temp_id) {
                                user.temp_user_id = temp_id;
                            } else {
                                user.temp_user_id = "";
                            }
                            const res = await apiPost<any>("social-login", user);
                            if (res.status) {
                                toastSuccess(res.message);
                                // Social login returns user fields directly in data (not nested under "user")
                                const { token: fbToken, token_type: _tt2, ...fbUserFields } = res.data || {};
                                const userData = { _id: fbUserFields._id || fbUserFields.id, ...fbUserFields, token: fbToken };
                                set("user", userData);
                                await claimGuestSessionIfAny();   // ← add

                                setUser(userData);
                                onLoginSuccess(userData);
                                handleClose();
                                localStorage.removeItem("temp_id");
                            } else {
                                toastError(res.message);
                            }
                        });
                    }
                }, { scope: 'public_profile,email' });
        } catch (error) {
            console.log("Login Failed" + error);
            toastError("Facebook login failed");
        }
    };


    return (
        <>
            {/*//=============// Modal Backdrop //=============//*/}
            <div className="modal-backdrop fade show"></div>

            <div className="modal fade show d-block" id="Sign-in-modal" tabIndex={-1} aria-labelledby="Sign-in-modal-Label" aria-hidden="true" data-bs-backdrop="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Sign In</h5>
                            <button type="button" className="btn-close" onClick={handleClose}>
                                <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/close-icon.png`} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>

                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={forData.email}
                                        onChange={(e) => setForData((prv: any) => ({ ...prv, email: e.target.value }))}
                                    />
                                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                </div>

                                <div className="form-group">
                                    <label>Password</label>
                                    <div className="input-group">
                                        <input type={showPassword ? "text" : "password"} className="form-control" value={forData.password}
                                            onChange={(e) => setForData((prv: any) => ({ ...prv, password: e.target.value }))} />
                                        <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} input-group-text user-select-pointer`} onClick={() => setShowPassword(!showPassword)}></i>
                                    </div>
                                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                                </div>

                                {verificationPrompt && (
                                    <div className="alert alert-warning d-flex justify-content-between align-items-center" style={{ padding: "8px 12px", fontSize: 14 }}>
                                        <span>Email not verified yet.</span>
                                        <button
                                            type="button"
                                            className="btn btn-link p-0"
                                            style={{ fontSize: 14 }}
                                            onClick={handleResendVerification}
                                            disabled={resending}
                                        >
                                            {resending ? "Sending..." : "Resend verification email"}
                                        </button>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 modal-signin-btn"
                                    disabled={loading}
                                >
                                    {loading ? "Signing in..." : "Sign in"}
                                </button>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-google-btn" onClick={() => login()}>
                                <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/google-icon.svg`} alt="Google" />
                            </button>
                            <span>OR</span>
                            <a onClick={handleLogin} className="modal-facebook-btn"><img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/facebook-icon.svg`} /></a>
                            <center>
                                <p className="term-content">By signing up, you agree to Pixovo <Link href="/terms">Terms of Service</Link>.</p>
                            </center>
                            <center>
                                <p>Don't have an account? <a href="#" onClick={handleOpenSignup}>Sign up</a> </p>
                            </center>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SigninModal;
