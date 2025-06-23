const multer = require('multer');
const path = require('path');

// 配置存储引擎
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 指定文件存储路径
    cb(null, 'public/uploads/avatars/');
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名，格式: user-<id>-<timestamp>.<extension>
    const uniqueSuffix = `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueSuffix);
  }
});

// 文件过滤器，只允许图片格式
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('文件类型错误，仅支持 JPG 和 PNG 格式!'));
};

// 创建 multer 实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 限制文件大小为 2MB
  },
  fileFilter: fileFilter
});

module.exports = upload;
