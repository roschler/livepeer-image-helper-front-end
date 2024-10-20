// This module contains code to share a generated image
//  on Twitter.

/**
 * Builds a Twitter share URL with pre-filled tweet text, an image URL, and hashtags.
 *
 * @param {string} postText - The text content of the tweet.
 * @param {string} imageUrl - The URL of the image to share.
 * @param {string[]} aryHashTags - An array of hashtags (without the # symbol).
 *
 * @returns {string} - The generated Twitter share URL.
 */
export function buildImageShareForTwitterUrl(postText: string, imageUrl: string, aryHashTags: string[]): string {
    const baseUrl = "https://twitter.com/intent/tweet?";

    // Validate postText
    if (!postText || postText.trim().length === 0) {
        throw new Error("Post text cannot be empty.");
    }

    // Validate imageUrl
    if (!imageUrl || imageUrl.trim().length === 0) {
        throw new Error("Image URL cannot be empty.");
    }

    // Simple URL validation for imageUrl
    try {
        const url = new URL(imageUrl);
        if (!url.protocol.startsWith("http")) {
            throw new Error("Invalid image URL protocol. Must be HTTP or HTTPS.");
        }
    } catch (e) {
        throw new Error("Invalid image URL.");
    }

    // Encode the post text and image URL
    const textParam = `text=${encodeURIComponent(postText)}`;
    const urlParam = `url=${encodeURIComponent(imageUrl)}`;

// Validate, trim, and encode hashtags (comma-separated)
    const hashtagsParam = aryHashTags.length > 0
        ? `&hashtags=${encodeURIComponent(
            aryHashTags
                .map(tag => tag.trim())  // Trim each hashtag
                .filter(tag => tag.length > 0)  // Filter out any empty strings
                .join(',')
        )}`
        : '';

    // Construct the full URL
    return `${baseUrl}${textParam}&${urlParam}${hashtagsParam}`;
}