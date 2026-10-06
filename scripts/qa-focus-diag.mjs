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

await send("Emulation.setEmulatedMedia", { features: [] });
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Runtime.evaluate", {
  expression:
    'sessionStorage.setItem("ai-specialist-intro-played","1"); location.reload();',
});
await new Promise((resolve) => setTimeout(resolve, 1800));

const response = await send("Runtime.evaluate", {
  expression: `(() => {
    const link = document.querySelector('a[href="#work"]');
    link.focus({ focusVisible: true });
    const style = getComputedStyle(link);
    const outlineRules = [];

    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of rules) {
        const text = rule.cssText || "";
        if (text.includes("outline")) outlineRules.push(text.slice(0, 200));
        if (rule.cssRules) {
          for (const inner of rule.cssRules) {
            const innerText = inner.cssText || "";
            if (innerText.includes("outline")) outlineRules.push(innerText.slice(0, 200));
          }
        }
      }
    }

    return {
      focusVisible: link.matches(":focus-visible"),
      outline: style.outline,
      outlineColor: style.outlineColor,
      classes: link.className,
      outlineRules,
    };
  })()`,
  returnByValue: true,
});

console.log(JSON.stringify(response.result?.result?.value, null, 2));
socket.close();
