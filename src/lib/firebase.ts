// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { get } from "http";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCT0hejkved-A_tpTD49xqODTMKlBuHFB4",
  authDomain: "college-app-2bb3d.firebaseapp.com",
  databaseURL: "https://college-app-2bb3d-default-rtdb.firebaseio.com",
  projectId: "college-app-2bb3d",
  storageBucket: "college-app-2bb3d.appspot.com",
  messagingSenderId: "737141174968",
  appId: "1:737141174968:web:c60671baf0ebf6495f3a4d",
  measurementId: "G-0Z55QZ08YJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const storage = getStorage(app);

export async function uploadFile(
  file: File,
  setProgress?: (progress: number) => void,
) {
  return new Promise((resolve, reject) => {
    try {
      const storageRef = ref(storage, file.name);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          );
          if (setProgress) {
            setProgress(progress);
          }
          switch (snapshot.state) {
            case "paused":
              console.log("Upload is paused");
              break;
            case "running":
              console.log("Upload is running");
              break;
          }
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadUrl) => {
            resolve(downloadUrl as String);
          });
        },
      );
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}
