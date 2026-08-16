// 位置树缓存：整棵树一次性加载到内存，路径解析、层级浏览均走缓存
const { db, COLL, getAll } = require("./db");

let cache = null; // { list, byId: Map, childrenOf: Map }

async function load(force) {
  if (cache && !force) return cache;
  const list = await getAll(
    db.collection(COLL.locations).orderBy("sortOrder", "asc")
  );
  const byId = {};
  const childrenOf = {};
  list.forEach((loc) => {
    byId[loc._id] = loc;
    const pid = loc.parentId || "";
    (childrenOf[pid] = childrenOf[pid] || []).push(loc);
  });
  cache = { list, byId, childrenOf };
  return cache;
}

function invalidate() {
  cache = null;
}

function get(id) {
  return (cache && cache.byId[id]) || null;
}

// 自顶向下的名称数组：["我的家", "卧室", "衣柜上层抽屉"]
function getPath(id) {
  const names = [];
  let cur = get(id);
  let guard = 0;
  while (cur && guard++ < 20) {
    names.unshift(cur.name);
    cur = cur.parentId ? get(cur.parentId) : null;
  }
  return names;
}

function getPathText(id) {
  const names = getPath(id);
  return names.length ? names.join(" / ") : "未知位置";
}

function getChildren(id) {
  return (cache && cache.childrenOf[id || ""]) || [];
}

// 含自身在内的整棵子树 id 列表（用于删除校验、统计）
function getDescendantIds(id) {
  const ids = [id];
  for (let i = 0; i < ids.length; i++) {
    getChildren(ids[i]).forEach((c) => ids.push(c._id));
  }
  return ids;
}

// 子级类型推断：无父→home，父为 home→room，其余→container
function childTypeOf(parent) {
  if (!parent) return "home";
  return parent.type === "home" ? "room" : "container";
}

async function addLocation({ name, icon, parentId }) {
  const parent = parentId ? get(parentId) : null;
  const now = db.serverDate();
  const res = await db.collection(COLL.locations).add({
    data: {
      name,
      icon: icon || "",
      type: childTypeOf(parent),
      parentId: parentId || "",
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    },
  });
  invalidate();
  return res._id;
}

async function updateLocation(id, { name, icon }) {
  await db.collection(COLL.locations).doc(id).update({
    data: { name, icon: icon || "", updatedAt: db.serverDate() },
  });
  invalidate();
}

// 删除前置校验：仅允许删除无子位置且无物品的节点
async function removeLocation(id) {
  if (getChildren(id).length > 0) {
    throw new Error("HAS_CHILDREN");
  }
  const countRes = await db
    .collection(COLL.items)
    .where({ locationId: id })
    .count();
  if (countRes.total > 0) {
    throw new Error("HAS_ITEMS");
  }
  await db.collection(COLL.locations).doc(id).remove();
  invalidate();
}

module.exports = {
  load,
  invalidate,
  get,
  getPath,
  getPathText,
  getChildren,
  getDescendantIds,
  childTypeOf,
  addLocation,
  updateLocation,
  removeLocation,
};
