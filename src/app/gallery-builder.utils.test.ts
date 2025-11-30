import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createImageFromFile,
  createImagesFromFiles,
  searchUnsplashPhotos,
  convertUnsplashPhotoToImageItem,
  type UnsplashPhoto,
} from "./gallery-builder.utils";

describe("gallery-builder.utils", () => {
  describe("createImageFromFile", () => {
    it("should create an ImageItem from a file", async () => {
      const file = new File(["test content"], "test-image.png", {
        type: "image/png",
      });

      const result = await createImageFromFile(file);

      expect(result).toMatchObject({
        alt: "test-image.png",
        caption: "test-image",
      });
      expect(result.src).toMatch(/^data:image\/png;base64,/);
      expect(result.id).toMatch(/^upload-/);
    });

    it("should reject on file read error", async () => {
      const file = new File(["test"], "test.png", { type: "image/png" });

      class MockFileReader {
        readAsDataURL() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror({} as ProgressEvent);
            }
          }, 0);
        }
        onerror: ((event: ProgressEvent) => void) | null = null;
        onload: ((event: ProgressEvent) => void) | null = null;
        result: string | null = null;
      }

      const OriginalFileReader = global.FileReader;
      global.FileReader = MockFileReader as any;

      try {
        const promise = createImageFromFile(file);
        await expect(promise).rejects.toThrow("Failed to read file");
      } finally {
        global.FileReader = OriginalFileReader;
      }
    });
  });

  describe("createImagesFromFiles", () => {
    it("should create multiple ImageItems from FileList", async () => {
      const file1 = new File(["content1"], "image1.png", {
        type: "image/png",
      });
      const file2 = new File(["content2"], "image2.jpg", {
        type: "image/jpeg",
      });

      const fileList = {
        0: file1,
        1: file2,
        length: 2,
        item: (index: number) => (index === 0 ? file1 : file2),
        [Symbol.iterator]: function* () {
          yield file1;
          yield file2;
        },
      } as FileList;

      const results = await createImagesFromFiles(fileList);

      expect(results).toHaveLength(2);
      expect(results[0].alt).toBe("image1.png");
      expect(results[1].alt).toBe("image2.jpg");
    });
  });

  describe("convertUnsplashPhotoToImageItem", () => {
    it("should convert UnsplashPhoto to ImageItem", () => {
      const photo: UnsplashPhoto = {
        id: "test-id",
        urls: {
          regular: "https://example.com/regular.jpg",
          small: "https://example.com/small.jpg",
          thumb: "https://example.com/thumb.jpg",
        },
        alt_description: "Test alt description",
        description: "Test description",
        user: {
          name: "Test User",
        },
      };

      const result = convertUnsplashPhotoToImageItem(photo);

      expect(result).toEqual({
        id: "test-id",
        src: "https://example.com/regular.jpg",
        alt: "Test alt description",
        caption: "Test description",
      });
    });

    it("should use description as alt when alt_description is null", () => {
      const photo: UnsplashPhoto = {
        id: "test-id",
        urls: {
          regular: "https://example.com/regular.jpg",
          small: "https://example.com/small.jpg",
          thumb: "https://example.com/thumb.jpg",
        },
        alt_description: null,
        description: "Test description",
        user: {
          name: "Test User",
        },
      };

      const result = convertUnsplashPhotoToImageItem(photo);

      expect(result.alt).toBe("Test description");
    });

    it("should use fallback alt when both are null", () => {
      const photo: UnsplashPhoto = {
        id: "test-id",
        urls: {
          regular: "https://example.com/regular.jpg",
          small: "https://example.com/small.jpg",
          thumb: "https://example.com/thumb.jpg",
        },
        alt_description: null,
        description: null,
        user: {
          name: "Test User",
        },
      };

      const result = convertUnsplashPhotoToImageItem(photo);

      expect(result.alt).toBe("Unsplash photo");
    });
  });

  describe("searchUnsplashPhotos", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY = "test-key";
    });

    it("should fetch photos from Unsplash API", async () => {
      const mockPhotos: UnsplashPhoto[] = [
        {
          id: "1",
          urls: {
            regular: "https://example.com/1.jpg",
            small: "https://example.com/1-small.jpg",
            thumb: "https://example.com/1-thumb.jpg",
          },
          alt_description: "Photo 1",
          description: "Description 1",
          user: { name: "User 1" },
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: mockPhotos }),
      });

      const result = await searchUnsplashPhotos("nature", 20);

      expect(result).toEqual(mockPhotos);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("query=nature"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Client-ID test-key",
          }),
        })
      );
    });

    it("should throw error when API key is missing", async () => {
      delete process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
      delete process.env.UNSPLASH_ACCESS_KEY;

      await expect(searchUnsplashPhotos("nature")).rejects.toThrow(
        "Unsplash API key not found"
      );
    });

    it("should throw error when API request fails", async () => {
      process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY = "test-key";

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Unauthorized",
      });

      await expect(searchUnsplashPhotos("nature")).rejects.toThrow(
        "Unsplash API error: Unauthorized"
      );
    });
  });
});
