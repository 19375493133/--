import { type PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

type EntryScreenProps = {
  isExiting: boolean;
  onEnter: () => void;
};

const appleEase = [0.16, 1, 0.3, 1] as const;

export function EntryScreen({ isExiting, onEnter }: EntryScreenProps) {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 55, damping: 22 });
  const smoothY = useSpring(pointerY, { stiffness: 55, damping: 22 });
  const markX = useTransform(smoothX, [-0.5, 0.5], [14, -14]);
  const markY = useTransform(smoothY, [-0.5, 0.5], [10, -10]);
  const glowX = useTransform(smoothX, [-0.5, 0.5], [42, -42]);
  const glowY = useTransform(smoothY, [-0.5, 0.5], [34, -34]);

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (reduceMotion) return;

    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <motion.main
      className="fixed inset-0 z-40 grid cursor-pointer place-items-center overflow-hidden bg-[#0A0A0A]"
      onPointerMove={handlePointerMove}
      onClick={onEnter}
      role="button"
      tabIndex={0}
      aria-label="进入作品集"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onEnter();
      }}
      initial={false}
      animate={
        isExiting
          ? reduceMotion
            ? { opacity: 0 }
            : { scale: 1.15, opacity: 0.86, filter: "blur(8px)" }
          : { scale: 1, opacity: 1, filter: "blur(0px)" }
      }
      transition={{ duration: reduceMotion ? 0.2 : 0.5, ease: appleEase }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(225,6,0,0.52)_0%,rgba(225,6,0,0.19)_38%,transparent_72%)] blur-2xl"
        style={{ x: glowX, y: glowY }}
        animate={
          reduceMotion
            ? { opacity: 0.35 }
            : {
                opacity: [0.34, 0.54, 0.34],
                scale: [0.94, 1.06, 0.94],
              }
        }
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-6 border border-white/[0.06] sm:inset-10"
      />
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          style={{ x: markX, y: markY }}
          className="relative flex flex-col items-center"
        >
          <motion.span
            className="text-[8rem] font-semibold leading-none text-[#F5F5F7] sm:text-[12rem] lg:text-[16rem]"
            initial={false}
            animate={
              isExiting && !reduceMotion
                ? { filter: "blur(8px)", scale: 1.15 }
                : { filter: "blur(0px)", scale: 1 }
            }
            transition={{ duration: reduceMotion ? 0.2 : 0.5, ease: appleEase }}
          >
            AI
          </motion.span>
          <div className="mt-2 h-px w-16 bg-[#E10600]" />
          <p className="mt-6 text-[0.7rem] font-medium uppercase tracking-[0.34em] text-[#86868B]">
            AI 产品专家
          </p>
        </motion.div>
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-10 left-10 hidden items-center gap-3 text-[0.65rem] uppercase tracking-[0.24em] text-[#86868B] sm:flex"
      >
        <span>作品集</span>
        <span className="h-px w-10 bg-white/15" />
        <span>2026</span>
      </div>
    </motion.main>
  );
}
