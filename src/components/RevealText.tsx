import {
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { cn } from "@/lib/utils";

type RevealTextProps = {
  text: string;
  className?: string;
  active?: boolean;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  trigger?: "controlled" | "view";
  anchorCharacter?: string;
  anchorId?: string;
};

const appleEase = [0.16, 1, 0.3, 1] as const;
const tokenPattern = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*|\s+|./gu;
const closingPunctuationPattern = /^[，。！？；：、,.!?;:）》】”’]+$/u;

export function RevealText({
  text,
  className,
  active = true,
  delay = 0,
  as = "span",
  trigger = "controlled",
  anchorCharacter,
  anchorId,
}: RevealTextProps) {
  const reduceMotion = useReducedMotion();
  const rawTokens = text.match(tokenPattern) ?? [text];
  const tokens = rawTokens.reduce<string[]>((result, token) => {
    if (closingPunctuationPattern.test(token) && result.length > 0) {
      result[result.length - 1] += token;
      return result;
    }

    result.push(token);
    return result;
  }, []);
  const anchorCharacterIndex = anchorCharacter
    ? text.indexOf(anchorCharacter)
    : -1;
  let characterIndex = 0;

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: delay,
        staggerChildren: reduceMotion ? 0 : 0.03,
      },
    },
  };

  const character: Variants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.2, ease: appleEase },
        },
      }
    : {
        hidden: {
          y: 40,
          opacity: 0,
          filter: "blur(10px)",
        },
        visible: {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          transition: { duration: 0.7, ease: appleEase },
        },
      };

  const content = tokens.map((token, tokenIndex) => {
    if (token.includes("\n")) {
      return <br key={`break-${tokenIndex}`} />;
    }

    if (/^\s+$/u.test(token)) {
      return (
        <motion.span
          key={`space-${tokenIndex}`}
          variants={character}
          className="inline-block"
        >
          {token.replace(/\s/gu, "\u00A0")}
        </motion.span>
      );
    }

    return (
      <span
        key={`${token}-${tokenIndex}`}
        className="inline-block whitespace-nowrap"
      >
        {Array.from(token).map((characterValue) => {
          const key = `${characterValue}-${characterIndex}`;
          const isAnchor =
            anchorCharacterIndex === characterIndex &&
            Boolean(anchorId);
          characterIndex += 1;

          return (
            <motion.span
              key={key}
              id={isAnchor ? anchorId : undefined}
              data-lanyard-anchor={isAnchor ? "true" : undefined}
              variants={character}
              className="inline-block will-change-transform"
            >
              {characterValue}
            </motion.span>
          );
        })}
      </span>
    );
  });

  const motionProps =
    trigger === "view"
      ? {
          initial: "hidden" as const,
          whileInView: "visible" as const,
          viewport: { once: true, amount: 0.55 },
        }
      : {
          initial: "hidden" as const,
          animate: active ? ("visible" as const) : ("hidden" as const),
        };

  if (as === "h1") {
    return (
      <motion.h1
        aria-label={text}
        variants={container}
        className={cn("m-0", className)}
        {...motionProps}
      >
        {content}
      </motion.h1>
    );
  }

  if (as === "h2") {
    return (
      <motion.h2
        aria-label={text}
        variants={container}
        className={cn("m-0", className)}
        {...motionProps}
      >
        {content}
      </motion.h2>
    );
  }

  if (as === "h3") {
    return (
      <motion.h3
        aria-label={text}
        variants={container}
        className={cn("m-0", className)}
        {...motionProps}
      >
        {content}
      </motion.h3>
    );
  }

  if (as === "p") {
    return (
      <motion.p
        aria-label={text}
        variants={container}
        className={cn("m-0", className)}
        {...motionProps}
      >
        {content}
      </motion.p>
    );
  }

  return (
    <motion.span
      aria-label={text}
      variants={container}
      className={cn("inline-block", className)}
      {...motionProps}
    >
      {content}
    </motion.span>
  );
}
