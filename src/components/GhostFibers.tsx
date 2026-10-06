import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

type GhostFibersProps = {
  lineColor?: string;
  glowColor?: string;
  speed?: number;
  scale?: number;
  rotation?: number;
  rotationSpeed?: number;
  layers?: number;
  waveAmplitude?: number;
  waveFrequency?: number;
  waveSpeed?: number;
  layerSpeed?: number;
  twist?: number;
  twistFrequency?: number;
  twistSpeed?: number;
  lineFrequency?: number;
  lineSpacing?: number;
  lineSharpness?: number;
  glowFalloff?: number;
  glowIntensity?: number;
  brightness?: number;
  blueBoost?: number;
  vignette?: number;
  grain?: number;
  lightMode?: boolean;
  dpr?: number;
  fps?: number;
  paused?: boolean;
  className?: string;
};

type FiberUniform = {
  value: number | Float32Array;
};

type FiberContext = {
  program: Program;
  render: () => void;
  setFps: (value: number) => void;
  setPaused: (value: boolean) => void;
};

function hexToRgb(hex: string) {
  const value = hex.trim().replace(/^#/, "");
  const normalized =
    value.length === 3
      ? value.replace(/./g, (channel) => channel + channel)
      : value;
  const match = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
    normalized,
  );

  if (!match) return new Float32Array([1, 1, 1]);

  return new Float32Array([
    Number.parseInt(match[1], 16) / 255,
    Number.parseInt(match[2], 16) / 255,
    Number.parseInt(match[3], 16) / 255,
  ]);
}

function uniform(program: Program, name: string) {
  return (program.uniforms as Record<string, FiberUniform>)[name];
}

function setNumber(program: Program, name: string, value: number) {
  uniform(program, name).value = value;
}

function setColor(program: Program, name: string, color: string) {
  const target = uniform(program, name).value;
  if (!(target instanceof Float32Array)) return;

  const next = hexToRgb(color);
  target[0] = next[0];
  target[1] = next[1];
  target[2] = next[2];
}

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uRotationSpeed;
uniform float uLayers;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uWaveSpeed;
uniform float uLayerSpeed;
uniform float uTwist;
uniform float uTwistFrequency;
uniform float uTwistSpeed;
uniform float uLineFrequency;
uniform float uLineSpacing;
uniform float uLineSharpness;
uniform float uGlowFalloff;
uniform float uGlowIntensity;
uniform float uBrightness;
uniform float uBlueBoost;
uniform float uVignette;
uniform float uGrain;
uniform float uLightMode;
uniform vec3 uLineColor;
uniform vec3 uGlowColor;
out vec4 fragColor;

#define MAX_LAYERS 10

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

float grainHash(vec2 point) {
  point = floor(point);
  float hash = 52.9829189 * fract(dot(point, vec2(0.065, 0.005)));
  return fract(hash);
}

float layeredGrain(vec2 fragmentPixel) {
  vec2 point = mod(
    fragmentPixel + vec2(uTime * 30.0, -uTime * 21.0),
    1024.0
  );
  vec2 rotated = mat2(0.8, -0.5, 0.5, 0.8) * point;
  float grain = 0.0;
  grain += 0.40 * grainHash(rotated);
  grain += 0.25 * grainHash(rotated * 2.0 + 17.0);
  grain += 0.20 * grainHash(rotated * 4.0 + 47.0);
  grain += 0.10 * grainHash(rotated * 8.0 + 113.0);
  grain += 0.05 * grainHash(rotated * 16.0 + 191.0);
  return grain;
}

void main() {
  vec2 resolution = max(uResolution, vec2(1.0));
  vec2 uv = (2.0 * gl_FragCoord.xy - resolution) / resolution.y;
  float time = uTime * uSpeed;
  vec3 backdrop = mix(
    vec3(0.070588, 0.058824, 0.090196),
    vec3(1.0),
    step(0.5, uLightMode)
  );
  vec3 centerTone = max(
    uLineColor * 0.85567 - uGlowColor * 0.06186,
    vec3(0.0)
  );
  vec3 cloudTone = uLineColor * 0.19588 + uGlowColor * 0.2268;
  vec2 p = uv;
  p /= max(uScale, 0.05);
  p = rotate2d(radians(uRotation) + time * uRotationSpeed) * p;

  vec3 color = vec3(0.0);
  float fiberField = 0.0;

  for (int index = 0; index < MAX_LAYERS; index++) {
    float fi = float(index) + 1.0;
    if (fi > uLayers) break;

    p += uWaveAmplitude * sin(
      p.yx * fi * uWaveFrequency +
      time * (uWaveSpeed + fi * uLayerSpeed)
    );

    float radius = length(p);
    float polarAngle = atan(p.y, p.x);
    polarAngle += sin(
      radius * uTwistFrequency - time * uTwistSpeed + fi
    ) * uTwist;
    p = vec2(cos(polarAngle), sin(polarAngle)) * radius;

    float lines = abs(sin(
      p.x * (uLineFrequency + fi * uLineSpacing) +
      sin(p.y * 3.0 + time)
    ));
    lines = pow(max(0.0, 1.0 - lines), uLineSharpness);
    fiberField += lines / fi;
    color += uLineColor * lines / fi;

    float glow = exp(
      -uGlowFalloff * abs(sin(p.x * 3.0 + time + fi))
    );
    color += uGlowColor * glow * uGlowIntensity / (fi * 2.0);
  }

  float center = exp(-2.2 * dot(uv, uv));
  color += centerTone * center;

  float cloud = exp(
    -1.5 * length(
      uv + vec2(sin(time * 0.3) * 0.25, cos(time * 0.25) * 0.18)
    )
  );
  color += cloudTone * cloud;

  float vignette = 1.0 - smoothstep(0.35, 1.45, length(uv));
  color *= mix(1.0 - uVignette, 1.0, vignette);
  color = 1.0 - exp(-color * uBrightness);
  color.b *= uBlueBoost;

  vec3 outputColor;
  if (uLightMode > 0.5) {
    float edgeFade = mix(1.0 - uVignette, 1.0, vignette);
    float fibers = pow(
      smoothstep(0.12, 1.05, fiberField) * edgeFade,
      1.5
    );
    float atmosphere = (center * 0.025 + cloud * 0.015) * edgeFade;
    vec3 fiberInk = mix(backdrop, uLineColor, 0.52);
    vec3 airColor = mix(backdrop, uGlowColor, 0.16);
    outputColor = mix(backdrop, airColor, atmosphere);
    outputColor = mix(outputColor, fiberInk, fibers * 0.3);
  } else {
    outputColor = backdrop + color;
  }

  float noise = (layeredGrain(gl_FragCoord.xy) - 0.5) * uGrain;
  outputColor = clamp(outputColor + noise, 0.0, 1.0);
  fragColor = vec4(outputColor, 1.0);
}`;

export function GhostFibers({
  lineColor = "#140E35",
  glowColor = "#3437A0",
  speed = 0.2,
  scale = 2,
  rotation = 0,
  rotationSpeed = 0.25,
  layers = 4,
  waveAmplitude = 0.015,
  waveFrequency = 3,
  waveSpeed = 0.15,
  layerSpeed = 0.08,
  twist = 0.1,
  twistFrequency = 5,
  twistSpeed = 1.2,
  lineFrequency = 5,
  lineSpacing = 2,
  lineSharpness = 16,
  glowFalloff = 10,
  glowIntensity = 1.6,
  brightness = 2,
  blueBoost = 1.25,
  vignette = 0.8,
  grain = 0.05,
  lightMode = false,
  dpr = 1,
  fps = 60,
  paused = false,
  className = "",
}: GhostFibersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<FiberContext | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: false,
        antialias: false,
        dpr: Math.min(Math.max(dpr, 0.5), 2),
      });
    } catch {
      return undefined;
    }

    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uResolution: { value: new Float32Array([1, 1]) },
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uScale: { value: scale },
        uRotation: { value: rotation },
        uRotationSpeed: { value: rotationSpeed },
        uLayers: { value: layers },
        uWaveAmplitude: { value: waveAmplitude },
        uWaveFrequency: { value: waveFrequency },
        uWaveSpeed: { value: waveSpeed },
        uLayerSpeed: { value: layerSpeed },
        uTwist: { value: twist },
        uTwistFrequency: { value: twistFrequency },
        uTwistSpeed: { value: twistSpeed },
        uLineFrequency: { value: lineFrequency },
        uLineSpacing: { value: lineSpacing },
        uLineSharpness: { value: lineSharpness },
        uGlowFalloff: { value: glowFalloff },
        uGlowIntensity: { value: glowIntensity },
        uBrightness: { value: brightness },
        uBlueBoost: { value: blueBoost },
        uVignette: { value: vignette },
        uGrain: { value: grain },
        uLightMode: { value: lightMode ? 1 : 0 },
        uLineColor: { value: hexToRgb(lineColor) },
        uGlowColor: { value: hexToRgb(glowColor) },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let frameId = 0;
    let elapsed = 0;
    let previousTime = performance.now();
    let lastRenderTime = 0;
    let frameRate = Math.min(Math.max(fps, 1), 120);
    let isPaused = paused;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    let isScrolling = false;
    let scrollTimer: number | null = null;

    const render = () => renderer.render({ scene: mesh });
    const stop = () => {
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
      frameId = 0;
    };
    const canAnimate = () =>
      isVisible &&
      isPageVisible &&
      !isPaused &&
      !isScrolling &&
      !reducedMotion.matches;
    const loop = (now: number) => {
      frameId = 0;
      if (!canAnimate()) return;

      const delta = Math.min((now - previousTime) / 1000, 0.1);
      previousTime = now;
      elapsed += delta;

      if (now - lastRenderTime >= 1000 / frameRate - 0.5) {
        setNumber(program, "uTime", elapsed);
        render();
        lastRenderTime = now;
      }

      frameId = window.requestAnimationFrame(loop);
    };
    const start = () => {
      if (!canAnimate() || frameId !== 0) return;
      previousTime = performance.now();
      frameId = window.requestAnimationFrame(loop);
    };
    const setSize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(
        Math.max(1, Math.floor(rect.width)),
        Math.max(1, Math.floor(rect.height)),
      );
      const resolution = uniform(program, "uResolution")
        .value as Float32Array;
      resolution[0] = gl.drawingBufferWidth;
      resolution[1] = gl.drawingBufferHeight;
      render();
    };
    const handleVisibility = () => {
      isPageVisible = !document.hidden;
      if (canAnimate()) start();
      else stop();
    };
    const handleReducedMotion = () => {
      if (canAnimate()) start();
      else {
        stop();
        render();
      }
    };
    const handleScroll = () => {
      isScrolling = true;
      stop();
      if (scrollTimer !== null) {
        window.clearTimeout(scrollTimer);
      }
      scrollTimer = window.setTimeout(() => {
        isScrolling = false;
        scrollTimer = null;
        start();
      }, 140);
    };

    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (canAnimate()) start();
        else stop();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(container);
    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotion.addEventListener("change", handleReducedMotion);
    window.addEventListener("scroll", handleScroll, { passive: true });

    contextRef.current = {
      program,
      render,
      setFps(value) {
        frameRate = Math.min(Math.max(value, 1), 120);
      },
      setPaused(value) {
        isPaused = value;
        if (canAnimate()) start();
        else {
          stop();
          render();
        }
      },
    };

    setSize();
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotion.removeEventListener("change", handleReducedMotion);
      window.removeEventListener("scroll", handleScroll);
      contextRef.current = null;
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (scrollTimer !== null) {
        window.clearTimeout(scrollTimer);
      }
    };
  }, [dpr]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;

    const { program } = context;
    setColor(program, "uLineColor", lineColor);
    setColor(program, "uGlowColor", glowColor);
    setNumber(program, "uSpeed", speed);
    setNumber(program, "uScale", scale);
    setNumber(program, "uRotation", rotation);
    setNumber(program, "uRotationSpeed", rotationSpeed);
    setNumber(
      program,
      "uLayers",
      Math.min(Math.max(Math.round(layers), 1), 10),
    );
    setNumber(program, "uWaveAmplitude", waveAmplitude);
    setNumber(program, "uWaveFrequency", waveFrequency);
    setNumber(program, "uWaveSpeed", waveSpeed);
    setNumber(program, "uLayerSpeed", layerSpeed);
    setNumber(program, "uTwist", twist);
    setNumber(program, "uTwistFrequency", twistFrequency);
    setNumber(program, "uTwistSpeed", twistSpeed);
    setNumber(program, "uLineFrequency", lineFrequency);
    setNumber(program, "uLineSpacing", lineSpacing);
    setNumber(program, "uLineSharpness", lineSharpness);
    setNumber(program, "uGlowFalloff", glowFalloff);
    setNumber(program, "uGlowIntensity", glowIntensity);
    setNumber(program, "uBrightness", brightness);
    setNumber(program, "uBlueBoost", blueBoost);
    setNumber(program, "uVignette", vignette);
    setNumber(program, "uGrain", grain);
    setNumber(program, "uLightMode", lightMode ? 1 : 0);
    context.setFps(fps);
    context.setPaused(paused);
    context.render();
  }, [
    blueBoost,
    brightness,
    dpr,
    fps,
    glowColor,
    glowFalloff,
    glowIntensity,
    grain,
    layerSpeed,
    layers,
    lightMode,
    lineColor,
    lineFrequency,
    lineSharpness,
    lineSpacing,
    paused,
    rotation,
    rotationSpeed,
    scale,
    speed,
    twist,
    twistFrequency,
    twistSpeed,
    vignette,
    waveAmplitude,
    waveFrequency,
    waveSpeed,
  ]);

  return (
    <div
      ref={containerRef}
      data-ghost-fibers="true"
      className={`relative h-full w-full overflow-hidden ${className}`.trim()}
    />
  );
}
