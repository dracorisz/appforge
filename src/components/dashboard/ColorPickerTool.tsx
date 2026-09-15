import React from "react";
import { Check, Copy, ImagePlus, Palette, Pipette, Upload } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";

type RGB = { r: number; g: number; b: number };
type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_SOURCE_DIMENSION = 8192;
const MAX_SOURCE_PIXELS = 50_000_000;
const SUPPORTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);
const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
const rgbToHex = ({ r, g, b }: RGB) => `#${[r, g, b].map((value) => clamp(value).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
const hexToRgb = (hex: string): RGB => {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) throw new Error("Use a six-digit HEX color.");
  return { r: parseInt(clean.slice(0, 2), 16), g: parseInt(clean.slice(2, 4), 16), b: parseInt(clean.slice(4, 6), 16) };
};
const rgbToHsl = ({ r, g, b }: RGB) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === red) h = (green - blue) / d + (green < blue ? 6 : 0);
    else if (max === green) h = (blue - red) / d + 2;
    else h = (red - green) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};
const contrastColor = ({ r, g, b }: RGB) => ((r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#FFFFFF");
const luminance = ({ r, g, b }: RGB) => {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return channel(r) * 0.2126 + channel(g) * 0.7152 + channel(b) * 0.0722;
};
const contrastRatio = (a: RGB, b: RGB) => {
  const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (bright + 0.05) / (dark + 0.05);
};
const shade = (rgb: RGB, amount: number): RGB => (amount < 0 ? { r: rgb.r * (1 + amount), g: rgb.g * (1 + amount), b: rgb.b * (1 + amount) } : { r: rgb.r + (255 - rgb.r) * amount, g: rgb.g + (255 - rgb.g) * amount, b: rgb.b + (255 - rgb.b) * amount });

export function ColorPickerTool() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [hex, setHex] = React.useState("#5B6CFF");
  const [palette, setPalette] = React.useState<string[]>([]);
  const [copied, setCopied] = React.useState("");
  const [error, setError] = React.useState("");
  React.useEffect(
    () => () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    },
    [imageUrl],
  );
  const rgb = React.useMemo(() => {
    try {
      return hexToRgb(hex);
    } catch {
      return { r: 91, g: 108, b: 255 };
    }
  }, [hex]);
  const hsl = rgbToHsl(rgb);
  const shadeSteps = React.useMemo(() => [-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45].map((amount) => rgbToHex(shade(rgb, amount))), [rgb]);
  const whiteContrast = contrastRatio(rgb, { r: 255, g: 255, b: 255 });
  const blackContrast = contrastRatio(rgb, { r: 0, g: 0, b: 0 });
  const eyeDropperSupported = typeof window !== "undefined" && "EyeDropper" in window;

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1200);
    } catch {
      setError("Clipboard access was blocked by the browser.");
    }
  };
  const pickFromScreen = async () => {
    const ctor = (window as Window & { EyeDropper?: EyeDropperCtor }).EyeDropper;
    if (!ctor) {
      setError("Screen color picking is not supported by this browser.");
      return;
    }
    setError("");
    try {
      const result = await new ctor().open();
      setHex(result.sRGBHex.toUpperCase());
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) setError("Screen color picking was cancelled or unavailable.");
    }
  };

  const extractPalette = (context: CanvasRenderingContext2D, width: number, height: number) => {
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 72;
    sampleCanvas.height = 72;
    const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!sampleContext) return;
    sampleContext.drawImage(context.canvas, 0, 0, width, height, 0, 0, 72, 72);
    const data = sampleContext.getImageData(0, 0, 72, 72).data;
    const counts = new Map<string, number>();
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] < 180) continue;
      const quantized = rgbToHex({ r: Math.round(data[index] / 32) * 32, g: Math.round(data[index + 1] / 32) * 32, b: Math.round(data[index + 2] / 32) * 32 });
      counts.set(quantized, (counts.get(quantized) || 0) + 1);
    }
    setPalette(
      [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([color]) => color),
    );
  };
  const drawImage = async (file: File) => {
    if (!SUPPORTED_TYPES.has(file.type)) return setError("Choose a PNG, JPEG, WebP, GIF, or AVIF image.");
    if (file.size > MAX_IMAGE_BYTES) return setError("Choose an image under 25 MB for reliable browser-local sampling.");
    setError("");
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > MAX_SOURCE_DIMENSION || image.naturalHeight > MAX_SOURCE_DIMENSION || image.naturalWidth * image.naturalHeight > MAX_SOURCE_PIXELS) {
        URL.revokeObjectURL(url);
        setError("Image dimensions are too large. Use up to 8192 px per side and 50 megapixels.");
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) {
        URL.revokeObjectURL(url);
        setError("Canvas is unavailable in this browser.");
        return;
      }
      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        URL.revokeObjectURL(url);
        setError("Canvas is unavailable in this browser.");
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(url);
      setFileName(file.name);
      extractPalette(context, canvas.width, canvas.height);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("The browser could not decode this image.");
    };
    image.src = url;
  };
  const pickFromCanvas = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width || !canvas.height) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(((event.clientX - rect.left) * canvas.width) / rect.width)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(((event.clientY - rect.top) * canvas.height) / rect.height)));
    try {
      const pixel = canvas.getContext("2d", { willReadFrequently: true })?.getImageData(x, y, 1, 1).data;
      if (pixel) setHex(rgbToHex({ r: pixel[0], g: pixel[1], b: pixel[2] }));
    } catch {
      setError("Could not sample that pixel.");
    }
  };
  const updateHex = (value: string) => {
    const normalized = value.startsWith("#") ? value : `#${value}`;
    setHex(normalized.toUpperCase().slice(0, 7));
  };
  const values = [
    ["HEX", hex.toUpperCase()],
    ["RGB", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`],
    ["HSL", `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`],
  ];

  return (
    <div className="space-y-4 pb-8">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Color sampling</h2>
              <p className="mt-1 text-sm text-muted-foreground">Pick from your screen when supported, or sample a loaded image pixel.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => void pickFromScreen()} disabled={!eyeDropperSupported}>
                <Pipette className="h-4 w-4" /> Pick from screen
              </Button>
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> {imageUrl ? "Replace image" : "Load image"}
              </Button>
            </div>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void drawImage(file);
              event.currentTarget.value = "";
            }}
          />
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/30">
            <canvas ref={canvasRef} onClick={pickFromCanvas} className={`max-h-[34rem] w-full object-contain ${imageUrl ? "cursor-crosshair" : "hidden"}`} />
            {!imageUrl && (
              <Button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col p-8 text-center text-muted-foreground hover:bg-accent/30">
                <ImagePlus className="h-6 w-6" />
                <span className="mt-4 text-sm font-medium text-foreground">Choose an image</span>
                <span className="mt-2 text-sm">PNG, JPEG, WebP, GIF, or AVIF · max 25 MB / 50 MP</span>
              </Button>
            )}
          </div>
          {fileName && <p className="mt-2 truncate text-sm text-muted-foreground">{fileName}</p>}
          {palette.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Palette className="h-4 w-4" /> Extracted palette
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {palette.map((color) => (
                  <Button key={color} type="button" onClick={() => setHex(color)} title={color} className="aspect-square" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          )}
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-foreground">Selected color</h2>
          <div className="mt-4 aspect-[16/8] rounded-xl border border-border" style={{ backgroundColor: /^#[0-9A-F]{6}$/i.test(hex) ? hex : "#5B6CFF" }} />
          <div className="mt-4 grid gap-4 sm:grid-cols-[5rem_1fr]">
            <Input type="color" value={/^#[0-9A-F]{6}$/i.test(hex) ? hex : "#5B6CFF"} onChange={(event) => setHex(event.target.value.toUpperCase())} className="h-9 w-full cursor-pointer rounded-xl border border-border bg-transparent p-2" />
            <Input value={hex} onChange={(event) => updateHex(event.target.value)} aria-label="HEX color" />
          </div>
          <div className="mt-4 space-y-2">
            {values.map(([label, value]) => (
              <div key={label} className="flex items-center gap-2 rounded-xl border border-border bg-background/35 p-4">
                <div className="w-10 text-sm font-medium text-muted-foreground">{label}</div>
                <code className="min-w-0 flex-1 truncate text-sm text-foreground">{value}</code>
                <Button onClick={() => void copy(label, value)} className="p-2 text-muted-foreground hover:text-foreground" aria-label={`Copy ${label}`}>
                  {copied === label ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="mb-2 text-sm font-medium text-muted-foreground">Shade ladder · 3 darker / 3 lighter</div>
            <div className="grid grid-cols-7 gap-2">
              {shadeSteps.map((color, index) => (
                <Button key={`${color}-${index}`} type="button" onClick={() => setHex(color)} title={color} className={`aspect-square rounded-xl border ${index === 3 ? "ring-0 ring-ring/40" : "border-border"}`} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border p-4">
              <div className="text-muted-foreground">Contrast on white</div>
              <div className="mt-2 font-semibold">
                {whiteContrast.toFixed(2)}:1 · {whiteContrast >= 4.5 ? "AA text" : "large/decorative"}
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-muted-foreground">Contrast on black</div>
              <div className="mt-2 font-semibold">
                {blackContrast.toFixed(2)}:1 · {blackContrast >= 4.5 ? "AA text" : "large/decorative"}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border p-4" style={{ backgroundColor: /^#[0-9A-F]{6}$/i.test(hex) ? hex : "#5B6CFF", color: contrastColor(rgb) }}>
            <div className="text-sm font-semibold">Contrast preview</div>
            <div className="mt-2 text-sm opacity-80">Automatic foreground preview for quick UI checks.</div>
          </div>
          {error && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</div>}
        </Card>
      </div>
    </div>
  );
}
