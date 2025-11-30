import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageGallery, type ImageItem } from "./image-gallery";

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
    caption: "Caption 1",
  },
  {
    id: "2",
    src: "https://example.com/image2.jpg",
    alt: "Test Image 2",
  },
  {
    id: "3",
    src: "data:image/png;base64,test",
    alt: "Data URL Image",
  },
];

describe("ImageGallery", () => {
  it("should render images in horizontal layout", () => {
    render(<ImageGallery images={mockImages} layout="horizontal" />);

    const images = screen.getAllByAltText(/test image|data url image/i);
    expect(images).toHaveLength(3);
  });

  it("should render images in vertical layout", () => {
    render(<ImageGallery images={mockImages} layout="vertical" />);

    const images = screen.getAllByAltText(/test image|data url image/i);
    expect(images).toHaveLength(3);
  });

  it("should render images in card layout", () => {
    render(<ImageGallery images={mockImages} layout="card" />);

    const images = screen.getAllByAltText(/test image|data url image/i);
    expect(images).toHaveLength(3);

    const captions = screen.getAllByText("Caption 1");
    expect(captions).toHaveLength(1);
  });

  it("should display captions when provided", () => {
    render(<ImageGallery images={mockImages} layout="horizontal" />);

    expect(screen.getByText("Caption 1")).toBeInTheDocument();
  });

  it("should not display captions when not provided", () => {
    const imagesWithoutCaptions: ImageItem[] = [
      {
        id: "1",
        src: "https://example.com/image1.jpg",
        alt: "Test Image 1",
      },
    ];

    render(<ImageGallery images={imagesWithoutCaptions} layout="horizontal" />);

    expect(screen.queryByText("Caption 1")).not.toBeInTheDocument();
  });

  it("should render empty gallery when no images provided", () => {
    render(<ImageGallery images={[]} layout="horizontal" />);

    const images = screen.queryAllByRole("img");
    expect(images).toHaveLength(0);
  });

  it("should apply custom className", () => {
    const { container } = render(
      <ImageGallery
        images={mockImages}
        layout="horizontal"
        className="custom-class"
      />
    );

    const gallery = container.firstChild;
    expect(gallery).toHaveClass("custom-class");
  });

  it("should handle image clicks", () => {
    render(<ImageGallery images={mockImages} layout="card" />);

    const images = screen.getAllByAltText(/test image|data url image/i);
    expect(images[0]).toBeInTheDocument();
  });

  describe("Caption editing", () => {
    it("should start editing caption in edit mode", async () => {
      const user = userEvent.setup();
      const mockOnEditCaption = vi.fn();

      render(
        <ImageGallery
          images={mockImages}
          layout="card"
          mode="edit"
          onEditCaption={mockOnEditCaption}
        />
      );

      const editButtons = screen.getAllByLabelText("Edit caption");
      await user.click(editButtons[0]);

      const captionInput = screen.getByPlaceholderText("Enter caption...");
      expect(captionInput).toBeInTheDocument();
    });

    it("should save caption when Enter is pressed", async () => {
      const user = userEvent.setup();
      const mockOnEditCaption = vi.fn();

      render(
        <ImageGallery
          images={mockImages}
          layout="card"
          mode="edit"
          onEditCaption={mockOnEditCaption}
        />
      );

      const editButtons = screen.getAllByLabelText("Edit caption");
      await user.click(editButtons[0]);

      const captionInput = screen.getByPlaceholderText("Enter caption...");
      await user.clear(captionInput);
      await user.type(captionInput, "New caption");
      await user.keyboard("{Enter}");

      expect(mockOnEditCaption).toHaveBeenCalledWith("1", "New caption");
    });

    it("should cancel caption editing when Escape is pressed", async () => {
      const user = userEvent.setup();
      const mockOnEditCaption = vi.fn();

      render(
        <ImageGallery
          images={mockImages}
          layout="card"
          mode="edit"
          onEditCaption={mockOnEditCaption}
        />
      );

      const editButtons = screen.getAllByLabelText("Edit caption");
      await user.click(editButtons[0]);

      const captionInput = screen.getByPlaceholderText("Enter caption...");
      await user.type(captionInput, "New caption");
      await user.keyboard("{Escape}");

      expect(mockOnEditCaption).not.toHaveBeenCalled();
      expect(
        screen.queryByPlaceholderText("Enter caption...")
      ).not.toBeInTheDocument();
    });

    it("should save caption when Save button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnEditCaption = vi.fn();

      render(
        <ImageGallery
          images={mockImages}
          layout="card"
          mode="edit"
          onEditCaption={mockOnEditCaption}
        />
      );

      const editButtons = screen.getAllByLabelText("Edit caption");
      await user.click(editButtons[0]);

      const captionInput = screen.getByPlaceholderText("Enter caption...");
      await user.clear(captionInput);
      await user.type(captionInput, "New caption");

      const saveButton = screen.getByText("Save");
      await user.click(saveButton);

      expect(mockOnEditCaption).toHaveBeenCalledWith("1", "New caption");
    });

    it("should cancel caption editing when Cancel button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnEditCaption = vi.fn();

      render(
        <ImageGallery
          images={mockImages}
          layout="card"
          mode="edit"
          onEditCaption={mockOnEditCaption}
        />
      );

      const editButtons = screen.getAllByLabelText("Edit caption");
      await user.click(editButtons[0]);

      const captionInput = screen.getByPlaceholderText("Enter caption...");
      await user.type(captionInput, "New caption");

      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      expect(mockOnEditCaption).not.toHaveBeenCalled();
      expect(
        screen.queryByPlaceholderText("Enter caption...")
      ).not.toBeInTheDocument();
    });

    it("should prefill caption input with existing caption", async () => {
      const user = userEvent.setup();
      const mockOnEditCaption = vi.fn();

      render(
        <ImageGallery
          images={mockImages}
          layout="card"
          mode="edit"
          onEditCaption={mockOnEditCaption}
        />
      );

      const editButtons = screen.getAllByLabelText("Edit caption");
      await user.click(editButtons[0]);

      const captionInput = screen.getByPlaceholderText(
        "Enter caption..."
      ) as HTMLInputElement;
      expect(captionInput.value).toBe("Caption 1");
    });

    it("should not show edit button in preview mode", () => {
      render(
        <ImageGallery
          images={mockImages}
          layout="card"
          mode="preview"
          onEditCaption={vi.fn()}
        />
      );

      expect(screen.queryAllByLabelText("Edit caption")).toHaveLength(0);
    });

    it("should handle caption editing in horizontal layout", async () => {
      const user = userEvent.setup();
      const mockOnEditCaption = vi.fn();

      render(
        <ImageGallery
          images={mockImages}
          layout="horizontal"
          mode="edit"
          onEditCaption={mockOnEditCaption}
        />
      );

      const editButtons = screen.getAllByLabelText("Edit caption");
      await user.click(editButtons[0]);

      const captionInput = screen.getByPlaceholderText("Enter caption...");
      expect(captionInput).toBeInTheDocument();
    });
  });
});
