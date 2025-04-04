import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';

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
        uri: INLINE_HTML_PATH,
        headers: { 'Cache-Control': 'no-cache' }
      };
    }

    // For file:// URIs and http:// URLs - pass through query param
    if (uri.startsWith('file://') || uri.startsWith('http')) {
      return {
        uri: `${HTML_PATH}?file=${encodeURIComponent(uri)}`,
        headers: { 'Cache-Control': 'no-cache' }
      };
    }

    // For content:// URIs (we pass the URI to the html)
    if (uri.startsWith('content://')) {
      return {
        uri: `${HTML_PATH}?file=${encodeURIComponent(uri)}`,
        headers: { 'Cache-Control': 'no-cache' }
      };
    }

    // Default fallback
    return {
      uri: HTML_PATH,
      headers: { 'Cache-Control': 'no-cache' }
    };
  };

  // Inject PDF data for data URIs after WebView is loaded
  const handleWebViewLoad = () => {
    if (uri.startsWith('data:application/pdf;base64,')) {
      // For data URIs, we inject the data via postMessage after load
      webViewRef.current?.injectJavaScript(`
        window.postMessage(JSON.stringify({
          type: 'loadDataUri',
          dataUri: '${uri}'
        }), '*');
        true;
      `);
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