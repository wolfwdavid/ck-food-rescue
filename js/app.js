(function () {
  "use strict";

  var cfg = window.FR_CONFIG || {};
  var REFRESH_SECONDS = Math.max(10, Number(cfg.REFRESH_SECONDS) || 60);
  var KNOWN_STATUS = { available: true, low: true, gone: true };

  var els = {
    status: document.getElementById("status"),
    refreshBtn: document.getElementById("refresh-btn"),
    locations: document.getElementById("locations"),
    locNotice: document.getElementById("loc-notice"),
    sourceLine: document.getElementById("source-line"),
    updateLink: document.getElementById("update-link"),
    teamName: document.getElementById("team-name"),
    toast: document.getElementById("toast"),
    chips: Array.prototype.slice.call(document.querySelectorAll(".chip"))
  };

  var state = {
    groups: [],
    lastGoodAt: null,
    lastError: false,
    source: "",
    filter: "all",
    locSlug: new URLSearchParams(location.search).get("loc") || "",
    secondsLeft: REFRESH_SECONDS,
    fetching: false,
    tickTimer: null,
    toastTimer: null
  };

  function slugify(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function hhmm(d) {
    return pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

  function relativeTime(raw) {
    if (!raw) return "";
    var t = Date.parse(raw);
    if (isNaN(t)) return "updated " + raw;
    var diff = Math.round((Date.now() - t) / 1000);
    if (diff < 0) diff = 0;
    if (diff < 60) return "updated just now";
    var m = Math.floor(diff / 60);
    if (m < 60) return "updated " + m + " min ago";
    var h = Math.floor(m / 60);
    if (h < 24) return "updated " + h + " hr ago";
    var d = Math.floor(h / 24);
    return "updated " + d + (d === 1 ? " day ago" : " days ago");
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function normaliseRow(r) {
    var rawStatus = (r.status || "").trim();
    var key = rawStatus.toLowerCase();
    return {
      location: (r.location || "").trim(),
      address: (r.address || "").trim(),
      item: (r.item || "").trim(),
      quantity: (r.quantity || "").trim(),
      unit: (r.unit || "").trim(),
      statusKey: KNOWN_STATUS[key] ? key : "available",
      statusLabel: KNOWN_STATUS[key] ? key : (rawStatus || "available"),
      updated: (r.updated || "").trim(),
      notes: (r.notes || "").trim()
    };
  }

  function groupRows(rows) {
    var byKey = {};
    var order = [];
    rows.forEach(function (raw) {
      var r = normaliseRow(raw);
      if (!r.location && !r.item) return;
      var name = r.location || "Unnamed location";
      var key = slugify(name) || "location";
      if (!byKey[key]) {
        byKey[key] = { slug: key, name: name, address: r.address, items: [] };
        order.push(key);
      }
      if (!byKey[key].address && r.address) byKey[key].address = r.address;
      if (r.item) byKey[key].items.push(r);
    });
    var groups = order.map(function (k) { return byKey[k]; });
    groups.forEach(function (g) {
      g.allGone = g.items.length > 0 && g.items.every(function (it) { return it.statusKey === "gone"; });
    });
    var live = groups.filter(function (g) { return !g.allGone; });
    var gone = groups.filter(function (g) { return g.allGone; });
    return live.concat(gone);
  }

  function pageUrlFor(slug) {
    var u = new URL(location.href);
    u.search = slug ? "?loc=" + encodeURIComponent(slug) : "";
    u.hash = "";
    return u.toString();
  }

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("is-visible");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () {
      els.toast.classList.remove("is-visible");
    }, 2200);
  }

  function shareLocation(group) {
    var url = pageUrlFor(group.slug);
    var openItems = group.items.filter(function (it) { return it.statusKey !== "gone"; })
      .map(function (it) { return it.item; });
    var text = openItems.length
      ? "Free produce at " + group.name + " right now: " + openItems.join(", ") + "."
      : "Pickup point: " + group.name + ".";
    var payload = { title: "Food Rescue — " + group.name, text: text, url: url };

    if (navigator.share) {
      navigator.share(payload).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        showToast("Link copied");
      }, function () {
        window.prompt("Copy this link", url);
      });
      return;
    }
    window.prompt("Copy this link", url);
  }

  function renderItem(it) {
    var li = el("li", "item item-" + it.statusKey);

    var head = el("div", "item-head");
    var name = el("span", "item-name", it.item);
    head.appendChild(name);

    var qty = [it.quantity, it.unit].filter(Boolean).join(" ");
    if (qty) head.appendChild(el("span", "item-qty", qty));

    var badge = el("span", "badge badge-" + it.statusKey, it.statusLabel);
    head.appendChild(badge);
    li.appendChild(head);

    if (it.notes) li.appendChild(el("p", "item-notes", it.notes));

    var rel = relativeTime(it.updated);
    if (rel) {
      var time = el("p", "item-updated", rel);
      if (!isNaN(Date.parse(it.updated))) time.title = it.updated;
      li.appendChild(time);
    }
    return li;
  }

  function renderCard(group) {
    var card = el("article", "card" + (group.allGone ? " card-gone" : ""));
    card.id = "loc-" + group.slug;

    var header = el("header", "card-head");
    header.appendChild(el("h2", "card-title", group.name));
    if (group.address) header.appendChild(el("p", "card-address", group.address));
    card.appendChild(header);

    var actions = el("div", "card-actions");
    if (group.address) {
      var dir = el("a", "btn btn-dir", "Directions");
      dir.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(group.address);
      dir.target = "_blank";
      dir.rel = "noopener";
      actions.appendChild(dir);
    }
    var share = el("button", "btn btn-share", "Share");
    share.type = "button";
    share.addEventListener("click", function () { shareLocation(group); });
    actions.appendChild(share);
    card.appendChild(actions);

    var visible = state.filter === "available"
      ? group.items.filter(function (it) { return it.statusKey !== "gone"; })
      : group.items;

    if (visible.length) {
      var list = el("ul", "items");
      visible.forEach(function (it) { list.appendChild(renderItem(it)); });
      card.appendChild(list);
    } else {
      card.appendChild(el("p", "card-empty", group.items.length ? "Nothing left here right now." : "No items listed yet."));
    }
    return card;
  }

  function render() {
    var groups = state.groups;
    var matched = state.locSlug
      ? groups.filter(function (g) { return g.slug === state.locSlug; })
      : groups;

    els.locNotice.hidden = !state.locSlug;

    els.locations.textContent = "";
    if (!groups.length) {
      els.locations.appendChild(el("p", "empty", "Nothing on the board yet. Check back soon."));
      return;
    }
    if (state.locSlug && !matched.length) {
      els.locations.appendChild(el("p", "empty", "That location isn't on the board right now."));
      return;
    }
    matched.forEach(function (g) { els.locations.appendChild(renderCard(g)); });
  }

  function renderStatus() {
    var s = els.status;
    if (state.fetching) {
      s.textContent = "Refreshing…";
      return;
    }
    if (!state.lastGoodAt) {
      s.textContent = state.lastError ? "Couldn't load the board. Trying again in " + state.secondsLeft + " s" : "Loading the board…";
      return;
    }
    var age = Math.round((Date.now() - state.lastGoodAt.getTime()) / 1000);
    var when = age < 5 ? "Updated just now" : "Updated " + hhmm(state.lastGoodAt);
    if (state.lastError) {
      s.textContent = "Couldn't refresh — showing data from " + hhmm(state.lastGoodAt) + " · retrying in " + state.secondsLeft + " s";
      return;
    }
    s.textContent = when + " · refreshes in " + state.secondsLeft + " s";
  }

  function renderSource() {
    var map = {
      gviz: "Live from the team's sheet",
      published: "Live from the team's sheet (published CSV, may lag a few minutes)",
      sample: "Sample data — sheet not connected yet"
    };
    els.sourceLine.textContent = map[state.source] || "";
  }

  function buildSources() {
    var list = [];
    if (cfg.SHEET_ID) {
      list.push({
        kind: "gviz",
        url: "https://docs.google.com/spreadsheets/d/" + cfg.SHEET_ID + "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(cfg.SHEET_TAB || "Stock")
      });
    }
    if (cfg.SHEET_PUBLISHED_CSV_URL) {
      list.push({ kind: "published", url: cfg.SHEET_PUBLISHED_CSV_URL });
    }
    list.push({ kind: "sample", url: "data/sample.csv" });
    return list;
  }

  function fetchFirst(sources, idx) {
    if (idx >= sources.length) return Promise.reject(new Error("All sources failed"));
    var src = sources[idx];
    return fetch(src.url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (text) {
        var parsed = window.parseCsv(text);
        if (parsed.headers.indexOf("item") === -1 && parsed.headers.indexOf("location") === -1) {
          throw new Error("Unexpected columns");
        }
        return { kind: src.kind, parsed: parsed };
      })
      .catch(function () {
        return fetchFirst(sources, idx + 1);
      });
  }

  function load() {
    if (state.fetching) return Promise.resolve();
    state.fetching = true;
    renderStatus();
    return fetchFirst(buildSources(), 0)
      .then(function (result) {
        state.groups = groupRows(result.parsed.rows);
        state.source = result.kind;
        state.lastGoodAt = new Date();
        state.lastError = false;
        render();
        renderSource();
      })
      .catch(function () {
        state.lastError = true;
      })
      .then(function () {
        state.fetching = false;
        state.secondsLeft = REFRESH_SECONDS;
        renderStatus();
      });
  }

  function tick() {
    if (document.hidden || state.fetching) return;
    state.secondsLeft -= 1;
    if (state.secondsLeft <= 0) {
      load();
      return;
    }
    renderStatus();
  }

  function startTimer() {
    if (state.tickTimer) return;
    state.tickTimer = setInterval(tick, 1000);
  }

  function setFilter(filter) {
    state.filter = filter;
    els.chips.forEach(function (chip) {
      var on = chip.getAttribute("data-filter") === filter;
      chip.classList.toggle("is-active", on);
      chip.setAttribute("aria-pressed", on ? "true" : "false");
    });
    render();
  }

  function init() {
    if (cfg.TEAM_NAME) els.teamName.textContent = cfg.TEAM_NAME;
    if (cfg.SHEET_EDIT_URL) {
      els.updateLink.href = cfg.SHEET_EDIT_URL;
      els.updateLink.hidden = false;
    }
    document.getElementById("show-all").href = pageUrlFor("");

    els.chips.forEach(function (chip) {
      chip.addEventListener("click", function () { setFilter(chip.getAttribute("data-filter")); });
    });
    els.refreshBtn.addEventListener("click", function () { load(); });

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) load();
    });

    load().then(startTimer);
  }

  init();
})();
