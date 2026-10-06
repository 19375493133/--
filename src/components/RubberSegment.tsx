"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import "./RubberSegment.css";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const SPRING_UI = {
  type: "spring",
  duration: 0.3,
  bounce: 0,
} as const;
const SPRING_MOMENTUM = {
  type: "spring",
  duration: 0.4,
  bounce: 0.2,
} as const;
const SPRING_RELAX = {
  type: "spring",
  duration: 0.16,
  bounce: 0,
} as const;
const DILATE = 0.19;
const HANDOFF = 0.15;
const FLICK = 110;
const MAX_VELOCITY = 2000;
const DEADZONE = 4;
const SLOP = 10;
const RUBBER = 0.55;
const SIZES = {
  sm: { height: 28, font: 12, pad: 10, min: 36 },
  md: { height: 36, font: 13, pad: 14, min: 44 },
  lg: { height: 44, font: 14, pad: 18, min: 48 },
} as const;

type Slot = {
  l: number;
  r: number;
};

type DragState = {
  id: number;
  x0: number;
  slot: number;
  onThumb: boolean;
  live: boolean;
  offset: number;
  w: number;
  hist: Array<[number, number]>;
};

export type RubberSegmentItem =
  | string
  | {
      value: string;
      label: ReactNode;
      icon?: ReactNode;
    };

type RubberSegmentProps = {
  items: RubberSegmentItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, index: number) => void;
  onItemClick?: (value: string, index: number) => void;
  trackColor?: string;
  thumbColor?: string;
  textColor?: string;
  activeTextColor?: string;
  size?: keyof typeof SIZES;
  radius?: number;
  inset?: number;
  equalSlots?: boolean;
  stretch?: number;
  squash?: number;
  speed?: number;
  glide?: number;
  draggable?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const rubber = (over: number, dim: number) =>
  (over * dim * RUBBER) / (dim + RUBBER * Math.abs(over));

const project = (velocity: number, glide: number) => {
  const damping = 1 - 0.1 * Math.pow(0.05, glide / 100);
  return (
    ((velocity / 1000) * damping) /
    (1 - damping)
  );
};

const velocityOf = (
  history: Array<[number, number]>,
  now: number,
) => {
  const recent = history.filter(([time]) => now - time <= 100);
  if (recent.length < 2) return 0;

  const [startTime, startX] = recent[0];
  const [endTime, endX] = recent[recent.length - 1];
  return endTime - startTime >= 8
    ? ((endX - startX) / (endTime - startTime)) * 1000
    : 0;
};

const nearestSlot = (slots: Slot[], x: number) => {
  let best = 0;
  for (let index = 1; index < slots.length; index += 1) {
    const currentCenter = (slots[index].l + slots[index].r) / 2;
    const bestCenter = (slots[best].l + slots[best].r) / 2;
    if (Math.abs(currentCenter - x) < Math.abs(bestCenter - x)) {
      best = index;
    }
  }
  return best;
};

export default function RubberSegment({
  items,
  value,
  defaultValue,
  onChange,
  onItemClick,
  trackColor = "#27272a",
  thumbColor = "#fafafa",
  textColor = "#fafafa",
  activeTextColor = "#18181b",
  size = "md",
  radius = 10,
  inset = 3,
  equalSlots = true,
  stretch = 100,
  squash = 3,
  speed = 1,
  glide = 75,
  draggable = true,
  disabled = false,
  className = "",
  "aria-label": ariaLabel = "Segmented control",
}: RubberSegmentProps) {
  const list = items.map((item) =>
    typeof item === "string"
      ? { value: item, label: item }
      : item,
  );
  const [innerValue, setInnerValue] = useState(
    defaultValue ?? list[0]?.value,
  );
  const current = value !== undefined ? value : innerValue;
  const index = Math.max(
    0,
    list.findIndex((item) => item.value === current),
  );
  const reduceMotion = useReducedMotion();

  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const slots = useRef<Slot[]>([]);
  const box = useRef<DOMRect | null>(null);
  const committed = useRef(index);
  const handoff = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const drag = useRef<DragState | null>(null);
  const generation = useRef(0);

  const edgeLeft = useMotionValue(0);
  const edgeRight = useMotionValue(0);
  const innerWidth = useMotionValue(0);
  const thumbRadius = Math.max(0, radius - inset);
  const clipPath = useTransform(
    () =>
      `inset(0 ${Math.max(
        0,
        innerWidth.get() - edgeRight.get(),
      )}px 0 ${Math.max(0, edgeLeft.get())}px round ${
        thumbRadius
      }px)`,
  );

  const timed = (seconds: number) => seconds / speed;

  const jumpTo = (targetIndex: number) => {
    const slot = slots.current[targetIndex];
    if (!slot) return;
    if (handoff.current !== null) {
      clearTimeout(handoff.current);
    }
    generation.current += 1;
    edgeLeft.jump(slot.l);
    edgeRight.jump(slot.r);
  };

  const measure = () => {
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    box.current = rect;
    slots.current = list.map((_, itemIndex) => {
      const element = itemRefs.current[itemIndex];
      if (!element) return { l: 0, r: 0 };

      const itemRect = element.getBoundingClientRect();
      return {
        l: itemRect.left - rect.left - inset,
        r: itemRect.right - rect.left - inset,
      };
    });
    innerWidth.set(rect.width - inset * 2);
    jumpTo(committed.current);
  };

  const listKey = list
    .map((item) => item.value)
    .join("|");

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (trackRef.current) observer.observe(trackRef.current);
    if (typeof document !== "undefined" && document.fonts) {
      void document.fonts.ready.then(measure);
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey, size, inset, equalSlots]);

  useEffect(() => {
    if (!drag.current && committed.current !== index) {
      committed.current = index;
      jumpTo(index);
    }
  });

  useEffect(
    () => () => {
      if (handoff.current !== null) {
        clearTimeout(handoff.current);
      }
      edgeLeft.stop();
      edgeRight.stop();
    },
    [edgeLeft, edgeRight],
  );

  const commit = (targetIndex: number) => {
    committed.current = targetIndex;
    if (targetIndex === index) return;
    if (value === undefined) {
      setInnerValue(list[targetIndex].value);
    }
    onChange?.(list[targetIndex].value, targetIndex);
  };

  const land = (
    targetIndex: number,
    explicitVelocity: number | null,
    flick: boolean,
    withSquash: boolean,
  ) => {
    const slot = slots.current[targetIndex];
    if (!slot) return;

    const currentGeneration = ++generation.current;
    const direction =
      Math.sign(
        (slot.l + slot.r) / 2 -
          (edgeLeft.get() + edgeRight.get()) / 2,
      ) || 1;
    const [lead, leadTarget, trail, trailTarget] =
      direction > 0
        ? [edgeRight, slot.r, edgeLeft, slot.l]
        : [edgeLeft, slot.l, edgeRight, slot.r];
    const velocityFor = (
      motionValue: typeof edgeLeft,
    ) =>
      clamp(
        explicitVelocity === null
          ? motionValue.getVelocity()
          : explicitVelocity,
        -MAX_VELOCITY,
        MAX_VELOCITY,
      );

    animate(lead, leadTarget, {
      ...(flick ? SPRING_MOMENTUM : SPRING_UI),
      duration: timed(flick ? 0.4 : 0.3),
      velocity: velocityFor(lead),
    });

    const trailVelocity = velocityFor(trail);
    if (!withSquash || squash <= 0) {
      animate(trail, trailTarget, {
        ...SPRING_UI,
        duration: timed(0.3),
        velocity: trailVelocity,
      });
      return;
    }

    void animate(
      trail,
      trailTarget + direction * squash,
      {
        ...SPRING_UI,
        duration: timed(0.3),
        velocity: trailVelocity,
      },
    ).then(() => {
      if (generation.current === currentGeneration) {
        animate(trail, trailTarget, {
          ...SPRING_RELAX,
          duration: timed(0.16),
        });
      }
    });
  };

  const travel = (from: number, to: number) => {
    const start = slots.current[from];
    const target = slots.current[to];
    if (!start || !target) return;

    if (handoff.current !== null) {
      clearTimeout(handoff.current);
    }
    generation.current += 1;

    if (reduceMotion) {
      edgeLeft.jump(target.l);
      edgeRight.jump(target.r);
      return;
    }

    const amount = stretch / 100;
    const transition = {
      duration: timed(DILATE),
      ease: EASE_OUT,
    };
    animate(
      edgeLeft,
      target.l +
        (Math.min(start.l, target.l) - target.l) * amount,
      transition,
    );
    animate(
      edgeRight,
      target.r +
        (Math.max(start.r, target.r) - target.r) * amount,
      transition,
    );
    handoff.current = setTimeout(() => {
      land(to, null, false, true);
    }, timed(HANDOFF) * 1000);
  };

  const localX = (event: { clientX: number }) =>
    event.clientX - (box.current?.left ?? 0) - inset;

  const handlePointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    itemIndex: number,
  ) => {
    if (disabled || drag.current || event.button !== 0) return;
    if (!trackRef.current) return;

    box.current = trackRef.current.getBoundingClientRect();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail in older embedded browsers.
    }

    const x = localX(event);
    const onThumb =
      draggable &&
      x >= edgeLeft.get() &&
      x <= edgeRight.get();
    drag.current = {
      id: event.pointerId,
      x0: x,
      slot: itemIndex,
      onThumb,
      live: false,
      offset: 0,
      w: 0,
      hist: [[event.timeStamp, x]],
    };

    if (onThumb && !reduceMotion) {
      if (handoff.current !== null) {
        clearTimeout(handoff.current);
      }
      generation.current += 1;
      edgeLeft.stop();
      edgeRight.stop();
    } else if (!reduceMotion) {
      event.currentTarget.dataset.pressed = "";
    }
  };

  const handlePointerMove = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    const activeDrag = drag.current;
    if (
      !activeDrag ||
      event.pointerId !== activeDrag.id ||
      !activeDrag.onThumb
    ) {
      return;
    }

    const x = localX(event);
    activeDrag.hist.push([event.timeStamp, x]);
    if (activeDrag.hist.length > 8) {
      activeDrag.hist.shift();
    }

    if (!activeDrag.live) {
      if (Math.abs(x - activeDrag.x0) < DEADZONE) return;
      activeDrag.live = true;
      activeDrag.offset = x - edgeLeft.get();
      activeDrag.w = edgeRight.get() - edgeLeft.get();
      if (trackRef.current) {
        trackRef.current.dataset.held = "";
      }
    }

    const width = innerWidth.get();
    const left = x - activeDrag.offset;
    const maxLeft = width - activeDrag.w;
    if (reduceMotion) {
      const clamped = clamp(left, 0, maxLeft);
      edgeLeft.set(clamped);
      edgeRight.set(clamped + activeDrag.w);
    } else if (left < 0) {
      edgeLeft.set(0);
      edgeRight.set(
        activeDrag.w - rubber(-left, activeDrag.w),
      );
    } else if (left > maxLeft) {
      edgeRight.set(width);
      edgeLeft.set(
        maxLeft + rubber(left - maxLeft, activeDrag.w),
      );
    } else {
      edgeLeft.set(left);
      edgeRight.set(left + activeDrag.w);
    }
  };

  const releaseDrag = () => {
    const activeDrag = drag.current;
    drag.current = null;
    if (trackRef.current) {
      delete trackRef.current.dataset.held;
    }
    if (activeDrag) {
      const element = itemRefs.current[activeDrag.slot];
      if (element) delete element.dataset.pressed;
    }
    return activeDrag;
  };

  const handlePointerUp = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    const activeDrag = drag.current;
    if (!activeDrag || event.pointerId !== activeDrag.id) return;

    releaseDrag();
    const x = localX(event);
    if (!activeDrag.live) {
      if (Math.abs(x - activeDrag.x0) <= SLOP) {
        if (activeDrag.slot === committed.current) {
          onItemClick?.(
            list[activeDrag.slot].value,
            activeDrag.slot,
          );
        } else {
          const from = committed.current;
          commit(activeDrag.slot);
          travel(from, activeDrag.slot);
        }
      }
      return;
    }

    const velocity = velocityOf(
      activeDrag.hist,
      event.timeStamp,
    );
    const flick = Math.abs(velocity) > FLICK;
    let targetIndex = nearestSlot(
      slots.current,
      (edgeLeft.get() + edgeRight.get()) / 2 +
        project(velocity, glide),
    );
    if (flick && targetIndex === committed.current) {
      targetIndex = clamp(
        targetIndex + Math.sign(velocity),
        0,
        list.length - 1,
      );
    }
    commit(targetIndex);
    if (reduceMotion) jumpTo(targetIndex);
    else land(targetIndex, velocity, flick, flick);
  };

  const handlePointerCancel = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    const activeDrag = drag.current;
    if (!activeDrag || event.pointerId !== activeDrag.id) return;

    releaseDrag();
    if (!activeDrag.live) return;
    if (reduceMotion) jumpTo(committed.current);
    else land(committed.current, null, false, false);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (disabled) return;
    const lastIndex = list.length - 1;
    let nextIndex: number | null = null;

    if (
      event.key === "ArrowRight" ||
      event.key === "ArrowDown"
    ) {
      nextIndex = Math.min(lastIndex, index + 1);
    } else if (
      event.key === "ArrowLeft" ||
      event.key === "ArrowUp"
    ) {
      nextIndex = Math.max(0, index - 1);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    if (nextIndex === index) return;
    commit(nextIndex);
    jumpTo(nextIndex);
    itemRefs.current[nextIndex]?.focus();
  };

  const preset = SIZES[size];
  const style = {
    "--rs-track": trackColor,
    "--rs-thumb": thumbColor,
    "--rs-ink": textColor,
    "--rs-ink-active": activeTextColor,
    "--rs-radius": `${radius}px`,
    "--rs-inset": `${inset}px`,
    "--rs-thumb-radius": `${thumbRadius}px`,
    "--rs-h": `${preset.height}px`,
    "--rs-font": `${preset.font}px`,
    "--rs-pad": `${preset.pad}px`,
    "--rs-min": `${preset.min}px`,
  } as CSSProperties;

  return (
    <div
      ref={trackRef}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      data-equal={equalSlots ? "" : undefined}
      data-draggable={draggable && !disabled ? "" : undefined}
      className={`rubber-segment${
        className ? ` ${className}` : ""
      }`}
      style={style}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handlePointerCancel}
    >
      {list.map((item, itemIndex) => (
        <button
          key={item.value}
          ref={(element) => {
            itemRefs.current[itemIndex] = element;
          }}
          type="button"
          role="radio"
          aria-checked={itemIndex === index}
          tabIndex={itemIndex === index ? 0 : -1}
          disabled={disabled}
          className="rubber-segment__item"
          onPointerDown={(event) =>
            handlePointerDown(event, itemIndex)
          }
          onKeyDown={handleKeyDown}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
      <motion.div
        className="rubber-segment__thumb"
        aria-hidden="true"
        style={{ clipPath }}
      >
        {list.map((item) => (
          <span
            key={item.value}
            className="rubber-segment__item rubber-segment__copy"
          >
            {item.icon}
            {item.label}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
