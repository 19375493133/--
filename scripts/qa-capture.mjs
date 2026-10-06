import fs from "node:fs";
import path from "node:path";

const [widthArg, heightArg, label] = process.argv.slice(2);
const width = Number(widthArg || 1440);
const height = Number(heightArg || 900);
const suffix = label || `${width}x${height}`;
const outDir = process.cwd();

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

async function wait(duration) {
  await new Promise((resolve) => setTimeout(resolve, duration));
}

async function capture(name) {
  const response = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const file = path.join(outDir, name);
  fs.writeFileSync(file, Buffer.from(response.result.data, "base64"));
  return file;
}

await send("Emulation.setEmulatedMedia", { features: [] });
await send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width < 600,
});
await send("Page.enable");
await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
await wait(1200);
await send("Runtime.evaluate", {
  expression:
    'history.scrollRestoration = "manual"; sessionStorage.removeItem("ai-specialist-intro-played"); location.reload();',
});
await wait(1500);
await send("Runtime.evaluate", {
  expression: "window.scrollTo(0, 0)",
});
await wait(200);

const files = [];
files.push(await capture(`final-entry-${suffix}.png`));

await send("Runtime.evaluate", {
  expression: 'document.querySelector("main[role=button]")?.click()',
});

await wait(340);
files.push(await capture(`final-transition-a-${suffix}.png`));
await wait(320);
files.push(await capture(`final-transition-b-${suffix}.png`));
await wait(480);
files.push(await capture(`final-transition-c-${suffix}.png`));
await wait(2000);
files.push(await capture(`final-home-${suffix}.png`));

await send("Runtime.evaluate", {
  expression: 'document.querySelector("#capabilities")?.scrollIntoView()',
});
await wait(3400);
files.push(await capture(`final-capabilities-${suffix}.png`));

await send("Runtime.evaluate", {
  expression: 'document.querySelector("#work")?.scrollIntoView()',
});
await wait(2600);
files.push(await capture(`final-work-${suffix}.png`));

await send("Runtime.evaluate", {
  expression: 'document.querySelector("#contact")?.scrollIntoView()',
});
await wait(2600);
files.push(await capture(`final-contact-${suffix}.png`));

console.log(files.map((file) => path.basename(file)).join("\n"));
socket.close();
