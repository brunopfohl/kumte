// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

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
      
      currentPage = pageNum;
      pageNumberInput.value = currentPage;
      
      // Update navigation controls
      prevPageBtn.disabled = currentPage <= 1;
      nextPageBtn.disabled = currentPage >= totalPages;
      pageNumberInput.max = totalPages;
    });
  });
}

// Process the PDF data
function processPdfData(dataUri) {
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
        
        // Show controls
        controls.style.display = 'block';
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

// Listen for messages from React Native
window.addEventListener('message', function(event) {
  try {
    const data = JSON.parse(event.data);
    if (data.type === 'loadDataUri' && data.dataUri) {
      processPdfData(data.dataUri);
    }
  } catch (error) {
    console.error('Error processing message from React Native:', error);
    showError('Error processing message: ' + error.message);
  }
}); 