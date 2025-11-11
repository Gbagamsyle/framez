import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/theme';

export function ThemeToggle() {
  // Editorial theme only; no toggle
  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: Colors.card }]} disabled>
      <Ionicons name="newspaper-outline" size={20} color={Colors.text} />
      <Text style={[styles.text, { color: Colors.text }]}>Editorial</Text>
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