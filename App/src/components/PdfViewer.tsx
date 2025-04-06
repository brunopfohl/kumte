import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';
import PdfNavigationBar from './PdfNavigationBar';
import { apiClient } from '../services/apiClient';

// Asset paths
const HTML_PATH = Platform.OS === 'android'
  ? 'file:///android_asset/pdfViewer.html'
  : `file://${RNFS.MainBundlePath}/pdfViewer.html`;

const INLINE_HTML_PATH = Platform.OS === 'android'
  ? 'file:///android_asset/inlinePdfViewer.html'
  : `file://${RNFS.MainBundlePath}/inlinePdfViewer.html`;

interface PdfViewerProps {
  uri: string;
  onTextSelected?: (text: string) => void;
  onLoaded?: (pageCount: number, currentPage: number) => void;
  onPageChanged?: (pageNumber: number, totalPages: number) => void;
  onError?: (error: string) => void;
  hideControls?: boolean; // Option to hide built-in controls
}

export interface PdfViewerMethods {
  goToPage: (pageNumber: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  getCurrentPage: () => number;
  getTotalPages: () => number;
}

interface WebViewMessage {
  type: string;
  message?: string;
  pageCount?: number;
  currentPage?: number;
  level?: 'log' | 'error' | 'warn' | 'info';
  selectedText?: string;
  action?: string;
  pageNumber?: number;
}

/**
 * PDF Viewer component based on PDF.js
 * Supports file:// URIs, content:// URIs, http:// URLs, and data:application/pdf URIs
 * Can be controlled externally via ref methods
 */
const PdfViewer = forwardRef<PdfViewerMethods, PdfViewerProps>(({
  uri,
  onTextSelected,
  onLoaded,
  onPageChanged,
  onError,
  hideControls = false
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const viewerRef = useRef<PdfViewerMethods | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isReady, setIsReady] = useState(false);
  // State for text selection and Gemini API
  const [selectedText, setSelectedText] = useState<string>('');

  // Set up the ref methods that will be exposed to parent
  const methods: PdfViewerMethods = {
    goToPage: (pageNumber: number) => {
      if (!isReady) return;
      const safePageNumber = Math.max(1, Math.min(pageNumber, totalPages));
      
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          try {
            if (typeof goToPage === 'function') {
              goToPage(${safePageNumber});
              console.log('Direct call to goToPage(${safePageNumber})');
            } else if (typeof pdfViewerGoToPage === 'function') {
              pdfViewerGoToPage(${safePageNumber});
              console.log('Fallback call to pdfViewerGoToPage(${safePageNumber})');
            } else {
              console.error('Navigation function goToPage not found');
            }
          } catch(e) {
            console.error('Error navigating to page:', e.message);
          }
          true;
        `);
      }, 100); // Small delay to ensure WebView is ready
    },
    goToNextPage: () => {
      if (!isReady) return;
      
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          try {
            if (typeof goToNextPage === 'function') {
              console.log('Direct call to goToNextPage()');
              goToNextPage();
            } else if (typeof pdfViewerGoToNextPage === 'function') {
              console.log('Fallback call to pdfViewerGoToNextPage()');
              pdfViewerGoToNextPage();
            } else {
              console.error('Navigation function goToNextPage not found');
            }
          } catch(e) {
            console.error('Error navigating to next page:', e.message);
          }
          true;
        `);
      }, 100); // Small delay to ensure WebView is ready
    },
    goToPreviousPage: () => {
      if (!isReady) return;
      
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          try {
            if (typeof goToPreviousPage === 'function') {
              goToPreviousPage();
              console.log('Direct call to goToPreviousPage()');
            } else if (typeof pdfViewerGoToPreviousPage === 'function') {
              pdfViewerGoToPreviousPage();
              console.log('Fallback call to pdfViewerGoToPreviousPage()');
            } else {
              console.error('Navigation function goToPreviousPage not found');
            }
          } catch(e) {
            console.error('Error navigating to previous page:', e.message);
          }
          true;
        `);
      }, 100); // Small delay to ensure WebView is ready
    },
    getCurrentPage: () => currentPage,
    getTotalPages: () => totalPages
  };

  // Store the methods in a ref
  useEffect(() => {
    viewerRef.current = methods;
  }, [isReady, currentPage, totalPages]);

  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => methods);

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);

      if (data.type === 'loaded') {
        setLoading(false);
        setIsReady(true);
        if (data.pageCount) {
          setTotalPages(data.pageCount);
          setCurrentPage(1);
          if (onLoaded) {
            onLoaded(data.pageCount, 1);
          }
        }
      } else if (data.type === 'pageChanged' && data.currentPage) {
        setCurrentPage(data.currentPage);
        if (onPageChanged) {
          onPageChanged(data.currentPage, totalPages);
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
        setSelectedText(data.selectedText);
        
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

  // Build the source for the WebView based on PDF URI type
  const getWebViewSource = () => {
    // For data URIs - use the dedicated inline viewer HTML file and pass data via postMessage
    if (uri.startsWith('data:application/pdf;base64,')) {
      console.log('Using inline viewer approach for data URI');
      return { 
        uri: `${INLINE_HTML_PATH}?hideControls=${hideControls ? 'true' : 'false'}`,
        headers: { 'Cache-Control': 'no-cache' }
      };
    }
    
    // For file:// URIs and http:// URLs - pass through query param
    if (uri.startsWith('file://') || uri.startsWith('http')) {
      return { 
        uri: `${HTML_PATH}?file=${encodeURIComponent(uri)}&hideControls=${hideControls ? 'true' : 'false'}`,
        headers: { 'Cache-Control': 'no-cache' }
      };
    }
    
    // For content:// URIs (we pass the URI to the html)
    if (uri.startsWith('content://')) {
      return { 
        uri: `${HTML_PATH}?file=${encodeURIComponent(uri)}&hideControls=${hideControls ? 'true' : 'false'}`,
        headers: { 'Cache-Control': 'no-cache' }
      };
    }
    
    // Default fallback
    return { 
      uri: `${HTML_PATH}?hideControls=${hideControls ? 'true' : 'false'}`,
      headers: { 'Cache-Control': 'no-cache' }
    };
  };

  // Inject PDF data for data URIs after WebView is loaded
  const handleWebViewLoad = () => {
    if (uri.startsWith('data:application/pdf;base64,')) {
      // For data URIs, we inject the data via direct function call after load
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          try {
            if (typeof loadPdfFromDataUri === 'function') {
              loadPdfFromDataUri('${uri}');
              console.log('Direct call to loadPdfFromDataUri()');
            } else if (typeof processPdfData === 'function') {
              processPdfData('${uri}');
              console.log('Fallback call to processPdfData()');
            } else {
              console.error('PDF loading function not found');
            }
          } catch(e) {
            console.error('Error loading PDF data:', e.message);
          }
          true;
        `);
      }, 300); // Longer delay for loading data
    }
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
      <PdfNavigationBar
        viewerRef={viewerRef}
        currentPage={currentPage}
        totalPages={totalPages}
        selectedText={selectedText}
        onAIExplain={() => {}}
        documentUri={uri}
        documentType="pdf"
      />
    </View>
  );
});

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
  }
});

export default PdfViewer;