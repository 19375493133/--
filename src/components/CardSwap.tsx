import {
  Children,
  cloneElement,
  createRef,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { useReducedMotion } from "motion/react";
import "./CardSwap.css";

type CardProps = {
  children?: ReactNode;
  className?: string;
  customClass?: string;
  style?: CSSProperties;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
};

type CardSwapProps = {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (index: number) => void;
  skewAmount?: number;
  easing?: "linear" | "elastic";
  children: ReactNode;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = "",
      customClass = "",
      ...rest
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={`card ${customClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  ),
);

Card.displayName = "Card";

function makeSlot(
  index: number,
  distanceX: number,
  distanceY: number,
  total: number,
) {
  return {
    x: index * distanceX,
    y: -index * distanceY,
    z: -index * distanceX * 1.5,
    zIndex: total - index,
  };
}

function placeNow(
  element: HTMLDivElement,
  slot: ReturnType<typeof makeSlot>,
  skew: number,
) {
  gsap.set(element, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: "center center",
    zIndex: slot.zIndex,
    force3D: true,
  });
}

export function CardSwap({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = "elastic",
  children,
}: CardSwapProps) {
  const reduceMotion = useReducedMotion();
  const config =
    easing === "elastic"
      ? {
          ease: "elastic.out(0.6,0.9)",
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05,
        }
      : {
          ease: "power1.inOut",
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2,
        };

  const childArray = useMemo(
    () => Children.toArray(children),
    [children],
  );
  const refs = useMemo(
    () =>
      Array.from({ length: childArray.length }, () =>
        createRef<HTMLDivElement>(),
      ),
    [childArray.length],
  );
  const order = useRef(
    Array.from({ length: childArray.length }, (_, index) => index),
  );
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const total = refs.length;
    refs.forEach((reference, index) => {
      if (reference.current) {
        placeNow(
          reference.current,
          makeSlot(
            index,
            cardDistance,
            verticalDistance,
            total,
          ),
          skewAmount,
        );
      }
    });

    if (reduceMotion || total < 2) {
      return undefined;
    }

    const swap = () => {
      if (order.current.length < 2) return;

      const [front, ...rest] = order.current;
      const frontElement = refs[front].current;
      if (!frontElement) return;

      const timeline = gsap.timeline();
      timelineRef.current = timeline;
      timeline.to(frontElement, {
        y: "+=500",
        duration: config.durDrop,
        ease: config.ease,
      });

      timeline.addLabel(
        "promote",
        `-=${config.durDrop * config.promoteOverlap}`,
      );
      rest.forEach((index, restIndex) => {
        const element = refs[index].current;
        if (!element) return;

        const slot = makeSlot(
          restIndex,
          cardDistance,
          verticalDistance,
          refs.length,
        );
        timeline.set(element, { zIndex: slot.zIndex }, "promote");
        timeline.to(
          element,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease,
          },
          `promote+=${restIndex * 0.15}`,
        );
      });

      const backSlot = makeSlot(
        refs.length - 1,
        cardDistance,
        verticalDistance,
        refs.length,
      );
      timeline.addLabel(
        "return",
        `promote+=${config.durMove * config.returnDelay}`,
      );
      timeline.call(
        () => {
          gsap.set(frontElement, { zIndex: backSlot.zIndex });
        },
        undefined,
        "return",
      );
      timeline.to(
        frontElement,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          duration: config.durReturn,
          ease: config.ease,
        },
        "return",
      );
      timeline.call(() => {
        order.current = [...rest, front];
      });
    };

    swap();
    intervalRef.current = window.setInterval(swap, delay);

    if (!pauseOnHover) {
      return () => {
        if (intervalRef.current !== null) {
          window.clearInterval(intervalRef.current);
        }
        timelineRef.current?.kill();
      };
    }

    const node = containerRef.current;
    if (!node) return undefined;

    const pause = () => {
      timelineRef.current?.pause();
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    const resume = () => {
      timelineRef.current?.play();
      intervalRef.current = window.setInterval(swap, delay);
    };

    node.addEventListener("mouseenter", pause);
    node.addEventListener("mouseleave", resume);

    return () => {
      node.removeEventListener("mouseenter", pause);
      node.removeEventListener("mouseleave", resume);
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
      timelineRef.current?.kill();
    };
  }, [
    cardDistance,
    config.durDrop,
    config.durMove,
    config.durReturn,
    config.ease,
    config.promoteOverlap,
    config.returnDelay,
    delay,
    pauseOnHover,
    reduceMotion,
    refs,
    skewAmount,
    verticalDistance,
  ]);

  const rendered = childArray.map((child, index) => {
    if (!isValidElement<CardProps>(child)) {
      return child;
    }

    const card = child as ReactElement<CardProps>;
    const cloneCard = cloneElement as unknown as (
      element: ReactElement<CardProps>,
      props: Partial<CardProps> & {
        key: number;
        ref: { current: HTMLDivElement | null };
        style: CSSProperties;
        onClick: (event: MouseEvent<HTMLDivElement>) => void;
      },
    ) => ReactElement;

    return cloneCard(card, {
      key: index,
      ref: refs[index],
      style: {
        width,
        height,
        ...(card.props.style ?? {}),
      },
      onClick: (event: MouseEvent<HTMLDivElement>) => {
        card.props.onClick?.(event);
        onCardClick?.(index);
      },
    });
  });

  return (
    <div
      ref={containerRef}
      className="card-swap-container"
      style={{ width, height }}
    >
      {rendered}
    </div>
  );
}

export default CardSwap;
