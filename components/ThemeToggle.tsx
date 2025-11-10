import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    if (theme === 'system') return 'phone-portrait-outline';
    return isDark ? 'moon' : 'sunny';
  };

  const getThemeText = () => {
    if (theme === 'system') return 'System';
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        { backgroundColor: isDark ? Colors.dark.card : Colors.light.card }
      ]} 
      onPress={cycleTheme}
    >
      <Ionicons 
        name={getThemeIcon()} 
        size={20} 
        color={isDark ? Colors.dark.text : Colors.light.text} 
      />
      <Text style={[
        styles.text,
        { color: isDark ? Colors.dark.text : Colors.light.text }
      ]}>
        {getThemeText()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  text: {
    fontSize: 16,
  },
});