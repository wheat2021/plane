## 1. 准备阶段

- [x] 1.1 查询 FICC 项目当前 Requirement issues 数量，确认为 0（防重复导入）
- [x] 1.2 查询现有 Modules 列表，记录 `FICC策略平台整合项目` 的 UUID
- [x] 1.3 从 xlsx 提取所有 select 类型列的唯一值（department、category_l1/l2/l3、center、team、estimated_iteration），作为 select options
- [x] 1.4 查询 Plane 成员列表，建立 `IT产品经理姓名 → UUID` 映射表（夏清、刘佩金、吴克易琼、曾慧聪、成楠、钱高翔）
- [x] 1.5 查询 Requirement 类型默认 state UUID（Backlog 或 Todo）

## 2. 创建 Cycle

- [x] 2.1 POST `/cycles/` 创建 `大象-常规-26-0425`（start=2026-03-29, end=2026-04-25），记录 cycle UUID

## 3. 创建/更新 Modules

- [x] 3.1 POST `/modules/` 创建 `【Calypso下线项目】Tarf簿记`（external_id=FICC-89145）
- [x] 3.2 POST `/modules/` 创建 `【海外交易能力建设】香港外汇期货做市项目`（external_id=FICC-86320）
- [x] 3.3 POST `/modules/` 创建 `FICC交易日历优化项目`（external_id=FICC-71665）
- [x] 3.4 POST `/modules/` 创建 `FICC人工智能专项项目`（external_id=FICC-71673）
- [x] 3.5 POST `/modules/` 创建 `【海外交易能力建设】美国国债自营交易链路`（external_id=FICC-83808）
- [x] 3.6 POST `/modules/` 创建 `O45迁移项目`（external_id=FICC-71671）
- [x] 3.7 POST `/modules/` 创建 `【Calypso下线项目】美国国债簿记`（external_id=FICC-87146）
- [x] 3.8 POST `/modules/` 创建 `FICCUI测试专项`（external_id=FICC-77108）
- [x] 3.9 POST `/modules/` 创建 `境外本地化部署规划`（external_id=FICC-85209）
- [x] 3.10 PATCH `/modules/{id}/` 更新 `FICC策略平台整合项目`，补充 external_id=FICC-71606
- [x] 3.11 验证：GET `/modules/` 返回 10 个 Module

## 4. 创建 Extra Properties

- [x] 4.1 创建 `department`（select）：选项 固定收益部、香港金控FICC、中央交易室、资金运营部、风险管理部、信息技术部
- [x] 4.2 创建 `domestic_overseas`（select）：选项 境内、境外
- [x] 4.3 创建 `category_l1`（select）：全部唯一值作为选项
- [x] 4.4 创建 `category_l2`（select）：全部唯一值作为选项
- [x] 4.5 创建 `category_l3`（select）：全部唯一值作为选项
- [x] 4.6 创建 `center`（select）：全部唯一值作为选项
- [x] 4.7 创建 `team`（select）：全部唯一值作为选项
- [x] 4.8 创建 `biz_pm`（text）：固收产品经理
- [x] 4.9 创建 `biz_priority`（text）：业务优先级
- [x] 4.10 创建 `it_pm`（member）：IT产品经理，config={"member_color": "#10b981"}
- [x] 4.11 创建 `in_delivery`（checkbox）：是否纳入交付
- [x] 4.12 创建 `estimated_iteration`（select）：全部唯一值作为选项
- [x] 4.13 创建 `delivery_content`（text）：交付内容
- [x] 4.14 创建 `remarks`（text）：备注
- [x] 4.15 验证：查询 Requirement 绑定的 extra properties 共 16 个

## 5. 生成 import_ready CSV

- [x] 5.1 编写 Python 脚本读取 xlsx，执行字段映射（name、description_html、extra_properties、cycle_id、module_id）
- [x] 5.2 `it_pm` 列通过姓名匹配转换为 Plane 成员 UUID
- [x] 5.3 `in_delivery` 列"是"→true，"否"→false
- [x] 5.4 `重点项目标签` 列通过名称匹配填入 module_id，"无"/空填空字符串
- [x] 5.5 生成 `jira_data/26-0425_import_ready.csv`，展示前 3 行供核查

## 6. 导入 Requirement Issues

- [x] 6.1 执行导入脚本，逐行 POST `/issues/`（间隔 0.3s），收集返回的 issue UUID
- [x] 6.2 输出导入结果：成功/失败数量及失败列表
- [x] 6.3 POST `/cycles/{cycle_id}/cycle-issues/` 批量关联所有成功导入的 issue 到 0425 Cycle
- [x] 6.4 POST `/modules/{module_id}/module-issues/` 关联 5 条有项目标签的 issue 到对应 Module
- [x] 6.5 验证：在 Plane UI 中检查 Cycle、Module 中 issue 数量是否符合预期
