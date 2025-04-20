// // Immediately add spinner + panel CSS
// (function() {
//   const style = document.createElement("style");
//   style.textContent = `
//     /* Spinner */
//     .cc-spinner {
//       border: 3px solid rgba(0,0,0,0.1);
//       width: 18px; height: 18px;
//       border-radius: 50%;
//       border-left-color: #4A90E2;
//       animation: cc-spin 1s linear infinite;
//       display: inline-block;
//       vertical-align: middle;
//       margin-right: 6px;
//     }
//     @keyframes cc-spin { to { transform: rotate(360deg); } }

//     /* Panel */
//     #cc-panel {
//       position: fixed;
//       top: 80px;
//       right: 20px;
//       width: 320px;
//       max-height: 80vh;
//       background: #fff;
//       border: 1px solid #ccc;
//       z-index: 999999;
//       overflow: auto;
//       box-shadow: 0 2px 8px rgba(0,0,0,0.15);
//       padding: 10px;
//       font-family: sans-serif;
//     }

//     #cc-status {
//       font-size: 14px;
//       margin-bottom: 12px;
//       color: #444;
//     }

//     #cc-content h3 {
//       margin: 12px 0 6px;
//       font-size: 16px;
//       border-bottom: 1px solid #eee;
//       padding-bottom: 4px;
//     }
//     #cc-content p {
//       margin: 8px 0;
//     }
//     #cc-content ul {
//       padding-left: 20px;
//       margin: 4px 0 12px;
//     }
//     #cc-content .cc-sentiment {
//       font-weight: bold;
//       margin: 12px 0;
//     }
//   `;
//   document.head.appendChild(style);
// })();

// // Create & style the floating panel
// function injectPanel() {
//   if (document.getElementById("cc-panel")) return;
//   const panel = document.createElement("div");
//   panel.id = "cc-panel";
//   // status area
//   const status = document.createElement("div");
//   status.id = "cc-status";
//   panel.appendChild(status);
//   // content area
//   const content = document.createElement("div");
//   content.id = "cc-content";
//   panel.appendChild(content);
//   document.body.append(panel);
// }

// // Display a status message with spinner
// function showStatus(text) {
//   const status = document.getElementById("cc-status");
//   if (!status) return;
//   status.innerHTML = `<span class="cc-spinner"></span>${text}`;
// }
// // Clear the status text
// function clearStatus() {
//   const status = document.getElementById("cc-status");
//   if (status) status.textContent = "";
// }

// // Render the parsed summary object
// // Enhanced renderSummary for CritiqueCortex extension
// function renderSummary(rawSummary) {
//   const content = document.getElementById("cc-content");
//   if (!content) return;
//   // Reset
//   content.innerHTML = '';

//   // Create a card container
//   const card = document.createElement('div');
//   card.className = 'cc-card';
//   Object.assign(card.style, {
//     background: '#ffffff',
//     borderRadius: '12px',
//     boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
//     padding: '24px',
//     margin: '16px auto',
//     maxWidth: '800px',
//     fontFamily: 'Arial, sans-serif',
//     color: '#333',
//   });

//   // Summary section
//   const summaryEl = document.createElement('p');
//   summaryEl.className = 'cc-summary-text';
//   summaryEl.textContent = rawSummary.summary;
//   Object.assign(summaryEl.style, {
//     fontSize: '1.2em',
//     lineHeight: '1.5',
//     marginBottom: '20px',
//   });
//   card.appendChild(summaryEl);

//   // Pros & Cons container
//   const listsContainer = document.createElement('div');
//   Object.assign(listsContainer.style, {
//     display: 'flex',
//     justifyContent: 'space-between',
//     gap: '24px',
//     marginBottom: '20px',
//   });

//   // Helper: build list
//   function buildList(title, items, icon) {
//     const container = document.createElement('div');
//     const heading = document.createElement('h3');
//     heading.textContent = title;
//     Object.assign(heading.style, { marginBottom: '8px' });
//     container.appendChild(heading);

//     const ul = document.createElement('ul');
//     Object.assign(ul.style, { paddingLeft: '20px' });
//     items.forEach(item => {
//       const li = document.createElement('li');
//       li.textContent = `${icon}  ${item}`;
//       Object.assign(li.style, { marginBottom: '6px' });
//       ul.appendChild(li);
//     });
//     container.appendChild(ul);
//     return container;
//   }

//   // Pros (✅)
//   listsContainer.appendChild(buildList('Pros', rawSummary.pros, '✅'));
//   // Cons (❌)
//   listsContainer.appendChild(buildList('Cons', rawSummary.cons, '❌'));
//   card.appendChild(listsContainer);

//   // Sentiment
//   const sentimentEl = document.createElement('div');
//   sentimentEl.className = 'cc-sentiment';
//   sentimentEl.innerHTML = `<strong>Overall Sentiment:</strong> <em>${rawSummary.sentiment}</em>`;
//   Object.assign(sentimentEl.style, {
//     fontSize: '1em',
//     textAlign: 'right',
//   });
//   card.appendChild(sentimentEl);

//   // Inject card into page
//   content.appendChild(card);
// }


// // Initialize our namespace for adapters & helpers
// window.CritiqueCortex = {
//   injectPanel,
//   showStatus,
//   clearStatus,
//   renderSummary
// };

// utils.js

// Immediately add spinner + panel CSS
(function() {
  const style = document.createElement("style");
  style.textContent = `
    /* Spinner */
    .cc-spinner {
      border: 3px solid rgba(0,0,0,0.1);
      width: 18px; height: 18px;
      border-radius: 50%;
      border-left-color: #4A90E2;
      animation: cc-spin 1s linear infinite;
      display: inline-block;
      vertical-align: middle;
      margin-right: 6px;
    }
    @keyframes cc-spin { to { transform: rotate(360deg); } }

    /* Panel */
    #cc-panel {
      position: fixed;
      top: 80px;
      right: 20px;
      width: 320px;
      max-height: 80vh;
      background: #fff;
      border: 1px solid #ccc;
      z-index: 999999;
      overflow: auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      padding: 10px;
      font-family: sans-serif;
    }

    #cc-status {
      font-size: 14px;
      margin-bottom: 12px;
      color: #444;
    }

    #cc-content h3 {
      margin: 12px 0 6px;
      font-size: 16px;
      border-bottom: 1px solid #eee;
      padding-bottom: 4px;
    }
    #cc-content p {
      margin: 8px 0;
    }
    #cc-content ul {
      padding-left: 20px;
      margin: 4px 0 12px;
    }
    #cc-content .cc-sentiment {
      font-weight: bold;
      margin: 12px 0;
    }
  `;
  document.head.appendChild(style);
})();

// Create & style the floating panel
function injectPanel() {
  if (document.getElementById("cc-panel")) return;
  const panel = document.createElement("div");
  panel.id = "cc-panel";
  const status = document.createElement("div");
  status.id = "cc-status";
  panel.appendChild(status);
  const content = document.createElement("div");
  content.id = "cc-content";
  panel.appendChild(content);
  document.body.append(panel);
}

// Display a status message with spinner
function showStatus(text) {
  const status = document.getElementById("cc-status");
  if (!status) return;
  status.innerHTML = `<span class="cc-spinner"></span>${text}`;
}

// Clear the status text
function clearStatus() {
  const status = document.getElementById("cc-status");
  if (status) status.textContent = "";
}

// Render the parsed summary object
function renderSummary(rawSummary) {
  const content = document.getElementById("cc-content");
  if (!content) return;
  content.innerHTML = '';

  // Card container
  const card = document.createElement('div');
  card.className = 'cc-card';
  Object.assign(card.style, {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
    padding: '24px',
    margin: '16px auto',
    maxWidth: '800px',
    fontFamily: 'Arial, sans-serif',
    color: '#333',
  });

  // Summary
  const summaryEl = document.createElement('p');
  summaryEl.className = 'cc-summary-text';
  summaryEl.textContent = rawSummary.summary;
  Object.assign(summaryEl.style, {
    fontSize: '1.2em',
    lineHeight: '1.5',
    marginBottom: '20px',
  });
  card.appendChild(summaryEl);

  // Pros & Cons
  const listsContainer = document.createElement('div');
  Object.assign(listsContainer.style, {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '24px',
    marginBottom: '20px',
  });

  function buildList(title, items, icon) {
    const container = document.createElement('div');
    const heading = document.createElement('h3');
    heading.textContent = title;
    Object.assign(heading.style, { marginBottom: '8px' });
    container.appendChild(heading);
    const ul = document.createElement('ul');
    Object.assign(ul.style, { paddingLeft: '20px' });
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${icon}  ${item}`;
      Object.assign(li.style, { marginBottom: '6px' });
      ul.appendChild(li);
    });
    container.appendChild(ul);
    return container;
  }

  listsContainer.appendChild(buildList('Pros', rawSummary.pros, '✅'));
  listsContainer.appendChild(buildList('Cons', rawSummary.cons, '❌'));
  card.appendChild(listsContainer);

  // Sentiment
  const sentimentEl = document.createElement('div');
  sentimentEl.className = 'cc-sentiment';
  sentimentEl.innerHTML =
    `<strong>Overall Sentiment:</strong> <em>${rawSummary.sentiment}</em>`;
  Object.assign(sentimentEl.style, {
    fontSize: '1em',
    textAlign: 'right',
  });
  card.appendChild(sentimentEl);

  content.appendChild(card);
}

// Expose to global
window.CritiqueCortex = {
  injectPanel,
  showStatus,
  clearStatus,
  renderSummary
};
