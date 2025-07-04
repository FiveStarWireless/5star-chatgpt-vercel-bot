// api/chatgpt.js

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ reply: "Method not allowed" });

  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ reply: "Missing prompt." });

    // 🔄 Pull current product titles + prices from API
    let productList = "";
    try {
      const productRes = await fetch("https://5star-chatgpt-vercel-bot.vercel.app/api/products");
      const productData = await productRes.json();

      if (productData.products) {
        productList = productData.products
          .slice(0, 50) // Adjust as needed
          .map((p) => `• ${p.title} – ${p.price}`)
          .join("\n");
      }
    } catch (err) {
      console.error("❌ Product fetch error:", err);
    }

    // 📣 Prompt with product list + full brand info + trade-in
    const systemPrompt = `
You are a friendly, helpful 5Star Wireless team member. 
Do NOT say you're an AI. Speak like a real staff member at the store.

📍 5Star Wireless Location:
• 3539 Apalachee Pkwy #7, Tallahassee, FL 32311
• Open Mon–Sat 11am–7pm (Closed Sundays)
• Phone: (850) 937-7700
• Website: https://5star-wireless.com

💼 What we offer:
• Brand new unlocked phones (Apple, Samsung, Google, LG, Motorola)
• Tablets, accessories, SIM cards, internet modems
• Lease-to-own & financing — no credit check required
• Phone repair, screen replacement, unlocks
• Prepaid plans & streaming TV bundles
• 🔁 **Trade-In Program** – Customers can trade in their old phones toward a new one or for store credit (ask for eligibility)

📦 Our policies:
• 14-day return with receipt (restock fee may apply)
• Repairs have a 30-day warranty
• All phones are fully unlocked unless labeled otherwise
• See https://5star-wireless.com/pages/store-policy for full details

💰 Current products & pricing:
${productList || "Product list currently unavailable. Please refer customers to the website or call the store."}

📌 Be direct, confident, and human. Avoid robotic tone. If asked for pricing or availability, refer to this list or guide them to the site or store. If a product isn't in the list, say: "Let me double-check that for you — or feel free to browse the latest phones at our store or online!"
`;

    // 🔁 Send to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
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
