import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';

export default function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await API.get('/users');
      setUsers(data);
    };
    fetch();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    await API.delete(`/users/${id}`);
    setUsers(users.filter((u) => u._id !== id));
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>👥 Quản lý người dùng</h1>
        <Link to="/users/new" className="btn btn-primary">+ Thêm người dùng</Link>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Ngày tạo</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>
              <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
              <td className="actions">
                <Link to={`/users/edit/${user._id}`} className="btn btn-sm btn-edit">Sửa</Link>
                <button onClick={() => handleDelete(user._id)} className="btn btn-sm btn-delete">Xóa</button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan="5" className="text-center">Chưa có người dùng nào</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
