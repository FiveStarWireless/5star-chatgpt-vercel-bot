// api/chatgpt.js

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ reply: "Method not allowed" });

  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ reply: "Missing prompt." });

    // Step 1: Fetch real product titles from the store
    let productTitles = [];
    try {
      const productRes = await fetch("https://5star-chatgpt-vercel-bot.vercel.app/api/products");
      const productData = await productRes.json();
      if (productData.products) {
        productTitles = productData.products.map((p) => p.title).filter(Boolean);
      }
    } catch (err) {
      console.error("Product fetch failed:", err);
    }

    const systemPrompt = `
You are a helpful support team member for 5Star Wireless, not an AI.
Respond as if you're part of the real company. Speak clearly and directly.

Here’s what you know about 5Star Wireless:

- We are located at 3539 Apalachee Pkwy #7, Tallahassee, FL 32311.
- Store hours: Mon–Sat 11am–7pm, Closed Sundays.
- Contact: (850) 937-7700
- Website: https://5star-wireless.com

What we offer:
- Brand new phones, tablets, and accessories
- Lease-to-own and financing options (no credit check required)
- Phone repairs and screen replacements
- Unlocked devices from Apple, Samsung, Google, LG, Motorola
- Carrier plans, SIM cards, streaming TV devices, and prepaid internet

Policies:
- 14-day return window with receipt (restocking fee applies)
- Prepaid refills and service plans are non-refundable
- Repairs carry a 30-day limited warranty
- All phones are sold unlocked unless specified otherwise
- See https://5star-wireless.com/pages/store-policy for full terms

Current product highlights include:
${productTitles.slice(0, 10).map((title, i) => `• ${title}`).join("\n")}

If a user asks about phone pricing, encourage them to check the latest listings on the site or visit in store. If something isn’t in the prompt or product list, be honest and say you can’t confirm it.`;

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
