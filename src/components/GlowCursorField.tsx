import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { GlowCursor } from "@/components/GlowCursor";

export function GlowCursorField({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: fine)");

    function syncPointerSupport() {
      setHasFinePointer(pointerQuery.matches);
    }

    syncPointerSupport();
    pointerQuery.addEventListener("change", syncPointerSupport);

    return () => {
      pointerQuery.removeEventListener("change", syncPointerSupport);
    };
  }, []);

  if (!active || reduceMotion || !hasFinePointer) {
    return null;
  }

  return (
    <div
      data-glow-cursor-field="true"
      className="pointer-events-none fixed inset-0 z-[45]"
    >
      <GlowCursor
        trackDocument
        color="#bf4256"
        secondaryColor="#dfa9d1"
        trailLength={22}
        trailWidth={4.5}
        trailTaper={0.72}
        followSpeed={0.18}
        glowIntensity={1.45}
        glowSpread={0.78}
        hotspot={0.58}
        brightness={1.08}
        opacity={0.9}
        pulseSpeed={1.1}
        noiseStrength={0.035}
        idleFade
        idleTimeout={700}
        fadeDuration={900}
        blendMode="screen"
        maxDevicePixelRatio={1}
        className="h-full w-full"
      />
    </div>
  );
}
