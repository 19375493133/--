import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "C:/Users/ikun/AppData/Local/OpenAI/Codex/runtimes/cua_node/b474a88d5d105afa/bin/node_modules/playwright/index.js",
);

const browser = await chromium.launch({
  headless: true,
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
});

const viewports = [
  { name: "desktop", width: 1440, height: 1200 },
  { name: "mobile", width: 390, height: 844 },
];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });

    await page.goto("http://127.0.0.1:4173/", {
      waitUntil: "domcontentloaded",
    });
    await page.evaluate(() =>
      sessionStorage.setItem("ai-specialist-intro-played", "1"),
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#capabilities").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);

    await page.screenshot({
      path: `final-portrait-${viewport.name}.png`,
      fullPage: false,
    });

    const metrics = await page.evaluate(() => {
      const figure = document.querySelector("#capabilities figure");
      const paragraph = figure?.nextElementSibling;
      const email = document.querySelector('#contact a[href^="mailto:"]');

      if (!figure || !paragraph || !email) {
        return null;
      }

      const frame = figure.getBoundingClientRect();
      const text = paragraph.getBoundingClientRect();

      return {
        figure: {
          width: frame.width,
          height: frame.height,
          center: frame.x + frame.width / 2,
          right: frame.right,
        },
        paragraphCenter: text.x + text.width / 2,
        email: email.textContent?.trim(),
        viewportWidth: document.documentElement.clientWidth,
        overflows:
          frame.x < 0 || frame.right > document.documentElement.clientWidth,
      };
    });

    console.log(viewport.name, JSON.stringify(metrics));

    await page.locator("#numbers").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: `final-numbers-${viewport.name}.png`,
      fullPage: false,
    });

    const stats = await page
      .locator("#numbers .text-5xl")
      .allTextContents();
    console.log(`${viewport.name}-stats`, JSON.stringify(stats));

    if (viewport.name === "desktop") {
      const trigger = page.locator("#work [role='switch']").first();
      await page.locator("#work").scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      const scrollBefore = await page.evaluate(() => window.scrollY);
      const triggerBox = await trigger.boundingBox();
      const initialClosedState = await page.evaluate(() => {
        const grid = document.querySelector('[data-project-gallery="true"]');
        const cards = Array.from(grid?.querySelectorAll("article") ?? []);
        const chart = document.querySelector(
          '[data-project-signal-chart="true"]',
        );
        const scroller = document.querySelector(
          '[data-project-signal-scroller="true"]',
        );

        return {
          ariaHidden: grid?.getAttribute("aria-hidden"),
          clipPath: grid ? getComputedStyle(grid).clipPath : null,
          cardOpacity: cards.map((card) => getComputedStyle(card).opacity),
          chartPresent: Boolean(chart),
          chartAriaHidden: chart?.getAttribute("aria-hidden"),
          chartScrollWidth: scroller?.scrollWidth,
          chartClientWidth: scroller?.clientWidth,
          chartScrollSnapType: scroller
            ? getComputedStyle(scroller).scrollSnapType
            : null,
          chartValue: document
            .querySelector("[data-project-signal-value]")
            ?.getAttribute("data-project-signal-value"),
          scrollY: window.scrollY,
        };
      });

      const scrollerBox = await page
        .locator('[data-project-signal-scroller="true"]')
        .boundingBox();
      const scrollBeforeDrag = await page
        .locator('[data-project-signal-scroller="true"]')
        .evaluate((element) => element.scrollLeft);
      if (scrollerBox) {
        const dragStartX = scrollerBox.x + scrollerBox.width * 0.34;
        const dragEndX = scrollerBox.x + scrollerBox.width * 0.62;
        const dragY = scrollerBox.y + 96;
        await page.mouse.move(dragStartX, dragY);
        await page.mouse.down();
        await page.mouse.move(dragEndX, dragY, { steps: 12 });
        await page.mouse.up();
        await page.waitForTimeout(250);
      }
      const scrollAfterDrag = await page
        .locator('[data-project-signal-scroller="true"]')
        .evaluate((element) => element.scrollLeft);
      const dragScrollDelta = scrollAfterDrag - scrollBeforeDrag;

      await page
        .locator('[data-project-signal-scroller="true"]')
        .evaluate((element) => {
          element.scrollLeft = 300;
        });
      await page.waitForTimeout(300);
      await page
        .locator("[data-project-signal-chart='true'] button")
        .nth(5)
        .click();
      await page.waitForTimeout(700);
      const clickedSixState = await page.evaluate(() => ({
        value: document
          .querySelector("[data-project-signal-value]")
          ?.getAttribute("data-project-signal-value"),
        scrollLeft: document.querySelector(
          '[data-project-signal-scroller="true"]',
        )?.scrollLeft,
        maxScroll:
          (document.querySelector(
            '[data-project-signal-scroller="true"]',
          )?.scrollWidth ?? 0) -
          (document.querySelector(
            '[data-project-signal-scroller="true"]',
          )?.clientWidth ?? 0),
        pressed: Array.from(
          document.querySelectorAll(
            "[data-project-signal-chart='true'] button",
          ),
        ).map((button) => button.getAttribute("aria-pressed")),
      }));

      await page
        .locator("[data-project-signal-chart='true'] button")
        .first()
        .click();
      await page.waitForTimeout(500);
      const linkedChartValue = await page
        .locator("[data-project-signal-value]")
        .getAttribute("data-project-signal-value");
      await page
        .locator("[data-project-signal-chart='true'] button")
        .last()
        .click();
      await page.waitForTimeout(500);
      await page.locator("#work").scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: "final-gallery-closed-desktop.png",
        fullPage: false,
      });

      await trigger.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const scrollBeforeOpen = await page.evaluate(() => window.scrollY);

      await trigger.click();
      await page.waitForTimeout(1500);
      await page
        .waitForFunction(
          () => {
            const images = Array.from(
              document.querySelectorAll(
                '[data-project-gallery="true"] img',
              ),
            );

            return (
              images.length > 0 &&
              images.every((image) => image.complete && image.naturalWidth > 0)
            );
          },
          { timeout: 10_000 },
        )
        .catch(() => undefined);

      await page.screenshot({
        path: "final-gallery-desktop.png",
        fullPage: false,
      });

      const openState = await page.evaluate(() => {
        const grid = document.querySelector('[data-project-gallery="true"]');
        const cards = Array.from(grid?.querySelectorAll("article") ?? []);
        const triggerElement = document.querySelector(
          "#work [role='switch']",
        );
        const triggerRect = triggerElement?.getBoundingClientRect();

        return {
          triggerChecked: triggerElement?.getAttribute("aria-checked"),
          triggerCenterX: triggerRect
            ? triggerRect.left + triggerRect.width / 2
            : null,
          viewportCenterX: document.documentElement.clientWidth / 2,
          ariaHidden: grid?.getAttribute("aria-hidden"),
          clipPath: grid ? getComputedStyle(grid).clipPath : null,
          cardOpacity: cards.map((card) => getComputedStyle(card).opacity),
          chartAriaHidden: document
            .querySelector('[data-project-signal-chart="true"]')
            ?.getAttribute("aria-hidden"),
          chartOpacity: getComputedStyle(
            document.querySelector('[data-project-signal-chart="true"]'),
          ).opacity,
          images: Array.from(grid?.querySelectorAll("img") ?? []).map(
            (image) => ({
              complete: image.complete,
              naturalWidth: image.naturalWidth,
            }),
          ),
          bodyOverflow: document.body.style.overflow,
          scrollY: window.scrollY,
        };
      });

      await trigger.click();
      await page.waitForTimeout(320);
      const chartBounceSample = await page.evaluate(() => {
        const chart = document.querySelector(
          '[data-project-signal-chart="true"]',
        );

        return {
          opacity: chart ? getComputedStyle(chart).opacity : null,
          transform: chart ? getComputedStyle(chart).transform : null,
        };
      });
      await page.waitForTimeout(600);

      const closedState = await page.evaluate(() => ({
        ariaHidden: document
          .querySelector('[data-project-gallery="true"]')
          ?.getAttribute("aria-hidden"),
        clipPath: getComputedStyle(
          document.querySelector('[data-project-gallery="true"]'),
        ).clipPath,
        cardOpacity: Array.from(
          document.querySelectorAll('[data-project-gallery="true"] article'),
        ).map((card) => getComputedStyle(card).opacity),
        chartAriaHidden: document
          .querySelector('[data-project-signal-chart="true"]')
          ?.getAttribute("aria-hidden"),
        chartOpacity: getComputedStyle(
          document.querySelector('[data-project-signal-chart="true"]'),
        ).opacity,
        bodyOverflow: document.body.style.overflow,
        scrollY: window.scrollY,
      }));

      console.log(
        "gallery",
        JSON.stringify({
          triggerBox,
          scrollBefore,
          scrollBeforeOpen,
          initialClosedState,
          scrollBeforeDrag,
          scrollAfterDrag,
          dragScrollDelta,
          clickedSixState,
          linkedChartValue,
          openState,
          chartBounceSample,
          closedState,
        }),
      );
    }

    await page.close();
  }
} finally {
  await browser.close();
}
