/* ============================================================================
 * 渲染与交互
 * 所有文案来自 assets/js/resume-data.js，这里只负责结构、动效与交互。
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
    return (i * (step || 0.06)).toFixed(2) + "s";
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
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.network) + "</svg>"
    );
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

    var box = $("#heroStats");
    box.innerHTML = D.stats
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
    var box = $("#facts");
    box.innerHTML = D.basics
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
    var strip = $("#contactStrip");
    strip.innerHTML =
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
    var wrap = $("#timeline");
    wrap.innerHTML = D.experience
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
          delay(i) +
          '">' +
          '<span class="exp-dot" aria-hidden="true"></span>' +
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
    var grid = $("#projectGrid");
    grid.innerHTML = D.projects
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
    var grid = $("#skillGrid");
    grid.innerHTML = D.skills
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

  /* ---------------- 荣誉 ---------------- */
  function renderHonors() {
    var grid = $("#honorGrid");
    grid.innerHTML = D.honors
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

  /* ---------------- 个人优势 ---------------- */
  function renderStrengths() {
    var box = $("#strengthList");
    box.innerHTML = D.strengths
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
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    items.forEach(function (n) {
      io.observe(n);
    });
  }

  /* ---------------- 水波纹 ---------------- */
  function initRipple() {
    // 注意排除已经绝对定位的 .scroll-cue 与带脉冲光晕的 .nav-brand
    var SEL =
      "a:not(.scroll-cue):not(.nav-brand), button, .fact, .chip-btn, .edu-card, " +
      ".exp-card, .project-card, .skill-card, .honor-card, .strength-row, .course, .skill-tag";

    document.querySelectorAll(SEL).forEach(function (n) {
      n.classList.add("ripple-host");
    });

    document.addEventListener(
      "pointerdown",
      function (e) {
        if (reduceMotion || !e.target.closest) return;
        var host = e.target.closest(".ripple-host");
        if (!host) return;

        var rect = host.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var r = Math.max(
          Math.hypot(x, y),
          Math.hypot(rect.width - x, y),
          Math.hypot(x, rect.height - y),
          Math.hypot(rect.width - x, rect.height - y)
        );

        var dot = document.createElement("span");
        dot.className = "ripple";
        dot.style.width = dot.style.height = r * 2 + "px";
        dot.style.left = x + "px";
        dot.style.top = y + "px";
        dot.style.background = rippleColor(host);

        host.appendChild(dot);
        dot.addEventListener("animationend", function () {
          dot.remove();
        });
        // 兜底：动画事件丢失时也要清掉
        window.setTimeout(function () {
          if (dot.parentNode) dot.remove();
        }, 1200);
      },
      { passive: true }
    );
  }

  function rippleColor(host) {
    if (host.closest(".hero")) return "rgba(255,255,255,0.34)";
    if (host.closest(".footer")) return "rgba(255,255,255,0.2)";
    var nav = host.closest(".nav");
    if (nav && !nav.classList.contains("is-solid")) return "rgba(255,255,255,0.34)";
    return "rgba(0,113,227,0.17)";
  }

  /* ---------------- 光斑跟随 + 磁性按钮 ---------------- */
  function initPointerFX() {
    if (reduceMotion) return;
    if (!window.matchMedia || !window.matchMedia("(hover: hover)").matches) return;

    document
      .querySelectorAll(
        ".fact, .edu-card, .exp-card, .project-card, .skill-card, .honor-card, .strength-row"
      )
      .forEach(function (n) {
        n.classList.add("spotlight");
      });

    var MAG = ".nav-cta, .chip-btn";
    var lastMag = null;

    document.addEventListener(
      "pointermove",
      function (e) {
        var t = e.target;
        if (!t || !t.closest) return;

        // 卡片光斑
        var card = t.closest(".spotlight");
        if (card) {
          var b = card.getBoundingClientRect();
          card.style.setProperty("--mx", (((e.clientX - b.left) / b.width) * 100).toFixed(1) + "%");
          card.style.setProperty("--my", (((e.clientY - b.top) / b.height) * 100).toFixed(1) + "%");
        }

        // 磁性按钮：轻微被鼠标"吸"过去
        var mag = t.closest(MAG);
        if (lastMag && lastMag !== mag) {
          lastMag.style.transform = "";
          lastMag = null;
        }
        if (!mag) return;

        var r = mag.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        mag.style.transform =
          "translate3d(" + (dx * 7).toFixed(2) + "px," + (dy * 5 - 1).toFixed(2) + "px,0)";
        lastMag = mag;
      },
      { passive: true }
    );

    document.addEventListener("pointerleave", function () {
      if (lastMag) {
        lastMag.style.transform = "";
        lastMag = null;
      }
    });
  }

  /* ---------------- 滚动相关 ---------------- */
  function initScroll() {
    var nav = $("#nav");
    var hero = $("#top");
    var heroInner = $(".hero-inner");
    var bar = $("#progressBar");
    var panels = Array.prototype.slice.call(document.querySelectorAll(".section--alt"));
    var timeline = $("#timeline");
    var docH = 1;
    var ticking = false;

    function measure() {
      docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    }

    function update() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var heroH = hero ? hero.offsetHeight : 0;

      nav.classList.toggle("is-solid", y > heroH - 72);

      var p = Math.min(1, Math.max(0, y / docH));
      bar.style.transform = "scaleX(" + p.toFixed(4) + ")";

      // 首屏：内容上移 + 轻微缩小，像被下一屏"吸"下去
      if (heroInner && !reduceMotion && y < heroH) {
        var k = Math.min(y / heroH, 1);
        heroInner.style.transform =
          "translate3d(0," +
          (y * 0.16).toFixed(1) +
          "px,0) scale(" +
          (1 - k * 0.045).toFixed(3) +
          ")";
        heroInner.style.opacity = (1 - k * 1.08).toFixed(3);
      }

      // 经历时间轴：竖线随滚动"长"出来
      if (!reduceMotion && timeline) {
        var tr = timeline.getBoundingClientRect();
        if (tr.bottom > 0 && tr.top < window.innerHeight) {
          var prog = (window.innerHeight * 0.8 - tr.top) / Math.max(tr.height, 1);
          timeline.style.setProperty("--line", Math.max(0.05, Math.min(1, prog)).toFixed(3));
        }
      }

      // 浅色面板里的柔光：慢于滚动位移，形成"黏住"的液态感
      if (!reduceMotion && panels.length) {
        var vh = window.innerHeight;
        var mid = vh / 2;
        var i;
        var rects = [];
        for (i = 0; i < panels.length; i++) rects.push(panels[i].getBoundingClientRect());
        for (i = 0; i < panels.length; i++) {
          var r = rects[i];
          if (r.bottom < -260 || r.top > vh + 260) continue;
          var d = (r.top + r.height / 2 - mid) / vh;
          panels[i].style.setProperty("--orb-y", (d * -90).toFixed(1) + "px");
          panels[i].style.setProperty("--orb-s", (1 + Math.abs(d) * 0.09).toFixed(3));
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
    document.addEventListener("visibilitychange", measure);

    measure();
    update();
    window.addEventListener("load", function () {
      measure();
      update();
    });
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
        entries.forEach(function (entry) {
          var link = map[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            links.forEach(function (l) {
              l.classList.remove("is-active");
            });
            link.classList.add("is-active");
          }
        });
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
      $("#nav").classList.toggle("is-solid", open || window.pageYOffset > 200);
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

  /* ---------------- 启动 ---------------- */
  renderHero();
  renderHeads();
  renderBasics();
  renderEducation();
  renderExperience();
  renderProjects();
  renderSkills();
  renderHonors();
  renderStrengths();
  renderNav();
  renderFooter();

  initReveal();
  initScroll();
  initActiveSection();
  initMenu();
  initRipple();
  initPointerFX();
})();
