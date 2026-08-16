// 我的：统计与入口
const { db, COLL } = require("../../utils/db");

Page({
  data: {
    itemCount: 0,
    locationCount: 0,
    takenOutCount: 0,
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    try {
      const [items, locations, takenOut] = await Promise.all([
        db.collection(COLL.items).count(),
        db.collection(COLL.locations).count(),
        db.collection(COLL.items).where({ status: "taken_out" }).count(),
      ]);
      this.setData({
        itemCount: items.total,
        locationCount: locations.total,
        takenOutCount: takenOut.total,
      });
    } catch (e) {
      console.error("统计加载失败", e);
    }
  },

  onTapTakenOut() {
    wx.navigateTo({ url: "/pages/item-list/index?status=taken_out" });
  },

  onTapAbout() {
    wx.showModal({
      title: "关于数字储物盒",
      content: "记录物品存放位置，随时找到你的东西。\n\n数据仅归你本人所有，存储于微信云开发。",
      showCancel: false,
    });
  },
});
