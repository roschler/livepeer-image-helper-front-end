// This app uses a randomly generated anonymous ID
//  without which the LLM session would break
//  because we use the LLM to hold a continuous
//  chat with the user as it helps them create
//  the perfect image with generative AI.

/**
 * Retrieves the value of a specific cookie by its name.
 *
 * @param {string} name - The name of the cookie to retrieve.
 * @returns {(string | undefined)} - The value of the cookie if found, or undefined if not found.
 */
function getCookie(name: string): string | undefined {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
}

/**
 * Sets a cookie with a given name and value, and an optional expiration time.
 * If no expiration time is provided, the cookie will last for 10 years by default.
 *
 * @param {string} name - The name of the cookie to set.
 * @param {string} value - The value of the cookie.
 * @param {number} [days=3650] - The number of days until the cookie expires. Default is 10 years (3650 days).
 */
function setCookie(name: string, value: string, days = 3650): void {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // Convert days to milliseconds
    const expires = `expires=${date.toUTCString()};`;
    document.cookie = `${name}=${value};${expires}path=/`;
}


/**
 * Retrieves the anonymous user ID from the cookies, or creates and stores a new one if it doesn't exist.
 *
 * @returns {string} - The anonymous user ID from the cookies, or a newly generated one if none exists.
 */
export function getOrCreateAnonymousId(): string {
    const cookieName = 'anonymousUserId';

    // Retrieve the existing anonymous ID from cookies
    let anonymousId = getCookie(cookieName);

    // If no ID exists, generate a new one and store it in the cookie
    if (!anonymousId) {
        anonymousId = crypto.randomUUID();
        setCookie(cookieName, anonymousId, 365);
    }

    // Return the existing or new anonymous ID
    return anonymousId;
}
