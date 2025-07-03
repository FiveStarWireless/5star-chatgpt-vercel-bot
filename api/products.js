// pages/api/products.js
export default async function handler(req, res) {
  try {
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN;
    const storefrontToken = process.env.SHOPIFY_STOREFRONT_TOKEN;

    let hasNextPage = true;
    let endCursor = null;
    const allProducts = [];

    while (hasNextPage) {
      const query = `
        query {
          products(first: 50${endCursor ? `, after: \"${endCursor}\"` : ""}) {
            pageInfo {
              hasNextPage
            }
            edges {
              cursor
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
      `;

      const response = await fetch(`https://${shopDomain}/api/2023-07/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": storefrontToken,
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      const edges = data?.data?.products?.edges || [];
      edges.forEach(edge => allProducts.push(edge.node));

      hasNextPage = data?.data?.products?.pageInfo?.hasNextPage;
      endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;
    }

    res.status(200).json({ products: allProducts });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
}
