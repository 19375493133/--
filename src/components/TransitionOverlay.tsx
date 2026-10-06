import { motion, useReducedMotion } from "motion/react";
import type { IntroPhase } from "@/types/intro";

type TransitionOverlayProps = {
  phase: IntroPhase;
};

const appleEase = [0.16, 1, 0.3, 1] as const;

export function TransitionOverlay({ phase }: TransitionOverlayProps) {
  const reduceMotion = useReducedMotion();
  const isRedActive = phase === "a" || phase === "b" || phase === "c";
  const isBlackRevealed = phase === "b" || phase === "c";
  const isPeeling = phase === "c";

  if (phase === "reduced") {
    return (
      <motion.div
        className="fixed inset-0 z-[100] bg-[#0A0A0A]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.08, ease: "easeOut" }}
      />
    );
  }

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      animate={isPeeling ? { y: "-100%" } : { y: "0%" }}
      transition={{ duration: reduceMotion ? 0.2 : 0.7, ease: appleEase }}
    >
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[52rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,#FF2D2D_0%,#E10600_52%,rgba(225,6,0,0.86)_100%)]"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={
          isRedActive
            ? { scale: 3, opacity: 1 }
            : { scale: 0.2, opacity: 0 }
        }
        transition={{
          duration: reduceMotion ? 0.2 : isRedActive ? 0.5 : 0.2,
          ease: appleEase,
        }}
      />

      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-[#0A0A0A]"
        initial={{ clipPath: "circle(0% at 50% 50%)" }}
        animate={{
          clipPath: isBlackRevealed
            ? "circle(150% at 50% 50%)"
            : "circle(0% at 50% 50%)",
        }}
        transition={{ duration: reduceMotion ? 0.2 : 0.4, ease: appleEase }}
      />

      <motion.div
        aria-hidden="true"
        className="absolute left-0 top-[48%] h-px w-[38%] bg-[#FF2D2D] shadow-[0_0_18px_rgba(255,45,45,0.75)]"
        initial={{ x: "-120%", opacity: 0 }}
        animate={
          phase === "b"
            ? {
                x: ["-120%", "0%", "180%"],
                opacity: [0, 1, 0],
              }
            : { x: "-120%", opacity: 0 }
        }
        transition={{
          duration: reduceMotion ? 0.2 : 0.3,
          times: [0, 0.5, 1],
          ease: appleEase,
        }}
      />
    </motion.div>
  );
}
