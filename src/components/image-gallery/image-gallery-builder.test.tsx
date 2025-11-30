import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageGalleryBuilder } from "./image-gallery-builder";
import type { ImageItem } from "./image-gallery";
import * as imageGalleryUtils from "./image-gallery.utils";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

const mockImages: ImageItem[] = [
  {
    id: "1",
    src: "https://example.com/image1.jpg",
    alt: "Test Image 1",
  },
];

const mockUnsplashPhoto = {
  id: "photo-1",
  urls: {
    regular: "https://example.com/regular.jpg",
    small: "https://example.com/small.jpg",
    thumb: "https://example.com/thumb.jpg",
  },
  alt_description: "Test photo",
  description: "Test description",
  user: {
    name: "Test User",
  },
};

describe("ImageGalleryBuilder", () => {
  const mockOnImagesChange = vi.fn();
  const mockOnLayoutChange = vi.fn();
  const mockOnTitleChange = vi.fn();
  const mockOnRemove = vi.fn();
  const mockOnModeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render in preview mode", () => {
    render(
      <ImageGalleryBuilder
        images={mockImages}
        layout="horizontal"
        mode="preview"
        onImagesChange={mockOnImagesChange}
        onLayoutChange={mockOnLayoutChange}
      />
    );

    expect(screen.getByText("Image Gallery")).toBeInTheDocument();
  });

  it("should render in edit mode", () => {
    render(
      <ImageGalleryBuilder
        images={mockImages}
        layout="horizontal"
        mode="edit"
        onImagesChange={mockOnImagesChange}
        onLayoutChange={mockOnLayoutChange}
        onRemove={mockOnRemove}
        onModeChange={mockOnModeChange}
      />
    );

    expect(screen.getByText("Upload Images")).toBeInTheDocument();
    expect(screen.getByText("Load from Unsplash")).toBeInTheDocument();
  });

  it("should toggle Unsplash search", async () => {
    const user = userEvent.setup();
    render(
      <ImageGalleryBuilder
        images={mockImages}
        layout="horizontal"
        mode="edit"
        onImagesChange={mockOnImagesChange}
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const unsplashButton = screen.getByText("Load from Unsplash");
    await user.click(unsplashButton);

    expect(
      screen.getByPlaceholderText("Search Unsplash...")
    ).toBeInTheDocument();
  });

  it("should handle Unsplash search", async () => {
    const user = userEvent.setup();
    vi.spyOn(imageGalleryUtils, "searchUnsplashPhotos").mockResolvedValue([
      mockUnsplashPhoto,
    ]);

    render(
      <ImageGalleryBuilder
        images={mockImages}
        layout="horizontal"
        mode="edit"
        onImagesChange={mockOnImagesChange}
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const unsplashButton = screen.getByText("Load from Unsplash");
    await user.click(unsplashButton);

    const searchInput = screen.getByPlaceholderText("Search Unsplash...");
    await user.type(searchInput, "nature");

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(imageGalleryUtils.searchUnsplashPhotos).toHaveBeenCalledWith(
        "nature",
        20
      );
    });
  });

  it("should handle file upload", async () => {
    const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const mockFileList = {
      0: mockFile,
      length: 1,
      item: (index: number) => (index === 0 ? mockFile : null),
      [Symbol.iterator]: function* () {
        yield mockFile;
      },
    } as FileList;

    vi.spyOn(imageGalleryUtils, "createImagesFromFiles").mockResolvedValue([
      {
        id: "upload-1",
        src: "data:image/jpeg;base64,test",
        alt: "test.jpg",
      },
    ]);

    render(
      <ImageGalleryBuilder
        images={mockImages}
        layout="horizontal"
        mode="edit"
        onImagesChange={mockOnImagesChange}
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    Object.defineProperty(fileInput, "files", {
      value: mockFileList,
      writable: false,
      configurable: true,
    });

    fireEvent.change(fileInput, { target: { files: mockFileList } });

    await waitFor(() => {
      expect(imageGalleryUtils.createImagesFromFiles).toHaveBeenCalled();
    });
  });

  it("should handle image selection from Unsplash", async () => {
    const user = userEvent.setup();
    vi.spyOn(imageGalleryUtils, "searchUnsplashPhotos").mockResolvedValue([
      mockUnsplashPhoto,
    ]);

    render(
      <ImageGalleryBuilder
        images={mockImages}
        layout="horizontal"
        mode="edit"
        onImagesChange={mockOnImagesChange}
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const unsplashButton = screen.getByText("Load from Unsplash");
    await user.click(unsplashButton);

    const searchInput = screen.getByPlaceholderText("Search Unsplash...");
    await user.type(searchInput, "nature");

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByAltText("Test photo")).toBeInTheDocument();
    });

    const photo = screen.getByAltText("Test photo");
    await user.click(photo);

    await waitFor(() => {
      expect(screen.getByText(/1 image selected/)).toBeInTheDocument();
    });
  });

  it("should add selected images from Unsplash", async () => {
    const user = userEvent.setup();
    vi.spyOn(imageGalleryUtils, "searchUnsplashPhotos").mockResolvedValue([
      mockUnsplashPhoto,
    ]);

    render(
      <ImageGalleryBuilder
        images={mockImages}
        layout="horizontal"
        mode="edit"
        onImagesChange={mockOnImagesChange}
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const unsplashButton = screen.getByText("Load from Unsplash");
    await user.click(unsplashButton);

    const searchInput = screen.getByPlaceholderText("Search Unsplash...");
    await user.type(searchInput, "nature");

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByAltText("Test photo")).toBeInTheDocument();
    });

    const photo = screen.getByAltText("Test photo");
    await user.click(photo);

    const addButton = await screen.findByText(/Add Selected/);
    await user.click(addButton);

    await waitFor(() => {
      expect(mockOnImagesChange).toHaveBeenCalled();
    });
  });

  it("should handle layout change", async () => {
    const user = userEvent.setup();
    render(
      <ImageGalleryBuilder
        images={mockImages}
        layout="horizontal"
        mode="edit"
        onImagesChange={mockOnImagesChange}
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const layoutSelect = screen.getByLabelText("Layout");
    await user.selectOptions(layoutSelect, "vertical");

    expect(mockOnLayoutChange).toHaveBeenCalledWith("vertical");
  });

  it("should handle mode change from edit to preview", async () => {
    const user = userEvent.setup();
    render(
      <ImageGalleryBuilder
        images={mockImages}
        layout="horizontal"
        mode="edit"
        onImagesChange={mockOnImagesChange}
        onLayoutChange={mockOnLayoutChange}
        onModeChange={mockOnModeChange}
      />
    );

    const confirmButton = screen.getByLabelText("Confirm and exit edit mode");
    await user.click(confirmButton);

    expect(mockOnModeChange).toHaveBeenCalledWith("preview");
  });

  it("should handle remove widget", async () => {
    const user = userEvent.setup();
    render(
      <ImageGalleryBuilder
        images={mockImages}
        layout="horizontal"
        mode="edit"
        onImagesChange={mockOnImagesChange}
        onLayoutChange={mockOnLayoutChange}
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByLabelText("Remove widget");
    await user.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalled();
  });

  it("should display error message", async () => {
    const user = userEvent.setup();
    vi.spyOn(imageGalleryUtils, "searchUnsplashPhotos").mockRejectedValue(
      new Error("API Error")
    );

    render(
      <ImageGalleryBuilder
        images={mockImages}
        layout="horizontal"
        mode="edit"
        onImagesChange={mockOnImagesChange}
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const unsplashButton = screen.getByText("Load from Unsplash");
    await user.click(unsplashButton);

    const searchInput = screen.getByPlaceholderText("Search Unsplash...");
    await user.type(searchInput, "nature");

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load images/)).toBeInTheDocument();
    });
  });

  it("should clear error message", async () => {
    const user = userEvent.setup();
    vi.spyOn(imageGalleryUtils, "searchUnsplashPhotos").mockRejectedValue(
      new Error("API Error")
    );

    render(
      <ImageGalleryBuilder
        images={mockImages}
        layout="horizontal"
        mode="edit"
        onImagesChange={mockOnImagesChange}
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const unsplashButton = screen.getByText("Load from Unsplash");
    await user.click(unsplashButton);

    const searchInput = screen.getByPlaceholderText("Search Unsplash...");
    await user.type(searchInput, "nature");

    const searchButton = screen.getByText("Search");
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load images/)).toBeInTheDocument();
    });

    const dismissButton = screen.getByText("Dismiss");
    await user.click(dismissButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/Failed to load images/)
      ).not.toBeInTheDocument();
    });
  });
});
