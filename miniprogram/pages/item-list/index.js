// 通用物品列表：按分类或状态（已取出）过滤
const itemService = require("../../utils/item-service");
const locationStore = require("../../utils/location-store");
const { byCode } = require("../../utils/categories");

Page({
  data: {
    category: "",
    status: "",
    items: [],
    page: 0,
    hasMore: false,
    loaded: false,
  },

  onLoad(options) {
    this.setData({
      category: options.category || "",
      status: options.status || "",
    });
    const title =
      options.status === "taken_out"
        ? "已取出物品"
        : options.category
          ? byCode(options.category).name
          : "物品";
    wx.setNavigationBarTitle({ title });
  },

  onShow() {
    this.loadPage(true);
  },

  async loadPage(reset) {
    const page = reset ? 0 : this.data.page + 1;
    await locationStore.load();
    let raw;
    if (this.data.status === "taken_out") {
      raw = await itemService.listTakenOut(page);
    } else {
      raw = await itemService.listByCategory(this.data.category, page);
    }
    const mapped = raw.map((it) => {
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
      items: reset ? mapped : this.data.items.concat(mapped),
      page,
      hasMore: raw.length === 20,
      loaded: true,
    });
  },

  onReachBottom() {
    if (this.data.hasMore) this.loadPage(false);
  },

  onTapItem(e) {
    wx.navigateTo({
      url: "/pages/item-detail/index?id=" + e.currentTarget.dataset.id,
    });
  },
});
