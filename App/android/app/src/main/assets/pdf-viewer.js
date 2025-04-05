// Configure the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';

// Define global navigation functions immediately
window.pdfViewerGoToPage = function(pageNumber) {
    console.log('Global pdfViewerGoToPage called with pageNumber:', pageNumber);
    if (window.goToPage) {
        window.goToPage(pageNumber);
    } else {
        console.error('PDF viewer not initialized - goToPage not available');
    }
};

window.pdfViewerGoToNextPage = function() {
    console.log('Global pdfViewerGoToNextPage called');
    if (window.goToNextPage) {
        window.goToNextPage();
    } else {
        console.error('PDF viewer not initialized - goToNextPage not available');
    }
};

window.pdfViewerGoToPreviousPage = function() {
    console.log('Global pdfViewerGoToPreviousPage called');
    if (window.goToPreviousPage) {
        window.goToPreviousPage();
    } else {
        console.error('PDF viewer not initialized - goToPreviousPage not available');
    }
};

// Handle document messages from React Native (Android)
document.addEventListener('message', function(event) {
    console.log('Document message received in pdf-viewer.js:', event.data);
    try {
        const message = JSON.parse(event.data);
        
        // Handle different message types
        if (message.type === 'command') {
            console.log('Command received:', message.action);
            
            switch(message.action) {
                case 'goToPage':
                    if (message.pageNumber && window.goToPage) {
                        window.goToPage(message.pageNumber);
                    }
                    break;
                case 'goToNextPage':
                    if (window.goToNextPage) {
                        window.goToNextPage();
                    }
                    break;
                case 'goToPreviousPage':
                    if (window.goToPreviousPage) {
                        window.goToPreviousPage();
                    }
                    break;
                default:
                    console.warn('Unknown command:', message.action);
            }
        } else if (message.type === 'loadDataUri') {
            console.log('Loading PDF from data URI');
            window.loadPdfFromDataUri(message.dataUri);
        } else if (message.type === 'loadUrl') {
            console.log('Loading PDF from URL');
            window.loadPdfFromUrl(message.url);
        }
    } catch (e) {
        console.error('Error processing document message:', e);
    }
});

// Also listen for window messages as a fallback (iOS/Web)
window.addEventListener('message', function(event) {
    console.log('Window message received in pdf-viewer.js:', event.data);
    try {
        // Handle both string data and MessageEvent.data objects
        const messageData = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
        const message = JSON.parse(messageData);
        
        // Handle different message types
        if (message.type === 'command') {
            console.log('Command received via window event:', message.action);
            
            switch(message.action) {
                case 'goToPage':
                    if (message.pageNumber && window.goToPage) {
                        window.goToPage(message.pageNumber);
                    }
                    break;
                case 'goToNextPage':
                    if (window.goToNextPage) {
                        window.goToNextPage();
                    }
                    break;
                case 'goToPreviousPage':
                    if (window.goToPreviousPage) {
                        window.goToPreviousPage();
                    }
                    break;
                default:
                    console.warn('Unknown command:', message.action);
            }
        } else if (message.type === 'loadDataUri') {
            console.log('Loading PDF from data URI (window event)');
            window.loadPdfFromDataUri(message.dataUri);
        } else if (message.type === 'loadUrl') {
            console.log('Loading PDF from URL (window event)');
            window.loadPdfFromUrl(message.url);
        }
    } catch (e) {
        console.error('Error processing window message:', e);
    }
});

// Variables to track state
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.0;
let isReady = false;
let canvas = null;
let ctx = null;
let pageCountElement = null;
let pageNumElement = null;
let loadingTimeout = null;
let maxZoom = 3.0;
let minZoom = 0.5;
let zoomStep = 0.2;
let startX, startY, startDistance;
let currentTouches = [];

// Initialize PDF viewer when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing PDF viewer');
    
    // Clear any existing loading timeouts
    if (loadingTimeout) {
        clearTimeout(loadingTimeout);
    }
    
    // Initialize UI elements
    canvas = document.getElementById('pdf-canvas');
    ctx = canvas.getContext('2d');
    pageCountElement = document.getElementById('page-count');
    pageNumElement = document.getElementById('page-num');
    
    // Set up touch and wheel handlers
    setupHandlers();
    
    // Check for URL params to hide controls
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('hideControls') === 'true') {
        let controls = document.getElementById('pdf-controls');
        if (controls) {
            controls.style.display = 'none';
        }
    }
    
    // Get file URL from query params
    const fileParam = urlParams.get('file');
    if (fileParam) {
        loadPdfFromUrl(decodeURIComponent(fileParam));
    } else {
        // If no file param, wait for message from React Native
        isReady = true;
        console.log('No file parameter found, waiting for message...');
        sendMessageToReactNative({
            type: 'loaded',
            message: 'PDF viewer initialized, waiting for document'
        });
    }
});

// Send message to React Native
function sendMessageToReactNative(message) {
    try {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
    } catch (e) {
        console.error('Error sending message to React Native:', e);
    }
}

// Load PDF from URL
function loadPdfFromUrl(url) {
    console.log('Loading PDF from URL:', url);
    
    // Set loading timeout
    loadingTimeout = setTimeout(function() {
        sendMessageToReactNative({
            type: 'error',
            message: 'PDF loading timeout'
        });
    }, 30000); // 30 seconds timeout
    
    // Load the PDF
    const loadingTask = pdfjsLib.getDocument(url);
    
    loadingTask.promise
        .then(function(pdf) {
            // Clear loading timeout
            if (loadingTimeout) {
                clearTimeout(loadingTimeout);
                loadingTimeout = null;
            }
            
            console.log('PDF loaded with ' + pdf.numPages + ' pages');
            pdfDoc = pdf;
            
            // Update page count
            if (pageCountElement) {
                pageCountElement.textContent = pdf.numPages;
            }
            
            // Send pageCount to React Native
            sendMessageToReactNative({
                type: 'loaded',
                pageCount: pdf.numPages,
                currentPage: 1
            });
            
            isReady = true;
            
            // Render first page
            renderPage(1);
        })
        .catch(function(error) {
            // Clear loading timeout
            if (loadingTimeout) {
                clearTimeout(loadingTimeout);
                loadingTimeout = null;
            }
            
            console.error('Error loading PDF:', error);
            sendMessageToReactNative({
      type: 'error',
                message: 'Failed to load PDF: ' + error.message
            });
        });
}

// Load PDF from data URI
function loadPdfFromDataUri(dataUri) {
    console.log('Loading PDF from data URI');
    
    // Decode base64 data URI
    try {
        const pdfData = atob(dataUri.split(',')[1]);
        const loadingTask = pdfjsLib.getDocument({data: pdfData});
        
        loadingTask.promise
            .then(function(pdf) {
                console.log('PDF loaded with ' + pdf.numPages + ' pages');
                pdfDoc = pdf;
                
                // Update page count
                if (pageCountElement) {
                    pageCountElement.textContent = pdf.numPages;
                }
                
                // Send pageCount to React Native
                sendMessageToReactNative({
                    type: 'loaded',
                    pageCount: pdf.numPages,
                    currentPage: 1
                });
                
                isReady = true;
                
                // Render first page
                renderPage(1);
            })
            .catch(function(error) {
                console.error('Error loading PDF:', error);
                sendMessageToReactNative({
                    type: 'error',
                    message: 'Failed to load PDF: ' + error.message
                });
            });
    } catch (e) {
        console.error('Error decoding data URI:', e);
        sendMessageToReactNative({
            type: 'error',
            message: 'Failed to decode data URI: ' + e.message
        });
    }
}

// Function to render a specific page
function renderPage(num) {
    pageRendering = true;
    
    // Update page number display
    if (pageNumElement) {
        pageNumElement.textContent = num;
    }
    
    // Using promise to fetch the page
    pdfDoc.getPage(num).then(function(page) {
        console.log('Rendering page', num);
        
        // Calculate the scale to fit the page in the canvas
        const viewport = page.getViewport({scale: scale});
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        // Wait for rendering to finish
        renderTask.promise.then(function() {
            pageRendering = false;
            
            // Send page change notification
            sendMessageToReactNative({
                type: 'pageChanged',
                currentPage: pageNum
            });
            
            if (pageNumPending !== null) {
                // New page rendering is pending
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    }).catch(function(error) {
        console.error('Error rendering page:', error);
        pageRendering = false;
        
        sendMessageToReactNative({
            type: 'error',
            message: 'Error rendering page: ' + error.message
        });
    });
}

// Navigation functions
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function goToPage(num) {
    console.log('goToPage called with page:', num);
    if (!pdfDoc) {
        console.error('PDF not loaded yet');
        return;
    }
    
    if (num < 1 || num > pdfDoc.numPages) {
        console.warn('Invalid page number:', num);
        return;
    }
    
    pageNum = num;
    queueRenderPage(num);
}

function goToNextPage() {
    console.log('goToNextPage called');
    if (!pdfDoc) {
        console.error('PDF not loaded yet');
        return;
    }
    
    if (pageNum >= pdfDoc.numPages) {
        console.log('Already at last page');
        return;
    }
    
    pageNum++;
    queueRenderPage(pageNum);
}

function goToPreviousPage() {
    console.log('goToPreviousPage called');
    if (!pdfDoc) {
        console.error('PDF not loaded yet');
        return;
    }
    
    if (pageNum <= 1) {
        console.log('Already at first page');
        return;
    }
    
    pageNum--;
    queueRenderPage(pageNum);
}

// Zoom functions
function zoomIn() {
    if (scale < maxZoom) {
        scale += zoomStep;
        queueRenderPage(pageNum);
    }
}

function zoomOut() {
    if (scale > minZoom) {
        scale -= zoomStep;
        queueRenderPage(pageNum);
    }
}

// Setup touch and wheel handlers
function setupHandlers() {
    // Setup touch handlers for panning and zooming
    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    canvas.addEventListener('touchend', handleTouchEnd, false);
    
    // Setup mouse wheel for zooming
    canvas.addEventListener('wheel', handleWheel, false);
    
    // Setup double-click for text selection
    canvas.addEventListener('dblclick', handleDoubleClick, false);
    
    // Button click handlers if elements exist
    const prevButton = document.getElementById('prev');
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            goToPreviousPage();
        });
    }
    
    const nextButton = document.getElementById('next');
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            goToNextPage();
        });
    }
    
    const zoomInButton = document.getElementById('zoom-in');
    if (zoomInButton) {
        zoomInButton.addEventListener('click', function() {
            zoomIn();
        });
    }
    
    const zoomOutButton = document.getElementById('zoom-out');
    if (zoomOutButton) {
        zoomOutButton.addEventListener('click', function() {
            zoomOut();
        });
    }
}

// Touch event handlers
function handleTouchStart(evt) {
    startX = evt.touches[0].clientX;
    startY = evt.touches[0].clientY;
    currentTouches = evt.touches;
    
    // For pinch zoom
    if (evt.touches.length === 2) {
        startDistance = Math.hypot(
            evt.touches[0].clientX - evt.touches[1].clientX,
            evt.touches[0].clientY - evt.touches[1].clientY
        );
    }
}

function handleTouchMove(evt) {
    if (evt.touches.length === 2 && currentTouches.length === 2) {
        // Handle pinch zoom
        const currentDistance = Math.hypot(
            evt.touches[0].clientX - evt.touches[1].clientX,
            evt.touches[0].clientY - evt.touches[1].clientY
        );
        
        const delta = currentDistance - startDistance;
        if (Math.abs(delta) > 10) {
            if (delta > 0 && scale < maxZoom) {
                scale += zoomStep;
            } else if (delta < 0 && scale > minZoom) {
                scale -= zoomStep;
            }
            queueRenderPage(pageNum);
            startDistance = currentDistance;
        }
    }
}

function handleTouchEnd(evt) {
    currentTouches = evt.touches;
}

// Mouse wheel handler for zooming
function handleWheel(evt) {
    evt.preventDefault();
    
    if (evt.deltaY < 0) {
        zoomIn();
    } else {
        zoomOut();
    }
}

// Double-click handler for text selection
function handleDoubleClick(evt) {
    // Get text at point
    if (!pdfDoc) return;
    
    const boundingRect = canvas.getBoundingClientRect();
    const x = evt.clientX - boundingRect.left;
    const y = evt.clientY - boundingRect.top;
    
    pdfDoc.getPage(pageNum).then(function(page) {
        const viewport = page.getViewport({scale: scale});
        
        // Convert canvas coordinates to PDF coordinates
        const pdfX = x / scale;
        const pdfY = (viewport.height - y) / scale;
        
        page.getTextContent().then(function(textContent) {
            let selectedText = '';
            
            for (let item of textContent.items) {
                const tx = viewport.transform[4] + item.transform[4] * viewport.scale;
                const ty = viewport.transform[5] - item.transform[5] * viewport.scale;
                
                const rect = {
                    left: tx,
                    top: ty - item.height,
                    right: tx + item.width,
                    bottom: ty
                };
                
                if (
                    x >= rect.left && 
                    x <= rect.right && 
                    y >= rect.top && 
                    y <= rect.bottom
                ) {
                    selectedText = item.str;
                    break;
                }
            }
            
            if (selectedText) {
                console.log('Selected text:', selectedText);
                sendMessageToReactNative({
                    type: 'textSelected',
                    selectedText: selectedText
                });
            }
        });
    });
}

// Re-export navigation functions to global scope
window.goToPage = goToPage;
window.goToNextPage = goToNextPage;
window.goToPreviousPage = goToPreviousPage; 