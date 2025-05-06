// content_script.js
(async function() {
// EARLY LOGGING FOR DEBUGGING:
//   console.log("🔍 CritiqueCortex content script loaded");
//   console.log("   • Host:", location.hostname);
//   console.log("   • document.readyState:", document.readyState);
//   console.log("   • SKU-el:", document.querySelector('div[data-sku-id]'));
//   console.log("   • H1-el:", document.querySelector('h1'));
  const { isProductPage, getSiteAdapter, injectPanel, showStatus, clearStatus, renderSummary } = window.CritiqueCortex;

  // 1) Only run on valid product pages
  if (!isProductPage(location.hostname, document)) {
    console.log("ContentScript: not a product page");
    return;
  }

  // 2) Show panel + status
  injectPanel();
  showStatus("Scraping product info…");

  // 3) Scrape product specs
  const adapter = getSiteAdapter(location.hostname);
  const product = adapter.extractProductInfo(document);

  showStatus("Scraping reviews…");
  const reviews = await adapter.extractAllReviews(document, 3);

  // 4) Call backend for summary
  showStatus("Waiting for AI summary…");
  let summaryData;
  try {
    const resp = await fetch("http://localhost:9000/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviews, specs: product })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    summaryData = await resp.json();
    console.log("Summary:", summaryData);
  } catch (err) {
    console.error(err);
    clearStatus();
    document.getElementById("cc-content").innerHTML =
      `<div style="color:red;">Error: ${err.message}</div>`;
    return;
  }

  // 5) Render summary
  clearStatus();
  renderSummary(summaryData);

  // 6) Inject chat controls
  injectChatControls(reviews);

  // —— Helpers below —— //

  function injectChatControls(reviews) {
    const panel = document.getElementById("cc-panel");
    if (!panel || document.getElementById("cc-chat-form")) return;

    const form = document.createElement("form");
    form.id = "cc-chat-form";
    form.style.display = "flex";
    form.style.marginTop = "12px";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Ask a follow‑up…";
    input.style.flex = "1";
    input.required = true;

    const btn = document.createElement("button");
    btn.type = "submit";
    btn.textContent = "Send";
    btn.style.marginLeft = "8px";

    form.append(input, btn);
    panel.appendChild(form);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;

      appendMessage("user", q);
      input.value = "";
      showStatus("Waiting for AI chat…");

      try {
        const resp = await fetch("http://localhost:9000/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviews, query: q })
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const { response, sources } = await resp.json();
        clearStatus();
        appendMessage("assistant", response, sources);
      } catch (err) {
        clearStatus();
        appendMessage("assistant", `Error: ${err.message}`);
      }
    });
  }

  function appendMessage(who, text, sources = []) {
    const content = document.getElementById("cc-content");
    if (!content) return;

    const wrapper = document.createElement("div");
    wrapper.className = `cc-msg cc-msg-${who}`;
    wrapper.style.margin = "8px 0";

    const label = document.createElement("strong");
    label.textContent = who === "user" ? "You: " : "AI: ";
    wrapper.appendChild(label);

    const span = document.createElement("span");
    span.textContent = text;
    wrapper.appendChild(span);

    if (sources.length) {
      const cite = document.createElement("div");
      cite.textContent = `Sources: ${sources.join(", ")}`;
      cite.style.fontSize = "0.85em";
      cite.style.color = "#666";
      wrapper.appendChild(cite);
    }

    content.appendChild(wrapper);
    content.scrollTop = content.scrollHeight;
  }
})();

