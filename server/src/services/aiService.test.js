const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSystemPrompt, buildMessageContent, getVisionModelCandidates, getAnalysisModelCandidates, buildVisualFallbackResponse } = require('./aiService');

test('buildSystemPrompt allows the assistant to answer general questions while staying helpful', () => {
    const prompt = buildSystemPrompt();

    assert.ok(prompt.includes('helpful assistant'));
    assert.ok(prompt.includes('Answer the user\'s question directly'));
    assert.ok(prompt.includes('general-purpose multimodal AI assistant'));
    assert.ok(prompt.includes('describe the image and highlight important visual details'));
});

test('buildMessageContent creates a Gemini-compatible image content block', async () => {
    const content = await buildMessageContent({
        text: 'What is this?',
        image: { dataUrl: 'data:image/png;base64,iVBORw0KGgo=' }
    });

    assert.equal(content[0].text, 'What is this?');
    assert.equal(content[1].inlineData.mimeType, 'image/png');
    assert.equal(content[1].inlineData.data, 'iVBORw0KGgo=');
});

test('buildMessageContent returns plain text for PDF file uploads', async () => {
    const content = await buildMessageContent({
        text: 'Please analyze this PDF.',
        file: {
            dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJSDihpDihpDihpQKMSAwIG9iago8PAovVHlwZSAvQ2F0ZWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9Db3VudCAxCi9LaWRzIFszIDAgUl0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCAyMDAgMjAwXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA0NAo+Pgogc3RyZWFtCkJUCg9GMSAyNCBUZgotODAgMTkwIFQoSGVsbG8pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDY2IDAwMDAwIG4gCjAwMDAwMDAxMjMgMDAwMDAgbiAKMDAwMDAwMDIxOSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9Sb290IDEgMCBSCi9TaXplIDUKPj4Kc3RhcnR4cmVmCjM0NQolJUVPRgo='
        }
    });

    assert.equal(typeof content, 'string');
    assert.ok(content.includes('Please analyze this PDF.'));
    assert.ok(content.includes('Attached file content:'));
    assert.ok(content.includes('Hello'));
});

test('vision requests use a configurable vision model with a working default', () => {
    const previousModel = process.env.GEMINI_VISION_MODEL;
    delete process.env.GEMINI_VISION_MODEL;

    assert.ok(getVisionModelCandidates().includes('gemini-3.5-flash'));

    if (previousModel) process.env.GEMINI_VISION_MODEL = previousModel;
});

test('analysis requests prefer the fast analysis model', () => {
    assert.equal(getAnalysisModelCandidates()[0], 'gemini-3.5-flash');
});

test('Mermaid architecture requests have a fallback response', () => {
    const response = buildVisualFallbackResponse([
        { sender: 'user', text: 'Draw a Mermaid architecture diagram for a food-delivery app.' }
    ]);

    assert.match(response, /```mermaid/);
    assert.match(response, /Customer App/);
});
