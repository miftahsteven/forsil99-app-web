/**
 * Client-Side Proportional Image Compressor
 * 
 * Rules based on user requirements:
 * - 1 to 2 images: Standard High Quality (max 1600px, quality 0.90)
 * - > 2 images: Proportionally reduced quality & dimension (max 1080px, quality 0.65)
 */

export interface CompressOptions {
  imageCount?: number;
  maxDimension?: number;
  quality?: number;
}

export async function compressImage(
  fileOrDataUrl: File | string,
  options: CompressOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it is a video or non-image, return as-is or reject
    if (fileOrDataUrl instanceof File && fileOrDataUrl.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
      return;
    }

    const imageCount = options.imageCount ?? 1;

    // Rule:
    // If count <= 2: Standard high quality (1600px, quality 0.90)
    // If count > 2: Reduced quality & resolution (1080px, quality 0.65)
    let maxDim = options.maxDimension;
    let quality = options.quality;

    if (!maxDim) {
      maxDim = imageCount <= 2 ? 1600 : 1080;
    }

    if (!quality) {
      quality = imageCount <= 2 ? 0.90 : 0.65;
    }

    const img = new Image();

    const processLoadedImage = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        // Fallback if image has invalid dimensions
        if (fileOrDataUrl instanceof File) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileOrDataUrl);
        } else {
          resolve(fileOrDataUrl);
        }
        return;
      }

      // Proportional resizing maintaining aspect ratio
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (fileOrDataUrl instanceof File) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileOrDataUrl);
        } else {
          resolve(fileOrDataUrl);
        }
        return;
      }

      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw background white in case of transparent PNG converted to JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } catch (err) {
        reject(err);
      }
    };

    img.onload = processLoadedImage;
    img.onerror = () => {
      // If image loading fails, fallback to simple base64 read
      if (fileOrDataUrl instanceof File) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrDataUrl);
      } else {
        resolve(fileOrDataUrl);
      }
    };

    if (fileOrDataUrl instanceof File) {
      const objectUrl = URL.createObjectURL(fileOrDataUrl);
      img.src = objectUrl;
    } else {
      img.src = fileOrDataUrl;
    }
  });
}

export const MAX_POST_IMAGES = 5;
export const MAX_IMAGE_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * Process a batch of post image files, applying the adaptive compression rule
 * and enforcing community policies:
 * - Maximum 5 images per post
 * - Maximum 100 MB per file
 */
export async function processPostImageFiles(
  files: File[],
  existingCount: number = 0
): Promise<Array<{ type: 'image' | 'video'; url: string }>> {
  if (existingCount >= MAX_POST_IMAGES) {
    throw new Error('Batas maksimal 5 foto per postingan telah tercapai sesuai kebijakan Forsil 99.');
  }

  if (files.length + existingCount > MAX_POST_IMAGES) {
    const remaining = MAX_POST_IMAGES - existingCount;
    throw new Error(
      `Sesuai kebijakan Forsil 99, 1 postingan maksimal 5 foto. Anda hanya dapat menambahkan ${remaining} foto lagi.`
    );
  }

  for (const file of files) {
    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(
        `Foto "${file.name}" (${sizeMB} MB) melebihi batas kebijakan maksimal 100 MB per foto.`
      );
    }
  }

  const totalCount = files.length + existingCount;
  const results: Array<{ type: 'image' | 'video'; url: string }> = [];

  for (const file of files) {
    if (file.type.startsWith('video/')) {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      results.push({ type: 'video', url: base64 });
    } else {
      const compressedUrl = await compressImage(file, { imageCount: totalCount });
      results.push({ type: 'image', url: compressedUrl });
    }
  }

  return results;
}

