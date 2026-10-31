# 个人简历展示网站

一个纯静态的单页简历站，苹果官网式的逐段展开 + 滚动动效。无构建、无依赖，双击 `index.html` 即可打开。已包含 Cloudflare Pages 部署配置，完整上线与维护流程见 **[DEPLOY.md](./DEPLOY.md)**。

## 文件结构

```
index.html                  页面骨架（只有结构，没有文案）
assets/css/site.css         全部样式与动效
assets/js/resume-data.js    ★ 简历数据，日常只改这个文件
assets/js/main.js           渲染与交互逻辑
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

- **形态**：浅色区块做成浮起的大圆角面板（radius 28–52px），所有内容卡片统一 24–36px 圆角 + 多层柔和阴影，去掉硬边框和 1px 分割线，基本信息从"格子表"改成 8 张独立小卡。
- **点击反馈**：任意卡片、按钮、导航链接、技能标签按下时，从指尖位置扩散一圈水波纹（深色区为白色，浅色区为品牌蓝）。
- **悬停反馈**：卡片有随鼠标移动的柔光斑；"联系我"和联系方式胶囊按钮会被光标轻微"吸"过去；卡片以弹性缓动上浮。
- **滚动动效**：
  - 内容进入视口时上浮 + 轻微过冲回弹（弹簧曲线），卡片按 `--d` 依次错位；
  - 首屏内容随滚动上移并缩小 4.5%，被下一屏"吸"下去；
  - 浅色面板里的柔光团反向视差移动，形成粘连的液态感；
  - 经历时间轴的竖线随滚动"长"出来。
- **性能**：动效全部只改 `opacity` / `transform`，滚动监听走 `requestAnimationFrame` + `passive`，每帧最多读取 4 个元素的位置，不触发重排。
- **无障碍**：尊重 `prefers-reduced-motion`，开启后水波纹、光斑、磁性位移全部关闭，内容直接显示。
- **响应式**：1440 / 1024 / 860 / 560 四档断点，移动端导航收起为全屏目录面板。
- **打印**：`Cmd/Ctrl + P` 输出白底、展开全部内容的干净版本。

## 本地预览

直接双击 `index.html` 即可。若想用本地服务器：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```
