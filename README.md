# PDF Margin & Bleed Inspector

A browser-based tool to detect page margins, trim areas, and bleeds in PDFs. Flags inconsistent margins across pages and generates visual reports for print-ready documents.

## 🎯 What it does

- **Detects page margins** - Automatically identifies top, bottom, left (inner), and right (outer) margins on each page
- **Estimates bleed and trim areas** - Calculates the printable area and detects if content extends to bleed zones
- **Flags inconsistent margins** - Identifies pages with margins that deviate from the expected uniform margins across the document
- **Generates visual reports** - Provides per-page visualization with margin overlays in red dashed lines

## 💡 Why it's valuable

Margins and bleed errors are among the most common reasons for print rejection. This tool helps designers and printers validate documents before sending them to production, saving time and reducing costly reprints.

## ✨ Core Features

### Per-Page Margin Visualization
- Visual representation of each page with margin boundaries highlighted
- Red dashed lines show detected content boundaries
- Canvas rendering shows actual page content

### Uniformity Report
- Statistical analysis across all pages
- Margin range displays (min-max values)
- Color-coded alerts for consistency issues
- Configurable tolerance threshold

### Export Capabilities
- **JSON Export** - Complete analysis data in structured JSON format with metadata
- **CSV Export** - Tabular data suitable for spreadsheet analysis and reporting

### Configurable Parameters
- **Bleed Size** (default: 3mm) - Expected bleed area for print-ready documents
- **Margin Threshold** (default: 5mm) - Tolerance for margin variation detection

## 🚀 Getting Started

### Quick Start

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
2. Drag and drop a PDF file onto the upload area, or click to browse
3. Adjust bleed size and margin threshold if needed
4. Click "Analyze PDF" to process the document
5. Review the uniformity report and per-page analysis
6. Export results as JSON or CSV for further analysis

### Requirements

- Modern web browser with JavaScript enabled
- Internet connection (for PDF.js CDN library)
- No server or installation required - runs entirely in the browser

### Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## 📊 Understanding the Analysis

### Margins
- **Top Margin**: Distance from top of page to first content
- **Bottom Margin**: Distance from last content to bottom of page
- **Left Margin (Inner)**: Distance from left edge to content (inner margin for bound documents)
- **Right Margin (Outer)**: Distance from content to right edge (outer margin for bound documents)

### Bleed Detection
The tool checks if content extends into the bleed zone (typically 3mm from page edge). This is essential for full-bleed printing where content should extend beyond the trim line.

### Trim Area
The calculated printable area after accounting for margins. This represents the safe zone where all critical content should be placed.

### Uniformity Status
- **Consistent**: Page margins match the first page within the threshold
- **Inconsistent**: Page margins vary beyond the acceptable threshold

## 🛠️ Technical Details

### Architecture
- **Frontend Only**: Pure HTML5, CSS3, and vanilla JavaScript
- **PDF Processing**: PDF.js library for rendering and analysis
- **No Backend**: All processing happens client-side in the browser

### Margin Detection Algorithm
1. Renders each PDF page to HTML5 canvas at 2x scale for accuracy
2. Analyzes pixel data to detect content boundaries
3. Scans from edges inward to find first non-white pixels
4. Converts pixel measurements to millimeters using PDF coordinate system
5. Compares margins across pages to detect inconsistencies

### Performance
- Processes typical documents (10-50 pages) in seconds
- Larger documents may take longer depending on complexity
- All processing is asynchronous with progress indication

## 📁 Project Structure

```
pdf-margin-bleed-inspector/
├── index.html          # Main HTML structure
├── styles.css          # Styling and responsive design
├── app.js             # Core application logic
├── README.md          # Documentation
├── LICENSE            # License information
└── .gitignore         # Git ignore rules
```

## 🔍 Example Use Cases

1. **Pre-Press Validation**: Verify margins before sending to printer
2. **Book/Magazine Layout**: Ensure consistent inner/outer margins for binding
3. **Bleed Checking**: Confirm full-bleed designs extend properly
4. **Quality Control**: Batch check multiple documents for margin compliance
5. **Print Shop**: Quick verification of client-submitted files

## ⚙️ Configuration

The tool provides two main configuration options:

### Bleed Size (mm)
Typical values:
- **3mm**: Standard for most commercial printing
- **5mm**: Used for some large format or specialty printing
- **0mm**: For documents without bleed requirements

### Margin Threshold (mm)
Recommended values:
- **5mm**: Standard tolerance for most documents
- **2mm**: Strict tolerance for precise layouts
- **10mm**: Relaxed tolerance for less critical documents

## 📤 Export Formats

### JSON Export
Complete analysis data including:
- Document metadata (total pages, settings, analysis date)
- Per-page dimensions, margins, trim areas
- Bleed detection status for all edges

### CSV Export
Spreadsheet-compatible format with columns:
- Page number
- Page dimensions (width, height)
- All margin values
- Trim area dimensions
- Bleed detection flags

## 🐛 Troubleshooting

**PDF.js library not loading?**
- Check internet connection
- Disable ad blockers that might block CDN resources
- Verify cdnjs.cloudflare.com is accessible

**Inaccurate margin detection?**
- Ensure PDF has actual content (not just images with white space)
- Try adjusting detection sensitivity
- Check if PDF uses non-standard page sizes

**Slow performance?**
- Large PDFs with many pages take longer to process
- Complex pages with many elements require more processing
- Consider analyzing in smaller batches

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs or issues
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is licensed under the GPL-3.0 License - see the LICENSE file for details.

## 👤 Author

Created by [BaseMax](https://github.com/BaseMax)

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla for PDF rendering capabilities
- Modern browser vendors for Canvas API support
