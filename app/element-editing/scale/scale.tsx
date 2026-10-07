"use client";

import React, { useEffect, useRef, useState } from "react";
import "./scale.css";

interface ScaleProps {
    zoom?: number;
    onScaleChanged?: (zoom: number) => void;
}

export default function Scale({ zoom = 1.0, onScaleChanged }: ScaleProps) {
    const [currentZoom, setCurrentZoom] = useState<number>(zoom);

    const tickContainerRef = useRef<HTMLDivElement | null>(null);
    const ticksRef = useRef<HTMLDivElement | null>(null);

    const minZoom = 0.1;
    const maxZoom = 4;
    const step = 0.1;
    const tickSpacing = 6;

    const totalTicks = Math.round((maxZoom - minZoom) / step);
    const isDragging = useRef<boolean>(false);
    const startX = useRef<number>(0);
    const currentOffset = useRef<number>(0);
    const minOffset = useRef<number>(0);
    const maxOffset = useRef<number>(0);

    //===// Initialize ticks //===//
    useEffect(() => {
        const ticksElem = ticksRef.current;
        if (!ticksElem) return;

        ticksElem.innerHTML = "";

        for (let i = 0; i <= totalTicks; i++) {
            const zoomValue = minZoom + i * step;
            const tick = document.createElement("div");
            tick.className = "tick" + (zoomValue % 0.5 === 0 ? " major" : "");

            if (zoomValue % 1 === 0) {
                const label = document.createElement("div");
                label.className = "tick-label";
                label.innerText = `${zoomValue.toFixed(1)}x`;
                tick.appendChild(label);
            }
            ticksElem.appendChild(tick);
        }

        //===// Center the initial zoom value //===//
        const centerIndex = (zoom - minZoom) / step;
        const containerWidth = tickContainerRef.current?.offsetWidth ?? 0;
        currentOffset.current = -(centerIndex * tickSpacing) + containerWidth / 2;
        minOffset.current = -(totalTicks * tickSpacing) + containerWidth / 2;
        maxOffset.current = containerWidth / 2;
        ticksElem.style.transform = `translateX(${currentOffset.current}px)`;
    }, [zoom]);

    const dragTo = (currentX: number) => {
        const delta = currentX - startX.current;
        startX.current = currentX;

        currentOffset.current += delta;
        currentOffset.current = Math.max(
            minOffset.current,
            Math.min(maxOffset.current, currentOffset.current)
        );

        if (ticksRef.current) {
            ticksRef.current.style.transform = `translateX(${currentOffset.current}px)`;
        }

        updateZoomValue();
    };

    const updateZoomValue = () => {
        const containerWidth = tickContainerRef.current?.offsetWidth ?? 0;
        const center = containerWidth / 2;
        const centerIndex = (center - currentOffset.current) / tickSpacing;
        let zoomValue = minZoom + centerIndex * step;
        zoomValue = Math.max(minZoom, Math.min(maxZoom, zoomValue));
        zoomValue = parseFloat(zoomValue.toFixed(1));

        setCurrentZoom(zoomValue);
        onScaleChanged?.(zoomValue);
    };

    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        isDragging.current = true;
        startX.current = e.clientX;
        e.preventDefault();
    };

    const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        isDragging.current = true;
        startX.current = e.touches[0].clientX;
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            dragTo(e.clientX);
        };
        const onTouchMove = (e: TouchEvent) => {
            if (!isDragging.current) return;
            dragTo(e.touches[0].clientX);
        };
        const onRelease = () => {
            isDragging.current = false;
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("touchmove", onTouchMove);
        window.addEventListener("mouseup", onRelease);
        window.addEventListener("touchend", onRelease);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("mouseup", onRelease);
            window.removeEventListener("touchend", onRelease);
        };
    }, []);

    return (
        <div className="scale-component">
            <div className="zoom-label">
                Zoom <span className="zoom-value">{currentZoom.toFixed(1)}×</span>
            </div>

            <div
                className="tick-container"
                ref={tickContainerRef}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
            >
                <div className="center-indicator"></div>
                <div className="ticks" ref={ticksRef}></div>
            </div>
        </div>
    );
}
