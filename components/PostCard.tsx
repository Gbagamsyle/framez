import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/theme';
import { Post } from '../services/firebase';

interface CommentPreview {
  id?: string;
  authorName?: string;
  text?: string;
}

interface PostCardProps {
  post: Post & { comments?: CommentPreview[]; likesCount?: number; commentsCount?: number };
  onPress?: () => void;
  onDelete?: () => void;
  onLike?: (postId: string, liked: boolean) => void;
}

export function PostCard(props: PostCardProps) {
  const { post, onPress } = props;
  const theme = Colors;

  // compute natural aspect ratio for post image so we don't force a fixed crop
  const [imageAspect, setImageAspect] = useState<number | null>(16 / 9);

  useEffect(() => {
    let mounted = true;
    if (post.imageUrl) {
      Image.getSize(
        post.imageUrl,
        (w, h) => {
          if (!mounted) return;
          if (w && h) setImageAspect(w / h);
        },
        (err) => {
          // fallback to default aspect if getSize fails
          if (!mounted) return;
          setImageAspect(16 / 9);
        }
      );
    }
    return () => {
      mounted = false;
    };
  }, [post.imageUrl]);

  // Clamp extreme aspect ratios to avoid very tall/wide images breaking the feed layout
  const MIN_ASPECT = 0.5; // very tall (height double width)
  const MAX_ASPECT = 2.5; // very wide
  const aspectToUse = imageAspect ? Math.min(Math.max(imageAspect, MIN_ASPECT), MAX_ASPECT) : 16 / 9;

  // Local like state — optimistic UI
  const initialLikes = post.likesCount ?? (props.post as any).likesCount ?? 0;
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState<number>(initialLikes);

  const commentsCount = post.commentsCount ?? post.comments?.length ?? 0;

  const handleDeletePress = () => {
    if (!props.onDelete) return;
    Alert.alert('Delete post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => props.onDelete && props.onDelete() },
    ]);
  };

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikes(prev => (next ? prev + 1 : Math.max(0, prev - 1)));
    props.onLike && props.onLike(post.id, next);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: post.text || '',
      });
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  const firstComments = useMemo(() => (post.comments && post.comments.length ? post.comments.slice(0, 2) : []), [post.comments]);

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }] }>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.header}>
          <Image
            source={{ uri: post.authorPhotoUrl || 'https://via.placeholder.com/48' }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.authorName, { color: theme.text }]}>{post.authorName}</Text>
            <Text style={[styles.timestamp, { color: Colors.secondary }]}>{format(post.timestamp ?? new Date(), 'MMM d, yyyy • h:mm a')}</Text>
          </View>
          {/** show delete icon only when onDelete prop provided */}
          {props.onDelete && (
            <TouchableOpacity onPress={handleDeletePress} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>

        {post.text ? (
          <Text style={[styles.text, { color: theme.text }]}>{post.text}</Text>
        ) : null}

        {post.imageUrl && (
          <Image
            source={{ uri: post.imageUrl }}
            style={[styles.postImage, { aspectRatio: aspectToUse, maxHeight: 900 }]}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.action} onPress={toggleLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? '#ff3b30' : theme.text} />
          <Text style={[styles.actionText, { color: theme.text }]}>{likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={() => { /* open comments */ }}>
          <Ionicons name="chatbubble-outline" size={22} color={theme.text} />
          <Text style={[styles.actionText, { color: theme.text }]}>{commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={22} color={theme.text} />
          <Text style={[styles.actionText, { color: theme.text }]}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Likes and comments preview */}
      <View style={styles.metaRow}>
        <Text style={[styles.likesText, { color: theme.text }]}>{likes} likes</Text>
      </View>

      {firstComments.length > 0 ? (
        <View style={styles.commentsPreview}>
          {firstComments.map((c, i) => (
            <View key={c.id ?? `${post.id}-comment-${i}`} style={styles.commentRow}>
              <Text style={[styles.commentAuthor, { color: theme.text }]}>{c.authorName ?? 'User'}</Text>
              <Text style={[styles.commentText, { color: theme.text }]}>{` ${c.text ?? ''}`}</Text>
            </View>
          ))}
          {commentsCount > firstComments.length && (
            <Text style={[styles.viewAll, { color: Colors.secondary }]}>View all {commentsCount} comments</Text>
          )}
        </View>
      ) : (
        commentsCount > 0 && (
          <Text style={[styles.viewAll, { color: Colors.secondary, marginTop: 8 }]}>View all {commentsCount} comments</Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    padding: 6,
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e6e6e6',
    marginTop: 8,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
  },
  metaRow: {
    paddingVertical: 4,
  },
  likesText: {
    fontWeight: '700',
  },
  commentsPreview: {
    marginTop: 4,
  },
  commentRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  commentAuthor: {
    fontWeight: '700',
  },
  commentText: {
    flex: 1,
  },
  viewAll: {
    marginTop: 6,
    fontSize: 13,
  },
});