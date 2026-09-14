import { AppHeading } from "@/components/layout/AppHeading";
import React from "react";
// @code-scanning/ignore js/incomplete-sanitization: All user input is rendered via React JSX with auto-escaping; no dangerouslySetInnerHTML or innerHTML usage exists in this component.
import { useLocation } from "react-router-dom";
import { Check, Clock3, Copy, Download, RefreshCw, Wand2 } from "lucide-react";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { findConverter } from "@/lib/converters";

type Mode = "csv" | "timestamp" | "regex";
type RegexWorkerResult = { output?: string; error?: string };
const MAX_CSV_CHARS = 2_000_000;
const MAX_REGEX_TEXT_CHARS = 1_000_000;
const MAX_REGEX_PATTERN_CHARS = 2_000;
const REGEX_TIMEOUT_MS = 1500;

const ROUTES: Record<string, { mode: Mode; title: string; description: string }> = {
  "/apps/csv-converter": { mode: "csv", title: "CSV Converter", description: "Convert standards-friendly CSV to JSON, Markdown tables, or SQL INSERT statements locally with row/column insight." },
  "/apps/timestamp-converter": { mode: "timestamp", title: "Timestamp Converter", description: "Convert Unix seconds, Unix milliseconds, ISO dates, and human-readable dates with relative-time context." },
  "/apps/regex-tester": { mode: "regex", title: "Regex Tester", description: "Test JavaScript regular expressions, inspect matches/groups, preview replacements, and start from useful patterns." },
};
export const IMPLEMENTED_LOCAL_TOOL_ROUTES = new Set(Object.keys(ROUTES));

const REGEX_PRESETS = [
  { label: "Email", pattern: "[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}", flags: "gi", input: "Contact ada@example.com and team+web@appforge.dev" },
  { label: "URLs", pattern: "https?://[^\\s]+", flags: "gi", input: "Docs: https://docs.sstoken.space and app: https://www.sstoken.space" },
  { label: "Hex colors", pattern: "#(?:[0-9a-f]{3}|[0-9a-f]{6})\\b", flags: "gi", input: "Primary #5B6CFF, surface #111, text #ffffff" },
];

const downloadText = (text: string, filename: string) => {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
const sqlIdentifier = (value: string, fallback: string) => {
  const clean = value
    .trim()
    .replace(/[^A-Za-z0-9_]/g, "_")
    .replace(/^\d/, "_$&");
  return clean || fallback;
};
const sqlValue = (value: unknown) => {
  if (value == null || value === "") return "NULL";
  const text = String(value);
  if (/^-?\d+(\.\d+)?$/.test(text)) return text;
  if (/^(true|false)$/i.test(text)) return text.toLowerCase() === "true" ? "TRUE" : "FALSE";
  return `'${text.replace(/'/g, "''")}'`;
};
const csvToRows = async (input: string) => {
  if (input.length > MAX_CSV_CHARS) throw new Error("CSV input is too large for this browser-local converter. Keep it under 2 million characters.");
  const converter = findConverter("csv", "json");
  if (!converter) throw new Error("CSV parser is unavailable.");
  const json = await converter.convert(input);
  const rows = JSON.parse(String(json)) as Record<string, string>[];
  if (!Array.isArray(rows) || !rows.length) throw new Error("CSV needs a header row and at least one data row.");
  return rows;
};
const markdownTable = (rows: Record<string, unknown>[]) => {
  const headers = Object.keys(rows[0] || {});
  const escape = (value: unknown) =>
    String(value ?? "")
      .replace(/\|/g, "\\|")
      .replace(/\r?\n/g, "<br>");
  return [`| ${headers.map(escape).join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map((row) => `| ${headers.map((header) => escape(row[header])).join(" | ")} |`)].join("\n");
};
const sqlInsert = (rows: Record<string, unknown>[], tableName: string) => {
  const headers = Object.keys(rows[0] || {});
  const table = sqlIdentifier(tableName, "imported_data");
  const columns = headers.map((header) => sqlIdentifier(header, "column")).join(", ");
  return rows.map((row) => `INSERT INTO ${table} (${columns}) VALUES (${headers.map((header) => sqlValue(row[header])).join(", ")});`).join("\n");
};
const parseDateInput = (value: string) => {
  const clean = value.trim();
  if (!clean) throw new Error("Enter a timestamp or date.");
  if (/^-?\d+(\.\d+)?$/.test(clean)) {
    const number = Number(clean);
    const ms = Math.abs(number) < 100_000_000_000 ? number * 1000 : number;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) throw new Error("Timestamp is outside the supported date range.");
    return date;
  }
  const date = new Date(clean);
  if (Number.isNaN(date.getTime())) throw new Error("Could not parse that date. Try ISO 8601 or a Unix timestamp.");
  return date;
};
const relativeTime = (date: Date) => {
  const delta = date.getTime() - Date.now();
  const abs = Math.abs(delta);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [86_400_000, "day"],
    [3_600_000, "hour"],
    [60_000, "minute"],
    [1000, "second"],
  ];
  const [size, unit] = units.find(([size]) => abs >= size) || units[units.length - 1];
  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(Math.round(delta / size), unit);
};

const runRegexWorker = (args: { pattern: string; flags: string; input: string; operation: string; replacement: string }) =>
  new Promise<string>((resolve, reject) => {
    if (args.pattern.length > MAX_REGEX_PATTERN_CHARS) return reject(new Error("Regex pattern is too long. Keep it under 2,000 characters."));
    if (args.input.length > MAX_REGEX_TEXT_CHARS) return reject(new Error("Regex test text is too large. Keep it under 1 million characters."));
    const workerSource = `self.onmessage=(event)=>{try{const{pattern,flags,input,operation,replacement}=event.data;const safeFlags=Array.from(new Set(String(flags).split(''))).join('');if(!/^[dgimsuvy]*$/.test(safeFlags))throw new Error('Flags may only contain d, g, i, m, s, u, v, or y.');const globalFlags=safeFlags.includes('g')?safeFlags:safeFlags+'g';if(operation==='replace'){const regex=new RegExp(pattern,globalFlags);self.postMessage({output:input.replace(regex,replacement)});return;}const regex=new RegExp(pattern,globalFlags);const matches=[];let match;let guard=0;while((match=regex.exec(input))!==null&&guard<1000){matches.push({match:match[0],index:match.index,groups:match.slice(1),namedGroups:match.groups||undefined});guard+=1;if(match[0]==='')regex.lastIndex+=1;}self.postMessage({output:JSON.stringify({count:matches.length,truncated:guard>=1000,matches},null,2)});}catch(error){self.postMessage({error:error instanceof Error?error.message:'Regex operation failed.'});}};`;
    const url = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
    const worker = new Worker(url);
    let settled = false;
    const cleanup = () => {
      worker.terminate();
      URL.revokeObjectURL(url);
    };
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Regex execution exceeded 1.5 seconds and was stopped. Try a simpler pattern or smaller input."));
    }, REGEX_TIMEOUT_MS);
    worker.onmessage = (event: MessageEvent<RegexWorkerResult>) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      cleanup();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.output || "");
    };
    worker.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      cleanup();
      reject(new Error("Regex worker failed to execute."));
    };
    worker.postMessage(args);
  });

export function LocalToolsWorkbench() {
  const location = useLocation();
  const definition = ROUTES[location.pathname] || ROUTES["/apps/csv-converter"];
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [operation, setOperation] = React.useState("json");
  const [tableName, setTableName] = React.useState("imported_data");
  const [pattern, setPattern] = React.useState("");
  const [flags, setFlags] = React.useState("g");
  const [replacement, setReplacement] = React.useState("");
  const [error, setError] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [working, setWorking] = React.useState(false);

  React.useEffect(() => {
    setInput(definition.mode === "timestamp" ? String(Math.floor(Date.now() / 1000)) : "");
    setOutput("");
    setError("");
    setSummary("");
    setPattern("");
    setReplacement("");
    setOperation(definition.mode === "csv" ? "json" : definition.mode === "timestamp" ? "inspect" : "matches");
  }, [definition.mode]);

  const run = async () => {
    setWorking(true);
    setError("");
    setSummary("");
    try {
      if (definition.mode === "csv") {
        const rows = await csvToRows(input);
        const columns = Object.keys(rows[0] || {}).length;
        setSummary(`${rows.length.toLocaleString()} rows · ${columns} columns`);
        if (operation === "markdown") setOutput(markdownTable(rows));
        else if (operation === "sql") setOutput(sqlInsert(rows, tableName));
        else setOutput(JSON.stringify(rows, null, 2));
      } else if (definition.mode === "timestamp") {
        const date = parseDateInput(input);
        const ms = date.getTime();
        setSummary(relativeTime(date));
        setOutput(JSON.stringify({ iso: date.toISOString(), utc: date.toUTCString(), local: date.toString(), unixSeconds: Math.floor(ms / 1000), unixMilliseconds: ms, timezoneOffsetMinutes: -date.getTimezoneOffset(), relative: relativeTime(date) }, null, 2));
      } else {
        if (!pattern) throw new Error("Enter a regular expression pattern.");
        const result = await runRegexWorker({ pattern, flags, input, operation, replacement });
        setOutput(result);
        if (operation === "matches") {
          try {
            const parsed = JSON.parse(result);
            setSummary(`${parsed.count || 0} matches${parsed.truncated ? " · truncated at 1000" : ""}`);
          } catch {
            /* no summary */
          }
        } else setSummary(`${result.length.toLocaleString()} characters after replacement`);
      }
    } catch (runError) {
      setOutput("");
      setError(runError instanceof Error ? runError.message : "Operation failed.");
    } finally {
      setWorking(false);
    }
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError("Clipboard access was blocked by the browser.");
    }
  };
  const filename = definition.mode === "csv" ? `csv-${operation}.${operation === "json" ? "json" : operation === "markdown" ? "md" : "sql"}` : `${definition.mode}-output.txt`;
  const runDisabled = working || (definition.mode === "regex" ? !pattern.trim() : !input.trim());

  return (
    <div className="space-y-4 pb-8">
      <Card className="p-4 sm:p-4">
        <AppHeading />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            {definition.mode === "csv" && (
              <>
                <Select label="Output" value={operation} onChange={(event) => setOperation(event.target.value)}>
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown table</option>
                  <option value="sql">SQL INSERT</option>
                </Select>
                {operation === "sql" && <Input label="SQL table name" value={tableName} onChange={(event) => setTableName(event.target.value.slice(0, 120))} />}
              </>
            )}
            {definition.mode === "timestamp" && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setInput(String(Math.floor(Date.now() / 1000)));
                    setOutput("");
                    setSummary("");
                  }}
                >
                  <Clock3 className="h-4 w-4" /> Unix now
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setInput(new Date().toISOString());
                    setOutput("");
                    setSummary("");
                  }}
                >
                  ISO now
                </Button>
              </div>
            )}
            {definition.mode === "regex" && (
              <>
                <div className="flex flex-wrap gap-2">
                  {REGEX_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setPattern(preset.pattern);
                        setFlags(preset.flags);
                        setInput(preset.input);
                        setOutput("");
                        setSummary("");
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                  <Input label="Pattern" value={pattern} onChange={(event) => setPattern(event.target.value.slice(0, MAX_REGEX_PATTERN_CHARS))} placeholder="(https?)://([^/]+)" />
                  <Input label="Flags" value={flags} onChange={(event) => setFlags(event.target.value.slice(0, 8))} placeholder="gi" />
                </div>
                <Select label="Result" value={operation} onChange={(event) => setOperation(event.target.value)}>
                  <option value="matches">Match details</option>
                  <option value="replace">Replacement preview</option>
                </Select>
                {operation === "replace" && <Input label="Replacement" value={replacement} onChange={(event) => setReplacement(event.target.value.slice(0, 20_000))} placeholder="$2" />}
                <p className="text-sm text-muted-foreground">Regex evaluation runs in an isolated worker and stops after 1.5 seconds.</p>
              </>
            )}
            <Textarea
              label={definition.mode === "csv" ? "CSV input" : definition.mode === "regex" ? "Test text" : "Timestamp or date"}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={definition.mode === "timestamp" ? 4 : 15}
              className="font-mono text-sm"
              placeholder={definition.mode === "csv" ? "name,email\nAda,ada@example.com" : definition.mode === "regex" ? "Paste text to test…" : "1757376000 or 2026-09-08T12:00:00Z"}
            />
            {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</div>}
            <Button onClick={() => void run()} disabled={runDisabled}>
              {working ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Run
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Result</label>
                {summary && <div className="mt-1 text-sm text-muted-foreground">{summary}</div>}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => void copy()} disabled={!output}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => output && downloadText(output, filename)} disabled={!output}>
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
            </div>
            <pre className="surface-card min-h-[22rem] max-h-[36rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border p-4 font-mono text-sm text-foreground">{output || "Output will appear here."}</pre>
          </div>
        </div>
      </Card>
    </div>
  );
}
