# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## 项目设计决策

- 参考 `reference-hero-section-5.png` 的构图语言，但最终视觉遵循用户指定的 Apple 式近黑与红色体系：背景 `#0A0A0A`，面板 `#111111`，强调色 `#E10600` / `#FF2D2D`，主文字 `#F5F5F7`，次要文字 `#86868B`。
- 全局缓动使用 `cubic-bezier(0.16, 1, 0.3, 1)`。动画仅使用 `transform`、`opacity`、`filter` 和 `clip-path`，避免布局抖动。
- 禁止大面积纯白色块、浏览器默认蓝色链接和默认蓝色 focus 框。键盘焦点统一为红色 ring。
- Entry 到 Home 的三阶段转场默认播放 1.65 秒，用 `sessionStorage` 防止返回时重复播放，并尊重 `prefers-reduced-motion`。
- 如果用户在 Entry 尚未结束时进入浏览器全屏，会由 `fullscreenchange` 兜底触发转场，避免全屏手势被浏览器吞掉后停留在黑色入口页。
- 当前版本面向中文用户，所有界面文案与无障碍标签使用简体中文；`AI`、`React` 等品牌和技术名词保留原文。
- 能力区右侧使用 `public/portrait.jpg` 作为竖版二寸照头像，按约 `390:567` 比例展示并居中置于说明文字正上方；移动端宽 `320px`、平板 `416px`、桌面宽 `448px`，方形玻璃外壳参考用户提供的浅灰玻璃按钮质感；整体仍服从近黑与红色视觉体系。头像内层使用 `VanillaTilt` 提供幅度约 `4°` 的轻量 3D 鼠标倾斜，关闭陀螺仪，并在 reduced-motion 环境下禁用。
- 能力区标题下方保留三行关于 Codex 辅助产品调研、设计、编码和跨技术门槛实践的说明文字。
- 数据区第一项为 `5+` AI 产品已交付，产品与工程经验使用文本 `8个月`，不套用数字计数器。
- 项目区“全部图片”开关位于标题下方正中央；默认隐藏项目卡片，开启时以开关中心为圆心用 `clip-path: circle()` 揭示原项目网格，图片项在覆盖约 85% 后按每项约 4 帧交错进入，关闭时沿同一圆心收回，不使用独立全屏弹层。手机端图片关闭时，项目容器固定为 `34rem` 高并裁切隐藏网格，让折线图完整收进一屏；开启后解除高度和裁切，项目卡片恢复原有纵向布局。
- 项目图片未开启时，原网格空间展示可自由横向滑动的折线图，不启用强制磁吸；桌面端支持鼠标拖拽平移，触屏保留原生横向滑动。顶部数值使用 `2117` 对应的滚轮计数器并与最接近中心的数据点实时联动，点击数据点时短暂锁定该编号，避免平滑滚动经过边界时被误判成其他点；数值单位显示为 `百万 Tokens`。图片开关开启时，折线图在 `0.68s` 内弹性收缩并淡出，与图片圆形揭示使用同一时长；开关关闭后折线图使用弹簧回弹重新弹出。
- 联系邮箱统一使用 `3495551608@qq.com`，展示文本、`mailto` 链接与复制按钮必须保持同步。
- 页脚所在地固定显示为“广西玉林”。
- 顶部导航在首屏保持透明，滚出首屏后切换为顶部留缝、圆角、半透明黑底与 `backdrop-blur` 磨砂玻璃悬浮条；滚回首屏后恢复透明，移动端展开菜单也包含在同一玻璃面板内。
- 桌面端和移动端导航的“能力 / 数据 / 项目 / 联系”使用 React Bits `RubberSegment`，保留拖动、吸附和回弹；点击后的平滑滚动期间锁定目标选中项，避免经过中间区块时被滚动监听错误改写，滚动结束后再同步真实区块。
- 首页 Hero 背景使用 `src/components/GhostFibers.tsx` 的 WebGL 光纤层，保持用户指定的 `#911120` 红线、`#7d34a0` 紫色辉光等视觉参数；为兼顾滚动性能，使用普通合成层而非全屏混合模式，渲染倍率为 `0.8`、帧率为 `30fps`，滚动期间暂停，离开视口、页面隐藏或 reduced-motion 时停止持续渲染。
- 首页 Hero 主标题使用 `src/components/ParticleText.tsx` 的 Canvas 粒子文字效果，英文文案为 `Make AI More Human.`；进入主页后粒子聚拢成字，支持鼠标排斥、离屏暂停和 reduced-motion 静态呈现。粒子 Canvas 使用独立 GPU 合成层，并在页面滚动期间暂停重绘，避免滚动时产生长帧。
- 首页 Hero 右上区域使用 `src/components/CardSwap.tsx` 的三张玻璃项目卡堆叠切换，卡片约为桌面 Hero 的三分之一宽高，使用 `460 × 320` 的卡面并保留原有近黑底色、GhostFibers 和粒子文字；卡片仅在 `xl` 及以上显示，使用站点红黑玻璃质感，reduced-motion 下保持静态堆叠。
- 能力区标题中的“践”字通过 `RevealText` 的 `anchorCharacter` 暴露稳定 DOM 锚点；`src/components/AnchoredLanyard.tsx` 实时测量该字符位置，并把 React Bits `Lanyard` 的 3D 固定端对齐到字符中心。Lanyard 保持原版 `100vw × 100vh` 画布、原始卡片封面和尺寸，挂绳带使用从用户参考图提取的白色织物纹理 `lanyard-fabric.png`，固定端增加白色金属环，并关闭重复图标纹理；Canvas 保持可接收指针事件，拖拽时记录抓取点偏移，把有限幅度的目标位置写回卡片刚体，松手后保留物理晃动。全屏或高分屏会按约 `300 万` 像素预算自动降低内部渲染倍率，并使用有效的透明占位 PNG，避免无效 WebGL 纹理上传和显存压力导致黑屏。桌面端显示，reduced-motion 下不加载物理动画。
- 能力区主标题位于挂绳 Canvas 上层，白色织带从标题文字后方穿出；标题设置为不接收指针事件，避免影响卡片拖拽。
- 能力区四张卡片进入视口时逐张执行上浮、缩放与去模糊的开场动画，并短暂扫过一条红色细线；同一排错峰进入，`prefers-reduced-motion` 下仅快速淡入。
- 白色吊带和 3D 牌子作为同一个 3D 层；能力区进入视口附近时，以“践”字固定端为缩放原点立即一起弹簧弹出，并保留轻微多次回弹；弹出完成后恢复原有拖拽与物理晃动。
- 能力区使用 `src/components/StrokeText.tsx` 在照片左下外侧展示毛笔字“甘文彬”，靠照片底边对齐；桌面端显示，红色描边、白色填充并随滚动逐字书写，字体优先使用 `Ma Shan Zheng`，回退到系统行楷字体。
- 能力区四张卡片使用 `src/components/BorderGlow.tsx` 的 React Bits 边框光效，按站点红黑体系配置 `#E10600`、`#FF2D2D`、`#911120` 三色，面板底为 `#111111`、圆角 `8px`；鼠标靠近边缘时显示方向性光晕，reduced-motion 下不播放扫光入场。
- 首页鼠标跟随特效使用 React Bits 的 `GlowCursor`：颜色为 `#bf4256` / `#dfa9d1`，使用较短的 `22` 点拖尾、`4.5px` 线宽和收敛后的辉光参数；仅在精细指针设备和非 reduced-motion 环境显示。Canvas 固定覆盖视口且不响应指针事件，鼠标滚轮滚动页面时保持挂载和固定坐标。
- 21st.dev 的 shadcn 命令当时未成功拉取，仅将其公开预览图作为构图参考；不要声称源码已导入。
