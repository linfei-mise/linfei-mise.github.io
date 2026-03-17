// ===== Like Button Functionality with Firebase =====
(function() {
  const DATABASE_URL = 'https://feilin-like-default-rtdb.firebaseio.com';
  const LIKES_PATH = '/likes';
  const LIKED_KEY = 'fei_lin_liked_fb';
  const DEVICE_ID_KEY = 'fei_lin_device_id';

  const likeBtn = document.getElementById('likeBtn');
  const likeCount = document.getElementById('likeCount');

  if (!likeBtn || !likeCount) return;

  localStorage.removeItem('fei_lin_has_liked');
  localStorage.removeItem('fei_lin_like_count');

  function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  function hasLikedLocally() {
    return localStorage.getItem(LIKED_KEY) === 'true';
  }

  function setLikedLocally() {
    localStorage.setItem(LIKED_KEY, 'true');
  }

  async function fetchLikes() {
    try {
      const response = await fetch(`${DATABASE_URL}${LIKES_PATH}.json`);
      const data = await response.json();
      if (!data) {
        return { count: 0, devices: {} };
      }
      const devices = data.devices || {};
      const count = Object.keys(devices).length;
      return { count, devices };
    } catch (err) {
      console.error('Failed to fetch likes:', err);
      return { count: 0, devices: {} };
    }
  }

  async function addLike() {
    const deviceId = getDeviceId();
    try {
      const response = await fetch(`${DATABASE_URL}${LIKES_PATH}/devices/${deviceId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: Date.now(),
          userAgent: navigator.userAgent.slice(0, 50)
        })
      });
      if (response.ok) {
        const data = await fetchLikes();
        return data.count;
      }
      console.error('Like PUT failed:', response.status, await response.text());
      return null;
    } catch (err) {
      console.error('Like network error:', err);
      return null;
    }
  }

  async function updateDisplay() {
    const { count, devices } = await fetchLikes();
    const deviceId = getDeviceId();
    const isInFirebase = deviceId in devices;

    if (!hasLikedLocally() && isInFirebase) {
      setLikedLocally();
    }

    const liked = hasLikedLocally();
    likeCount.textContent = count;
    if (liked) {
      likeBtn.classList.add('liked');
    } else {
      likeBtn.classList.remove('liked');
    }
  }

  likeBtn.addEventListener('click', async function() {
    const { devices } = await fetchLikes();
    const deviceId = getDeviceId();

    if (deviceId in devices) {
      likeBtn.style.transform = 'scale(0.95)';
      setTimeout(() => { likeBtn.style.transform = ''; }, 150);
      return;
    }

    const newCount = await addLike();
    if (newCount !== null) {
      setLikedLocally();
      likeCount.textContent = newCount;
      likeBtn.classList.add('liked');
      likeBtn.style.transform = 'scale(1.2)';
      setTimeout(() => { likeBtn.style.transform = ''; }, 200);
    }
  });

  updateDisplay();

  setInterval(updateDisplay, 10000);
})();

// ===== Publications Topic Filter =====
const topicChips = Array.from(document.querySelectorAll("[data-filter]"));
const pubs = Array.from(document.querySelectorAll(".pub"));

function setTopicFilter(filter) {
  topicChips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === filter)));

  pubs.forEach((p) => {
    const tags = (p.dataset.tags || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const show = filter === "all" || tags.includes(filter);

    if (show) {
      p.classList.remove("topic-hidden");
      p.style.opacity = "0";
      p.style.transform = "translateY(8px)";
      requestAnimationFrame(() => {
        p.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        p.style.opacity = "1";
        p.style.transform = "translateY(0)";
      });
    } else {
      p.classList.add("topic-hidden");
    }
  });
}

topicChips.forEach((chip) => {
  chip.addEventListener("click", () => setTopicFilter(chip.dataset.filter));
});

setTopicFilter("all");

// ===== Publications Role Filter =====
(function () {
  var roleChips = Array.from(document.querySelectorAll("[data-role]"));
  if (!roleChips.length) return;

  pubs.forEach(function (p) {
    var authEl = p.querySelector(".pauth");
    if (!authEl) return;

    var authHTML = authEl.innerHTML;
    var authText = authEl.textContent;
    var metaEl = p.querySelector(".pmeta");
    var metaHTML = metaEl ? metaEl.innerHTML : "";

    var roles = [];

    if (/Fei Lin\*/.test(authText)) {
      roles.push("co-first");
    } else {
      var authors = authText.split(",").map(function (a) { return a.trim(); });
      var idx = authors.findIndex(function (a) { return /Fei Lin/.test(a); });
      if (idx === 0) roles.push("first");
      else if (idx === 1) roles.push("second");
    }

    if (/DeepYoke/.test(metaHTML)) roles.push("deepyoke");
    if (/fa-trophy/.test(metaHTML)) roles.push("award");
    if (/Corresponding/.test(metaHTML)) roles.push("corresponding");

    p.dataset.roles = roles.join(",");
  });

  function setRoleFilter(role) {
    roleChips.forEach(function (c) {
      c.setAttribute("aria-pressed", String(c.dataset.role === role));
    });
    pubs.forEach(function (p) {
      var roles = (p.dataset.roles || "").split(",").filter(Boolean);
      var show = role === "all" || roles.includes(role);
      if (show) {
        p.classList.remove("role-hidden");
      } else {
        p.classList.add("role-hidden");
      }
    });
  }

  roleChips.forEach(function (chip) {
    chip.addEventListener("click", function () { setRoleFilter(chip.dataset.role); });
  });
})();

// ===== Auto-update Date =====
document.querySelectorAll("#lastUpdated").forEach((el) => {
  el.textContent = new Date().toISOString().slice(0, 10);
});

// ===== "/" Hotkey =====
window.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
    e.preventDefault();
    topicChips[0]?.focus();
  }
});

// ===== Smooth Scroll for Nav Links =====
document.querySelectorAll('.nav a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// ===== Publication Search =====
(function () {
  const input = document.getElementById("pubSearch");
  if (!input) return;
  const pubs = Array.from(document.querySelectorAll(".pub"));

  const originalHTML = new Map();
  pubs.forEach((p) => {
    originalHTML.set(p, {
      title: p.querySelector(".ptitle").innerHTML,
      auth: p.querySelector(".pauth").innerHTML,
    });
  });

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function highlightText(original, query) {
    if (!query) return original;
    const re = new RegExp("(" + escapeRe(query) + ")", "gi");
    return original.replace(re, '<span class="highlight">$1</span>');
  }

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    pubs.forEach((p) => {
      const orig = originalHTML.get(p);
      const titleEl = p.querySelector(".ptitle");
      const authEl = p.querySelector(".pauth");
      const titleText = orig.title.replace(/<[^>]*>/g, "");
      const authText = orig.auth.replace(/<[^>]*>/g, "");
      const tags = (p.dataset.tags || "").replace(/[_,]/g, " ");
      const venue = p.querySelector(".venue-badge")?.textContent || "";

      const haystack = (titleText + " " + authText + " " + tags + " " + venue).toLowerCase();

      if (!q || haystack.includes(q)) {
        p.classList.remove("search-hidden");
        titleEl.innerHTML = highlightText(orig.title, q);
        authEl.innerHTML = highlightText(orig.auth, q);
      } else {
        p.classList.add("search-hidden");
        titleEl.innerHTML = orig.title;
        authEl.innerHTML = orig.auth;
      }
    });
  });
})();

// ===== Citation Modal =====
(function () {
  let bibData = null;
  const modal = document.createElement("div");
  modal.id = "citeModal";
  modal.innerHTML =
    '<div class="cite-overlay"></div>' +
    '<div class="cite-box">' +
    '  <div class="cite-header"><span>BibTeX</span><button class="cite-close">&times;</button></div>' +
    '  <pre class="cite-content"></pre>' +
    '  <button class="cite-copy">Copy</button>' +
    "</div>";
  document.body.appendChild(modal);

  const overlay = modal.querySelector(".cite-overlay");
  const closeBtn = modal.querySelector(".cite-close");
  const copyBtn = modal.querySelector(".cite-copy");
  const content = modal.querySelector(".cite-content");

  function hide() { modal.classList.remove("show"); }
  overlay.addEventListener("click", hide);
  closeBtn.addEventListener("click", hide);
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(content.textContent).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = "Copy"; }, 1500);
    });
  });

  function parseBib(text) {
    const entries = {};
    const re = /@\w+\{([^,]+),([\s\S]*?)(?=\n@|\n*$)/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const key = m[1].trim();
      entries[key] = m[0].trim();
    }
    return entries;
  }

  fetch("assets/citations.bib")
    .then((r) => r.text())
    .then((t) => { bibData = parseBib(t); })
    .catch(() => {});

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".cite-btn");
    if (!btn) return;
    e.preventDefault();
    const key = btn.dataset.cite;
    if (!bibData || !bibData[key]) {
      content.textContent = "Citation not found.";
    } else {
      content.textContent = bibData[key];
    }
    modal.classList.add("show");
  });
})();
