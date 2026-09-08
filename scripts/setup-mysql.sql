-- AppForge MySQL Database Schema
-- Run this script to initialize the MySQL database

CREATE DATABASE IF NOT EXISTS appforge;
USE appforge;

-- Users table (for future auth)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Apps table
CREATE TABLE IF NOT EXISTS apps (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  icon VARCHAR(100),
  route VARCHAR(255),
  status ENUM('idea', 'building', 'beta', 'launched', 'deprecated') DEFAULT 'idea',
  version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- App versions table
CREATE TABLE IF NOT EXISTS app_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  app_id VARCHAR(100) NOT NULL,
  version VARCHAR(50) NOT NULL,
  changes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
);

-- User favorites
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  app_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (user_id, app_id)
);

-- User recent apps
CREATE TABLE IF NOT EXISTS recent_apps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  app_id VARCHAR(100) NOT NULL,
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_recent (user_id, opened_at)
);

-- App settings
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  key VARCHAR(255) NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_setting (user_id, key)
);

-- Insert default apps
INSERT IGNORE INTO apps (id, name, description, category, icon, route, status, version) VALUES
('scrapper-pro', 'Scrapper Pro', 'Search 11+ public sources for names, keywords, or handles.', 'utilities', 'Search', '/apps/scrapper-pro', 'building', '1.0.0'),
('image-labeler', 'Image Labeler', 'Label images from a local folder.', 'image', 'Image', '/apps/image-labeler', 'building', '1.0.0'),
('image-resizer', 'Image Resizer', 'Batch resize, crop, compress, and convert images.', 'image', 'Image', '/apps/image-resizer', 'idea', '0.1.0'),
('image-converter', 'Image Converter', 'Convert images between formats.', 'image', 'Image', '/apps/image-converter', 'idea', '0.1.0'),
('image-compressor', 'Image Compressor', 'Compress images with adjustable quality.', 'image', 'Image', '/apps/image-compressor', 'idea', '0.1.0'),
('image-metadata', 'Image Metadata', 'View and edit EXIF metadata.', 'image', 'Info', '/apps/image-metadata', 'idea', '0.1.0'),
('creator-svg', 'Creator SVG', 'Configure and download SVG resume headers.', 'svg-icons', 'Palette', '/apps/creator-svg', 'building', '1.0.0'),
('crypto-track', 'Crypto Track', 'Live cryptocurrency prices and market data.', 'utilities', 'TrendingUp', '/apps/crypto-track', 'building', '1.0.0'),
('weather-now', 'Weather Now', 'Current weather by city or ZIP code.', 'utilities', 'Cloud', '/apps/weather-now', 'building', '1.0.0'),
('pariflow-smpl', 'Pariflow Smpl', 'Pariflow docs explorer with MCP CLI guide.', 'utilities', 'FileSearch', '/apps/pariflow-smpl', 'building', '1.0.0'),
('json-formatter', 'JSON Formatter', 'Format, minify, validate JSON.', 'json-data', 'Braces', '/apps/json-formatter', 'idea', '0.1.0'),
('csv-converter', 'CSV Converter', 'Convert CSV to JSON, Markdown, SQL.', 'converters', 'Table', '/apps/csv-converter', 'idea', '0.1.0'),
('qr-generator', 'QR Generator', 'Generate QR codes for URLs, text, Wi-Fi.', 'utilities', 'QrCode', '/apps/qr-generator', 'idea', '0.1.0'),
('color-picker', 'Color Picker', 'Pick colors from images, generate palettes.', 'image', 'Palette', '/apps/color-picker', 'idea', '0.1.0'),
('resume-forge', 'Resume Forge', 'Live SVG resume builder with PDF export.', 'svg-icons', 'FileText', '/apps/resume-forge', 'building', '1.0.0'),
('pitch-deck', 'Pitch Deck', 'Editable investor pitch deck templates.', 'utilities', 'Presentation', '/apps/pitch-deck', 'building', '1.0.0'),
('invoice-studio', 'Invoice Studio', 'Freelancer invoice generator with CRM.', 'utilities', 'Receipt', '/apps/invoice-studio', 'building', '1.0.0'),
('source-grade', 'Source Grade', 'Score source reliability and independence.', 'utilities', 'Star', '/apps/source-grade', 'building', '1.0.0'),
('link-checker', 'Link Checker', 'Bulk-check URLs for status and redirects.', 'code', 'Link', '/apps/link-checker', 'building', '1.0.0'),
('uuid-generator', 'UUID Generator', 'Bulk-generate UUIDs and NanoIDs.', 'crypto', 'Hash', '/apps/uuid-generator', 'idea', '0.1.0'),
('password-generator', 'Password Generator', 'Generate strong passwords with entropy meter.', 'crypto', 'Lock', '/apps/password-generator', 'idea', '0.1.0'),
('token-generator', 'Token Generator', 'Generate API keys, JWT, HMAC secrets.', 'crypto', 'Key', '/apps/token-generator', 'idea', '0.1.0'),
('base64-tool', 'Base64 Tool', 'Encode/decode Base64, Base32, URL-safe.', 'encoding', 'FileCode', '/apps/base64-tool', 'idea', '0.1.0'),
('hash-tool', 'Hash Tool', 'Instant MD5, SHA-1, SHA-256, SHA-512.', 'crypto', 'Fingerprint', '/apps/hash-tool', 'idea', '0.1.0'),
('timestamp-converter', 'Timestamp Converter', 'Convert Unix timestamps across timezones.', 'code', 'Clock', '/apps/timestamp-converter', 'idea', '0.1.0'),
('regex-tester', 'Regex Tester', 'Test regular expressions with match highlighting.', 'regex', 'Regex', '/apps/regex-tester', 'idea', '0.1.0'),
('markdown-previewer', 'Markdown Previewer', 'Write Markdown, see live preview.', 'markdown', 'FileText', '/apps/markdown-previewer', 'idea', '0.1.0'),
('pdf-tool', 'PDF Tool', 'Merge, split, rotate, compress PDFs.', 'converters', 'File', '/apps/pdf-tool', 'idea', '0.1.0'),
('excel-tool', 'Excel Tool', 'Convert Excel/CSV to JSON/SQL.', 'json-data', 'Sheet', '/apps/excel-tool', 'idea', '0.1.0'),
('svg-tool', 'SVG Tool', 'Optimize SVG files, convert to PNG/PDF.', 'svg-icons', 'Palette', '/apps/svg-tool', 'idea', '0.1.0'),
('audio-converter', 'Audio Converter', 'Convert audio between MP3, WAV, FLAC, AAC.', 'converters', 'Music', '/apps/audio-converter', 'idea', '0.1.0'),
('any-converter', 'Any to Any Converter', 'Extensible converter for multiple formats.', 'converters', 'ArrowLeftRight', '/apps/any-converter', 'idea', '0.1.0'),
('url-encoder', 'URL Encoder / Decoder', 'Encode and decode URLs and query parameters.', 'encoding', 'Globe', '/apps/url-encoder', 'idea', '0.1.0'),
('html-encoder', 'HTML Encoder / Decoder', 'Encode special characters to HTML entities.', 'encoding', 'Code', '/apps/html-encoder', 'idea', '0.1.0'),
('jwt-decoder', 'JWT Decoder / Encoder', 'Decode JWT tokens and generate signed tokens.', 'encoding', 'Key', '/apps/jwt-decoder', 'idea', '0.1.0'),
('hex-converter', 'Hex / Binary Converter', 'Convert text to hex, binary, and back.', 'encoding', 'Binary', '/apps/hex-converter', 'idea', '0.1.0');

-- Insert app versions
INSERT IGNORE INTO app_versions (app_id, version, changes) VALUES
('scrapper-pro', '1.0.0', 'Initial release with multi-engine search'),
('image-labeler', '1.0.0', 'Folder picker support, label/tag management'),
('creator-svg', '1.0.0', 'Dark/light themes, tech stack pills, PNG export'),
('crypto-track', '1.0.0', 'CoinGecko/CoinPaprika support, demo fallback'),
('weather-now', '1.0.0', 'Live API + dummy mode, bulk EU cities'),
('pariflow-smpl', '1.0.0', 'MCP CLI setup guide, API key integration'),
('resume-forge', '1.0.0', 'SVG header builder, tech stack visualization'),
('pitch-deck', '1.0.0', 'Template editor, live preview, PDF export'),
('invoice-studio', '1.0.0', 'Invoice generation, time tracking, client management'),
('source-grade', '1.0.0', 'Source scoring dashboard, reliability metrics'),
('link-checker', '1.0.0', 'Bulk URL checking, status reporting, CSV export');
