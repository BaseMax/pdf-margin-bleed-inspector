// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

class PDFMarginInspector {
    constructor() {
        this.pdfDoc = null;
        this.analysisResults = [];
        this.bleedSize = 3; // mm
        this.marginThreshold = 5; // mm
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const exportJsonBtn = document.getElementById('exportJson');
        const exportCsvBtn = document.getElementById('exportCsv');
        const bleedSizeInput = document.getElementById('bleedSize');
        const marginThresholdInput = document.getElementById('marginThreshold');

        // Upload area click
        uploadArea.addEventListener('click', () => fileInput.click());

        // File input change
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        // Analyze button
        analyzeBtn.addEventListener('click', () => this.analyzePDF());

        // Export buttons
        exportJsonBtn.addEventListener('click', () => this.exportJSON());
        exportCsvBtn.addEventListener('click', () => this.exportCSV());

        // Settings
        bleedSizeInput.addEventListener('change', (e) => {
            this.bleedSize = parseFloat(e.target.value);
        });

        marginThresholdInput.addEventListener('change', (e) => {
            this.marginThreshold = parseFloat(e.target.value);
        });
    }

    async handleFileSelect(file) {
        if (!file || file.type !== 'application/pdf') {
            alert('Please select a valid PDF file');
            return;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
            
            document.getElementById('controlsSection').style.display = 'block';
            document.getElementById('resultsSection').style.display = 'none';
            
            console.log(`PDF loaded: ${this.pdfDoc.numPages} pages`);
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Error loading PDF file');
        }
    }

    async analyzePDF() {
        if (!this.pdfDoc) {
            alert('Please load a PDF first');
            return;
        }

        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
        this.analysisResults = [];

        try {
            for (let pageNum = 1; pageNum <= this.pdfDoc.numPages; pageNum++) {
                const result = await this.analyzePage(pageNum);
                this.analysisResults.push(result);
            }

            this.displayResults();
        } catch (error) {
            console.error('Error analyzing PDF:', error);
            alert('Error analyzing PDF');
        } finally {
            document.getElementById('loadingIndicator').style.display = 'none';
        }
    }

    async analyzePage(pageNum) {
        const page = await this.pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page to canvas
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        // Get page dimensions in points (1 point = 1/72 inch)
        const pageWidth = page.view[2] - page.view[0];
        const pageHeight = page.view[3] - page.view[1];

        // Analyze margins by detecting content boundaries
        const margins = this.detectMargins(context, canvas.width, canvas.height);

        // Convert pixel margins to mm (assuming 72 DPI standard)
        const scale = viewport.scale;
        const pxToMm = (px) => (px / scale) * 0.3527778; // points to mm conversion

        const result = {
            pageNumber: pageNum,
            pageWidth: (pageWidth * 0.3527778).toFixed(2), // mm
            pageHeight: (pageHeight * 0.3527778).toFixed(2), // mm
            margins: {
                top: pxToMm(margins.top).toFixed(2),
                bottom: pxToMm(margins.bottom).toFixed(2),
                left: pxToMm(margins.left).toFixed(2),
                right: pxToMm(margins.right).toFixed(2)
            },
            bleed: {
                size: this.bleedSize,
                hasTopBleed: pxToMm(margins.top) <= this.bleedSize,
                hasBottomBleed: pxToMm(margins.bottom) <= this.bleedSize,
                hasLeftBleed: pxToMm(margins.left) <= this.bleedSize,
                hasRightBleed: pxToMm(margins.right) <= this.bleedSize
            },
            trimArea: {
                width: (pageWidth * 0.3527778 - pxToMm(margins.left) - pxToMm(margins.right)).toFixed(2),
                height: (pageHeight * 0.3527778 - pxToMm(margins.top) - pxToMm(margins.bottom)).toFixed(2)
            },
            canvas: canvas,
            margins_px: margins
        };

        return result;
    }

    detectMargins(context, width, height) {
        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Function to check if a pixel is "content" (not white/empty)
        const isContent = (r, g, b, a) => {
            const threshold = 250;
            return a > 10 && (r < threshold || g < threshold || b < threshold);
        };

        // Detect top margin
        let topMargin = 0;
        outerTop: for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (isContent(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) {
                    topMargin = y;
                    break outerTop;
                }
            }
        }

        // Detect bottom margin
        let bottomMargin = 0;
        outerBottom: for (let y = height - 1; y >= 0; y--) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (isContent(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) {
                    bottomMargin = height - y - 1;
                    break outerBottom;
                }
            }
        }

        // Detect left margin
        let leftMargin = 0;
        outerLeft: for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const idx = (y * width + x) * 4;
                if (isContent(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) {
                    leftMargin = x;
                    break outerLeft;
                }
            }
        }

        // Detect right margin
        let rightMargin = 0;
        outerRight: for (let x = width - 1; x >= 0; x--) {
            for (let y = 0; y < height; y++) {
                const idx = (y * width + x) * 4;
                if (isContent(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) {
                    rightMargin = width - x - 1;
                    break outerRight;
                }
            }
        }

        return {
            top: topMargin,
            bottom: bottomMargin,
            left: leftMargin,
            right: rightMargin
        };
    }

    displayResults() {
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.style.display = 'block';

        this.displayUniformityReport();
        this.displayPageAnalysis();
    }

    displayUniformityReport() {
        const uniformityContent = document.getElementById('uniformityContent');
        
        // Calculate statistics
        const margins = {
            top: this.analysisResults.map(r => parseFloat(r.margins.top)),
            bottom: this.analysisResults.map(r => parseFloat(r.margins.bottom)),
            left: this.analysisResults.map(r => parseFloat(r.margins.left)),
            right: this.analysisResults.map(r => parseFloat(r.margins.right))
        };

        const stats = {
            top: this.calculateStats(margins.top),
            bottom: this.calculateStats(margins.bottom),
            left: this.calculateStats(margins.left),
            right: this.calculateStats(margins.right)
        };

        // Check uniformity
        const isUniform = (values, threshold = this.marginThreshold) => {
            const max = Math.max(...values);
            const min = Math.min(...values);
            return (max - min) <= threshold;
        };

        const uniformityStatus = {
            top: isUniform(margins.top),
            bottom: isUniform(margins.bottom),
            left: isUniform(margins.left),
            right: isUniform(margins.right)
        };

        const allUniform = Object.values(uniformityStatus).every(v => v);

        let html = `
            <div class="uniformity-stats">
                <div class="stat-item">
                    <div class="stat-label">Total Pages</div>
                    <div class="stat-value">${this.analysisResults.length}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Top Margin Range</div>
                    <div class="stat-value ${uniformityStatus.top ? 'success' : 'warning'}">
                        ${stats.top.min} - ${stats.top.max} mm
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Bottom Margin Range</div>
                    <div class="stat-value ${uniformityStatus.bottom ? 'success' : 'warning'}">
                        ${stats.bottom.min} - ${stats.bottom.max} mm
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Left Margin Range</div>
                    <div class="stat-value ${uniformityStatus.left ? 'success' : 'warning'}">
                        ${stats.left.min} - ${stats.left.max} mm
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Right Margin Range</div>
                    <div class="stat-value ${uniformityStatus.right ? 'success' : 'warning'}">
                        ${stats.right.min} - ${stats.right.max} mm
                    </div>
                </div>
            </div>
        `;

        if (allUniform) {
            html += `
                <div class="alert alert-success">
                    ✓ All margins are uniform across all pages (within ${this.marginThreshold}mm threshold)
                </div>
            `;
        } else {
            const inconsistentMargins = [];
            if (!uniformityStatus.top) inconsistentMargins.push('top');
            if (!uniformityStatus.bottom) inconsistentMargins.push('bottom');
            if (!uniformityStatus.left) inconsistentMargins.push('left');
            if (!uniformityStatus.right) inconsistentMargins.push('right');

            html += `
                <div class="alert alert-warning">
                    ⚠ Inconsistent margins detected: ${inconsistentMargins.join(', ')}
                    <br>Variation exceeds ${this.marginThreshold}mm threshold
                </div>
            `;
        }

        uniformityContent.innerHTML = html;
    }

    displayPageAnalysis() {
        const pagesContent = document.getElementById('pagesContent');
        pagesContent.innerHTML = '';

        this.analysisResults.forEach((result, index) => {
            const isConsistent = this.isPageConsistent(result, index);
            
            const pageCard = document.createElement('div');
            pageCard.className = `page-card ${isConsistent ? '' : 'inconsistent'}`;

            const bleedStatus = [];
            if (result.bleed.hasTopBleed) bleedStatus.push('top');
            if (result.bleed.hasBottomBleed) bleedStatus.push('bottom');
            if (result.bleed.hasLeftBleed) bleedStatus.push('left');
            if (result.bleed.hasRightBleed) bleedStatus.push('right');

            pageCard.innerHTML = `
                <div class="page-header">
                    <div class="page-title">Page ${result.pageNumber}</div>
                    <span class="page-badge ${isConsistent ? 'badge-consistent' : 'badge-inconsistent'}">
                        ${isConsistent ? 'Consistent' : 'Inconsistent'}
                    </span>
                </div>
                <div class="page-content">
                    <div class="page-visualization">
                        <div class="canvas-container" id="canvas-container-${result.pageNumber}">
                        </div>
                    </div>
                    <div class="page-details">
                        <div class="detail-group">
                            <h4>Page Dimensions</h4>
                            <div class="detail-row">
                                <span class="detail-label">Width:</span>
                                <span class="detail-value">${result.pageWidth} mm</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Height:</span>
                                <span class="detail-value">${result.pageHeight} mm</span>
                            </div>
                        </div>
                        <div class="detail-group">
                            <h4>Margins</h4>
                            <div class="detail-row">
                                <span class="detail-label">Top:</span>
                                <span class="detail-value">${result.margins.top} mm</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Bottom:</span>
                                <span class="detail-value">${result.margins.bottom} mm</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Left (Inner):</span>
                                <span class="detail-value">${result.margins.left} mm</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Right (Outer):</span>
                                <span class="detail-value">${result.margins.right} mm</span>
                            </div>
                        </div>
                        <div class="detail-group">
                            <h4>Trim Area</h4>
                            <div class="detail-row">
                                <span class="detail-label">Width:</span>
                                <span class="detail-value">${result.trimArea.width} mm</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Height:</span>
                                <span class="detail-value">${result.trimArea.height} mm</span>
                            </div>
                        </div>
                        <div class="detail-group">
                            <h4>Bleed Detection (${this.bleedSize}mm)</h4>
                            <div class="detail-row">
                                <span class="detail-label">Bleeds Present:</span>
                                <span class="detail-value">${bleedStatus.length > 0 ? bleedStatus.join(', ') : 'none'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            pagesContent.appendChild(pageCard);

            // Add canvas with margin overlay
            const container = document.getElementById(`canvas-container-${result.pageNumber}`);
            const displayCanvas = this.createDisplayCanvas(result);
            container.appendChild(displayCanvas);
        });
    }

    createDisplayCanvas(result) {
        const maxWidth = 400;
        const scale = maxWidth / result.canvas.width;
        
        const displayCanvas = document.createElement('canvas');
        displayCanvas.className = 'page-canvas';
        displayCanvas.width = result.canvas.width * scale;
        displayCanvas.height = result.canvas.height * scale;
        
        const ctx = displayCanvas.getContext('2d');
        ctx.drawImage(result.canvas, 0, 0, displayCanvas.width, displayCanvas.height);

        // Draw margin overlay
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        const margins = result.margins_px;
        const scaledMargins = {
            top: margins.top * scale,
            bottom: margins.bottom * scale,
            left: margins.left * scale,
            right: margins.right * scale
        };

        // Draw margin lines
        ctx.beginPath();
        // Top
        ctx.moveTo(0, scaledMargins.top);
        ctx.lineTo(displayCanvas.width, scaledMargins.top);
        // Bottom
        ctx.moveTo(0, displayCanvas.height - scaledMargins.bottom);
        ctx.lineTo(displayCanvas.width, displayCanvas.height - scaledMargins.bottom);
        // Left
        ctx.moveTo(scaledMargins.left, 0);
        ctx.lineTo(scaledMargins.left, displayCanvas.height);
        // Right
        ctx.moveTo(displayCanvas.width - scaledMargins.right, 0);
        ctx.lineTo(displayCanvas.width - scaledMargins.right, displayCanvas.height);
        ctx.stroke();

        return displayCanvas;
    }

    isPageConsistent(result, index) {
        if (this.analysisResults.length === 1) return true;

        // Compare with first page
        const first = this.analysisResults[0];
        const threshold = this.marginThreshold;

        return (
            Math.abs(parseFloat(result.margins.top) - parseFloat(first.margins.top)) <= threshold &&
            Math.abs(parseFloat(result.margins.bottom) - parseFloat(first.margins.bottom)) <= threshold &&
            Math.abs(parseFloat(result.margins.left) - parseFloat(first.margins.left)) <= threshold &&
            Math.abs(parseFloat(result.margins.right) - parseFloat(first.margins.right)) <= threshold
        );
    }

    calculateStats(values) {
        const min = Math.min(...values).toFixed(2);
        const max = Math.max(...values).toFixed(2);
        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
        return { min, max, avg };
    }

    exportJSON() {
        const data = {
            metadata: {
                totalPages: this.analysisResults.length,
                bleedSize: this.bleedSize,
                marginThreshold: this.marginThreshold,
                analysisDate: new Date().toISOString()
            },
            pages: this.analysisResults.map(r => ({
                pageNumber: r.pageNumber,
                dimensions: {
                    width: r.pageWidth,
                    height: r.pageHeight
                },
                margins: r.margins,
                trimArea: r.trimArea,
                bleed: {
                    size: r.bleed.size,
                    hasTopBleed: r.bleed.hasTopBleed,
                    hasBottomBleed: r.bleed.hasBottomBleed,
                    hasLeftBleed: r.bleed.hasLeftBleed,
                    hasRightBleed: r.bleed.hasRightBleed
                }
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadFile(blob, 'pdf-margin-analysis.json');
    }

    exportCSV() {
        let csv = 'Page,Width (mm),Height (mm),Top Margin (mm),Bottom Margin (mm),Left Margin (mm),Right Margin (mm),Trim Width (mm),Trim Height (mm),Has Top Bleed,Has Bottom Bleed,Has Left Bleed,Has Right Bleed\n';

        this.analysisResults.forEach(r => {
            csv += `${r.pageNumber},${r.pageWidth},${r.pageHeight},${r.margins.top},${r.margins.bottom},${r.margins.left},${r.margins.right},${r.trimArea.width},${r.trimArea.height},${r.bleed.hasTopBleed},${r.bleed.hasBottomBleed},${r.bleed.hasLeftBleed},${r.bleed.hasRightBleed}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadFile(blob, 'pdf-margin-analysis.csv');
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the application
const inspector = new PDFMarginInspector();
