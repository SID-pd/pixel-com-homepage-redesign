// components/SmartCollage.tsx
import React from "react";

interface ImageData {
  src: string;
  width: number;  // original image width
  height: number; // original image height
}

interface SmartCollageProps {
  images: ImageData[];
  canvasW?: number;
  canvasH?: number;
}

const SmartCollage: React.FC<SmartCollageProps> = ({ images, canvasW = 400, canvasH = 400 }) => {
  // -------------------------
  // 1️⃣ Layout Templates
  // -------------------------
  const layoutTemplates = [
    [{ x: 0, y: 0, w: 1, h: 1 }], // 1 image full
    [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ], // 2 side-by-side
    [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ], // 2 top-bottom
    [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 0.5, h: 0.4 },
      { x: 0.5, y: 0.6, w: 0.5, h: 0.4 },
    ], // 3 images
    [
      { x: 0, y: 0, w: 0.5, h: 0.6 },
      { x: 0.5, y: 0, w: 0.5, h: 0.6 },
      { x: 0, y: 0.6, w: 1, h: 0.4 },
    ], // 3 images alternative
    [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ], // 4 grid
    [
      { x: 0, y: 0, w: 0.6, h: 0.6 },
      { x: 0.6, y: 0, w: 0.4, h: 0.3 },
      { x: 0.6, y: 0.3, w: 0.4, h: 0.3 },
      { x: 0, y: 0.6, w: 1, h: 0.4 },
    ], // 4 images alternative
  ];

  // -------------------------
  // 2️⃣ Fit image to slot
  // -------------------------
  const fitImageToSlot = (img: ImageData, slotW: number, slotH: number) => {
    const aspect = img.width / img.height;
    const slotAspect = slotW / slotH;

    let w, h;
    if (aspect > slotAspect) {
      w = slotW;
      h = slotW / aspect;
    } else {
      h = slotH;
      w = slotH * aspect;
    }

    return { width: w, height: h };
  };

  // -------------------------
  // 3️⃣ Generate SVG positions
  // -------------------------
  const generateSVGImages = () => {
    const count = images.length;
    const possibleLayouts = layoutTemplates.filter(l => l.length === count);
    if (possibleLayouts.length === 0) return []; // no layout for this count
    const layout = possibleLayouts[Math.floor(Math.random() * possibleLayouts.length)];

    return images.map((img, idx) => {
      const slot = layout[idx];
      const slotW = slot.w * canvasW;
      const slotH = slot.h * canvasH;
      const fit = fitImageToSlot(img, slotW, slotH);

      return {
        ...img,
        x: slot.x * canvasW + slotW / 2,
        y: slot.y * canvasH + slotH / 2,
        width: fit.width,
        height: fit.height,
      };
    });
  };

  const svgImages = generateSVGImages();

  // -------------------------
  // 4️⃣ Render SVG
  // -------------------------
  return (
    <svg width={canvasW} height={canvasH}>
      {svgImages.map((img, idx) => (
        <image
          key={idx}
          href={img.src}
          x={img.x - img.width / 2}
          y={img.y - img.height / 2}
          width={img.width}
          height={img.height}
          preserveAspectRatio="xMidYMid slice"
        />
      ))}
    </svg>
  );
};

export default SmartCollage;
