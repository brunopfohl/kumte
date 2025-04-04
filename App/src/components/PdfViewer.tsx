import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

interface PdfViewerProps {
  uri: string;
  onTextSelected?: (text: string) => void;
  onLoaded?: (pageCount: number) => void;
  onError?: (error: string) => void;
}

interface WebViewMessage {
  type: string;
  message?: string;
  pageCount?: number;
  level?: 'log' | 'error' | 'warn' | 'info';
  selectedText?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ 
  uri, 
  onTextSelected, 
  onLoaded, 
  onError 
}) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // JavaScript to inject for debugging and additional functionality
  const injectedJavaScript = `
    // Override console.log to send messages to React Native
    (function() {
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      
      console.log = function(...args) {
        originalConsoleLog.apply(console, args);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'console',
          level: 'log',
          message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')
        }));
      };
      
      console.error = function(...args) {
        originalConsoleError.apply(console, args);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'console',
          level: 'error',
          message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')
        }));
      };
      
      // Add a global error handler
      window.addEventListener('error', function(event) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: 'JavaScript error: ' + event.message + ' at ' + event.filename + ':' + event.lineno
        }));
        return false;
      });
      
      // Monitor text selection events
      document.addEventListener('selectionchange', function() {
        const selection = document.getSelection();
        if (selection && selection.toString().trim()) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'textSelected',
            selectedText: selection.toString().trim()
          }));
        }
      });
      
      true;
    })();
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);

      if (data.type === 'loaded') {
        setLoading(false);
        if (data.pageCount && onLoaded) {
          onLoaded(data.pageCount);
        }
      } else if (data.type === 'error') {
        setLoading(false);
        setError(data.message || 'Unknown error in PDF viewer');
        if (onError) {
          onError(data.message || 'Unknown error in PDF viewer');
        }
      } else if (data.type === 'console') {
        // Handle console messages from WebView
        if (data.level === 'error') {
          console.error('WebView console error:', data.message);
        } else {
          console.log('WebView console:', data.message);
        }
      } else if (data.type === 'textSelected' && data.selectedText) {
        // Handle text selection
        if (onTextSelected) {
          onTextSelected(data.selectedText);
        }
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  const handleWebViewError = (err: any) => {
    console.error('WebView loading error:', err);
    setLoading(false);
    const errorMessage = err?.nativeEvent?.description || 'Unknown error occurred while loading';
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  };

  // Get the source URI for our PDF.js WebView based on the file path
  const getPdfViewerSourceUri = (pdfUri: string): string => {
    const sanitizedUri = pdfUri.replace(/\s/g, '%20');
    console.log('Preparing viewer URI for:', sanitizedUri);
    
    // For files in our cache directory, we can use a direct file:// reference
    if (Platform.OS === 'android' && pdfUri.includes(RNFS.CachesDirectoryPath)) {
      console.log('Using cached file URI:', pdfUri);
      return `file:///android_asset/pdfViewer.html?file=${encodeURIComponent(sanitizedUri)}`;
    }
    
    // For Android, we use the asset HTML
    if (Platform.OS === 'android') {
      return `file:///android_asset/pdfViewer.html?file=${encodeURIComponent(sanitizedUri)}`;
    }
    
    // For iOS
    if (Platform.OS === 'ios') {
      return `file://${RNFS.MainBundlePath}/pdfViewer.html?file=${encodeURIComponent(sanitizedUri)}`;
    }
    
    // Fallback
    return `file:///android_asset/pdfViewer.html?file=${encodeURIComponent(sanitizedUri)}`;
  };

  // Create HTML for data URI approach
  const createPdfViewerHtml = (dataUri: string): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PDF Viewer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { 
            height: 100%; 
            width: 100%; 
            overflow: hidden; 
            background-color: #f5f5f5; 
          }
          :root {
            --scale-factor: 1.0;
          }
          #viewerContainer { 
            width: 100%; 
            height: 100%; 
            overflow: auto; 
            position: absolute; 
            top: 0; 
            left: 0; 
            -webkit-overflow-scrolling: touch;
            background-color: #f0f0f0;
          }
          #pdfContainer { 
            margin: 0 auto; 
            background-color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding: 10px 0;
          }
          .page { 
            margin: 10px auto; 
            position: relative; 
            overflow: visible; 
            background-color: white; 
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            border-radius: 2px;
            display: block;
          }
          .textLayer { 
            position: absolute; 
            left: 0; 
            top: 0; 
            right: 0; 
            bottom: 0; 
            overflow: hidden; 
            line-height: 1.0;
            opacity: 0.2;
            user-select: text;
            -webkit-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
          }
          .textLayer span {
            color: transparent;
            position: absolute;
            white-space: pre;
            cursor: text;
            transform-origin: 0% 0%;
          }
          .textLayer span::selection {
            background-color: #b4d5fe;
            color: transparent;
          }
          #controls { 
            position: fixed; 
            bottom: 10px; 
            left: 0; 
            right: 0; 
            text-align: center; 
            background-color: rgba(255,255,255,0.8); 
            padding: 10px; 
            z-index: 1000;
            border-top: 1px solid rgba(0,0,0,0.1);
            box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
          }
          #controls button { 
            padding: 8px 12px; 
            margin: 0 5px; 
            background-color: #2196F3; 
            color: white; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
          #controls button:disabled { 
            background-color: #cccccc; 
            cursor: not-allowed;
            box-shadow: none;
          }
          #controls button:active {
            transform: translateY(1px);
            box-shadow: 0 0 1px rgba(0,0,0,0.2);
          }
          #pageNumber { 
            padding: 8px; 
            width: 50px; 
            text-align: center; 
            border: 1px solid #ddd; 
            border-radius: 4px;
            margin: 0 5px;
          }
          #pageCount { 
            padding: 8px; 
            margin-left: 5px; 
            color: #333;
            font-weight: bold;
          }
          #errorMessage { 
            color: #d32f2f; 
            text-align: center; 
            margin: 20px;
            padding: 15px;
            background-color: #ffebee;
            border-radius: 4px;
            border: 1px solid #ffcdd2;
            font-weight: bold;
          }
          
          /* Improve touch handling */
          canvas {
            touch-action: none;
            -ms-touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
          }
        </style>
      </head>
      <body>
        <div id="viewerContainer"><div id="pdfContainer"></div></div>
        <div id="errorMessage" style="display: none;"></div>
        <div id="controls" style="display: none;">
          <button id="prevPage" disabled>Previous</button>
          <input type="number" id="pageNumber" value="1" min="1" />
          <span id="pageCount">/ 0</span>
          <button id="nextPage" disabled>Next</button>
        </div>
        <script>
          // Configure PDF.js worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          // Variables
          let pdfDoc = null;
          let currentPage = 1;
          let totalPages = 0;
          let currentScale = 1.0;
          let minScale = 0.5;  // Minimum zoom level
          let maxScale = 3.0;  // Maximum zoom level
          let initialScale = 1.0;
          
          // Elements
          const viewerContainer = document.getElementById('viewerContainer');
          const pdfContainer = document.getElementById('pdfContainer');
          const controls = document.getElementById('controls');
          const errorMessage = document.getElementById('errorMessage');
          const prevPageBtn = document.getElementById('prevPage');
          const nextPageBtn = document.getElementById('nextPage');
          const pageNumberInput = document.getElementById('pageNumber');
          const pageCountSpan = document.getElementById('pageCount');
          
          // Handle touch events for zooming
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
            const viewerHeight = viewerContainer.clientHeight;
            
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
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            controls.style.display = 'none';
            
            // Send error message to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: message
              }));
            }
          }
          
          // Initialize PDF viewing with data URI
          try {
            // Set timeout for loading - if PDF isn't loaded in 30 seconds, show error
            const timeoutId = setTimeout(() => {
              showError('PDF loading timed out. The file may be too large or corrupted.');
            }, 30000);
            
            // Load PDF from the data embedded in this HTML
            const pdfData = '${dataUri.substring(dataUri.indexOf(',')+1)}';
            
            // We'll process this in smaller chunks to avoid memory issues
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
            
            // Render a specific page
            function renderPage(pageNum) {
              // Clear previous page
              pdfContainer.innerHTML = '';
              
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
          } catch (e) {
            console.error('Error in PDF initialization:', e);
            showError('Error initializing PDF: ' + e.message);
          }
        </script>
      </body>
      </html>
    `;
  };

  // Render appropriate viewer based on URI type
  const renderViewer = () => {
    // For data URIs
    if (uri.startsWith('data:application/pdf;base64,')) {
      return (
        <WebView
          ref={webViewRef}
          source={{ html: createPdfViewerHtml(uri) }}
          style={styles.webView}
          originWhitelist={['*']}
          onMessage={handleWebViewMessage}
          onError={handleWebViewError}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          cacheEnabled={false}
          incognito={true}
          onContentProcessDidTerminate={syntheticEvent => {
            console.log('Content process terminated, reloading webview...');
            webViewRef.current?.reload();
          }}
          injectedJavaScript={injectedJavaScript}
          scalesPageToFit={true}
        />
      );
    }
    
    // For file:// URIs
    else if (uri.startsWith('file://')) {
      const viewerSourceUri = getPdfViewerSourceUri(uri);
      return (
        <WebView
          ref={webViewRef}
          source={{ uri: viewerSourceUri }}
          style={styles.webView}
          originWhitelist={['*']}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          onMessage={handleWebViewMessage}
          onError={handleWebViewError}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          cacheEnabled={true}
          incognito={false}
          injectedJavaScript={injectedJavaScript}
          scalesPageToFit={true}
        />
      );
    }
    
    // For remote URLs
    else if (uri.startsWith('http')) {
      const viewerSourceUri = getPdfViewerSourceUri(uri);
      return (
        <WebView
          ref={webViewRef}
          source={{ uri: viewerSourceUri }}
          style={styles.webView}
          originWhitelist={['*']}
          onMessage={handleWebViewMessage}
          onError={handleWebViewError}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          cacheEnabled={true}
          injectedJavaScript={injectedJavaScript}
          scalesPageToFit={true}
        />
      );
    }
    
    // Default fallback for unknown URI types
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unsupported PDF source: {uri}</Text>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderViewer()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default PdfViewer; 