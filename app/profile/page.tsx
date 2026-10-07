
"use client";

/**
 * Bootstrap's JS is imported on demand instead of statically, so it stays out of
 * this route's initial chunk. Mirrors the pattern already used in
 * element-editing/page.tsx.
 */
const openBootstrapModal = async (elementId: string) => {
  const el = document.getElementById(elementId);
  if (!el) return;
  const { Modal } = await import("bootstrap");
  new Modal(el).show();
};
import { useState, useEffect, useRef } from "react";

import { apiGet, apiPost, apiDelete } from "../api/service/api-service";
import { toastWarning, toastError, toastSuccess, toastConfirm, } from "../api/service/common";
import { set, get, removeEncrypted } from "../api/service/storage";
import { useUser } from "../context/UserContext";
import { getPageBySlugParam } from "../api/service/strapi";
import { useRouter } from "next/navigation";
import { useLoader } from "../context/LoaderContext";
// fa-* icons used on this route — see the note in app/layout.tsx.
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./profile.css";

interface PolicyData {
  id: number;
  slug: string;
  Title: string;
  Description: string;
}

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUserData] = useState<any>({ id: "", first_name: "", last_name: "", email: "", bio: "", avatar: "/avatar-default.svg", language: "", });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ first_name: "", last_name: "", email: "", });
  const initialFormState = { id: "", address: "", address2: "", country: "US", city: "", zip: "", phone_number: "", };
  const [formData, setFormData] = useState(initialFormState);
  const [addressList, setAddressList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [shippingErrors, setShippingErrors] = useState({ address: "", country: "", city: "", zip: "", phone_number: "", });
  const { setUser } = useUser();
  const [privacyPolicy, setPrivacyPolicy] = useState<PolicyData | null>(null);
  const [termsConditions, setTermsConditions] = useState<PolicyData | null>(null);
  const { showLoader, hideLoader } = useLoader();
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
    fetchShippingAddresses();
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const privacyData = await getPageBySlugParam('privacy-policy');
      const termsData = await getPageBySlugParam('terms-and-conditions');
      setPrivacyPolicy(privacyData.data?.[0] || null);
      setTermsConditions(termsData.data?.[0] || null);
    } catch (error) {
      console.error("Error fetching policy data:", error);
    } finally {
      setLoading(false);
    }
  };


  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("profile/detail");
      if (res.status) {
        setUserData({
          id: res.data._id,
          first_name: res.data.first_name || "",
          last_name: res.data.last_name || "",
          email: res.data.email || "",
          bio: res.data.bio || "",
          avatar: res.data.avatars || "",
          language: res.data.language,
        });
      } else {
        toastError(res.message);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingAddresses = async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("shipping-address/list");
      if (res.status) {
        setAddressList(res.data);
      } else {
        toastError(res.message);
      }
    } catch (error) {
      console.error("Failed to fetch shipping addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = { first_name: "", last_name: "", email: "", };
    let isValid = true;

    if (!user.first_name.trim()) {
      newErrors.first_name = "First name is required";
      isValid = false;
    }

    if (!user.last_name.trim()) {
      newErrors.last_name = "Last name is required";
      isValid = false;
    }

    if (!user.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData((prev: any) => ({
          ...prev,
          avatar: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShippingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (shippingErrors[name as keyof typeof shippingErrors]) {
      setShippingErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && addressList.length >= 5) {
      toastWarning("You can only add up to 5 shipping addresses");
      return;
    }

    if (!validateShippingForm()) {
      toastWarning("Please fix the validation errors");
      return;
    }

    setLoading(true);

    try {
      // frontend call
      const addressData = {
        streetLines: [formData.address, formData.address2],
        city: formData.city,
        // stateOrProvinceCode: "df",
        postalCode: formData.zip,
        countryCode: "US",
      };

      const resData = await apiPost<any>("fedex/validate-address", addressData);
      const result = resData?.data ?? resData;
      const valid = isAddressValid(result);
      if (valid) {
        let res;
        if (isEditing) {
          //===// Update existing address //===//
          res = await apiPost<any>(`shipping-address/update/${formData.id}`, formData);
        } else {
          //===// Create new address //===//
          res = await apiPost<any>("shipping-address/store", formData);
        }

        if (res.status) {
          const closeBtn = document.querySelector(
            "#add-new-shipping-address-modal .btn-close"
          ) as HTMLElement;
          if (closeBtn) closeBtn.click();
          setFormData(initialFormState);
          setIsEditing(false);
          toastSuccess(res.message);
          fetchShippingAddresses();
        } else {
          toastError(res.message);
        }
      }  else {
        toastError("Please provide a valid address.");
      }

    } catch (error) {
      console.error("Shipping address error:", error);
      toastError("An error occurred while saving address");
    }
    setLoading(false);
  };

  function isAddressValid(response: any): boolean {
    const addr = response?.output?.resolvedAddresses?.[0]?.attributes;
    if (!addr) return false;

    //===// Real environment check //===//
    if (response?.output?.alerts?.[0]?.code === "VIRTUAL.RESPONSE") {
      console.warn("⚠️ Virtual Response: Sandbox mode only, not real validation.");
    }

    return addr.CountrySupported === "true" &&
      addr.ValidlyFormed === "true" &&
      addr.Matched === "true";
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toastWarning("Please fix the validation errors");
      return;
    }

    setLoading(true);
    const updateFormData = new FormData();
    updateFormData.append("id", user.id);
    updateFormData.append("email", user.email);
    updateFormData.append("first_name", user.first_name);
    updateFormData.append("last_name", user.last_name);

    if (fileInputRef.current?.files?.[0]) {
      updateFormData.append("avatars", fileInputRef.current.files[0]);
    }

    try {
      const res = await apiPost<any>("profile/update", updateFormData);
      if (res.status) {
        let userData = get<any>("user");
        userData.first_name = user.first_name;
        userData.last_name = user.last_name;
        set("user", userData);
        setUser(userData);
        toastSuccess("Profile updated successfully");
        fetchProfile();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toastError(res.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toastError("An error occurred while updating profile");
    }

    setLoading(false);
  };

  const handleDeleteAddress = async (address: any) => {
    const isConfirmed = await toastConfirm(
      "Are you sure you want to remove this shipping address?",
      "Yes, Remove",
      "Cancel"
    );

    if (isConfirmed) {
      setLoading(true);
      try {
        const res = await apiDelete<any>(`shipping-address/delete/${address._id}`);
        if (res.status) {
          toastSuccess(res.message);
          fetchShippingAddresses();
        } else {
          toastError(res.message);
        }
      } catch (error) {
        console.error("Delete address error:", error);
        toastError("An error occurred while deleting address");
      }
      setLoading(false);
    }
  };

  const handleEditAddress = (address: any) => {
    console.log("address", address);

    //===// Set form data for editing //===//
    setFormData({
      id: address._id,
      address: address.address || "",
      address2: address.address2 || "",
      country: address.country || "",
      city: address.city || "",
      zip: address.zip || "",
      phone_number: address.phone_number || "",
    });
    setIsEditing(true);

    //===// Open the modal //===//
    void openBootstrapModal("add-new-shipping-address-modal");
  };

  const handleAddNewAddress = () => {
    //===// Reset form for new address //===//
    setFormData(initialFormState);
    setIsEditing(false);

    //===// Open the modal //===//
    void openBootstrapModal("add-new-shipping-address-modal");
  };

  const handleModalClose = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setShippingErrors({ address: "", country: "", city: "", zip: "", phone_number: "", });
  };

  const validateShippingForm = () => {
    const newErrors = { address: "", country: "", city: "", zip: "", phone_number: "", };
    let isValid = true;

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
      isValid = false;
    }

    if (!formData.country) {
      newErrors.country = "Please select a country";
      isValid = false;
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
      isValid = false;
    }

    if (!formData.zip.trim()) {
      newErrors.zip = "ZIP code is required";
      isValid = false;
    } else {
      const zipRegex = formData.country === "US" ? /^\d{5}(-\d{4})?$/ : /^[A-Za-z0-9\s-]{3,10}$/;
      if (!zipRegex.test(formData.zip.trim())) {
        newErrors.zip = "Please enter a valid ZIP code";
        isValid = false;
      }
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
      isValid = false;
    } else {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(formData.phone_number.trim())) {
        newErrors.phone_number = "Please enter a valid phone number";
        isValid = false;
      }
    }

    setShippingErrors(newErrors);
    return isValid;
  };


  const handleDelete = async () => {
    const isConfirmed = await toastConfirm(
      "Are you sure you want to remove this account data?",
      "Yes",
      "No"
    );

    if (isConfirmed) {
      showLoader();
      const formData = new FormData();
      formData.append("id", user.id);
      const res = await apiPost<any>("profile/delete", formData);
      if (res.status) {
        hideLoader();
        toastSuccess(res.message);
        removeEncrypted("user");
        localStorage.clear();
        router.push("/");
      } else {
        toastError(res.message || "Failed to delete data");
      }
    }
  };

  return (
    <>
      <div className="profile-page">
        <div className="container">
          <div className="white-box profile-block">
            <div className="profile-img">
              <img
                src={user.avatar != "" ? user.avatar : "/avatar-default.svg"}
                alt="Profile"
                width={120}
                height={120}
                className="pro-img"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="upload-btn"
                type="button"
              >
                <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/camera.png`} alt="Upload" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </div>
            <h2>
              {user.first_name} {user.last_name}
            </h2>
            <h3 className="text-gray-500 text-sm">{user.email}</h3>
          </div>

          <h4 className="mt-5">Details & preferences</h4>
          <div className="white-box profile-form">
            {loading ? (
              <div className="order-content text-center">
                <span className="spinner-border spinner-border-sm text-secondary" role="status" ></span>
              </div>
            ) : (
              <form onSubmit={handleProfileUpdate}>
                <div className="form-group">
                  <label>First name</label>
                  <input
                    type="text"
                    className={`form-control ${errors.first_name ? "is-invalid" : ""}`}
                    name="first_name"
                    value={user.first_name}
                    onChange={handleChange}
                  />
                  {errors.first_name && (
                    <div className="invalid-feedback d-block">
                      {errors.first_name}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Last name</label>
                  <input
                    type="text"
                    className={`form-control ${errors.last_name ? "is-invalid" : ""}`}
                    name="last_name"
                    value={user.last_name}
                    onChange={handleChange}
                  />
                  {errors.last_name && (
                    <div className="invalid-feedback d-block">
                      {errors.last_name}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Email address</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    name="email"
                    value={user.email}
                    // onChange={handleChange}
                    disabled
                  />
                  {errors.email && (
                    <div className="invalid-feedback d-block">
                      {errors.email}
                    </div>
                  )}
                </div>
                <button type="submit" className="button button--full-width save-changes-btn" disabled={loading}>
                  {loading ? "Saving..." : "Save changes"}
                </button>
              </form>
            )}
          </div>

          <h4 className="mt-5">Shipping addresses</h4>
          <div className="white-box profile-form">
            {addressList.slice(0, 5).map((item: any, index) => {
              return (
                <div key={index} className="card mb-3 p-3">
                  <div className="row">
                    <div className="col profile-location-icon">
                      <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                    </div>
                    <div className="col-sm-8 col-7">
                      <b>
                        {item.address}
                        {item.address2 && ` ${item.address2}`}
                      </b>
                      <p className="mb-0">
                        {item.country}, {item.city} - {item.zip}
                      </p>
                      <div className="d-flex">
                        <div className="user-dt">
                          <i
                            className="fa fa-phone-square"
                            aria-hidden="true"
                          ></i>
                          <span>{item.phone_number}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-2 col-3 d-flex align-items-start justify-content-end gap-2">
                      <a onClick={() => handleEditAddress(item)}>
                        <i className="fa fa-edit" style={{ fontSize: "22px", paddingTop: "5px" }} ></i>
                      </a>
                      <a onClick={() => handleDeleteAddress(item)}>
                        <img className="delete-img" src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/delete-icon.svg`} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
            <button className="add-new-shipping-btn w-100 form-control" onClick={handleAddNewAddress} disabled={loading || addressList.length >= 5}>
              {addressList.length >= 5 ? "Maximum addresses reached (5)" : "Add new shipping address"}
            </button>
          </div>


          <h4 className="mt-5">Account Settings</h4>
          <div className="white-box profile-form">
            <button className="account-setting-btn w-100 form-control" onClick={handleDelete}>
              Delete My Data
            </button>
          </div>

          <h4 className="mt-5">Policy and Terms</h4>
          <div className="white-box privacy-policy-block">
            {privacyPolicy && (
              <div className="policy-section" style={{ marginBottom: "10px" }}>
                <h3>{privacyPolicy.Title}</h3>
                <div dangerouslySetInnerHTML={{ __html: privacyPolicy.Description, }} />
              </div>
            )}

            {termsConditions && (
              <div className="terms-section">
                <h3>{termsConditions.Title}</h3>
                <div dangerouslySetInnerHTML={{ __html: termsConditions.Description, }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="modal fade" id="add-new-shipping-address-modal" tabIndex={-1} aria-labelledby="add-new-shipping-address-modal-Label" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                {isEditing ? "Edit shipping address" : "Create new shipping address"}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={handleModalClose}>
                <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/close-icon.png`} alt="Close" />
              </button>
            </div>
            <div className="modal-body">
              <form id="addressForm">
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label>Address line 1</label>
                      <input
                        type="text"
                        className={`form-control ${shippingErrors.address ? "is-invalid" : ""}`}
                        name="address"
                        value={formData.address}
                        onChange={handleShippingChange}
                        required />
                      {shippingErrors.address && (
                        <div className="invalid-feedback">
                          {shippingErrors.address}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="form-group">
                      <label>Address line 2 (optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="address2"
                        value={formData.address2}
                        onChange={handleShippingChange}
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="form-group">
                      <label>Country</label>
                      <select
                        className="form-control"
                        name="country"
                        value={formData.country}
                        onChange={handleShippingChange}
                        required >
                        <option value="US">United States</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        className={`form-control ${shippingErrors.city ? "is-invalid" : ""}`}
                        name="city"
                        value={formData.city}
                        onChange={handleShippingChange}
                        required />
                      {shippingErrors.city && (
                        <div className="invalid-feedback">
                          {shippingErrors.city}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label>ZIP Code</label>
                      <input
                        type="text"
                        className={`form-control ${shippingErrors.zip ? "is-invalid" : ""}`}
                        name="zip"
                        value={formData.zip}
                        onChange={handleShippingChange}
                        required />
                      {shippingErrors.zip && (
                        <div className="invalid-feedback">
                          {shippingErrors.zip}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input type="text"
                        className={`form-control ${shippingErrors.phone_number ? "is-invalid" : ""}`}
                        name="phone_number"
                        value={formData.phone_number}
                        maxLength={10}
                        onChange={handleShippingChange}
                        required />
                      {shippingErrors.phone_number && (
                        <div className="invalid-feedback">
                          {shippingErrors.phone_number}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-secondary" onClick={handleShippingSubmit} disabled={loading}>
                {loading ? "Saving..." : isEditing ? "Update address" : "Add new address"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

