# Image Tools

AppForge groups four browser-local image utilities behind one shared `ImageWorkbench` component:

- `/apps/image-resizer`
- `/apps/image-converter`
- `/apps/image-compressor`
- `/apps/image-metadata`

## Architecture

The tools use browser `File`, `Image`, `Canvas`, `Blob`, and object-URL APIs. Source images are not uploaded to AppForge for these operations.

## Capabilities

### Image Resizer

- Load or drag/drop one local image.
- Set width or height.
- Optionally preserve the original aspect ratio.
- Render with high-quality canvas interpolation.
- Download the processed result.

### Image Converter

- Export browser-supported input images to JPEG, PNG, WebP, or AVIF when the current browser supports that encoder.
- Adjust quality for lossy formats.
- Preview the generated result before download.

### Image Compressor

- Choose JPEG, WebP, or AVIF output.
- Adjust output quality.
- Compare original and processed byte sizes.
- Download the compressed result.

### Image Metadata

- File name and MIME type.
- File size.
- Pixel dimensions.
- Simplified aspect ratio.
- Megapixel count.
- Local file modification time.

This tool intentionally does **not** claim EXIF editing or deep color-profile parsing yet.

## Contributor notes

Keep browser-local image operations in the shared workbench unless a feature genuinely requires server processing. If you add a server-backed image feature, surface that fact clearly in the UI and document its limits, accepted MIME types, and size caps.

When a route moves from concept to working preview, update its `status`, `version`, description, and tags in `src/lib/registry.ts`.
