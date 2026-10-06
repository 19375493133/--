import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Check,
  Code2,
  Copy,
  Gauge,
  Images,
  Mail,
  Menu,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import VanillaTilt from "vanilla-tilt";
import { AnchoredLanyard } from "@/components/AnchoredLanyard";
import { BorderGlow } from "@/components/BorderGlow";
import CardSwap, { Card } from "@/components/CardSwap";
import { GhostFibers } from "@/components/GhostFibers";
import { Magnetic } from "@/components/Magnetic";
import { ParticleText } from "@/components/ParticleText";
import { RevealText } from "@/components/RevealText";
import RubberSegment from "@/components/RubberSegment";
import { StrokeText } from "@/components/StrokeText";
import { cn } from "@/lib/utils";

type HomeProps = {
  ready: boolean;
};

type Capability = {
  title: string;
  copy: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

type Project = {
  title: string;
  eyebrow: string;
  summary: string;
  outcome: string;
  image: string;
  tags: string[];
};

type Stat = {
  value?: number;
  suffix?: string;
  display?: string;
  label: string;
};

type GalleryOrigin = {
  x: number;
  y: number;
  radius: number;
};

const navItems = [
  { label: "能力", href: "#capabilities" },
  { label: "数据", href: "#numbers" },
  { label: "项目", href: "#work" },
  { label: "联系", href: "#contact" },
];
const navSegments = navItems.map((item) => ({
  value: item.href,
  label: item.label,
}));

function resolveActiveNavSection() {
  if (typeof window === "undefined") return navItems[0].href;

  const probe = window.scrollY + window.innerHeight * 0.42;
  let active = navItems[0].href;

  navItems.forEach((item) => {
    const section = document.querySelector<HTMLElement>(item.href);
    if (section && section.offsetTop <= probe) {
      active = item.href;
    }
  });

  return active;
}

const capabilities: Capability[] = [
  {
    title: "AI 产品战略",
    copy: "把开放的模型能力，收束成清晰的产品承诺和可落地的采用路径。",
    icon: BrainCircuit,
  },
  {
    title: "界面工程",
    copy: "构建快速、稳定、有韧性的界面，让每一种状态、交互和边界情况都有明确答案。",
    icon: Code2,
  },
  {
    title: "动效系统",
    copy: "用运动解释层级和反馈，而不是给缺乏清晰度的界面做装饰。",
    icon: Sparkles,
  },
  {
    title: "工作流设计",
    copy: "梳理真实工作，消除重复劳动，并把人的审核设计进每一个自动决策。",
    icon: Workflow,
  },
];

const stats: Stat[] = [
  { value: 5, suffix: "+", label: "AI 产品已交付" },
  { value: 42, suffix: "%", label: "平均节省工作流时间" },
  { display: "8个月", label: "产品与工程经验" },
];

const projects: Project[] = [
  {
    title: "信号系统",
    eyebrow: "研究智能",
    summary:
      "一个以证据为先的工作空间，把零散的市场研究整理成可信的决策简报。",
    outcome: "信息整合提速 3.4 倍",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    tags: ["大语言模型", "产品设计", "React"],
  },
  {
    title: "北极星",
    eyebrow: "运营副驾",
    summary:
      "面向高风险运营的人机协作副驾，以置信度和可追溯性为核心设计。",
    outcome: "人工审核减少 42%",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    tags: ["智能体界面", "数据", "系统设计"],
  },
  {
    title: "现场笔记",
    eyebrow: "知识捕捉",
    summary:
      "安静的记录层，让专家对话变得可搜索，同时不打断现场工作。",
    outcome: "周活跃采用率 89%",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    tags: ["移动端", "动效", "研究"],
  },
];

const signalSamples = [
  { label: "01", value: 982 },
  { label: "02", value: 1164 },
  { label: "03", value: 1048 },
  { label: "04", value: 1436 },
  { label: "05", value: 1328 },
  { label: "06", value: 1842 },
  { label: "07", value: 1966 },
  { label: "08", value: 2117 },
];

const signalChart = {
  width: 2200,
  height: 520,
  paddingX: 84,
  paddingY: 70,
  sidePadding: 0,
};

const particles = [
  { left: "8%", top: "22%", size: 2, delay: 0.2 },
  { left: "16%", top: "68%", size: 3, delay: 1.4 },
  { left: "27%", top: "34%", size: 2, delay: 0.8 },
  { left: "38%", top: "78%", size: 2, delay: 2.1 },
  { left: "51%", top: "18%", size: 3, delay: 1.1 },
  { left: "61%", top: "58%", size: 2, delay: 0.4 },
  { left: "72%", top: "29%", size: 2, delay: 1.8 },
  { left: "84%", top: "73%", size: 3, delay: 0.9 },
  { left: "91%", top: "42%", size: 2, delay: 2.4 },
];

const appleEase = [0.16, 1, 0.3, 1] as const;

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-10 flex items-center gap-4 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[#86868B]">
      <span className="h-1.5 w-1.5 bg-[#E10600]" />
      <span>{children}</span>
    </div>
  );
}

function GlassPortrait() {
  const reduceMotion = useReducedMotion();
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = tiltRef.current;
    if (
      !element ||
      reduceMotion ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return undefined;
    }

    const tilt = new VanillaTilt(element, {
      max: 4,
      speed: 650,
      perspective: 1000,
      scale: 1.005,
      gyroscope: false,
      reset: true,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    });

    return () => tilt.destroy();
  }, [reduceMotion]);

  useEffect(() => {
    const element = tiltRef.current;
    if (
      !element ||
      reduceMotion ||
      !window.matchMedia("(pointer: coarse)").matches
    ) {
      return undefined;
    }

    let activePointer: number | null = null;
    let frame: number | null = null;
    let nextX = 0;
    let nextY = 0;
    let bounds = element.getBoundingClientRect();

    const paint = () => {
      frame = null;
      const rotateY = nextX * 8;
      const rotateX = nextY * -8;
      element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.005, 1.005, 1.005)`;
    };

    const update = (clientX: number, clientY: number) => {
      nextX = Math.min(
        0.5,
        Math.max(-0.5, (clientX - bounds.left) / bounds.width - 0.5),
      );
      nextY = Math.min(
        0.5,
        Math.max(-0.5, (clientY - bounds.top) / bounds.height - 0.5),
      );
      if (frame === null) {
        frame = window.requestAnimationFrame(paint);
      }
    };

    const reset = () => {
      activePointer = null;
      element.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      activePointer = event.pointerId;
      bounds = element.getBoundingClientRect();
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // Ignore unsupported pointer capture implementations.
      }
      update(event.clientX, event.clientY);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return;
      update(event.clientX, event.clientY);
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return;
      reset();
    };

    element.addEventListener("pointerdown", handlePointerDown);
    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerup", handlePointerEnd);
    element.addEventListener("pointercancel", handlePointerEnd);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerup", handlePointerEnd);
      element.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [reduceMotion]);

  return (
    <motion.figure
      className="relative aspect-[390/567] w-80 max-w-full shrink-0 rounded-[8px] sm:w-[26rem] lg:w-[28rem]"
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      whileHover={reduceMotion ? undefined : { y: -4, scale: 1.015 }}
      transition={{ duration: 0.75, ease: appleEase }}
    >
      <div
        ref={tiltRef}
        data-portrait-tilt="true"
        className="relative h-full w-full touch-pan-y rounded-[8px] p-1 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] [transform-style:preserve-3d] sm:p-[5px]"
      >
        <span
          aria-hidden="true"
          className="absolute -inset-4 rounded-[8px] bg-[radial-gradient(circle,rgba(255,255,255,0.14),transparent_67%)] blur-md"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-[8px] border border-white/45 bg-[linear-gradient(145deg,rgba(255,255,255,0.3),rgba(255,255,255,0.08)_42%,rgba(255,255,255,0.02)_72%)] shadow-[0_22px_55px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.92),inset_0_-1px_0_rgba(255,255,255,0.18),0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-xl"
        />
        <span className="absolute inset-1 block overflow-hidden rounded-[5px] border border-white/35 bg-white/[0.04] sm:inset-[5px]">
          <img
            src="/portrait.jpg"
            alt="个人头像"
            className="h-full w-full object-cover object-[50%_22%]"
            loading="lazy"
            decoding="async"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_32%_18%,rgba(255,255,255,0.2),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.12)_0%,transparent_28%,transparent_68%,rgba(255,255,255,0.16)_100%)] mix-blend-screen"
          />
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 bottom-px h-px bg-white/70 blur-[1px]"
        />
      </div>
    </motion.figure>
  );
}

function Counter({
  value,
  suffix,
}: {
  value: number;
  suffix: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.7 });
  const reduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (!inView || reduceMotion) return;

    const controls = animate(0, value, {
      duration: 1.4,
      ease: appleEase,
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, reduceMotion, value]);

  return (
    <span ref={ref}>
      {displayValue}
      {suffix}
    </span>
  );
}

function ParticleField({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {particles.map((particle, index) => (
        <motion.span
          key={`${particle.left}-${particle.top}`}
          className="absolute bg-[#FF2D2D]"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={
            active
              ? reduceMotion
                ? { opacity: 0.45, scale: 1 }
                : {
                    opacity: [0.18, 0.8, 0.18],
                    scale: [0.7, 1.25, 0.7],
                    y: [0, -20, 0],
                  }
              : { opacity: 0, scale: 0 }
          }
          transition={{
            duration: reduceMotion ? 0.2 : 4.8 + index * 0.24,
            delay: reduceMotion ? 0 : particle.delay,
            repeat: reduceMotion ? 0 : Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function ProjectCard({
  project,
  index,
  visible,
}: {
  project: Project;
  index: number;
  visible: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className={cn(
        "group relative min-h-[31rem] overflow-hidden border border-white/10 bg-[#111111]",
        index === 0 ? "lg:col-span-7" : "lg:col-span-5",
        index === 2 && "lg:col-span-12 lg:min-h-[28rem]",
      )}
      initial={false}
      animate={
        visible
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 32, filter: "blur(10px)" }
      }
      transition={{
        duration: reduceMotion ? 0.2 : 0.68,
        delay:
          reduceMotion || !visible ? 0 : 0.58 + index * (4 / 60),
        ease: appleEase,
      }}
      aria-hidden={!visible}
      inert={!visible}
    >
      <motion.img
        src={project.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-50 saturate-50"
        loading="lazy"
        decoding="async"
        whileHover={reduceMotion ? undefined : { scale: 1.035 }}
        transition={{ duration: 0.9, ease: appleEase }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.08)_0%,rgba(10,10,10,0.42)_45%,#0A0A0A_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-[#E10600] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10 flex min-h-[31rem] flex-col justify-end p-6 sm:p-8">
        <div className="mb-auto flex items-start justify-between">
          <span className="border border-white/15 bg-black/30 px-3 py-1 text-[0.62rem] uppercase tracking-[0.2em] text-[#F5F5F7] backdrop-blur">
            {project.eyebrow}
          </span>
          <span className="grid size-10 place-items-center border border-white/15 bg-black/30 text-[#F5F5F7] backdrop-blur transition-colors duration-300 group-hover:border-[#FF2D2D] group-hover:text-[#FF2D2D]">
            <ArrowUpRight className="size-4" strokeWidth={1.7} />
          </span>
        </div>

        <h3 className="text-3xl font-semibold text-[#F5F5F7] sm:text-4xl">
          {project.title}
        </h3>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[#86868B] sm:text-base">
          {project.summary}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-5">
          <span className="text-sm font-semibold text-[#FF2D2D]">
            {project.outcome}
          </span>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-[0.65rem] uppercase tracking-[0.16em] text-[#86868B]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ProjectGallerySwitch({
  open,
  onToggle,
  buttonRef,
}: {
  open: boolean;
  onToggle: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <button
      ref={buttonRef}
      type="button"
      role="switch"
      aria-checked={open}
      aria-label={open ? "收起全部项目图片" : "打开全部项目图片"}
      onClick={onToggle}
      className="inline-flex min-w-52 items-center justify-between gap-8 border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors duration-300 hover:border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D2D] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0A0A0A]"
    >
      <span className="flex items-center gap-3">
        <Images className="size-4 text-[#FF2D2D]" strokeWidth={1.7} />
        <span className="text-sm font-semibold text-[#F5F5F7]">全部图片</span>
      </span>
      <motion.span
        aria-hidden="true"
        className="relative h-7 w-12 rounded-full border border-white/15"
        animate={{
          backgroundColor: open ? "rgba(225,6,0,0.38)" : "rgba(255,255,255,0.06)",
        }}
        transition={{
          duration: reduceMotion ? 0.2 : 0.35,
          ease: appleEase,
        }}
      >
        <motion.span
          className="absolute left-1 top-1 size-5 rounded-full bg-[#F5F5F7] shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
          animate={{ x: open ? 20 : 0 }}
          transition={{
            duration: reduceMotion ? 0.2 : 0.35,
            ease: appleEase,
          }}
        />
      </motion.span>
    </button>
  );
}

function Odometer({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const digits = Math.round(value).toString().padStart(4, "0").split("");

  return (
    <span
      data-project-signal-value={value}
      className="flex items-center tabular-nums"
      aria-label={value.toString()}
    >
      {digits.map((digit, index) => (
        <span
          key={index}
          className="relative h-[1em] w-[0.66em] overflow-hidden text-center"
        >
          <motion.span
            className="absolute inset-x-0 top-0 flex flex-col"
            initial={false}
            animate={{ y: `-${Number(digit) * 10}%` }}
            transition={
              reduceMotion
                ? { duration: 0.2, ease: appleEase }
                : {
                    type: "spring",
                    stiffness: 190,
                    damping: 24,
                    mass: 0.78,
                  }
            }
          >
            {Array.from({ length: 10 }, (_, number) => (
              <span
                key={number}
                className="flex h-[1em] items-center justify-center"
              >
                {number}
              </span>
            ))}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function ProjectSignalChart({ collapsed }: { collapsed: boolean }) {
  const reduceMotion = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const selectionTargetRef = useRef<number | null>(null);
  const dragStateRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
  });
  const [dragging, setDragging] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(
    signalSamples.length - 1,
  );

  const values = signalSamples.map((sample) => sample.value);
  const minValue = Math.min(...values) - 160;
  const maxValue = Math.max(...values) + 180;
  const chartWidth = signalChart.width + signalChart.sidePadding * 2;
  const pointPositions = signalSamples.map((sample, index) => {
    const usableWidth = signalChart.width - signalChart.paddingX * 2;
    const usableHeight = signalChart.height - signalChart.paddingY * 2;
    const x =
      signalChart.sidePadding +
      signalChart.paddingX +
      (index / (signalSamples.length - 1)) * usableWidth;
    const y =
      signalChart.paddingY +
      (1 - (sample.value - minValue) / (maxValue - minValue)) *
        usableHeight;

    return { ...sample, x, y };
  });
  const selectedPoint = pointPositions[selectedIndex];
  const linePath = pointPositions
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
    )
    .join(" ");
  const activeLinePath = pointPositions
    .slice(0, selectedIndex + 1)
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
    )
    .join(" ");
  const areaPath = `${linePath} L ${pointPositions.at(-1)?.x ?? 0} ${
    signalChart.height - signalChart.paddingY
  } L ${pointPositions[0].x} ${
    signalChart.height - signalChart.paddingY
  } Z`;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      const lastPoint = pointPositions.at(-1);
      if (!scroller || !lastPoint) return;

      scroller.scrollTo({
        left: Math.max(
          0,
          Math.min(
            lastPoint.x - scroller.clientWidth / 2,
            scroller.scrollWidth - scroller.clientWidth,
          ),
        ),
        behavior: "auto",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  function selectPoint(index: number) {
    const scroller = scrollerRef.current;
    const point = pointPositions[index];
    if (!scroller || !point) return;

    selectionTargetRef.current = index;
    setSelectedIndex(index);
    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    scroller.scrollTo({
      left: Math.max(
        0,
        Math.min(point.x - scroller.clientWidth / 2, maxScroll),
      ),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  function handleScroll() {
    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      if (!scroller) {
        frameRef.current = null;
        return;
      }

      if (selectionTargetRef.current !== null) {
        const targetIndex = selectionTargetRef.current;
        setSelectedIndex((current) =>
          current === targetIndex ? current : targetIndex,
        );
        frameRef.current = null;
        return;
      }

      const center = scroller.scrollLeft + scroller.clientWidth / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      pointPositions.forEach((point, index) => {
        const distance = Math.abs(point.x - center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      setSelectedIndex((current) =>
        current === nearestIndex ? current : nearestIndex,
      );
      frameRef.current = null;
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    selectionTargetRef.current = null;

    if (
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      (event.target as HTMLElement).closest("button")
    ) {
      return;
    }

    const scroller = scrollerRef.current;
    if (!scroller) return;

    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: scroller.scrollLeft,
    };
    scroller.setPointerCapture(event.pointerId);
    setDragging(true);
    event.preventDefault();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    const dragState = dragStateRef.current;
    if (!scroller || !dragState.active) return;

    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
    const nextScrollLeft =
      dragState.startScrollLeft - (event.clientX - dragState.startX);

    scroller.scrollLeft = Math.max(
      0,
      Math.min(nextScrollLeft, maxScroll),
    );
    event.preventDefault();
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;
    const dragState = dragStateRef.current;
    if (!scroller || !dragState.active) return;

    dragState.active = false;
    setDragging(false);

    if (scroller.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <motion.div
      data-project-signal-chart="true"
      aria-hidden={collapsed}
      inert={collapsed}
      className={cn(
        "absolute inset-0 z-0 overflow-hidden border border-white/10 bg-[#0A0A0A]",
        collapsed && "pointer-events-none",
      )}
      initial={false}
      animate={
        reduceMotion
          ? { opacity: collapsed ? 0 : 1 }
          : collapsed
            ? {
                opacity: [1, 0.96, 0.42, 0],
                scaleX: [1, 1.025, 0.52, 0.08],
                scaleY: [1, 0.86, 0.24, 0.06],
                filter: [
                  "blur(0px)",
                  "blur(1px)",
                  "blur(8px)",
                  "blur(14px)",
                ],
                borderRadius: [0, 0, 28, 999],
              }
            : {
                opacity: 1,
                scaleX: 1,
                scaleY: 1,
                filter: "blur(0px)",
                borderRadius: 0,
              }
      }
      transition={{
        ...(reduceMotion
          ? { duration: 0.2, ease: appleEase }
          : collapsed
            ? {
                duration: 0.68,
                times: [0, 0.18, 0.52, 1],
                ease: appleEase,
              }
            : {
                scaleX: {
                  type: "spring",
                  stiffness: 220,
                  damping: 15,
                  mass: 0.85,
                },
                scaleY: {
                  type: "spring",
                  stiffness: 220,
                  damping: 15,
                  mass: 0.85,
                },
                opacity: { duration: 0.32, ease: appleEase },
                filter: { duration: 0.36, ease: appleEase },
                borderRadius: { duration: 0.42, ease: appleEase },
              }),
      }}
      style={{
        transformOrigin: "50% 50%",
        willChange: "transform, opacity, filter, border-radius",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_8%,rgba(225,6,0,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.025),transparent_36%)]"
      />
      <div className="grid-field absolute inset-0 opacity-[0.08]" />

      <div className="relative flex h-full flex-col px-5 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-8 lg:px-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-[#86868B]">
              <span className="size-1.5 bg-[#E10600]" />
              实时样本
            </div>
            <div className="mt-4 flex items-end gap-4">
              <span className="text-[3.6rem] font-semibold leading-none tracking-[-0.045em] text-[#F5F5F7] sm:text-[4.8rem]">
                <Odometer value={selectedPoint.value} />
              </span>
              <span className="mb-1 text-lg font-semibold text-[#F5F5F7] sm:text-xl">
                百万
              </span>
              <span className="mb-2 text-xs font-medium text-[#86868B]">
                Tokens
              </span>
            </div>
          </div>

          <div className="hidden items-center gap-5 text-right sm:flex">
            <div>
              <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-[#86868B]">
                Position
              </span>
              <span className="mt-2 block text-sm font-semibold tabular-nums text-[#F5F5F7]">
                {String(selectedIndex + 1).padStart(2, "0")} /{" "}
                {String(signalSamples.length).padStart(2, "0")}
              </span>
            </div>
            <span className="h-10 w-px bg-white/10" />
            <div>
              <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-[#86868B]">
                Total
              </span>
              <span className="mt-2 block text-sm font-semibold tabular-nums text-[#FF2D2D]">
                2117 百万
              </span>
            </div>
          </div>
        </div>

        <div
          ref={scrollerRef}
          data-project-signal-scroller="true"
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onWheel={() => {
            selectionTargetRef.current = null;
          }}
          tabIndex={0}
          className={cn(
            "relative mt-5 min-h-0 flex-1 cursor-grab touch-pan-x overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D2D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] [&::-webkit-scrollbar]:hidden",
            dragging && "cursor-grabbing select-none",
          )}
        >
          <div
            className="relative h-full min-h-[22rem]"
            style={{ width: chartWidth }}
          >
            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              viewBox={`0 0 ${chartWidth} ${signalChart.height}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="signal-area"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#E10600" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#E10600" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                  id="signal-line"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor="#E10600" />
                  <stop offset="100%" stopColor="#FF2D2D" />
                </linearGradient>
              </defs>

              {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
                <line
                  key={ratio}
                  x1={signalChart.sidePadding + signalChart.paddingX}
                  x2={
                    signalChart.sidePadding +
                    signalChart.width -
                    signalChart.paddingX
                  }
                  y1={signalChart.paddingY + ratio * (signalChart.height - signalChart.paddingY * 2)}
                  y2={signalChart.paddingY + ratio * (signalChart.height - signalChart.paddingY * 2)}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              <path d={areaPath} fill="url(#signal-area)" />
              <path
                d={linePath}
                fill="none"
                stroke="rgba(245,245,247,0.22)"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={activeLinePath}
                fill="none"
                stroke="url(#signal-line)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <motion.div
              className="absolute inset-y-0 z-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#E10600] to-transparent"
              animate={{ left: selectedPoint.x }}
              transition={
                reduceMotion
                  ? { duration: 0.2, ease: appleEase }
                  : { type: "spring", stiffness: 210, damping: 25 }
              }
            />

            {pointPositions.map((point, index) => {
              const active = index === selectedIndex;

              return (
                <button
                  key={point.label}
                  type="button"
                  aria-label={`Tokens ${point.label}，数值 ${point.value}`}
                  aria-pressed={active}
                  onClick={() => selectPoint(index)}
                  className="absolute z-20 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D2D]"
                  style={{
                    left: `${point.x}px`,
                    top: `${(point.y / signalChart.height) * 100}%`,
                  }}
                >
                  <motion.span
                    className={cn(
                      "block rounded-full border",
                      active
                        ? "border-[#FF2D2D] bg-[#E10600] shadow-[0_0_28px_rgba(225,6,0,0.72)]"
                        : "border-white/30 bg-[#0A0A0A]",
                    )}
                    animate={{
                      width: active ? 16 : 9,
                      height: active ? 16 : 9,
                      opacity: active ? 1 : 0.7,
                    }}
                    transition={{
                      duration: reduceMotion ? 0.2 : 0.38,
                      ease: appleEase,
                    }}
                  />
                  <span
                    className={cn(
                      "absolute -top-8 text-[0.58rem] font-semibold tabular-nums transition-colors duration-300",
                      active ? "text-[#FF2D2D]" : "text-[#86868B]",
                    )}
                  >
                    {point.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Home({ ready }: HomeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState(() => {
    if (typeof window === "undefined") return navItems[0].href;
    return navItems.some(
      (item) => item.href === window.location.hash,
    )
      ? window.location.hash
      : navItems[0].href;
  });
  const [galleryOrigin, setGalleryOrigin] = useState<GalleryOrigin>({
    x: 0,
    y: 0,
    radius: 0,
  });
  const galleryTriggerRef = useRef<HTMLButtonElement>(null);
  const galleryGridRef = useRef<HTMLDivElement>(null);
  const navScrollLocked = useRef(false);
  const navUnlockTimer = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let frame: number | null = null;

    function syncNavState() {
      frame = null;
      const hero = document.getElementById("top");
      const threshold = hero
        ? hero.offsetTop + hero.offsetHeight - 96
        : window.innerHeight * 0.82;

      setNavScrolled(window.scrollY >= threshold);
    }

    function requestNavSync() {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(syncNavState);
    }

    syncNavState();
    window.addEventListener("scroll", requestNavSync, { passive: true });
    window.addEventListener("resize", requestNavSync);

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", requestNavSync);
      window.removeEventListener("resize", requestNavSync);
    };
  }, []);

  useEffect(() => {
    if (!ready) return undefined;

    const preloadTimer = window.setTimeout(() => {
      projects.forEach(({ image }) => {
        const preload = new Image();
        preload.decoding = "async";
        preload.src = image;
        void preload.decode().catch(() => undefined);
      });
    }, 800);

    return () => window.clearTimeout(preloadTimer);
  }, [ready]);

  useEffect(() => {
    let frame: number | null = null;

    function syncActiveSection() {
      frame = null;
      if (navScrollLocked.current) return;
      setActiveNav(resolveActiveNavSection());
    }

    function requestSync() {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(syncActiveSection);
    }

    syncActiveSection();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (navUnlockTimer.current !== null) {
        window.clearTimeout(navUnlockTimer.current);
      }
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
    };
  }, []);

  useEffect(() => {
    function syncGalleryOrigin() {
      const trigger = galleryTriggerRef.current;
      const grid = galleryGridRef.current;
      if (!trigger || !grid) return;

      const triggerRect = trigger.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      const x = triggerRect.left + triggerRect.width / 2 - gridRect.left;
      const y = triggerRect.top + triggerRect.height / 2 - gridRect.top;
      const radius =
        Math.ceil(
          Math.hypot(
            Math.max(x, gridRect.width - x),
            Math.max(y, gridRect.height - y),
          ),
        ) + 48;

      setGalleryOrigin({ x, y, radius });
    }

    syncGalleryOrigin();
    window.addEventListener("resize", syncGalleryOrigin);

    return () => {
      window.removeEventListener("resize", syncGalleryOrigin);
    };
  }, []);

  function toggleGallery() {
    setGalleryOpen((current) => !current);
  }

  function changeNavSection(nextValue: string) {
    setActiveNav(nextValue);
    setMenuOpen(false);
    const target = document.querySelector(nextValue);
    if (target) {
      navScrollLocked.current = true;
      if (navUnlockTimer.current !== null) {
        window.clearTimeout(navUnlockTimer.current);
      }
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
      window.history.replaceState(null, "", nextValue);
      navUnlockTimer.current = window.setTimeout(
        () => {
          navScrollLocked.current = false;
          navUnlockTimer.current = null;
          setActiveNav(resolveActiveNavSection());
        },
        reduceMotion ? 80 : 1000,
      );
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText("3495551608@qq.com");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = "mailto:3495551608@qq.com";
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] text-[#F5F5F7]">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[150] -translate-y-24 bg-[#E10600] px-4 py-2 text-sm font-medium text-white transition-transform focus:translate-y-0"
      >
        跳至主要内容
      </a>

      <motion.header
        data-nav-scrolled={navScrolled ? "true" : "false"}
        className="fixed inset-x-0 top-0 z-50 px-3 sm:px-5 lg:px-6"
        initial={{ y: -24, opacity: 0 }}
        animate={ready ? { y: 0, opacity: 1 } : { y: -24, opacity: 0 }}
        transition={{ duration: 0.65, delay: 0.08, ease: appleEase }}
      >
        <div
          data-nav-glass="true"
          className={cn(
            "mx-auto max-w-[90rem] overflow-hidden border transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            navScrolled
              ? "mt-3 rounded-[8px] border-white/10 bg-[#0A0A0A]/62 shadow-[0_18px_55px_rgba(0,0,0,0.44),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl backdrop-saturate-150"
              : "mt-0 rounded-none border-transparent bg-transparent shadow-none backdrop-blur-none",
          )}
        >
          <nav className="mx-auto flex h-16 max-w-[90rem] items-center justify-between px-5 sm:px-8 lg:px-12">
            <a
              href="#top"
              className="flex items-center gap-3 text-sm font-semibold text-[#F5F5F7]"
              aria-label="AI 产品专家主页"
            >
              <span className="grid size-7 place-items-center bg-[#E10600] text-[0.68rem] text-white">
                AI
              </span>
              <span className="hidden sm:inline">AI 产品专家</span>
            </a>

            <div className="hidden items-center gap-8 lg:flex">
              <RubberSegment
                items={navSegments}
                value={activeNav}
                onChange={changeNavSection}
                onItemClick={changeNavSection}
                trackColor="rgba(17,17,17,0.92)"
                thumbColor="#F5F5F7"
                textColor="#86868B"
                activeTextColor="#0A0A0A"
                size="sm"
                radius={8}
                inset={3}
                equalSlots
                stretch={92}
                squash={2}
                speed={1}
                glide={70}
                draggable
                aria-label="页面导航"
              />
            </div>

            <div className="flex items-center gap-3">
              <Magnetic className="hidden sm:block">
                <a
                  href="mailto:3495551608@qq.com"
                  className="inline-flex h-9 items-center gap-2 bg-[#F5F5F7] px-4 text-xs font-semibold text-[#0A0A0A] transition-colors duration-300 hover:bg-[#FF2D2D] hover:text-white"
                >
                  聊聊合作
                  <ArrowUpRight className="size-3.5" strokeWidth={1.8} />
                </a>
              </Magnetic>
              <button
                type="button"
                className="grid size-9 place-items-center border border-white/10 text-[#F5F5F7] lg:hidden"
                onClick={() => setMenuOpen((current) => !current)}
                aria-expanded={menuOpen}
                aria-label={menuOpen ? "关闭导航" : "打开导航"}
              >
                {menuOpen ? (
                  <X className="size-4" strokeWidth={1.8} />
                ) : (
                  <Menu className="size-4" strokeWidth={1.8} />
                )}
              </button>
            </div>
          </nav>

          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                className="border-t border-white/10 bg-[#0A0A0A]/90 px-5 py-5 backdrop-blur-2xl lg:hidden"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{
                  duration: reduceMotion ? 0.2 : 0.35,
                  ease: appleEase,
                }}
              >
                <div className="flex flex-col">
                  <RubberSegment
                    items={navSegments}
                    value={activeNav}
                    onChange={changeNavSection}
                    onItemClick={changeNavSection}
                    trackColor="#111111"
                    thumbColor="#F5F5F7"
                    textColor="#86868B"
                    activeTextColor="#0A0A0A"
                    size="md"
                    radius={8}
                    inset={3}
                    equalSlots
                    stretch={92}
                    squash={2}
                    speed={1}
                    glide={70}
                    draggable
                    className="w-full"
                    aria-label="移动端页面导航"
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.header>

      <main id="main-content">
        <section
          id="top"
          className="relative flex min-h-[100svh] items-end overflow-hidden px-5 pb-12 pt-28 sm:px-8 lg:px-12"
        >
          <motion.div
            aria-hidden="true"
            className="grid-field absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? 0.15 : 0 }}
            transition={{ duration: 1.2, ease: appleEase }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_0%,black_72%,transparent_100%)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? 0.48 : 0 }}
            transition={{
              duration: reduceMotion ? 0.2 : 1.2,
              ease: appleEase,
            }}
          >
            <GhostFibers
              lineColor="#911120"
              glowColor="#7d34a0"
              speed={0.2}
              scale={2}
              rotation={0}
              rotationSpeed={0.25}
              layers={4}
              waveAmplitude={0.015}
              waveFrequency={3}
              waveSpeed={0.15}
              layerSpeed={0.08}
              twist={0.1}
              twistFrequency={5}
              twistSpeed={1.2}
              lineFrequency={5}
              lineSpacing={2}
              lineSharpness={16}
              glowFalloff={10}
              glowIntensity={1.6}
              brightness={2}
              blueBoost={1.25}
              vignette={0.8}
              grain={0.05}
              dpr={0.8}
              fps={30}
              paused={!ready}
            />
          </motion.div>
          <ParticleField active={ready} />

          {ready ? (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute right-[8rem] top-28 hidden h-[34rem] w-[36rem] xl:block 2xl:right-[10rem]"
              initial={{
                opacity: 0,
                y: reduceMotion ? 0 : 28,
                scale: reduceMotion ? 1 : 0.96,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: reduceMotion ? 0.2 : 0.9,
                delay: reduceMotion ? 0 : 0.34,
                ease: appleEase,
              }}
            >
              <CardSwap
                width={460}
                height={320}
                cardDistance={52}
                verticalDistance={68}
                delay={5000}
                pauseOnHover
                skewAmount={4}
                easing="elastic"
              >
                <Card customClass="hero-swap-card">
                  <div className="relative z-10 flex h-full flex-col justify-between p-6">
                    <div className="flex items-center justify-between text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#86868B]">
                      <span>产品策略 / 01</span>
                      <span className="size-1.5 bg-[#E10600]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF2D2D]">
                        从问题出发
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#F5F5F7]">
                        把模型能力
                        <br />
                        收束成产品承诺
                      </h2>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-4 text-[0.62rem] uppercase tracking-[0.18em] text-[#86868B]">
                      <span>Strategy</span>
                      <span>Evidence first</span>
                    </div>
                  </div>
                </Card>
                <Card customClass="hero-swap-card">
                  <div className="relative z-10 flex h-full flex-col justify-between p-6">
                    <div className="flex items-center justify-between text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#86868B]">
                      <span>界面系统 / 02</span>
                      <span className="size-1.5 bg-[#E10600]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF2D2D]">
                        状态完整
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#F5F5F7]">
                        让每个状态
                        <br />
                        都有明确答案
                      </h2>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-4 text-[0.62rem] uppercase tracking-[0.18em] text-[#86868B]">
                      <span>Interface</span>
                      <span>Clear feedback</span>
                    </div>
                  </div>
                </Card>
                <Card customClass="hero-swap-card">
                  <div className="relative z-10 flex h-full flex-col justify-between p-6">
                    <div className="flex items-center justify-between text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#86868B]">
                      <span>交付闭环 / 03</span>
                      <span className="size-1.5 bg-[#E10600]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF2D2D]">
                        持续验证
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#F5F5F7]">
                        从上线数据
                        <br />
                        回到下一次决策
                      </h2>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 pt-4 text-[0.62rem] uppercase tracking-[0.18em] text-[#86868B]">
                      <span>Delivery</span>
                      <span>Closed loop</span>
                    </div>
                  </div>
                </Card>
              </CardSwap>
            </motion.div>
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,rgba(225,6,0,0.14),transparent_66%)]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#E10600]/60 to-transparent" />

          <div className="relative z-10 mx-auto w-full max-w-[90rem]">
            <motion.div
              className="mb-7 flex items-center gap-4 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[#86868B]"
              initial={{ opacity: 0, y: 18 }}
              animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              transition={{ duration: 0.6, delay: 0.04, ease: appleEase }}
            >
              <span className="h-1.5 w-1.5 bg-[#E10600]" />
              AI 产品专家 / 产品工程师
            </motion.div>

            <div
              className="max-w-[78rem]"
              style={{ height: "clamp(4.6rem, 11vw, 10.5rem)" }}
            >
              {ready ? (
                <ParticleText
                  headingLevel={1}
                  text="Make AI More Human."
                  particleSize={2}
                  density={5}
                  color="#F5F5F7"
                  highlightColor="#FF2D2D"
                  scatter={180}
                  gatherDuration={1600}
                  stagger={420}
                  pointerRepel={40}
                  repelRadius={120}
                  idleDrift={0.7}
                  trigger="mount"
                  fontSize="clamp(2.8rem, 8.4vw, 7.2rem)"
                  fontWeight={600}
                  fontFamily="inherit"
                  glow
                />
              ) : null}
            </div>

            <div className="mt-10 grid gap-8 border-t border-white/10 pt-7 lg:grid-cols-12">
              <motion.p
                className="max-w-xl text-base leading-7 text-[#86868B] lg:col-span-6 lg:text-lg"
                initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
                animate={
                  ready
                    ? { opacity: 1, y: 0, filter: "blur(0px)" }
                    : { opacity: 0, y: 22, filter: "blur(8px)" }
                }
                transition={{ duration: 0.7, delay: 0.34, ease: appleEase }}
              >
                我设计并构建 AI 产品，让模型能力成为清晰、负责、真正有用的用户体验。
              </motion.p>

              <motion.div
                className="flex flex-wrap items-center gap-3 lg:col-span-6 lg:justify-end"
                initial={{ opacity: 0, y: 22 }}
                animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
                transition={{ duration: 0.7, delay: 0.42, ease: appleEase }}
              >
                <Magnetic>
                  <a
                    href="#work"
                    className="inline-flex h-12 items-center gap-3 bg-[#E10600] px-5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#FF2D2D]"
                  >
                    查看精选项目
                    <ArrowRight className="size-4" strokeWidth={1.8} />
                  </a>
                </Magnetic>
                <Magnetic>
                  <a
                    href="#contact"
                    className="inline-flex h-12 items-center gap-3 border border-white/15 px-5 text-sm font-semibold text-[#F5F5F7] transition-colors duration-300 hover:border-[#FF2D2D] hover:text-[#FF2D2D]"
                  >
                    开始一个项目
                    <ArrowDown className="size-4" strokeWidth={1.8} />
                  </a>
                </Magnetic>
              </motion.div>
            </div>
          </div>
        </section>

        <section
          id="capabilities"
          className="relative px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40"
        >
          <div className="mx-auto max-w-[90rem]">
            <SectionLabel>能力</SectionLabel>
            <AnchoredLanyard />
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <RevealText
                  as="h2"
                  trigger="view"
                  text="战略、界面、动效与系统，融入同一套产品实践。"
                  anchorCharacter="践"
                  anchorId="lanyard-anchor"
                  className="pointer-events-none relative z-30 max-w-5xl text-[2.55rem] font-semibold leading-[1.08] text-[#F5F5F7] sm:text-[4.3rem] sm:leading-[1.04] lg:text-[5.4rem] lg:leading-[1.01]"
                />
                <motion.p
                  className="mt-10 max-w-3xl space-y-2 text-sm leading-7 text-[#86868B] sm:leading-8"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.7, delay: 0.14, ease: appleEase }}
                >
                  <span className="block">
                    巧用 Codex 攻克难任务，从微信小程序到网站开发，代码难题一一破解。
                  </span>
                  <span className="block">
                    让 Codex 辅助产品调研、设计与编写，全流程提效，创意更快落地成现实。
                  </span>
                  <span className="block">
                    作为非专业开发者，我借助 AI 之力跨越技术门槛，一个人也能做出完整产品。
                  </span>
                </motion.p>
              </div>
              <div className="flex flex-col items-center gap-6 text-center lg:col-span-5">
                <div className="relative flex w-full justify-center">
                  <GlassPortrait />
                  <div className="absolute bottom-3 right-full mr-4 hidden w-[16.5rem] xl:block">
                    <StrokeText
                    text="甘文彬"
                    strokeColor="#E10600"
                    fillColor="#FFFFFF"
                      strokeWidth={1.2}
                      drawDuration={1.6}
                      fillDelay={0.25}
                      stagger={0.08}
                      ease="power3.out"
                      trigger="scroll"
                      fillMode="wipe"
                      fontSize={78}
                      fontWeight={500}
                      letterSpacing={2}
                      className="brush-stroke-text"
                    />
                  </div>
                </div>
                <p className="max-w-lg text-center text-base leading-7 text-[#86868B]">
                  我始终靠近模型，也靠近真正使用它的人，让最终产品既技术诚实，也能被情感理解。
                </p>
              </div>
            </div>

            <div className="mt-20 grid gap-4 md:grid-cols-2">
              {capabilities.map((capability, index) => {
                const Icon = capability.icon;

                return (
                  <motion.div
                    key={capability.title}
                    data-capability-card={index}
                    className="relative h-full"
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : {
                            opacity: 0,
                            y: 44,
                            scale: 0.965,
                            filter: "blur(10px)",
                          }
                    }
                    whileInView={
                      reduceMotion
                        ? { opacity: 1 }
                        : {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            filter: "blur(0px)",
                          }
                    }
                    viewport={{ once: true, amount: 0.28 }}
                    transition={{
                      duration: reduceMotion ? 0.2 : 0.82,
                      delay: reduceMotion ? 0 : index * 0.065,
                      ease: appleEase,
                    }}
                    style={{
                      willChange: reduceMotion
                        ? "opacity"
                        : "transform, opacity, filter",
                    }}
                  >
                    <BorderGlow
                      animated
                      edgeSensitivity={48}
                      glowColor="2 100 58"
                      backgroundColor="#111111"
                      borderRadius={8}
                      glowRadius={32}
                      glowIntensity={1.35}
                      coneSpread={22}
                      colors={["#E10600", "#FF2D2D", "#911120"]}
                      className="h-full"
                    >
                      <article className="group flex h-full flex-col px-6 py-9 lg:px-8 lg:py-12">
                        <div className="mb-10 flex items-center justify-between">
                          <Icon
                            className="size-6 text-[#FF2D2D]"
                            strokeWidth={1.5}
                          />
                          <span className="text-[0.62rem] uppercase tracking-[0.22em] text-[#86868B]">
                            0{index + 1}
                          </span>
                        </div>
                        <h3 className="text-2xl font-semibold text-[#F5F5F7] sm:text-3xl">
                          {capability.title}
                        </h3>
                        <p className="mt-5 max-w-lg text-sm leading-7 text-[#86868B] sm:text-base">
                          {capability.copy}
                        </p>
                      </article>
                    </BorderGlow>
                    {!reduceMotion ? (
                      <motion.span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-6 right-6 top-0 z-20 h-px origin-left bg-gradient-to-r from-transparent via-[#FF2D2D] to-transparent shadow-[0_0_14px_rgba(255,45,45,0.65)]"
                        initial={{ scaleX: 0, opacity: 0 }}
                        whileInView={{
                          scaleX: 1,
                          opacity: [0, 0.95, 0],
                        }}
                        viewport={{ once: true, amount: 0.28 }}
                        transition={{
                          duration: 0.72,
                          delay: index * 0.065 + 0.14,
                          ease: appleEase,
                        }}
                      />
                    ) : null}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="numbers"
          className="bg-[#111111] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40"
        >
          <div className="mx-auto max-w-[90rem]">
            <SectionLabel>数据</SectionLabel>
            <div className="grid gap-12 border-y border-white/10 py-12 lg:grid-cols-12 lg:py-16">
              <div className="lg:col-span-4">
                <p className="max-w-sm text-lg leading-8 text-[#86868B]">
                  十年产品与工程经验，压缩成一组在上线之后仍然重要的结果。
                </p>
              </div>
              <div className="grid gap-10 sm:grid-cols-3 lg:col-span-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="border-t border-white/10 pt-6 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0"
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{
                      duration: 0.7,
                      delay: index * 0.08,
                      ease: appleEase,
                    }}
                  >
                    <div className="text-5xl font-semibold text-[#F5F5F7] sm:text-6xl">
                      {stat.display ?? (
                        <Counter
                          value={stat.value ?? 0}
                          suffix={stat.suffix ?? ""}
                        />
                      )}
                    </div>
                    <p className="mt-4 text-xs leading-5 text-[#86868B]">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="work"
          className="px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40"
        >
          <div className="mx-auto max-w-[90rem]">
            <SectionLabel>精选项目</SectionLabel>
            <div className="mb-16 grid gap-8 lg:grid-cols-12">
              <RevealText
                as="h2"
                trigger="view"
                text={"在可用性的边界，\n打造产品。"}
                className="text-[2.55rem] font-semibold leading-[1.08] lg:col-span-7 sm:text-[4.3rem] sm:leading-[1.04] lg:text-[5.4rem] lg:leading-[1.01]"
              />
              <div className="flex items-end lg:col-span-5">
                <p className="max-w-lg text-base leading-7 text-[#86868B]">
                  每个项目都从人需要做出的决定出发，再反推模型、界面和反馈闭环。
                </p>
              </div>
            </div>

            <div className="mb-8 flex justify-center">
              <ProjectGallerySwitch
                open={galleryOpen}
                onToggle={toggleGallery}
                buttonRef={galleryTriggerRef}
              />
            </div>

            <div
              className={cn(
                "relative",
                !galleryOpen &&
                  "h-[34rem] overflow-hidden sm:h-auto sm:overflow-visible",
              )}
            >
              <ProjectSignalChart collapsed={galleryOpen} />

              <motion.div
                ref={galleryGridRef}
                data-project-gallery="true"
                aria-hidden={!galleryOpen}
                inert={!galleryOpen}
                className="relative z-10 grid gap-4 lg:grid-cols-12"
                initial={false}
                animate={
                  reduceMotion
                    ? { opacity: galleryOpen ? 1 : 0 }
                    : {
                        clipPath: galleryOpen
                          ? `circle(${galleryOrigin.radius}px at ${galleryOrigin.x}px ${galleryOrigin.y}px)`
                          : `circle(0px at ${galleryOrigin.x}px ${galleryOrigin.y}px)`,
                      }
                }
                transition={{
                  duration: reduceMotion ? 0.2 : 0.68,
                  ease: appleEase,
                }}
                style={{ willChange: "clip-path, opacity" }}
              >
                {projects.map((project, index) => (
                  <ProjectCard
                    key={project.title}
                    project={project}
                    index={index}
                    visible={galleryOpen}
                  />
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="relative overflow-hidden border-t border-white/10 px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_28%,rgba(225,6,0,0.16),transparent_31%)]" />
          <div className="relative mx-auto max-w-[90rem]">
            <SectionLabel>联系</SectionLabel>
            <RevealText
              as="h2"
              trigger="view"
              text="有棘手的 AI 问题？"
              className="max-w-6xl text-[3.4rem] font-semibold leading-[1.02] sm:text-[6rem] sm:leading-[0.98] lg:text-[8rem] lg:leading-[0.94]"
            />

            <div className="mt-16 grid gap-12 border-t border-white/10 pt-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <p className="max-w-md text-base leading-7 text-[#86868B]">
                  带着真实约束、真实流程和真正重要的结果来。我可以帮你梳理产品，并构建第一个可信版本。
                </p>
              </div>

              <div className="flex flex-wrap items-start gap-3 lg:col-span-7 lg:justify-end">
                <Magnetic>
                  <a
                    href="mailto:3495551608@qq.com"
                    className="inline-flex h-12 items-center gap-3 bg-[#E10600] px-5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#FF2D2D]"
                  >
                    <Mail className="size-4" strokeWidth={1.8} />
                    3495551608@qq.com
                  </a>
                </Magnetic>
                <Magnetic>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="inline-flex h-12 items-center gap-3 border border-white/15 px-5 text-sm font-semibold text-[#F5F5F7] transition-colors duration-300 hover:border-[#FF2D2D] hover:text-[#FF2D2D]"
                  >
                    {copied ? (
                      <Check className="size-4" strokeWidth={1.8} />
                    ) : (
                      <Copy className="size-4" strokeWidth={1.8} />
                    )}
                    {copied ? "已复制" : "复制邮箱"}
                  </button>
                </Magnetic>
              </div>
            </div>

            <footer className="mt-24 flex flex-col gap-5 border-t border-white/10 py-8 text-xs text-[#86868B] sm:flex-row sm:items-center sm:justify-between">
              <span>AI 产品专家 / 智能产品设计</span>
              <div className="flex items-center gap-5">
                <span>广西玉林</span>
                <span className="flex items-center gap-2">
                  <Gauge className="size-3.5" strokeWidth={1.7} />
                  2026
                </span>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
