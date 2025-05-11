// // content_script.js
// (async function() {
//   // EARLY LOGGING FOR DEBUGGING:
//   //   console.log("🔍 CritiqueCortex content script loaded");
//   //   console.log("   • Host:", location.hostname);
//   //   console.log("   • document.readyState:", document.readyState);
//   //   console.log("   • SKU-el:", document.querySelector('div[data-sku-id]'));
//   //   console.log("   • H1-el:", document.querySelector('h1'));
  
//   const { isProductPage, getSiteAdapter, injectPanel, showStatus, clearStatus, renderSummary } = window.CritiqueCortex;

//   // 1) Only run on valid product pages
//   if (!isProductPage(location.hostname, document)) {
//     console.log("ContentScript: not a product page");
//     return;
//   }

//   // 2) Show panel + status
//   injectPanel();
//   showStatus("Scraping product info…");

//   // 3) Scrape product specs
//   const adapter = getSiteAdapter(location.hostname);
//   const product = adapter.extractProductInfo(document);

//   showStatus("Scraping reviews…");
//   const reviews = await adapter.extractAllReviews(document, 3);
//   window.ccReviews = reviews; // Store reviews globally for chat
//   console.log("Reviews:", reviews);

//   // 4) Call backend for summary
//   showStatus("Waiting for AI summary…");
//   let summaryData;
//   try {
//     const resp = await fetch("http://localhost:9000/summarize", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ reviews, specs: product })
//     });
//     if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
//     summaryData = await resp.json();
//     console.log("Summary:", summaryData);
//   } catch (err) {
//     console.error(err);
//     clearStatus();
//     document.getElementById("cc-content").innerHTML =
//       `<div style="color:red;">Error: ${err.message}</div>`;
//     return;
//   }

//   // 5) Render summary
//   clearStatus();
//   renderSummary(summaryData);

//   // 6) Inject chat controls
//   injectChatControls(reviews);

//   // —— Helpers below —— //

//   function injectChatControls(reviews) {
//     const panel = document.getElementById("cc-panel");
//     if (!panel || document.getElementById("cc-chat-form")) return;

//     const form = document.createElement("form");
//     form.id = "cc-chat-form";
//     form.style.display = "flex";
//     form.style.marginTop = "12px";

//     const input = document.createElement("input");
//     input.type = "text";
//     input.placeholder = "Ask a follow‑up…";
//     input.required = true;

//     const btn = document.createElement("button");
//     btn.type = "submit";
//     btn.textContent = "Send";

//     form.append(input, btn);
//     panel.appendChild(form);

//     form.addEventListener("submit", async (e) => {
//       e.preventDefault();
//       const q = input.value.trim();
//       if (!q) return;

//       appendMessage("user", q);
//       input.value = "";
//       showStatus("Waiting for AI chat…");

//       try {
//         const resp = await fetch("http://localhost:9000/chat", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ reviews, query: q })
//         });
//         if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
//         const { response, sources } = await resp.json();
//         clearStatus();
//         appendMessage("assistant", response, sources);
//       } catch (err) {
//         clearStatus();
//         appendMessage("assistant", `Error: ${err.message}`);
//       }
//     });
//   }

//   function appendMessage(who, text, sources = []) {
//     const content = document.getElementById("cc-content");
//     if (!content) return;

//     const wrapper = document.createElement("div");
//     wrapper.className = `cc-msg cc-msg-${who}`;
//     wrapper.style.margin = "8px 0";

//     const label = document.createElement("strong");
//     label.textContent = who === "user" ? "You: " : "AI: ";
//     wrapper.appendChild(label);

//     const span = document.createElement("span");
//     span.textContent = text;
//     wrapper.appendChild(span);

//     if (sources.length) {
//       const cite = document.createElement("div");
//       cite.className = "cc-cite";
//       // create interactive source buttons
//       sources.forEach(idx => {
//         const btn = document.createElement('button');
//         btn.type = 'button';
//         btn.className = 'cc-source-btn';
//         btn.textContent = `#${idx+1}`;
//         btn.style.marginRight = '6px';
//         btn.addEventListener('click', () => {
//           showReview(idx);
//         });
//         cite.appendChild(btn);
//       });
//       wrapper.appendChild(cite);
//     }

//     content.appendChild(wrapper);
//     content.scrollTop = content.scrollHeight;
//   }

// //   function showReview(idx) {
// //   const review = window.ccReviews[idx];
// //   // 1) figure out the actual text
// //   let content = "";
// //   if (typeof review === "string") {
// //     content = review;
// //   } else if (review.text) {
// //     content = review.text;
// //   } else {
// //     // fallback to a pretty JSON dump
// //     content = JSON.stringify(review, null, 2);
// //   }

// //   // 2) create or grab the popup box
// //   let box = document.getElementById("cc-review-box");
// //   if (!box) {
// //     box = document.createElement("div");
// //     box.id = "cc-review-box";
// //     Object.assign(box.style, {
// //       position: "fixed",
// //       bottom: "20px",
// //       left: "20px",
// //       width: "300px",
// //       maxHeight: "200px",
// //       overflow: "auto",
// //       background: "#fff",
// //       border: "1px solid #ccc",
// //       padding: "12px",
// //       zIndex: 1e6,
// //       boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
// //       borderRadius: "8px",
// //       fontSize: "14px",
// //       whiteSpace: "pre-wrap"   // for multi‑line JSON
// //     });
// //     document.body.appendChild(box);
// //   }

// //   // 3) inject the actual HTML
// //   box.innerHTML = `
// //     <strong>Review #${idx+1}:</strong>
// //     <p>${content}</p>
// //   `;
// // }
// function showReview(idx) {
//   const review = window.ccReviews[idx];
//   let content = "";
//   if (typeof review === "string") {
//     content = review;
//   } else if (review.text) {
//     content = review.text;
//   } else {
//     content = JSON.stringify(review, null, 2);
//   }

//   // 1) Create or grab the popup box
//   let box = document.getElementById("cc-review-box");
//   if (!box) {
//     box = document.createElement("div");
//     box.id = "cc-review-box";
//     Object.assign(box.style, {
//       position: "fixed",
//       bottom: "20px",
//       left: "20px",
//       width: "300px",
//       maxHeight: "200px",
//       overflow: "auto",
//       background: "#fff",
//       border: "1px solid #ccc",
//       boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
//       borderRadius: "8px",
//       fontSize: "14px",
//       boxSizing: "border-box",
//       padding: "12px"
//     });

//     // 2) Add close button (only once)
//     const closeBtn = document.createElement("button");
//     closeBtn.textContent = "×";
//     Object.assign(closeBtn.style, {
//       position: "absolute",
//       top: "8px",
//       right: "8px",
//       background: "transparent",
//       border: "none",
//       fontSize: "18px",
//       cursor: "pointer",
//       lineHeight: "1"
//     });
//     closeBtn.addEventListener("click", () => box.remove());
//     box.appendChild(closeBtn);

//     // 3) Create a content container
//     const contentDiv = document.createElement("div");
//     contentDiv.id = "cc-review-content";
//     // push it down so it doesn’t overlap the close button
//     contentDiv.style.marginTop = "28px";
//     box.appendChild(contentDiv);

//     document.body.appendChild(box);
//   }

//   // 4) Only overwrite the content DIV—not the whole box
//   const contentDiv = document.getElementById("cc-review-content");
//   contentDiv.innerHTML = `
//     <strong>Review #${idx+1}:</strong>
//     <p>${content}</p>
//   `;
// }

// })();

// content_script.js
(async function() {
  // 0) Track session_id for follow‑ups & CTR
  window.ccSessionId = null;

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
  window.ccReviews = reviews; // Store reviews globally for chat
  console.log("Reviews:", reviews);

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
    input.required = true;

    const btn = document.createElement("button");
    btn.type = "submit";
    btn.textContent = "Send";

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
          body: JSON.stringify({
            reviews,
            query: q,
            session_id: window.ccSessionId
          })
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const { response, sources, session_id } = await resp.json();
        window.ccSessionId = session_id;
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
      cite.className = "cc-cite";
      // create interactive source buttons
      sources.forEach(idx => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cc-source-btn';
        btn.textContent = `#${idx+1}`;
        btn.style.marginRight = '6px';
        btn.addEventListener('click', async () => {
          // fire click‑through metric
          try {
            await fetch("http://localhost:9000/metrics/click", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session_id: window.ccSessionId })
            });
          } catch (err) {
            console.error("CTR metric error:", err);
          }
          showReview(idx);
        });
        cite.appendChild(btn);
      });
      wrapper.appendChild(cite);
    }

    content.appendChild(wrapper);
    content.scrollTop = content.scrollHeight;
  }

  function showReview(idx) {
    const review = window.ccReviews[idx];
    let content = "";
    if (typeof review === "string") {
      content = review;
    } else if (review.text) {
      content = review.text;
    } else {
      content = JSON.stringify(review, null, 2);
    }

    // 1) Create or grab the popup box
    let box = document.getElementById("cc-review-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "cc-review-box";
      Object.assign(box.style, {
        position: "fixed",
        bottom: "20px",
        left: "20px",
        width: "300px",
        maxHeight: "200px",
        overflow: "auto",
        background: "#fff",
        border: "1px solid #ccc",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        borderRadius: "8px",
        fontSize: "14px",
        boxSizing: "border-box",
        padding: "12px"
      });

      // 2) Add close button (only once)
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "×";
      Object.assign(closeBtn.style, {
        position: "absolute",
        top: "8px",
        right: "8px",
        background: "transparent",
        border: "none",
        fontSize: "18px",
        cursor: "pointer",
        lineHeight: "1"
      });
      closeBtn.addEventListener("click", () => box.remove());
      box.appendChild(closeBtn);

      // 3) Create a content container
      const contentDiv = document.createElement("div");
      contentDiv.id = "cc-review-content";
      contentDiv.style.marginTop = "28px";
      box.appendChild(contentDiv);

      document.body.appendChild(box);
    }

    // 4) Only overwrite the content DIV—not the whole box
    const contentDiv = document.getElementById("cc-review-content");
    contentDiv.innerHTML = `
      <strong>Review #${idx+1}:</strong>
      <p>${content}</p>
    `;
  }

})();
