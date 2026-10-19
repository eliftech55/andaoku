import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./client";

/**
 * Dosya Yükleme Servisi
 * İzin verilen dosya boyutunu ve türünü doğrular.
 */
export async function uploadPublicFile(
  path: string,
  file: File,
  allowedTypes: string[] = ["image/jpeg", "image/png", "image/webp"],
  maxSizeBytes: number = 5 * 1024 * 1024 // 5 MB
): Promise<{ url: string | null; error: string | null }> {
  try {
    if (!allowedTypes.includes(file.type)) {
      return { url: null, error: `Desteklenmeyen dosya türü: ${file.type}. Lütfen JPEG, PNG veya WebP yükleyin.` };
    }

    if (file.size > maxSizeBytes) {
      return { url: null, error: `Dosya boyutu çok yüksek. Maksimum ${Math.round(maxSizeBytes / (1024 * 1024))} MB yükleyebilirsiniz.` };
    }

    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    return { url, error: null };
  } catch (error: any) {
    console.error("Depolama yükleme hatası:", error);
    return { url: null, error: error.message || "Dosya yüklenirken bir sorun oluştu." };
  }
}
