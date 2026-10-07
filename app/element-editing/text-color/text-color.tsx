"use client";

import { useState } from "react";
import { SketchPicker } from "react-color";
import "./text-color.css";

export default function TextColor({ selectedColor, onColorSelection }: any) {
    const [colorHexCode, setColorHexCode] = useState('#000000');
    function handleChange(color: any) {
        // selectedColor(color.hex);
        setColorHexCode(color.hex);
        onColorSelection({ color: color.hex, forall: false });
    };

    return (
        <div className="row">
            <div className="col-12">
                <SketchPicker
                    color={colorHexCode}
                    onChange={(color: any) => handleChange(color)} // instant update while dragging
                />
            </div>
        </div>
    );
}
