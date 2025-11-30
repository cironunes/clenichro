"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, Trash2, Upload, Search, X } from "lucide-react";
import { useMachine } from "@xstate/react";
import { useId, useMemo } from "react";
import { createImageGalleryMachine } from "./image-gallery.state";
import { ImageGalleryProvider, useImageGallery } from "./image-gallery.context";
import {
  ImageGallery,
  type ImageGalleryLayout,
  type ImageItem,
} from "./image-gallery";
import {
  createImagesFromFiles,
  searchUnsplashPhotos,
  convertUnsplashPhotoToImageItem,
  type UnsplashPhoto,
} from "./image-gallery.utils";

type ImageGalleryBuilderProps = {
  images: ImageItem[];
  layout: ImageGalleryLayout;
  title?: string;
  onImagesChange: (images: ImageItem[]) => void;
  onLayoutChange: (layout: ImageGalleryLayout) => void;
  onTitleChange?: (title: string) => void;
  onRemove?: () => void;
};

export function ImageGalleryBuilder({
  images: initialImages,
  layout,
  title,
  onImagesChange,
  onLayoutChange,
  onTitleChange,
  onRemove,
}: ImageGalleryBuilderProps) {
  const uniqueId = useId();
  const machine = useMemo(
    () => createImageGalleryMachine(uniqueId),
    [uniqueId]
  );
  const [state, send] = useMachine(machine);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingCaption, setEditingCaption] = useState<{
    imageId: string | number;
  } | null>(null);
  const [captionValue, setCaptionValue] = useState("");
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [showUnsplashSearch, setShowUnsplashSearch] = useState(false);
  const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(
    new Set()
  );
  const [uploadedPreviews, setUploadedPreviews] = useState<ImageItem[]>([]);
  const [selectedUploadIds, setSelectedUploadIds] = useState<
    Set<string | number>
  >(new Set());
  const [showUploadPreview, setShowUploadPreview] = useState(false);

  useEffect(() => {
    send({ type: "SET_IMAGES", images: initialImages });
  }, [initialImages, send]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      send({ type: "UPLOAD_IMAGES_START" });
      const newImages = await createImagesFromFiles(files);
      setUploadedPreviews(newImages);
      setSelectedUploadIds(new Set(newImages.map((img) => img.id)));
      setShowUploadPreview(true);
      send({ type: "UPLOAD_IMAGES_SUCCESS" });
    } catch (error) {
      send({
        type: "UPLOAD_IMAGES_ERROR",
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  };

  const handleToggleUploadSelection = (imageId: string | number) => {
    setSelectedUploadIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  };

  const handleConfirmUpload = () => {
    const imagesToAdd = uploadedPreviews.filter((img) =>
      selectedUploadIds.has(img.id)
    );
    if (imagesToAdd.length > 0) {
      const newImages = [...initialImages, ...imagesToAdd];
      onImagesChange(newImages);
      setSelectedUploadIds(new Set());
      setUploadedPreviews([]);
      setShowUploadPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUnsplashSearch = async () => {
    if (!unsplashQuery.trim()) {
      return;
    }

    try {
      send({ type: "LOAD_UNSPLASH_START" });
      const photos = await searchUnsplashPhotos(unsplashQuery, 20);
      setUnsplashResults(photos);
      setSelectedImageIds(new Set());
      send({ type: "LOAD_UNSPLASH_SUCCESS" });
    } catch (error) {
      send({
        type: "LOAD_UNSPLASH_ERROR",
        error: error instanceof Error ? error.message : "Failed to load images",
      });
      setUnsplashResults([]);
    }
  };

  const handleToggleImageSelection = (photoId: string) => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const handleAddSelectedImages = () => {
    const selectedPhotos = unsplashResults.filter((photo) =>
      selectedImageIds.has(photo.id)
    );
    const newImageItems = selectedPhotos.map(convertUnsplashPhotoToImageItem);
    if (newImageItems.length > 0) {
      const newImages = [...initialImages, ...newImageItems];
      onImagesChange(newImages);
      setSelectedImageIds(new Set());
      setUnsplashResults([]);
      setUnsplashQuery("");
      setShowUnsplashSearch(false);
    }
  };

  const handleRemoveImage = (imageId: string | number) => {
    const newImages = initialImages.filter((img) => img.id !== imageId);
    onImagesChange(newImages);
  };

  const handleStartEditCaption = (
    imageId: string | number,
    currentCaption: string | undefined
  ) => {
    setEditingCaption({ imageId });
    setCaptionValue(currentCaption || "");
  };

  const handleSaveCaption = () => {
    if (editingCaption) {
      const newImages = initialImages.map((img) =>
        img.id === editingCaption.imageId
          ? { ...img, caption: captionValue || undefined }
          : img
      );
      onImagesChange(newImages);
      setEditingCaption(null);
      setCaptionValue("");
    }
  };

  const handleCancelEditCaption = () => {
    setEditingCaption(null);
    setCaptionValue("");
  };

  return (
    <ImageGalleryProvider state={state} send={send}>
      <Card className="border-2" data-testid="widget-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {title || "Image Gallery"}
            </CardTitle>
            {onRemove && (
              <Button
                variant="destructive"
                size="icon"
                onClick={onRemove}
                aria-label="Remove widget"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium">Layout:</span>
              <select
                value={layout}
                onChange={(e) =>
                  onLayoutChange(e.target.value as ImageGalleryLayout)
                }
                className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                aria-label="Layout"
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
                <option value="card">Card</option>
              </select>
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={state.context.uploading}
              className="gap-2"
            >
              <Upload className="size-3" />
              {state.context.uploading ? "Uploading..." : "Upload Images"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnsplashSearch(!showUnsplashSearch)}
              disabled={state.context.loadingFromUnsplash}
              className="gap-2"
            >
              <Search className="size-3" />
              {state.context.loadingFromUnsplash
                ? "Loading..."
                : "Load from Unsplash"}
            </Button>
          </div>

          {state.context.error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              {state.context.error}
              <button
                onClick={() => send({ type: "CLEAR_ERROR" })}
                className="ml-2 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {showUploadPreview && uploadedPreviews.length > 0 && (
            <div
              className="border rounded-lg p-4 bg-background"
              data-testid="upload-preview"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {selectedUploadIds.size > 0
                    ? `${selectedUploadIds.size} image${
                        selectedUploadIds.size > 1 ? "s" : ""
                      } selected`
                    : "Select images to add"}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedUploadIds(new Set())}
                    disabled={selectedUploadIds.size === 0}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowUploadPreview(false);
                      setUploadedPreviews([]);
                      setSelectedUploadIds(new Set());
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirmUpload}
                    disabled={selectedUploadIds.size === 0}
                  >
                    Add Selected ({selectedUploadIds.size})
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto">
                {uploadedPreviews.map((image) => {
                  const isSelected = selectedUploadIds.has(image.id);
                  return (
                    <div
                      key={image.id}
                      className="relative group cursor-pointer"
                      onClick={() => handleToggleUploadSelection(image.id)}
                    >
                      <div
                        className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                          isSelected
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Image
                          src={image.src}
                          alt={image.alt}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                          unoptimized={image.src.startsWith("data:")}
                        />
                        <div
                          className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                            isSelected
                              ? "bg-primary/20 opacity-100"
                              : "bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/40"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? "bg-primary border-primary"
                                : "bg-background/80 border-background"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-4 h-4 text-primary-foreground"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {showUnsplashSearch && (
            <div className="space-y-4">
              <div className="flex gap-2 p-4 bg-muted rounded-md">
                <input
                  type="text"
                  placeholder="Search Unsplash..."
                  value={unsplashQuery}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnsplashSearch();
                    }
                  }}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleUnsplashSearch}
                  disabled={
                    !unsplashQuery.trim() || state.context.loadingFromUnsplash
                  }
                >
                  Search
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowUnsplashSearch(false);
                    setUnsplashQuery("");
                    setUnsplashResults([]);
                    setSelectedImageIds(new Set());
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>

              {state.context.loadingFromUnsplash && (
                <div className="p-8 text-center text-muted-foreground">
                  Loading images...
                </div>
              )}

              {unsplashResults.length > 0 && (
                <div className="border rounded-lg p-4 bg-background">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      {selectedImageIds.size > 0
                        ? `${selectedImageIds.size} image${
                            selectedImageIds.size > 1 ? "s" : ""
                          } selected`
                        : "Select images to add"}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedImageIds(new Set())}
                        disabled={selectedImageIds.size === 0}
                      >
                        Clear Selection
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddSelectedImages}
                        disabled={selectedImageIds.size === 0}
                      >
                        Add Selected ({selectedImageIds.size})
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto">
                    {unsplashResults.map((photo) => {
                      const isSelected = selectedImageIds.has(photo.id);
                      return (
                        <div
                          key={photo.id}
                          className="relative group cursor-pointer"
                          onClick={() => handleToggleImageSelection(photo.id)}
                        >
                          <div
                            className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                              isSelected
                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <Image
                              src={photo.urls.thumb}
                              alt={
                                photo.alt_description ||
                                photo.description ||
                                "Unsplash photo"
                              }
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                              unoptimized={false}
                            />
                            <div
                              className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                                isSelected
                                  ? "bg-primary/20 opacity-100"
                                  : "bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/40"
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                  isSelected
                                    ? "bg-primary border-primary"
                                    : "bg-background/80 border-background"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-4 h-4 text-primary-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <ImageGallery images={initialImages} layout={layout} />
            {initialImages.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {initialImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative group"
                    data-testid="image-thumbnail"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded border"
                      unoptimized={image.src.startsWith("data:")}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                      <button
                        onClick={() =>
                          handleStartEditCaption(image.id, image.caption)
                        }
                        className="bg-primary text-primary-foreground rounded p-1"
                        aria-label="Edit caption"
                      >
                        <Edit2 className="size-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveImage(image.id)}
                        className="bg-destructive text-white rounded p-1"
                        aria-label="Remove image"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                    {editingCaption?.imageId === image.id && (
                      <div className="absolute top-full left-0 mt-2 p-2 bg-background border rounded shadow-lg z-10 min-w-[200px]">
                        <input
                          type="text"
                          value={captionValue}
                          onChange={(e) => setCaptionValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveCaption();
                            } else if (e.key === "Escape") {
                              handleCancelEditCaption();
                            }
                          }}
                          placeholder="Enter caption..."
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm mb-2"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveCaption}
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEditCaption}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </ImageGalleryProvider>
  );
}
