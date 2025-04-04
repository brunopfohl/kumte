// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Elements
const messageContainer = document.getElementById('messageContainer');
const viewerContainer = document.getElementById('viewerContainer');
const pdfContainer = document.getElementById('pdfContainer');
const controls = document.getElementById('controls');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageNumberInput = document.getElementById('pageNumber');
const pageCountSpan = document.getElementById('pageCount');

// Variables
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let currentScale = 1.0;
let minScale = 0.5;  // Minimum zoom level
let maxScale = 3.0;  // Maximum zoom level
let initialScale = 1.0;

// Touch event variables
let touchStartTime = 0;
let touchStartDistance = 0;
let touchStartScale = 1;
let touchStartX = 0;
let touchStartY = 0;
let lastTapTime = 0;

// Add event listeners for zoom and pan
viewerContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
viewerContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
viewerContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
viewerContainer.addEventListener('wheel', handleWheel, { passive: false });

// Add event listener for text selection
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

function handleTouchStart(e) {
  if (e.touches.length === 2) {
    // Pinch to zoom
    touchStartTime = Date.now();
    touchStartDistance = Math.hypot(
      e.touches[0].pageX - e.touches[1].pageX,
      e.touches[0].pageY - e.touches[1].pageY
    );
    touchStartScale = currentScale;
    e.preventDefault();
  } else if (e.touches.length === 1) {
    // Single touch for panning or double tap
    touchStartX = e.touches[0].pageX;
    touchStartY = e.touches[0].pageY;
    
    // Check for double tap
    const now = Date.now();
    if (now - lastTapTime < 300) {
      // Double tap detected
      if (currentScale > initialScale) {
        // If zoomed in, reset to fit width
        currentScale = initialScale;
      } else {
        // If at fit width, zoom in to 2x
        currentScale = Math.min(maxScale, initialScale * 2);
      }
      renderAllVisiblePages();
      e.preventDefault();
    }
    lastTapTime = now;
  }
}

function handleTouchMove(e) {
  if (e.touches.length === 2) {
    // Pinch to zoom
    const currentDistance = Math.hypot(
      e.touches[0].pageX - e.touches[1].pageX,
      e.touches[0].pageY - e.touches[1].pageY
    );
    
    const scaleFactor = currentDistance / touchStartDistance;
    currentScale = Math.min(maxScale, Math.max(minScale, touchStartScale * scaleFactor));
    
    renderAllVisiblePages();
    e.preventDefault();
  }
}

function handleTouchEnd(e) {
  // Touch end event handling
}

function handleWheel(e) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    
    // Calculate new scale with wheel delta
    const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
    currentScale = Math.min(maxScale, Math.max(minScale, currentScale * scaleDelta));
    
    renderAllVisiblePages();
  }
}

// Calculate the scale to fit the page width
function calculateFitToWidthScale(page) {
  const viewport = page.getViewport({ scale: 1.0 });
  const viewerWidth = viewerContainer.clientWidth;
  
  // Account for page margin
  const horizontalPadding = 40; // 20px on each side
  
  // Calculate the scale that would make the page fit the container width
  return (viewerWidth - horizontalPadding) / viewport.width;
}

function renderAllVisiblePages() {
  // Clear the container
  pdfContainer.innerHTML = '';
  
  // Render current page with updated scale
  renderPage(currentPage);
}

// Show an error message
function showError(message) {
  messageContainer.innerHTML = `<div class="errorMessage">Error: ${message}</div>`;
  controls.style.display = 'none';
  
  // Send error message to React Native
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'error',
      message: message
    }));
  }
}

// Get PDF URL from query parameters
function getPdfUrl() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fileParam = urlParams.get('file') || '';
    if (!fileParam) {
      console.error('No file parameter provided in URL');
      return '';
    }
    
    console.log('Raw file parameter:', fileParam);
    
    // Make sure to decode properly
    const decodedUri = decodeURIComponent(fileParam);
    console.log('Decoded URI:', decodedUri);
    
    return decodedUri;
  } catch (error) {
    console.error('Error getting PDF URL from query params:', error);
    return '';
  }
}

// For data URI handling in JavaScript messages
function initWithDataUri(dataUri) {
  try {
    // Set timeout for loading - if PDF isn't loaded in 30 seconds, show error
    const timeoutId = setTimeout(() => {
      showError('PDF loading timed out. The file may be too large or corrupted.');
    }, 30000);
    
    // Strip the data URI prefix
    let pdfData = dataUri;
    if (dataUri.startsWith('data:application/pdf;base64,')) {
      pdfData = dataUri.substring(dataUri.indexOf(',')+1);
    }
    
    try {
      // Decode the base64 data and create a Uint8Array
      const binaryData = atob(pdfData);
      const array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
          array[i] = binaryData.charCodeAt(i);
      }
      
      // Load the PDF
      pdfjsLib.getDocument({data: array}).promise.then(function(pdf) {
        // Clear the timeout since PDF loaded successfully
        clearTimeout(timeoutId);
        
        pdfDoc = pdf;
        totalPages = pdf.numPages;
        
        // Update page count
        pageCountSpan.textContent = '/ ' + totalPages;
        
        // Send loaded message to React Native
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'loaded',
            pageCount: totalPages
          }));
        }
        
        // Calculate the initial scale for the first page
        pdfDoc.getPage(1).then(function(page) {
          initialScale = calculateFitToWidthScale(page);
          currentScale = initialScale;
          
          // Clear message container
          messageContainer.innerHTML = '';
          
          // Render first page with calculated scale
          renderPage(1);
          
          // Set up navigation
          prevPageBtn.addEventListener('click', onPrevPage);
          nextPageBtn.addEventListener('click', onNextPage);
          pageNumberInput.addEventListener('change', onPageNumberChange);
          
          // Show controls
          controls.style.display = 'block';
        });
        
      }).catch(function(error) {
        clearTimeout(timeoutId);
        console.error('Error loading PDF:', error);
        showError('Error loading PDF: ' + error.message);
      });
    } catch (decodeError) {
      clearTimeout(timeoutId);
      console.error('Error decoding PDF data:', decodeError);
      showError('Error decoding PDF data: ' + decodeError.message);
    }
  } catch (e) {
    console.error('Error in PDF initialization:', e);
    showError('Error initializing PDF: ' + e.message);
  }
}

// Handle File URL loading
function loadPdfFromUrl(url) {
  // Set timeout for loading - if PDF isn't loaded in 30 seconds, show error
  const timeoutId = setTimeout(() => {
    showError('PDF loading timed out. The file may be too large or corrupted.');
  }, 30000);

  // Load PDF from URL
  pdfjsLib.getDocument(url).promise.then(function(pdf) {
    // Clear the timeout since PDF loaded successfully
    clearTimeout(timeoutId);
    
    pdfDoc = pdf;
    totalPages = pdf.numPages;
    
    // Update page count
    pageCountSpan.textContent = '/ ' + totalPages;
    
    // Send loaded message to React Native
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'loaded',
        pageCount: totalPages
      }));
    }
    
    // Calculate the initial scale for the first page
    pdfDoc.getPage(1).then(function(page) {
      initialScale = calculateFitToWidthScale(page);
      currentScale = initialScale;
      
      // Clear message container
      messageContainer.innerHTML = '';
      
      // Render first page with calculated scale
      renderPage(1);
      
      // Set up navigation
      prevPageBtn.addEventListener('click', onPrevPage);
      nextPageBtn.addEventListener('click', onNextPage);
      pageNumberInput.addEventListener('change', onPageNumberChange);
      
      // Show controls
      controls.style.display = 'block';
    });
    
  }).catch(function(error) {
    clearTimeout(timeoutId);
    console.error('Error loading PDF:', error);
    showError('Error loading PDF: ' + error.message);
  });
}

// Render a specific page
function renderPage(pageNum) {
  // Get the page
  pdfDoc.getPage(pageNum).then(function(page) {
    // Create a viewport with current scale
    const viewport = page.getViewport({ scale: currentScale });
    
    // Calculate the higher resolution rendering for crisp text
    const pixelRatio = window.devicePixelRatio || 1;
    const renderViewport = page.getViewport({ scale: currentScale * pixelRatio });
    
    // Create page div
    const pageDiv = document.createElement('div');
    pageDiv.className = 'page';
    pageDiv.style.width = viewport.width + 'px';
    pageDiv.style.height = viewport.height + 'px';
    pdfContainer.appendChild(pageDiv);
    
    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match the higher resolution viewport
    canvas.width = renderViewport.width;
    canvas.height = renderViewport.height;
    
    // Set display size to match the standard viewport
    canvas.style.width = viewport.width + 'px';
    canvas.style.height = viewport.height + 'px';
    
    pageDiv.appendChild(canvas);
    
    // Create text layer for text selection
    const textLayerDiv = document.createElement('div');
    textLayerDiv.className = 'textLayer';
    textLayerDiv.style.width = viewport.width + 'px';
    textLayerDiv.style.height = viewport.height + 'px';
    pageDiv.appendChild(textLayerDiv);
    
    // Render PDF page at higher resolution for sharper text
    const renderContext = {
      canvasContext: context,
      viewport: renderViewport,
      enableWebGL: true
    };
    
    const renderTask = page.render(renderContext);
    renderTask.promise.then(function() {
      // Get and render text content
      return page.getTextContent();
    }).then(function(textContent) {
      // Create text layer
      pdfjsLib.renderTextLayer({
        textContent: textContent,
        container: textLayerDiv,
        viewport: viewport,
        textDivs: []
      });
      
      // Update current page
      currentPage = pageNum;
      pageNumberInput.value = currentPage;
      
      // Update UI state
      updateUIState();
    });
  });
}

// Go to previous page
function onPrevPage() {
  if (currentPage <= 1) return;
  currentPage--;
  renderPage(currentPage);
}

// Go to next page
function onNextPage() {
  if (currentPage >= totalPages) return;
  currentPage++;
  renderPage(currentPage);
}

// Page number changed
function onPageNumberChange() {
  const pageNum = parseInt(pageNumberInput.value);
  if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
    renderPage(pageNum);
  }
}

// Update UI state
function updateUIState() {
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
  pageNumberInput.max = totalPages;
}

// Listen for messages from React Native
window.addEventListener('message', function(event) {
  try {
    const data = JSON.parse(event.data);
    if (data.type === 'loadDataUri' && data.dataUri) {
      initWithDataUri(data.dataUri);
    }
  } catch (e) {
    console.error('Error processing message from React Native:', e);
  }
});

// Initialize the PDF viewer
(function init() {
  const url = getPdfUrl();
  if (url) {
    loadPdfFromUrl(url);
  } else {
    // Wait for a message from React Native with data URI
    console.log('No URL found in query parameters, waiting for data URI message');
  }
})(); 