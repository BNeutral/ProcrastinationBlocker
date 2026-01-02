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
browser.runtime.onInstalled.addListener(async () => {
  const stored = await browser.storage.local.get("enabled");
  enabled = stored.enabled ?? false;
  updateUI();
});

browser.browserAction.onClicked.addListener(async () => {
  enabled = !enabled;
  await browser.storage.local.set({ enabled });
  updateUI();

  // Notify all open tabs
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    browser.tabs.sendMessage(tab.id, { enabled });
  }
});
