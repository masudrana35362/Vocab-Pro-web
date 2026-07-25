import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";
import { v4 as uuidv4 } from "uuid";

// Note: Next.js edge runtime doesn't support the full uuid package well sometimes,
// but for standard client-side usage, a simple random string generator works too.
const generateId = () => Math.random().toString(36).substring(2, 15);

export const uploadImage = async (uid: string, file: File): Promise<string> => {
  try {
    const fileId = generateId();
    const extension = file.name.split(".").pop();
    const path = `users/${uid}/images/${fileId}.${extension}`;
    const storageRef = ref(storage, path);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
