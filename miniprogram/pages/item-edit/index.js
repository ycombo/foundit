// 添加/编辑物品：名称、照片(≤3)、分类、位置、备注
const itemService = require("../../utils/item-service");
const locationStore = require("../../utils/location-store");
const { CATEGORIES } = require("../../utils/categories");
const { chooseImages, uploadPhotos, deletePhotos } = require("../../utils/upload");

const MAX_PHOTOS = 3;

Page({
  data: {
    id: "",
    isEdit: false,
    name: "",
    note: "",
    category: "other",
    categories: CATEGORIES,
    locationId: "",
    locationPath: "",
    // photos: 已上传的 fileID；tempPhotos: 本次新选待上传的临时路径
    photos: [],
    tempPhotos: [],
    removedPhotos: [],
    showPicker: false,
    maxPhotos: MAX_PHOTOS,
    saving: false,
  },

  async onLoad(options) {
    await locationStore.load();
    if (options.id) {
      const item = await itemService.getItem(options.id);
      this.originalItem = item;
      this.setData({
        id: options.id,
        isEdit: true,
        name: item.name,
        note: item.note || "",
        category: item.category || "other",
        locationId: item.locationId,
        locationPath: locationStore.getPathText(item.locationId),
        photos: item.photos || [],
      });
      wx.setNavigationBarTitle({ title: "编辑物品" });
    } else if (options.locationId) {
      this.setData({
        locationId: options.locationId,
        locationPath: locationStore.getPathText(options.locationId),
      });
    }
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  onPickCategory(e) {
    this.setData({ category: e.currentTarget.dataset.code });
  },

  async onAddPhoto() {
    const remain =
      MAX_PHOTOS - this.data.photos.length - this.data.tempPhotos.length;
    if (remain <= 0) return;
    try {
      const paths = await chooseImages(remain);
      if (paths.length) {
        this.setData({ tempPhotos: this.data.tempPhotos.concat(paths) });
      }
    } catch (e) {
      wx.showToast({ title: "选择图片失败", icon: "none" });
    }
  },

  onRemovePhoto(e) {
    const { type, index } = e.currentTarget.dataset;
    if (type === "cloud") {
      const photos = this.data.photos.slice();
      const removed = photos.splice(index, 1);
      this.setData({
        photos,
        removedPhotos: this.data.removedPhotos.concat(removed),
      });
    } else {
      const tempPhotos = this.data.tempPhotos.slice();
      tempPhotos.splice(index, 1);
      this.setData({ tempPhotos });
    }
  },

  onPreviewPhoto(e) {
    const urls = this.data.photos.concat(this.data.tempPhotos);
    wx.previewImage({ current: e.currentTarget.dataset.src, urls });
  },

  onOpenPicker() {
    this.setData({ showPicker: true });
  },

  onClosePicker() {
    this.setData({ showPicker: false });
  },

  onSelectLocation(e) {
    this.setData({
      locationId: e.detail.locationId,
      locationPath: e.detail.pathText,
      showPicker: false,
    });
  },

  async onSave() {
    if (this.data.saving) return;
    const name = this.data.name.trim();
    if (!name) {
      wx.showToast({ title: "请输入物品名称", icon: "none" });
      return;
    }
    if (!this.data.locationId) {
      wx.showToast({ title: "请选择存放位置", icon: "none" });
      return;
    }
    this.setData({ saving: true });
    wx.showLoading({ title: "保存中" });
    try {
      const newFileIDs = await uploadPhotos(this.data.tempPhotos);
      const photos = this.data.photos.concat(newFileIDs);
      if (this.data.isEdit) {
        await itemService.updateItem(this.data.id, {
          name,
          note: this.data.note.trim(),
          photos,
          category: this.data.category,
        });
        // 编辑页不改位置；位置移动走详情页“移动”操作
        await deletePhotos(this.data.removedPhotos);
      } else {
        await itemService.addItem({
          name,
          note: this.data.note.trim(),
          photos,
          category: this.data.category,
          locationId: this.data.locationId,
        });
      }
      wx.hideLoading();
      wx.navigateBack();
    } catch (e) {
      console.error("保存物品失败", e);
      wx.hideLoading();
      this.setData({ saving: false });
      wx.showToast({ title: "保存失败，请重试", icon: "none" });
    }
  },
});
