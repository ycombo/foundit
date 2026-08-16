// 云数据库入口：所有集合名统一在此维护
const db = wx.cloud.database();
const _ = db.command;

const COLL = {
  locations: "locations",
  items: "items",
  itemLogs: "item_logs",
};

// 客户端单次 get 上限为 20 条，此方法循环取完
async function getAll(query) {
  const MAX_PAGE = 20;
  let result = [];
  for (let page = 0; page < 100; page++) {
    const res = await query.skip(page * MAX_PAGE).limit(MAX_PAGE).get();
    result = result.concat(res.data);
    if (res.data.length < MAX_PAGE) break;
  }
  return result;
}

module.exports = { db, _, COLL, getAll };
