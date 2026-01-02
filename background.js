let enabled = false;

/**
 * Updates ALL visual aspects of the toolbar button:
 * - icon
 * - tooltip
 * - badge text
 * - badge color
 */
async function updateUI() {
  // Icon
  await browser.browserAction.setIcon({
    path: enabled
      ? { 16: "icons/on16.png", 32: "icons/on32.png" }
      : { 16: "icons/off16.png", 32: "icons/off32.png" }
  });

  // Tooltip (hover text)
  await browser.browserAction.setTitle({
    title: enabled ? "Enabled" : "Disabled"
  });

  // Badge text
  await browser.browserAction.setBadgeText({
    text: enabled ? "ON" : ""
  });

  // Badge background color
  await browser.browserAction.setBadgeBackgroundColor({
    color: enabled ? "#4CAF50" : "#9E9E9E"
  });
}

/**
 * Restore toggle state when Firefox starts
 */
browser.runtime.onStartup.addListener(async () => {
  const stored = await browser.storage.local.get("enabled");
  enabled = stored.enabled ?? false;
  updateUI();
});

/**
 * Also restore when the extension is (re)loaded
 */
browser.runtime.onInstalled.addListener(async details => {
  if (details.reason !== "install") return;

  await browser.storage.local.set({
    enabled: true,
    blacklist: [
      "reddit.com",
      "twitter.com",
      "x.com"
    ],
    whitelist: [
      "old.reddit.com"
    ]
  });
});

async function notifyTabs(type) {
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    browser.tabs.sendMessage(tab.id, { type });
  }
}

browser.browserAction.onClicked.addListener(async () => {
  enabled = !enabled;
  await browser.storage.local.set({ enabled });
  updateUI();
  notifyTabs("toggle");
});

browser.contextMenus.onClicked.addListener(info => {
  if (info.menuItemId === "open-options") {
    browser.runtime.openOptionsPage();
  }
});

function normalizeDomain(input) {
  if (!input || typeof input !== "string") return null;

  let value = input.trim().toLowerCase();

  // Add protocol if missing (URL constructor requires it)
  if (!value.includes("://")) {
    value = "http://" + value;
  }

  try {
    const url = new URL(value);
    let host = url.hostname;

    // Strip leading www.
    if (host.startsWith("www.")) {
      host = host.slice(4);
    }

    return host;
  } catch {
    return null;
  }
}

async function addDomain(listName, input) {
  const domain = normalizeDomain(input);
  if (!domain) return false;

  const data = await browser.storage.local.get(listName);
  const list = new Set(data[listName] || []);

  list.add(domain);

  await browser.storage.local.set({
    [listName]: Array.from(list)
  });

  return true;
}

async function removeDomain(listName, input) {
  const domain = normalizeDomain(input);
  if (!domain) return false;

  const data = await browser.storage.local.get(listName);
  const list = new Set(data[listName] || []);

  list.delete(domain);

  await browser.storage.local.set({
    [listName]: Array.from(list)
  });

  return true;
}

browser.contextMenus.create({
  id: "open-options",
  title: "Manage blocked sites",
  contexts: ["browser_action"]
});

browser.runtime.onMessage.addListener(async msg => {
  if (msg.type === "add-blacklist") {
    await addDomain("blacklist", msg.value);
    notifyTabs("policy-updated");
  }

  if (msg.type === "remove-blacklist") {
    await removeDomain("blacklist", msg.value);
    notifyTabs("policy-updated");
  }

  if (msg.type === "add-whitelist") {
    await addDomain("whitelist", msg.value);
    notifyTabs("policy-updated");
  }

  if (msg.type === "remove-whitelist") {
    await removeDomain("whitelist", msg.value);
    notifyTabs("policy-updated");
  }

  if (msg.type === "toggle") {
    notifyTabs("toggle");
  }
});