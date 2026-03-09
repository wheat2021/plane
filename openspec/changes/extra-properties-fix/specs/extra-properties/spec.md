## REMOVED Requirements

### Requirement: Markdown 属性类型支持

**Reason**: Markdown 类型超出当前需求范围，且与 textarea 类型功能高度重叠，维护富文本编辑器控件成本较高。线上无存量 markdown 类型属性，可直接删除。

**Migration**: 无需迁移。`TExtraPropertyType` 联合类型中删除 `"markdown"`，前端控件文件 `controls/markdown.tsx` 整体删除，`extra-property-control.tsx` 中的 `case "markdown"` 分支删除。
