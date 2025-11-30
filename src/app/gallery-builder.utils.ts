import type { ImageItem } from "@/components/image-gallery";

export const createImageFromFile = (file: File): Promise<ImageItem> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        resolve({
          id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          src: result,
          alt: file.name,
          caption: file.name.replace(/\.[^/.]+$/, ""),
        });
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const createImagesFromFiles = async (
  files: FileList
): Promise<ImageItem[]> => {
  const fileArray = Array.from(files);
  return Promise.all(fileArray.map(createImageFromFile));
};

export type UnsplashPhoto = {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
  };
};

const getUnsplashApiKey = (): string => {
  const apiKey =
    process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ||
    process.env.UNSPLASH_ACCESS_KEY;
  if (!apiKey) {
    throw new Error(
      "Unsplash API key not found. Please set NEXT_PUBLIC_UNSPLASH_ACCESS_KEY or UNSPLASH_ACCESS_KEY in your .env file."
    );
  }
  return apiKey;
};

export const searchUnsplashPhotos = async (
  query: string,
  perPage: number = 20
): Promise<UnsplashPhoto[]> => {
  const apiKey = getUnsplashApiKey();
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Client-ID ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
};

export const searchUnsplash = async (
  query: string,
  perPage: number = 10
): Promise<ImageItem[]> => {
  const photos = await searchUnsplashPhotos(query, perPage);
  return photos.map((photo) => ({
    id: photo.id,
    src: photo.urls.regular,
    alt: photo.alt_description || photo.description || "Unsplash photo",
    caption: photo.description || photo.alt_description || undefined,
  }));
};

export const convertUnsplashPhotoToImageItem = (
  photo: UnsplashPhoto
): ImageItem => {
  return {
    id: photo.id,
    src: photo.urls.regular,
    alt: photo.alt_description || photo.description || "Unsplash photo",
    caption: photo.description || photo.alt_description || undefined,
  };
};
