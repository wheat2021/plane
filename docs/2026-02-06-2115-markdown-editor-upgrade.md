# Markdown 编辑器升级：textarea → LiteTextEditor

## 目标

将 Extra Properties 中 markdown 类型控件从简单 textarea 升级为项目内置的 LiteTextEditor 富文本编辑器，使其支持格式化编辑（加粗、斜体、列表等）。

## 背景

Extra Properties 功能（docs/2026-02-06-0622-extra-properties-implementation.md）支持 6 种输入类型，其中 markdown 类型最初使用 `<textarea>` 作为临时方案。本次变更完成最后的待办项，将其替换为与项目其他编辑器一致的 LiteTextEditor。

## 方案

### 选择 LiteTextEditor wrapper 而非底层 LiteTextEditorWithRef

项目中存在两层编辑器抽象：

| 层级    | 组件                    | 位置                            | 职责                                                                                                         |
| ------- | ----------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 底层    | `LiteTextEditorWithRef` | `@plane/editor`                 | TipTap 编辑器核心，需手动配置 fileHandler、mentionHandler、extensions 等                                     |
| wrapper | `LiteTextEditor`        | `@/components/editor/lite-text` | 封装了 `useEditorConfig`、`useEditorMention`、`useEditorFlagging`、`useParseEditorContent` 等 hook，自动配置 |

选择 wrapper 层，因为：

- 自动获取 mention、file handler、editor flagging 等配置，无需手动组装
- 与项目中 comment 编辑器保持一致的配置和行为
- `variant="none"` 参数可隐藏工具栏，适合侧边栏紧凑布局

### 存储格式变更

| 项目     | 升级前                                | 升级后                                      |
| -------- | ------------------------------------- | ------------------------------------------- |
| 存储格式 | 纯文本字符串                          | HTML 字符串                                 |
| 存储位置 | `issue.extra_properties.{key}` (JSON) | 不变                                        |
| 示例值   | `"Fixed login bug"`                   | `"<p><strong>Fixed login bug</strong></p>"` |

这是不可逆变更 — 已有纯文本值在编辑器中会被视为 `initialValue`。由于该功能尚在开发阶段未正式发布，无需考虑旧数据迁移。

### 保存机制

保持与其他 Extra Property 控件一致的 blur-on-save 模式：

```
onChange(json, html) → 更新 latestHtmlRef
                           ↓
              容器 div onBlur 触发
                           ↓
              比较 latestHtmlRef vs savedValueRef
                           ↓ (不同时)
              调用 props.onChange(html) → PATCH issue
```

使用 `e.currentTarget.contains(e.relatedTarget)` 判断焦点是否真正离开编辑器区域（避免编辑器内部焦点移动触发误保存）。

---

## 变更详情

### 修改文件

**`apps/web/core/components/issues/extra-properties/controls/markdown.tsx`**

完全重写，从 61 行 textarea 实现替换为 113 行 LiteTextEditor 实现。

#### 新增依赖

```typescript
import { observer } from "mobx-react";
import type { EditorRefApi } from "@plane/editor";
import { EFileAssetType } from "@plane/types";
import { LiteTextEditor } from "@/components/editor/lite-text";
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useWorkspace } from "@/hooks/store/use-workspace";
```

#### 关键实现点

1. **workspaceId 获取**：LiteTextEditor wrapper 需要 `workspaceId`（UUID），而组件仅接收 `workspaceSlug`。通过 `useWorkspace().getWorkspaceBySlug(slug)` 转换。

2. **discriminated union 处理**：LiteTextEditor wrapper 的 props 类型是 `{ editable: false } | { editable: true; uploadFile; duplicateFile }`。使用条件构建 `editableProps` 对象并 spread：

   ```typescript
   const editableProps = editable
     ? { editable: true as const, uploadFile: ..., duplicateFile: ... }
     : { editable: false as const };
   ```

3. **文件上传**：使用 `EFileAssetType.COMMENT_DESCRIPTION` 作为 entity_type（项目中无专用的 extra property asset 类型），`config.id` 作为 entity_identifier。

4. **LiteTextEditor 配置**：

   ```typescript
   variant="none"              // 隐藏工具栏
   showSubmitButton={false}    // 不显示提交按钮
   parentClassName="!border-0" // 去除外边框
   containerClassName="!p-0"   // 去除内边距
   editorClassName="!pl-0 !pt-0 !pb-0 text-sm"  // 紧凑排版
   ```

5. **observer 包裹**：组件使用 `observer()` 包裹（之前不需要），因为 `useWorkspace` 返回的 MobX store 数据需要响应式更新。

#### 移除内容

- `useState` 的 localState 管理（replaced by refs）
- `isExpanded` 展开/收缩状态
- `<textarea>` 元素及其 CSS 类
- "Markdown formatting supported" 提示文字

---

## 验证

### 静态检查

```bash
pnpm --filter=web check:types  # 通过
pnpm --filter=web check:lint   # 0 errors, 仅既有 warnings
```

### 浏览器测试 (2026-02-06 21:15)

测试环境：Bug 类型工作项上新增 `Release Notes` (markdown) 额外属性配置。

| 测试项       | 结果                                       |
| ------------ | ------------------------------------------ |
| 编辑器渲染   | LiteTextEditor 正确渲染，placeholder 显示  |
| 文本输入     | 输入文本正常                               |
| 富文本格式化 | Cmd+B 加粗生效，文本显示为粗体             |
| 多行输入     | Enter 创建新段落                           |
| Blur 保存    | 点击编辑器外区域触发 PATCH 204             |
| 数据持久化   | 关闭重新打开 peek view，内容和格式正确保留 |
| 控制台错误   | 无相关错误                                 |

---

## 已知限制

1. **文件上传 asset type**：使用 `COMMENT_DESCRIPTION` 而非专用类型，如果后续需要区分管理 extra property 中的上传文件，需新增 `EFileAssetType`。
2. **无独立工具栏**：`variant="none"` 隐藏了格式化工具栏，用户需依赖键盘快捷键（Cmd+B/I/U 等）或 `/` 斜杠命令进行格式化。如需工具栏可改为 `variant="lite"`。
