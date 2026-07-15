/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { getApiErrorMessage } from '../../utils/apiError';

export default function ReaderList() {
  const [result, setResult] = useState({ data: [], count: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState(''); const [error, setError] = useState('');
  const load = async (page = 1) => { try { const { data } = await API.get('/users/readers', { params: { search, page, limit: 10 } }); setResult(data); } catch (err) { setError(getApiErrorMessage(err, 'Không thể tải độc giả.')); } };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="page"><div className="page-header"><div><h1>Độc giả</h1><p className="page-subtitle">Tra cứu thông tin và lịch sử mượn sách.</p></div><Link className="btn btn-primary" to="/readers/new">+ Tạo độc giả</Link></div><form className="filter-bar" onSubmit={(e) => { e.preventDefault(); load(1); }}><input placeholder="Tên hoặc email độc giả" value={search} onChange={(e) => setSearch(e.target.value)} /><button className="btn btn-primary">Tìm kiếm</button></form>{error && <div className="alert alert-error">{error}</div>}<div className="table-wrapper"><table className="table"><thead><tr><th>Họ tên</th><th>Email</th><th>Ngày tạo</th><th /></tr></thead><tbody>{result.data.map((reader) => <tr key={reader._id}><td>{reader.name}</td><td>{reader.email}</td><td>{new Date(reader.createdAt).toLocaleDateString('vi-VN')}</td><td><Link className="btn btn-sm btn-view" to={`/readers/${reader._id}`}>Hồ sơ</Link></td></tr>)}{result.data.length === 0 && <tr><td colSpan="4" className="empty-cell">Không tìm thấy độc giả.</td></tr>}</tbody></table></div><div className="pagination"><button className="btn btn-secondary btn-sm" disabled={result.page <= 1} onClick={() => load(result.page - 1)}>← Trước</button><span>Trang {result.page} / {result.totalPages || 1}</span><button className="btn btn-secondary btn-sm" disabled={result.page >= result.totalPages} onClick={() => load(result.page + 1)}>Sau →</button></div></div>;
}
