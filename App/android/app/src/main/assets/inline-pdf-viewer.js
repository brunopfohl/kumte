// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global navigation functions
window.pdfViewerGoToPage = function(pageNumber) {
    if (window.scrollToPage) {
        window.scrollToPage(pageNumber);
    }
};

window.pdfViewerGoToNextPage = function() {
    if (window.scrollToNextPage) {
        window.scrollToNextPage();
    }
};

window.pdfViewerGoToPreviousPage = function() {
    if (window.scrollToPreviousPage) {
        window.scrollToPreviousPage();
    }
};

// Get UI elements
const messageContainer = document.getElementById('messageContainer');
const viewerContainer = document.getElementById('viewerContainer');
const pdfContainer = document.getElementById('pdfContainer');
const controls = document.getElementById('controls');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageNumberInput = document.getElementById('pageNumber');
const pageCountSpan = document.getElementById('pageCount');

// State variables
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let currentScale = 1.0;
let pageElements = [];

// Process the PDF data
window.processPdfData = function(dataUri) {
    messageContainer.innerHTML = '<div class="loadingMessage">Loading PDF...</div>';
    
    try {
        if (!dataUri.startsWith('data:application/pdf;base64,')) {
            throw new Error('Invalid PDF data URI');
        }
        
        // Extract base64 data and create array buffer
        const base64Data = dataUri.substring(dataUri.indexOf(',') + 1);
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Load the PDF
        pdfjsLib.getDocument({ data: bytes }).promise.then(function(pdf) {
            pdfDoc = pdf;
            totalPages = pdf.numPages;
            pageCountSpan.textContent = '/ ' + totalPages;
            
            // Notify React Native that the PDF is loaded
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'loaded',
                    pageCount: totalPages,
                    currentPage: 1
                }));
            }
            
            // Calculate initial scale
            pdf.getPage(1).then(function(page) {
                const viewport = page.getViewport({ scale: 1.0 });
                const viewerWidth = viewerContainer.clientWidth;
                const horizontalPadding = 40;
                currentScale = (viewerWidth - horizontalPadding) / viewport.width;
                
                // Clear loading indicator
                messageContainer.innerHTML = '';
                
                // Load all pages at once
                loadAllPages();
                
                // Set up navigation controls
                setupNavigation();
                
                // Show controls
                if (!shouldHideControls()) {
                    controls.style.display = 'block';
                }
            });
        }).catch(function(error) {
            showError('Error loading PDF: ' + error.message);
        });
    } catch (error) {
        showError('Error processing PDF data: ' + error.message);
    }
};

// Alias for compatibility
window.loadPdfFromDataUri = window.processPdfData;

// Show error message
function showError(message) {
    messageContainer.innerHTML = '<div class="errorMessage">Error: ' + message + '</div>';
    if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'error', 
            message: message 
        }));
    }
}

// Check if controls should be hidden
function shouldHideControls() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('hideControls') === 'true';
}

// Load all PDF pages at once
function loadAllPages() {
    pdfContainer.innerHTML = '';
    pageElements = [];
    
    // Load all pages in sequence
    const loadPagePromises = [];
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        loadPagePromises.push(renderPageToContainer(pageNum));
    }
    
    Promise.all(loadPagePromises).then(() => {
        console.log('All pages loaded successfully');
    });
}

// Render a page to the container
function renderPageToContainer(pageNum) {
    return pdfDoc.getPage(pageNum).then(function(page) {
        const viewport = page.getViewport({ scale: currentScale });
        const pixelRatio = window.devicePixelRatio || 1;
        const renderViewport = page.getViewport({ scale: currentScale * pixelRatio });
        
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        pageDiv.dataset.pageNum = pageNum;
        pageDiv.style.width = viewport.width + 'px';
        pageDiv.style.height = viewport.height + 'px';
        pageDiv.style.position = 'relative';
        pageDiv.style.margin = '10px auto';
        pdfContainer.appendChild(pageDiv);
        pageElements.push(pageDiv);
        
        const canvas = document.createElement('canvas');
        canvas.id = 'page-' + pageNum;
        const context = canvas.getContext('2d');
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        canvas.style.width = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';
        pageDiv.appendChild(canvas);
        
        const textLayerDiv = document.createElement('div');
        textLayerDiv.className = 'textLayer';
        textLayerDiv.style.width = viewport.width + 'px';
        textLayerDiv.style.height = viewport.height + 'px';
        pageDiv.appendChild(textLayerDiv);
        
        const renderContext = {
            canvasContext: context,
            viewport: renderViewport
        };
        
        return page.render(renderContext).promise.then(function() {
            return page.getTextContent();
        }).then(function(textContent) {
            pdfjsLib.renderTextLayer({
                textContent: textContent,
                container: textLayerDiv,
                viewport: viewport,
                textDivs: []
            });
        });
    });
}

// Set up navigation
function setupNavigation() {
    // Define scroll functions
    window.scrollToPage = function(pageNum) {
        if (pageNum < 1 || pageNum > totalPages) return;
        
        currentPage = pageNum;
        pageNumberInput.value = currentPage;
        
        if (pageElements[pageNum - 1]) {
            pageElements[pageNum - 1].scrollIntoView({ behavior: 'smooth' });
            
            // Update navigation controls
            updateNavigationControls();
            
            // Notify React Native of page change
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'pageChanged',
                    currentPage: currentPage
                }));
            }
        }
    };
    
    window.scrollToNextPage = function() {
        if (currentPage < totalPages) {
            window.scrollToPage(currentPage + 1);
        }
    };
    
    window.scrollToPreviousPage = function() {
        if (currentPage > 1) {
            window.scrollToPage(currentPage - 1);
        }
    };
    
    // Add scroll observer to update current page
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageNum = parseInt(entry.target.dataset.pageNum);
                if (pageNum !== currentPage) {
                    currentPage = pageNum;
                    pageNumberInput.value = currentPage;
                    updateNavigationControls();
                    
                    // Notify React Native
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'pageChanged',
                            currentPage: currentPage
                        }));
                    }
                }
            }
        });
    }, { threshold: 0.5 });
    
    // Observe all page elements
    pageElements.forEach(pageEl => {
        observer.observe(pageEl);
    });
    
    // Set up button handlers
    prevPageBtn.addEventListener('click', window.scrollToPreviousPage);
    nextPageBtn.addEventListener('click', window.scrollToNextPage);
    
    pageNumberInput.addEventListener('change', function() {
        const pageNum = parseInt(pageNumberInput.value);
        if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
            window.scrollToPage(pageNum);
        }
    });
    
    // Initial update of controls
    updateNavigationControls();
}

// Update navigation controls
function updateNavigationControls() {
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// Listen for text selection events
document.addEventListener('selectionchange', function() {
    const selection = document.getSelection();
    if (selection && selection.toString().trim()) {
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'textSelected',
                selectedText: selection.toString().trim()
            }));
        }
    }
});

// Handle messages from React Native (Android)
document.addEventListener('message', function(event) {
    try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'command') {
            switch(message.action) {
                case 'goToPage':
                    if (message.pageNumber && window.scrollToPage) {
                        window.scrollToPage(message.pageNumber);
                    }
                    break;
                case 'goToNextPage':
                    if (window.scrollToNextPage) {
                        window.scrollToNextPage();
                    }
                    break;
                case 'goToPreviousPage':
                    if (window.scrollToPreviousPage) {
                        window.scrollToPreviousPage();
                    }
                    break;
            }
        } else if (message.type === 'loadDataUri') {
            window.processPdfData(message.dataUri);
        }
    } catch (e) {
        console.error('Error processing message:', e);
    }
});

// Also listen for window messages (iOS/Web)
window.addEventListener('message', function(event) {
    try {
        const messageData = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
        const message = JSON.parse(messageData);
        
        if (message.type === 'command') {
            switch(message.action) {
                case 'goToPage':
                    if (message.pageNumber && window.scrollToPage) {
                        window.scrollToPage(message.pageNumber);
                    }
                    break;
                case 'goToNextPage':
                    if (window.scrollToNextPage) {
                        window.scrollToNextPage();
                    }
                    break;
                case 'goToPreviousPage':
                    if (window.scrollToPreviousPage) {
                        window.scrollToPreviousPage();
                    }
                    break;
            }
        } else if (message.type === 'loadDataUri') {
            window.processPdfData(message.dataUri);
        }
    } catch (e) {
        console.error('Error processing window message:', e);
    }
});

// Log that the script has loaded
console.log('PDF viewer script has loaded successfully'); 