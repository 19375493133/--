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

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
await wait(1200);
await send("Runtime.evaluate", {
  expression:
    'sessionStorage.setItem("ai-specialist-intro-played","1"); location.reload();',
});
await wait(1600);
await send("Runtime.evaluate", {
  expression: 'document.querySelector("#work")?.scrollIntoView()',
});

const response = await send("Runtime.evaluate", {
  expression: `(async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return [...document.querySelectorAll("img")].map((image) => ({
      src: image.currentSrc || image.src,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      complete: image.complete,
    }));
  })()`,
  awaitPromise: true,
  returnByValue: true,
});

console.log(JSON.stringify(response.result?.result?.value, null, 2));
socket.close();
