// 首页：搜索入口、分类九宫格、最近添加、已取出提醒
const itemService = require("../../utils/item-service");
const locationStore = require("../../utils/location-store");
const { CATEGORIES, byCode } = require("../../utils/categories");

Page({
  data: {
    categories: CATEGORIES,
    recentItems: [],
    takenOutCount: 0,
    hasLocation: false,
    loaded: false,
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    try {
      await locationStore.load(true);
      const hasLocation = locationStore.getChildren("").length > 0;
      const [recent, takenOutCount] = await Promise.all([
        itemService.listRecent(5),
        itemService.countTakenOut(),
      ]);
      const recentItems = recent.map((it) => {
        const cat = byCode(it.category);
        return {
          _id: it._id,
          name: it.name,
          photo: it.photos && it.photos.length ? it.photos[0] : "",
          categoryIcon: cat.icon,
          pathText: locationStore.getPathText(it.locationId),
          takenOut: it.status === "taken_out",
        };
      });
      this.setData({
        hasLocation,
        recentItems,
        takenOutCount,
        loaded: true,
      });
    } catch (e) {
      console.error("首页加载失败", e);
      this.setData({ loaded: true });
      wx.showToast({ title: "加载失败，请检查云环境配置", icon: "none" });
    }
  },

  onTapSearch() {
    wx.navigateTo({ url: "/pages/search/index" });
  },

  onTapCategory(e) {
    wx.navigateTo({
      url: "/pages/item-list/index?category=" + e.currentTarget.dataset.code,
    });
  },

  onTapTakenOut() {
    wx.navigateTo({ url: "/pages/item-list/index?status=taken_out" });
  },

  onTapItem(e) {
    wx.navigateTo({
      url: "/pages/item-detail/index?id=" + e.currentTarget.dataset.id,
    });
  },

  onSetupLocation() {
    wx.navigateTo({ url: "/pages/location-edit/index" });
  },

  onAddItem() {
    if (!this.data.hasLocation) {
      this.onSetupLocation();
      return;
    }
    wx.navigateTo({ url: "/pages/item-edit/index" });
  },
});
