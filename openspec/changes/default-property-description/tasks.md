## 1. 提交变更文档

- [x] 1.1 提交 openspec 变更文档（proposal、design、specs、tasks）

## 2. 升级描述弹窗（Markdown 支持）

- [x] 2.1 修改 `core/components/issues/extra-properties/description-popover.tsx`：将纯文本渲染替换为 `MarkdownRenderer`，宽度改为 `w-80`，添加 `max-h-48 overflow-y-auto`

## 3. 新建 DefaultPropertyConfigStore

- [x] 3.1 新建 `core/store/default-property-config.store.ts`：MobX store，初始化时从 localStorage 读取，提供 `getDescription` / `setDescription` 方法，写入时同步 localStorage
- [x] 3.2 在 `core/store/root.store.ts` 中注册新 store

## 4. 新建 hook

- [x] 4.1 新建 `core/hooks/store/use-default-property-config.ts`：封装 store 访问

## 5. 设置页 Default Properties 区块

- [x] 5.1 新建 `core/components/project-work-item-types/default-property-config-list.tsx`：列出 10 个可配置属性，每行支持 inline textarea 编辑 description，onBlur 时自动保存
- [x] 5.2 修改 `core/components/project-work-item-types/work-item-type-item.tsx`：在展开面板顶部（Extra Properties 之上）挂载 `DefaultPropertyConfigList`

## 6. 侧边栏 ℹ️ 图标 [UPSTREAM-RISK]

- [x] 6.1 修改 `core/components/issues/issue-detail/sidebar.tsx`：在各 `SidebarPropertyListItem` 的 `appendElement` 中，当 `issue.type_id` 不为 null 且对应属性有 description 时，传入 `ExtraPropertyDescriptionPopover`

## 7. 提交实现代码

- [ ] 7.1 提交所有实现文件：`git commit -m "#FICC-9999# feat: 升级描述弹窗支持 Markdown 渲染"`
- [ ] 7.2 提交设置页和 store：`git commit -m "#FICC-9999# feat: 新增默认属性 description 配置功能"`
- [ ] 7.3 提交侧边栏改动：`git commit -m "#FICC-9999# feat: 侧边栏默认属性展示 description 图标"`

## 8. 用户验证

- [ ] 8.1 验证弹窗升级：在任意 extra property 的 description 中写入 `**粗体**` 和 `- 列表`，点击 ℹ️ 图标，确认以 Markdown 格式正确渲染，多行内容可滚动
- [ ] 8.2 验证设置页：打开项目设置 → Work Item Types → 展开任意类型，确认顶部出现 "Default Properties" 区块，列出 10 个属性，输入 description 后失焦自动保存，刷新页面后数据仍存在
- [ ] 8.3 验证侧边栏：为某 issue type 的 "Priority" 配置 description，打开一个该类型的 issue，确认侧边栏 Priority 旁出现 ℹ️ 图标，点击后以 Markdown 渲染 description
- [ ] 8.4 验证 type_id 为 null 时不显示：打开一个未设置 work item type 的 issue，确认侧边栏不显示任何 ℹ️ 图标
