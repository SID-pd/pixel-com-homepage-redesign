// Layout.tsx page
"use client";

import React, { useState } from "react";

interface ImageObject {
    id: string;
    type: string;
    data: { src: string };
    width?: number;
    height?: number;
}

interface DynamicSvgObject {
    mainObject: ImageObject[],
    onLayoutSelect?: (item: any, index: any, layout: any) => void,
    canvasCardWidth: number,
    canvasCardHeight: number,
    imageGapPx?: number
}

export default function DynamicSvgLayout({ mainObject, onLayoutSelect, canvasCardWidth, canvasCardHeight, imageGapPx = 15 }: DynamicSvgObject) {
    const [activeLayoutIndex, setActiveLayoutIndex] = useState<number>(0);
    const [imageObjects, setImageObjects] = useState(mainObject.filter((obj) => obj.type === "image"));
    const count = imageObjects.length;
    const canvasWidth = 100;
    const canvasHeight = 100;
    const padding = 10;
    const imageGap = imageGapPx;

    const fitImageInBounds = (imgWidth: number, imgHeight: number, boundsX: number, boundsY: number, boundsWidth: number, boundsHeight: number) => {
        if (!imgWidth || !imgHeight || imgWidth <= 0 || imgHeight <= 0) {
            imgWidth = 100;
            imgHeight = 100;
        }

        const imgAspect = imgWidth / imgHeight;
        const boundsAspect = boundsWidth / boundsHeight;
        let finalWidth, finalHeight;
        if (imgAspect > boundsAspect) {
            finalWidth = boundsWidth;
            finalHeight = boundsWidth / imgAspect;
        } else {
            finalHeight = boundsHeight;
            finalWidth = boundsHeight * imgAspect;
        }

        const finalX = boundsX + (boundsWidth - finalWidth) / 2;
        const finalY = boundsY + (boundsHeight - finalHeight) / 2;

        return {
            x: Math.round(finalX),
            y: Math.round(finalY),
            width: Math.round(finalWidth),
            height: Math.round(finalHeight)
        };
    };

    const fitImageInBounds3 = (src: any, imgWidth: number, imgHeight: number, boundsX: number, boundsY: number, boundsWidth: number, boundsHeight: number) => {
        // Fallback for invalid input
        if (!imgWidth || !imgHeight || imgWidth <= 0 || imgHeight <= 0) {
            imgWidth = 100;
            imgHeight = 100;
        }

        // Keep original size
        const finalWidth = imgWidth;
        const finalHeight = imgHeight;

        // Center inside the bounds
        const finalX = boundsX + (boundsWidth - finalWidth) / 2;
        const finalY = boundsY + (boundsHeight - finalHeight) / 2;

        return {
            x: Math.round(finalX),
            y: Math.round(finalY),
            width: finalWidth,   // original width
            height: finalHeight,  // original height
            data: { src: src }
        };
    };

    const fitImageInBoundsCase1 = (src: any, imgWidth: number, imgHeight: number, boundsX: number, boundsY: number, boundsWidth: number, boundsHeight: number) => {
        if (!imgWidth || !imgHeight || imgWidth <= 0 || imgHeight <= 0) {
            imgWidth = 100;
            imgHeight = 100;
        }

        const imgAspect = imgWidth / imgHeight;
        const boundsAspect = boundsWidth / boundsHeight;

        let finalWidth, finalHeight;
        if (imgAspect > boundsAspect) {
            finalWidth = boundsWidth;
            finalHeight = boundsWidth / imgAspect;
        } else {
            finalHeight = boundsHeight;
            finalWidth = boundsHeight * imgAspect;
        }

        const finalX = boundsX + (boundsWidth - finalWidth) / 2;
        const finalY = boundsY + (boundsHeight - finalHeight) / 2;

        let obj: any = {
            x: Math.round(finalX),
            y: Math.round(finalY),
            width: Math.round(finalWidth),
            height: Math.round(finalHeight)
        }

        if (src) {
            obj.data = { src }
        }

        return obj;
    };

    //===// Main generator //===//
    const generateLayouts = (count: number, layoutIndex: number = 0, imageObjects: any[], canvasWidth: number, canvasHeight: number, canvasCardWidth: number, canvasCardHeight: number, padding: number, imageGap: number) => {
        const layouts: any[] = [];
        const actualPadding = (padding / canvasWidth) * canvasCardWidth;
        const actualGap = imageGap;

        // ========== ONE IMAGE ========== //
        if (count === 1) {
            const boxX = actualPadding;
            const boxY = actualPadding;
            const boxWidth = canvasCardWidth - 2 * actualPadding;
            const boxHeight = canvasCardHeight - 2 * actualPadding;

            const img = imageObjects[0];
            const imgWidth = img.width || img.data?.width || 100;
            const imgHeight = img.height || img.data?.height || 100;

            const fitted = fitImageInBounds(imgWidth, imgHeight, boxX, boxY, boxWidth, boxHeight);

            layouts.push({
                x: padding,
                y: padding,
                width: canvasWidth - 2 * padding,
                height: canvasHeight - 2 * padding,
                imageObjects: { ...img }
            });
        }

        // ========== TWO IMAGES ========== //
        else if (count === 2) {
            const layoutType = layoutIndex % 2;

            if (layoutType === 0) {
                // Top-Bottom
                const svgHeight = (canvasHeight - 3 * padding) / 2;
                const boxHeight = (canvasCardHeight - 2 * actualPadding - actualGap) - 80;
                const boxWidth = canvasCardWidth - 2 * actualPadding;

                for (let i = 0; i < 2; i++) {
                    const img = imageObjects[i];
                    // const boxX = actualPadding + i - (canvasCardWidth / 8);
                    const boxX = actualPadding + (img.width / 2) - actualPadding;
                    const boxY = i === 0 ? actualPadding + (boxHeight / 4.5) : actualPadding + boxHeight + actualGap + (boxHeight / 4.5);
                    const imgWidth = img.width || img.data?.width || 100;
                    const imgHeight = img.height || img.data?.height || 100;
                    const fitted = fitImageInBounds(imgWidth, imgHeight, boxX, boxY, boxWidth, boxHeight);

                    layouts.push({
                        x: padding,
                        y: i === 0 ? padding : svgHeight + 2 * padding,
                        width: canvasWidth - 2 * padding,
                        height: svgHeight,
                        imageObjects: { ...img, ...fitted }
                    });
                }
            } else {
                // Left-Right
                const svgWidth = (canvasWidth - 3 * padding) / 2;
                const boxWidth = (canvasCardWidth - 2 * actualPadding - actualGap) / 2;
                const boxHeight = canvasCardHeight - 2 * actualPadding + 100;

                for (let i = 0; i < 2; i++) {
                    const img = imageObjects[i];
                    const imgWidth = img.width || img.data?.width || 100;
                    const imgHeight = img.height || img.data?.height || 100;
                    const boxX = i === 0 ? actualPadding + (boxWidth / 2) : actualPadding + boxWidth + actualGap + (boxWidth / 2);
                    const boxY = (img.height / 2) - (canvasCardHeight / 8) + (boxHeight / 8);

                    const fitted = fitImageInBounds(imgWidth, imgHeight, boxX, boxY, boxWidth, boxHeight);

                    layouts.push({
                        x: i === 0 ? padding : svgWidth + 2 * padding,
                        y: padding,
                        width: svgWidth,
                        height: canvasHeight - 2 * padding,
                        imageObjects: { ...img, ...fitted }
                    });
                }
            }
        }

        // ========== THREE IMAGES ========== //
        else if (count === 3) {
            const layoutType = layoutIndex % 3;
            let svgBoxes: any[] = [];
            let canvasBoxes: any[] = [];

            const svgWidthHalf = (canvasWidth - 3 * padding) / 2;
            const svgHeightHalf = (canvasHeight - 3 * padding) / 2;
            const canvasWidthHalf = (canvasCardWidth - 2 * actualPadding - actualGap) / 2;
            const canvasHeightHalf = (canvasCardHeight - 2 * actualPadding - actualGap) - 100;

            switch (layoutType) {
                case 0:
                    // ===============================
                    // Layout: Left 2 stacked, Right full
                    // ===============================

                    svgBoxes = [
                        { x: padding, y: padding, width: svgWidthHalf, height: svgHeightHalf },
                        { x: padding, y: svgHeightHalf + 2 * padding, width: svgWidthHalf, height: svgHeightHalf },
                        { x: svgWidthHalf + 2 * padding, y: padding, width: svgWidthHalf, height: canvasHeight - 2 * padding },
                    ];

                    // Select which image should go to the right full-height slot
                    const portraitIndex = imageObjects.reduce((bestIdx, img, idx, arr) => {
                        const w = img.width || img.data?.width || 100;
                        const h = img.height || img.data?.height || 100;

                        const best = arr[bestIdx];
                        const bw = best.width || best.data?.width || 100;
                        const bh = best.height || best.data?.height || 100;

                        const isPortrait = h > w;
                        const bestIsPortrait = bh > bw;

                        // Prefer portrait → taller height → fallback tallest
                        if (isPortrait && !bestIsPortrait) return idx;
                        if (isPortrait && bestIsPortrait) return h > bh ? idx : bestIdx;
                        if (!isPortrait && !bestIsPortrait) return h > bh ? idx : bestIdx;

                        return bestIdx;
                    }, 0);

                    // Base positions — independent of imageObjects
                    canvasBoxes = [
                        { x: actualPadding + (imageObjects[0].width / 2) - padding, y: (imageObjects[0].height / 2) - (canvasCardHeight / 8) + (canvasHeightHalf / 8), width: canvasWidthHalf, height: canvasHeightHalf },
                        { x: actualPadding + (imageObjects[1].width / 2) - padding, y: (imageObjects[1].height / 2) + (canvasCardHeight / 2) + actualGap, width: canvasWidthHalf, height: canvasHeightHalf },
                        { x: actualPadding + (imageObjects[2].width / 2) - padding, y: 50, width: canvasWidthHalf, height: canvasCardHeight - 2 * actualPadding },
                    ];

                    // console.log("portraitIndex", portraitIndex);
                    canvasBoxes[portraitIndex].y = (imageObjects[portraitIndex].height / 2) + (canvasCardHeight / 4) + actualGap;
                    canvasBoxes[portraitIndex].x = actualPadding + (canvasCardWidth / 2) + actualGap + (canvasWidthHalf / 3);


                    // Create a new ordered array (don’t mutate imageObjects)
                    canvasBoxes = [
                        ...canvasBoxes.filter((_, idx) => idx !== portraitIndex),
                        canvasBoxes[portraitIndex], // portrait or tallest → last slot
                    ];
                    // Create a new ordered array (don’t mutate imageObjects)
                    const reorderedImages = [
                        ...imageObjects.filter((_, idx) => idx !== portraitIndex),
                        imageObjects[portraitIndex], // portrait or tallest → last slot
                    ];

                    // Calculate fitted positions (don’t modify original imageObjects)
                    reorderedImages.forEach((img, i) => {
                        const canvasBox = canvasBoxes[i];
                        const imgWidth = img.width || img.data?.width || 100;
                        const imgHeight = img.height || img.data?.height || 100;

                        const fitted = fitImageInBounds3(
                            img.data.src,
                            imgWidth,
                            imgHeight,
                            canvasBox.x,
                            canvasBox.y,
                            canvasBox.width,
                            canvasBox.height
                        );

                        layouts.push({
                            ...svgBoxes[i],
                            imageObjects: { ...img, ...fitted }, // keeps original img intact
                        });
                    });
                    break;

                case 1:
                    // Top full, Bottom 2 side
                    svgBoxes = [
                        { x: padding, y: padding, width: canvasWidth - 2 * padding, height: svgHeightHalf }, // full width
                        { x: padding, y: svgHeightHalf + 2 * padding, width: svgWidthHalf, height: svgHeightHalf },
                        { x: svgWidthHalf + 2 * padding, y: svgHeightHalf + 2 * padding, width: svgWidthHalf, height: svgHeightHalf }
                    ];


                    // Top full width slot (canvas box spans full width)
                    canvasBoxes = [
                        {
                            x: actualPadding,                  // start at padding
                            y: actualPadding,
                            width: canvasCardWidth - 2 * actualPadding, // full width minus padding
                            height: canvasCardHeight / 2 - actualGap
                        },
                        // bottom left
                        {
                            x: (canvasCardWidth / 4) - svgWidthHalf,
                            y: canvasCardHeight - (svgHeightHalf + actualPadding),
                            width: (canvasCardWidth - 3 * actualPadding) / 2,
                            height: canvasCardHeight / 2 - actualGap * 1.5
                        },
                        // bottom right
                        {
                            x: (canvasCardWidth / 2) + svgWidthHalf + actualPadding,
                            // x: actualPadding + (canvasCardWidth - 3 * actualPadding) / 2 + actualGap,
                            y: canvasCardHeight - (svgHeightHalf + actualPadding),
                            width: (canvasCardWidth - 3 * actualPadding) / 2,
                            height: canvasCardHeight / 2 - actualGap * 1.5
                        }
                    ];


                    {   // Select widest image → place on top
                        const widestIndex = imageObjects.reduce((maxIdx, img, idx, arr) => {
                            const w = img.width || img.data?.width || 100;
                            const maxW = arr[maxIdx].width || arr[maxIdx].data?.width || 100;
                            return w > maxW ? idx : maxIdx;
                        }, 0);

                        canvasBoxes[0].y = (imageObjects[widestIndex].height / 2) - (canvasCardHeight / (imageObjects[widestIndex].height < imageObjects[widestIndex].width ? 8 : 3)) + actualPadding;
                        canvasBoxes[0].x = imageObjects[widestIndex].width - (canvasCardWidth / (imageObjects[widestIndex].height < imageObjects[widestIndex].width ? 8 : 4));


                        // Reorder (widest on top)
                        const reorderedImages = [
                            imageObjects[widestIndex],
                            ...imageObjects.filter((_, idx) => idx !== widestIndex)
                        ];

                        // Fit each image inside its box perfectly (centered)
                        reorderedImages.forEach((img, i) => {
                            const box = canvasBoxes[i];
                            const imgWidth = img.width || img.data?.width || 100;
                            const imgHeight = img.height || img.data?.height || 100;

                            const fitted = fitImageInBoundsCase1(
                                img.data?.src,
                                imgWidth,
                                imgHeight,
                                box.x,
                                box.y,
                                box.width,
                                box.height
                            );

                            layouts.push({
                                ...svgBoxes[i],
                                imageObjects: { ...img, ...fitted }
                            });
                        });
                    }
                    break;

                case 2:
                    // Left full, Right 2 stacked
                    svgBoxes = [
                        { x: padding, y: padding, width: svgWidthHalf, height: canvasHeight - 2 * padding }, // full height
                        { x: svgWidthHalf + 2 * padding, y: padding, width: svgWidthHalf, height: svgHeightHalf },
                        { x: svgWidthHalf + 2 * padding, y: svgHeightHalf + 2 * padding, width: svgWidthHalf, height: svgHeightHalf }
                    ];

                    // tallest image to full height slot
                    {
                        const tallestIndex = imageObjects.reduce((maxIdx, img, idx, arr) => {
                            const h = img.height || img.data?.height || 100;
                            const maxH = arr[maxIdx].height || arr[maxIdx].data?.height || 100;
                            return h > maxH ? idx : maxIdx;
                        }, 0);

                        canvasBoxes = [
                            { x: (canvasCardWidth / 4), y: (canvasCardHeight / 2) + actualPadding, width: canvasWidthHalf, height: canvasCardHeight - 2 * actualPadding }, // full height
                            { x: actualPadding + (canvasCardWidth / 2) + (imageObjects[1].width / 2) - (actualGap * 2), y: (imageObjects[1].height / 2) + (canvasCardHeight / 10) - actualGap, width: canvasWidthHalf, height: canvasHeightHalf },
                            { x: actualPadding + (canvasCardWidth / 2) + (imageObjects[2].width / 3) + actualGap, y: (imageObjects[2].height / 2) + (canvasCardHeight / 2) + actualGap, width: canvasWidthHalf, height: canvasHeightHalf }
                        ];

                        canvasBoxes[tallestIndex].y = (imageObjects[tallestIndex].height / 2) + (canvasCardHeight / 7);
                        canvasBoxes[tallestIndex].x = actualPadding + (canvasCardWidth / 4) + actualGap - (canvasWidthHalf / 4);

                        const reorderedImages = [
                            imageObjects[tallestIndex], // tallest goes first
                            ...imageObjects.filter((_, idx) => idx !== tallestIndex)
                        ];

                        reorderedImages.forEach((img, i) => {
                            const canvasBox = canvasBoxes[i];
                            const imgWidth = img.width || img.data?.width || 100;
                            const imgHeight = img.height || img.data?.height || 100;
                            const fitted = fitImageInBounds3(img.data?.src, imgWidth, imgHeight, canvasBox.x, canvasBox.y, canvasBox.width, canvasBox.height);
                            layouts.push({ ...svgBoxes[i], imageObjects: { ...img, ...fitted } });
                        });
                    }
                    break;
            }
        }

        // ========== FOUR IMAGES ==========
        else if (count === 4) {
            const layoutType = layoutIndex % 4;
            let svgBoxes: any[] = [];
            let canvasBoxes: any[] = [];
            let reorderedImages: any[] = [];

            const svgWidthHalf = (canvasWidth - 3 * padding) / 2;
            const svgHeightHalf = (canvasHeight - 3 * padding) / 2;
            const svgThirdHeight = (canvasHeight - 4 * padding) / 3;
            const svgThirdWidth = (canvasWidth - 4 * padding) / 3;

            const canvasWidthHalf = (canvasCardWidth - 2 * actualPadding - actualGap) / 2;
            const canvasHeightHalf = (canvasCardHeight - 2 * actualPadding - actualGap) / 2;
            const canvasThirdHeight = (canvasCardHeight - 2 * actualPadding - 2 * actualGap) / 3;
            const canvasThirdWidth = (canvasCardWidth - 2 * actualPadding - 2 * actualGap) / 3;

            switch (layoutType) {
                case 0:
                    // Left 3 stacked, Right full
                    svgBoxes = [
                        { x: padding, y: padding, width: svgWidthHalf, height: svgThirdHeight },
                        { x: padding, y: svgThirdHeight + 2 * padding, width: svgWidthHalf, height: svgThirdHeight },
                        { x: padding, y: 2 * (svgThirdHeight + padding) + padding, width: svgWidthHalf, height: svgThirdHeight },
                        { x: svgWidthHalf + 2 * padding, y: padding, width: svgWidthHalf, height: canvasHeight - 2 * padding }
                    ];
                    canvasBoxes = [
                        { x: actualPadding, y: actualPadding, width: canvasWidthHalf, height: canvasThirdHeight },
                        { x: actualPadding, y: actualPadding + canvasThirdHeight + actualGap, width: canvasWidthHalf, height: canvasThirdHeight },
                        { x: actualPadding, y: actualPadding + 2 * canvasThirdHeight + 2 * actualGap, width: canvasWidthHalf, height: canvasThirdHeight },
                        { x: actualPadding, y: actualPadding, width: canvasWidthHalf, height: canvasCardHeight - 2 * actualPadding }
                    ];

                    const tallestIndex = imageObjects.reduce((maxIdx, img, idx, arr) => {
                        const currentH = img.data?.imageHeight || img.height || 0;
                        const currentW = img.data?.imageWidth || img.width || 0;
                        const maxH = arr[maxIdx].data?.imageHeight || arr[maxIdx].height || 0;
                        if (currentH > maxH && currentH > currentW) {
                            return idx;
                        }

                        return maxIdx;
                    }, 0);


                    canvasBoxes[tallestIndex].y = imageObjects[tallestIndex].height + (canvasWidthHalf / actualGap);
                    canvasBoxes[tallestIndex].x = actualPadding + (canvasCardWidth / 3) + actualGap + (canvasWidthHalf / 2);
                    canvasBoxes[tallestIndex].height = imageObjects[tallestIndex].height;
                    canvasBoxes[tallestIndex].width = imageObjects[tallestIndex].width;

                    const otherImages = imageObjects.filter((_, idx) => idx !== tallestIndex);
                    const canvasCenterY = canvasHeight / 2;

                    // Step 2: Remaining 3 images on LEFT side (stacked vertically)
                    const availableHeight = canvasHeight - (actualGap * (otherImages.length - 1));
                    const maxEachHeight = availableHeight / otherImages.length;

                    let currentY = (canvasHeight / 2) + actualPadding;

                    otherImages.forEach((img, i) => {
                        const idx = imageObjects.indexOf(img);
                        let slotW = (canvasCardWidth - actualGap * 3) / 3;
                        let slotH = (canvasCardHeight - actualGap * 3) / 3;
                        const { width: fittedW, height: fittedH } = fitInside(imageObjects[i].data?.imageWidth, imageObjects[i].data?.imageHeight, slotW, slotH);

                        // Position on left side
                        canvasBoxes[idx].height = fittedH;
                        canvasBoxes[idx].width = fittedW;
                        canvasBoxes[idx].x = (canvasCardWidth / 3) - actualGap;
                        canvasBoxes[idx].y = currentY;
                        currentY += fittedH + (canvasCardHeight / 6) - actualPadding;
                    });

                    canvasBoxes = [
                        ...canvasBoxes.filter((_, idx) => idx !== tallestIndex),
                        canvasBoxes[tallestIndex], // portrait or tallest → last slot
                    ];

                    reorderedImages = [
                        ...imageObjects.filter((_, idx) => idx !== tallestIndex),
                        imageObjects[tallestIndex] // tallest goes first
                    ];

                    reorderedImages.forEach((svgBox, i) => {
                        const canvasBox = canvasBoxes[i];
                        const img = svgBox;
                        const imgWidth = img.width || img.data?.width || 100;
                        const imgHeight = img.height || img.data?.height || 100;

                        const finalX = canvasBox.x + (canvasBox.width - imgWidth) / 2;
                        const finalY = canvasBox.y + (canvasBox.height - imgHeight) / 2;
                        layouts.push({
                            ...svgBoxes[i], imageObjects: {
                                ...img, ... {
                                    x: Math.round(finalX),
                                    y: Math.round(finalY),
                                    width: canvasBox.width,
                                    height: canvasBox.height,
                                    data: { src: img.data?.src }
                                }
                            }
                        });
                    });
                    break;
                case 1:
                    // Left full, Right 3 stacked
                    svgBoxes = [
                        { x: padding, y: padding, width: svgWidthHalf, height: canvasHeight - 2 * padding },
                        { x: svgWidthHalf + 2 * padding, y: padding, width: svgWidthHalf, height: svgThirdHeight },
                        { x: svgWidthHalf + 2 * padding, y: svgThirdHeight + 2 * padding, width: svgWidthHalf, height: svgThirdHeight },
                        { x: svgWidthHalf + 2 * padding, y: 2 * (svgThirdHeight + padding) + padding, width: svgWidthHalf, height: svgThirdHeight }
                    ];
                    canvasBoxes = [
                        { x: actualPadding, y: actualPadding, width: canvasWidthHalf, height: canvasCardHeight - 2 * actualPadding },
                        { x: actualPadding + canvasWidthHalf + actualGap, y: actualPadding, width: canvasWidthHalf, height: canvasThirdHeight },
                        { x: actualPadding + canvasWidthHalf + actualGap, y: actualPadding + canvasThirdHeight + actualGap, width: canvasWidthHalf, height: canvasThirdHeight },
                        { x: actualPadding + canvasWidthHalf + actualGap, y: actualPadding + 2 * canvasThirdHeight + 2 * actualGap, width: canvasWidthHalf, height: canvasThirdHeight }
                    ];

                    const tallestImageIndex = imageObjects.reduce((maxIdx, img, idx, arr) => {
                        const currentH = img.data?.imageHeight || img.height || 0;
                        const currentW = img.data?.imageWidth || img.width || 0;
                        if (currentH <= currentW) return maxIdx;
                        const maxH = arr[maxIdx].data?.imageHeight || arr[maxIdx].height || 0;
                        const maxW = arr[maxIdx].data?.imageWidth || arr[maxIdx].width || 0;
                        if (currentH > maxH && currentH > currentW) {
                            return idx;
                        }
                        if (maxH <= maxW && currentH > currentW) {
                            return idx;
                        }
                        return maxIdx;
                    }, 0);

                    const imgData2 = imageObjects[tallestImageIndex];
                    const imgW2 = imgData2.data?.imageWidth || imgData2.width || 100;
                    const imgH2 = imgData2.data?.imageHeight || imgData2.height || 100;

                    const topSectionHeight2 = canvasCardHeight;
                    const availableWidth1 = canvasCardWidth - actualPadding * 3;
                    const availableHeight1 = topSectionHeight2 - actualPadding * 3;
                    const { width: fittedW, height: fittedH } = fitInside(imgW2, imgH2, availableWidth1, availableHeight1);

                    canvasBoxes[tallestImageIndex].y = (canvasCardHeight / 2);
                    canvasBoxes[tallestImageIndex].x = (canvasCardWidth / 3);
                    canvasBoxes[tallestImageIndex].height = fittedH;
                    canvasBoxes[tallestImageIndex].width = fittedW;


                    const otherImages2 = imageObjects.filter((_, idx) => idx !== tallestImageIndex);
                    const numImages2 = otherImages2.length;
                    const totalGap2 = actualPadding * (numImages2 - 1);
                    const availableWidthOther = canvasCardWidth - totalGap2;

                    // Each image gets an equal horizontal slot
                    const slotWOther2 = availableWidthOther / numImages2;
                    const slotHOther2 = canvasCardHeight / numImages2;
                    let totalImagesHeightCount = 0;
                    const otherImageHeights = otherImages2.map((img) => {
                        const imgW = img.data?.imageWidth || 100; // default fallback
                        const imgH = img.data?.imageHeight || 100;
                        const { width: fittedW, height: fittedH } = fitInside(imgW, imgH, slotWOther2, slotHOther2);
                        totalImagesHeightCount += fittedH;
                        return { fittedW, fittedH };
                    });

                    let currentPostionY = (canvasHeight / 2) + actualGap;

                    otherImages2.forEach((img, i) => {
                        const idx = imageObjects.indexOf(img);
                        const { fittedW, fittedH } = otherImageHeights[i];

                        // Position on right side
                        canvasBoxes[idx].height = fittedH;
                        canvasBoxes[idx].width = fittedW;
                        canvasBoxes[idx].x = (canvasCardWidth / 2) + (totalImagesHeightCount / 2) - actualPadding;
                        canvasBoxes[idx].y = currentPostionY;

                        currentPostionY += fittedH + (canvasHeightHalf / 9);
                    })

                    canvasBoxes = [
                        ...canvasBoxes.filter((_, idx) => idx !== tallestImageIndex),
                        canvasBoxes[tallestImageIndex],
                    ];

                    reorderedImages = [
                        ...imageObjects.filter((_, idx) => idx !== tallestImageIndex),
                        imageObjects[tallestImageIndex]
                    ];

                    reorderedImages.forEach((svgBox, i) => {
                        const canvasBox = canvasBoxes[i];
                        const img = svgBox;
                        const finalX = canvasBox.x;
                        const finalY = canvasBox.y;

                        layouts.push({
                            ...svgBoxes[i], imageObjects: {
                                ...img, ... {
                                    x: Math.round(finalX),
                                    y: Math.round(finalY),
                                    width: canvasBox.width,
                                    height: canvasBox.height,
                                    data: { src: img.data?.src }
                                }
                            }
                        });
                    });

                    break;
                case 2:
                    // Top full, Bottom 3 side
                    svgBoxes = [
                        { x: padding, y: padding, width: canvasWidth - 2 * padding, height: svgHeightHalf },
                        { x: padding, y: svgHeightHalf + 2 * padding, width: svgThirdWidth, height: svgHeightHalf },
                        { x: svgThirdWidth + 2 * padding, y: svgHeightHalf + 2 * padding, width: svgThirdWidth, height: svgHeightHalf },
                        { x: 2 * (svgThirdWidth + padding) + padding, y: svgHeightHalf + 2 * padding, width: svgThirdWidth, height: svgHeightHalf }
                    ];
                    canvasBoxes = [
                        { x: actualPadding, y: (actualPadding * 2), width: canvasCardWidth - 2 * actualPadding, height: canvasHeightHalf },
                        { x: actualPadding, y: actualPadding + canvasHeightHalf + actualGap, width: canvasThirdWidth, height: canvasHeightHalf },
                        { x: actualPadding + canvasThirdWidth + actualGap, y: actualPadding + canvasHeightHalf + actualGap, width: canvasThirdWidth, height: canvasHeightHalf },
                        { x: actualPadding + 2 * canvasThirdWidth + 2 * actualGap, y: actualPadding + canvasHeightHalf + actualGap, width: canvasThirdWidth, height: canvasHeightHalf }
                    ];

                    const widestImageIndex = imageObjects.reduce((maxIdx, img, idx, arr) => {
                        const currentW = img.data?.imageWidth || img.width || 0;
                        const currentH = img.data?.imageHeight || img.height || 0;
                        const maxW = arr[maxIdx].data?.imageWidth || arr[maxIdx].width || 0;
                        const maxH = arr[maxIdx].data?.imageHeight || arr[maxIdx].height || 0;

                        // Only consider images where width > height
                        if (currentW > currentH) {
                            if (maxW <= maxH || currentW > maxW) {
                                return idx;
                            }
                        }
                        return maxIdx;
                    }, 0);

                    const imgData = imageObjects[widestImageIndex];
                    const imgW = imgData.data?.imageWidth || imgData.width || 100;
                    const imgH = imgData.data?.imageHeight || imgData.height || 100;

                    const topSectionHeight = canvasCardHeight * 0.80;
                    const availableWidth2 = canvasCardWidth - actualPadding * 2;
                    const availableHeight2 = topSectionHeight - actualPadding * 2;
                    const { width: fittedW2, height: fittedH2 } = fitInside(imgW, imgH, availableWidth2, availableHeight2);

                    canvasBoxes[widestImageIndex].width = fittedW2;
                    canvasBoxes[widestImageIndex].height = fittedH2;

                    canvasBoxes[widestImageIndex].x = (canvasCardWidth / 3) - (actualPadding + actualGap);
                    canvasBoxes[widestImageIndex].y = actualGap;

                    const otherImages3 = imageObjects.filter((_, idx) => idx !== widestImageIndex);

                    const numImages3 = otherImages3.length;
                    const totalGap3 = actualPadding * (numImages3 - 1);
                    const availableWidth3 = canvasCardWidth - totalGap3;

                    // Each image gets an equal horizontal slot
                    const slotW3 = availableWidth3 / numImages3;
                    const slotH3 = canvasCardHeight / numImages3;

                    let totalImagesWidthCount = 0;
                    const otherImageSizes = otherImages3.map((img) => {
                        const imgW = img.data?.imageWidth || 100; // default fallback
                        const imgH = img.data?.imageHeight || 100;
                        const { width: fittedW, height: fittedH } = fitInside(imgW, imgH, slotW3, slotH3);
                        totalImagesWidthCount += fittedW;
                        return { fittedW, fittedH };
                    });

                    let currentPostionX = (canvasCardWidth / 3) - (totalImagesWidthCount / 3) - actualGap;;

                    otherImages3.forEach((img, i) => {
                        const idx = imageObjects.indexOf(img);
                        const { fittedW, fittedH } = otherImageSizes[i];

                        canvasBoxes[idx].height = fittedH;
                        canvasBoxes[idx].width = fittedW;
                        canvasBoxes[idx].x = currentPostionX;
                        canvasBoxes[idx].y = (canvasCardHeight) - (fittedH + actualGap);
                        currentPostionX += (totalImagesWidthCount / 2) - actualGap;
                    });


                    canvasBoxes = [
                        canvasBoxes[widestImageIndex],
                        ...canvasBoxes.filter((_, idx) => idx !== widestImageIndex),
                    ];
                    reorderedImages = [
                        imageObjects[widestImageIndex],
                        ...imageObjects.filter((_, idx) => idx !== widestImageIndex),
                    ];


                    reorderedImages.forEach((svgBox, i) => {
                        const canvasBox = canvasBoxes[i];
                        const img = svgBox;
                        const finalX = canvasBox.x + (canvasBox.width) / 2;
                        const finalY = canvasBox.y + (canvasBox.height) / 2;

                        layouts.push({
                            ...svgBoxes[i], imageObjects: {
                                ...img, ... {
                                    x: Math.round(finalX),
                                    y: Math.round(finalY),
                                    width: canvasBox.width,
                                    height: canvasBox.height,
                                    data: { src: img.data?.src }
                                }
                            }
                        });
                    });

                    break;
                case 3:
                    // Top 3 side, Bottom full
                    svgBoxes = [
                        { x: padding, y: padding, width: svgThirdWidth, height: svgHeightHalf },
                        { x: svgThirdWidth + 2 * padding, y: padding, width: svgThirdWidth, height: svgHeightHalf },
                        { x: 2 * (svgThirdWidth + padding) + padding, y: padding, width: svgThirdWidth, height: svgHeightHalf },
                        { x: padding, y: svgHeightHalf + 2 * padding, width: canvasWidth - 2 * padding, height: svgHeightHalf }
                    ];
                    canvasBoxes = [
                        { x: actualPadding, y: actualPadding, width: canvasThirdWidth, height: canvasHeightHalf },
                        { x: actualPadding + canvasThirdWidth + actualGap, y: actualPadding, width: canvasThirdWidth, height: canvasHeightHalf },
                        { x: actualPadding + 2 * canvasThirdWidth + 2 * actualGap, y: actualPadding, width: canvasThirdWidth, height: canvasHeightHalf },
                        { x: actualPadding, y: actualPadding + canvasHeightHalf + actualGap, width: canvasCardWidth - 2 * actualPadding, height: canvasHeightHalf }
                    ];
                    const widestImageIndex2 = imageObjects.reduce((maxIdx, img, idx, arr) => {
                        const currentW = img.data?.imageWidth || img.width || 0;
                        const currentH = img.data?.imageHeight || img.height || 0;

                        const maxW = arr[maxIdx].data?.imageWidth || arr[maxIdx].width || 0;
                        const maxH = arr[maxIdx].data?.imageHeight || arr[maxIdx].height || 0;

                        // Only consider images where width > height
                        if (currentW > currentH) {
                            if (maxW <= maxH || currentW > maxW) {
                                return idx;
                            }
                        }
                        return maxIdx;
                    }, 0);

                    // Get the widest image object
                    const widestImage = imageObjects[widestImageIndex2];
                    canvasBoxes[widestImageIndex2].width = widestImage.width;
                    canvasBoxes[widestImageIndex2].height = widestImage.height;
                    canvasBoxes[widestImageIndex2].x = (canvasCardWidth / 3) + actualGap - actualPadding;
                    canvasBoxes[widestImageIndex2].y = (canvasCardHeight - widestImage.height) - actualGap;

                    // Filter out the widest image
                    const otherImages4 = imageObjects.filter((_, idx) => idx !== widestImageIndex2);

                    const numImages = otherImages4.length;
                    const totalGap = actualPadding * (numImages - 1);
                    const availableWidth = canvasCardWidth - totalGap;

                    // Each image gets an equal horizontal slot
                    const slotW2 = availableWidth / numImages;
                    const slotH2 = canvasCardHeight / numImages;


                    // Calculate total width of all top images for perfect centering
                    let totalImagesWidth = 0;
                    const imageSizes = otherImages4.map((img) => {
                        const imgW = img.data?.imageWidth || 100; // default fallback
                        const imgH = img.data?.imageHeight || 100;
                        const { width: fittedW, height: fittedH } = fitInside(imgW, imgH, slotW2, slotH2);
                        totalImagesWidth += fittedW;
                        return { fittedW, fittedH };
                    });

                    // Total width including gaps
                    const totalTopRowWidth = totalImagesWidth;

                    console.log(totalImagesWidth);


                    // Start X so that the group is centered
                    let currentX = (canvasCardWidth / 3) - (totalTopRowWidth / 3) - actualGap;

                    otherImages4.forEach((img, i) => {
                        const idx = imageObjects.indexOf(img);
                        const { fittedW, fittedH } = imageSizes[i];

                        canvasBoxes[idx].width = fittedW;
                        canvasBoxes[idx].height = fittedH;
                        canvasBoxes[idx].x = Math.round(currentX);
                        canvasBoxes[idx].y = (canvasCardHeight / 3) - ((actualGap * 3) + actualPadding);

                        // Move next image position
                        currentX += (canvasCardWidth / 3) - actualGap;
                    });

                    canvasBoxes = [
                        ...canvasBoxes.filter((_, idx) => idx !== widestImageIndex2),
                        canvasBoxes[widestImageIndex2],
                    ];

                    reorderedImages = [
                        ...imageObjects.filter((_, idx) => idx !== widestImageIndex2),
                        imageObjects[widestImageIndex2],
                    ];

                    reorderedImages.forEach((svgBox, i) => {
                        const canvasBox = canvasBoxes[i];
                        const img = svgBox;
                        const finalX = canvasBox.x + (canvasBox.width) / 2;
                        const finalY = canvasBox.y + (canvasBox.height) / 2;

                        layouts.push({
                            ...svgBoxes[i], imageObjects: {
                                ...img, ... {
                                    x: Math.round(finalX),
                                    y: Math.round(finalY),
                                    width: canvasBox.width,
                                    height: canvasBox.height,
                                    data: { src: img.data?.src }
                                }
                            }
                        });
                    });
                    break;
            }
        }

        return layouts;
    };


    // Calculate how many layout variations are available
    const getLayoutVariations = (count: number) => {
        if (count === 1) return 1;
        if (count === 2) return 2;
        if (count === 3) return 3;
        if (count === 4) return 4;
        return 1;
    };

    const numLayouts = getLayoutVariations(count);

    const onSelectLayout = (idx: number) => {
        setActiveLayoutIndex(idx);
        const layouts = generateLayouts(
            count,
            idx,
            imageObjects,
            canvasWidth,
            canvasHeight,
            canvasCardWidth,
            canvasCardHeight,
            padding,
            imageGap
        );

        if (onLayoutSelect) {
            onLayoutSelect(imageObjects[0], idx, layouts);
        }
    };

    function fitInside(imgW: number, imgH: number, slotW: number, slotH: number) {
        const scale = Math.min(slotW / imgW, slotH / imgH);
        const newW = imgW * scale;
        const newH = imgH * scale;
        return { width: newW, height: newH };
    }

    return (
        <div className="image-layout" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {Array.from({ length: numLayouts }).map((_, idx) => {
                const layouts = generateLayouts(
                    count,
                    idx,
                    imageObjects,
                    canvasWidth,
                    canvasHeight,
                    canvasCardWidth,
                    canvasCardHeight,
                    padding,
                    imageGap
                );


                return (
                    <svg
                        key={idx}
                        width={canvasWidth}
                        height={canvasHeight}
                        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            border: activeLayoutIndex === idx ? "2px solid #4bb8c4" : "1px solid #ccc",
                            borderRadius: "6px",
                            cursor: "pointer"
                        }}
                        onClick={() => { onSelectLayout(idx) }}
                    >
                        <rect width={canvasWidth} height={canvasHeight} rx={6} fill="white" />
                        {layouts.map((rect, i) => (
                            <rect key={i} x={rect.x} y={rect.y} width={rect.width} height={rect.height} stroke="#000" fill={activeLayoutIndex === idx ? "#4bb8c4" : "#e5e5e5"} strokeWidth={1} />
                        ))}
                    </svg>
                );
            })}
        </div>
    );
}

// ============================================
// How to use in main.tsx with custom gap:
// ============================================
// <ImageLayout
//     mainObject={mainObject}
//     onLayoutSelect={handleLayoutSelect}
//     canvasCardWidth={canvasWidth}
//     canvasCardHeight={canvasHeight}
//     imageGapPx={20}  // Optional: set gap between images (10-20px recommended)
// />