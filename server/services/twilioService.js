const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Only initialize if we have a valid-looking SID
const client = (accountSid && accountSid.startsWith('AC'))
    ? twilio(accountSid, authToken)
    : null;

/**
 * Parses incoming SMS text to extract request details.
 * Expected format: "HELP [Location] [Need] [Details]"
 * e.g., "HELP Central Park Water Injured leg"
 */
function parseSMS(body) {
    // Simple regex parser for MVP. 
    // In production, use an LLM for robust extraction.
    const regex = /HELP\s+(.+?)\s+(Water|Food|Medical|Shelter|Other)\s+(.+)/i;
    const match = body.match(regex);

    if (!match) {
        return null;
    }

    // Mock geocoding since we only have text location
    // In real app, call Google Maps Geocoding API here
    const mockCoordinates = [-73.9665, 40.7812]; // Central Park example

    return {
        locationName: match[1].trim(),
        coordinates: mockCoordinates,
        urgentNeeds: [match[2]], // Capitalize matched need
        criticalDetails: match[3].trim(),
    };
}

async function sendSMS(to, body) {
    if (!client) {
        console.log(`[MOCK SMS] To: ${to}, Body: ${body}`);
        return;
    }

    try {
        await client.messages.create({
            body: body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
    } catch (error) {
        console.error('Twilio Error:', error);
    }
}

module.exports = { parseSMS, sendSMS };
