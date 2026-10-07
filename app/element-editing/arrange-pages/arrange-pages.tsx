"use client";

import { useRef, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";


const type = "CANVAS_ITEM";
interface DraggableCanvasProps {
    initialItems: any;
    columns?: number;
    Width?: any;
    Height?: any;
    Backgrounds?: any;
    onChange: (newItems: any) => void;
    setBackgrounds: (newItems: any) => void;
}

export default function ({ initialItems, columns = 2, Width, Height, Backgrounds, onChange, setBackgrounds }: DraggableCanvasProps) {
    const [items, setItems] = useState<any[]>(initialItems);

    const swapItems = (fromIndex: number, toIndex: number) => {
        const newItems = [...items];
        [newItems[fromIndex], newItems[toIndex]] = [
            newItems[toIndex],
            newItems[fromIndex],
        ];
        setItems(newItems);
        onChange(newItems);

        const newBg = [...Backgrounds];
        [newBg[fromIndex], newBg[toIndex]] = [newBg[toIndex], newBg[fromIndex]];
        setBackgrounds(newBg);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, 140px)`,
                    gap: "20px 0px",
                    width: "100%",
                    justifyContent: "center",
                }}
            >
                {items.map((item: any, mainIndex: any) => {
                    let label = '';
                    if (mainIndex === 0) {
                        label = 'Front Cover';
                    } else if (mainIndex === items.length - 1) {
                        label = 'Back Cover';
                    } else {
                        label = `(${mainIndex}/${items.length - 2})`;
                    }
                    return (<CanvasItemBox
                        key={`${item.id}-${mainIndex}`}
                        item={item}
                        label={label}
                        Height={Height}
                        Width={Width}
                        index={mainIndex}
                        Backgrounds={Backgrounds[mainIndex]}
                        swapItems={swapItems}
                    />
                    )
                }
                )}
            </div >
        </DndProvider >
    );
}

interface CanvasItemBoxProps {
    item: any;
    label: any;
    Height: any;
    Width: any;
    index: number;
    Backgrounds: any;
    swapItems: (fromIndex: number, toIndex: number) => void;
}

function CanvasItemBox({ item, label, index, Height, Width, Backgrounds, swapItems }: CanvasItemBoxProps) {
    const ref = useRef<HTMLDivElement>(null);

    const [, drag] = useDrag(() => ({
        type,
        item: { index },
    }));

    const [{ canDrop }, drop] = useDrop<{
        index: number;
    }, void, { canDrop: boolean }>({
        accept: type,
        canDrop: (dragged) => dragged.index !== index,
        drop: (dragged) => swapItems(dragged.index, index),
        collect: (monitor) => ({ canDrop: monitor.canDrop() }),
    });

    //===// Attach both drag and drop to the same ref //===//
    drag(drop(ref));


    const getTextJustification = (textAlign: string): string => {
        switch (textAlign) {
            case "left":
                return "flex-start";
            case "center":
                return "center";
            case "right":
                return "flex-end";
            default:
                return "center";
        }
    };

    return (
        <>
            <div className={`card-container card-view arrange-panel`}
                ref={ref}>
                <div className="div-canvas"
                    style={{
                        width: `100%`,
                        height: `100%`,
                    }}>
                    <div style={{
                        width: `${Width}px`,
                        height: `${Height}px`,
                        backgroundColor: Backgrounds,
                        cursor: "grab",
                        userSelect: "none",
                        borderRadius: 6,
                        border: "1px solid #8b8b8b",
                        position: "relative",
                    }}
                    >
                        {item.map((obj: any, objIndex: any) => (
                            <div
                                key={obj.id}
                                className={`canvas-element ${obj.selected ? "selected-element" : ""}`}
                                style={{
                                    position: "absolute",
                                    left: `${obj.x - (obj.width || 100) / 2}px`,
                                    top: `${obj.y - (obj.height || 100) / 2}px`,
                                    width: `${obj.width || 100}px`,
                                    height: `${obj.height || 100}px`,
                                    transform: `rotate(${obj.rotation}deg) scale(${obj.scaleX}, ${obj.scaleY})`,
                                    zIndex: obj.zIndex || objIndex,
                                    cursor: obj.locked ? "default" : "pointer",
                                }}>

                                {/* Text Objects */}
                                {obj.type === "text" && (
                                    <div
                                        className="text-element"
                                        style={{
                                            fontSize: `${obj.data.fontSize}px`,
                                            fontFamily: obj.data.fontFamily,
                                            color: obj.data.fill,
                                            textAlign: obj.data.textAlign,
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: getTextJustification(obj.data.textAlign),
                                        }}>
                                        {obj.data.text}
                                    </div>
                                )}

                                {/* Layout Text Objects */}
                                {obj.type === "layoutText" && (
                                    <div
                                        className="layout-text-element"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: obj.data.fill || "rgba(11, 162, 141, 0.1)",
                                            border: `${obj.data.strokeWidth || 2}px dashed ${obj.data.stroke || "#0ba28d"}`,
                                            position: "relative",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderWidth: "thin",
                                        }}
                                    >
                                        {!obj.editable && (
                                            <div
                                                style={{
                                                    fontSize: `${obj.data.fontSize}px`,
                                                    color: obj.data.textColor || "#000",
                                                    textAlign: "center",
                                                }}
                                            >
                                                {obj.data.text || "Add Text"}
                                            </div>
                                        )}

                                        {obj.editable && (
                                            <input
                                                type="text"
                                                defaultValue={obj.data.text}
                                                style={{
                                                    width: "90%",
                                                    height: "80%",
                                                    textAlign: "center",
                                                    fontSize: `${obj.data.fontSize}px`,
                                                    background: "transparent",
                                                    border: "none",
                                                    outline: "none",
                                                }}
                                                className="layout-text-input"
                                                autoFocus
                                                disabled
                                            />
                                        )}


                                    </div>
                                )}
                                {/* Image Objects */}
                                {obj.type == "image" && (

                                    <img
                                        src={(obj as any).data.src}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "block",
                                            clipPath: obj.clipPath || (obj.containerShape ? `url(#clip-${obj.containerShape})` : "none"),
                                        }}
                                        className="image-element"
                                        draggable="false"
                                        alt=""
                                    />
                                )}

                                {/* Emoji Objects */}
                                {obj.type === "emoji" && (
                                    <img src={obj.data.src}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "block",
                                            clipPath: obj.clipPath ? obj.clipPath : obj.containerShape ? `url(#clip-${obj.containerShape})` : "none",
                                        }}
                                        className="image-element"
                                        draggable={false}
                                        alt="emoji"
                                    />
                                )}

                            </div>
                        ))}
                    </div>
                    <div className="page-preview-lable"><span>{label}</span></div>
                </div>
            </div >
        </>
    );
}
