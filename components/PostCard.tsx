import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { Post } from '../services/firebase';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onDelete?: () => void;
}

export function PostCard(props: PostCardProps) {
  const { post, onPress } = props;
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const handleDeletePress = () => {
    if (!props.onDelete) return;
    Alert.alert('Delete post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => props.onDelete && props.onDelete() },
    ]);
  };

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }] }>
      <View style={styles.header}>
        <Image
          source={{ uri: post.authorPhotoUrl || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.authorName, { color: theme.text }]}>{post.authorName}</Text>
          <Text style={[styles.timestamp, { color: theme.icon }]}>
            {format(post.timestamp, 'MMM d, yyyy')}
          </Text>
        </View>
        {/** show delete icon only when onDelete prop provided */}
        {props.onDelete && (
          <TouchableOpacity onPress={handleDeletePress} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={theme.error} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.text, { color: theme.text }]}>{post.text}</Text>
      
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  deleteButton: {
    padding: 6,
    marginLeft: 8,
  },
});