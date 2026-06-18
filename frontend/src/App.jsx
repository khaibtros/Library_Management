import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BookList from './pages/Books/BookList';
import BookForm from './pages/Books/BookForm';
import UserList from './pages/Users/UserList';
import UserForm from './pages/Users/UserForm';
import BorrowCardList from './pages/BorrowCards/BorrowCardList';
import BorrowCardDetail from './pages/BorrowCards/BorrowCardDetail';
import BorrowCardForm from './pages/BorrowCards/BorrowCardForm';

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
            <Route path="books" element={<BookList />} />
            <Route path="books/new" element={<PrivateRoute roles={['admin', 'librarian']}><BookForm /></PrivateRoute>} />
            <Route path="books/edit/:id" element={<PrivateRoute roles={['admin', 'librarian']}><BookForm /></PrivateRoute>} />
            <Route path="borrow-cards" element={<PrivateRoute roles={['admin', 'librarian']}><BorrowCardList /></PrivateRoute>} />
            <Route path="borrow-cards/new" element={<PrivateRoute roles={['admin', 'librarian']}><BorrowCardForm /></PrivateRoute>} />
            <Route path="borrow-cards/:id" element={<PrivateRoute roles={['admin', 'librarian']}><BorrowCardDetail /></PrivateRoute>} />
            <Route path="borrow-cards/:id/edit" element={<PrivateRoute roles={['admin', 'librarian']}><BorrowCardForm /></PrivateRoute>} />
            <Route path="users" element={<PrivateRoute roles={['admin']}><UserList /></PrivateRoute>} />
            <Route path="users/new" element={<PrivateRoute roles={['admin']}><UserForm /></PrivateRoute>} />
            <Route path="users/edit/:id" element={<PrivateRoute roles={['admin']}><UserForm /></PrivateRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
