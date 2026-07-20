// Cac ham kiem tra du lieu dung o frontend, khop voi
// backend/utils/validators.js de bao loi som truoc khi goi API.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10,11}$/;
// Toi thieu 8 ky tu, co chu hoa, chu thuong, so, ky tu dac biet
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function isValidName(name) {
  return typeof name === 'string' && name.trim().length >= 3 && name.trim().length <= 50;
}

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

export function isValidStudentId(studentId) {
  return typeof studentId === 'string' && studentId.trim().length >= 6 && studentId.trim().length <= 20;
}

export function isValidPhone(phone) {
  return typeof phone === 'string' && PHONE_REGEX.test(phone.trim());
}

export function isStrongPassword(password) {
  return typeof password === 'string' && STRONG_PASSWORD_REGEX.test(password);
}

export const PASSWORD_HINT = 'Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt';
