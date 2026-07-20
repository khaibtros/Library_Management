const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Xác minh token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

      // Lấy user từ token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Không có quyền truy cập, user không tồn tại' });
      }
      if (req.user.status === 'blocked') {
        return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Không có quyền truy cập, token không hợp lệ' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Không có quyền truy cập, không có token' });
  }
};

module.exports = { protect };
