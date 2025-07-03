export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
    const accessToken = process.env.SHOPIFY_STOREFRONT_TOKEN;

    const response = await fetch(`https://${shopifyDomain}/api/2023-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query: `
          {
            products(first: 10) {
              edges {
                node {
                  title
                  handle
                  description
                  images(first: 1) {
                    edges {
                      node {
                        url
                      }
                    }
                  }
                }
              }
            }
          }
        `,
      }),
    });

    const result = await response.json();

    const products = result.data.products.edges.map((edge) => ({
      title: edge.node.title,
      handle: edge.node.handle,
      description: edge.node.description,
      image: edge.node.images.edges[0]?.node?.url || null
    }));

    res.status(200).json({ products });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
}
