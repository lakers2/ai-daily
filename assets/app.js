(() => {
  const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  const els = {
    dateRail: document.getElementById("dateRail"),
    hero: document.getElementById("hero"),
    stories: document.getElementById("stories"),
    footerDate: document.getElementById("footerDate"),
  };

  let dates = [];
  let current = null;

  function formatDateCN(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return {
      long: `${y} 年 ${m} 月 ${d} 日`,
      short: `${m}月${d}日`,
      weekday: WEEKDAYS[dt.getDay()],
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function fetchJSON(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`无法加载 ${path} (${res.status})`);
    return res.json();
  }

  function renderNav(active) {
    els.dateRail.innerHTML = dates
      .map((d) => {
        const f = formatDateCN(d);
        const activeCls = d === active ? " active" : "";
        return `<button type="button" class="pill${activeCls}" data-date="${d}" aria-pressed="${d === active}">${f.short} · ${f.weekday}</button>`;
      })
      .join("");

    els.dateRail.querySelectorAll("[data-date]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const date = btn.getAttribute("data-date");
        if (date !== current) loadDigest(date);
      });
    });
  }

  function renderDigest(data) {
    const f = formatDateCN(data.date);
    const count = (data.items || []).length;

    els.hero.innerHTML = `
      <p class="hero-date">${escapeHtml(f.long)} · ${escapeHtml(f.weekday)}</p>
      <h2 class="hero-heading">${escapeHtml(data.title || "AI 日报")}</h2>
      <aside class="focus-callout">
        <span class="focus-label">今日焦点</span>
        <p class="focus-text">${escapeHtml(data.focus || "")}</p>
      </aside>
      <div class="hero-meta">${count} 条精选</div>
    `;

    const items = (data.items || [])
      .slice()
      .sort((a, b) => (a.rank || 0) - (b.rank || 0));

    els.stories.innerHTML =
      `<p class="stories-label">今日要闻</p>` +
      items
        .map((item, i) => {
          const links = (item.links || [])
            .map(
              (l) =>
                `<a class="chip" href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label || "来源")}<span class="chip-arrow" aria-hidden="true">↗</span></a>`
            )
            .join("");
          return `
          <article class="card" style="animation-delay:${Math.min(i, 10) * 40}ms">
            <div class="card-rank">${String(item.rank || i + 1).padStart(2, "0")}</div>
            <div class="card-body">
              <h3 class="card-title">${escapeHtml(item.title)}</h3>
              <p class="card-summary">${escapeHtml(item.summary)}</p>
              <div class="chips">${links}</div>
            </div>
          </article>`;
        })
        .join("");

    els.footerDate.textContent = f.long;
    document.title = `${data.title || "AI 日报"} · ${f.long}`;
  }

  async function loadDigest(date) {
    current = date;
    renderNav(date);
    els.hero.innerHTML = `<div class="hero-skeleton">加载中…</div>`;
    els.stories.innerHTML = "";
    try {
      const data = await fetchJSON(`data/${date}.json`);
      renderDigest(data);
      history.replaceState(null, "", `#${date}`);
    } catch (err) {
      els.hero.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  }

  async function init() {
    try {
      const index = await fetchJSON("data/index.json");
      dates = index.dates || [];
      if (!dates.length) throw new Error("暂无日报");

      const hash = (location.hash || "").replace(/^#/, "");
      const initial = dates.includes(hash) ? hash : dates[0];
      await loadDigest(initial);
    } catch (err) {
      els.hero.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
    }
  }

  init();
})();
