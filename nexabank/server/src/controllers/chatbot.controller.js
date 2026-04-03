const axios = require('axios');

async function chat(req, res) {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing from environment");

    // Nexie System Identity
    const systemPrompt = `You are Nexie, the official digital banking assistant for NexaBank.
    Your goal is to provide helpful, secure, and accurate information about NexaBank's services.
    
    NexaBank Products & Services:
    - Savings Accounts: 4% interest, ₹1,000 minimum balance.
    - Current Accounts: Industrial banking with Zero Balance options.
    - Loans: Personal (13.5%), Home (9.5%), Car (10.5%), Business (14.5%), Education (10%), Gold (9%).
    - Fixed Deposits (FD): High interest rates up to 7.5% for seniors.
    - Digital Banking: Mobile app, UPI/QR payments, 24/7 IMPS/NEFT.
    - Security: 256-bit encryption, 2FA, Session management.
    - Branches: Over 500 across India.
    
    Guidelines:
    - Be professional, friendly, and concise.
    - Never ask for passwords, PINs, or sensitive OTPs.
    - If unsure, direct the user to 'Support Center' or 'Contact Advisor'.
    - Keep responses formatted in simple markdown if needed (bullets, bold).
    - You are strictly an assistant for NexaBank. Do not answer questions unrelated to banking or general helpfulness within the context of being a bank clerk.`;

    const contents = [];
    
    // Convert history (frontend format to Google format)
    if (history && history.length > 0) {
      history.forEach(h => {
        contents.push({
          role: h.role, // "user" or "model"
          parts: h.parts // [{ text: "..." }]
        });
      });
    }

    // Add current message with system identity for the very first message
    const fullMessage = contents.length === 0 ? `[IDENTITY: ${systemPrompt}]\n\n${message}` : message;
    
    contents.push({
      role: "user",
      parts: [{ text: fullMessage }]
    });

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(url, { 
      contents,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.candidates && response.data.candidates[0].content) {
      const botText = response.data.candidates[0].content.parts[0].text;
      res.json({ response: botText });
    } else {
      console.error("[CHATBOT ERROR] Unusual response format:", JSON.stringify(response.data));
      throw new Error("Invalid response from Gemini API");
    }

  } catch (err) {
    console.error("[CHATBOT ERROR]", err.response?.data || err.message);
    const apiError = err.response?.data?.error?.message || err.message;
    res.status(500).json({ 
      error: "Nexie is currently experiencing high demand. Please try again in a moment.",
      details: apiError
    });
  }
}

module.exports = { chat };
