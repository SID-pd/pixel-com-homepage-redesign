"use client";
import { useState, useEffect } from "react";
import "./font-size.css";

interface FontSizeProps {
    selectedFontSize?: number;
    onSizeChange: (data: { size: number; forall: boolean }) => void;
}

const FontSize: React.FC<FontSizeProps> = ({ selectedFontSize = 12, onSizeChange }) => {
    const options = [6, 8, 10, 12, 14, 16, 18, 21, 24, 28, 32];
    const [value, setValue] = useState<number | string>(selectedFontSize);
    const [showOptions, setShowOptions] = useState(false);

    //===// Sync when parent changes selectedFontSize //===//
    useEffect(() => {
        setValue(selectedFontSize);
    }, [selectedFontSize]);

    //===// handle typing //===//
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setValue(val);
        setShowOptions(false);

        const num = parseInt(val);
        if (!isNaN(num)) {
            onSizeChange({ size: num, forall: false });
        }
    };

    //===// handle selecting from dropdown //===//
    const handleSelect = (option: number) => {
        setValue(option);
        setShowOptions(false);
        onSizeChange({ size: option, forall: false });
    };

    //===// increment //===//
    const increment = () => {
        setValue((prev) => {
            const num = parseInt(prev as string) || 0;
            const newVal = num + 1;
            onSizeChange({ size: newVal, forall: false });
            return newVal;
        });
    };

    //===// decrement //===//
    const decrement = () => {
        setValue((prev) => {
            const num = parseInt(prev as string) || 0;
            const newVal = num > 0 ? num - 1 : 0;
            onSizeChange({ size: newVal, forall: false });
            return newVal;
        });
    };

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            {/* minus button */}
            <button className="custom-minus" type="button" onClick={decrement}>
                <i className="fa fa-minus" aria-hidden="true"></i>
            </button>

            {/* input with dropdown */}
            <div className="input-box">
                <input
                    className="form-control text-center"
                    type="number"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => setShowOptions(true)}
                    onBlur={() => setTimeout(() => setShowOptions(false), 200)}
                    style={{ width: "100%", padding: "5px", textAlign: "center" }}
                />

                {showOptions && (
                    <ul
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            maxHeight: "150px",
                            overflowY: "auto",
                            border: "1px solid #ccc",
                            background: "#fff",
                            margin: 0,
                            padding: 0,
                            listStyle: "none",
                            zIndex: 1000,
                        }}
                    >
                        {options.map((option, i) => (
                            <li
                                key={i}
                                onMouseDown={() => handleSelect(option)}
                                style={{
                                    padding: "5px",
                                    cursor: "pointer",
                                    background: value === option ? "#eee" : "transparent",
                                    textAlign: "center",
                                }}
                            >
                                {option}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* plus button */}
            <button className="custom-plus" type="button" onClick={increment}>
                <i className="fa fa-plus" aria-hidden="true"></i>
            </button>
        </div>
    );
};

export default FontSize;
