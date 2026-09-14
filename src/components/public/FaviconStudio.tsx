import { AppHeading } from "@/components/layout/AppHeading";
import React from "react";
import { Copy, Download, Image as ImageIcon, RotateCcw, Upload } from "lucide-react";
import { Button, FileButton, Input } from "@/components/ui";

const PREVIEW_SIZES = [16, 32, 180, 192, 512] as const;
const MAX_UPLOAD_BYTES = 5_000_000;

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const svgToPngBlob = async (svg: string, size: number) => {
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not render SVG preview."));
      image.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable in this browser.");
    context.clearRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed."))), "image/png");
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
};

const pngToIco = async (png: Blob, size = 32) => {
  const pngBytes = new Uint8Array(await png.arrayBuffer());
  const buffer = new ArrayBuffer(6 + 16 + pngBytes.byteLength);
  const view = new DataView(buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  view.setUint8(6, size >= 256 ? 0 : size);
  view.setUint8(7, size >= 256 ? 0 : size);
  view.setUint8(8, 0);
  view.setUint8(9, 0);
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, pngBytes.byteLength, true);
  view.setUint32(18, 22, true);
  new Uint8Array(buffer, 22).set(pngBytes);
  return new Blob([buffer], { type: "image/x-icon" });
};

const escapeXml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

export default function FaviconStudio() {
  const [appName, setAppName] = React.useState("My App");
  const [shortName, setShortName] = React.useState("My App");
  const [text, setText] = React.useState("▲");
  const [background, setBackground] = React.useState("#0f172a");
  const [foreground, setForeground] = React.useState("#ffffff");
  const [radius, setRadius] = React.useState(22);
  const [fontScale, setFontScale] = React.useState(0.55);
  const [imageData, setImageData] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");

  const svg = React.useMemo(() => {
    const safeText = escapeXml(text || "A");
    const inner = imageData
      ? `<image href="${imageData}" x="70" y="70" width="372" height="372" preserveAspectRatio="xMidYMid meet"/>`
      : `<text x="256" y="270" text-anchor="middle" dominant-baseline="middle" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="${Math.round(512 * fontScale)}" font-weight="700" fill="${foreground}">${safeText}</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="${Math.round((512 * radius) / 100)}" fill="${background}"/>${inner}</svg>`;
  }, [background, fontScale, foreground, imageData, radius, text]);

  const svgDataUrl = React.useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, [svg]);

  const manifest = React.useMemo(
    () =>
      JSON.stringify(
        {
          name: appName.trim() || "My App",
          short_name: shortName.trim() || appName.trim() || "My App",
          icons: [
            { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
          ],
          theme_color: background,
          background_color: background,
          display: "standalone",
        },
        null,
        2,
      ),
    [appName, background, shortName],
  );

  const htmlLinks = `<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/site.webmanifest">`;

  const onUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Choose an image file.");
      input.value = "";
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setMessage("Choose an image under 5 MB so the browser can render and export it reliably.");
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(typeof reader.result === "string" ? reader.result : null);
      setMessage("Image loaded locally. It is not uploaded anywhere.");
      input.value = "";
    };
    reader.onerror = () => {
      setMessage("Could not read that image. Try another local file.");
      input.value = "";
    };
    reader.readAsDataURL(file);
  };

  const exportOne = async (size: number) => {
    const blob = await svgToPngBlob(svg, size);
    const name = size === 180 ? "apple-touch-icon.png" : `favicon-${size}.png`;
    downloadBlob(blob, name);
  };

  const exportPreview = async (size: number) => {
    try {
      await exportOne(size);
      setMessage(`Downloaded ${size}×${size} PNG.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "PNG export failed.");
    }
  };

  const exportSet = async () => {
    try {
      setMessage("Preparing favicon files…");
      downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "favicon.svg");
      for (const size of [16, 32, 180, 192, 512]) await exportOne(size);
      const icoPng = await svgToPngBlob(svg, 32);
      downloadBlob(await pngToIco(icoPng), "favicon.ico");
      downloadBlob(new Blob([manifest], { type: "application/manifest+json;charset=utf-8" }), "site.webmanifest");
      downloadBlob(new Blob([htmlLinks], { type: "text/plain;charset=utf-8" }), "favicon-links.html.txt");
      setMessage("Downloaded SVG, ICO, PNG sizes, manifest, and HTML link tags.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export failed.");
    }
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
    } catch {
      setMessage(`Could not copy ${label.toLowerCase()}. Your browser may block clipboard access here.`);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 p-4 sm:p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="surface-card rounded-xl border p-4 sm:p-4">
        <div>
          <AppHeading />
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              App name
              <Input value={appName} maxLength={80} onChange={(event) => setAppName(event.target.value)} className="h-11 rounded-xl border bg-background px-4 text-sm" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Short name
              <Input value={shortName} maxLength={30} onChange={(event) => setShortName(event.target.value)} className="h-11 rounded-xl border bg-background px-4 text-sm" />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Text or emoji
            <Input
              value={text}
              onChange={(event) => {
                setText(event.target.value.slice(0, 4));
                setImageData(null);
              }}
              className="h-11 rounded-xl border bg-background px-4 text-sm"
              aria-label="Favicon text or emoji"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Background
              <Input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="h-11 w-full rounded-xl border bg-background p-2" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Foreground
              <Input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} className="h-11 w-full rounded-xl border bg-background p-2" disabled={Boolean(imageData)} />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Corner radius <span className="text-sm font-normal text-muted-foreground">{radius}%</span>
            <Input type="range" min="0" max="50" value={radius} onChange={(event) => setRadius(Number(event.target.value))} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Glyph size <span className="text-sm font-normal text-muted-foreground">{Math.round(fontScale * 100)}%</span>
            <Input type="range" min="0.28" max="0.8" step="0.01" value={fontScale} onChange={(event) => setFontScale(Number(event.target.value))} disabled={Boolean(imageData)} />
          </label>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <FileButton accept="image/*" onChange={onUpload} className="w-full">
              <Upload className="h-4 w-4" /> Upload image
            </FileButton>
            <Button type="button" onClick={() => void copy(htmlLinks, "HTML tags")} className="w-full">
              <Copy className="h-4 w-4" /> Copy HTML tags
            </Button>
            {imageData && (
              <Button
                type="button"
                onClick={() => {
                  setImageData(null);
                  setMessage("Returned to text/emoji mode.");
                }}
                className="col-span-2 inline-flex items-center gap-2 rounded-xl border px-4 text-sm font-medium hover:bg-accent"
              >
                <RotateCcw className="h-4 w-4" /> Use text
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Button type="button" onClick={() => void exportSet()} style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }} className="w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">
            <Download className="h-4 w-4" /> Download favicon set
          </Button>
        </div>
        <div aria-live="polite" className="mt-4 text-sm text-muted-foreground">
          {message}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="surface-card rounded-xl border p-4 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Manifest & SVG</h2>
              <p className="text-sm text-muted-foreground">Copy-ready project assets.</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={() => void copy(svg, "SVG")} className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-accent">
                Copy SVG
              </Button>
              <Button type="button" onClick={() => void copy(manifest, "Manifest")} className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-accent">
                Copy manifest
              </Button>
            </div>
          </div>
          <pre className="mt-4 max-h-64 overflow-auto rounded-xl border bg-background p-4 text-sm">{manifest}</pre>
        </div>

        <div className="surface-card rounded-xl border p-4 sm:p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Live previews</h2>
              <p className="text-sm text-muted-foreground">Every export target is shown at a consistent 16×16 preview size.</p>
            </div>
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PREVIEW_SIZES.map((size) => (
              <Button key={size} type="button" onClick={() => void exportPreview(size)} className="group grid min-h-24 place-items-center gap-2 rounded-xl border bg-background p-2 text-sm text-muted-foreground hover:bg-accent" title={`Download ${size}×${size} PNG`}>
                <img src={svgDataUrl} alt={`${size} by ${size} favicon preview`} width={16} height={16} className="h-4 w-4 rounded-xl" />
                <span>
                  {size}×{size}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
