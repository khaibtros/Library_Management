export function getApiErrorMessage(error, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  return error?.response?.data?.message || error?.message || fallback;
}
