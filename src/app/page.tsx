"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  ImageGallery,
  type ImageGalleryLayout,
  type ImageItem,
} from "@/components/image-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Upload, Search, X } from "lucide-react";
import {
  GalleryBuilderProvider,
  useGalleryBuilder,
} from "./gallery-builder.context";
import {
  createImagesFromFiles,
  searchUnsplashPhotos,
  convertUnsplashPhotoToImageItem,
  type UnsplashPhoto,
} from "./gallery-builder.utils";

function GalleryBuilderContent() {
  const { state, send } = useGalleryBuilder();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingCaption, setEditingCaption] = useState<{
    galleryId: string;
    imageId: string | number;
  } | null>(null);
  const [captionValue, setCaptionValue] = useState("");
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [showUnsplashSearch, setShowUnsplashSearch] = useState<string | null>(
    null
  );
  const [unsplashResults, setUnsplashResults] = useState<
    Record<string, UnsplashPhoto[]>
  >({});
  const [selectedImageIds, setSelectedImageIds] = useState<
    Record<string, Set<string>>
  >({});
  const [uploadedPreviews, setUploadedPreviews] = useState<
    Record<string, ImageItem[]>
  >({});
  const [selectedUploadIds, setSelectedUploadIds] = useState<
    Record<string, Set<string | number>>
  >({});
  const [showUploadPreview, setShowUploadPreview] = useState<string | null>(
    null
  );

  const galleries = state.context.galleries;

  const handleAddGallery = () => {
    send({ type: "ADD_GALLERY" });
  };

  const handleRemoveGallery = (galleryId: string) => {
    send({ type: "REMOVE_GALLERY", galleryId });
  };

  const handleUpdateGallery = (
    galleryId: string,
    updates: Partial<{ layout: ImageGalleryLayout; title: string }>
  ) => {
    send({ type: "UPDATE_GALLERY", galleryId, updates });
  };

  const handleFileUpload = async (
    galleryId: string,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;

    try {
      send({ type: "UPLOAD_IMAGES_START" });
      const images = await createImagesFromFiles(files);
      setUploadedPreviews((prev) => ({ ...prev, [galleryId]: images }));
      setSelectedUploadIds((prev) => ({
        ...prev,
        [galleryId]: new Set(images.map((img) => img.id)),
      }));
      setShowUploadPreview(galleryId);
      send({ type: "UPLOAD_IMAGES_SUCCESS", images });
    } catch (error) {
      send({
        type: "UPLOAD_IMAGES_ERROR",
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  };

  const handleToggleUploadSelection = (
    galleryId: string,
    imageId: string | number
  ) => {
    setSelectedUploadIds((prev) => {
      const current = prev[galleryId] || new Set();
      const next = new Set(current);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return { ...prev, [galleryId]: next };
    });
  };

  const handleConfirmUpload = (galleryId: string) => {
    const previews = uploadedPreviews[galleryId] || [];
    const selected = selectedUploadIds[galleryId] || new Set();
    const imagesToAdd = previews.filter((img) => selected.has(img.id));
    if (imagesToAdd.length > 0) {
      send({ type: "ADD_IMAGES", galleryId, images: imagesToAdd });
      setSelectedUploadIds((prev) => {
        const next = { ...prev };
        delete next[galleryId];
        return next;
      });
      setUploadedPreviews((prev) => {
        const next = { ...prev };
        delete next[galleryId];
        return next;
      });
      setShowUploadPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUnsplashSearch = async (galleryId: string) => {
    if (!unsplashQuery.trim()) {
      return;
    }

    try {
      send({ type: "LOAD_UNSPLASH_START" });
      const photos = await searchUnsplashPhotos(unsplashQuery, 20);
      setUnsplashResults((prev) => ({ ...prev, [galleryId]: photos }));
      setSelectedImageIds((prev) => ({ ...prev, [galleryId]: new Set() }));
      send({ type: "LOAD_UNSPLASH_SUCCESS", images: [] });
    } catch (error) {
      send({
        type: "LOAD_UNSPLASH_ERROR",
        error: error instanceof Error ? error.message : "Failed to load images",
      });
      setUnsplashResults((prev) => ({ ...prev, [galleryId]: [] }));
    }
  };

  const handleToggleImageSelection = (galleryId: string, photoId: string) => {
    setSelectedImageIds((prev) => {
      const current = prev[galleryId] || new Set();
      const next = new Set(current);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return { ...prev, [galleryId]: next };
    });
  };

  const handleAddSelectedImages = (galleryId: string) => {
    const results = unsplashResults[galleryId] || [];
    const selected = selectedImageIds[galleryId] || new Set();
    const selectedPhotos = results.filter((photo) => selected.has(photo.id));
    const images = selectedPhotos.map(convertUnsplashPhotoToImageItem);
    if (images.length > 0) {
      send({ type: "ADD_IMAGES", galleryId, images });
      setSelectedImageIds((prev) => ({ ...prev, [galleryId]: new Set() }));
      setUnsplashResults((prev) => {
        const next = { ...prev };
        delete next[galleryId];
        return next;
      });
      setUnsplashQuery("");
      setShowUnsplashSearch(null);
    }
  };

  const handleRemoveImage = (galleryId: string, imageId: string | number) => {
    send({ type: "REMOVE_IMAGE", galleryId, imageId });
  };

  const handleStartEditCaption = (
    galleryId: string,
    imageId: string | number,
    currentCaption: string | undefined
  ) => {
    setEditingCaption({ galleryId, imageId });
    setCaptionValue(currentCaption || "");
  };

  const handleSaveCaption = () => {
    if (editingCaption) {
      send({
        type: "UPDATE_IMAGE",
        galleryId: editingCaption.galleryId,
        imageId: editingCaption.imageId,
        updates: { caption: captionValue || undefined },
      });
      setEditingCaption(null);
      setCaptionValue("");
    }
  };

  const handleCancelEditCaption = () => {
    setEditingCaption(null);
    setCaptionValue("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-6xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full space-y-12">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Image Gallery Builder</h1>
            <Button onClick={handleAddGallery} className="gap-2">
              <Plus className="size-4" />
              Add Gallery
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

          {galleries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg text-muted-foreground mb-4">
                No galleries yet. Click &quot;Add Gallery&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {galleries.map((gallery) => (
                <Card
                  key={gallery.id}
                  className="w-full"
                  data-testid="gallery-card"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        {gallery.title || "Untitled Gallery"}
                      </CardTitle>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveGallery(gallery.id)}
                        aria-label="Delete gallery"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <label className="flex items-center gap-2">
                        <span className="text-sm font-medium">Layout:</span>
                        <select
                          value={gallery.layout}
                          onChange={(e) =>
                            handleUpdateGallery(gallery.id, {
                              layout: e.target.value as ImageGalleryLayout,
                            })
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
                        {state.context.uploading
                          ? "Uploading..."
                          : "Upload Images"}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          handleFileUpload(gallery.id, e.target.files);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setShowUnsplashSearch(
                            showUnsplashSearch === gallery.id
                              ? null
                              : gallery.id
                          )
                        }
                        disabled={state.context.loadingFromUnsplash}
                        className="gap-2"
                      >
                        <Search className="size-3" />
                        {state.context.loadingFromUnsplash
                          ? "Loading..."
                          : "Load from Unsplash"}
                      </Button>
                    </div>

                    {showUploadPreview === gallery.id &&
                      uploadedPreviews[gallery.id] &&
                      uploadedPreviews[gallery.id].length > 0 && (
                        <div
                          className="border rounded-lg p-4 bg-background"
                          data-testid="upload-preview"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-sm text-muted-foreground">
                              {(selectedUploadIds[gallery.id]?.size || 0) > 0
                                ? `${selectedUploadIds[gallery.id].size} image${
                                    selectedUploadIds[gallery.id].size > 1
                                      ? "s"
                                      : ""
                                  } selected`
                                : "Select images to add"}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setSelectedUploadIds((prev) => ({
                                    ...prev,
                                    [gallery.id]: new Set(),
                                  }))
                                }
                                disabled={
                                  (selectedUploadIds[gallery.id]?.size || 0) ===
                                  0
                                }
                              >
                                Clear Selection
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setShowUploadPreview(null);
                                  setUploadedPreviews((prev) => {
                                    const next = { ...prev };
                                    delete next[gallery.id];
                                    return next;
                                  });
                                  setSelectedUploadIds((prev) => {
                                    const next = { ...prev };
                                    delete next[gallery.id];
                                    return next;
                                  });
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = "";
                                  }
                                }}
                              >
                                <X className="size-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleConfirmUpload(gallery.id)}
                                disabled={
                                  (selectedUploadIds[gallery.id]?.size || 0) ===
                                  0
                                }
                              >
                                Add Selected (
                                {selectedUploadIds[gallery.id]?.size || 0})
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto">
                            {uploadedPreviews[gallery.id].map((image) => {
                              const isSelected = (
                                selectedUploadIds[gallery.id] || new Set()
                              ).has(image.id);
                              return (
                                <div
                                  key={image.id}
                                  className="relative group cursor-pointer"
                                  onClick={() =>
                                    handleToggleUploadSelection(
                                      gallery.id,
                                      image.id
                                    )
                                  }
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
                                      unoptimized={image.src.startsWith(
                                        "data:"
                                      )}
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

                    {showUnsplashSearch === gallery.id && (
                      <div className="space-y-4">
                        <div className="flex gap-2 p-4 bg-muted rounded-md">
                          <input
                            type="text"
                            placeholder="Search Unsplash..."
                            value={unsplashQuery}
                            onChange={(e) => setUnsplashQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUnsplashSearch(gallery.id);
                              }
                            }}
                            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUnsplashSearch(gallery.id)}
                            disabled={
                              !unsplashQuery.trim() ||
                              state.context.loadingFromUnsplash
                            }
                          >
                            Search
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setShowUnsplashSearch(null);
                              setUnsplashQuery("");
                              setUnsplashResults((prev) => {
                                const next = { ...prev };
                                delete next[gallery.id];
                                return next;
                              });
                              setSelectedImageIds((prev) => {
                                const next = { ...prev };
                                delete next[gallery.id];
                                return next;
                              });
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

                        {unsplashResults[gallery.id] &&
                          unsplashResults[gallery.id].length > 0 && (
                            <div className="border rounded-lg p-4 bg-background">
                              <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-muted-foreground">
                                  {(selectedImageIds[gallery.id]?.size || 0) > 0
                                    ? `${
                                        selectedImageIds[gallery.id].size
                                      } image${
                                        selectedImageIds[gallery.id].size > 1
                                          ? "s"
                                          : ""
                                      } selected`
                                    : "Select images to add"}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setSelectedImageIds((prev) => ({
                                        ...prev,
                                        [gallery.id]: new Set(),
                                      }))
                                    }
                                    disabled={
                                      (selectedImageIds[gallery.id]?.size ||
                                        0) === 0
                                    }
                                  >
                                    Clear Selection
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleAddSelectedImages(gallery.id)
                                    }
                                    disabled={
                                      (selectedImageIds[gallery.id]?.size ||
                                        0) === 0
                                    }
                                  >
                                    Add Selected (
                                    {selectedImageIds[gallery.id]?.size || 0})
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto">
                                {unsplashResults[gallery.id].map((photo) => {
                                  const isSelected = (
                                    selectedImageIds[gallery.id] || new Set()
                                  ).has(photo.id);
                                  return (
                                    <div
                                      key={photo.id}
                                      className="relative group cursor-pointer"
                                      onClick={() =>
                                        handleToggleImageSelection(
                                          gallery.id,
                                          photo.id
                                        )
                                      }
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
                      <ImageGallery
                        images={gallery.images}
                        layout={gallery.layout}
                      />
                      {gallery.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {gallery.images.map((image) => (
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
                                    handleStartEditCaption(
                                      gallery.id,
                                      image.id,
                                      image.caption
                                    )
                                  }
                                  className="bg-primary text-primary-foreground rounded p-1"
                                  aria-label="Edit caption"
                                >
                                  <Edit2 className="size-3" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleRemoveImage(gallery.id, image.id)
                                  }
                                  className="bg-destructive text-white rounded p-1"
                                  aria-label="Remove image"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                              {editingCaption?.galleryId === gallery.id &&
                                editingCaption?.imageId === image.id && (
                                  <div className="absolute top-full left-0 mt-2 p-2 bg-background border rounded shadow-lg z-10 min-w-[200px]">
                                    <input
                                      type="text"
                                      value={captionValue}
                                      onChange={(e) =>
                                        setCaptionValue(e.target.value)
                                      }
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
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <GalleryBuilderProvider>
      <GalleryBuilderContent />
    </GalleryBuilderProvider>
  );
}
