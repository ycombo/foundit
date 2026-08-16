// 搜索：名称/备注模糊匹配，结果展示完整位置路径
const itemService = require("../../utils/item-service");
const locationStore = require("../../utils/location-store");
const { byCode } = require("../../utils/categories");

Page({
  data: {
    keyword: "",
    results: [],
    searched: false,
    page: 0,
    hasMore: false,
    loading: false,
  },

  async onLoad() {
    await locationStore.load();
  },

  onInput(e) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    clearTimeout(this.debounceTimer);
    if (!keyword.trim()) {
      this.setData({ results: [], searched: false, hasMore: false });
      return;
    }
    this.debounceTimer = setTimeout(() => this.doSearch(true), 300);
  },

  onClear() {
    this.setData({ keyword: "", results: [], searched: false, hasMore: false });
  },

  async doSearch(reset) {
    const keyword = this.data.keyword.trim();
    if (!keyword || this.data.loading) return;
    const page = reset ? 0 : this.data.page + 1;
    this.setData({ loading: true });
    try {
      const raw = await itemService.search(keyword, page);
      const mapped = raw.map((it) => this.mapItem(it));
      this.setData({
        results: reset ? mapped : this.data.results.concat(mapped),
        searched: true,
        page,
        hasMore: raw.length === 20,
        loading: false,
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: "搜索失败，请重试", icon: "none" });
    }
  },

  mapItem(it) {
    const cat = byCode(it.category);
    return {
      _id: it._id,
      name: it.name,
      photo: it.photos && it.photos.length ? it.photos[0] : "",
      categoryIcon: cat.icon,
      pathText: locationStore.getPathText(it.locationId),
      takenOut: it.status === "taken_out",
    };
  },

  onReachBottom() {
    if (this.data.hasMore) this.doSearch(false);
  },

  onTapItem(e) {
    wx.navigateTo({
      url: "/pages/item-detail/index?id=" + e.currentTarget.dataset.id,
    });
  },
});
