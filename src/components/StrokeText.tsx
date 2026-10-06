import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./StrokeText.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type FillMode = "fade" | "wipe" | "none";
type StrokeTrigger = "mount" | "hover" | "scroll" | "loop";

type StrokeTextProps = {
  text?: string;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  drawDuration?: number;
  fillDelay?: number;
  stagger?: number;
  ease?: string;
  trigger?: StrokeTrigger;
  fillMode?: FillMode;
  fontSize?: number | string;
  fontWeight?: number | string;
  letterSpacing?: number | string;
  reverse?: boolean;
  className?: string;
  style?: CSSProperties;
};

type TextBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function StrokeText({
  text = "Draw Attention",
  strokeColor = "#A78BFA",
  fillColor = "#F8FAFC",
  strokeWidth = 1.4,
  drawDuration = 1.6,
  fillDelay = 0.2,
  stagger = 0.05,
  ease = "power2.out",
  trigger = "mount",
  fillMode = "wipe",
  fontSize = 128,
  fontWeight = 800,
  letterSpacing = -4,
  reverse = false,
  className = "",
  style,
}: StrokeTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const strokeTextRef = useRef<SVGTextElement>(null);
  const wipeRectRef = useRef<SVGRectElement>(null);
  const [box, setBox] = useState<TextBox | null>(null);
  const rawId = useId();
  const wipeId = `stroke-text-wipe-${rawId.replace(
    /[^a-zA-Z0-9_-]/g,
    "",
  )}`;
  const characters = useMemo(
    () => Array.from(String(text ?? "")),
    [text],
  );
  const numericFontSize =
    typeof fontSize === "number"
      ? fontSize
      : Number.parseFloat(fontSize) || 128;
  const dash = Math.max(numericFontSize * 7, 200);
  const fontStyle = useMemo(
    () => ({
      fontSize:
        typeof fontSize === "number" ? `${fontSize}px` : fontSize,
      fontWeight,
      letterSpacing:
        typeof letterSpacing === "number"
          ? `${letterSpacing}px`
          : letterSpacing,
    }),
    [fontSize, fontWeight, letterSpacing],
  );

  useLayoutEffect(() => {
    const node = strokeTextRef.current;
    if (!node) return undefined;

    let cancelled = false;

    const measure = () => {
      if (cancelled || !strokeTextRef.current) return;

      let boundingBox: DOMRect;
      try {
        boundingBox = strokeTextRef.current.getBBox();
      } catch {
        return;
      }
      if (!boundingBox || !boundingBox.width) return;

      const padding = Math.max(
        Number(strokeWidth) || 1,
        numericFontSize * 0.1,
      );
      const next = {
        x: boundingBox.x - padding,
        y: boundingBox.y - padding,
        width: boundingBox.width + padding * 2,
        height: boundingBox.height + padding * 2,
      };

      setBox((current) =>
        current &&
        Math.abs(current.x - next.x) < 0.5 &&
        Math.abs(current.width - next.width) < 0.5 &&
        Math.abs(current.y - next.y) < 0.5
          ? current
          : next,
      );
    };

    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [
    characters,
    fontSize,
    fontWeight,
    letterSpacing,
    numericFontSize,
    strokeWidth,
  ]);

  useEffect(() => {
    const root = rootRef.current;
    if (typeof window === "undefined" || !root || !box) {
      return undefined;
    }

    const strokes = gsap.utils.toArray<Element>(
      root.querySelectorAll("[data-stroke-char]"),
    );
    const fills = gsap.utils.toArray<Element>(
      root.querySelectorAll("[data-fill-char]"),
    );
    const wipe = wipeRectRef.current;
    if (!strokes.length) return undefined;

    const fillEnabled = fillMode !== "none";
    const useWipe = fillEnabled && fillMode === "wipe";
    const fillDuration = Math.max(0.4, drawDuration * 0.5);
    const staggerConfig = reverse
      ? { each: stagger, from: "end" as const }
      : stagger;
    const targets = [...strokes, ...fills, wipe].filter(
      (target): target is Element => Boolean(target),
    );

    const setStart = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, {
        strokeDasharray: dash,
        strokeDashoffset: dash,
      });
      gsap.set(fills, { opacity: useWipe ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: { width: 0 } });
    };

    const setEnd = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, {
        strokeDasharray: dash,
        strokeDashoffset: 0,
      });
      gsap.set(fills, { opacity: fillEnabled ? 1 : 0 });
      if (wipe) {
        gsap.set(wipe, {
          attr: { width: fillEnabled ? box.width : 0 },
        });
      }
    };

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      setEnd();
      return () => gsap.killTweensOf(targets);
    }

    const buildTimeline = () => {
      setStart();
      const timeline = gsap.timeline({
        paused: true,
        repeat: trigger === "loop" ? -1 : 0,
        repeatDelay: trigger === "loop" ? 0.9 : 0,
        defaults: { overwrite: "auto" },
      });

      timeline.to(
        strokes,
        {
          strokeDashoffset: 0,
          duration: drawDuration,
          ease,
          stagger: staggerConfig,
        },
        0,
      );

      if (useWipe && wipe) {
        timeline.to(
          wipe,
          {
            attr: { width: box.width },
            duration: fillDuration,
            ease: "power2.inOut",
          },
          drawDuration + fillDelay,
        );
      } else if (fillEnabled) {
        timeline.to(
          fills,
          {
            opacity: 1,
            duration: fillDuration,
            ease: "power2.out",
            stagger: staggerConfig,
          },
          drawDuration + fillDelay,
        );
      }

      return timeline;
    };

    let timeline: gsap.core.Timeline | null = null;
    let scrollTrigger: ScrollTrigger | null = null;
    let removeHover: (() => void) | null = null;

    if (trigger === "hover") {
      setEnd();
      const play = () => {
        timeline?.kill();
        timeline = buildTimeline();
        timeline.play(0);
      };
      root.addEventListener("pointerenter", play);
      removeHover = () => root.removeEventListener("pointerenter", play);
    } else {
      timeline = buildTimeline();
      if (trigger === "scroll") {
        scrollTrigger = ScrollTrigger.create({
          trigger: root,
          start: "top 82%",
          once: true,
          onEnter: () => timeline?.play(0),
        });
      } else {
        timeline.play(0);
      }
    }

    return () => {
      removeHover?.();
      scrollTrigger?.kill();
      timeline?.kill();
      gsap.killTweensOf(targets);
    };
  }, [
    box,
    dash,
    drawDuration,
    ease,
    fillDelay,
    fillMode,
    reverse,
    stagger,
    trigger,
  ]);

  const viewBox = box
    ? `${box.x} ${box.y} ${box.width} ${box.height}`
    : `0 ${-numericFontSize} 600 ${numericFontSize * 1.3}`;

  return (
    <span
      ref={rootRef}
      className={`stroke-text ${
        trigger === "hover" ? "stroke-text--hover" : ""
      } ${className}`.trim()}
      style={
        {
          ...style,
          "--stroke-text-height": `${Math.round(
            numericFontSize * 1.3,
          )}px`,
        } as CSSProperties
      }
      role="img"
      aria-label={String(text ?? "")}
    >
      <svg
        className="stroke-text__svg"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {fillMode === "wipe" && box ? (
          <defs>
            <clipPath
              id={wipeId}
              clipPathUnits="userSpaceOnUse"
            >
              <rect
                ref={wipeRectRef}
                x={box.x}
                y={box.y}
                width="0"
                height={box.height}
              />
            </clipPath>
          </defs>
        ) : null}

        <text
          ref={strokeTextRef}
          className="stroke-text__stroke"
          x="0"
          y="0"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={fontStyle}
        >
          {characters.map((character, index) => (
            <tspan data-stroke-char key={`stroke-${index}`}>
              {character}
            </tspan>
          ))}
        </text>

        <text
          className="stroke-text__fill"
          x="0"
          y="0"
          fill={fillColor}
          stroke="none"
          style={fontStyle}
          clipPath={
            fillMode === "wipe" && box
              ? `url(#${wipeId})`
              : undefined
          }
        >
          {characters.map((character, index) => (
            <tspan data-fill-char key={`fill-${index}`}>
              {character}
            </tspan>
          ))}
        </text>
      </svg>
    </span>
  );
}

export default StrokeText;
