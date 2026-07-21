const API_URL = '/api/books';

const elements = {
  form: document.querySelector('#bookForm'),
  token: document.querySelector('#authToken'),
  tableBody: document.querySelector('#bookTableBody'),
  status: document.querySelector('#statusMessage'),
  count: document.querySelector('#bookCount'),
  submitButton: document.querySelector('#submitButton'),
  refreshButton: document.querySelector('#refreshBooksButton'),
  fields: {
    title: document.querySelector('#title'),
    author: document.querySelector('#author'),
    isbn: document.querySelector('#isbn'),
    totalQuantity: document.querySelector('#totalQuantity'),
    availableQuantity: document.querySelector('#availableQuantity'),
  },
};

const showStatus = (message, type = 'info') => {
  elements.status.textContent = message;
  elements.status.className = `status is-${type}`;
};

const clearStatus = () => {
  elements.status.textContent = '';
  elements.status.className = 'status';
};

const setFieldError = (fieldName, message) => {
  const input = fieldName === 'authToken' ? elements.token : elements.fields[fieldName];
  const error = document.querySelector(`#${fieldName}Error`);
  const field = input.closest('.field');

  field.classList.toggle('has-error', Boolean(message));
  error.textContent = message || '';
};

const clearErrors = () => {
  ['authToken', 'title', 'author', 'isbn', 'totalQuantity', 'availableQuantity'].forEach((field) => {
    setFieldError(field, '');
  });
};

const readJsonSafely = async (response) => {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const getApiErrorMessage = (response, data) => {
  if (response.status === 401) {
    return data.message || 'Bạn cần token hợp lệ để thực hiện thao tác này.';
  }

  if (response.status === 403) {
    return data.message || 'Token hiện tại không có quyền thêm sách.';
  }

  return data.message || 'Có lỗi xảy ra khi gọi API.';
};

const escapeHtml = (value) => {
  return String(value ?? '-')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

const normalizeToken = (token) => {
  return token.replace(/^Bearer\s+/i, '').trim();
};

const renderBooks = (books) => {
  elements.count.textContent = `${books.length} sách`;

  if (!books.length) {
    elements.tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">Chưa có sách nào trong thư viện.</td></tr>';
    return;
  }

  elements.tableBody.innerHTML = books
    .map((book) => `
      <tr>
        <td>${escapeHtml(book.title)}</td>
        <td>${escapeHtml(book.author)}</td>
        <td>${escapeHtml(book.isbn)}</td>
        <td>${escapeHtml(book.category)}</td>
        <td>${escapeHtml(book.totalQuantity ?? 0)}</td>
        <td>${escapeHtml(book.availableQuantity ?? 0)}</td>
      </tr>
    `)
    .join('');
};

const fetchBooks = async () => {
  showStatus('Đang tải danh sách sách...', 'info');

  try {
    const response = await fetch(API_URL);
    const data = await readJsonSafely(response);

    if (!response.ok) {
      throw new Error(getApiErrorMessage(response, data));
    }

    if (!Array.isArray(data)) {
      throw new Error('API /api/books không trả về mảng dữ liệu.');
    }

    renderBooks(data);
    clearStatus();
    return true;
  } catch (error) {
    renderBooks([]);
    showStatus(error.message, 'error');
    return false;
  }
};

const validateForm = () => {
  clearErrors();

  const values = {
    token: elements.token.value.trim(),
    title: elements.fields.title.value.trim(),
    author: elements.fields.author.value.trim(),
    isbn: elements.fields.isbn.value.trim(),
    totalQuantity: Number(elements.fields.totalQuantity.value),
    availableQuantity: Number(elements.fields.availableQuantity.value),
  };

  let isValid = true;

  if (!values.token) {
    setFieldError('authToken', 'Vui lòng nhập Bearer token.');
    isValid = false;
  }

  if (!values.title) {
    setFieldError('title', 'Vui lòng nhập tên sách.');
    isValid = false;
  }

  if (!values.author) {
    setFieldError('author', 'Vui lòng nhập tác giả.');
    isValid = false;
  }

  if (!values.isbn) {
    setFieldError('isbn', 'Vui lòng nhập ISBN.');
    isValid = false;
  }

  if (!Number.isInteger(values.totalQuantity) || values.totalQuantity < 1) {
    setFieldError('totalQuantity', 'Tổng số lượng phải là số nguyên lớn hơn 0.');
    isValid = false;
  }

  if (!Number.isInteger(values.availableQuantity) || values.availableQuantity < 0) {
    setFieldError('availableQuantity', 'Số lượng còn lại phải là số nguyên từ 0 trở lên.');
    isValid = false;
  }

  if (
    Number.isInteger(values.totalQuantity) &&
    Number.isInteger(values.availableQuantity) &&
    values.availableQuantity > values.totalQuantity
  ) {
    setFieldError('availableQuantity', 'Số lượng còn lại không được lớn hơn tổng số lượng.');
    isValid = false;
  }

  return { isValid, values };
};

const createBook = async (values) => {
  const payload = {
    title: values.title,
    author: values.author,
    isbn: values.isbn,
    totalQuantity: values.totalQuantity,
    availableQuantity: values.availableQuantity,
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${normalizeToken(values.token)}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await readJsonSafely(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(response, data));
  }

  return data;
};

const handleSubmit = async (event) => {
  event.preventDefault();

  const { isValid, values } = validateForm();
  if (!isValid) {
    showStatus('Vui lòng kiểm tra lại thông tin trong form.', 'error');
    return;
  }

  elements.submitButton.disabled = true;
  elements.submitButton.textContent = 'Đang thêm...';
  showStatus('Đang gửi dữ liệu sách mới...', 'info');

  try {
    await createBook(values);
    elements.form.reset();
    elements.fields.totalQuantity.value = 1;
    elements.fields.availableQuantity.value = 1;
    const refreshed = await fetchBooks();
    showStatus(
      refreshed ? 'Thêm sách thành công.' : 'Sách đã được thêm, nhưng chưa tải lại được danh sách.',
      refreshed ? 'success' : 'info'
    );
  } catch (error) {
    showStatus(error.message, 'error');
  } finally {
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = 'Thêm sách';
  }
};

elements.form.addEventListener('submit', handleSubmit);
elements.refreshButton.addEventListener('click', fetchBooks);

fetchBooks();
