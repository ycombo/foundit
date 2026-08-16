// 图片选择与云存储上传
function chooseImages(maxCount) {
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count: maxCount,
      mediaType: ["image"],
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => resolve(res.tempFiles.map((f) => f.tempFilePath)),
      fail: (err) => {
        // 用户取消不算错误
        if (err.errMsg && err.errMsg.indexOf("cancel") > -1) resolve([]);
        else reject(err);
      },
    });
  });
}

async function uploadPhotos(tempPaths) {
  const fileIDs = [];
  for (const path of tempPaths) {
    const ext = (path.match(/\.(\w+)$/) || [, "jpg"])[1];
    const cloudPath =
      "items/" + Date.now() + "-" + Math.floor(Math.random() * 100000) + "." + ext;
    const res = await wx.cloud.uploadFile({ cloudPath, filePath: path });
    fileIDs.push(res.fileID);
  }
  return fileIDs;
}

function deletePhotos(fileIDs) {
  if (!fileIDs || !fileIDs.length) return Promise.resolve();
  return wx.cloud.deleteFile({ fileList: fileIDs }).catch(() => {});
}

module.exports = { chooseImages, uploadPhotos, deletePhotos };
