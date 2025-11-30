import { test, expect } from "@playwright/test";

test.describe("Presentation Builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display empty state when no slides exist", async ({ page }) => {
    await expect(
      page.getByText('No slides yet. Click "Add Slide" to get started.')
    ).toBeVisible();
  });

  test("should add a new slide", async ({ page }) => {
    await page.getByRole("button", { name: /add slide/i }).click();

    await expect(page.getByText(/slide \d+/i).first()).toBeVisible();
  });

  test("should remove a slide", async ({ page }) => {
    await page.getByRole("button", { name: /add slide/i }).click();
    await expect(page.getByText(/slide \d+/i).first()).toBeVisible();

    const slideCard = page.locator('[data-testid="slide-card"]').first();
    const deleteButton = slideCard.getByRole("button", {
      name: /delete slide/i,
    });

    await deleteButton.click();

    await expect(
      page.getByText('No slides yet. Click "Add Slide" to get started.')
    ).toBeVisible();
  });

  test("should add an image gallery widget to a slide", async ({ page }) => {
    await page.getByRole("button", { name: /add slide/i }).click();

    const slideCard = page.locator('[data-testid="slide-card"]').first();
    await slideCard.getByRole("button", { name: /add image gallery/i }).click();

    await expect(
      slideCard.locator('[data-testid="widget-card"]')
    ).toBeVisible();
  });

  test("should remove a widget from a slide", async ({ page }) => {
    await page.getByRole("button", { name: /add slide/i }).click();

    const slideCard = page.locator('[data-testid="slide-card"]').first();
    await slideCard.getByRole("button", { name: /add image gallery/i }).click();

    const widgetCard = slideCard.locator('[data-testid="widget-card"]').first();
    const deleteButton = widgetCard.getByRole("button", {
      name: /remove widget/i,
    });

    await deleteButton.click();

    await expect(slideCard.getByText(/no widgets yet/i)).toBeVisible();
  });

  test("should change widget layout", async ({ page }) => {
    await page.getByRole("button", { name: /add slide/i }).click();

    const slideCard = page.locator('[data-testid="slide-card"]').first();
    await slideCard.getByRole("button", { name: /add image gallery/i }).click();

    const widgetCard = slideCard.locator('[data-testid="widget-card"]').first();
    const layoutSelect = widgetCard.getByRole("combobox", { name: /layout/i });

    await layoutSelect.selectOption("vertical");
    await expect(layoutSelect).toHaveValue("vertical");

    await layoutSelect.selectOption("card");
    await expect(layoutSelect).toHaveValue("card");
  });

  test("should upload images from files", async ({ page }) => {
    await page.getByRole("button", { name: /add slide/i }).click();

    const slideCard = page.locator('[data-testid="slide-card"]').first();
    await slideCard.getByRole("button", { name: /add image gallery/i }).click();

    const widgetCard = slideCard.locator('[data-testid="widget-card"]').first();
    const fileInput = widgetCard.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "test-image-1.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-image-data"),
    });

    await expect(
      widgetCard.locator('[data-testid="upload-preview"]')
    ).toBeVisible();
    await expect(
      widgetCard.getByText(/1 image selected|select images to add/i)
    ).toBeVisible();
  });

  test("should show upload preview and allow selection", async ({ page }) => {
    await page.getByRole("button", { name: /add slide/i }).click();

    const slideCard = page.locator('[data-testid="slide-card"]').first();
    await slideCard.getByRole("button", { name: /add image gallery/i }).click();

    const widgetCard = slideCard.locator('[data-testid="widget-card"]').first();
    const fileInput = widgetCard.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "test-image-1.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-image-data"),
    });

    const imagePreview = widgetCard.locator('[data-testid="upload-preview"]');
    await expect(imagePreview).toBeVisible();
    await expect(
      widgetCard.getByText(/1 image selected|select images to add/i)
    ).toBeVisible();
  });

  test("should toggle Unsplash search", async ({ page }) => {
    await page.getByRole("button", { name: /add slide/i }).click();

    const slideCard = page.locator('[data-testid="slide-card"]').first();
    await slideCard.getByRole("button", { name: /add image gallery/i }).click();

    const widgetCard = slideCard.locator('[data-testid="widget-card"]').first();
    await widgetCard
      .getByRole("button", { name: /load from unsplash/i })
      .click();

    await expect(page.getByPlaceholder(/search unsplash/i)).toBeVisible();
  });

  test("should search Unsplash photos", async ({ page }) => {
    test.skip(
      !process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
      "Unsplash API key not configured"
    );

    await page.getByRole("button", { name: /add slide/i }).click();

    const slideCard = page.locator('[data-testid="slide-card"]').first();
    await slideCard.getByRole("button", { name: /add image gallery/i }).click();

    const widgetCard = slideCard.locator('[data-testid="widget-card"]').first();
    await widgetCard
      .getByRole("button", { name: /load from unsplash/i })
      .click();

    const searchInput = page.getByPlaceholder(/search unsplash/i);
    await searchInput.fill("nature");
    await page.getByRole("button", { name: /search/i }).click();

    await expect(page.getByText(/loading images/i)).toBeVisible();

    await page.waitForTimeout(2000);

    await expect(page.getByText(/select images to add/i)).toBeVisible();
  });

  test("should remove an image from widget", async ({ page }) => {
    await page.getByRole("button", { name: /add slide/i }).click();

    const slideCard = page.locator('[data-testid="slide-card"]').first();
    await slideCard.getByRole("button", { name: /add image gallery/i }).click();

    const widgetCard = slideCard.locator('[data-testid="widget-card"]').first();
    const fileInput = widgetCard.locator('input[type="file"]');

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
    await page.getByRole("button", { name: /add slide/i }).click();

    const slideCard = page.locator('[data-testid="slide-card"]').first();
    await slideCard.getByRole("button", { name: /add image gallery/i }).click();

    const widgetCard = slideCard.locator('[data-testid="widget-card"]').first();
    const fileInput = widgetCard.locator('input[type="file"]');

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

  test("should add multiple slides", async ({ page }) => {
    await page.getByRole("button", { name: /add slide/i }).click();
    await page.getByRole("button", { name: /add slide/i }).click();
    await page.getByRole("button", { name: /add slide/i }).click();

    const slides = page.locator('[data-testid="slide-card"]');
    await expect(slides).toHaveCount(3);
  });

  test("should add multiple widgets to a slide", async ({ page }) => {
    await page.getByRole("button", { name: /add slide/i }).click();

    const slideCard = page.locator('[data-testid="slide-card"]').first();
    await slideCard.getByRole("button", { name: /add image gallery/i }).click();
    await slideCard.getByRole("button", { name: /add image gallery/i }).click();

    const widgets = slideCard.locator('[data-testid="widget-card"]');
    await expect(widgets).toHaveCount(2);
  });
});
