import fs from "node:fs";

const [widthArg, heightArg, label] = process.argv.slice(2);
const width = Number(widthArg || 1440);
const height = Number(heightArg || 900);
const suffix = label || `${width}x${height}`;
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

async function capture(path) {
  const response = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
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
    'sessionStorage.removeItem("ai-specialist-intro-played"); location.reload();',
});
await new Promise((resolve) => setTimeout(resolve, 1400));

await capture(`G:/文挡/ChatGPT/网站/implementation-entry-${suffix}.png`);
await send("Runtime.evaluate", {
  expression: 'document.querySelector("main[role=button]")?.click()',
});
await new Promise((resolve) => setTimeout(resolve, 2600));
await capture(`G:/文挡/ChatGPT/网站/implementation-home-${suffix}.png`);

console.log(`Captured entry and home at ${width}x${height}.`);
socket.close();
