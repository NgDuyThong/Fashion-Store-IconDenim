import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Lấy theme từ localStorage hoặc mặc định là 'normal'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // Chỉ chấp nhận các giá trị hợp lệ: 'tet' hoặc 'normal'
    if (savedTheme && ['tet', 'normal'].includes(savedTheme)) {
      return savedTheme;
    }
    // Nếu giá trị không hợp lệ, xóa khỏi localStorage và dùng giá trị mặc định
    localStorage.removeItem('theme');
    return 'normal';
  });

  // Lưu theme vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Lắng nghe sự kiện thay đổi theme từ admin (CustomEvent trong cùng tab)
  useEffect(() => {
    const handleThemeChange = (event) => {
      const newTheme = event.detail.theme;
      if (newTheme && ['tet', 'normal'].includes(newTheme)) {
        setTheme(newTheme);
      }
    };

    window.addEventListener('themeChange', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  // Lắng nghe storage event để đồng bộ theme giữa các tab khác nhau
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'theme' && event.newValue) {
        if (['tet', 'normal'].includes(event.newValue)) {
          setTheme(event.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme phải được sử dụng trong ThemeProvider');
  }
  return context;
};
