---
name: browser
description: 使用 Chrome DevTools Protocol 进行浏览器自动化和抓取的最小工具集。用于启动 Chrome、导航页面、执行 JavaScript 和继承用户配置。
---

# 浏览器工具

用于协作式网站探索和数据抓取的最小化 CDP 工具。

**重要提示**: 所有脚本都位于技能目录中，并应通过其完整路径调用。

## 启动 Chrome

```bash
~/.claude/skills/browser/start.js              # 使用全新的配置启动
~/.claude/skills/browser/start.js --profile    # 复制并使用您当前的 Chrome 配置 (Cookie, 登录状态等)
```

在端口 `9222` 上启动 Chrome 并开启远程调试。

## 页面导航

```bash
~/.claude/skills/browser/nav.js https://example.com
~/.claude/skills/browser/nav.js https://example.com --new
```

导航当前标签页或在新标签页中打开。

## 执行 JavaScript

```bash
~/.claude/skills/browser/eval.js 'document.title'
```

在当前激活的标签页中执行 JavaScript 代码。
