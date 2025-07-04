export default async function handler(req, res) {
  try {
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN;
    const storefrontToken = process.env.SHOPIFY_STOREFRONT_TOKEN;

    let products = [];
    let hasNextPage = true;
    let endCursor = null;

    while (hasNextPage) {
      const query = `
        query {
          products(first: 100, ${endCursor ? `after: "${endCursor}"` : ""}) {
            edges {
              node {
                title
                handle
                description
                featuredImage {
                  url
                  altText
                }
                variants(first: 1) {
                  edges {
                    node {
                      price {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
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

      if (!data || !data.data || !data.data.products) {
        throw new Error("Shopify response does not contain products.");
      }

      const edges = data.data.products.edges;

      products = products.concat(edges.map(edge => {
        const variant = edge.node.variants.edges[0]?.node;
        return {
          title: edge.node.title,
          handle: edge.node.handle,
          description: edge.node.description,
          image: edge.node.featuredImage?.url || "",
          price: variant ? `${variant.price.amount} ${variant.price.currencyCode}` : "Price not available"
        };
      }));

      hasNextPage = data.data.products.pageInfo.hasNextPage;
      endCursor = edges.length ? edges[edges.length - 1].cursor : null;
    }

    res.status(200).json({ products });
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch products",
      details: err.message,
    });
  }
}
