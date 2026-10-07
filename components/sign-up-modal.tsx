"use client";

import React, { useState, useEffect } from "react";
import { apiPost } from "../app/api/service/api-service";
import { toastError, toastSuccess } from "../app/api/service/common";
import { set } from "../app/api/service/storage";
import { useUser } from "@/app/context/UserContext";
import Link from "next/link";
import { claimGuestSessionIfAny } from "@/app/api/service/guest";

interface SignupModalProps {
    handleClose: () => void;
    showSingUp: boolean;
    handleOpenSingUp: () => void;
    handleCloseSingUp: () => void;
    handleOpenSingIn: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ handleClose, showSingUp, handleOpenSingUp, handleCloseSingUp, handleOpenSingIn }) => {
    const [forData, setForData]: any = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
    const [errors, setErrors] = useState<{ first_name?: string, last_name?: string, email?: string; password?: string, confirm_password?: string }>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConformPassword, setConformShowPassword] = useState(false);
    const { setUser } = useUser();

    useEffect(() => {
        if (showSingUp) {
            document.body.classList.add("modal-open");
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = "15px";
        } else {
            setForData({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' })
            document.body.classList.remove("modal-open");
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        }

        return () => {
            document.body.classList.remove("modal-open");
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        };
    }, [showSingUp]);

    if (!showSingUp) return null; 

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: { first_name?: string; last_name?: string; email?: string; password?: string; confirm_password?: string; } = {};

        // 🔹 Basic checks
        if (!forData.first_name) newErrors.first_name = "First name is required";
        if (!forData.last_name) newErrors.last_name = "Last name is required";
        if (!forData.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(forData.email))
            newErrors.email = "Invalid email format";

        // 🔹 Password validation
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{10,}$/;

        if (!forData.password) {
            newErrors.password = "Password is required";
        } else if (!passwordRegex.test(forData.password)) {
            newErrors.password =
                "Must contain uppercase, lowercase, number, special character, and be at least 10 characters long.";
        }

        // 🔹 Confirm password check
        if (!forData.confirm_password)
            newErrors.confirm_password = "Confirm Password is required";
        else if (forData.confirm_password !== forData.password)
            newErrors.confirm_password = "Passwords do not match";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        try {
            setLoading(true);

            // 🔹 API call
            let temp_id = localStorage.getItem('temp_id');
            if (temp_id) {
                forData.temp_user_id = temp_id;
            } else {
                forData.temp_user_id = "";
            }
            const res = await apiPost<any>("register", forData);
            if (res.status) {
                // New flow: register no longer auto-logs in. The backend has sent a
                // verification email; the user must click the button in that email
                // before they can log in. Do NOT store a token or call setUser.
                if (res.data?.requires_verification) {
                    toastSuccess(res.message || "Please check your email to verify your account.");
                    setForData({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
                    handleCloseSingUp();
                } else {
                    // Backward-compat: any path that still returns a token auto-logs in.
                    toastSuccess(res.message);
                    const { token: regToken, token_type: _tt3, ...regUserFields } = res.data || {};
                    const userData = { _id: regUserFields._id || regUserFields.id, ...regUserFields, token: regToken };
                    set("user", userData);
                    await claimGuestSessionIfAny();
                    setUser(userData);
                    setForData({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
                    localStorage.removeItem("temp_id");
                    handleCloseSingUp();
                }
            } else {
                toastError(res.message);
            }

            setLoading(false);
        } catch (err: any) {
            toastError(err.message || "Register failed");
            setLoading(false);
        }
    };

    const handleOpenSignIn = () => {
        setForData({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' })
        handleCloseSingUp();
        handleOpenSingIn();
    }

    return (
        <>
            {/* Modal Backdrop */}
            <div className="modal-backdrop fade show"></div>

            <div className="modal fade show d-block" id="Sign-up-modal" tabIndex={-1} aria-labelledby="Sign-in-modal-Label" aria-hidden="true" data-bs-backdrop="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">Sign Up</h5>
                            <button type="button" className="btn-close" onClick={handleCloseSingUp}>
                                <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/close-icon.png`} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="form-group col-md-6">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={forData.first_name}
                                            onChange={(e) => setForData((prv: any) => ({ ...prv, first_name: e.target.value }))}
                                        />
                                        {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
                                    </div>

                                    <div className="form-group col-md-6">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={forData.last_name}
                                            onChange={(e) => setForData((prv: any) => ({ ...prv, last_name: e.target.value }))}
                                        />
                                        {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
                                    </div>

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
                                            <input type={showPassword ? "text" : "password"} className="form-control" value={forData.password} onChange={(e) => setForData((prv: any) => ({ ...prv, password: e.target.value }))} />
                                            <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} input-group-text user-select-pointer`} onClick={() => setShowPassword(!showPassword)}></i>
                                        </div>
                                        <div className="info-feedback">
                                            Note : Must contain uppercase, lowercase, number, special character, and be at least 10 characters long.
                                        </div>
                                        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                                    </div>

                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <div className="input-group">
                                            <input type={showConformPassword ? "text" : "password"} className="form-control" value={forData.confirm_password}
                                                onChange={(e) => setForData((prv: any) => ({ ...prv, confirm_password: e.target.value }))} />
                                            <i className={`fa ${showConformPassword ? "fa-eye-slash" : "fa-eye"} input-group-text user-select-pointer`} onClick={() => setConformShowPassword(!showConformPassword)}></i>
                                        </div>
                                        {errors.confirm_password && <div className="invalid-feedback">{errors.confirm_password}</div>}
                                    </div>

                                    {/* ✅ Add checkbox below password */}
                                    <div className="form-group mt-2" style={{ display: 'flex', alignItems: "center", gap: "10px" }}>
                                        <input className="form-check-input" type="checkbox" id="rememberMe" checked={forData.rememberMe || false}
                                            onChange={(e) => setForData((prv: any) => ({ ...prv, rememberMe: e.target.checked }))} />
                                        <label className="form-check-label" htmlFor="rememberMe">
                                            I agree to receive promotional updates and offers.
                                        </label>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 modal-signin-btn"
                                    disabled={loading}
                                >
                                    {loading ? "Signing up..." : "Sign up"}
                                </button>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <center>
                                <p className="term-content">By signing up, you agree to Pixovo <Link href="/terms">Terms of Service</Link>.</p>
                            </center>
                            <center>
                                <p>Already have an account? <a href="#" onClick={handleOpenSignIn} >Sign in</a> </p>
                            </center>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SignupModal;
