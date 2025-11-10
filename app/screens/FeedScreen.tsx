import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    View
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Header } from '../../components/Header';
import { PostCard } from '../../components/PostCard';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { listenToPosts, Post } from '../../services/firebase';


export function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToPosts((fetchedPosts) => {
      setPosts(fetchedPosts);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // onSnapshot will update the list automatically; keep the refresh spinner short
    setTimeout(() => setRefreshing(false), 800);
  };

  const headerRight = (
    <TouchableOpacity onPress={() => navigation.navigate('create')}>
      <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
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
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingVertical: 8,
  },
});