import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Header } from '../../components/Header';
import { PostCard } from '../../components/PostCard';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { deletePost, listenToUserPosts, Post, uploadImageAsync } from '../../services/firebase';

export function ProfileScreen() {
  const { user, logout, updateUserProfile } = useAuth();
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  // Use a real-time listener so post list and count update instantly
  useEffect(() => {
    let unsubscribe: () => void;

    const setupListener = async () => {
      if (!user?.uid) {
        setPosts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      unsubscribe = listenToUserPosts(user.uid, (userPosts) => {
        setPosts(userPosts);
        setLoading(false);
      });
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      // No need to update posts state manually as the real-time listener will handle it
    } catch (err) {
      console.error('Error deleting post', err);
      Alert.alert('Error', 'Failed to delete post');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  };

  // In the updateProfileImage function, replace the ImagePicker call with:
  const updateProfileImage = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        try {
          // Upload to Firebase Storage and update profile photoURL
          const imageUrl = await uploadImageAsync(result.assets[0].uri);
          await updateUserProfile({ photoURL: imageUrl });
        } catch (error: any) {
          console.error('Error updating profile image:', {
            message: error?.message,
            code: error?.code,
            stack: error?.stack,
          });
          Alert.alert('Error', 'Failed to update profile image');
        }
      }
    } catch (err) {
      console.error('updateProfileImage: unexpected error', err);
      Alert.alert('Error', 'Failed to pick an image');
    }
  };

  const ProfileHeader = () => (
    <View style={[styles.profileHeader, { backgroundColor: theme.card }]}>
      <TouchableOpacity onPress={updateProfileImage}>
        <Image
          source={{
            uri: user?.photoURL || 'https://via.placeholder.com/100',
          }}
          style={styles.avatar}
        />
        <View style={[styles.editAvatarButton, { backgroundColor: theme.primary, borderColor: theme.background }]}>
          <Ionicons name="camera" size={16} color={theme.background} />
        </View>
      </TouchableOpacity>

      <Text style={[styles.name, { color: theme.text }]}>{user?.displayName || 'Anonymous'}</Text>
      <Text style={[styles.email, { color: theme.icon }]}>{user?.email}</Text>

      <View style={[styles.stats, { borderTopColor: theme.cardBorder }]}>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: theme.text }]}>{posts.length}</Text>
          <Text style={[styles.statLabel, { color: theme.icon }]}>Posts</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.headerWrapper}>
        <Header
          title="Profile"
          rightComponent={
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          }
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} onDelete={item.authorId === user?.uid ? () => handleDelete(item.id) : undefined} />
        )}
        ListHeaderComponent={ProfileHeader}
        contentContainerStyle={styles.list}
      />
      <View style={styles.themeToggleContainer}>
        <ThemeToggle />
      </View>
    </View>
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  headerWrapper: {
    paddingTop: 32,
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 24,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  list: {
    paddingBottom: 16,
  },
  themeToggleContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
});