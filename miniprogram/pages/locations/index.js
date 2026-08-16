// 位置 tab：展示所有“家”，入口进入层级浏览
const locationStore = require("../../utils/location-store");

Page({
  data: {
    homes: [],
    loaded: false,
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    await locationStore.load(true);
    const homes = locationStore.getChildren("").map((h) => ({
      _id: h._id,
      name: h.name,
      icon: h.icon || "🏠",
      childCount: locationStore.getChildren(h._id).length,
    }));
    this.setData({ homes, loaded: true });
  },

  onTapHome(e) {
    wx.navigateTo({
      url: "/pages/location-detail/index?id=" + e.currentTarget.dataset.id,
    });
  },

  onAddHome() {
    wx.navigateTo({ url: "/pages/location-edit/index" });
  },
});
