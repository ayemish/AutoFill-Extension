import * as pdfjsLib from "../libs/pdf/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL(
    "libs/pdf/pdf.worker.mjs"
);

// ----------------------------
// Group text items into lines using their Y position.
// pdf.js gives raw items with no line breaks, so we have to
// reconstruct line structure ourselves before handing text
// to the parser (which depends on real line breaks).
// ----------------------------

function groupItemsIntoLines(items, yTolerance = 2) {

    if (items.length === 0) return [];

    // Top to bottom (pdf y increases upward), then left to right
    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

    const lines = [];
    let currentLine = [];
    let lineStartY = null;

    for (const item of sorted) {

        if (lineStartY === null || Math.abs(item.y - lineStartY) <= yTolerance) {

            currentLine.push(item);
            if (lineStartY === null) lineStartY = item.y;

        } else {

            lines.push(currentLine);
            currentLine = [item];
            lineStartY = item.y;

        }

    }

    if (currentLine.length) lines.push(currentLine);

    return lines.map(line =>
        line
            .sort((a, b) => a.x - b.x)
            .map(i => i.str)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim()
    ).filter(Boolean);

}

// ----------------------------
// Detect a single vertical gap that likely separates two columns
// (e.g. a sidebar + main content layout). Heuristic, not exact:
// finds the largest horizontal gap between item start-positions,
// and only treats it as a column split if it's wide enough and
// roughly centered on the page.
// ----------------------------

function detectColumnSplit(items, pageWidth) {

    if (items.length < 10) return null;

    const xs = [...new Set(items.map(i => i.x))].sort((a, b) => a - b);

    let maxGap = 0;
    let gapCenter = null;

    for (let i = 1; i < xs.length; i++) {

        const gap = xs[i] - xs[i - 1];

        if (gap > maxGap) {
            maxGap = gap;
            gapCenter = (xs[i] + xs[i - 1]) / 2;
        }

    }

    const isWideEnough = maxGap > pageWidth * 0.08;
    const isRoughlyCentered = gapCenter > pageWidth * 0.25 && gapCenter < pageWidth * 0.75;

    if (isWideEnough && isRoughlyCentered) return gapCenter;

    return null;

}

export async function extractPdfText(file) {

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;

    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });

        const content = await page.getTextContent();

        const items = content.items
            .filter(item => item.str && item.str.trim().length > 0)
            .map(item => ({
                str: item.str,
                x: item.transform[4],
                y: item.transform[5]
            }));

        if (items.length === 0) continue;

        const splitX = detectColumnSplit(items, viewport.width);

        let pageText;

        if (splitX !== null) {

            // Two-column layout: read the left column fully, then the right.
            const leftItems = items.filter(i => i.x < splitX);
            const rightItems = items.filter(i => i.x >= splitX);

            const leftLines = groupItemsIntoLines(leftItems);
            const rightLines = groupItemsIntoLines(rightItems);

            pageText = [...leftLines, ...rightLines].join("\n");

        } else {

            pageText = groupItemsIntoLines(items).join("\n");

        }

        fullText += pageText + "\n";

    }

    return fullText;

}