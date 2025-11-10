// Cloudinary configuration
const CLOUD_NAME = 'dgbcfpym4';  // Get this from your Cloudinary dashboard
const UPLOAD_PRESET = 'framez';  // Create an unsigned upload preset in Cloudinary

interface UploadResponse {
  secure_url: string;
  public_id: string;
}

export async function uploadToCloudinary(fileOrUri: string | File): Promise<string> {
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
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data: UploadResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.secure_url || 'Upload failed');
    }

    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}