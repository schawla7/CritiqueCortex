
class AmazonAdapter {
  /**
   * Extract ASIN, title, and product specifications from #prodDetails
   */
  extractProductInfo(doc) {
    // 1) ASIN
    const path = location.pathname;
    const match = path.match(/\/dp\/([A-Z0-9]{10})/i);
    const asin = match ? match[1] : "";
    console.log("AmazonAdapter: extracted ASIN →", asin);

    // 2) Title
    const title = doc.querySelector("#productTitle")?.innerText.trim() || "";
    console.log("AmazonAdapter: product title →", title);

    // 3) Specs from prodDetails
    const specs = {};
    const detailsRoot = doc.querySelector("#prodDetails");
    if (detailsRoot) {
      // find every key/value table
      detailsRoot
        .querySelectorAll("table.prodDetTable")
        .forEach(table => {
          table.querySelectorAll("tr").forEach(row => {
            const keyEl = row.querySelector("th.prodDetSectionEntry");
            const valEl = row.querySelector("td.prodDetAttrValue, td");
            if (keyEl && valEl) {
              const key = keyEl.innerText.trim();
              const val = valEl.innerText.trim().replace(/\s+\n\s+/g, ", ");
              specs[key] = val;
            }
          });
        });
      console.log("AmazonAdapter: scraped specs →", specs);
    } else {
      console.warn("AmazonAdapter: #prodDetails not found");
    }

    return { title, asin, specs };
  }

  /**
   * Crawl up to `maxPages` of reviews from the official reviews pages.
   * Scopes to the exact container and uses <li data-hook="review">.
   */
  async extractAllReviews(_doc, maxPages = 3) {
    const { asin } = this.extractProductInfo(document);
    if (!asin) {
      console.warn("AmazonAdapter: no ASIN found, skipping reviews");
      return [];
    }

    let allReviews = [];
    for (let page = 1; page <= maxPages; page++) {
      const url = `https://www.amazon.com/product-reviews/${asin}/?pageNumber=${page}&sortBy=recent`;
      console.log(`AmazonAdapter: fetching reviews page ${page} →`, url);

      try {
        const resp = await fetch(url, { credentials: "include" });
        if (!resp.ok) {
          console.warn("AmazonAdapter: non‑OK response", resp.status);
          break;
        }
        const html = await resp.text();
        const parser = new DOMParser();
        const revDoc = parser.parseFromString(html, "text/html");

        // exact reviews container
        const reviewContainer = revDoc.querySelector(
          "div.reviews-content div#cm_cr-review_list ul.a-unordered-list"
        );
        if (!reviewContainer) {
          console.warn("AmazonAdapter: review container not found on page", page);
          break;
        }

        const pageReviews = Array.from(
          reviewContainer.querySelectorAll("li[data-hook='review']")
        ).map(el => ({
          id: el.id,
          rating: el.querySelector("i[data-hook='review-star-rating'] .a-icon-alt")
                    ?.innerText.trim() || "",
          title:  el.querySelector("a[data-hook='review-title'] span")
                    ?.innerText.trim() || "",
          text:   el.querySelector("span[data-hook='review-body']")
                    ?.innerText.trim() || "",
          author: el.querySelector(".a-profile-name")?.innerText.trim() || "",
          date:   el.querySelector("span[data-hook='review-date']")
                    ?.innerText.trim() || "",
          verified: Boolean(el.querySelector("span[data-hook='avp-badge']"))
        }));

        console.log(`AmazonAdapter: page ${page} yielded ${pageReviews.length} reviews`);
        if (!pageReviews.length) break;
        allReviews.push(...pageReviews);
      } catch (err) {
        console.error("AmazonAdapter: error fetching reviews page", page, err);
        break;
      }
    }

    console.log("AmazonAdapter: total reviews gathered →", allReviews.length);
    return allReviews;
  }
}

class BestBuyAdapter {
    extractProductInfo(doc) {
        const titleEl = doc.querySelector('h1');
        const title   = titleEl?.innerText.trim() || '';

        // Always grab SKU from the URL
        const params = new URL(window.location.href).searchParams;
        const sku    = params.get('skuId') || '';

        console.log("BestBuyAdapter: title →", title, "sku →", sku);
        return { title, sku };
    }
      
    async extractAllReviews(doc, maxPages = 3) {
        const { sku } = this.extractProductInfo(document);
    if (!sku) {
      console.warn("BestBuyAdapter: no SKU found—skipping reviews");
      return [];
    }

    const reviews = [];
    const endpoint = 'https://www.bestbuy.com/graphql';

    // GraphQL query to pull reviews by SKU
    const query = `
      query GetReviews($sku: String!, $page: Int!) {
        reviewsBySkuId(sku: $sku, page: $page) {
          memberName
          isVerifiedPurchase
          submissionDate
          rating
          title
          reviewText
        }
      }
    `;

    for (let page = 1; page <= maxPages; page++) {
      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            variables: { sku, page }
          })
        });
        if (!resp.ok) throw new Error(`Status ${resp.status}`);
        const { data } = await resp.json();

        const pageReviews = (data.reviewsBySkuId || []).map(r => ({
          author:            r.memberName,
          verifiedPurchase:  r.isVerifiedPurchase,
          date:              r.submissionDate,
          rating:            r.rating,
          title:             r.title,
          text:              r.reviewText
        }));

        console.log(`BestBuyAdapter: page ${page} → ${pageReviews.length} reviews`);
        if (!pageReviews.length) break;
        reviews.push(...pageReviews);

      } catch (err) {
        console.error("BestBuyAdapter: error fetching reviews page", page, err);
        break;
      }
    }

    console.log("BestBuyAdapter: total reviews →", reviews.length);
    return reviews;
      }
}

// walmartAdapter.js
// Implements product info + review scraping for walmart.com
class WalmartAdapter {
  /**
   * Extract product description and features from the product page.
   * - description: the free‐form text from the first .dangerous-html block
   * - features:   an array of bullet points from the second .dangerous-html block
   */
  extractProductInfo(doc) {
    const container = doc.querySelector(
      '[data-testid="product-description-content"]'
    );
    let description = "";
    let features = [];
    console.log("WalmartAdapter: container →", container);
    if (container) {
      // the first dangerous-html block is the paragraph description
      const descBlock = container.querySelector(
        ".dangerous-html.mb3"
      );
      if (descBlock) description = descBlock.innerText.trim();

      // the second dangerous-html block holds a <ul> of feature <li>s
      const featureBlock = Array.from(
        container.querySelectorAll(".dangerous-html.mb3")
      )[1];
      if (featureBlock) {
        features = Array.from(featureBlock.querySelectorAll("li"))
          .map((li) => li.innerText.trim())
          .filter((t) => t.length);
      }
    } else {
      console.warn(
        "WalmartAdapter: product-description-content not found"
      );
    }
    console.log("WalmartAdapter: description →", description);
    console.log("WalmartAdapter: features →", features);
    return {
      description,
      features,
    };
  }

  /**
   * Crawl up to `maxPages` of reviews from Walmart's review API pages.
   * Reviews live at `/reviews/product/<id>?sort=submission-desc&page=N`
   */
  async extractAllReviews(_doc, maxPages = 3) {
    // 1) Derive product ID from URL
    const m = location.pathname.match(
      /\/ip\/(?:[^/]+\/)?(\d+)(?:$|[/?])/
    );
    const pid = m ? m[1] : null;
    if (!pid) {
      console.warn("WalmartAdapter: no product ID found");
      return [];
    }

    let all = [];
    for (let page = 1; page <= maxPages; page++) {
      const url = `https://www.walmart.com/reviews/product/${pid}?sort=submission-desc&page=${page}`;
      console.log(`WalmartAdapter: fetching reviews page ${page} →`, url);

      try {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          console.warn("WalmartAdapter: non-OK response", res.status);
          break;
        }
        const html = await res.text();
        const parser = new DOMParser();
        const rDoc = parser.parseFromString(html, "text/html");

        // each top-level <section> in the reviews list corresponds to one review
        const sections = rDoc.querySelectorAll("section");
        if (!sections.length) {
          console.warn(
            "WalmartAdapter: no <section> reviews on page",
            page
          );
          break;
        }

        const pageReviews = Array.from(sections).map((sec) => {
          // 1) Date
          const dateEl = sec.querySelector(
            "div.f7.gray"
          );
          const date = dateEl?.innerText.trim() || "";

          // 2) Author
          const authorEl = sec.querySelector(
            "span.f7.b"
          );
          const author = authorEl?.innerText.trim() || "";

          // 3) Rating
          const ratingEl = sec.querySelector(
            "span.w_iUH7"
          );
          const rating = ratingEl
            ? parseFloat(ratingEl.innerText)
            : null;

          // 4) Title
          const titleEl = sec.querySelector("h3.f5.b");
          const title = titleEl?.innerText.trim() || "";

          // 5) Text
          const textEl = sec.querySelector(
            'div.flex-column.items-start.f6 span.tl-m'
          );
          const text = textEl?.innerText.trim() || "";

          // 6) Verified?
          const verified = Boolean(
            sec.querySelector("span.b.f7.dark-gray")
          );

          return { date, author, rating, title, text, verified };
        });

        all.push(...pageReviews);
      } catch (err) {
        console.error(
          "WalmartAdapter: error fetching reviews page",
          page,
          err
        );
        break;
      }
    }

    console.log(
      `WalmartAdapter: total reviews collected → ${all.length}`
    );
    return all;
  }
}

function getSiteAdapter(host) {
  if (host.includes("amazon.com")) return new AmazonAdapter();
  if (host.includes("walmart.com")) return new WalmartAdapter();
  if (host.includes("bestbuy.com")) return new BestBuyAdapter();
  throw new Error("No adapter for " + host);
}

function isProductPage(host, doc) {
  if (host.includes("amazon.com")) {
    return Boolean(doc.querySelector("#productTitle"));
  }
  if (host.includes("walmart.com")) {
    // presence of our description container
    return Boolean(
      doc.querySelector('[data-testid="product-description-content"]')
    );
  }
  if (host.includes("bestbuy.com")) {
    return Boolean(doc.querySelector('h1'));
  }
  return false;
}

// Expose to content script
window.CritiqueCortex.getSiteAdapter = getSiteAdapter;
window.CritiqueCortex.isProductPage = isProductPage;
