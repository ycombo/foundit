// 物品详情：照片轮播、位置路径、操作（取出/放回/移动/编辑/删除）、操作记录
const itemService = require("../../utils/item-service");
const locationStore = require("../../utils/location-store");
const { byCode } = require("../../utils/categories");
const { formatTime } = require("../../utils/format");

const ACTION_TEXT = {
  create: "放入",
  move: "移动",
  take_out: "取出",
  return: "放回",
  edit: "编辑信息",
};

Page({
  data: {
    id: "",
    item: null,
    pathText: "",
    categoryName: "",
    categoryIcon: "",
    logs: [],
    showPicker: false,
    loaded: false,
  },

  onLoad(options) {
    this.setData({ id: options.id });
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    try {
      await locationStore.load();
      const item = await itemService.getItem(this.data.id);
      const logs = (await itemService.getLogs(this.data.id)).map((log) => ({
        _id: log._id,
        actionText: ACTION_TEXT[log.action] || log.action,
        action: log.action,
        detail: this.logDetail(log),
        time: formatTime(log.createdAt),
      }));
      const cat = byCode(item.category);
      this.setData({
        item,
        pathText: locationStore.getPathText(item.locationId),
        categoryName: cat.name,
        categoryIcon: cat.icon,
        logs,
        loaded: true,
      });
    } catch (e) {
      // 物品已被删除
      wx.navigateBack();
    }
  },

  logDetail(log) {
    switch (log.action) {
      case "create":
        return "放入 " + log.toPathText;
      case "move":
        return log.fromPathText + " → " + log.toPathText;
      case "take_out":
        return "从 " + log.fromPathText + " 取出" + (log.note ? "（" + log.note + "）" : "");
      case "return":
        return "放回 " + log.toPathText;
      default:
        return "";
    }
  },

  onPreviewPhoto(e) {
    wx.previewImage({
      current: e.currentTarget.dataset.src,
      urls: this.data.item.photos,
    });
  },

  onTapPath() {
    wx.navigateTo({
      url: "/pages/location-detail/index?id=" + this.data.item.locationId,
    });
  },

  onTakeOut() {
    wx.showModal({
      title: "取出物品",
      editable: true,
      placeholderText: "备注（可选），如：带出门用",
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: "处理中" });
        await itemService.takeOut(this.data.id, this.data.item.locationId, res.content || "");
        wx.hideLoading();
        this.refresh();
      },
    });
  },

  async onPutBack() {
    wx.showLoading({ title: "处理中" });
    await itemService.putBack(this.data.id, this.data.item.locationId);
    wx.hideLoading();
    wx.showToast({ title: "已放回", icon: "success" });
    this.refresh();
  },

  onOpenMove() {
    this.setData({ showPicker: true });
  },

  onClosePicker() {
    this.setData({ showPicker: false });
  },

  async onSelectLocation(e) {
    this.setData({ showPicker: false });
    if (e.detail.locationId === this.data.item.locationId) return;
    wx.showLoading({ title: "移动中" });
    await itemService.moveItem(
      this.data.id,
      this.data.item.locationId,
      e.detail.locationId
    );
    wx.hideLoading();
    wx.showToast({ title: "已移动", icon: "success" });
    this.refresh();
  },

  onEdit() {
    wx.navigateTo({ url: "/pages/item-edit/index?id=" + this.data.id });
  },

  onDelete() {
    wx.showModal({
      title: "删除物品",
      content: "确定删除「" + this.data.item.name + "」吗？照片和记录将一并删除。",
      confirmColor: "#fa5151",
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: "删除中" });
        try {
          await itemService.removeItem(this.data.id, this.data.item.photos);
          wx.hideLoading();
          wx.navigateBack();
        } catch (e) {
          wx.hideLoading();
          wx.showToast({ title: "删除失败，请重试", icon: "none" });
        }
      },
    });
  },
});
