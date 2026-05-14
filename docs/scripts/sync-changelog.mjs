#!/usr/bin/env node
/**
 * Sync CHANGELOG.md to docs/changelog/
 *
 * This script copies the content from the root CHANGELOG.md to the docs site,
 * with formatting changes for VitePress compatibility.
 *
 * Run from the docs directory: node scripts/sync-changelog.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = join(__dirname, "..");
const rootDir = join(docsDir, "..");

const sourcePath = join(rootDir, "CHANGELOG.md");

// Target paths
const zhTargetPath = join(docsDir, "changelog/zh-CN/index.md");
const enTargetPath = join(docsDir, "changelog/en/index.md");

const ZH_HEADER = `---
layout: default
title: 更新日志
description: Note Sync Now 版本更新历史。
---

# 更新日志

本页记录 Note Sync Now 的版本更新历史。

`;

const EN_HEADER = `---
layout: default
title: Changelog
description: Note Sync Now release history.
---

# Changelog

This page documents the changes in each Note Sync Now release.

`;

function processContent(content, isZh) {
  // Remove HTML comments
  content = content.replace(/<!--[\s\S]*?-->\n*/g, "");

  // Remove the "# Changelog" title
  content = content.replace(/^# Changelog\n+/, "");
  content = content.replace(/^# 更新日志\n+/, "");

  // Convert title format: ## [v2.2.0] - 2025-01-15 -> ## v2.2.0 (2025-01-15)
  content = content.replace(
    /^## \[([^\]]+)\] - (\d{4}-\d{1,2}-\d{1,2})/gm,
    "## $1 ($2)"
  );

  // Keep subsection headers but style them
  // ### Added -> **Added**
  content = content.replace(
    /^### (Added|Changed|Fixed|Improved|Security|Deprecated|Removed)\n+/gm,
    "\n**$1**\n\n"
  );

  // Keep subsection headers in Chinese
  content = content.replace(
    /^### (新增|修改|修复|改进|安全|弃用|移除)\n+/gm,
    "\n**$1**\n\n"
  );

  return content.trim() + "\n";
}

function main() {
  if (!existsSync(sourcePath)) {
    console.log("CHANGELOG.md not found, skipping sync");
    return;
  }

  const content = readFileSync(sourcePath, "utf-8");

  // Ensure directories exist
  const zhDir = dirname(zhTargetPath);
  const enDir = dirname(enTargetPath);

  if (!existsSync(zhDir)) {
    mkdirSync(zhDir, { recursive: true });
  }
  if (!existsSync(enDir)) {
    mkdirSync(enDir, { recursive: true });
  }

  // Write Chinese version
  const zhContent = ZH_HEADER + processContent(content, true);
  writeFileSync(zhTargetPath, zhContent);
  console.log(`Synced changelog to ${zhTargetPath}`);

  // Write English version (same content for now)
  const enContent = EN_HEADER + processContent(content, false);
  writeFileSync(enTargetPath, enContent);
  console.log(`Synced changelog to ${enTargetPath}`);
}

main();
