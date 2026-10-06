# Design QA

## 参考源与实现截图

- 源视觉：`reference-hero-section-5.png`
- 并排对比：`reference-vs-implementation.png`
- 入口页桌面：`final-entry-desktop.png`
- 入口页移动端：`final-entry-mobile.png`
- 转场 A 桌面与移动端：`final-transition-a-desktop.png`、`final-transition-a-mobile.png`
- 转场 B 桌面与移动端：`final-transition-b-desktop.png`、`final-transition-b-mobile.png`
- 转场 C 桌面与移动端：`final-transition-c-desktop.png`、`final-transition-c-mobile.png`
- 主页 Hero：`final-home-desktop.png`、`final-home-mobile.png`
- 能力区：`final-capabilities-desktop.png`、`final-capabilities-mobile.png`
- 项目区：`final-work-desktop.png`、`final-work-mobile.png`
- 联系区：`final-contact-desktop.png`、`final-contact-mobile.png`

## 视口与状态

- 桌面视口：1440 x 900
- 移动视口：390 x 844
- 覆盖状态：Entry、转场 A 红幕扩张、转场 B 黑幕接管、转场 C 主页揭示、主页 Hero、能力区、项目区、联系区
- 交互状态：键盘 Tab 焦点、移动端导航、复制邮箱、reduced-motion 降级、sessionStorage 跳过入口

## 五类检查

- 字体：全局使用 `-apple-system`、`SF Pro Display`、`Inter` 字体栈；Hero 实测为 600 字重，字距约 `-3.456px`，大标题层级和参考图的强对比排版一致。
- 间距：桌面使用 1440px 内容宽度上限和宽裕的纵向留白；移动端内容保持单列，无横向溢出。实测 `scrollWidth` 为 1430px，小于 1440px 视口。
- 颜色：背景为 `rgb(10, 10, 10)`，主文字为 `rgb(245, 245, 247)`，次要文字为 `rgb(134, 134, 139)`，强调色为 `#E10600` / `#FF2D2D`。没有纯白大面积色块，也没有默认蓝色链接或 focus 框。
- 图片：三张项目图片都从 Unsplash 加载成功，`naturalWidth` 均为 1200px，`complete` 为 true；图片只作为项目卡片氛围层，不承担关键信息。
- 头像：能力区右侧使用个人头像，外圈采用半透明玻璃、内侧高光、底部反射和柔阴影，桌面为 112px、移动端为 80px。
- 文案：入口使用「AI / AI 产品专家」；主页包含能力、数据、项目、联系四段完整中文内容。主页标题和正文语气保持直接、克制，没有占位文案。

## 对比结果

实现保留了参考图的核心构图语言：首屏的品牌字标、居中的强视觉焦点、克制的边框和导航、宽幅大标题与后续内容的向下延展。差异来自用户明确指定的视觉方向：参考图是浅色 21st.dev 页面，实现改为近黑背景、红色强调和 Apple 式暗色留白。

21st.dev 的 shadcn 命令在当前环境未成功拉取，原因是站点访问受限且没有可用的 `API_KEY_21ST`。因此实现没有导入该源码，只使用了参考图的构图语言和用户给出的具体规格。

## 验证

- `npm run typecheck` 通过
- `npm run build` 通过
- `npm run test:sites` 4/4 通过
- 浏览器交互验收通过：转场期间锁定滚动，结束后恢复；返回时通过 sessionStorage 跳过重播；移动菜单可用；复制邮箱可用；reduced-motion 在 400ms 内完成；无控制台错误

final result: passed
