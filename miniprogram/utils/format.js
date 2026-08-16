function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}

// 绝对时间：2026-08-16 14:30
function formatTime(date) {
  const d = new Date(date);
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    " " +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

// 相对时间：刚刚 / 5分钟前 / 3小时前 / 昨天 / 具体日期
function formatRelative(date) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "刚刚";
  if (diff < hour) return Math.floor(diff / minute) + "分钟前";
  if (diff < day) return Math.floor(diff / hour) + "小时前";
  if (diff < 2 * day) return "昨天";
  if (diff < 7 * day) return Math.floor(diff / day) + "天前";
  return formatTime(d).slice(0, 10);
}

module.exports = { formatTime, formatRelative };
