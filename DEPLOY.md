# Cloudflare Pages 部署与维护方案

> 适用项目：伍忠天个人简历站（纯静态单页）
> 本地路径：`E:\OneDrive\桌面\WorkBuddy\2026-10-30-21-48-07`
> 文档更新：2026-10-30

---

## 一、适用范围与前置条件

### 1.1 本文档适用于什么

本文档针对**当前仓库的真实形态**编写，不是通用模板：

| 项目特征 | 实际情况 | 对部署的影响 |
| --- | --- | --- |
| 技术栈 | 原生 HTML + CSS + JS，无框架 | 不需要框架预设 |
| 构建步骤 | 无。没有 `package.json`、没有打包 | 构建命令留空，输出目录即仓库根 |
| 后端 / 接口 | 无。所有内容由 `resume-data.js` 在浏览器端渲染 | 不需要 Pages Functions、不需要环境变量 |
| 体积 | 全站约 10 个文件，未压缩合计约 78 KB | 秒级上传，远低于任何配额 |
| 依赖的外部资源 | 无（字体用系统字体、图标是内联 SVG、无统计脚本） | CDN 回源零外部请求，CSP 可以收得很紧 |

**不适用**：如果以后要做访问统计、在线投递表单、后台改简历，就需要 Pages Functions 或第三方服务，本文档第六、九节的相关结论要重新评估。

### 1.2 前置条件清单

- [ ] Cloudflare 账号（免费版即可，无需绑卡）
- [ ] GitHub 或 GitLab 账号（走 Git 集成时必须；走直传可跳过）
- [ ] 一个域名（**可选**。没有也能用 `xxx.pages.dev`，只是地址不好看、也不利于长期维护）
- [ ] 本地 Node.js 18+（**仅**直传方式需要，用来跑 `npx wrangler`；Git 集成完全不需要本地环境）
- [ ] Git（本地已安装，用于版本管理）

### 1.3 明确不需要准备的东西

这些是常见误解，本项目一个都用不上：

- ❌ 不需要 `npm install`、不需要 `package.json`
- ❌ 不需要指定 Node 版本（`NODE_VERSION` 环境变量）
- ❌ 不需要任何环境变量、密钥、`.env` 文件
- ❌ 不需要数据库、对象存储、Workers 运行时

---

## 二、部署前的准备工作

### 2.1 确认哪些文件会被公开

Cloudflare Pages 会把**输出目录下的所有文件**原样发布到公网。当前根目录内容如下：

| 文件 | 是否公开 | 说明 |
| --- | --- | --- |
| `index.html` | ✅ 公开 | 站点首页 |
| `404.html` | ✅ 公开 | 未匹配路径时自动返回，需放在根目录 |
| `robots.txt` | ✅ 公开 | 爬虫协议 |
| `assets/css/site.css` | ✅ 公开 | 样式 |
| `assets/js/main.js` | ✅ 公开 | 渲染逻辑 |
| `assets/js/resume-data.js` | ✅ 公开 | **简历全部文字都在这里，包括手机号和邮箱** |
| `_headers` | ❌ 不公开 | Pages 解析后不对外提供 |
| `_redirects` | ❌ 不公开 | 同上 |
| `README.md` / `DEPLOY.md` | ⚠️ 会被上传 | 已通过 `_redirects` 301 挡掉，直接访问会跳回首页 |

结论：**仓库里不要放任何不该被看到的东西**。`resume-data.js` 等同于公开文档。

### 2.2 隐私检查（本项目最需要注意的一条）

简历里现在有真实手机号 `15629203881` 和 QQ 邮箱，且 `robots.txt` 允许收录、`_headers` 只对 `pages.dev` 预览域做了 noindex。也就是说：绑定自定义域名并上线后，这份简历**可以被搜索引擎完整索引**，手机号可能被爬虫收集。

三种处理方式，按需选一种：

1. **保持现状**（求职场景最常见，接受被检索）—— 至少确认 `_headers` 里的 `X-Robots-Tag: noindex` 没有误加到正式域名上。
2. **只露邮箱、隐藏手机号** —— 把 `resume-data.js` 里 `contact.phone` 改成 `"可通过邮件索取"`，页面结构和渲染逻辑都不用改。
3. **完全不公开联系方式** —— 把 `index.html` 里 `#contactStrip` 与页脚电话项删掉，改为「简历投递请邮件联系」。

无论选哪种，**都不要**往 `resume-data.js` 里加身份证号、家庭住址、紧急联系人。

### 2.3 本地自测（部署前 5 分钟必做）

在本地目录双击 `index.html`，确认：

- [ ] 首屏名字、求职意向、四个数字正常显示
- [ ] 六个区块能完整滚动到底，页脚联系方式正确
- [ ] 按 F12 → Console 无红色报错；Network 面板无 404
- [ ] 点击卡片有水波纹；滚动有渐入动效
- [ ] 缩到手机宽度（375px）布局不溢出、目录按钮可展开
- [ ] 系统开启「减少动态效果」后，内容仍然全部可见

> 注意：`_headers`、`_redirects` 只在 Cloudflare 上生效，本地打开看不出效果，这是正常的。

### 2.4 初始化 Git 仓库

```bash
cd "E:/OneDrive/桌面/WorkBuddy/2026-10-30-21-48-07"
git init -b main
git add .
git commit -m "init: 简历站首版（含 Pages 部署配置）"
```

推送到 GitHub（先建一个空仓库，不要勾选 README）：

```bash
git remote add origin https://github.com/<你的账号>/<仓库名>.git
git push -u origin main
```

### 2.5 先定路线：Git 集成 还是 直传（这步不可逆）

| | Git 集成 | 直接上传（Wrangler / 拖拽） |
| --- | --- | --- |
| 触发方式 | push 自动部署 | 手动执行命令 |
| 预览环境 | 每个分支/PR 自动生成 | 需手动 `--branch` |
| 版本追溯 | 部署与 commit 一一对应 | 只能看到上传时间 |
| 适合 | 长期维护、会反复改内容 | 一次性发布、不想建仓库 |

⚠️ **两条路线不能互转**。Pages 项目一旦创建为 Direct Upload，就无法再接入 Git 自动部署，反之亦然。简历会持续更新，建议直接选 **Git 集成**。

---

## 三、构建配置

### 3.1 Dashboard 里要填的字段

| 字段 | 填写值 | 说明 |
| --- | --- | --- |
| Project name | `wuzhongtian-resume` | 决定默认域名 `<name>.pages.dev`，创建后只能改显示名，域名不变 |
| Production branch | `main` | 只有这个分支发生产 |
| Framework preset | `None` | 不要选任何框架，选了会带入错误的构建命令 |
| Build command | **留空** | 无构建步骤。若表单强制必填，填 `exit 0` |
| Build output directory | `/` | 仓库根目录即输出目录。填 `.` 也等价；报错时优先试 `/` |
| Root directory (advanced) | `/`（保持默认） | 非 monorepo 不要动 |

### 3.2 环境变量

**不需要任何环境变量。** 原因很具体：

- 页面内容是 `resume-data.js` 里的一个全局对象，在**浏览器端**读取，构建期根本不执行；
- 站点不调用任何 API，没有密钥；
- 静态资源全部本地引用，没有外部 CDN 地址需要注入。

如果你以后要做「同一份代码部署多个版本」（比如投不同岗位的简历），可以考虑引入构建期变量，但那时就应该上 Vite 之类的构建工具了，而不是继续手工改 `resume-data.js`。

### 3.3 仓库内已有的配置文件

| 文件 | 作用 | 生效时机 |
| --- | --- | --- |
| `_headers` | 安全头（CSP、HSTS 等）+ 缓存策略 + 预览域 noindex | 每次部署后立即生效 |
| `_redirects` | `/index.html → /`、挡住 `README.md` / `DEPLOY.md` | 同上 |
| `404.html` | 未匹配路径的兜底页，必须是这个文件名 | 同上 |
| `robots.txt` | 爬虫协议 | 同上 |

这些文件必须放在**输出目录根部**，当前即仓库根目录。

### 3.4 Cloudflare 免费提供的、不需要你配置的东西

- 全球 CDN 与就近接入（Anycast）
- 自动 HTTPS 证书（Cloudflare 签发与续期，品牌可能是 Let's Encrypt 或 Google Trust Services，无需干预）
- Brotli 压缩（对 CSS/JS/HTML 自动生效，上述 78 KB 传输时约 19 KB）
- HTTP/2、HTTP/3
- 每次部署的独立预览 URL 与回滚能力

---

## 四、部署流程 A：Git 集成（推荐）

1. 登录 Cloudflare Dashboard → 左侧 **Workers & Pages**。
2. **Create application** → 切到 **Pages** 标签 → **Connect to Git**。
3. 选择 GitHub（或 GitLab），授权后选中刚推送的仓库。
4. **Begin setup**，按下表填写（与 3.1 完全一致）：

   ```
   Project name           : wuzhongtian-resume
   Production branch      : main
   Framework preset       : None
   Build command          : （留空）
   Build output directory : /
   ```

5. **Save and Deploy**。首次构建通常在 20–60 秒内完成。
6. 构建日志出现 `Success: Your site was deployed!` 后，点击给出的 `https://wuzhongtian-resume.pages.dev`。
7. 回到项目页 → **Settings → Builds & deployments**，确认 Production branch 是 `main`，且自动部署处于开启状态。
8. 之后每次更新：改文件 → `git commit` → `git push origin main`，自动重新部署。

**日常更新命令模板**

```bash
cd "E:/OneDrive/桌面/WorkBuddy/2026-10-30-21-48-07"
git add -A
git commit -m "content: 更新实习业绩数据"
git push
```

---

## 五、部署流程 B：直接上传（Wrangler）

适合不想建仓库、只想先上线看看的情况。前提：本地有 Node 18+。

```bash
# 1. 登录（浏览器授权一次即可）
npx wrangler login

# 2. 创建项目（只需一次；生产分支设为 main）
npx wrangler pages project create wuzhongtian-resume --production-branch=main

# 3. 部署到生产（在项目根目录执行，"." 表示当前目录即输出目录）
cd "E:/OneDrive/桌面/WorkBuddy/2026-10-30-21-48-07"
npx wrangler pages deploy . --project-name=wuzhongtian-resume

# 4. 发一个预览版本（不覆盖生产）
npx wrangler pages deploy . --project-name=wuzhongtian-resume --branch=preview

# 5. 查看部署历史
npx wrangler pages deployment list
```

拖拽上传也行：Dashboard → Create application → **Drag and drop your files** → 把整个文件夹拖进去。拖拽方式单次上限 1000 个文件（本项目约 10 个，无所谓），但不支持 Git 集成，也无法后续接入。

⚠️ 用这种方式，`_headers` / `_redirects` 会被一起上传并生效，前提是它们确实在拖进去的那个目录里。

---

## 六、自定义域名与 HTTPS

### 6.1 绑定域名

1. 项目 → **Custom domains** → **Set up a custom domain**。
2. 输入 `www.你的域名.com`（推荐用 www 作为主域，apex 做跳转）或直接 `你的域名.com`。
3. **域名已托管在 Cloudflare**：系统自动写入 CNAME，等待状态变成 `Active`。
4. **域名在别处**：按提示到域名商添加 CNAME 指向 `wuzhongtian-resume.pages.dev`。注意 apex 域（`example.com`）通常不允许 CNAME，需要域名商支持 ALIAS/ANAME，或者把域名 NS 迁到 Cloudflare。
5. 证书自动签发，一般 1–5 分钟；超过 24 小时仍 `Pending` 就去检查 DNS 是否被别的记录占用。

### 6.2 建议同时打开的开关

| 设置 | 位置 | 作用 |
| --- | --- | --- |
| Always Use HTTPS | SSL/TLS → Edge Certificates | HTTP 自动跳 HTTPS |
| Automatic HTTPS Rewrites | 同上 | 修正页面内可能出现的 http 引用 |
| HSTS | 同上，或由 `_headers` 下发 | 已写在 `_headers` 里（`max-age=31536000`） |
| www ↔ apex 归一 | Rules → Redirect Rules | 只保留一个主域，另一个 301 过去，避免重复内容 |

### 6.3 顺序提醒

先绑域名、确认 `https://你的域名` 能正常打开，**再**去改 `robots.txt` 里的 Sitemap 地址和 `_headers` 里的域名相关规则。域名没定就写死，后面要改两处。

---

## 七、验证部署是否成功

### 7.1 看构建日志

Dashboard → 项目 → **Deployments** → 点最新一条 → **View build log**，确认：

- 状态是 **Success**，不是 Failed / Canceled
- 日志末尾有 `Success: Your site was deployed!` 和上传文件数（本项目含配置文件约 10 个）
- 没有 `Error:` 开头的行；警告可以暂时忽略，但要扫一眼是不是路径大小写问题

失败最常见的原因是构建命令被填成了 `npm run build`（本项目没有 `package.json`，必然失败）。

### 7.2 访问域名

按顺序验证三个地址：

1. `https://wuzhongtian-resume.pages.dev` —— 默认域名
2. `https://你的域名` —— 自定义域名（证书是否生效）
3. 手机用 4G 网络打开一次 —— 绕过本地缓存和公司网络

每个地址都要确认：首屏名字与求职意向出现、六个区块可滚动、页脚邮箱电话正确、控制台无报错。

### 7.3 用命令行核对响应头（最能发现配置问题）

```bash
# 首页：应看到 CSP、HSTS、Cache-Control: max-age=0
curl -I https://你的域名/

# 静态资源：应看到 max-age=600
curl -I https://你的域名/assets/css/site.css

# 数据文件：确认能取到、且是 JS 而非 404
curl -s -o /dev/null -w "%{http_code}\n" https://你的域名/assets/js/resume-data.js   # 期望 200

# _headers 不应被当作静态文件提供
curl -s -o /dev/null -w "%{http_code}\n" https://你的域名/_headers                    # 期望 404 或 301

# 说明文件应被挡掉
curl -I https://你的域名/DEPLOY.md | head -3                                          # 期望 301

# 404 兜底页
curl -s -o /dev/null -w "%{http_code}\n" https://你的域名/不存在的路径                  # 期望 404
```

首页响应头里应该能看到 `content-security-policy`、`strict-transport-security`、`x-content-type-options`。如果一条都没有，说明 `_headers` 没被识别：检查文件名是否带扩展名（必须是 `_headers`，不是 `_headers.txt`）、是否在输出目录根部。

### 7.4 确认「环境变量是否正常」

本项目没有环境变量，所以正确的验证结果是「无论如何都不影响」：

- 构建日志里不会出现 `Environment variables` 注入记录；
- 页面打开后 Network 面板只有 3 个请求（html / css / 2 个 js），没有任何 XHR；
- 换一台从没登录过 Cloudflare 的设备打开，内容一致。

反过来，如果哪天你发现页面某处显示 `undefined` 或空白，先检查 `resume-data.js` 的字段名是否被改错，而不是怀疑环境变量。

### 7.5 验证缓存与更新是否生效

1. 改 `resume-data.js` 里任意一句话，push。
2. 等部署完成（Deployments 变成 Success）。
3. 浏览器**普通刷新**（不按 Ctrl+F5）看内容是否更新。HTML 是 `max-age=0`，应当立即更新；CSS/JS 有 10 分钟缓存，可能滞后。
4. 若样式没更新，按下面「资源版本串」处理。

---

## 八、后期维护约定

### 8.1 分支与发布

- `main` = 生产环境，只接受已验证的改动。
- 其他分支 = 预览环境，自动获得 `https://<分支名>.wuzhongtian-resume.pages.dev`。
- 大改版（换配色、改结构）先开 `redesign/xxx` 分支，预览确认后再合回 `main`。

### 8.2 提交信息

统一前缀，方便回溯和写「更新说明」：

```
content: 更新实习业绩描述
style: 调整卡片圆角与阴影
fix: 修复移动端导航层级问题
chore: 补充部署文档
```

### 8.3 内容更新四步法

1. 打开 `assets/js/resume-data.js`，只改这一个文件；
2. 同步更新 `meta.updated`（页脚会显示「更新时间」）；
3. 本地双击 `index.html` 看一眼；
4. `git add -A && git commit -m "content: ..." && git push`。

### 8.4 资源版本串（可选，但推荐在样式改动后用）

因为文件名没有内容哈希，浏览器可能吃到 10 分钟内的旧 CSS。改版后如果发现「自己看是新的、别人看是旧的」：

```html
<link rel="stylesheet" href="assets/css/site.css?v=20261030" />
<script src="assets/js/main.js?v=20261030"></script>
```

把 `?v=` 后面的数字改成当天日期，旧缓存自然失效。不必每次改文案都做。

### 8.5 回滚

Dashboard → Deployments → 找到上一个正常版本 → 右侧菜单 → **Rollback to this deployment**。回滚是秒级的，不需要重新构建。

### 8.6 版本打点

每学期末（或每次大更新后）打一个 tag，方便日后对比：

```bash
git tag -a v2026-fall -m "2026 秋季版：新增检测实习"
git push --tags
```

### 8.7 配额与例行检查

免费版硬指标（2026-10 官方限额）：500 次构建/月、单次构建 20 分钟超时、20000 个文件、单文件 25 MiB、100 个自定义域名、100 个 Pages 项目。

按每周更新 2 次算，一年约 100 次构建，**远未接近配额**。每季度花 5 分钟检查：

- [ ] 部署历史没有意外失败
- [ ] 域名证书状态 Active
- [ ] 首页 Lighthouse 分数没有明显下滑
- [ ] 联系方式、实习状态、`meta.updated` 仍然准确
- [ ] 404 页与外部链接可用

### 8.8 不要做的事

- 不要把身份证、住址、银行信息写进 `resume-data.js`
- 不要在仓库里提交任何密钥（本项目暂时也没有）
- 不要为了「快」把 `/assets/*` 设成 `immutable`——文件名没哈希，会导致用户长期看不到更新
- 不要绑定域名后随手删项目：删项目会丢部署历史，且自定义域名要先移除 CNAME

---

## 九、关键注意事项与常见风险

| # | 风险 | 具体表现 | 应对 |
| --- | --- | --- | --- |
| 1 | **内容全靠 JS 渲染** | 禁用 JS 或爬虫不执行 JS 时，`<body>` 基本是空的；目前只有一个 `<noscript>` 提示 | 短期接受（求职场景问题不大）；中期可在部署前用脚本把数据预渲染成静态 HTML；长期建议上 Vite + SSG |
| 2 | 文件名无哈希 + 缓存 | 改完样式自己看到旧的 | HTML 用 `max-age=0`；资源改版后加 `?v=日期`；不要用 `immutable` |
| 3 | 路径大小写 | Windows 本地不敏感，CDN 敏感。`Assets/CSS/Site.css` 在本地能开，线上 404 | 全部用相对小写路径，提交前 `git status` 看一眼有没有改名 |
| 4 | 隐私外泄 | 手机号邮箱对全网可见、可被检索 | 见 2.2；至少确认预览域已 noindex |
| 5 | 路线选错 | 选了直传，后面想接 GitHub 自动部署，只能重建项目 | 决定前先读 2.5；简历会长期更新，选 Git 集成 |
| 6 | 预览域被收录 | `*.pages.dev` 和 `<分支>.<项目>.pages.dev` 公开可访问 | `_headers` 已加 `X-Robots-Tag: noindex`；如需更强控制，用 Cloudflare Access 给预览域加登录 |
| 7 | CSP 误伤 | 以后加统计脚本、Google Fonts、嵌入视频，页面直接白屏 | 加任何第三方前先改 `_headers` 的 CSP，或临时注释该行验证 |
| 8 | 域名与 DNS | apex 域不能直接 CNAME，证书卡 Pending | 用 www 作主域，或把 NS 迁到 Cloudflare |
| 9 | 国内访问 | Cloudflare 免费版在国内线路质量不稳定，可能偶发慢或打不开 | 求职场景通常可接受；重要场合备一份 PDF 简历直发 |
| 10 | 新账号限制 | 注册 48 小时内创建项目数量受限 | 一次性把项目建好，别反复删建 |

---

## 十、一页速查

```text
构建命令        ：（留空）或 exit 0
输出目录        ：/
框架预设        ：None
环境变量        ：无
需要 Node       ：Git 集成不需要；wrangler 直传需要 18+
必需配置文件    ：_headers / _redirects / 404.html / robots.txt（均在根目录）
默认域名        ：https://<项目名>.pages.dev
更新方式        ：git push origin main（自动） 或 npx wrangler pages deploy .
验证三连        ：看构建日志 Success → 开域名 → curl -I 查响应头
出问题先回滚    ：Deployments → Rollback to this deployment
```
