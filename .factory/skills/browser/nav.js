#!/usr/bin/env node
/* eslint-disable no-undef */

import puppeteer from "puppeteer-core";

const url = process.argv[2];
const newTab = process.argv[3] === "--new";

if (!url) {
  console.log("Usage: nav.js <url> [--new]");
  process.exit(1);
}

const browser = await puppeteer.connect({
  browserURL: "http://localhost:9222",
  defaultViewport: null,
});

if (newTab) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
} else {
  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[pages.length - 1] : await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
}

console.log(`✓ Navigated to: ${url}`);
await browser.disconnect();
