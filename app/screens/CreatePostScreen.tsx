import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { State as GHState, PinchGestureHandler } from 'react-native-gesture-handler';
import { Header } from '../../components/Header';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { createPost } from '../../services/firebase';

/*
  Instagram-like flow:
  - After picking an image, immediately open the crop modal with default aspect 4:5
  - Allow panning the image inside the crop box to position which area will be cropped
  - Confirm -> crop and set preview; the cropped URI will be uploaded
*/

export function CreatePostScreen() {
  const theme = Colors;
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null); // preview/cropped uri
  const [imageFile, setImageFile] = useState<File | null>(null); // web file
  const [originalImage, setOriginalImage] = useState<string | null>(null); // original uri (for revert)
  const [loading, setLoading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [zoom, setZoom] = useState<number>(1);

  // --- Crop interaction refs ---
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastPan = useRef({ x: 0, y: 0 });
  const naturalSizeRef = useRef<{ width: number; height: number } | null>(null);
  const displayInfoRef = useRef<{
    cropW: number;
    cropH: number;
    imageDispW: number;
    imageDispH: number;
    scale: number;
  } | null>(null);

  // Default aspect ratio (4:5)
  const DEFAULT_ASPECT = 4 / 5;

  // --- PanResponder with correct clamping math ---
  const panResponder = useRef(
    PanResponder.create({
      // Only start pan responder for single-finger drags (so pinch can use two fingers)
      onStartShouldSetPanResponder: (_evt, gs) => !!(gs && gs.numberActiveTouches === 1),
      onMoveShouldSetPanResponder: (_evt, gs) => !!(gs && gs.numberActiveTouches === 1),
      onPanResponderGrant: () => {
        pan.setOffset({ x: lastPan.current.x, y: lastPan.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gs) => {
        // Move relative to offset; Animated handles interpolation
        pan.setValue({ x: gs.dx, y: gs.dy });
      },
      onPanResponderRelease: (_, gs) => {
        pan.flattenOffset();
        lastPan.current.x = lastPan.current.x + gs.dx;
        lastPan.current.y = lastPan.current.y + gs.dy;

        // clamp final using displayInfoRef
        const info = displayInfoRef.current;
        if (info) {
          const minX = Math.min(info.cropW - info.imageDispW, 0); // if imageDispW > cropW => negative number
          const maxX = 0;
          const minY = Math.min(info.cropH - info.imageDispH, 0);
          const maxY = 0;

          // corrected clamping
          lastPan.current.x = Math.min(Math.max(lastPan.current.x, minX), maxX);
          lastPan.current.y = Math.min(Math.max(lastPan.current.y, minY), maxY);

          pan.setValue({ x: lastPan.current.x, y: lastPan.current.y });
        }
      },
    }),
  ).current;

  // --- Image picker (web + native) ---
  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        const file: File | null = await new Promise((resolve) => {
          input.onchange = (e) => {
            const f = (e.target as HTMLInputElement).files?.[0] || null;
            resolve(f);
          };
          input.click();
        });

        if (file) {
          const uri = URL.createObjectURL(file);
          setOriginalImage(uri);
          setImage(uri);
          setImageFile(file);
          // Immediately open crop modal with default aspect
          setTimeout(() => openCropModal(uri, DEFAULT_ASPECT), 50);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please grant permission to access your photos');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const uri = result.assets[0].uri;
          setOriginalImage(uri);
          setImage(uri);
          setImageFile(null);
          // Immediately open crop modal with default aspect
          setTimeout(() => openCropModal(uri, DEFAULT_ASPECT), 50);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image');
    }
  };

  // --- rotate image ---
  const rotateImage = async (uri: string | null) => {
    if (!uri) return;
    setLoading(true);
    try {
      const result = await ImageManipulator.manipulateAsync(uri, [{ rotate: 90 }], {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      setImage(result.uri);
      // also update originalImage so revert still points to sensible version
      setOriginalImage(result.uri);
    } catch (err) {
      console.error('Rotate failed', err);
      Alert.alert('Error', 'Failed to rotate image');
    } finally {
      setLoading(false);
    }
  };

  // --- open crop modal: calculate display sizing & initial pan ---
  const openCropModal = async (uri: string | null, aspect: number) => {
    if (!uri) return;
    try {
      // get natural size
      const { width: w, height: h } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        Image.getSize(
          uri,
          (width, height) => resolve({ width, height }),
          (err) => reject(err),
        );
      });

      naturalSizeRef.current = { width: w, height: h };

      const screenW = Dimensions.get('window').width;
      const padding = 40;
      const cropW = Math.round(screenW - padding); // crop area width
      const cropH = Math.round(cropW / aspect); // crop area height based on aspect

      // scale to cover the crop box (cover behavior)
      const scale = Math.max(cropW / w, cropH / h);
      const imageDispW = Math.round(w * scale);
      const imageDispH = Math.round(h * scale);

      // initial pan: center image within crop box
      const initX = Math.round((cropW - imageDispW) / 2);
      const initY = Math.round((cropH - imageDispH) / 2);

      displayInfoRef.current = { cropW, cropH, imageDispW, imageDispH, scale };

      pan.setValue({ x: initX, y: initY });
      lastPan.current = { x: initX, y: initY };
  setZoom(scale);

      setShowCropModal(true);
    } catch (err) {
      console.error('openCropModal failed', err);
      Alert.alert('Error', 'Unable to open crop editor');
    }
  };

  const cancelCrop = () => {
    // keep the original preview if user cancels (originalImage already set)
    setShowCropModal(false);
  };

  const confirmCrop = async () => {
    const info = displayInfoRef.current;
    const nat = naturalSizeRef.current;
    if (!info || !originalImage || !nat) {
      setShowCropModal(false);
      return;
    }

    setLoading(true);
    try {
      const translate = lastPan.current;

      // Determine the actual scale used between natural image and displayed image
      // prefer width-based scale (should be same as height-based but guard)
      const scaleUsed = info.imageDispW && nat.width ? info.imageDispW / nat.width : info.scale || 1;

      // Compute crop rectangle in original image coordinates
      let originX = Math.round((-translate.x) / scaleUsed);
      let originY = Math.round((-translate.y) / scaleUsed);
      let cropW = Math.round(info.cropW / scaleUsed);
      let cropH = Math.round(info.cropH / scaleUsed);

      // Clamp values to image bounds to avoid IllegalArgumentException from native crop
      if (originX < 0) originX = 0;
      if (originY < 0) originY = 0;
      if (cropW <= 0) cropW = Math.min(nat.width, Math.max(1, Math.round(nat.width)));
      if (cropH <= 0) cropH = Math.min(nat.height, Math.max(1, Math.round(nat.height)));

      if (originX + cropW > nat.width) {
        cropW = Math.max(1, nat.width - originX);
      }
      if (originY + cropH > nat.height) {
        cropH = Math.max(1, nat.height - originY);
      }

      // perform crop
      const result = await ImageManipulator.manipulateAsync(
        originalImage,
        [{ crop: { originX, originY, width: cropW, height: cropH } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );

      setImage(result.uri);
      // keep the originalImage so user can revert (original before cropping)
      setShowCropModal(false);
      // reset pan state for next time
      lastPan.current = { x: 0, y: 0 };
      pan.setValue({ x: 0, y: 0 });
      displayInfoRef.current = null;
    } catch (err) {
      console.error('confirmCrop failed', err);
      Alert.alert('Error', 'Failed to crop image');
    } finally {
      setLoading(false);
    }
  };

  // Pinch-to-zoom handler: live feedback via pinchScale, commit zoom on gesture end
  const pinchScale = useRef(new Animated.Value(1)).current;
  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true },
  );

  const onPinchStateChange = (ev: any) => {
    // when pinch ends, commit the zoom by recalculating display sizes
    if (ev?.nativeEvent?.oldState === GHState.ACTIVE || ev?.nativeEvent?.state === GHState.END) {
      const s = ev.nativeEvent.scale || 1;
      const newZoom = Math.max(0.1, zoom * s);
      applyZoom(newZoom);
      pinchScale.setValue(1);
    }
  };

  const applyZoom = (newZoom: number) => {
    const info = displayInfoRef.current;
    const nat = naturalSizeRef.current;
    if (!info || !nat) return;
    // clamp zoom to reasonable bounds
    const minZoom = Math.min(info.cropW / nat.width, info.cropH / nat.height); // fit
    const maxZoom = 3;
    const z = Math.max(Math.min(newZoom, maxZoom), minZoom);

    const imageDispW = Math.round(nat.width * z);
    const imageDispH = Math.round(nat.height * z);
    // update display info
    displayInfoRef.current = { ...info, imageDispW, imageDispH };
    // clamp pan
    const minX = Math.min(info.cropW - imageDispW, 0);
    const minY = Math.min(info.cropH - imageDispH, 0);
    lastPan.current.x = Math.min(Math.max(lastPan.current.x, minX), 0);
    lastPan.current.y = Math.min(Math.max(lastPan.current.y, minY), 0);
    pan.setValue({ x: lastPan.current.x, y: lastPan.current.y });
    setZoom(z);
  };

  // --- submit post ---
  const handlePost = async () => {
    if (!text.trim() && !image) {
      return;
    }
    setLoading(true);
    try {
      // For web, we send file (if you want to upload the cropped blob you need to convert it to file/blob)
      // For native, we pass the image uri (cropped)
      const imageToUpload = Platform.OS === 'web' ? imageFile : image;
      
      console.log('Starting post creation...');
      await createPost(
        user!.uid,
        user!.displayName || 'Anonymous',
        text,
        imageToUpload || undefined,
        user?.photoURL || undefined,
      );
      console.log('Post created successfully');

      // Clear form immediately
      setText('');
      setImage(null);
      setImageFile(null);
      setOriginalImage(null);
      
      // Give user visual feedback before navigating
      setTimeout(() => {
        setLoading(false);
        navigation.goBack();
      }, 500);
    } catch (error) {
      console.error('Error creating post:', error);
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const disabledPost = loading || (!text.trim() && !image);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerWrapper}>
        <Header
          title="Create Post"
          showBack
          onBack={() => navigation.goBack()}
          rightComponent={
            <TouchableOpacity
              onPress={handlePost}
              disabled={disabledPost}
              style={[styles.headerPostButton, disabledPost && styles.headerPostButtonDisabled]}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.headerPostButtonText}>Post</Text>}
            </TouchableOpacity>
          }
        />
      </View>

      <View style={styles.userRow}>
        <Image source={{ uri: user?.photoURL || 'https://via.placeholder.com/48' }} style={styles.userAvatar} />
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.userName, { color: theme.text }]}>{user?.displayName || 'You'}</Text>
          <Text style={[styles.userSubtitle, { color: Colors.secondary }]}>Public</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      )}

      <View style={styles.content}>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground }]}
          placeholder="What's on your mind?"
          placeholderTextColor={Colors.secondary}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          autoFocus
        />

        <View style={styles.rowBetween}>
          <Text style={[styles.charCount, { color: Colors.secondary }]}>{text.length}/500</Text>
        </View>

        {image ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />

            <View style={styles.editToolbar}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  // revert to original (before cropping). If originalImage is null, ignore.
                  if (originalImage) {
                    setImage(originalImage);
                  }
                }}
              >
                <Text style={styles.optionButtonText}>Original</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  // open crop modal with 4:5 aspect explicitly
                  openCropModal(image, 4 / 5);
                }}
              >
                <Text style={styles.optionButtonText}>4:5</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButton} onPress={() => openCropModal(image, 1 / 1)}>
                <Text style={styles.optionButtonText}>1:1</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButton} onPress={() => rotateImage(image)}>
                <Text style={styles.optionButtonText}>Rotate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, styles.optionButtonDanger]}
                onPress={() => {
                  setImage(null);
                  setOriginalImage(null);
                }}
              >
                <Text style={[styles.optionButtonText, styles.optionButtonDangerText]}>Remove</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.removeImageOverlay}
              onPress={() => {
                setImage(null);
                setOriginalImage(null);
              }}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.imageButton, { borderTopColor: theme.cardBorder }]} onPress={pickImage}>
            <Ionicons name="image-outline" size={20} color={theme.accent} />
            <Text style={[styles.imageButtonText, { color: theme.accent }]}>Add Photo</Text>
          </TouchableOpacity>
        )}

        {/* Crop modal */}
        {showCropModal && displayInfoRef.current && (
          <Modal visible={showCropModal} transparent animationType="fade" onRequestClose={cancelCrop}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={[styles.cropBox, { width: displayInfoRef.current.cropW, height: displayInfoRef.current.cropH }]}>
                  <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
                    <Animated.View
                      style={{ width: displayInfoRef.current.cropW, height: displayInfoRef.current.cropH, overflow: 'hidden' }}
                      {...panResponder.panHandlers}
                    >
                      <Animated.Image
                        source={{ uri: originalImage || image || undefined }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: displayInfoRef.current.imageDispW,
                          height: displayInfoRef.current.imageDispH,
                          transform: [...pan.getTranslateTransform(), { scale: pinchScale }],
                        }}
                      />
                    </Animated.View>
                  </PinchGestureHandler>
                </View>

                <View style={styles.cropActions}> 
                  <TouchableOpacity style={styles.cropButton} onPress={cancelCrop}>
                    <Text style={styles.cropButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <View style={styles.zoomControls}>
                    <TouchableOpacity style={styles.zoomButton} onPress={() => applyZoom(zoom * 0.9)}>
                      <Text style={styles.zoomButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.zoomLevel}>{Math.round(zoom * 100)}%</Text>
                    <TouchableOpacity style={styles.zoomButton} onPress={() => applyZoom(zoom * 1.1)}>
                      <Text style={styles.zoomButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={[styles.cropButton, styles.cropButtonPrimary]} onPress={confirmCrop}>
                    <Text style={[styles.cropButtonText, styles.cropButtonPrimaryText]}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
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
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  input: {
    minHeight: 140,
    borderWidth: 0,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.cardBorder,
    backgroundColor: 'transparent',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userSubtitle: {
    fontSize: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
  },
  imagePreviewContainer: {
    marginTop: 12,
    alignItems: 'center',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 360,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  removeImageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.cardBorder,
    marginTop: 12,
    justifyContent: 'center',
  },
  imageButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  postButton: {
    fontSize: 18,
    fontWeight: '700',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  headerPostButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  headerPostButtonDisabled: {
    backgroundColor: '#b4b4b4',
  },
  headerPostButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  editToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  optionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 6,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.cardBorder,
  },
  optionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
  },
  optionButtonDanger: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  optionButtonDangerText: {
    color: '#a00',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  cropBox: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropActions: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
    width: '60%',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoomButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  zoomButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  zoomLevel: {
    color: '#fff',
    fontWeight: '700',
  },
  cropButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  cropButtonText: {
    fontWeight: '700',
    color: '#111',
  },
  cropButtonPrimary: {
    backgroundColor: Colors.accent,
  },
  cropButtonPrimaryText: {
    color: '#fff',
  },
});
