import { useEffect } from 'react';
import { useStorage } from './useStorage.js';

export function useTheme() {
  const [theme, setTheme] = useStorage('theme', 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  function toggle() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return [theme, toggle];
}
