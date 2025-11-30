"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useImageGallery } from "./image-gallery.context";
import type { ImageItem } from "./image-gallery";
import { cn } from "@/lib/utils";

type ImageGallerySlideshowProps = {
  images: ImageItem[];
};

export const ImageGallerySlideshow = ({
  images,
}: ImageGallerySlideshowProps) => {
  const { state, send } = useImageGallery();
  const containerRef = useRef<HTMLDivElement>(null);
  const isSlideshowActive =
    state.matches("slideshow") && state.context.slideshowIndex !== null;

  const currentIndex = state.context.slideshowIndex ?? 0;
  const currentImage = images[currentIndex];

  useEffect(() => {
    if (!isSlideshowActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        send({ type: "CLOSE_SLIDESHOW" });
      } else if (e.key === "ArrowLeft") {
        send({ type: "PREVIOUS_IMAGE" });
      } else if (e.key === "ArrowRight") {
        send({ type: "NEXT_IMAGE" });
      } else if (e.key === " ") {
        e.preventDefault();
        send({ type: "NEXT_IMAGE" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isSlideshowActive, send]);

  const handleClose = () => {
    send({ type: "CLOSE_SLIDESHOW" });
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    send({ type: "NEXT_IMAGE" });
  };

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    send({ type: "PREVIOUS_IMAGE" });
  };

  const handleImageClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const leftThird = width / 3;
    const rightThird = (width * 2) / 3;

    if (clickX < leftThird) {
      handlePrevious(e);
    } else if (clickX > rightThird) {
      handleNext(e);
    }
  };

  if (!isSlideshowActive || !currentImage) {
    return null;
  }

  const isDataUrl = (src: string) => src.startsWith("data:");

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={handleImageClick}
    >
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
          onClick={handleClose}
          aria-label="Close slideshow"
        >
          <X className="size-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 z-10 text-white hover:bg-white/20"
          onClick={handlePrevious}
          aria-label="Previous image"
        >
          <ChevronLeft className="size-8" />
        </Button>

        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <Image
            src={currentImage.src}
            alt={currentImage.alt}
            width={1920}
            height={1080}
            className="max-w-full max-h-[90vh] object-contain"
            unoptimized={isDataUrl(currentImage.src)}
            priority
          />
          {currentImage.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-4 text-center pointer-events-none">
              <p className="text-sm">{currentImage.caption}</p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 z-10 text-white hover:bg-white/20"
          onClick={handleNext}
          aria-label="Next image"
        >
          <ChevronRight className="size-8" />
        </Button>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-md text-sm pointer-events-none">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};
