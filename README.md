# foundit · 数字储物盒

记录日常物品的存放位置，随时回答"我的东西放哪了？"。

基于微信云开发（无云函数，纯客户端直连云数据库/云存储），单用户使用，数据按微信 openid 自动隔离。

## 功能

- **层级位置**：家 → 房间 → 容器（容器可继续嵌套，如 衣柜 → 上层抽屉）
- **物品管理**：名称、照片（最多 3 张）、分类、备注
- **搜索**：按名称/备注模糊搜索，结果显示完整存放路径
- **取出/放回/移动**：记录物品动向，详情页展示完整操作时间线

## 数据模型（云数据库集合）

| 集合 | 说明 |
|---|---|
| `locations` | 位置树：`name` / `type`(home·room·container) / `parentId` / `icon` / `sortOrder` |
| `items` | 物品：`name` / `note` / `photos`(fileID 数组) / `category` / `locationId` / `status`(in_place·taken_out) |
| `item_logs` | 操作日志（不可变）：`itemId` / `action`(create·move·take_out·return·edit) / `fromPathText` / `toPathText` / `note` |

## 首次运行前的准备（必做）

1. 用微信开发者工具打开本项目，点击顶栏「云开发」开通/创建环境，复制**环境 ID**。
2. 将环境 ID 填入 `miniprogram/app.js` 的 `globalData.env`。
3. 云开发控制台 → **数据库**：创建集合 `locations`、`items`、`item_logs`，每个集合的权限设置改为**「仅创建者可读写」**。
4. （推荐）为集合添加索引：
   - `items`：`_openid + locationId`、`_openid + category`、`_openid + status`
   - `item_logs`：`_openid + itemId + createdAt(降序)`
   - `locations`：`_openid + parentId`
5. 云开发控制台 → **存储** → 权限设置 → **「仅创建者可读写」**。

完成后编译运行，首页会引导创建「家 → 房间 → 容器」，随后即可添加物品。

## 目录结构

```
miniprogram/
├── app.js / app.json / app.wxss     # 入口、路由与 tabBar、全局样式
├── components/location-picker/       # 位置选择器（半屏弹层，逐级下钻）
├── pages/
│   ├── home/            # 首页：搜索入口、分类、最近添加、已取出提醒
│   ├── locations/       # 位置 tab：家列表
│   ├── location-detail/ # 位置详情：子位置 + 此处物品
│   ├── location-edit/   # 添加/编辑位置（类型由父级推断）
│   ├── search/          # 搜索
│   ├── item-detail/     # 物品详情：操作 + 时间线
│   ├── item-edit/       # 添加/编辑物品
│   ├── item-list/       # 按分类/状态过滤的物品列表
│   └── mine/            # 我的：统计
└── utils/
    ├── db.js            # 数据库入口与集合常量
    ├── location-store.js# 位置树内存缓存与路径解析
    ├── item-service.js  # 物品增删改查 + 日志 + 搜索
    ├── categories.js    # 固定分类表
    ├── upload.js        # 图片选择与云存储上传
    └── format.js        # 时间格式化
```

## 参考文档

- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
