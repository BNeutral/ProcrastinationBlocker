let blocker = null;

function blockPage() {
  if (blocker) return;

  blocker = document.createElement("div");
  blocker.innerHTML = `
    <div class="blocker-card">
      <div class="emoji">🚫💻</div>
      <div class="message">Get back to work</div>
      <div class="sub">This site is on your blacklist</div>
    </div>
  `;

  blocker.style.cssText = `
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at top, #1a1a1a, #000);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
  `;

  const style = document.createElement("style");
  style.textContent = `
    .blocker-card {
      text-align: center;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      animation: fadeIn 200ms ease-out;
    }

    .blocker-card .emoji {
      font-size: 64px;
      margin-bottom: 16px;
    }

    .blocker-card .message {
      font-size: 42px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .blocker-card .sub {
      font-size: 16px;
      opacity: 0.7;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.98);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;

  document.documentElement.appendChild(style);
  document.documentElement.appendChild(blocker);
}

function unblockPage() {
  blocker?.remove();
  blocker = null;
}

function domainMatches(host, rule) {
  return host === rule || host.endsWith("." + rule);
}

function shouldBlock(host, blacklist, whitelist) {
  // Whitelist wins
  for (const w of whitelist) {
    if (domainMatches(host, w)) {
      return false;
    }
  }

  // Then blacklist
  for (const b of blacklist) {
    if (domainMatches(host, b)) {
      return true;
    }
  }

  return false;
}

async function evaluatePolicy() {
  const {
    enabled = false,
    blacklist = [],
    whitelist = []
  } = await browser.storage.local.get([
    "enabled",
    "blacklist",
    "whitelist"
  ]);

  if (!enabled) {
    unblockPage();
    return;
  }

  const host = location.hostname;

  if (shouldBlock(host, blacklist, whitelist)) {
    blockPage();
  } else {
    unblockPage();
  }
}

/* ---- CRITICAL PART ---- */

// Re-evaluate when background tells us policy changed
browser.runtime.onMessage.addListener(msg => {
  if (msg.type === "policy-updated" || msg.type === "toggle") {
    evaluatePolicy();
  }
});

// Evaluate on first load
evaluatePolicy();
