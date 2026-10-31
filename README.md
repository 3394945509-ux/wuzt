# 个人简历展示网站

一个纯静态的单页简历站。浅色通透的版式 + 滚动逐段展开，无构建、无依赖，双击 `index.html` 即可打开。已包含 Cloudflare Pages 部署配置，完整上线与维护流程见 **[DEPLOY.md](./DEPLOY.md)**。

## 文件结构

```
index.html                  页面骨架（只有结构，没有文案）
assets/css/site.css         全部样式与动效
assets/js/resume-data.js    ★ 简历数据，日常只改这个文件
assets/js/main.js           渲染与交互逻辑
assets/images/portrait.jpg  首屏头像（720×794，约 50 KB）
404.html                    未匹配路径的兜底页
robots.txt                  爬虫协议
_headers                    Cloudflare Pages 响应头（安全头 / 缓存 / 预览域 noindex）
_redirects                  Cloudflare Pages 重定向规则
DEPLOY.md                   部署与维护方案
```

> `_headers`、`_redirects` 只在 Cloudflare Pages 上生效，本地打开不会有任何效果，也不会被当作页面资源。`README.md`、`DEPLOY.md` 会被一起上传，已通过 `_redirects` 301 挡在首页之外。

## 怎么更新内容

打开 `assets/js/resume-data.js`，改完保存、刷新页面即可。几个常见操作：

| 想做的事 | 改哪里 |
| --- | --- |
| 换求职意向 | `meta.intent`（数组，多项用 `/` 连接展示） |
| 首屏四个数字 | `stats` |
| 加一条基本信息 | `basics` 里加 `{ label, value }` |
| 换实习单位 / 加一段经历 | `experience` 数组，按 `sections` 分组写要点 |
| 加项目 | `projects`，`points` 里每项是 `{ title, text }` |
| 加技能 | `skills`，`tags` 是关键词标签，`desc` 是详细描述 |
| 加奖项 | `honors`，按组（学业 / 认证 / 综合素质）放 |
| 改导航 | `nav`，`id` 必须和 `index.html` 里的 `<section id="...">` 一致 |

约定：文字里不要写 HTML 标签（会被转义），需要强调就在文案里把数字写清楚。

## 设计说明

- **配色**：浅色底（`#f7fafc`）+ 薄荷绿 / 天蓝的柔和环境光，主色 `mint #12b8a0`、`blue #0a84ff`，正文 `#0f2027`。整站没有深色大色块，只有卡片与留白。
- **排版**：1080px 内容列，标题 clamp 到 54px，正文 15–16px / 1.8 行高；卡片统一 24px 圆角 + 一层极淡描边 + 柔和投影。
- **彩虹涟漪**：`.rainbow-stage` 固定铺满视口，脚本从页面左右边缘随机位置生成涟漪，`conic-gradient` 彩虹 + 径向遮罩成环，7 秒内扩散淡出，同时最多 4 个。
- **滚动动效**：区块进入视口时上浮渐显（`IntersectionObserver`，每项只触发一次），列表条目按 `nth-child` 依次错落；区块标题从轻微模糊中"对焦"变清晰；技能图标按描边路径逐条自绘；首屏内容轻微滞后上移；经历时间轴的竖线随滚动生长。
- **入场序列**（Web Animations，一次性）：导航落下 → 导航项与按钮依次就位 → 徽章弹出 → 姓名从模糊中升起 → 求职意向 → 简介 → 四个数据逐个错位 → 底部提示淡入。
- **性能**：
  - 所有动画只改 `transform` / `opacity`，走合成层；
  - 滚动监听合并进单帧 `requestAnimationFrame` + `passive`，且先读后写；
  - 环境底色用 `position: fixed` 伪元素，避免 `background-attachment: fixed` 在移动端整页重绘；
  - 涟漪动画结束即从 DOM 移除，页面隐藏时暂停生成。
- **无障碍**：尊重 `prefers-reduced-motion`——涟漪层整体关闭，内容直接显示。
- **响应式**：1024 / 860 / 560 三档断点，移动端导航收起为全屏目录面板。
- **打印**：`Cmd/Ctrl + P` 输出白底、内容全展开的干净版本。

## 本地预览

直接双击 `index.html` 即可。若想用本地服务器：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```
