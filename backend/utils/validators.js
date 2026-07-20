// Cac ham kiem tra du lieu dung chung, dung trong authController &
// userController de validate form dang ky / cap nhat ho so.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10,11}$/;
// Toi thieu 8 ky tu, co chu hoa, chu thuong, so, ky tu dac biet
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function isValidName(name) {
  return typeof name === 'string' && name.trim().length >= 3 && name.trim().length <= 50;
}

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function isValidStudentId(studentId) {
  return typeof studentId === 'string' && studentId.trim().length >= 6 && studentId.trim().length <= 20;
}

function isValidPhone(phone) {
  return typeof phone === 'string' && PHONE_REGEX.test(phone.trim());
}

function isStrongPassword(password) {
  return typeof password === 'string' && STRONG_PASSWORD_REGEX.test(password);
}

module.exports = {
  isValidName,
  isValidEmail,
  isValidStudentId,
  isValidPhone,
  isStrongPassword,
};
