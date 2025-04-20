// Show the extension icon only on product pages:
chrome.runtime.onInstalled.addListener(() => {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "amazon.com", pathContains: "/dp/" }
          }),
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "ebay.com", pathContains: "/itm/" }
          }),
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "walmart.com", pathContains: "/ip/" }
          }),
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "bestbuy.com", pathContains: "/site/" }
          })
        ],
        actions: [ new chrome.declarativeContent.ShowAction() ]
      }]);
    });
  });
  
  // Auto‑open popup UI when a known product URL loads:
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" &&
        tab.url &&
        /amazon\.com\/dp\/|ebay\.com\/itm\/|walmart\.com\/ip\/|bestbuy\.com\/site\//.test(tab.url)) {
      console.log("Background: opening popup for", tab.url);
      chrome.action.openPopup().catch(() => {
        console.warn("Background: openPopup() blocked by Chrome");
      });
    }
  });
  