#!/usr/bin/env node
/* eslint-disable no-undef */

import puppeteer from "puppeteer-core";

const code = process.argv.slice(2).join(" ");
if (!code) {
  console.log("Usage: eval.js '<code>'");
  process.exit(1);
}

const browser = await puppeteer.connect({
  browserURL: "http://localhost:9222",
  defaultViewport: null,
});

const pages = await browser.pages();
const page = pages.length > 0 ? pages[pages.length - 1] : null;

if (!page) {
  console.error("✗ No active tab found");
  process.exit(1);
}

const result = await page.evaluate((c) => {
  const AsyncFunction = (async () => {}).constructor;
  return new AsyncFunction(`return (${c})`)();
}, code);

console.log(result);
await browser.disconnect();
