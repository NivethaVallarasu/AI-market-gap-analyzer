const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeIdea, mergeProductInsights, buildFallbackReport } = require('./analysisService');

test('analyzeIdea returns a structured market report from conversation messages', async () => {
    const messages = [
        { sender: 'user', text: 'I want to build an AI-powered tool for local restaurants to automate bookings and reduce no-shows.' },
        { sender: 'bot', text: 'That sounds promising. The core users are restaurant owners who need better booking management.' }
    ];

    const report = await analyzeIdea(messages);

    assert.ok(report);
    assert.equal(typeof report.opportunityScore, 'number');
    assert.ok(report.verdict && report.verdict.length > 0);
    assert.ok(Array.isArray(report.competitors));
    assert.ok(Array.isArray(report.marketGaps));
    assert.ok(report.swot && typeof report.swot === 'object');
    assert.ok(Array.isArray(report.roadmap));
});

test('mergeProductInsights enriches the report with Product Hunt data', () => {
    const report = mergeProductInsights({
        competitors: [],
        marketGaps: []
    }, {
        data: {
            posts: {
                edges: [
                    { node: { name: 'ChefOps', tagline: 'AI bookings for restaurants' } }
                ]
            }
        }
    });

    assert.ok(report.competitors.includes('ChefOps'));
    assert.ok(report.marketGaps.includes('Opportunity to differentiate with a workflow designed for the target user'));
});

test('fallback analysis uses the latest product discussed in the chat', () => {
    const report = buildFallbackReport([
        { sender: 'user', text: 'I want to build an AI restaurant booking app.' },
        { sender: 'bot', text: 'Who are the target users?' },
        { sender: 'user', text: 'Actually, my product is an AI note taking app for students.' }
    ]);

    assert.ok(report.competitors.includes('Notion'));
    assert.ok(!report.competitors.includes('OpenTable'));
    assert.ok(report.competitors.length >= 7);
});

test('normalizeOpportunityScore converts 10-point scores to 100 and percent/rationals correctly', () => {
    const { normalizeOpportunityScore } = require('./analysisService');

    assert.equal(normalizeOpportunityScore(8), 80);
    assert.equal(normalizeOpportunityScore('8'), 80);
    assert.equal(normalizeOpportunityScore('8/10'), 80);
    assert.equal(normalizeOpportunityScore('8 of 10'), 80);
    assert.equal(normalizeOpportunityScore('75%'), 75);
    assert.equal(normalizeOpportunityScore('85/100'), 85);
    assert.equal(normalizeOpportunityScore('7.5/10'), 75);
});
