import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";

if (!process.env.ARCJET_KEY && process.env.NODE_ENV !== 'test') throw new Error('ARCJET_KEY is required');

// Check if ARCJET_KEY has expired
export const isArcjetKeyValid = (): boolean => {
    try {
        if (!process.env.ARCJET_KEY) {
            return false;
        }

        // Check if ARCJET_KEY_EXPIRY is set and has expired
        if (process.env.ARCJET_KEY_EXPIRY) {
            const expiryDate = new Date(process.env.ARCJET_KEY_EXPIRY);
            if (isNaN(expiryDate.getTime())) {
                console.warn('Invalid ARCJET_KEY_EXPIRY date format');
                return true; // Treat invalid date as valid key, proceed with caution
            }

            const now = new Date();
            if (now > expiryDate) {
                console.warn('ARCJET_KEY has expired');
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error checking ARCJET_KEY validity:', error);
        return false;
    }
};

const aj = arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
        shield({ mode: "LIVE" }),
        detectBot({
            mode: "LIVE",
            allow: [
                "CATEGORY:SEARCH_ENGINE",
                "CATEGORY:PREVIEW"
            ],
        }),
        slidingWindow({
            mode: "LIVE",
            interval: '2s',
            max: 5
        })
    ],
});

export default aj;