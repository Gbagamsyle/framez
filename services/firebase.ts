import { addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToCloudinary } from './cloudinary';


export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  text: string;
  imageUrl?: string;
  timestamp: Date;
  comments?: {
    id?: string;
    authorId?: string;
    authorName?: string;
    text?: string;
    timestamp?: Date;
    }[];
}

// Use Cloudinary for image uploads
export const uploadImageAsync = uploadToCloudinary;

export async function createPost(authorId: string, authorName: string, text: string, imageSource?: string | File, authorPhotoUrl?: string) {
  let imageUrl: string | undefined;

  if (imageSource) {
    try {
      imageUrl = await uploadImageAsync(imageSource);
    } catch (err) {
      console.error('Failed to upload post image', err);
    }
  }

  // Build post object, excluding undefined values (Firebase doesn't allow undefined)
  const post: any = {
    authorId,
    authorName,
    text,
    timestamp: serverTimestamp(),
  };

  // Only include optional fields if they have values
  if (imageUrl) {
    post.imageUrl = imageUrl;
  }
  if (authorPhotoUrl) {
    post.authorPhotoUrl = authorPhotoUrl;
  }

  await addDoc(collection(db, 'posts'), post);
}

function toDate(ts: any) {
  if (!ts) return new Date();
  if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate();
  // If it's already a JS Date
  if (ts instanceof Date) return ts;
  // Fallback: try to construct
  return new Date(ts);
}

export async function getPosts() {
  const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      authorId: data.authorId,
      authorName: data.authorName,
      authorPhotoUrl: data.authorPhotoUrl,
      text: data.text,
      imageUrl: data.imageUrl,
      timestamp: toDate(data.timestamp),
      comments: (data.comments || []).map((c: any) => ({
        ...c,
        timestamp: toDate(c.timestamp),
      })),
    } as Post;
  });
}

export function listenToPosts(onChange: (posts: Post[]) => void) {
  const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
  const unsubscribe = onSnapshot(q, (querySnapshot: any) => {
    const posts = querySnapshot.docs.map((d: any) => {
      const data = d.data() as any;
      return {
        id: d.id,
        authorId: data.authorId,
        authorName: data.authorName,
        authorPhotoUrl: data.authorPhotoUrl,
        text: data.text,
        imageUrl: data.imageUrl,
        timestamp: toDate(data.timestamp),
        comments: (data.comments || []).map((c: any) => ({
          ...c,
          timestamp: toDate(c.timestamp),
        })),
      } as Post;
    });
    onChange(posts);
  }, (error) => {
    console.error('listenToPosts onSnapshot error', error);
  });

  return unsubscribe;
}

export async function getUserPosts(userId: string) {
  const q = query(collection(db, 'posts'), where('authorId', '==', userId));
  const querySnapshot = await getDocs(q);

  const posts = querySnapshot.docs.map(doc => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      authorId: data.authorId,
      authorName: data.authorName,
      authorPhotoUrl: data.authorPhotoUrl,
      text: data.text,
      imageUrl: data.imageUrl,
      timestamp: toDate(data.timestamp),
      comments: (data.comments || []).map((c: any) => ({
        ...c,
        timestamp: toDate(c.timestamp),
      })),
    } as Post;
  });

  posts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return posts;
}

export function listenToUserPosts(userId: string, onChange: (posts: Post[]) => void) {
  if (!userId) {
    console.error('listenToUserPosts called without userId');
    onChange([]);
    return () => {};
  }

  // NOTE: This query originally included an orderBy('timestamp', 'desc') which
  // requires a composite index in Firestore (authorId + timestamp). When the
  // index is missing Firestore throws an error with a console link to create it.
  //
  // Recommended: create the composite index using the link in the error message
  // so server-side ordering/pagination works efficiently. As a temporary
  // workaround we remove the orderBy and sort results client-side here to
  // avoid the index requirement.
  const q = query(collection(db, 'posts'), where('authorId', '==', userId));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    try {
      const posts = querySnapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          authorId: data.authorId,
          authorName: data.authorName,
          authorPhotoUrl: data.authorPhotoUrl,
          text: data.text,
          imageUrl: data.imageUrl,
          timestamp: toDate(data.timestamp),
          comments: (data.comments || []).map((c: any) => ({
            ...c,
            timestamp: toDate(c.timestamp),
          })),
        } as Post;
      });

      // Client-side sort by timestamp descending to mimic the previous behavior
      posts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      onChange(posts);
    } catch (error) {
      console.error('Error processing user posts snapshot:', error);
      onChange([]);
    }
  }, (error) => {
    console.error('listenToUserPosts onSnapshot error:', error);
    onChange([]);
  });

  return unsubscribe;
}

export async function deletePost(postId: string) {
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
  } catch (err) {
    console.error('Failed to delete post', err);
    throw err;
  }
}

export async function addComment(postId: string, authorId: string, authorName: string, text: string) {
  try {
    const postRef = doc(db, 'posts', postId);
    const comment = {
      id: `${Date.now()}`,
      authorId,
      authorName,
      text,
      timestamp: new Date(), // Use client-side timestamp instead of serverTimestamp()
    } as any;
    // Use arrayUnion to append the comment object
    await updateDoc(postRef, {
      comments: arrayUnion(comment),
    });
    return comment;
  } catch (err) {
    console.error('Failed to add comment', err);
    throw err;
  }
}

// User profile doc helpers (optional user metadata like bio)
export async function getUserDoc(userId: string) {
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data();
  } catch (err) {
    console.error('getUserDoc failed', err);
    return null;
  }
}

export async function updateUserDoc(userId: string, data: Record<string, any>) {
  try {
    const docRef = doc(db, 'users', userId);
    // merge with existing
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    console.error('updateUserDoc failed', err);
    throw err;
  }
}