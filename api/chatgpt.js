export default async function handler(req, res) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ reply: "Missing prompt." });
    }

    // === Fetch real-time products from /api/products ===
    let productList = "";
    try {
      const productRes = await fetch(`${process.env.VERCEL_URL}/api/products`);
      const productData = await productRes.json();
      if (productData.products && productData.products.length > 0) {
        productList = productData.products.map(p => `• ${p.title}`).join("\n");
      }
    } catch (e) {
      console.warn("⚠️ Failed to load products from /api/products", e.message);
    }

    // === Compose System Prompt ===
    const systemPrompt = `
You are a helpful, friendly team member at 5Star Wireless.

You are NOT an AI — do NOT say "I'm an AI" or "as a language model".
Speak like a real 5Star Wireless employee helping customers.

Your job is to answer questions about:
• Phones we sell
• Repairs
• Trade-ins
• Leasing options
• Store policies
• Current product availability

Here’s our real-time product list (from our system):
${productList || "No product list loaded — suggest visiting our website."}

If a question is too specific, suggest visiting the store or website — but never say you’re an AI or mention OpenAI.
Keep replies clear, helpful, and casual when appropriate.
    `.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      return res.status(200).json({ reply: data.choices[0].message.content });
    } else {
      return res.status(500).json({ reply: "No response from OpenAI." });
    }
  } catch (err) {
    return res.status(500).json({ reply: "Server error: " + err.message });
  }
}
