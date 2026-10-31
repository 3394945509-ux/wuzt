/* ============================================================================
 * 渲染与交互（清新版）
 * 文案全部来自 assets/js/resume-data.js，这里只负责结构与动效。
 * 性能约定：
 *   1. 所有动画只改 transform / opacity；
 *   2. 滚动相关计算合并进同一帧 rAF，先读后写，避免布局抖动；
 *   3. 装饰性彩虹涟漪最多同时存在 4 个，动画结束即销毁。
 * ========================================================================== */
(function () {
  "use strict";

  var D = window.RESUME_DATA;
  if (!D) {
    console.error("[resume] 未找到 resume-data.js");
    return;
  }

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- 小工具 ---------------- */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function el(tag, className, html) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function delay(i, step) {
    return (i * (step || 0.05)).toFixed(2) + "s";
  }

  /* ---------------- 图标 ---------------- */
  var ICONS = {
    network:
      '<circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M10.7 6.7 6.3 15.9M13.3 6.7l4.4 9.2M7.2 18h9.6"/>',
    device: '<path d="M3 15h3l2.4-7 3 12 2.6-9 2 4h5"/>',
    data:
      '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6"/><path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6"/>',
    code: '<path d="M9.5 8 5.5 12l4 4M14.5 8l4 4-4 4"/>',
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.network) + "</svg>";
  }

  /* ---------------- 区块标题 ---------------- */
  function renderHeads() {
    Object.keys(D.sections).forEach(function (id) {
      var sec = document.getElementById(id);
      if (!sec) return;
      var head = $(".sec-head", sec);
      if (!head) return;
      var s = D.sections[id];
      head.innerHTML =
        '<p class="sec-eyebrow">' +
        esc(s.eyebrow) +
        '</p><h2 class="sec-title">' +
        esc(s.title) +
        '</h2><p class="sec-lead">' +
        esc(s.lead) +
        "</p>";
    });
  }

  /* ---------------- 首屏 ---------------- */
  function renderHero() {
    $("#heroName").textContent = D.meta.name;
    $("#navName").textContent = D.meta.name;
    $("#heroHeadline").textContent = D.meta.headline;
    $("#heroIntent").textContent = D.meta.intent.join(" / ");
    $("#heroIntro").textContent = D.meta.intro;
    document.title = D.meta.name + " · " + D.meta.intent.join(" / ") + " · 个人简历";

    $("#heroStats").innerHTML = D.stats
      .map(function (s) {
        return (
          '<div class="stat"><p class="stat-num">' +
          esc(s.num) +
          (s.unit ? "<em>" + esc(s.unit) + "</em>" : "") +
          '</p><p class="stat-label">' +
          esc(s.label) +
          "</p></div>"
        );
      })
      .join("");
  }

  /* ---------------- 基本信息 ---------------- */
  function renderBasics() {
    $("#facts").innerHTML = D.basics
      .map(function (b) {
        return (
          '<div class="fact' +
          (b.strong ? " fact--strong" : "") +
          '"><p class="fact-label">' +
          esc(b.label) +
          '</p><p class="fact-value">' +
          esc(b.value) +
          "</p></div>"
        );
      })
      .join("");

    var c = D.contact;
    $("#contactStrip").innerHTML =
      '<a class="chip-btn" href="mailto:' +
      esc(c.email) +
      '"><span>邮箱</span>' +
      esc(c.email) +
      "</a>" +
      '<a class="chip-btn" href="tel:' +
      esc(c.phone) +
      '"><span>电话</span>' +
      esc(c.phone) +
      "</a>" +
      '<div class="chip-btn"><span>所在地</span>' +
      esc(c.city) +
      "</div>";
  }

  /* ---------------- 教育背景 ---------------- */
  function renderEducation() {
    var e = D.education;
    $("#eduCard").innerHTML =
      '<div class="edu-head"><div><h3 class="edu-school">' +
      esc(e.school) +
      '</h3><div class="edu-major">' +
      esc(e.major) +
      '<span class="tag">' +
      esc(e.degree) +
      "</span></div></div>" +
      '<p class="edu-period">' +
      esc(e.period) +
      "</p></div>" +
      '<p class="edu-note">' +
      esc(e.note) +
      "</p>" +
      '<p class="course-label">主修课程</p><div class="courses">' +
      e.courses
        .map(function (c) {
          return '<span class="course">' + esc(c) + "</span>";
        })
        .join("") +
      "</div>";
  }

  /* ---------------- 工作经历 ---------------- */
  function renderExperience() {
    $("#timeline").innerHTML = D.experience
      .map(function (job, i) {
        var blocks = job.sections
          .map(function (b) {
            return (
              '<div class="exp-block' +
              (b.emphasis ? " exp-block--emphasis" : "") +
              '"><p class="exp-block-title">' +
              esc(b.title) +
              '</p><ul class="bullets">' +
              b.items
                .map(function (t) {
                  return "<li>" + esc(t) + "</li>";
                })
                .join("") +
              "</ul></div>"
            );
          })
          .join("");

        return (
          '<div class="exp-item" data-reveal="up" style="--d:' +
          delay(i, 0.06) +
          '"><span class="exp-dot" aria-hidden="true"></span>' +
          '<article class="exp-card"><div class="exp-head">' +
          '<h3 class="exp-company">' +
          esc(job.company) +
          '</h3><span class="exp-role">' +
          esc(job.role) +
          "</span>" +
          (job.badge ? '<span class="badge-live">' + esc(job.badge) + "</span>" : "") +
          '<span class="exp-period">' +
          esc(job.period) +
          "</span></div>" +
          blocks +
          "</article></div>"
        );
      })
      .join("");
  }

  /* ---------------- 项目经历 ---------------- */
  function renderProjects() {
    $("#projectGrid").innerHTML = D.projects
      .map(function (p, i) {
        var points = p.points
          .map(function (pt, j) {
            return (
              '<li><p class="pp-title"><span>0' +
              (j + 1) +
              "</span>" +
              esc(pt.title) +
              '</p><p class="pp-text">' +
              esc(pt.text) +
              "</p></li>"
            );
          })
          .join("");

        return (
          '<article class="project-card" data-reveal="up" style="--d:' +
          delay(i, 0.08) +
          '"><div class="project-top"><span>' +
          esc(p.period) +
          "</span>" +
          (p.result ? '<span class="project-result">' + esc(p.result) + "</span>" : "") +
          '</div><h3 class="project-name">' +
          esc(p.name) +
          '</h3><p class="project-role">' +
          esc(p.role) +
          '</p><ul class="project-points">' +
          points +
          "</ul></article>"
        );
      })
      .join("");
  }

  /* ---------------- 技能 ---------------- */
  function renderSkills() {
    $("#skillGrid").innerHTML = D.skills
      .map(function (s, i) {
        return (
          '<article class="skill-card" data-reveal="up" style="--d:' +
          delay(i) +
          '"><div class="skill-icon">' +
          icon(s.icon) +
          '</div><h3 class="skill-name">' +
          esc(s.name) +
          '</h3><div class="skill-tags">' +
          s.tags
            .map(function (t) {
              return '<span class="skill-tag">' + esc(t) + "</span>";
            })
            .join("") +
          '</div><p class="skill-desc">' +
          esc(s.desc) +
          "</p></article>"
        );
      })
      .join("");
  }

  /* ---------------- 荣誉分组 ---------------- */
  function renderHonors() {
    $("#honorGrid").innerHTML = D.honors
      .map(function (g, i) {
        return (
          '<article class="honor-card" data-reveal="up" style="--d:' +
          delay(i) +
          '"><p class="honor-title">' +
          esc(g.title) +
          '</p><ul class="honor-list">' +
          g.items
            .map(function (it) {
              return (
                '<li><span class="honor-year">' +
                esc(it.year) +
                "</span><span>" +
                esc(it.text) +
                "</span></li>"
              );
            })
            .join("") +
          "</ul></article>"
        );
      })
      .join("");
  }

  /* ---------------- 亮点 ---------------- */
  function renderHighlights() {
    var h = D.highlights;
    if (!h) return;

    var stats = $("#hlStats");
    if (stats) {
      stats.innerHTML = h.stats
        .map(function (s) {
          return (
            '<div class="hl-stat"><p class="hl-num">' +
            esc(s.num) +
            "<em>" +
            esc(s.unit) +
            '</em></p><p class="hl-label">' +
            esc(s.label) +
            "</p></div>"
          );
        })
        .join("");
    }

    var list = $("#hlList");
    if (list) {
      list.innerHTML = h.items
        .map(function (it, i) {
          return (
            '<article class="hl-item" data-reveal="up" style="--d:' +
            delay(i, 0.08) +
            '"><span class="hl-index">0' +
            (i + 1) +
            '</span><h3 class="hl-title">' +
            esc(it.title) +
            '</h3><p class="hl-text">' +
            esc(it.text) +
            '</p><p class="hl-proof">' +
            esc(it.proof) +
            "</p></article>"
          );
        })
        .join("");
    }

    var closing = $("#hlClosing");
    if (closing) closing.textContent = h.closing;
  }

  /* ---------------- 个人优势 ---------------- */
  function renderStrengths() {
    $("#strengthList").innerHTML = D.strengths
      .map(function (s, i) {
        return (
          '<div class="strength-row" data-reveal="up" style="--d:' +
          delay(i, 0.08) +
          '"><p class="strength-index">0' +
          (i + 1) +
          '</p><h3 class="strength-title">' +
          esc(s.title) +
          '</h3><p class="strength-text">' +
          esc(s.text) +
          "</p></div>"
        );
      })
      .join("");
  }

  /* ---------------- 导航 ---------------- */
  function renderNav() {
    var links = $("#navLinks");
    var panel = $("#menuPanelLinks");

    D.nav.forEach(function (n) {
      var a = el("a", "nav-link", esc(n.label));
      a.href = "#" + n.id;
      a.dataset.target = n.id;
      links.appendChild(a);
    });

    D.nav.forEach(function (n, i) {
      var a = el("a", null, "<i>0" + (i + 1) + "</i>" + esc(n.label));
      a.href = "#" + n.id;
      panel.appendChild(a);
    });
  }

  /* ---------------- 页脚 ---------------- */
  function renderFooter() {
    var mail = $("#footMail");
    mail.href = "mailto:" + D.contact.email;
    $(".footer-link-value", mail).textContent = D.contact.email;

    var tel = $("#footTel");
    tel.href = "tel:" + D.contact.phone;
    $(".footer-link-value", tel).textContent = D.contact.phone;

    $("#footCity").textContent = D.contact.city;
    $("#footCopy").textContent =
      "© " + new Date().getFullYear() + " " + D.meta.name + " · 更新时间 " + D.meta.updated;
  }

  /* ---------------- 滚动揭示 ---------------- */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (n) {
        n.classList.add("is-in");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            onRevealed(entries[i].target);
            io.unobserve(entries[i].target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );

    items.forEach(function (n) {
      io.observe(n);
    });
  }

  /* 元素进入视口后的附加动效：标题对焦、图标描边自绘 */
  function onRevealed(node) {
    node.classList.add("is-in");

    var icon = node.querySelector ? node.querySelector(".skill-icon svg") : null;
    if (icon) drawIcon(icon);

    if (node.classList.contains("sec-head")) {
      var title = node.querySelector(".sec-title");
      if (title) focusIn(title);
    }
  }

  /* ---------------- 滚动：进度 / 导航 / 视差 / 时间轴 ---------------- */
  function initScroll() {
    var nav = $("#nav");
    var hero = $("#top");
    var heroInner = $(".hero-inner");
    var heroName = $(".hero-name");
    var bar = $("#progressBar");
    var timeline = $("#timeline");
    var maxScroll = 1;
    var ticking = false;

    function measure() {
      maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    }

    function update() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var heroH = hero ? hero.offsetHeight : 0;

      nav.classList.toggle("is-solid", y > 40);

      bar.style.transform = "scaleX(" + Math.min(1, y / maxScroll).toFixed(4) + ")";

      // 首屏内容轻微滞后上移，滑出后不再计算
      if (heroInner && !reduceMotion) {
        if (y < heroH) {
          heroInner.style.transform = "translate3d(0," + (y * 0.12).toFixed(1) + "px,0)";
        } else if (heroInner.style.transform) {
          heroInner.style.transform = "";
        }
      }

      // 名字背后的彩虹光随下滑向外扩散（只改 transform / opacity，不触发重绘）
      if (heroName && !reduceMotion && y < heroH) {
        var spread = Math.min(1, y / Math.max(heroH * 0.8, 1));
        heroName.style.setProperty("--glow-scale", (1 + spread * 1.3).toFixed(3));
        heroName.style.setProperty("--glow-op", (0.32 + spread * 0.3).toFixed(3));
      }

      // 时间轴竖线随滚动生长
      if (timeline && !reduceMotion) {
        var tr = timeline.getBoundingClientRect();
        if (tr.bottom > 0 && tr.top < window.innerHeight) {
          var p = (window.innerHeight * 0.82 - tr.top) / Math.max(tr.height, 1);
          timeline.style.setProperty(
            "--line-scale",
            Math.max(0.04, Math.min(1, p)).toFixed(3)
          );
        }
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      measure();
      onScroll();
    });
    window.addEventListener("load", function () {
      measure();
      onScroll();
    });

    measure();
    update();
  }

  /* ---------------- 滚动挤压：方块随方向形变 ---------------- */
  function initSquash() {
    if (reduceMotion) return;
    // 用独立的 scale 属性，不去碰 [data-reveal] 的 transform，两者可以叠加
    if (!window.CSS || !CSS.supports || !CSS.supports("scale", "1 1")) return;

    var cards = Array.prototype.slice.call(
      document.querySelectorAll(
        ".edu-card, .exp-card, .project-card, .skill-card, .honor-card, .hl-item"
      )
    );
    if (!cards.length) return;

    var visible = [];
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            var t = entries[i].target;
            var at = visible.indexOf(t);
            if (entries[i].isIntersecting) {
              if (at === -1) visible.push(t);
            } else {
              if (at >= 0) visible.splice(at, 1);
              t.style.scale = "";
            }
          }
        },
        { rootMargin: "12% 0px 12% 0px" }
      );
      cards.forEach(function (c) {
        io.observe(c);
      });
    } else {
      visible = cards.slice();
    }

    var k = 0; // −1（向上）… 0（静止）… 1（向下）
    var running = false;
    var lastY = window.pageYOffset || document.documentElement.scrollTop || 0;

    function paint() {
      var a = Math.min(1, Math.abs(k));
      var sx, sy;
      if (k >= 0) {
        // 向下：放大，横向撑开、纵向压扁
        sx = 1 + 0.055 * a;
        sy = 1 - 0.04 * a;
      } else {
        // 向上：整体收小，纵向再回收一点
        sx = 1 - 0.05 * a;
        sy = 1 - 0.032 * a;
      }
      var v = sx.toFixed(4) + " " + sy.toFixed(4);
      for (var i = 0; i < visible.length; i++) visible[i].style.scale = v;
    }

    function step() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var dy = y - lastY;
      lastY = y;

      // 每帧位移映射到 −1..1，约 40px/帧 到满格
      var target = dy / 40;
      if (target > 1) target = 1;
      else if (target < -1) target = -1;

      k += (target - k) * 0.34;
      paint();

      if (Math.abs(k) > 0.004 || Math.abs(target) > 0.004) {
        window.requestAnimationFrame(step);
      } else {
        k = 0;
        paint();
        running = false;
      }
    }

    function kick() {
      if (running) return;
      running = true;
      // 重新对齐基准，避免停顿后第一帧算出巨大的 dy
      lastY = window.pageYOffset || document.documentElement.scrollTop || 0;
      window.requestAnimationFrame(step);
    }

    window.addEventListener("scroll", kick, { passive: true });
  }

  /* ---------------- 当前区块高亮 ---------------- */
  function initActiveSection() {
    if (!("IntersectionObserver" in window)) return;

    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
    var map = {};
    links.forEach(function (l) {
      map[l.dataset.target] = l;
    });

    var io = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          if (!entry.isIntersecting) continue;
          var link = map[entry.target.id];
          if (!link) continue;
          links.forEach(function (l) {
            l.classList.remove("is-active");
          });
          link.classList.add("is-active");
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    document.querySelectorAll("[data-section]").forEach(function (s) {
      io.observe(s);
    });
  }

  /* ---------------- 移动端目录 ---------------- */
  function initMenu() {
    var btn = $("#menuBtn");
    var panel = $("#menuPanel");
    if (!btn || !panel) return;

    function setOpen(open) {
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "关闭目录" : "打开目录");
      panel.classList.toggle("is-open", open);
      panel.setAttribute("aria-hidden", String(!open));
      document.body.style.overflow = open ? "hidden" : "";
    }

    btn.addEventListener("click", function () {
      setOpen(btn.getAttribute("aria-expanded") !== "true");
    });

    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860 && panel.classList.contains("is-open")) setOpen(false);
    });
  }

  /* ---------------- 彩虹涟漪 ---------------- */
  function initRainbow() {
    var stage = $("#rainbowStage");
    if (!stage || reduceMotion) return;

    var MAX = 4;
    var live = 0;
    var timer = null;

    function schedule(ms) {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(spawn, ms);
    }

    function spawn() {
      if (document.hidden || live >= MAX) {
        schedule(1800 + Math.random() * 1600);
        return;
      }

      var fromLeft = Math.random() < 0.5;
      var node = document.createElement("div");
      node.className = "rainbow-ripple";

      // 贴边出现：左 −6%~0%，右 100%~106%
      node.style.left = (fromLeft ? -6 + Math.random() * 8 : 98 + Math.random() * 8).toFixed(2) + "%";
      node.style.top = (10 + Math.random() * 78).toFixed(2) + "%";
      node.style.animationDuration = (6.4 + Math.random() * 2.4).toFixed(2) + "s";
      node.style.setProperty("--spin", Math.round(Math.random() * 360) + "deg");
      node.style.setProperty("--peak", (0.3 + Math.random() * 0.2).toFixed(2));

      live++;
      stage.appendChild(node);

      node.addEventListener("animationend", function () {
        node.remove();
        live--;
      });

      schedule(2400 + Math.random() * 2200);
    }

    // 首屏稍等一下再出现，避免和入场动画抢注意力
    schedule(reduceMotion ? 999999 : 1400);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && timer) {
        window.clearTimeout(timer);
        timer = null;
      } else if (!document.hidden && !timer) {
        schedule(1200);
      }
    });
  }

  /* ---------------- 入场序列（Web Animations） ---------------- */
  var canAnimate =
    typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
  var EASE_OUT = "cubic-bezier(.16, 1, .3, 1)";

  function play(node, frames, opts) {
    if (!node || !canAnimate) return null;
    return node.animate(frames, opts);
  }

  /* 标题对焦：从模糊里浮出来 */
  function focusIn(node) {
    play(node, [{ filter: "blur(8px)" }, { filter: "blur(0px)" }], {
      duration: 900,
      easing: EASE_OUT,
      fill: "both",
    });
  }

  /* 图标描边：先把线藏起来，露出后再逐条画出来 */
  function prepIcons() {
    if (!canAnimate || reduceMotion) return;
    document.querySelectorAll(".skill-icon svg").forEach(function (svg) {
      svg.querySelectorAll("path, circle, ellipse, line").forEach(function (shape) {
        var len = 0;
        try {
          len = shape.getTotalLength();
        } catch (e) {
          return;
        }
        if (!len) return;
        shape.style.strokeDasharray = len + " " + len;
        shape.style.strokeDashoffset = len;
      });
    });
  }

  function drawIcon(svg) {
    if (!canAnimate || reduceMotion) return;
    svg.querySelectorAll("path, circle, ellipse, line").forEach(function (shape, i) {
      if (!shape.style.strokeDasharray) return;
      play(
        shape,
        [
          { strokeDashoffset: parseFloat(shape.style.strokeDashoffset) || 0 },
          { strokeDashoffset: 0 },
        ],
        { duration: 760, delay: i * 90, easing: "ease-out", fill: "both" }
      );
    });
  }

  /* 打开页面的一次性入场：导航落下 → 徽章弹出 → 标题从模糊里升起 → 正文 → 数据 → 提示 */
  function initEntrance() {
    // 老浏览器没有 Web Animations：直接显示，避免首屏停在隐藏态
    if (!canAnimate) {
      document.querySelectorAll(".hero-anim").forEach(function (n) {
        n.style.opacity = "1";
      });
      return;
    }
    if (reduceMotion) return;

    var nav = $(".nav");
    var cta = $(".nav-cta");
    var links = document.querySelectorAll(".nav-link");
    var eyebrow = $(".hero-eyebrow");
    var name = $(".hero-name");
    var intent = $(".hero-intent");
    var intro = $(".hero-intro");
    var stats = $(".hero-stats");
    var cue = $(".scroll-cue");

    play(
      nav,
      [
        { transform: "translate3d(0,-100%,0)", opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 720, easing: EASE_OUT, fill: "both" }
    );

    Array.prototype.forEach.call(links, function (l, i) {
      play(
        l,
        [
          { transform: "translate3d(0,-8px,0)", opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 520, delay: 140 + i * 45, easing: EASE_OUT, fill: "both" }
      );
    });

    play(
      cta,
      [{ transform: "scale(.86)", opacity: 0 }, { transform: "none", opacity: 1 }],
      { duration: 560, delay: 360, easing: EASE_OUT, fill: "both" }
    );

    play(
      eyebrow,
      [
        { transform: "scale(.86)", opacity: 0 },
        { transform: "scale(1.04)", opacity: 1, offset: 0.68 },
        { transform: "scale(1)", opacity: 1 },
      ],
      { duration: 660, delay: 170, easing: "cubic-bezier(.34,1.3,.64,1)", fill: "both" }
    );

    // 姓名是 background-clip:text 的渐变文字，叠加 filter 或 scale 在部分引擎里
    // 会把渐变渲染成色块 / 发虚，所以只用位移 + 透明度过场，最稳
    var nameAnim = play(
      name,
      [
        { transform: "translate3d(0,26px,0)", opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 1040, delay: 280, easing: EASE_OUT, fill: "both" }
    );

    // 入场结束后才点亮名字背后的彩虹光，避免淡入期间外发光糊住文字
    if (name && nameAnim) {
      nameAnim.onfinish = function () {
        name.classList.add("is-lit");
      };
      window.setTimeout(function () {
        name.classList.add("is-lit");
      }, 1500);
    }

    play(
      intent,
      [
        { filter: "blur(6px)", transform: "translate3d(0,18px,0)", opacity: 0 },
        { filter: "blur(0px)", transform: "none", opacity: 1 },
      ],
      { duration: 820, delay: 430, easing: EASE_OUT, fill: "both" }
    );

    play(
      intro,
      [
        { transform: "translate3d(0,16px,0)", opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 820, delay: 540, easing: EASE_OUT, fill: "both" }
    );

    play(
      $(".hero-portrait"),
      [
        { transform: "translate3d(0,22px,0) scale(.955)", opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 940, delay: 500, easing: EASE_OUT, fill: "both" }
    );

    play(stats, [{ opacity: 0 }, { opacity: 1 }], {
      duration: 600,
      delay: 640,
      easing: "linear",
      fill: "both",
    });

    Array.prototype.forEach.call(
      stats ? stats.querySelectorAll(".stat") : [],
      function (s, i) {
        play(
          s,
          [
            { transform: "translate3d(0,14px,0)", opacity: 0 },
            { transform: "none", opacity: 1 },
          ],
          { duration: 640, delay: 680 + i * 70, easing: EASE_OUT, fill: "both" }
        );
      }
    );

    play(cue, [{ opacity: 0 }, { opacity: 1 }], {
      duration: 700,
      delay: 1150,
      easing: "linear",
      fill: "both",
    });
  }

  /* 首屏两团环境光缓慢漂移，只有 transform，长期常驻 */
  function initOrbs() {
    if (!canAnimate || reduceMotion) return;

    var a = $(".orb-a");
    var b = $(".orb-b");

    play(
      a,
      [
        { transform: "translate3d(0,0,0) scale(1)" },
        { transform: "translate3d(5%,7%,0) scale(1.1)" },
        { transform: "translate3d(0,0,0) scale(1)" },
      ],
      { duration: 26000, iterations: Infinity, easing: "ease-in-out" }
    );

    play(
      b,
      [
        { transform: "translate3d(0,0,0) scale(1.06)" },
        { transform: "translate3d(-6%,-5%,0) scale(1)" },
        { transform: "translate3d(0,0,0) scale(1.06)" },
      ],
      { duration: 32000, iterations: Infinity, easing: "ease-in-out" }
    );
  }

  /* 给姓名逐字生成彩虹光晕：文字本身一个字都不动，
     只在背后按每个字的实测位置铺一层，随宽度变化重新量一次 */
  function initNameGlow() {
    var name = $("#heroName");
    if (!name) return;

    var textNode = name.firstChild;
    if (!textNode || textNode.nodeType !== 3) return;

    var layer = document.createElement("span");
    layer.className = "name-glow";
    layer.setAttribute("aria-hidden", "true");
    name.appendChild(layer);

    var frame = 0;

    function layout() {
      frame = 0;
      var chars = textNode.nodeValue || "";
      var base = name.getBoundingClientRect();
      if (!base.width) return;

      var range = document.createRange();
      var boxes = [];

      for (var i = 0; i < chars.length; i++) {
        if (!chars.charAt(i).trim()) continue;
        range.setStart(textNode, i);
        range.setEnd(textNode, i + 1);
        var r = range.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        boxes.push(r);
      }

      var frag = document.createDocumentFragment();
      var grow = 0.26;

      boxes.forEach(function (r, i) {
        var w = r.width * (1 + grow * 2);
        var h = r.height * (1 + grow * 2);
        var b = document.createElement("i");
        b.className = "name-bloom";
        b.style.width = w.toFixed(1) + "px";
        b.style.height = h.toFixed(1) + "px";
        b.style.left = (r.left - base.left - (w - r.width) / 2).toFixed(1) + "px";
        b.style.top = (r.top - base.top - (h - r.height) / 2).toFixed(1) + "px";
        b.style.setProperty("--d", (i * 0.45).toFixed(2) + "s");
        b.style.setProperty("--spin", i * 118 + "deg");
        frag.appendChild(b);
      });

      layer.textContent = "";
      layer.appendChild(frag);
    }

    function queue() {
      if (frame) return;
      frame = window.requestAnimationFrame(layout);
    }

    queue();
    window.addEventListener("resize", queue);
    window.addEventListener("load", queue);

    // 没有入场动画的环境，直接点亮
    if (!canAnimate || reduceMotion) name.classList.add("is-lit");
  }

  /* ---------------- 启动 ---------------- */
  renderHero();
  renderHeads();
  renderBasics();
  renderEducation();
  renderExperience();
  renderProjects();
  renderSkills();
  renderHonors();
  renderHighlights();
  renderStrengths();
  renderNav();
  renderFooter();

  prepIcons();
  initReveal();
  initScroll();
  initSquash();
  initActiveSection();
  initMenu();
  initRainbow();
  initOrbs();
  initNameGlow();
  initEntrance();
})();
