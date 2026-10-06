import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import { EntryScreen } from "@/components/EntryScreen";
import { GlowCursorField } from "@/components/GlowCursorField";
import { Home } from "@/components/Home";
import { TransitionOverlay } from "@/components/TransitionOverlay";
import type { IntroPhase } from "@/types/intro";

const INTRO_STORAGE_KEY = "ai-specialist-intro-played";

function readIntroState() {
  if (typeof window === "undefined") return false;

  try {
    return window.sessionStorage.getItem(INTRO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function App() {
  const reduceMotion = useReducedMotion();
  const [hasEntered, setHasEntered] = useState(readIntroState);
  const [entryVisible, setEntryVisible] = useState(() => !readIntroState());
  const [phase, setPhase] = useState<IntroPhase>("idle");
  const [transitionVisible, setTransitionVisible] = useState(false);
  const initialOverflowRef = useRef<string | null>(null);
  const isTransitioning =
    transitionVisible && phase !== "done" && phase !== "idle";

  const beginTransition = useCallback(() => {
    if (hasEntered || phase !== "idle") return;

    try {
      window.sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      // The intro still works when storage is unavailable.
    }

    setTransitionVisible(true);
    setPhase(reduceMotion ? "reduced" : "a");
  }, [hasEntered, phase, reduceMotion]);

  useEffect(() => {
    if (hasEntered || phase !== "idle") return;

    function handleFullscreenChange() {
      const webkitDocument = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      const isFullscreen = Boolean(
        document.fullscreenElement ||
          webkitDocument.webkitFullscreenElement,
      );

      if (isFullscreen) beginTransition();
    }

    function handleKeyDown() {
      beginTransition();
    }

    function handleWheel() {
      beginTransition();
    }

    function handleTouchMove() {
      beginTransition();
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );
    document.addEventListener(
      "webkitfullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [beginTransition, hasEntered, phase]);

  useEffect(() => {
    if (phase === "a") {
      const blackoutTimer = window.setTimeout(() => {
        setPhase("b");
        setEntryVisible(false);
      }, 500);

      return () => {
        window.clearTimeout(blackoutTimer);
      };
    }

    if (phase === "b") {
      const revealTimer = window.setTimeout(() => {
        setPhase("c");
        setHasEntered(true);
      }, 400);

      return () => window.clearTimeout(revealTimer);
    }

    if (phase === "c") {
      const finishTimer = window.setTimeout(() => {
        setPhase("done");
        setTransitionVisible(false);
      }, 750);

      return () => window.clearTimeout(finishTimer);
    }

    if (phase === "reduced") {
      const revealTimer = window.setTimeout(() => {
        setHasEntered(true);
        setEntryVisible(false);
      }, 50);
      const finishTimer = window.setTimeout(() => {
        setPhase("done");
        setTransitionVisible(false);
      }, 120);

      return () => {
        window.clearTimeout(revealTimer);
        window.clearTimeout(finishTimer);
      };
    }

    return undefined;
  }, [phase]);

  useEffect(() => {
    if (initialOverflowRef.current === null) {
      initialOverflowRef.current = document.body.style.overflow;
    }

    if (isTransitioning || !hasEntered) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = initialOverflowRef.current || "";
    }

    return () => {
      if (isTransitioning || !hasEntered) {
        document.body.style.overflow = initialOverflowRef.current || "";
      }
    };
  }, [hasEntered, isTransitioning]);

  return (
    <>
      <Home ready={hasEntered} />
      <GlowCursorField active={hasEntered && !isTransitioning} />

      <AnimatePresence mode="wait">
        {entryVisible ? (
          <EntryScreen
            key="entry"
            isExiting={phase !== "idle"}
            onEnter={beginTransition}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {transitionVisible ? (
          <TransitionOverlay key="transition" phase={phase} />
        ) : null}
      </AnimatePresence>
    </>
  );
}
