// 位置详情：面包屑 + 子位置列表（含物品数）+ 此处的物品
const locationStore = require("../../utils/location-store");
const itemService = require("../../utils/item-service");
const { byCode } = require("../../utils/categories");

Page({
  data: {
    id: "",
    location: null,
    pathText: "",
    children: [],
    items: [],
    canHoldItems: false, // 家不直接放物品，房间/容器可以
    loaded: false,
  },

  onLoad(options) {
    this.setData({ id: options.id });
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    const id = this.data.id;
    await locationStore.load(true);
    const location = locationStore.get(id);
    if (!location) {
      // 位置已被删除
      wx.navigateBack();
      return;
    }
    wx.setNavigationBarTitle({ title: location.name });

    const children = await Promise.all(
      locationStore.getChildren(id).map(async (c) => {
        const descendantIds = locationStore.getDescendantIds(c._id);
        const itemCount = await itemService.countByLocation(descendantIds);
        return {
          _id: c._id,
          name: c.name,
          icon: c.icon || (c.type === "room" ? "🛏" : "📦"),
          itemCount,
        };
      })
    );

    const canHoldItems = location.type !== "home";
    let items = [];
    if (canHoldItems) {
      items = (await itemService.listByLocation(id)).map((it) => ({
        _id: it._id,
        name: it.name,
        photo: it.photos && it.photos.length ? it.photos[0] : "",
        categoryName: byCode(it.category).name,
        categoryIcon: byCode(it.category).icon,
        takenOut: it.status === "taken_out",
      }));
    }

    this.setData({
      location,
      pathText: locationStore.getPathText(id),
      children,
      items,
      canHoldItems,
      loaded: true,
    });
  },

  onTapChild(e) {
    wx.navigateTo({
      url: "/pages/location-detail/index?id=" + e.currentTarget.dataset.id,
    });
  },

  onTapItem(e) {
    wx.navigateTo({
      url: "/pages/item-detail/index?id=" + e.currentTarget.dataset.id,
    });
  },

  onAddChild() {
    wx.navigateTo({
      url: "/pages/location-edit/index?parentId=" + this.data.id,
    });
  },

  onAddItem() {
    wx.navigateTo({
      url: "/pages/item-edit/index?locationId=" + this.data.id,
    });
  },

  onEdit() {
    wx.navigateTo({
      url: "/pages/location-edit/index?id=" + this.data.id,
    });
  },
});
