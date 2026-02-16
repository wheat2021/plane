#!/usr/bin/env node
/* eslint-disable no-undef, turbo/no-undeclared-env-vars, promise/param-names */

import { spawn, execSync } from "node:child_process";
import puppeteer from "puppeteer-core";

const useProfile = process.argv[2] === "--profile";

if (process.argv[2] && process.argv[2] !== "--profile") {
  console.log("Usage: start.js [--profile]");
  console.log("\nOptions:");
  console.log("  --profile  Copy your default Chrome profile (cookies, logins)");
  process.exit(1);
}

// 先检查是否已有 Chrome 在 9222 端口运行
try {
  const browser = await puppeteer.connect({
    browserURL: "http://localhost:9222",
    defaultViewport: null,
  });
  await browser.disconnect();
  console.log("✓ Chrome already running on :9222");
  process.exit(0);
} catch {
  // 没有运行，继续启动新实例
}

const profilePath = `${process.env["HOME"]}/.cache/droid_chrome_profile`;
execSync(`mkdir -p ${profilePath}`, { stdio: "ignore" });

if (useProfile) {
  const chromeProfileSource = `${process.env["HOME"]}/Library/Application Support/Google/Chrome/Default/`;
  execSync(`mkdir -p "${profilePath}/Default"`, { stdio: "ignore" });
  execSync(
    `rsync -a --delete --exclude='SingletonLock' --exclude='SingletonSocket' --exclude='SingletonCookie' --exclude='*.lock' --exclude='lockfile' --exclude='Service Worker' --exclude='Cache' --exclude='Code Cache' --exclude='GPUCache' "${chromeProfileSource}" "${profilePath}/Default/"`,
    { stdio: "pipe" }
  );
}

// 启动独立的 Chrome 实例（不影响用户正在使用的 Chrome）
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
spawn(chromePath, ["--remote-debugging-port=9222", `--user-data-dir=${profilePath}`], {
  detached: true,
  stdio: "ignore",
}).unref();

let connected = false;
for (let i = 0; i < 30; i++) {
  try {
    const browser = await puppeteer.connect({
      browserURL: "http://localhost:9222",
      defaultViewport: null,
    });
    await browser.disconnect();
    connected = true;
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 500));
  }
}

if (!connected) {
  console.error("✗ Failed to connect to Chrome");
  process.exit(1);
}

console.log(`✓ Chrome started on :9222${useProfile ? " with your profile" : ""}`);
