import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Header } from '../../components/Header';
import { PostCard } from '../../components/PostCard';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { addComment, listenToPosts, Post } from '../../services/firebase';

export function PostDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const theme = Colors;
  const { postId } = route.params || {};

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToPosts((posts) => {
      const found = posts.find((p) => p.id === postId) || null;
      setPost(found);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
    >
      <View style={styles.headerWrapper}>
        <Header title="Post" showBack onBack={() => navigation.goBack()} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : post ? (
        <>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <PostCard post={post as any} />
          </ScrollView>

          <View style={{ paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 35, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: Colors.cardBorder }}>
            <Text style={{ color: theme.text, marginBottom: 6, fontWeight: '600', fontSize: 14 }}>Add a comment</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                placeholderTextColor={Colors.secondary}
                style={{ flex: 1, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 8, padding: 8, color: theme.text }}
                editable={!postingComment}
              />
              <TouchableOpacity
                onPress={async () => {
                  if (!commentText.trim() || !post) return;
                  if (!user) return; // require auth
                  setPostingComment(true);
                  try {
                    await addComment(post.id, user.uid, user.displayName || 'Anonymous', commentText.trim());
                    setCommentText('');
                  } catch (err) {
                    console.error('Failed to add comment', err);
                  } finally {
                    setPostingComment(false);
                  }
                }}
                style={{ marginLeft: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.accent, borderRadius: 8 }}
              >
                <Text style={{ color: '#fff' }}>{postingComment ? 'Posting...' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.centered}>
          <Text style={{ color: theme.text }}>Post not found.</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

export default PostDetailScreen;

const styles = StyleSheet.create({
  headerWrapper: {
    paddingTop: 32,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});