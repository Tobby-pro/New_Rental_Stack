// firebaseStorage.ts
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firebaseStorage } from "../../lib/firebaseConfig";  // Import the firebaseStorage from firebaseConfig

// Upload media function
export const uploadMedia = async (file: File): Promise<string> => {
  try {
    const fileRef = ref(firebaseStorage, `uploads/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
