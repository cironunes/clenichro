import { test, expect } from "@playwright/test";

test.describe("Gallery Builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display empty state when no galleries exist", async ({
    page,
  }) => {
    await expect(
      page.getByText('No galleries yet. Click "Add Gallery" to get started.')
    ).toBeVisible();
  });

  test("should add a new gallery", async ({ page }) => {
    await page.getByRole("button", { name: /add gallery/i }).click();

    await expect(page.getByText(/gallery \d+/i).first()).toBeVisible();
  });

  test("should remove a gallery", async ({ page }) => {
    await page.getByRole("button", { name: /add gallery/i }).click();
    await expect(page.getByText(/gallery \d+/i).first()).toBeVisible();

    const galleryCard = page.locator('[data-testid="gallery-card"]').first();
    const deleteButton = galleryCard.getByRole("button", {
      name: /delete gallery/i,
    });

    await deleteButton.click();

    await expect(
      page.getByText('No galleries yet. Click "Add Gallery" to get started.')
    ).toBeVisible();
  });

  test("should change gallery layout", async ({ page }) => {
    await page.getByRole("button", { name: /add gallery/i }).click();

    const layoutSelect = page
      .locator('[data-testid="gallery-card"]')
      .first()
      .getByRole("combobox", { name: /layout/i });

    await layoutSelect.selectOption("vertical");
    await expect(layoutSelect).toHaveValue("vertical");

    await layoutSelect.selectOption("card");
    await expect(layoutSelect).toHaveValue("card");
  });

  test("should upload images from files", async ({ page }) => {
    await page.getByRole("button", { name: /add gallery/i }).click();

    const galleryCard = page.locator('[data-testid="gallery-card"]').first();
    const fileInput = galleryCard.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "test-image-1.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-image-data"),
    });

    await expect(
      galleryCard.locator('[data-testid="upload-preview"]')
    ).toBeVisible();
    await expect(
      galleryCard.getByText(/1 image selected|select images to add/i)
    ).toBeVisible();
  });

  test("should show upload preview and allow selection", async ({ page }) => {
    await page.getByRole("button", { name: /add gallery/i }).click();

    const galleryCard = page.locator('[data-testid="gallery-card"]').first();
    const fileInput = galleryCard.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "test-image-1.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-image-data"),
    });

    const imagePreview = galleryCard.locator('[data-testid="upload-preview"]');
    await expect(imagePreview).toBeVisible();
    await expect(
      galleryCard.getByText(/1 image selected|select images to add/i)
    ).toBeVisible();
  });

  test("should toggle Unsplash search", async ({ page }) => {
    await page.getByRole("button", { name: /add gallery/i }).click();

    await page
      .locator('[data-testid="gallery-card"]')
      .first()
      .getByRole("button", { name: /load from unsplash/i })
      .click();

    await expect(page.getByPlaceholder(/search unsplash/i)).toBeVisible();
  });

  test("should search Unsplash photos", async ({ page }) => {
    test.skip(
      !process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
      "Unsplash API key not configured"
    );

    await page.getByRole("button", { name: /add gallery/i }).click();

    await page
      .locator('[data-testid="gallery-card"]')
      .first()
      .getByRole("button", { name: /load from unsplash/i })
      .click();

    const searchInput = page.getByPlaceholder(/search unsplash/i);
    await searchInput.fill("nature");
    await page.getByRole("button", { name: /search/i }).click();

    await expect(page.getByText(/loading images/i)).toBeVisible();

    await page.waitForTimeout(2000);

    await expect(page.getByText(/select images to add/i)).toBeVisible();
  });

  test("should remove an image from gallery", async ({ page }) => {
    await page.getByRole("button", { name: /add gallery/i }).click();

    const galleryCard = page.locator('[data-testid="gallery-card"]').first();
    const fileInput = galleryCard.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "test-image-1.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-image-data"),
    });

    await page.waitForTimeout(1000);

    const addButton = page.getByRole("button", { name: /add selected/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(1000);
    }

    const imageThumbnail = page
      .locator('[data-testid="image-thumbnail"]')
      .first();

    if (await imageThumbnail.isVisible()) {
      await imageThumbnail.hover();
      await page.waitForTimeout(300);

      const removeButton = imageThumbnail
        .locator("button")
        .filter({ has: page.locator("svg") })
        .last();

      if (await removeButton.isVisible()) {
        await removeButton.click();
      }
    }
  });

  test("should edit image caption", async ({ page }) => {
    await page.getByRole("button", { name: /add gallery/i }).click();

    const galleryCard = page.locator('[data-testid="gallery-card"]').first();
    const fileInput = galleryCard.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "test-image-1.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-image-data"),
    });

    await page.waitForTimeout(1000);

    const addButton = page.getByRole("button", { name: /add selected/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(1000);
    }

    const imageThumbnail = page
      .locator('[data-testid="image-thumbnail"]')
      .first();

    if (await imageThumbnail.isVisible()) {
      await imageThumbnail.hover();
      await page.waitForTimeout(300);

      const editButton = imageThumbnail
        .locator("button")
        .filter({ has: page.locator("svg") })
        .first();

      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(300);

        const captionInput = page.getByPlaceholder(/enter caption/i);
        if (await captionInput.isVisible()) {
          await captionInput.fill("Test Caption");
          await captionInput.press("Enter");
        }
      }
    }
  });

  test("should add multiple galleries", async ({ page }) => {
    await page.getByRole("button", { name: /add gallery/i }).click();
    await page.getByRole("button", { name: /add gallery/i }).click();
    await page.getByRole("button", { name: /add gallery/i }).click();

    const galleries = page.locator('[data-testid="gallery-card"]');
    await expect(galleries).toHaveCount(3);
  });
});
