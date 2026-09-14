import { AppHeading } from "@/components/layout/AppHeading";
import React from "react";
import { useLocation } from "react-router-dom";
import { Check, Copy, Download, Image as ImageIcon, RefreshCw, Upload, Wand2 } from "lucide-react";
import { Badge, Button, Card, FileButton, Input, Select } from "@/components/ui";

type Mode = "resize" | "convert" | "compress" | "metadata";
type ImageInfo = { file: File; url: string; width: number; height: number };
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_DIMENSION = 8192;
const MAX_PIXELS = 50_000_000;
const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);
const ROUTES: Record<string, { mode: Mode; title: string; description: string }> = {
  "/apps/image-resizer": { mode: "resize", title: "Image Resizer", description: "Resize images locally with aspect-ratio locking, percentage presets, and downloadable output." },
  "/apps/image-converter": { mode: "convert", title: "Image Converter", description: "Convert browser-supported images locally with format and quality control." },
  "/apps/image-compressor": { mode: "compress", title: "Image Compressor", description: "Compress JPEG/WebP/AVIF output with quality presets and before/after savings." },
  "/apps/image-metadata": { mode: "metadata", title: "Image Metadata", description: "Inspect image dimensions/file details locally and copy a structured metadata summary." },
};
export const IMPLEMENTED_IMAGE_ROUTES = new Set(Object.keys(ROUTES));
const formatBytes = (bytes: number) => (bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const clampDimension = (value: number) => Math.max(1, Math.min(MAX_DIMENSION, Math.round(value || 1)));
const validateCanvasSize = (width: number, height: number) => {
  if (width > MAX_DIMENSION || height > MAX_DIMENSION || width * height > MAX_PIXELS) throw new Error(`Output is too large for reliable browser processing. Keep each side at ${MAX_DIMENSION}px or less and total pixels under ${Math.round(MAX_PIXELS / 1_000_000)} MP.`);
};
const loadImage = (file: File): Promise<ImageInfo> =>
  new Promise((resolve, reject) => {
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) return reject(new Error("Choose a PNG, JPEG, WebP, GIF, or AVIF image."));
    if (file.size > MAX_IMAGE_BYTES) return reject(new Error("Choose an image under 25 MB for reliable browser-local processing."));
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > MAX_DIMENSION || image.naturalHeight > MAX_DIMENSION || image.naturalWidth * image.naturalHeight > MAX_PIXELS) {
        URL.revokeObjectURL(url);
        reject(new Error(`Image dimensions are too large. Use up to ${MAX_DIMENSION}px per side and ${Math.round(MAX_PIXELS / 1_000_000)} megapixels.`));
        return;
      }
      resolve({ file, url, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The browser could not decode this image."));
    };
    image.src = url;
  });
const imageToBlob = async (info: ImageInfo, width: number, height: number, mime: string, quality: number) => {
  const safeWidth = clampDimension(width);
  const safeHeight = clampDimension(height);
  validateCanvasSize(safeWidth, safeHeight);
  const source = new Image();
  source.src = info.url;
  await source.decode();
  const canvas = document.createElement("canvas");
  canvas.width = safeWidth;
  canvas.height = safeHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(`This browser cannot export ${mime}.`))), mime, quality);
  });
};
const extensionFor = (mime: string) => ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" })[mime] || "img";

export function ImageWorkbench() {
  const location = useLocation();
  const definition = ROUTES[location.pathname] || ROUTES["/apps/image-resizer"];
  const [info, setInfo] = React.useState<ImageInfo | null>(null);
  const [width, setWidth] = React.useState(0);
  const [height, setHeight] = React.useState(0);
  const [lockRatio, setLockRatio] = React.useState(true);
  const [mime, setMime] = React.useState("image/webp");
  const [quality, setQuality] = React.useState(82);
  const [outputUrl, setOutputUrl] = React.useState("");
  const [outputBlob, setOutputBlob] = React.useState<Blob | null>(null);
  const [working, setWorking] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState("");
  const infoRef = React.useRef<ImageInfo | null>(null);
  const outputUrlRef = React.useRef("");
  React.useEffect(() => {
    infoRef.current = info;
  }, [info]);
  React.useEffect(() => {
    outputUrlRef.current = outputUrl;
  }, [outputUrl]);
  React.useEffect(
    () => () => {
      if (infoRef.current?.url) URL.revokeObjectURL(infoRef.current.url);
      if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    },
    [],
  );
  React.useEffect(() => {
    if (!info) return;
    setWidth(info.width);
    setHeight(info.height);
    setMime(definition.mode === "convert" ? "image/webp" : info.file.type === "image/png" ? "image/png" : "image/jpeg");
    setOutputBlob(null);
    setOutputUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
  }, [definition.mode, info]);

  const acceptFile = async (file?: File) => {
    if (!file) return;
    setError("");
    try {
      const next = await loadImage(file);
      setInfo((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return next;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load image.");
    }
  };
  const updateWidth = (nextWidth: number) => {
    const safeWidth = clampDimension(nextWidth);
    setWidth(safeWidth);
    if (lockRatio && info) setHeight(clampDimension((safeWidth * info.height) / info.width));
  };
  const updateHeight = (nextHeight: number) => {
    const safeHeight = clampDimension(nextHeight);
    setHeight(safeHeight);
    if (lockRatio && info) setWidth(clampDimension((safeHeight * info.width) / info.height));
  };
  const scaleResize = (ratio: number) => {
    if (!info) return;
    setWidth(clampDimension(info.width * ratio));
    setHeight(clampDimension(info.height * ratio));
  };
  const process = async () => {
    if (!info || definition.mode === "metadata") return;
    setWorking(true);
    setError("");
    try {
      const targetWidth = definition.mode === "resize" ? width : info.width;
      const targetHeight = definition.mode === "resize" ? height : info.height;
      validateCanvasSize(targetWidth, targetHeight);
      const targetMime = definition.mode === "convert" ? mime : definition.mode === "compress" ? mime : info.file.type === "image/png" ? "image/png" : mime;
      const blob = await imageToBlob(info, targetWidth, targetHeight, targetMime, quality / 100);
      const url = URL.createObjectURL(blob);
      setOutputBlob(blob);
      setOutputUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return url;
      });
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : "Image processing failed.");
    } finally {
      setWorking(false);
    }
  };
  const download = () => {
    if (!info || !outputBlob || !outputUrl) return;
    const base = info.file.name.replace(/\.[^.]+$/, "") || "image";
    const link = document.createElement("a");
    link.href = outputUrl;
    link.download = `${base}-${definition.mode}.${extensionFor(outputBlob.type)}`;
    link.click();
  };
  const ratio = info
    ? (() => {
        const divisor = gcd(info.width, info.height);
        return `${info.width / divisor}:${info.height / divisor}`;
      })()
    : "";
  const metadata = info
    ? {
        name: info.file.name,
        mimeType: info.file.type || "unknown",
        bytes: info.file.size,
        size: formatBytes(info.file.size),
        width: info.width,
        height: info.height,
        aspectRatio: ratio,
        megapixels: Number(((info.width * info.height) / 1_000_000).toFixed(2)),
        lastModified: new Date(info.file.lastModified).toISOString(),
      }
    : null;
  const copyMetadata = async () => {
    if (!metadata) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setError("Clipboard access was blocked by the browser.");
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <Card className="p-4 sm:p-4">
        <AppHeading />
        {!info ? (
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void acceptFile(event.dataTransfer.files?.[0]);
            }}
            className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition-colors ${dragging ? "border-foreground/30 bg-accent/70" : "border-border hover:border-foreground/20 hover:bg-accent/35"}`}
          >
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(event) => {
                void acceptFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background/50">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-foreground">Drop an image here</h2>
            <p className="mt-1 text-sm text-muted-foreground">or click to choose a local file · max 25 MB / 50 MP</p>
          </label>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="overflow-hidden rounded-xl border border-border bg-muted/35">
                <img src={outputUrl || info.url} alt={info.file.name} className="max-h-[34rem] w-full object-contain" />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>{info.file.name}</span>
                <span>
                  {info.width} × {info.height} · {formatBytes(info.file.size)}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              {definition.mode === "resize" && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {[
                      [0.25, "25%"],
                      [0.5, "50%"],
                      [0.75, "75%"],
                      [1, "100%"],
                      [2, "200%"],
                    ].map(([value, label]) => (
                      <Button key={String(label)} variant="secondary" size="sm" onClick={() => scaleResize(Number(value))}>
                        {String(label)}
                      </Button>
                    ))}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Width" type="number" min={1} max={MAX_DIMENSION} value={width} onChange={(event) => updateWidth(Number(event.target.value) || 1)} />
                    <Input label="Height" type="number" min={1} max={MAX_DIMENSION} value={height} onChange={(event) => updateHeight(Number(event.target.value) || 1)} />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Input type="checkbox" checked={lockRatio} onChange={(event) => setLockRatio(event.target.checked)} /> Lock original aspect ratio ({ratio})
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Target: {width} × {height} · {((width * height) / 1_000_000).toFixed(2)} MP
                  </p>
                </>
              )}
              {(definition.mode === "convert" || definition.mode === "compress") && (
                <Select label="Output format" value={mime} onChange={(event) => setMime(event.target.value)}>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WebP</option>
                  <option value="image/avif">AVIF</option>
                </Select>
              )}
              {(definition.mode === "compress" || (definition.mode === "convert" && mime !== "image/png")) && (
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {[55, 70, 82, 92].map((preset) => (
                      <Button key={preset} variant="secondary" size="sm" onClick={() => setQuality(preset)}>
                        {preset}%
                      </Button>
                    ))}
                  </div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Quality · {quality}%</label>
                  <Input type="range" min={20} max={100} value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="w-full" />
                </div>
              )}
              {definition.mode === "convert" && mime === "image/jpeg" && (info.file.type === "image/png" || info.file.type === "image/webp") && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning dark:text-warning">JPEG cannot preserve transparency; transparent pixels will be flattened by the browser canvas.</div>
              )}
              {definition.mode === "metadata" && (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      ["File name", info.file.name],
                      ["MIME type", info.file.type || "unknown"],
                      ["File size", formatBytes(info.file.size)],
                      ["Dimensions", `${info.width} × ${info.height}`],
                      ["Aspect ratio", ratio],
                      ["Megapixels", `${((info.width * info.height) / 1_000_000).toFixed(2)} MP`],
                      ["Last modified", new Date(info.file.lastModified).toLocaleString()],
                      ["Transparency", info.file.type === "image/png" || info.file.type === "image/webp" ? "Possible" : "Unlikely"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-border bg-background/35 p-4">
                        <div className="text-sm text-muted-foreground">{label}</div>
                        <div className="mt-2 break-words text-sm font-medium text-foreground">{value}</div>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" onClick={() => void copyMetadata()}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied metadata" : "Copy metadata JSON"}
                  </Button>
                </>
              )}
              {outputBlob && (
                <div className="rounded-xl border border-border bg-background/35 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Processed result</div>
                      <div className="mt-2 text-sm font-medium text-foreground">
                        {formatBytes(outputBlob.size)} · {outputBlob.type}
                      </div>
                    </div>
                    <Badge color={outputBlob.size <= info.file.size ? "green" : "yellow"}>{outputBlob.size <= info.file.size ? `${Math.max(0, Math.round((1 - outputBlob.size / info.file.size) * 100))}% smaller` : `${Math.round((outputBlob.size / info.file.size - 1) * 100)}% larger`}</Badge>
                  </div>
                </div>
              )}
              {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</div>}
              <div className="flex flex-wrap gap-2">
                {definition.mode !== "metadata" && (
                  <Button onClick={() => void process()} disabled={working}>
                    {working ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Process
                  </Button>
                )}
                {outputBlob && (
                  <Button variant="secondary" onClick={download}>
                    <Download className="h-4 w-4" /> Download
                  </Button>
                )}
                <FileButton
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  onChange={(event) => {
                    void acceptFile(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                >
                  <ImageIcon className="h-4 w-4" /> Replace image
                </FileButton>
              </div>
            </div>
          </div>
        )}
        {error && !info && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</div>}
      </Card>
    </div>
  );
}
