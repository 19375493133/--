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
    issues.push({
      kind: "exception",
      text: message.params.exceptionDetails.text,
    });
  }

  if (
    message.method === "Log.entryAdded" &&
    message.params.entry.level === "error"
  ) {
    issues.push({
      kind: "log",
      text: message.params.entry.text,
    });
  }

  if (
    message.method === "Runtime.consoleAPICalled" &&
    message.params.type === "error"
  ) {
    issues.push({
      kind: "console",
      text: message.params.args
        .map((argument) => argument.value || argument.description || "")
        .join(" "),
    });
  }
};

await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++requestId;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression, userGesture = false) {
  const response = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    userGesture,
    returnByValue: true,
  });
  return response.result?.result?.value;
}

async function wait(duration) {
  await new Promise((resolve) => setTimeout(resolve, duration));
}

await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
await send("Page.bringToFront");
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

const transitionStart = await evaluate(`(async () => {
  document.querySelector("main[role=button]")?.click();
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    overflow: document.body.style.overflow,
    entryVisible: Boolean(document.querySelector("main[role=button]")),
    transitionVisible: [...document.querySelectorAll("div.fixed.inset-0")]
      .some((element) => element.className.includes("z-[100]"))
  };
})()`);

await wait(1400);

const transitionEnd = await evaluate(`({
  overflow: document.body.style.overflow,
  entryVisible: Boolean(document.querySelector("main[role=button]")),
  transitionVisible: [...document.querySelectorAll("div.fixed.inset-0")]
    .some((element) => element.className.includes("z-[100]")),
  headerOpacity: getComputedStyle(document.querySelector("header")).opacity
})`);

await evaluate("location.reload()");
await wait(900);
const sessionSkip = await evaluate(`({
  entryVisible: Boolean(document.querySelector("main[role=button]")),
  overflow: document.body.style.overflow
})`);

await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await evaluate("location.reload()");
await wait(900);

const mobileMenu = await evaluate(`(async () => {
  const button = document.querySelector('button[aria-label="打开导航"]');
  button?.click();
  await new Promise((resolve) => setTimeout(resolve, 450));
  return {
    expanded: button?.getAttribute("aria-expanded") === "true",
    links: [...document.querySelectorAll("header a")].map((link) => link.textContent.trim())
  };
})()`);

await evaluate(`(async () => {
  const button = document.querySelector('button[aria-label="关闭导航"]');
  button?.click();
  await new Promise((resolve) => setTimeout(resolve, 300));
})()`);

await send("Browser.grantPermissions", {
  origin: "http://127.0.0.1:4173",
  permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"],
});

await evaluate(`document.querySelector("#contact")?.scrollIntoView({ block: "start" })`);
await wait(900);
const copyEmail = await evaluate(`(async () => {
  try {
    window.focus();
    const button = [...document.querySelectorAll("button")]
      .find((element) => element.textContent.includes("复制邮箱"));
    if (!button) return { buttonFound: false };
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 450));
    return {
      buttonFound: true,
      label: button.textContent.trim(),
      clipboard: await navigator.clipboard.readText()
    };
  } catch (error) {
    return { buttonFound: true, error: String(error) };
  }
})()`, true);

const focusRing = await evaluate(`(() => {
  const link = document.querySelector('a[href="#work"]');
  link?.focus();
  const style = getComputedStyle(link);
  return {
    width: style.outlineWidth,
    color: style.outlineColor
  };
})()`);

await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "reduce" }],
});
await evaluate(
  'sessionStorage.removeItem("ai-specialist-intro-played"); location.reload()',
);
await wait(900);
const reducedMotion = await evaluate(`(async () => {
  document.querySelector("main[role=button]")?.click();
  await new Promise((resolve) => setTimeout(resolve, 420));
  return {
    entryVisible: Boolean(document.querySelector("main[role=button]")),
    overflow: document.body.style.overflow,
    transitionVisible: [...document.querySelectorAll("div.fixed.inset-0")]
      .some((element) => element.className.includes("z-[100]"))
  };
})()`);

await send("Emulation.setEmulatedMedia", { features: [] });

console.log(
  JSON.stringify(
    {
      transitionStart,
      transitionEnd,
      sessionSkip,
      mobileMenu,
      copyEmail,
      focusRing,
      reducedMotion,
      consoleIssues: issues,
    },
    null,
    2,
  ),
);

socket.close();
