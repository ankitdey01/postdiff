"use client";

import { useId, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

export type FluidGradientTextProps = {
  /** Text content rendered inside the SVG. */
  text: string;
  /** SVG viewBox width used to scale the gradient and text layout. */
  svgViewBoxWidth?: number;
  /** SVG viewBox height used as the base text size. */
  svgViewBoxHeight?: number;
  /** Additional classes for the outer interactive region. */
  className?: string;
  /** Additional classes for the SVG surface. */
  svgClassName?: string;
};

/** Text whose gradient follows the pointer while it is hovered. */
export function FluidGradientText({
  text,
  svgViewBoxWidth = 1200,
  svgViewBoxHeight = 300,
  className,
  svgClassName,
}: FluidGradientTextProps) {
  const gradientX1Raw = useMotionValue(0.5);
  const gradientX1 = useSpring(
    useTransform(gradientX1Raw, [0, 1], [0, svgViewBoxWidth]),
    {
      stiffness: 150,
      damping: 25,
    },
  );
  const gradientId = `fluid-gradient-text-${useId().replace(/:/g, "")}`;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const containerRect = event.currentTarget.getBoundingClientRect();
    gradientX1Raw.set(
      (event.clientX - containerRect.left) / containerRect.width,
    );
  };

  const handleMouseLeave = () => {
    gradientX1Raw.set(0.5);
  };

  return (
    <div
      className={`relative size-full overflow-hidden after:absolute after:bottom-0 after:h-px after:w-full after:bg-current/15 ${className ?? ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        className={`size-full select-none ${svgClassName ?? ""}`}
        viewBox={`0 0 ${svgViewBoxWidth} ${svgViewBoxHeight}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={text}
        role="img"
      >
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          textLength={svgViewBoxWidth * 0.9}
          lengthAdjust="spacingAndGlyphs"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="2"
          fill={`url(#${gradientId})`}
          style={{
            fontFamily: "Helvetica",
            fontSize: svgViewBoxHeight,
            fontWeight: "bold",
          }}
        >
          {text}
        </text>
        <defs>
          <motion.linearGradient
            id={gradientId}
            x1={gradientX1}
            y1="0"
            x2={svgViewBoxWidth / 2}
            y2={svgViewBoxHeight}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="0.625" stopColor="currentColor" stopOpacity="0.45" />
            <stop offset="1" stopColor="currentColor" />
          </motion.linearGradient>
        </defs>
      </svg>
    </div>
  );
}
