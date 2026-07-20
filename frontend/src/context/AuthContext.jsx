import { createContext, useContext, useState } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const loading = false;

  // Backend tra ve { token, user }. Gop lai thanh 1 object phang de
  // phan con lai cua app (Navbar, Sidebar...) truy cap truc tiep
  // user.name, user.role... nhu truoc, khong can sua lai moi noi.
  const flattenAuthResponse = (data) => ({ ...data.user, token: data.token });

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    const flat = flattenAuthResponse(data);
    localStorage.setItem('user', JSON.stringify(flat));
    setUser(flat);
    return flat;
  };

  // form: { name, email, studentId, phone, address, password, confirmPassword }
  const register = async (form) => {
    const { data } = await API.post('/auth/register', form);
    const flat = flattenAuthResponse(data);
    localStorage.setItem('user', JSON.stringify(flat));
    setUser(flat);
    return flat;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // Dung sau khi PUT /users/me thanh cong, de dong bo lai ten/email
  // hien thi (Navbar...) ma khong can dang nhap lai. Token khong doi.
  const updateUser = (partialData) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...partialData };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
