import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Header } from '../../components/Header';
import { PostCard } from '../../components/PostCard';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { deletePost, getUserDoc, listenToUserPosts, Post, updateUserDoc, uploadImageAsync } from '../../services/firebase';

export function ProfileScreen() {
  const { user, logout, updateUserProfile } = useAuth();
  const theme = Colors;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState<string>('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [saving, setSaving] = useState(false);
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

  // load user profile doc (bio etc.)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.uid) return;
      try {
        const doc = await getUserDoc(user.uid);
        if (mounted) {
          setBio((doc && (doc.bio || '')) || '');
        }
      } catch (err) {
        console.error('Failed to load user doc', err);
      }
    };
    load();
    return () => {
      mounted = false;
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

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update Firebase Auth displayName if changed
      if (editName && editName !== user.displayName) {
        await updateUserProfile({ displayName: editName });
      }
      // Update user doc (bio)
      await updateUserDoc(user.uid, { bio: editBio });
      setBio(editBio || '');
      setEditModalVisible(false);
    } catch (err) {
      console.error('Failed to save profile', err);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
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
      <View style={styles.headerInner}>
        <TouchableOpacity onPress={updateProfileImage} style={styles.avatarWrapper}>
          <Image
            source={{ uri: user?.photoURL || 'https://via.placeholder.com/150' }}
            style={styles.avatarLarge}
          />
          <View style={[styles.editAvatarButton, { backgroundColor: theme.accent, borderColor: theme.background }]}> 
            <Ionicons name="camera" size={16} color={theme.background} />
          </View>
        </TouchableOpacity>

          <View style={styles.headerMeta}>
          <Text style={[styles.name, { color: theme.text, fontFamily: 'serif', fontSize: 28, letterSpacing: -1, textTransform: 'uppercase' }]}>{user?.displayName || 'Anonymous'}</Text>
          <Text style={[styles.email, { color: theme.text, fontFamily: 'sans-serif' }]}>{user?.email}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: theme.accent }]}
              onPress={() => {
                setEditName(user?.displayName || '');
                setEditBio(bio || '');
                setEditModalVisible(true);
              }}
            > 
              <Text style={[styles.editButtonText, { fontFamily: 'sans-serif', letterSpacing: 1 }]}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.logoutButton, { borderColor: theme.cardBorder }]} onPress={handleLogout}>
              <Text style={[styles.logoutButtonText, { color: theme.accent, fontFamily: 'sans-serif', letterSpacing: 1 }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Text style={[styles.bio, { color: theme.text, fontFamily: 'serif', fontSize: 16, marginTop: 24 }]}>{bio || 'Welcome to my profile — share great moments and connect with others.'}</Text>

      <View style={[styles.stats, { borderTopColor: theme.cardBorder }]}> 
        <View style={styles.statBadge}>
          <Text style={[styles.statNumber, { color: theme.text, fontFamily: 'serif', fontSize: 22 }]}>{posts.length}</Text>
          <Text style={[styles.statLabel, { color: theme.accent, fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 }]}>Posts</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={[styles.statNumber, { color: theme.text, fontFamily: 'serif', fontSize: 22 }]}>0</Text>
          <Text style={[styles.statLabel, { color: theme.accent, fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 }]}>Followers</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={[styles.statNumber, { color: theme.text, fontFamily: 'serif', fontSize: 22 }]}>{0}</Text>
          <Text style={[styles.statLabel, { color: theme.accent, fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 }]}>Following</Text>
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
              <Ionicons name="log-out-outline" size={24} color={theme.accent} />
            </TouchableOpacity>
          }
        />
      </View>

      {/* Edit Profile Modal (polished) */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[{ color: theme.text, fontSize: 18, fontWeight: '700' }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalAvatarRow}>
                <Image source={{ uri: user?.photoURL || 'https://via.placeholder.com/150' }} style={styles.modalAvatarPreview} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[{ color: theme.text, fontWeight: '700', marginBottom: 6 }]}>Profile Photo</Text>
                  <TouchableOpacity onPress={updateProfileImage} style={[styles.changeAvatarButton, { borderColor: theme.cardBorder }]}> 
                    <Text style={{ color: theme.accent, fontWeight: '700' }}>Change Avatar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.modalFieldLabel, { color: theme.text }]}>Display name</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Display name"
                placeholderTextColor={Colors.secondary}
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
              />

              <Text style={[styles.modalFieldLabel, { color: theme.text }]}>Short bio</Text>
              <TextInput
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell people about yourself"
                placeholderTextColor={Colors.secondary}
                style={[styles.modalInput, { backgroundColor: theme.inputBackground, color: theme.text, minHeight: 90, textAlignVertical: 'top' }]}
                multiline
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalButton}>
                <Text style={{ color: theme.accent, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={saveProfile} style={[styles.modalButton, styles.modalButtonPrimary]} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} onDelete={item.authorId === user?.uid ? () => handleDelete(item.id) : undefined} />
        )}
        ListHeaderComponent={ProfileHeader}
        contentContainerStyle={styles.list}
      />
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
    backgroundColor: Colors.accent,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
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
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginRight: 16,
  },
  avatarLarge: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  headerMeta: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutButtonText: {
    fontWeight: '600',
  },
  bio: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  statBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 720,
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalCloseButton: {
    padding: 6,
    borderRadius: 8,
  },
  modalBody: {
    marginBottom: 12,
  },
  modalAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatarPreview: {
    width: 86,
    height: 86,
    borderRadius: 44,
    backgroundColor: '#eee',
  },
  changeAvatarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalFieldLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '700',
  },
  modalInput: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: Colors.accent,
  },
});