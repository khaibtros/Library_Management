const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  // Ma sinh vien - chi bat buoc/unique cho tai khoan tu dang ky (role reader).
  // sparse:true de cho phep nhieu document co studentId = null/undefined
  // (vi du tai khoan admin tao tay khong nhap ma SV) ma khong vi pham unique.
  studentId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  // Duong dan tuong doi toi file avatar (vd: /uploads/avatars/xxx.jpg)
  avatar: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'librarian', 'reader'],
    default: 'reader',
  },
  // Tai khoan bi block se khong dang nhap duoc (kiem tra o loginUser)
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active',
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
