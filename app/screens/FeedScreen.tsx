import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Header } from '../../components/Header';
import { PostCard } from '../../components/PostCard';
import { Colors } from '../../constants/theme';
import { listenToPosts, Post } from '../../services/firebase';


export function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const router = useRouter();
  const theme = Colors;
  

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToPosts((fetchedPosts) => {
      setPosts(fetchedPosts);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  // Prepare stories data: use latest 10 posts as stories
  const stories = posts.slice(0, 10);

  // Render each story item
  const renderStory = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.storyContainer}
      onPress={() => router.push(`/screens/PostDetail?postId=${encodeURIComponent(item.id)}`)}
    >
      <View style={[styles.storyImageWrapper, { borderColor: theme.accent }]}>
        <Image
          source={{ uri: item.imageUrl || item.authorPhotoUrl || 'https://via.placeholder.com/60' }}
          style={styles.storyImage}
          resizeMode="cover"
        />
      </View>
      <Text style={[styles.storyUsername, { color: theme.text }]} numberOfLines={1}>
        {item.authorName}
      </Text>
    </TouchableOpacity>
  );

  // Track latest seen post id
  const [lastSeenPostId, setLastSeenPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!posts || posts.length === 0) return;
    const latestId = posts[0].id;
    if (lastSeenPostId === null) {
      // initialize last seen to the current top post
      setLastSeenPostId(latestId);
    }
  }, [posts, lastSeenPostId]);

  const onRefresh = () => {
    setRefreshing(true);
    // onSnapshot will update the list automatically; keep the refresh spinner short
    setTimeout(() => setRefreshing(false), 800);
  };

  // Calculate unread count (number of posts above lastSeenPostId)
  const unreadCount = React.useMemo(() => {
    if (!lastSeenPostId) return 0;
    const idx = posts.findIndex((p) => p.id === lastSeenPostId);
    if (idx === -1) return posts.length;
    return idx; // posts before the index are newer
  }, [posts, lastSeenPostId]);

  useEffect(() => {
    if (unreadCount > 0) {
      console.log('FeedScreen: unreadCount ->', unreadCount);
    }
  }, [unreadCount]);

  const headerRight = unreadCount > 0 ? (
    <TouchableOpacity
      onPress={() => {
  router.push(`/screens/PostDetail?postId=${encodeURIComponent(posts[0].id)}`);
  setLastSeenPostId(posts[0].id);
      }}
      style={styles.headerIconWrapper}
    >
      <Ionicons name="notifications" size={28} color={theme.accent} />
      <View style={styles.notificationBadge}>
        <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
      </View>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity onPress={() => navigation.navigate('create')} style={styles.headerIconWrapper}>
      <Ionicons name="add-circle-outline" size={28} color={theme.accent} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  

  return (
    <View style={[styles.container, { backgroundColor: theme.background }] }>
      <View style={styles.headerWrapper}>
        <Header title="Feed" rightComponent={headerRight} />
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={
          <View>
            {/* Stories Section */}
            <View style={styles.storiesWrapper}>
              <FlatList
                data={[{ id: 'add-story' }, ...stories]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  if (item.id === 'add-story') {
                    return (
                      <TouchableOpacity
                        style={styles.storyContainer}
                        onPress={() => navigation.navigate('create')}
                      >
                        <View style={[styles.storyImageWrapper, { backgroundColor: theme.cardBorder, borderColor: theme.cardBorder }]}>
                          <Ionicons name="add" size={28} color={theme.accent} />
                        </View>
                        <Text style={[styles.storyUsername, { color: theme.text }]} numberOfLines={1}>
                          Add
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                  return renderStory({ item: item as Post });
                }}
                horizontal
                scrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesList}
              />
            </View>

        
          </View>
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

export default FeedScreen;

const styles = StyleSheet.create({
  headerWrapper: {
    paddingTop: 32,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  logo: {
    width: 120,
    height: 120,
  },
  list: {
    paddingVertical: 24,
    paddingHorizontal: 0,
  },
  storiesWrapper: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.cardBorder,
  },
  storiesList: {
    paddingHorizontal: 12,
    gap: 12,
  },
  storyContainer: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  storyImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyUsername: {
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 60,
    textAlign: 'center',
  },
  headerIconWrapper: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff3b30',
    borderWidth: 1,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 10,
  },
});