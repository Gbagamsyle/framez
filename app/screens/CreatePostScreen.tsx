import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Header } from '../../components/Header';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { createPost } from '../../services/firebase';

export function CreatePostScreen() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        const file = await new Promise<File | null>((resolve) => {
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0] || null;
            resolve(file);
          };
          input.click();
        });
        if (file) {
          setImage(URL.createObjectURL(file));
          setImageFile(file);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant permission to access your photos');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setImage(result.assets[0].uri);
          setImageFile(null);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image');
    }
  };

  const handlePost = async () => {
    if (!text.trim() && !image) {
      return;
    }
    setLoading(true);
    try {
      const imageToUpload = Platform.OS === 'web' ? imageFile : image;
      await createPost(
        user!.uid,
        user!.displayName || 'Anonymous',
        text,
        imageToUpload || undefined,
        user?.photoURL || undefined
      );
      setText('');
      setImage(null);
      setImageFile(null);
      navigation.goBack();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, flex: 1 }] }>
      <View style={styles.headerWrapper}>
        <Header
          title="Create Post"
          showBack
          onBack={() => navigation.goBack()}
          rightComponent={
            <TouchableOpacity
              onPress={handlePost}
              disabled={loading || (!text.trim() && !image)}
            >
              <Text
                style={[styles.postButton, (!text.trim() && !image) && styles.postButtonDisabled, { color: theme.primary }]}
              >
                Post
              </Text>
            </TouchableOpacity>
          }
        />
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}
      <View style={styles.content}>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground, borderRadius: 8, padding: 12 }]}
          placeholder="What's on your mind?"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          autoFocus
        />
        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeImage}
              onPress={() => setImage(null)}
            >
              <Ionicons name="close-circle" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={[styles.imageButton, { borderTopColor: theme.cardBorder }]} onPress={pickImage}>
          <Ionicons name="image-outline" size={24} color={theme.primary} />
          <Text style={[styles.imageButtonText, { color: theme.primary }]}>Add Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default CreatePostScreen;

const styles = StyleSheet.create({
  headerWrapper: {
    paddingTop: 32,
  },
  container: {
    flex: 1,
    backgroundColor: 'white', // will be overridden by theme.background
  },
  content: {
    padding: 16,
  },
  input: {
    fontSize: 16,
    minHeight: 100,
  },
  imageContainer: {
    marginTop: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    marginTop: 16,
  },
  imageButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 16,
  },
  postButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});