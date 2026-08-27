const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function validateImageDataUrl(dataUrl) {
    if (typeof dataUrl !== "string") {
        throw new Error("Image data is missing");
    }

    const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match || !SUPPORTED_IMAGE_TYPES.has(match[1])) {
        throw new Error("Unsupported or invalid image. Use a JPG, JPEG, PNG, or WEBP image.");
    }

    const base64Length = match[2].length;
    const padding = match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0;
    const imageBytes = Math.floor((base64Length * 3) / 4) - padding;

    if (imageBytes <= 0 || imageBytes > MAX_IMAGE_BYTES) {
        throw new Error("Image must be smaller than 8 MB.");
    }

    const bytes = Buffer.from(match[2], "base64");
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp = bytes.subarray(0, 4).toString("ascii") === "RIFF"
        && bytes.subarray(8, 12).toString("ascii") === "WEBP";

    if ((match[1] === "image/jpeg" && !isJpeg)
        || (match[1] === "image/png" && !isPng)
        || (match[1] === "image/webp" && !isWebp)) {
        throw new Error("The image appears to be corrupted or does not match its file type.");
    }

    return { mimeType: match[1], size: imageBytes };
}

module.exports = {
    MAX_IMAGE_BYTES,
    validateImageDataUrl
};