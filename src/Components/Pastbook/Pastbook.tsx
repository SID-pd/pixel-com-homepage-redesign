import React, { useEffect, useState } from "react";

interface Photo {
  id: string;
  picture: string;
  name?: string;
  link?: string;
}

const Pastbook: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [userName, setUserName] = useState<string>("");
  const facebook_appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "";

  useEffect(() => {
    //===// Avoid adding the script multiple times //===//
    if (document.getElementById("facebook-jssdk")) return;

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("=> FB SDK script loaded");

      (window as any).FB.init({
        appId: facebook_appId, // <-- your App ID
        cookie: true,
        xfbml: true,
        version: "v17.0",
      });

      console.log("=> FB SDK initialized");
      setIsReady(true);
    };

    document.body.appendChild(script);
  }, []);

  const handleLogin = () => {
    if (!(window as any).FB) {
      alert("Facebook SDK not loaded yet!");
      return;
    }

    (window as any).FB.login(
      (response: any) => {
        if (response.authResponse) {
          //===// Get user details //===//
          (window as any).FB.api("/me", { fields: "id,name" }, (user: any) => {
            console.log("User:", user);
            setUserName(user.name);
          });

          //===// Get user photos //===//
          (window as any).FB.api("/me/photos", {
            // fields: "id,name,picture,link,created_time",
            type: "uploaded",
            since: "2023-01-01",
            until: "2025-12-31"
          },
            (res: any) => {
              console.log("Photos:", res);
              if (res && res.data) {
                setPhotos(res.data);
              }
            }
          );

        }
      },
      { scope: "user_photos" }
    );
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      {!photos.length ? (
        isReady ? (
          <button
            onClick={handleLogin}
            style={{
              background: "#1877f2",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Login with Facebook
          </button>
        ) : (
          <p>Loading Facebook SDK...</p>
        )
      ) : (
        <div>
          <h2>📸 {userName}'s Facebook Photos</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            {photos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "#fafafa",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <a href={photo.link} target="_blank" rel="noopener noreferrer">
                  <img
                    src={photo.picture}
                    alt={photo.name || "Facebook Photo"}
                    style={{ width: "100%", display: "block" }}
                  />
                </a>
                {photo.name && (
                  <p style={{ padding: "5px", fontSize: "14px" }}>
                    {photo.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pastbook;
