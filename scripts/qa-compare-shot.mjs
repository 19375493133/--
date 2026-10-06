import fs from "node:fs";
import path from "node:path";

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

await send("Emulation.setDeviceMetricsOverride", {
  width: 1560,
  height: 730,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.enable");
await send("Page.navigate", {
  url: "http://127.0.0.1:4173/qa-compare.html",
});
await new Promise((resolve) => setTimeout(resolve, 2200));

const response = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: false,
});
const file = path.join(process.cwd(), "reference-vs-implementation.png");
fs.writeFileSync(file, Buffer.from(response.result.data, "base64"));
console.log(file);
socket.close();
