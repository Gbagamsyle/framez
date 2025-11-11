import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/theme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
}

export function Header({ title, showBack, onBack, rightComponent }: HeaderProps) {
  const theme = Colors;
  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
      <View style={styles.leftContainer}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.logoWrapper, { backgroundColor: 'transparent' }]}> 
              <Image
                source={require('../assets/images/framez-logo-new.jpg')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="Framez logo"
              />
            </View>
        )}
      </View>

      {/* Centered title container — positioned absolutely so it remains centered regardless of left/right widths */}
      <View pointerEvents="none" style={styles.centerContainer}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
      </View>

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
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    width: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 8,
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
  centerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 76, // provide a little padding so long titles don't collide with left/right actions
  },
});