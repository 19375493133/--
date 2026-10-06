const targets = await (await fetch("http://127.0.0.1:9333/json")).json();
const page = targets.find((target) => target.type === "page");
const socket = new WebSocket(page.webSocketDebuggerUrl);
let requestId = 0;
const pending = new Map();

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  const resolve = pending.get(message.id);

  if (resolve) {
    pending.delete(message.id);
    resolve(message);
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

function evaluate(expression) {
  return send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }).then((response) => response.result?.result?.value);
}

async function wait(duration) {
  await new Promise((resolve) => setTimeout(resolve, duration));
}

await send("Page.enable");
await send("Emulation.setEmulatedMedia", { features: [] });
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
await wait(1200);
await evaluate(
  'history.scrollRestoration = "manual"; sessionStorage.setItem("ai-specialist-intro-played","1"); location.reload()',
);
await wait(1800);

const tokens = await evaluate(`(() => {
  try {
  const body = getComputedStyle(document.body);
  const html = getComputedStyle(document.documentElement);
  const hero = document.querySelector("h1");
  const heroStyle = getComputedStyle(hero);
  const sub = document.querySelector("h1")?.closest("section")?.querySelector("p");
  const cta = document.querySelector('a[href="#work"]');
  const ctaStyle = getComputedStyle(cta);
  const header = document.querySelector("header");
  const headerStyle = getComputedStyle(header);
  const section = document.querySelector("#capabilities");
  const sectionStyle = getComputedStyle(section);
  const inner = section.querySelector("div");

  return {
    bodyBackground: body.backgroundColor,
    bodyColor: body.color,
    fontFamily: body.fontFamily,
    heroFontFamily: heroStyle.fontFamily,
    heroFontSize: heroStyle.fontSize,
    heroFontWeight: heroStyle.fontWeight,
    heroLetterSpacing: heroStyle.letterSpacing,
    heroLineHeight: heroStyle.lineHeight,
    subColor: sub ? getComputedStyle(sub).color : null,
    ctaBackground: ctaStyle.backgroundColor,
    ctaColor: ctaStyle.color,
    headerBackground: headerStyle.backgroundColor,
    headerHeight: header.getBoundingClientRect().height,
    sectionPaddingTop: sectionStyle.paddingTop,
    innerMaxWidth: inner ? getComputedStyle(inner).maxWidth : null,
    accentVars: {
      ink: html.getPropertyValue("--color-ink").trim(),
      accent: html.getPropertyValue("--color-accent").trim(),
      bright: html.getPropertyValue("--color-accent-bright").trim(),
      primary: html.getPropertyValue("--color-primary").trim(),
      secondary: html.getPropertyValue("--color-secondary").trim(),
      ease: html.getPropertyValue("--ease-apple").trim(),
    },
    documentScrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  };
  } catch (error) {
    return { error: String(error) };
  }
})()`);

console.log(JSON.stringify(tokens, null, 2));
socket.close();
