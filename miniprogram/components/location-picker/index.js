// 位置选择器：半屏弹层，逐级下钻选择房间/容器
const locationStore = require("../../utils/location-store");

Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(val) {
        if (val) this.reset();
      },
    },
  },

  data: {
    currentId: "", // 当前浏览的节点，"" 为根（家列表）
    currentName: "全部",
    children: [],
    canSelect: false, // 房间/容器可选，家不可选
  },

  methods: {
    async reset() {
      await locationStore.load();
      this.navigateTo("");
    },

    navigateTo(id) {
      const loc = id ? locationStore.get(id) : null;
      const children = locationStore.getChildren(id).map((c) => ({
        _id: c._id,
        name: c.name,
        icon: c.icon || (c.type === "home" ? "🏠" : c.type === "room" ? "🛏" : "📦"),
        hasChildren: locationStore.getChildren(c._id).length > 0,
      }));
      this.setData({
        currentId: id,
        currentName: loc ? loc.name : "全部",
        children,
        canSelect: !!loc && loc.type !== "home",
      });
    },

    onDrill(e) {
      this.navigateTo(e.currentTarget.dataset.id);
    },

    onBack() {
      const cur = this.data.currentId ? locationStore.get(this.data.currentId) : null;
      this.navigateTo(cur ? cur.parentId || "" : "");
    },

    onSelectCurrent() {
      if (!this.data.canSelect) return;
      this.triggerEvent("select", {
        locationId: this.data.currentId,
        pathText: locationStore.getPathText(this.data.currentId),
      });
      this.triggerEvent("close");
    },

    // 列表行右侧“选这里”快捷选择
    onSelectChild(e) {
      const id = e.currentTarget.dataset.id;
      const loc = locationStore.get(id);
      if (!loc || loc.type === "home") {
        this.navigateTo(id);
        return;
      }
      this.triggerEvent("select", {
        locationId: id,
        pathText: locationStore.getPathText(id),
      });
      this.triggerEvent("close");
    },

    onClose() {
      this.triggerEvent("close");
    },

    noop() {},
  },
});
