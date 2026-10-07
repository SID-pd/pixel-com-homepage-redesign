"use client";

import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./bgcolor.css";

function BgcolorTabs({ selectedColor: initialColor = "#ffffff", onSelectColor }: any) {
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const [activeTab, setActiveTab] = useState("colors");

    const bgColors = [
        // {
        //     name: "🌑 Dark & Rich",
        //     colors: [
        //         { id: "1A2A6C", name: "Navy Blue", color: "#1A2A6C" },
        //         { id: "2E5339", name: "Forest Green", color: "#2E5339" },
        //         { id: "800000", name: "Maroon", color: "#800000" },
        //         { id: "444444", name: "Charcoal Gray", color: "#444444" },
        //         { id: "5C4033", name: "Chocolate Brown", color: "#5C4033" },
        //     ],
        // },
        {
            name: "🌤 Soft Neutrals",
            colors: [
                { id: "D3D3D3", name: "Light Gray", color: "#D3D3D3" },
                { id: "FFF8E1", name: "Ivory", color: "#FFF8E1" },
                { id: "F5F5DC", name: "Beige / Sand", color: "#F5F5DC" },
                { id: "FADADD", name: "Pale Pink", color: "#FADADD" },
                { id: "D0EFFF", name: "Pastel Blue", color: "#D0EFFF" },
            ],
        },
        {
            name: "🌸 Muted Colors",
            colors: [
                { id: "D4A5A5", name: "Dusty Rose", color: "#D4A5A5" },
                { id: "B2AC88", name: "Sage Green", color: "#B2AC88" },
                { id: "B0E0E6", name: "Powder Blue", color: "#B0E0E6" },
                { id: "E6E6FA", name: "Lavender", color: "#E6E6FA" },
                { id: "D4B84F", name: "Muted Mustard", color: "#D4B84F" },
            ],
        },
    ];

    const handleColorSelect = (color: any) => {
        setSelectedColor(color);
        if (onSelectColor) {
            onSelectColor({ color });
        }
    };

    const handleClearColor = () => {
        setSelectedColor("#FFFFFF");
        if (onSelectColor) {
            onSelectColor({ color: "#FFFFFF" });
        }
    };

    return (
        <div className="bg-color">
            {/* Tabs */}
            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "colors" ? "active" : ""}`}
                        onClick={() => setActiveTab("colors")}
                    >
                        Colors
                    </button>
                </li>
                {/* <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "gradients" ? "active" : ""}`}
                        onClick={() => setActiveTab("gradients")}
                    >
                        Gradients
                    </button>
                </li> */}
            </ul>

            {/* Tab content */}
            <div className="pe-2">
                {activeTab === "colors" && (
                    <div className="tab-content">
                        <div className="row text-bgcolor-main pt-2">
                            {bgColors.map((item, index) => (
                                <div className="col-12" key={index}>
                                    <div className="bg-title">{item.name}</div>
                                    <div className="row d-inline text-bgcolor p-2">
                                        {item.colors.map((color) => (
                                            <div className="col-12" key={color.id}>
                                                <div className="form-check d-flex">
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor={`bg_color_${color.id}`}
                                                    >
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="bg_color"
                                                            id={`bg_color_${color.id}`}
                                                            value={color.color}
                                                            checked={color.color === selectedColor}
                                                            onChange={() => handleColorSelect(color.color)}
                                                        />
                                                        <div>
                                                            <span
                                                                className="color-box"
                                                                style={{ backgroundColor: color.color }}
                                                            ></span>
                                                            <span>&nbsp;{color.name}</span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="col-12">
                                <button
                                    type="button"
                                    className="clear-color"
                                    onClick={handleClearColor}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: 0,
                                        color: "blue",
                                        textDecoration: "underline",
                                        cursor: "pointer",
                                    }}
                                >
                                    Clear Color
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "gradients" && (
                    <div className="tab-content p-3">
                        {/* Placeholder for gradient picker */}
                        <p>Gradient picker will go here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BgcolorTabs;
