const enabledCheckbox = document.getElementById("enabled");

const blacklistInput = document.getElementById("blacklistInput");
const whitelistInput = document.getElementById("whitelistInput");

const blacklistList = document.getElementById("blacklist");
const whitelistList = document.getElementById("whitelist");

async function load() {
    const {
        enabled = false,
        blacklist = [],
        whitelist = []
    } = await browser.storage.local.get(["enabled", "blacklist", "whitelist"]);

    enabledCheckbox.checked = enabled;
    renderList(blacklistList, blacklist, "blacklist");
    renderList(whitelistList, whitelist, "whitelist");
}

function renderList(container, items, type) {
    container.innerHTML = "";

    for (const domain of items) {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = domain;
        span.className = "domain";

        const remove = document.createElement("button");
        remove.textContent = "Remove";
        remove.onclick = async () => {
            await browser.runtime.sendMessage({
                type: `remove-${type}`,
                value: domain
            });
            load();
        };

        li.append(span, remove);
        container.appendChild(li);
    }
}

enabledCheckbox.addEventListener("change", async () => {
    await browser.storage.local.set({
        enabled: enabledCheckbox.checked
    });

    browser.runtime.sendMessage({ type: "toggle" });
});

document.getElementById("addBlacklist").onclick = async () => {
    await browser.runtime.sendMessage({
        type: "add-blacklist",
        value: blacklistInput.value
    });
    blacklistInput.value = "";
    load();
};

document.getElementById("addWhitelist").onclick = async () => {
    await browser.runtime.sendMessage({
        type: "add-whitelist",
        value: whitelistInput.value
    });
    whitelistInput.value = "";
    load();
};

load();
