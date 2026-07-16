import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UserList from './pages/Users/UserList';
import UserForm from './pages/Users/UserForm';
import BookList from './pages/Books/BookList';
import BookDetail from './pages/Books/BookDetail';
import BookForm from './pages/Books/BookForm';
import BorrowCardList from './pages/BorrowCards/BorrowCardList';
import BorrowCardForm from './pages/BorrowCards/BorrowCardForm';
import BorrowCardDetail from './pages/BorrowCards/BorrowCardDetail';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="users" element={<PrivateRoute roles={['admin']}><UserList /></PrivateRoute>} />
            <Route path="users/new" element={<PrivateRoute roles={['admin']}><UserForm /></PrivateRoute>} />
            <Route path="users/edit/:id" element={<PrivateRoute roles={['admin']}><UserForm /></PrivateRoute>} />

            {/* Sach: moi role da dang nhap (ke ca reader) deu xem duoc.
                Them/sua/xoa chi danh cho admin/librarian, khop voi
                backend/routes/bookRoutes.js */}
            <Route path="books" element={<BookList />} />
            <Route path="books/new" element={<PrivateRoute roles={['admin', 'librarian']}><BookForm /></PrivateRoute>} />
            <Route path="books/edit/:id" element={<PrivateRoute roles={['admin', 'librarian']}><BookForm /></PrivateRoute>} />
            <Route path="books/:id" element={<BookDetail />} />

            {/* Phieu muon: moi role da dang nhap xem duoc (reader chi thay
                phieu cua chinh minh, loc o backend/controllers/borrowController.js).
                Tao/sua/xoa chi danh cho admin/librarian, khop voi
                backend/routes/borrowRoutes.js */}
            <Route path="borrow-cards" element={<BorrowCardList />} />
            <Route path="borrow-cards/new" element={<PrivateRoute roles={['admin', 'librarian']}><BorrowCardForm /></PrivateRoute>} />
            <Route path="borrow-cards/:id" element={<BorrowCardDetail />} />
            <Route path="borrow-cards/:id/edit" element={<PrivateRoute roles={['admin', 'librarian']}><BorrowCardForm /></PrivateRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
