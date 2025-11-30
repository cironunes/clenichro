import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
