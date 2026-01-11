const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

/**
 * Checks if the request content is valid and safe.
 * @param {string} text - The critical details text to analyze.
 * @returns {Promise<{isSafe: boolean, reason?: string}>}
 */
async function checkContentSafety(text) {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API Key missing. Skipping AI check (Mock Safe).');
        return { isSafe: true };
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a crisis moderation bot. Analyze the user's help request text. If it is spam, nonsense, or fraudulent, reply with 'UNSAFE: <Reason>'. If it seems like a genuine plea for help, reply with 'SAFE'."
                },
                {
                    role: "user",
                    content: text
                }
            ],
        });

        const result = completion.choices[0].message.content.trim();

        if (result.startsWith('UNSAFE')) {
            return { isSafe: false, reason: result.replace('UNSAFE:', '').trim() };
        }

        return { isSafe: true };
    } catch (error) {
        console.error('AI Guardrails Error:', error);
        // Fail open in emergency context, but log error
        return { isSafe: true };
    }
}

module.exports = { checkContentSafety };
