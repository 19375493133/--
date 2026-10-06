const targets = await (await fetch("http://127.0.0.1:9333/json")).json();
const page = targets.find((target) => target.type === "page");

if (!page?.webSocketDebuggerUrl) {
  throw new Error("No Edge page target is available.");
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
const issues = [];
let requestId = 0;
const pending = new Map();

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  const resolve = pending.get(message.id);

  if (resolve) {
    pending.delete(message.id);
    resolve(message);
  }

  if (message.method === "Runtime.exceptionThrown") {
    issues.push({ kind: "exception", text: message.params.exceptionDetails.text });
  }

  if (
    message.method === "Log.entryAdded" &&
    message.params.entry.level === "error"
  ) {
    issues.push({ kind: "log", text: message.params.entry.text });
  }
};

await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++requestId;
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve({ timeout: true, method });
    }, 8000);
    pending.set(id, (message) => {
      clearTimeout(timer);
      resolve(message);
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return response.result?.result?.value;
}

async function wait(duration) {
  await new Promise((resolve) => setTimeout(resolve, duration));
}

async function pressTab(shift = false) {
  const modifiers = shift ? 8 : 0;
  const base = {
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
    modifiers,
  };
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...base });
  await send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
  await wait(80);
}

await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
await wait(1200);

await evaluate(
  'sessionStorage.removeItem("ai-specialist-intro-played"); location.reload()',
);
await wait(1400);

// Dismiss Edge's own first-run/privacy consent UI, which lives in a shadow root
// and would otherwise swallow the first Tab presses.
await evaluate(`(() => {
  const wanted = new Set(["明白", "Got it", "Accept"]);
  const seen = [];
  function walk(root) {
    for (const node of root.querySelectorAll("*")) {
      if (node.shadowRoot) walk(node.shadowRoot);
      const tag = (node.tagName || "").toLowerCase();
      const label = (node.textContent || "").trim();
      if ((tag === "fluent-button" || tag === "fluent-link") && wanted.has(label.split("\\n")[0])) {
        seen.push(label);
        node.click();
      }
    }
  }
  walk(document);
  return seen;
})()`);
await wait(300);

// Walk with a real Tab key press until a nav link owns focus.
let focusChecks = [];
for (let step = 0; step < 6; step += 1) {
  await pressTab();
  const state = await evaluate(`(() => {
    const el = document.activeElement;
    if (!el) return null;
    const style = getComputedStyle(el);
    return {
      tag: el.tagName,
      label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40),
      focusVisible: el.matches(":focus-visible"),
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle
    };
  })()`);
  focusChecks.push(state);
  if (state?.focusVisible && state.outlineColor === "rgb(255, 45, 45)") break;
}

const focusResult = focusChecks[focusChecks.length - 1];

// Enter the site so the remaining checks run on the home page.
await evaluate('document.querySelector("main[role=button]")?.click()');
await wait(2600);

const focusAfterEntry = await evaluate(`(() => {
  const link = document.querySelector('a[href="#work"]');
  link.focus({ focusVisible: true });
  const style = getComputedStyle(link);
  return {
    focusVisible: link.matches(":focus-visible"),
    outlineWidth: style.outlineWidth,
    outlineColor: style.outlineColor,
    outlineStyle: style.outlineStyle
  };
})()`);

await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "reduce" }],
});
await evaluate(
  'sessionStorage.removeItem("ai-specialist-intro-played"); location.reload()',
);
await wait(1200);

const reducedMotion = await evaluate(`(async () => {
  const started = performance.now();
  document.querySelector("main[role=button]")?.click();
  let overlayAppeared = false;
  let overlayCleared = null;
  let entryCleared = null;

  while (performance.now() - started < 2000) {
    const entryGone = !document.querySelector("main[role=button]");
    const overlayGone = ![...document.querySelectorAll("div.fixed.inset-0")]
      .some((element) => element.className.includes("z-[100]"));

    if (!overlayGone) overlayAppeared = true;
    if (entryGone && entryCleared === null) entryCleared = performance.now() - started;
    if (overlayAppeared && overlayGone && overlayCleared === null) {
      overlayCleared = performance.now() - started;
    }
    if (entryGone && overlayAppeared && overlayGone) break;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  return {
    entryClearedMs: entryCleared,
    overlayClearedMs: overlayCleared,
    overlayAppeared,
    overflow: document.body.style.overflow,
    headerReady: Boolean(document.querySelector("header"))
  };
})()`);

await send("Emulation.setEmulatedMedia", { features: [] });

const focusRingPassed =
  focusResult?.focusVisible === true &&
  focusResult.outlineColor === "rgb(255, 45, 45)";
const reducedMotionPassed =
  reducedMotion.overlayClearedMs !== null &&
  reducedMotion.overlayClearedMs < 400 &&
  reducedMotion.overflow === "";

console.log(
  JSON.stringify(
    {
      focusChecks,
      focusResult,
      focusAfterEntry,
      reducedMotion,
      focusRingPassed,
      reducedMotionPassed,
      consoleIssues: issues,
    },
    null,
    2,
  ),
);

socket.close();
