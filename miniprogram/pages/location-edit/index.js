// 添加/编辑位置：type 由父级推断（无父→家，家→房间，其余→容器）
const locationStore = require("../../utils/location-store");

const TYPE_NAMES = { home: "家", room: "房间", container: "容器" };
const ICONS = ["🏠", "🛏", "🛋", "🍳", "🚿", "📦", "🗄️", "🧳", "🗃️", "📚", "🚪", "🧰"];

Page({
  data: {
    id: "",
    parentId: "",
    typeName: "",
    parentPath: "",
    name: "",
    icon: "",
    icons: ICONS,
    isEdit: false,
  },

  async onLoad(options) {
    await locationStore.load();
    if (options.id) {
      const loc = locationStore.get(options.id);
      if (!loc) {
        wx.showToast({ title: "位置不存在", icon: "none" });
        wx.navigateBack();
        return;
      }
      this.setData({
        id: options.id,
        isEdit: true,
        name: loc.name,
        icon: loc.icon || "",
        parentId: loc.parentId || "",
        typeName: TYPE_NAMES[loc.type],
        parentPath: loc.parentId ? locationStore.getPathText(loc.parentId) : "",
      });
      wx.setNavigationBarTitle({ title: "编辑" + TYPE_NAMES[loc.type] });
    } else {
      const parentId = options.parentId || "";
      const parent = parentId ? locationStore.get(parentId) : null;
      const type = locationStore.childTypeOf(parent);
      this.setData({
        parentId,
        typeName: TYPE_NAMES[type],
        parentPath: parentId ? locationStore.getPathText(parentId) : "",
        icon: type === "home" ? "🏠" : type === "room" ? "🛏" : "📦",
      });
      wx.setNavigationBarTitle({ title: "添加" + TYPE_NAMES[type] });
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onPickIcon(e) {
    this.setData({ icon: e.currentTarget.dataset.icon });
  },

  async onSave() {
    const name = this.data.name.trim();
    if (!name) {
      wx.showToast({ title: "请输入名称", icon: "none" });
      return;
    }
    wx.showLoading({ title: "保存中" });
    try {
      if (this.data.isEdit) {
        await locationStore.updateLocation(this.data.id, {
          name,
          icon: this.data.icon,
        });
      } else {
        await locationStore.addLocation({
          name,
          icon: this.data.icon,
          parentId: this.data.parentId,
        });
      }
      wx.hideLoading();
      wx.navigateBack();
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: "保存失败，请重试", icon: "none" });
    }
  },

  onDelete() {
    wx.showModal({
      title: "删除" + this.data.typeName,
      content: "确定删除「" + this.data.name + "」吗？",
      confirmColor: "#fa5151",
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: "删除中" });
        try {
          await locationStore.removeLocation(this.data.id);
          wx.hideLoading();
          // 返回两层：跳过已被删除位置的详情页
          wx.navigateBack({ delta: 2 });
        } catch (e) {
          wx.hideLoading();
          const msg =
            e.message === "HAS_CHILDREN" || e.message === "HAS_ITEMS"
              ? "请先清空该位置的物品和子位置"
              : "删除失败，请重试";
          wx.showToast({ title: msg, icon: "none" });
        }
      },
    });
  },
});
