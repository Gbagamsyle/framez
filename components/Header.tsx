import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
}

export function Header({ title, showBack, onBack, rightComponent }: HeaderProps) {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.logoWrapper, { backgroundColor: isDark ? '#000000' : 'transparent' }]}>
            <Image
              source={require('../assets/images/Framez logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}
      </View>

      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

      <View style={styles.rightContainer}>
        {rightComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  logo: {
    width: 36,
    height: 36,
  },
  logoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});