import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserList from './pages/Users/UserList';
import UserForm from './pages/Users/UserForm';
import BookForm from "./pages/Books/BookForm.jsx";
import BorrowCardList from "./pages/BorrowCards/BorrowCardList.jsx";
import BorrowCardDetail from "./pages/BorrowCards/BorrowCardDetail.jsx";
import BorrowCardForm from "./pages/BorrowCards/BorrowCardForm.jsx";
import BookList from "./pages/Books/BookList.jsx";
import ReaderList from './pages/Readers/ReaderList.jsx';
import ReaderForm from './pages/Readers/ReaderForm.jsx';
import ReaderDetail from './pages/Readers/ReaderDetail.jsx';

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
            <Route path="borrow-cards/overdue" element={<PrivateRoute roles={['admin', 'librarian']}><BorrowCardList overdueOnly /></PrivateRoute>} />
            <Route path="borrow-cards/new" element={<PrivateRoute roles={['admin', 'librarian']}><BorrowCardForm /></PrivateRoute>} />
            <Route path="borrow-cards/:id" element={<PrivateRoute roles={['admin', 'librarian']}><BorrowCardDetail /></PrivateRoute>} />
            <Route path="borrow-cards/:id/edit" element={<PrivateRoute roles={['admin', 'librarian']}><BorrowCardForm /></PrivateRoute>} />
            <Route path="readers" element={<PrivateRoute roles={['admin', 'librarian']}><ReaderList /></PrivateRoute>} />
            <Route path="readers/new" element={<PrivateRoute roles={['admin', 'librarian']}><ReaderForm /></PrivateRoute>} />
            <Route path="readers/:id" element={<PrivateRoute roles={['admin', 'librarian']}><ReaderDetail /></PrivateRoute>} />
            <Route path="users" element={<PrivateRoute roles={['admin']}><UserList /></PrivateRoute>} />
            <Route path="users/new" element={<PrivateRoute roles={['admin']}><UserForm /></PrivateRoute>} />
            <Route path="users/edit/:id" element={<PrivateRoute roles={['admin']}><UserForm /></PrivateRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
