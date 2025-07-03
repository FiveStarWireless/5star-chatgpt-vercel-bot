// /api/products.js

export default async function handler(req, res) {
  try {
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN;
    const storefrontToken = process.env.SHOPIFY_STOREFRONT_TOKEN;

    const response = await fetch(`https://${shopDomain}/api/2023-07/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken
      },
      body: JSON.stringify({
        query: `
          {
            products(first: 10) {
              edges {
                node {
                  id
                  title
                  description
                  handle
                  featuredImage {
                    url
                    altText
                  }
                }
              }
            }
          }
        `
      })
    });

    const data = await response.json();

    // ✅ Check if data.products exists
    if (!data.data || !data.data.products) {
      throw new Error("Shopify response does not contain products.");
    }

    const products = data.data.products.edges.map(edge => edge.node);
    res.status(200).json({ products });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
}
