const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const MAX_FILE_BYTES = 12 * 1024 * 1024;
const SUPPORTED_FILE_TYPES = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

function decodeDataUrl(dataUrl) {
    if (typeof dataUrl !== "string") {
        throw new Error("File data is missing");
    }

    const match = dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
        throw new Error("Unsupported or invalid file data URL.");
    }

    const mimeType = match[1];
    if (!SUPPORTED_FILE_TYPES.has(mimeType)) {
        throw new Error("Unsupported file type. Use a PDF or DOCX file.");
    }

    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length <= 0 || buffer.length > MAX_FILE_BYTES) {
        throw new Error("File must be smaller than 12 MB.");
    }

    return { mimeType, buffer };
}

function validateFileDataUrl(dataUrl) {
    decodeDataUrl(dataUrl);
    return true;
}

async function extractFileTextFromDataUrl(dataUrl) {
    const { mimeType, buffer } = decodeDataUrl(dataUrl);

    if (mimeType === "application/pdf") {
        const parser = new pdfParse.PDFParse({ data: buffer, verbosity: pdfParse.VerbosityLevel.ERRORS });
        const parsed = await parser.getText();
        const text = parsed?.text?.trim();
        if (!text) {
            throw new Error("Unable to extract text from the PDF file.");
        }
        return text;
    }

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value?.trim();
        if (!text) {
            throw new Error("Unable to extract text from the DOCX file.");
        }
        return text;
    }

    throw new Error("Unsupported file type. Use a PDF or DOCX file.");
}

module.exports = {
    MAX_FILE_BYTES,
    SUPPORTED_FILE_TYPES,
    validateFileDataUrl,
    extractFileTextFromDataUrl
};
