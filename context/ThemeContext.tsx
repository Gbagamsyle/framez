import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  theme: 'editorial';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Only one theme: editorial
  return (
    <ThemeContext.Provider value={{ theme: 'editorial' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}