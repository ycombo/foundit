// 物品服务：所有物品变更在此完成，并同步写入操作日志（日志失败不阻塞主流程）
const { db, _, COLL, getAll } = require("./db");
const locationStore = require("./location-store");
const { deletePhotos } = require("./upload");

function writeLog(entry) {
  return db
    .collection(COLL.itemLogs)
    .add({ data: Object.assign({ createdAt: db.serverDate() }, entry) })
    .catch((e) => console.warn("写日志失败", e));
}

async function addItem({ name, note, photos, category, locationId }) {
  const now = db.serverDate();
  const res = await db.collection(COLL.items).add({
    data: {
      name,
      note: note || "",
      photos: photos || [],
      category: category || "other",
      locationId,
      status: "in_place",
      createdAt: now,
      updatedAt: now,
    },
  });
  await writeLog({
    itemId: res._id,
    action: "create",
    fromLocationId: "",
    toLocationId: locationId,
    fromPathText: "",
    toPathText: locationStore.getPathText(locationId),
    note: "",
  });
  return res._id;
}

// 编辑基础信息（位置变更走 moveItem）
async function updateItem(id, { name, note, photos, category }) {
  await db.collection(COLL.items).doc(id).update({
    data: { name, note: note || "", photos: photos || [], category, updatedAt: db.serverDate() },
  });
  await writeLog({
    itemId: id,
    action: "edit",
    fromLocationId: "",
    toLocationId: "",
    fromPathText: "",
    toPathText: "",
    note: "",
  });
}

async function moveItem(id, fromLocationId, toLocationId) {
  await db.collection(COLL.items).doc(id).update({
    data: { locationId: toLocationId, status: "in_place", updatedAt: db.serverDate() },
  });
  await writeLog({
    itemId: id,
    action: "move",
    fromLocationId: fromLocationId || "",
    toLocationId,
    fromPathText: locationStore.getPathText(fromLocationId),
    toPathText: locationStore.getPathText(toLocationId),
    note: "",
  });
}

// 取出：仅改状态，物品保留原“位置槽”，放回一键完成
async function takeOut(id, locationId, note) {
  await db.collection(COLL.items).doc(id).update({
    data: { status: "taken_out", updatedAt: db.serverDate() },
  });
  await writeLog({
    itemId: id,
    action: "take_out",
    fromLocationId: locationId || "",
    toLocationId: "",
    fromPathText: locationStore.getPathText(locationId),
    toPathText: "",
    note: note || "",
  });
}

async function putBack(id, locationId) {
  await db.collection(COLL.items).doc(id).update({
    data: { status: "in_place", updatedAt: db.serverDate() },
  });
  await writeLog({
    itemId: id,
    action: "return",
    fromLocationId: "",
    toLocationId: locationId || "",
    fromPathText: "",
    toPathText: locationStore.getPathText(locationId),
    note: "",
  });
}

// 删除物品：级联删除日志与云存储照片
async function removeItem(id, photos) {
  await db.collection(COLL.items).doc(id).remove();
  await db.collection(COLL.itemLogs).where({ itemId: id }).remove().catch(() => {});
  await deletePhotos(photos);
}

function getItem(id) {
  return db.collection(COLL.items).doc(id).get().then((res) => res.data);
}

function getLogs(itemId) {
  return getAll(
    db.collection(COLL.itemLogs).where({ itemId }).orderBy("createdAt", "desc")
  );
}

// 搜索：名称/备注模糊匹配（不区分大小写），按更新时间倒序
function search(keyword, page) {
  const kw = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = db.RegExp({ regexp: kw, options: "i" });
  return db
    .collection(COLL.items)
    .where(_.or([{ name: re }, { note: re }]))
    .orderBy("updatedAt", "desc")
    .skip((page || 0) * 20)
    .limit(20)
    .get()
    .then((res) => res.data);
}

function listByLocation(locationId) {
  return getAll(
    db.collection(COLL.items).where({ locationId }).orderBy("updatedAt", "desc")
  );
}

function listByCategory(category, page) {
  return db
    .collection(COLL.items)
    .where({ category })
    .orderBy("updatedAt", "desc")
    .skip((page || 0) * 20)
    .limit(20)
    .get()
    .then((res) => res.data);
}

function listTakenOut(page) {
  return db
    .collection(COLL.items)
    .where({ status: "taken_out" })
    .orderBy("updatedAt", "desc")
    .skip((page || 0) * 20)
    .limit(20)
    .get()
    .then((res) => res.data);
}

function listRecent(n) {
  return db
    .collection(COLL.items)
    .orderBy("createdAt", "desc")
    .limit(n || 5)
    .get()
    .then((res) => res.data);
}

function countTakenOut() {
  return db
    .collection(COLL.items)
    .where({ status: "taken_out" })
    .count()
    .then((res) => res.total);
}

function countByLocation(locationIds) {
  return db
    .collection(COLL.items)
    .where({ locationId: _.in(locationIds) })
    .count()
    .then((res) => res.total);
}

module.exports = {
  addItem,
  updateItem,
  moveItem,
  takeOut,
  putBack,
  removeItem,
  getItem,
  getLogs,
  search,
  listByLocation,
  listByCategory,
  listTakenOut,
  listRecent,
  countTakenOut,
  countByLocation,
};
