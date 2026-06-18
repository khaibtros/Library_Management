import { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function BorrowCardList() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get('/borrow-cards');
        setCards(data.data || []);
      } catch { }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Quản lý mượn sách</h1>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Độc giả</th>
            <th>Sách</th>
            <th>Ngày mượn</th>
            <th>Hạn trả</th>
            <th>Ngày trả</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {cards.length === 0 ? (
            <tr><td colSpan={6} className="text-center text-muted">Chưa có thẻ mượn nào.</td></tr>
          ) : cards.map(card => (
            <tr key={card._id}>
              <td>{card.reader?.name || 'N/A'}</td>
              <td>{card.borrowedBooks?.map(b => b.book?.title).join(', ') || 'N/A'}</td>
              <td>{new Date(card.borrowDate).toLocaleDateString('vi-VN')}</td>
              <td>{card.dueDate ? new Date(card.dueDate).toLocaleDateString('vi-VN') : '—'}</td>
              <td>{card.returnDate ? new Date(card.returnDate).toLocaleDateString('vi-VN') : '—'}</td>
              <td>
                <span className={`badge badge-${card.status}`}>
                  {card.status === 'borrowed' ? 'Đang mượn' :
                   card.status === 'returned' ? 'Đã trả' :
                   card.status === 'overdue' ? 'Quá hạn' : 'Đã hủy'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
