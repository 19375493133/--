import fs from "node:fs";

const [widthArg, heightArg, label] = process.argv.slice(2);
const width = Number(widthArg || 1440);
const height = Number(heightArg || 900);
const suffix = label || `${width}x${height}`;
const sections = ["capabilities", "numbers", "work", "contact"];
const targets = await (await fetch("http://127.0.0.1:9333/json")).json();
const page = targets.find((target) => target.type === "page");

if (!page?.webSocketDebuggerUrl) {
  throw new Error("No Edge page target is available.");
}

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

async function capture(path, fullPage = false) {
  const response = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: fullPage,
  });
  fs.writeFileSync(path, Buffer.from(response.result.data, "base64"));
}

await send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width < 600,
});
await send("Runtime.evaluate", {
  expression:
    'sessionStorage.setItem("ai-specialist-intro-played", "1"); location.reload();',
});
await new Promise((resolve) => setTimeout(resolve, 1400));
await send("Input.dispatchMouseEvent", {
  type: "mouseMoved",
  x: 4,
  y: 4,
});

for (const section of sections) {
  await send("Runtime.evaluate", {
    expression: `document.querySelector("#${section}")?.scrollIntoView({ block: "start" })`,
  });
  await new Promise((resolve) => setTimeout(resolve, 2400));
  await capture(
    `G:/文挡/ChatGPT/网站/implementation-${section}-${suffix}.png`,
  );
}

await send("Runtime.evaluate", {
  expression: "window.scrollTo(0, document.body.scrollHeight)",
});
await new Promise((resolve) => setTimeout(resolve, 800));
await capture(
  `G:/文挡/ChatGPT/网站/implementation-home-revealed-${suffix}.png`,
  true,
);

console.log(`Captured section states at ${width}x${height}.`);
socket.close();
