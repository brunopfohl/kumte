import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';

// Asset paths
const HTML_PATH = Platform.OS === 'android' 
  ? 'file:///android_asset/pdfViewer.html' 
  : `file://${RNFS.MainBundlePath}/pdfViewer.html`;

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

/**
 * PDF Viewer component based on PDF.js
 * Supports file:// URIs, content:// URIs, http:// URLs, and data:application/pdf URIs
 */
const PdfViewer: React.FC<PdfViewerProps> = ({ 
  uri, 
  onTextSelected, 
  onLoaded, 
  onError 
}) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // JavaScript to inject for debugging and communication
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
      
      true;
    })();
  `;

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);

      if (data.type === 'viewerReady' && uri.startsWith('data:application/pdf;base64,')) {
        console.log('Viewer is ready, injecting full PDF viewer HTML');
        
        // Inject the full PDF viewer HTML with our data URI
        const htmlWithData = `
          document.open();
          document.write(\`
          <!DOCTYPE html>
          <html>
          <head>
            <title>PDF Viewer</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
            <style>
              :root { --scale-factor: 1.0; }
              * { box-sizing: border-box; margin: 0; padding: 0; }
              html, body { height: 100%; width: 100%; overflow: hidden; background-color: #f5f5f5; }
              #viewerContainer { width: 100%; height: 100%; overflow: auto; position: absolute; top: 0; left: 0; -webkit-overflow-scrolling: touch; background-color: #f0f0f0; }
              #pdfContainer { margin: 0 auto; background-color: white; display: flex; flex-direction: column; align-items: center; width: 100%; padding: 10px 0; }
              .page { margin: 10px auto; position: relative; overflow: visible; background-color: white; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); border-radius: 2px; display: block; }
              .textLayer { position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: hidden; line-height: 1.0; opacity: 0.2; user-select: text; -webkit-user-select: text; }
              .textLayer span { color: transparent; position: absolute; white-space: pre; cursor: text; transform-origin: 0% 0%; }
              .textLayer span::selection { background-color: #b4d5fe; color: transparent; }
              #controls { position: fixed; bottom: 10px; left: 0; right: 0; text-align: center; background-color: rgba(255,255,255,0.8); padding: 10px; z-index: 1000; border-top: 1px solid rgba(0,0,0,0.1); box-shadow: 0 -2px 5px rgba(0,0,0,0.1); }
              #controls button { padding: 8px 12px; margin: 0 5px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
              #controls button:disabled { background-color: #cccccc; cursor: not-allowed; }
              #pageNumber { padding: 8px; width: 50px; text-align: center; border: 1px solid #ddd; border-radius: 4px; margin: 0 5px; }
              #pageCount { padding: 8px; margin-left: 5px; color: #333; font-weight: bold; }
              .errorMessage { color: red; text-align: center; padding: 20px; }
            </style>
          </head>
          <body>
            <div id="messageContainer">
              <div class="loadingMessage">Loading PDF...</div>
            </div>
            <div id="viewerContainer">
              <div id="pdfContainer"></div>
            </div>
            <div id="controls" style="display: none;">
              <button id="prevPage" disabled>Previous</button>
              <input type="number" id="pageNumber" value="1" min="1" />
              <span id="pageCount">/ 0</span>
              <button id="nextPage" disabled>Next</button>
            </div>
            <script>
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              
              const messageContainer = document.getElementById('messageContainer');
              const viewerContainer = document.getElementById('viewerContainer');
              const pdfContainer = document.getElementById('pdfContainer');
              const controls = document.getElementById('controls');
              const prevPageBtn = document.getElementById('prevPage');
              const nextPageBtn = document.getElementById('nextPage');
              const pageNumberInput = document.getElementById('pageNumber');
              const pageCountSpan = document.getElementById('pageCount');
              
              let pdfDoc = null;
              let currentPage = 1;
              let totalPages = 0;
              let currentScale = 1.0;
              
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
              
              function showError(message) {
                messageContainer.innerHTML = '<div class="errorMessage">Error: ' + message + '</div>';
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'error',
                    message: message
                  }));
                }
              }
              
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
                    viewport: renderViewport
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
                    prevPageBtn.disabled = currentPage <= 1;
                    nextPageBtn.disabled = currentPage >= totalPages;
                    pageNumberInput.max = totalPages;
                  });
                });
              }
              
              function calculateFitToWidthScale(page) {
                const viewport = page.getViewport({ scale: 1.0 });
                const viewerWidth = viewerContainer.clientWidth;
                const horizontalPadding = 40;
                return (viewerWidth - horizontalPadding) / viewport.width;
              }
              
              // Process the PDF data
              function processPdfData() {
                try {
                  const dataUri = "${uri}";
                  if (!dataUri.startsWith('data:application/pdf;base64,')) {
                    throw new Error('Invalid PDF data URI');
                  }
                  
                  // Get base64 part
                  const base64Data = dataUri.substring(dataUri.indexOf(',') + 1);
                  
                  // Decode base64 and create array buffer
                  const binaryString = window.atob(base64Data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  
                  // Load the PDF
                  pdfjsLib.getDocument({ data: bytes }).promise.then(function(pdf) {
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
                    
                    // Calculate initial scale for the first page
                    pdf.getPage(1).then(function(page) {
                      currentScale = calculateFitToWidthScale(page);
                      
                      // Clear message container and render first page
                      messageContainer.innerHTML = '';
                      renderPage(1);
                      
                      // Set up navigation
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
              
              // Start processing the PDF
              processPdfData();
            </script>
          </body>
          </html>
          \`);
          document.close();
          true;
        `;
        
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(htmlWithData);
        }, 500);
      } else if (data.type === 'loaded') {
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

  // Handle WebView errors
  const handleWebViewError = (err: any) => {
    console.error('WebView loading error:', err);
    setLoading(false);
    const errorMessage = err?.nativeEvent?.description || 'Unknown error occurred while loading';
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  };

  // Build the source URL for the WebView based on PDF URI type
  const getWebViewSource = () => {
    // For data URIs - we use a message-based approach
    if (uri.startsWith('data:application/pdf;base64,')) {
      console.log('Using HTML-only source for data URI');
      return { 
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>PDF Viewer</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <style>
            :root { --scale-factor: 1.0; }
          </style>
        </head>
        <body>
          <div id="messageContainer">
            <div style="text-align: center; padding: 20px;">Initializing PDF viewer...</div>
          </div>
          <script>
            window.onload = function() {
              // Signal that we're ready to receive the data URI
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'viewerReady'
                }));
              }
            };
          </script>
        </body>
        </html>`,
        baseUrl: 'about:blank'
      };
    }
    
    // For file:// URIs and http:// URLs - we pass through query param
    if (uri.startsWith('file://') || uri.startsWith('http')) {
      return { 
        uri: `${HTML_PATH}?file=${encodeURIComponent(uri)}`,
        headers: {'Cache-Control': 'no-cache'}
      };
    }
    
    // For content:// URIs (we pass the URI to the html)
    if (uri.startsWith('content://')) {
      return { 
        uri: `${HTML_PATH}?file=${encodeURIComponent(uri)}`,
        headers: {'Cache-Control': 'no-cache'}
      };
    }
    
    // Default fallback
    return { 
      uri: HTML_PATH,
      headers: {'Cache-Control': 'no-cache'}
    };
  };

  // For data URIs, we need to pass the data via a message after the WebView loads
  const handleWebViewLoad = () => {
    // Nothing to do here anymore as we're waiting for viewerReady message
    console.log('WebView loaded');
  };

  // Common WebView props for reuse
  const webViewProps = {
    ref: webViewRef,
    style: styles.webView,
    originWhitelist: ['*'],
    onMessage: handleWebViewMessage,
    onError: handleWebViewError,
    onLoad: handleWebViewLoad,
    startInLoadingState: true,
    renderLoading: () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading PDF...</Text>
      </View>
    ),
    javaScriptEnabled: true,
    domStorageEnabled: true,
    mixedContentMode: "always" as "always",
    injectedJavaScript: injectedJavaScript,
    scalesPageToFit: true,
  };

  // Render WebView with appropriate settings based on URI type
  const renderWebView = () => {
    const source = getWebViewSource();
    
    // Special handling for file:// URIs
    if (uri.startsWith('file://')) {
      return (
        <WebView
          {...webViewProps}
          source={source}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccessFromFileURLs={true}
          cacheEnabled={true}
          incognito={false}
        />
      );
    }
    
    // For data URIs
    if (uri.startsWith('data:application/pdf;base64,')) {
      return (
        <WebView
          {...webViewProps}
          source={source}
          cacheEnabled={false}
          incognito={true}
          onContentProcessDidTerminate={syntheticEvent => {
            console.log('Content process terminated, reloading webview...');
            webViewRef.current?.reload();
          }}
        />
      );
    }
    
    // Default for http/https/content URIs
    return (
      <WebView
        {...webViewProps}
        source={source}
        cacheEnabled={true}
      />
    );
  };

  // Render component with error handling
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderWebView()}
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