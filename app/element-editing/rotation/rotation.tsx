"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import "./rotation.css";

interface RotationProps {
  angle?: number;
  onAngleChanged?: (angle: number) => void;
  speedFactor?: number;
}

const Rotation: React.FC<RotationProps> = ({
  angle = 0,
  onAngleChanged,
  speedFactor = 0.15,
}) => {
  const [currentAngle, setCurrentAngle] = useState(angle);

  const ticksRef = useRef<HTMLDivElement>(null);

  const minAngle = -180;
  const maxAngle = 180;
  const tickSpacing = 6;
  const totalTicks = maxAngle - minAngle;
  const containerWidth = 250;

  const isDragging = useRef(false);
  const startX = useRef(0);
  const lastOffset = useRef(0);
  const currentOffset = useRef(0);

  //===// Initialize ticks on mount //===//
  useEffect(() => {
    if (!ticksRef.current) return;

    const ticksElem = ticksRef.current;
    ticksElem.innerHTML = "";

    //===// Create ticks //===//
    for (let i = 0; i <= totalTicks; i++) {
      const degree = i + minAngle;
      const tick = document.createElement("div");
      tick.className = "tick" + (degree % 10 === 0 ? " major" : "");
      ticksElem.appendChild(tick);
    }

    //===// Set initial offset so that the angle matches starting position //===//
    const centerIndex = angle - minAngle;
    const initialOffset =
      -(centerIndex * tickSpacing) + containerWidth / 2;

    ticksElem.style.left = `${initialOffset}px`;
    lastOffset.current = currentOffset.current = initialOffset;
    setCurrentAngle(angle);
  }, [angle, minAngle, totalTicks]);

  //===// Handle dragging //===//
  const dragTo = useCallback(
    (currentX: number) => {
      const dx = (currentX - startX.current) * speedFactor;
      const newOffset = lastOffset.current + dx;

      const totalWidth = totalTicks * tickSpacing;
      const minOffsetVal = -(totalWidth - containerWidth / 2);
      const maxOffsetVal = containerWidth / 2;

      currentOffset.current = Math.max(
        minOffsetVal,
        Math.min(maxOffsetVal, newOffset)
      );

      if (ticksRef.current) {
        ticksRef.current.style.left = `${currentOffset.current}px`;
      }

      const newAngle = Math.round(
        (containerWidth / 2 - currentOffset.current) / tickSpacing + minAngle
      );

      setCurrentAngle(newAngle);
      onAngleChanged?.(newAngle);
    },
    [minAngle, onAngleChanged, tickSpacing, totalTicks, containerWidth, speedFactor]
  );

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    e.preventDefault();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
  };

  //===// Global drag listeners //===//
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) dragTo(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging.current) dragTo(e.touches[0].clientX);
    };
    const onRelease = () => {
      isDragging.current = false;
      lastOffset.current = currentOffset.current;
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
  }, [dragTo]);

  return (
    <div className="rotation-component">
      <div className="rotation-label">
        Rotation <span className="rotation-value">{currentAngle}°</span>
      </div>

      <div className="tick-container" onMouseDown={onMouseDown} onTouchStart={onTouchStart} >
        <div className="center-indicator"></div>
        <div className="ticks" ref={ticksRef}></div>
      </div>
    </div>
  );
};

export default Rotation;
