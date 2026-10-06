import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import fabricLanyardTexture from "@/assets/lanyard/lanyard-fabric.png";

const Lanyard = lazy(() => import("@/components/Lanyard"));

type Position = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const FIXED_POINT_Y_RATIO = 0.185;

export function AnchoredLanyard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [canRender, setCanRender] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches,
  );
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [position, setPosition] = useState<Position>({
    left: 0,
    top: 0,
    width: 1,
    height: 1,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncMedia = () => setCanRender(mediaQuery.matches);

    syncMedia();
    mediaQuery.addEventListener("change", syncMedia);
    return () => mediaQuery.removeEventListener("change", syncMedia);
  }, []);

  useEffect(() => {
    if (!canRender) {
      setIsVisible(false);
      return undefined;
    }

    const container = containerRef.current;
    if (!container) return undefined;

    let frame: number | null = null;
    let scrollEndTimer: number | null = null;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "0px 0px -100px 0px", threshold: 0.01 },
    );
    visibilityObserver.observe(container);

    const syncPosition = () => {
      frame = null;
      const anchor = document.getElementById("lanyard-anchor");
      if (!anchor) return;
      const containerRect = container.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      const stageWidth = window.innerWidth;
      const stageHeight = window.innerHeight;
      setPosition({
        left:
          anchorRect.left +
          anchorRect.width / 2 -
          containerRect.left,
        width: stageWidth,
        height: stageHeight,
        top:
          anchorRect.top +
          anchorRect.height / 2 -
          containerRect.top -
          stageHeight * FIXED_POINT_Y_RATIO,
      });
    };

    const requestSync = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(syncPosition);
    };

    const handleScroll = () => {
      setIsScrolling(true);
      requestSync();
      if (scrollEndTimer !== null) {
        window.clearTimeout(scrollEndTimer);
      }
      scrollEndTimer = window.setTimeout(() => {
        scrollEndTimer = null;
        setIsScrolling(false);
      }, 160);
    };

    syncPosition();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", requestSync);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (scrollEndTimer !== null) window.clearTimeout(scrollEndTimer);
      visibilityObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", requestSync);
    };
  }, [canRender]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-20 hidden overflow-visible lg:block"
    >
      {canRender && !reduceMotion && isVisible ? (
        <motion.div
          data-lanyard-anchored="true"
          data-card-visible={isVisible ? "true" : "false"}
          data-lanyard-paused={isScrolling ? "true" : "false"}
          className="absolute"
          initial={{ x: "-50%", scale: 0.001, opacity: 0 }}
          animate={
            isVisible
              ? { x: "-50%", scale: 1, opacity: 1 }
              : { x: "-50%", scale: 0.001, opacity: 0 }
          }
          transition={
            isVisible
              ? {
                  type: "spring",
                  stiffness: 210,
                  damping: 10.5,
                  mass: 0.62,
                }
              : { duration: 0.15, ease: "easeOut" }
          }
          style={{
            left: position.left,
            top: position.top,
            width: position.width,
            height: position.height,
            transformOrigin: `50% ${FIXED_POINT_Y_RATIO * 100}%`,
          }}
        >
          <Suspense fallback={null}>
            <Lanyard
              position={[0, 0, 36]}
              gravity={[0, -40, 0]}
              lanyardImage={fabricLanyardTexture}
              lanyardWidth={1}
              lanyardRepeat={[1, 1]}
              paused={isScrolling}
            />
          </Suspense>
        </motion.div>
      ) : null}
    </div>
  );
}
