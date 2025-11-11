// Cloudinary configuration
// Prefer environment variables so we can configure per-environment (dev/EAS)
const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgbcfpym4';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'framez';

// Log configuration on startup for debugging
console.log('[Cloudinary Config] Cloud Name:', CLOUD_NAME);
console.log('[Cloudinary Config] Upload Preset:', UPLOAD_PRESET);

export async function uploadToCloudinary(fileOrUri: string | File): Promise<string> {
  // Validate configuration
  if (!CLOUD_NAME) {
    throw new Error('Cloudinary cloud name is not configured. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME environment variable.');
  }
  if (!UPLOAD_PRESET) {
    throw new Error('Cloudinary upload preset is not configured. Set EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET environment variable.');
  }
  try {
    // Create form data
    const formData = new FormData();
    
    // Handle File objects (desktop) vs URIs (mobile)
    if (typeof fileOrUri === 'string') {
      // Mobile case - URI
      const filename = fileOrUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: fileOrUri,
        name: filename,
        type,
      } as any);
    } else {
      // Desktop case - File object
      formData.append('file', fileOrUri);
    }

    // Add upload preset
    formData.append('upload_preset', UPLOAD_PRESET);

    // Upload to Cloudinary
    // Important: do NOT manually set the Content-Type header for multipart/form-data
    // The fetch implementation will set the correct boundary for FormData.
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cloudinary upload error response:', data);
      throw new Error(data.error?.message || `Upload failed with status ${response.status}`);
    }

    if (!data.secure_url) {
      console.error('Cloudinary response missing secure_url:', data);
      throw new Error('Upload response missing secure_url');
    }

    console.log('Successfully uploaded to Cloudinary:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}