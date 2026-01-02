let originalHTML = null;

function blockPage() {
  if (originalHTML !== null) return; // already blocked

  // Save original content
  originalHTML = document.documentElement.innerHTML;

  // Replace page
  document.documentElement.innerHTML = `
    <head>
      <title>Blocked</title>
      <style>
        html, body {
          margin: 0;
          width: 100%;
          height: 100%;
        }
        body {
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: system-ui, sans-serif;
          font-size: 48px;
          font-weight: bold;
          background: #111;
          color: #fff;
        }
      </style>
    </head>
    <body>
      Go back to work!
    </body>
  `;
}

function unblockPage() {
  if (originalHTML === null) return;

  document.documentElement.innerHTML = originalHTML;
  originalHTML = null;
}

// Listen for toggle messages
browser.runtime.onMessage.addListener(msg => {
  if (msg.enabled === true) {
    blockPage();
  } else if (msg.enabled === false) {
    unblockPage();
  }
});

// Apply state on page load
(async () => {
  const { enabled } = await browser.storage.local.get("enabled");
  if (enabled === true) {
    blockPage();
  }
})();
