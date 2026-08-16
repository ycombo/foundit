// 物品分类：固定常量，物品存 code，展示名可随时调整
const CATEGORIES = [
  { code: "docs", name: "证件", icon: "📄" },
  { code: "electronics", name: "电子", icon: "🔌" },
  { code: "clothes", name: "衣物", icon: "👕" },
  { code: "medicine", name: "药品", icon: "💊" },
  { code: "tools", name: "工具", icon: "🔧" },
  { code: "books", name: "书籍", icon: "📚" },
  { code: "keepsake", name: "纪念", icon: "🎁" },
  { code: "other", name: "其他", icon: "📦" },
];

function byCode(code) {
  return CATEGORIES.find((c) => c.code === code) || CATEGORIES[CATEGORIES.length - 1];
}

module.exports = { CATEGORIES, byCode };
