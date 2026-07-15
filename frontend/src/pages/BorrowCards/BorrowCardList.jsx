/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import BorrowStatusBadge from '../../components/common/BorrowStatusBadge';
import { formatDateTime } from '../../utils/date';
import { getApiErrorMessage } from '../../utils/apiError';

export default function BorrowCardList({ overdueOnly = false }) {
  const location = useLocation();
  const [result, setResult] = useState({ data: [], count: 0, page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', status: overdueOnly ? 'overdue' : '', fromDate: '', toDate: '', sort: 'dueDate' });
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async (page = 1) => {
    setLoading(true); setError('');
    try { const { data } = await API.get(overdueOnly ? '/borrow-cards/overdue' : '/borrow-cards', { params: { ...filters, page, limit: 10 } }); setResult(data); }
    catch (err) { setError(getApiErrorMessage(err, 'Không thể tải danh sách phiếu mượn.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { setFilters((current) => ({ ...current, status: overdueOnly ? 'overdue' : '' })); }, [overdueOnly]);
  useEffect(() => { load(); }, [location.pathname, overdueOnly]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = (event) => { event.preventDefault(); load(1); };
  return <div className="page">
    <div className="page-header"><div><h1>{overdueOnly ? 'Phiếu quá hạn' : 'Phiếu mượn'}</h1><p className="page-subtitle">Tìm, lọc và xử lý phiếu mượn theo trạng thái.</p></div>{!overdueOnly && <Link to="/borrow-cards/new" className="btn btn-primary">+ Tạo phiếu mượn</Link>}</div>
    <form className="filter-bar" onSubmit={submit}>
      <input placeholder="Độc giả, email, mã phiếu, sách hoặc ISBN" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
      {!overdueOnly && <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Mọi trạng thái</option><option value="borrowed">Đang mượn</option><option value="overdue">Quá hạn</option><option value="returned">Đã trả</option><option value="cancelled">Đã hủy</option></select>}
      <input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
      <input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
      <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}><option value="dueDate">Hạn trả gần nhất</option><option value="-dueDate">Hạn trả xa nhất</option><option value="newest">Mới nhất</option></select><button className="btn btn-primary">Lọc</button>
    </form>
    {error && <div className="alert alert-error">{error}</div>}
    {loading ? <div className="loading-panel">Đang tải...</div> : <><p className="result-summary">{result.count} phiếu</p><div className="table-wrapper"><table className="table"><thead><tr><th>Độc giả</th><th>Sách</th><th>Ngày mượn</th><th>Hạn trả</th><th>Trạng thái</th><th /></tr></thead><tbody>{result.data.map((card) => <tr key={card._id}><td><div className="cell-primary">{card.reader?.name}</div><div className="cell-secondary">{card.reader?.email}</div></td><td>{card.borrowedBooks?.map((item) => item.book?.title).join(', ')}</td><td>{formatDateTime(card.borrowDate)}</td><td>{formatDateTime(card.dueDate)}</td><td><BorrowStatusBadge status={card.status} /></td><td className="actions"><Link className="btn btn-sm btn-view" to={`/borrow-cards/${card._id}`}>Chi tiết</Link>{card.status === 'borrowed' && <Link className="btn btn-sm btn-edit" to={`/borrow-cards/${card._id}/edit`}>Sửa</Link>}</td></tr>)}{result.data.length === 0 && <tr><td className="empty-cell" colSpan="6">Không có phiếu phù hợp.</td></tr>}</tbody></table></div><div className="pagination"><button className="btn btn-secondary btn-sm" disabled={result.page <= 1} onClick={() => load(result.page - 1)}>← Trước</button><span>Trang {result.page} / {result.totalPages || 1}</span><button className="btn btn-secondary btn-sm" disabled={result.page >= result.totalPages} onClick={() => load(result.page + 1)}>Sau →</button></div></>}</div>;
}
