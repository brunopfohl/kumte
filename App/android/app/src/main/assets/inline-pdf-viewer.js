// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Make sure the window functions are always available immediately
// These are defined in the HTML but let's ensure they're properly connected
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

// UI elements
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
let minScale = 0.5;  // Minimum zoom level
let maxScale = 3.0;  // Maximum zoom level
let initialScale = 1.0;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.0;
let isReady = false;
let canvas = null;
let ctx = null;
let maxZoom = 3.0;
let minZoom = 0.5;
let zoomStep = 0.2;
let startX, startY, startDistance;
let currentTouches = [];

// Text selection handler
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

// Check if controls should be hidden (read from URL parameters)
function shouldHideControls() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('hideControls') === 'true';
}

// External control functions - these will be called from React Native
function goToPage(pageNum) {
  console.log('goToPage internal function called with:', pageNum);
  if (!pdfDoc) {
    console.error('PDF document not loaded yet');
    return;
  }
  
  const page = parseInt(pageNum);
  if (isNaN(page) || page < 1 || page > totalPages || page === currentPage) {
    console.log('Invalid page number or already on this page:', page);
    return;
  }
  
  // Clear the container and render the requested page
  console.log('Navigating to page:', page);
  pdfContainer.innerHTML = '';
  renderPage(page);
}

function goToNextPage() {
  console.log('goToNextPage internal function called, current page:', currentPage, 'total pages:', totalPages);
  if (!pdfDoc || currentPage >= totalPages) {
    console.error('Cannot go to next page - at last page or PDF not loaded');
    return;
  }
  
  // Clear the container and render the next page
  console.log('Navigating to next page:', currentPage + 1);
  pdfContainer.innerHTML = '';
  renderPage(currentPage + 1);
}

function goToPreviousPage() {
  console.log('goToPreviousPage internal function called, current page:', currentPage);
  if (!pdfDoc || currentPage <= 1) {
    console.error('Cannot go to previous page - at first page or PDF not loaded');
    return;
  }
  
  // Clear the container and render the previous page
  console.log('Navigating to previous page:', currentPage - 1);
  pdfContainer.innerHTML = '';
  renderPage(currentPage - 1);
}

// Add functions to window object too
window.goToPage = goToPage;
window.goToNextPage = goToNextPage;
window.goToPreviousPage = goToPreviousPage;

// Handle document messages from React Native (Android)
document.addEventListener('message', function(event) {
    console.log('Document message received in JS file:', event.data);
    try {
        console.log('Document message received in JS file:', event.data);
        const message = JSON.parse(event.data);
        console.log('Parsed message:', message);
        
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
            window.processPdfData(message.dataUri);
        }
    } catch (e) {
        console.log('What is the error?');
        console.error('Error processing document message:', e);
    }
});

// Also listen for window messages as a fallback (iOS/Web)
window.addEventListener('message', function(event) {
    console.log('Window message received in JS file:', event.data);
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
            window.processPdfData(message.dataUri);
        }
    } catch (e) {
        console.error('Error processing window message:', e);
    }
});

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

// Calculate scale to fit width
function calculateFitToWidthScale(page) {
  const viewport = page.getViewport({ scale: 1.0 });
  const viewerWidth = viewerContainer.clientWidth;
  const horizontalPadding = 40;
  return (viewerWidth - horizontalPadding) / viewport.width;
}

// Render a page
function renderPage(pageNum) {
  console.log('Rendering page:', pageNum);
  pdfDoc.getPage(pageNum).then(function(page) {
    const viewport = page.getViewport({ scale: currentScale });
    const pixelRatio = window.devicePixelRatio || 1;
    const renderViewport = page.getViewport({ scale: currentScale * pixelRatio });
    
    const pageDiv = document.createElement('div');
    pageDiv.className = 'page';
    pageDiv.style.width = viewport.width + 'px';
    pageDiv.style.height = viewport.height + 'px';
    pdfContainer.appendChild(pageDiv);
    
    const canvas = document.createElement('canvas');
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
    
    page.render(renderContext).promise.then(function() {
      return page.getTextContent();
    }).then(function(textContent) {
      pdfjsLib.renderTextLayer({
        textContent: textContent,
        container: textLayerDiv,
        viewport: viewport,
        textDivs: []
      });
      
      // Update current page
      const oldPage = currentPage;
      currentPage = pageNum;
      pageNumberInput.value = currentPage;
      
      // Update navigation controls
      prevPageBtn.disabled = currentPage <= 1;
      nextPageBtn.disabled = currentPage >= totalPages;
      pageNumberInput.max = totalPages;
      
      // Notify React Native of page change if the page actually changed
      if (oldPage !== currentPage && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'pageChanged',
          currentPage: currentPage
        }));
      }
    });
  });
}

// Process the PDF data
function processPdfData(dataUri) {
  try {
    console.log('Processing PDF data...');
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
      console.log('PDF loaded successfully with', pdf.numPages, 'pages');
      pdfDoc = pdf;
      totalPages = pdf.numPages;
      
      // Update page counter
      pageCountSpan.textContent = '/ ' + totalPages;
      
      // Notify React Native that the PDF is loaded
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'loaded',
          pageCount: totalPages
        }));
      }
      
      // Calculate initial scale
      pdf.getPage(1).then(function(page) {
        currentScale = calculateFitToWidthScale(page);
        
        // Clear loading indicator and render the first page
        messageContainer.innerHTML = '';
        renderPage(1);
        
        // Set up page navigation
        prevPageBtn.addEventListener('click', function() {
          if (currentPage <= 1) return;
          pdfContainer.innerHTML = '';
          renderPage(currentPage - 1);
        });
        
        nextPageBtn.addEventListener('click', function() {
          if (currentPage >= totalPages) return;
          pdfContainer.innerHTML = '';
          renderPage(currentPage + 1);
        });
        
        pageNumberInput.addEventListener('change', function() {
          const pageNum = parseInt(pageNumberInput.value);
          if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
            pdfContainer.innerHTML = '';
            renderPage(pageNum);
          }
        });
        
        // Show controls if not hidden
        if (!shouldHideControls()) {
          controls.style.display = 'block';
        }
        
        // Log that everything is ready
        console.log('PDF viewer fully initialized and ready for navigation');
      });
    }).catch(function(error) {
      console.error('Error loading PDF:', error);
      showError('Error loading PDF: ' + error.message);
    });
  } catch (error) {
    console.error('Error processing PDF data:', error);
    showError('Error processing PDF data: ' + error.message);
  }
}

// Hide controls if needed (on init)
if (shouldHideControls()) {
  controls.style.display = 'none';
}

// Log that the script has loaded
console.log('PDF viewer script has loaded successfully');

// Remove any old definitions just to be safe - this runs last
window.pdfViewerGoToPage = function(pageNumber) {
    console.log('Global pdfViewerGoToPage called with pageNumber:', pageNumber);
    if (window.goToPage) {
        window.goToPage(pageNumber);
    } else {
        console.error('PDF viewer not initialized - goToPage not available');
    }
}; 

// Initialize PDF viewer when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing PDF viewer');
    initializeViewer();
});

// Function to initialize the viewer
function initializeViewer() {
    console.log('Initializing PDF viewer');
    canvas = document.getElementById('pdf-canvas');
    ctx = canvas.getContext('2d');
    
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
    
    // Report ready state to React Native
    isReady = true;
    sendMessageToReactNative({
        type: 'loaded',
        message: 'PDF viewer initialized and ready'
    });
    
    console.log('PDF viewer initialization complete');
}

// Send message to React Native
function sendMessageToReactNative(message) {
    try {
        // Standard React Native WebView interface
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
            console.log('Message sent via ReactNativeWebView.postMessage');
        } else {
            console.error('ReactNativeWebView not available for sending messages');
        }
    } catch (e) {
        console.error('Error sending message to React Native:', e);
    }
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
                
                // Send pageCount to React Native
                sendMessageToReactNative({
                    type: 'loaded',
                    pageCount: pdf.numPages,
                    currentPage: 1
                });
                
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
    
    currentPage = num;
    queueRenderPage(num);
}

function goToNextPage() {
    console.log('goToNextPage called');
    if (!pdfDoc) {
        console.error('PDF not loaded yet');
        return;
    }
    
    if (currentPage >= pdfDoc.numPages) {
        console.log('Already at last page');
        return;
    }
    
    currentPage++;
    queueRenderPage(currentPage);
}

function goToPreviousPage() {
    console.log('goToPreviousPage called');
    if (!pdfDoc) {
        console.error('PDF not loaded yet');
        return;
    }
    
    if (currentPage <= 1) {
        console.log('Already at first page');
        return;
    }
    
    currentPage--;
    queueRenderPage(currentPage);
}

// Zoom functions
function zoomIn() {
    if (scale < maxZoom) {
        scale += zoomStep;
        queueRenderPage(currentPage);
    }
}

function zoomOut() {
    if (scale > minZoom) {
        scale -= zoomStep;
        queueRenderPage(currentPage);
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
            queueRenderPage(currentPage);
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
    
    pdfDoc.getPage(currentPage).then(function(page) {
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