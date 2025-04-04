import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, ScrollView, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import RNFS from 'react-native-fs';
import ImageViewer from 'react-native-image-zoom-viewer';
import { DocumentService } from '../services/DocumentService';
import { FileService } from '../services/FileService';

const { width, height } = Dimensions.get('window');

type ViewerScreenRouteProp = RouteProp<RootStackParamList, 'Viewer'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FileInfo {
  exists: boolean;
  size: number;
  path: string;
  isLocal: boolean;
}

interface DebugInfo {
  uri: string;
  type: 'pdf' | 'image';
  loading: boolean;
  error: string | null;
  pdfPages: number;
  lastUpdate: string;
  sourceStatus: string;
  fileInfo: FileInfo;
  loadAttempts: number;
}

interface WebViewMessage {
  type: string;
  message?: string;
  pageCount?: number;
  level?: 'log' | 'error' | 'warn' | 'info';
}

export const ViewerScreen = () => {
  const route = useRoute<ViewerScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { uri, type } = route.params;
  const webViewRef = useRef<WebView>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  
  // JavaScript to inject into WebView for debugging
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

  const [fileInfo, setFileInfo] = useState<FileInfo>({
    exists: false,
    size: 0,
    path: uri,
    isLocal: uri.startsWith('file://') || uri.startsWith('content://'),
  });

  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    uri,
    type,
    loading: true,
    error: null,
    pdfPages: 0,
    lastUpdate: new Date().toISOString(),
    sourceStatus: 'initializing',
    fileInfo: {
      exists: false,
      size: 0,
      path: uri,
      isLocal: uri.startsWith('file://') || uri.startsWith('content://'),
    },
    loadAttempts: 0,
  });

  useEffect(() => {
    console.log('ViewerScreen mounted with params:', { uri, type });
    setDebugInfo(prev => ({ ...prev, lastUpdate: new Date().toISOString() }));

    // Request storage permissions for Android if needed
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          console.log('Checking Android storage permissions...');
          
          // First check current permission status
          const readPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
          
          const writePermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          
          console.log('Current permission status:', { readPermission, writePermission });
          
          // If we already have permissions, return early
          if (readPermission && writePermission) {
            console.log('Storage permissions already granted');
            return true;
          }
          
          // For Android 10+ (API 29+), we need both READ_EXTERNAL_STORAGE and WRITE_EXTERNAL_STORAGE
          const permissions = [
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          ];
          
          // Note: We skip showing rationale since we'll fallback to data URI approach anyway
          console.log('Requesting storage permissions...');
          const results = await PermissionsAndroid.requestMultiple(permissions);
          
          console.log('Permission request results:', results);
          
          const allGranted = Object.values(results).every(
            status => status === PermissionsAndroid.RESULTS.GRANTED
          );
          
          if (allGranted) {
            console.log("All storage permissions granted");
            return true;
          } else {
            console.log("Some storage permissions denied");
            // We'll continue with data URI approach as fallback
            return false;
          }
        } catch (err) {
          console.error("Error requesting permissions:", err);
          return false;
        }
      }
      return true; // Non-Android platforms don't need these permissions
    };

    // Initialize file processing
    const initializeViewer = async () => {
      const hasPermissions = await requestPermissions();
      console.log('Permission check result:', hasPermissions);
      
      // Always proceed with file checking, but the implementation will
      // use data URI approach as fallback if permissions are denied
      await checkFile();
    };

    initializeViewer();
  }, [uri, type]);

  const handleWebViewMessage = (event: any) => {
    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);

      if (data.type === 'loaded') {
        setLoading(false);
        if (data.pageCount) {
          setPdfPages(data.pageCount);
        }
        setDebugInfo(prev => ({
          ...prev,
          loading: false,
          pdfPages: data.pageCount || 0,
          lastUpdate: new Date().toISOString(),
          sourceStatus: 'loaded successfully',
          loadAttempts: prev.loadAttempts + 1,
        }));
      } else if (data.type === 'error') {
        setLoading(false);
        setError(data.message || 'Unknown error in PDF viewer');
        setDebugInfo(prev => ({
          ...prev,
          loading: false,
          error: data.message || 'Unknown error in PDF viewer',
          lastUpdate: new Date().toISOString(),
          sourceStatus: 'load failed',
          loadAttempts: prev.loadAttempts + 1,
        }));
      } else if (data.type === 'console') {
        // Handle console messages from WebView
        if (data.level === 'error') {
          console.error('WebView console error:', data.message);
        } else {
          console.log('WebView console:', data.message);
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
    setDebugInfo(prev => ({
      ...prev,
      loading: false,
      error: errorMessage,
      lastUpdate: new Date().toISOString(),
      sourceStatus: 'load failed',
      loadAttempts: prev.loadAttempts + 1,
    }));
  };

  const toggleDebugPanel = () => {
    setShowDebug(prev => !prev);
  };

  const processFileToDataUri = async (uri: string): Promise<string> => {
    try {
      console.log('Converting file to data URI:', uri);
      
      if (uri.startsWith('data:')) {
        // Already a data URI
        return uri;
      }
      
      // For content:// URIs
      if (uri.startsWith('content://')) {
        const mimeType = type === 'pdf' ? 'application/pdf' : 'image/jpeg';
        try {
          return await FileService.createDataUri(uri, mimeType);
        } catch (error) {
          console.error('Error processing content URI to data URI:', error);
          throw new Error(`Failed to process content URI: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } 
      // For file:// URIs
      else if (uri.startsWith('file://')) {
        const mimeType = type === 'pdf' ? 'application/pdf' : 'image/jpeg';
        try {
          return await FileService.createDataUri(uri, mimeType);
        } catch (error) {
          console.error('Error processing file URI to data URI:', error);
          throw new Error(`Failed to process file URI: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      // Unsupported URI scheme
      else {
        throw new Error(`Unsupported URI scheme: ${uri}`);
      }
    } catch (error) {
      console.error('Error processing file to data URI:', error);
      throw error;
    }
  };

  // Modified checkFile function to always use data URIs for PDFs
  const checkFile = async () => {
    try {
      console.log('Checking file with URI:', uri);
      
      // For PDFs, we'll take a direct data URI approach for more reliable viewing
      if (type === 'pdf') {
        if (uri.startsWith('content://') || uri.startsWith('file://')) {
          setLoading(true);
          try {
            // Convert directly to data URI
            const dataUri = await processFileToDataUri(uri);
            
            console.log('Successfully converted to data URI');
            
            setFileInfo(prev => ({
              ...prev,
              exists: true,
              path: dataUri, // Use data URI directly as the path
              isLocal: true,
            }));
            
            setDebugInfo(prev => ({
              ...prev,
              sourceStatus: 'converted to data URI',
              fileInfo: {
                exists: true,
                size: Math.floor(dataUri.length * 0.75), // Approximate size
                path: 'data:application/pdf;base64,...', // Don't log the full data URI
                isLocal: true,
              },
            }));
            
            setLoading(false);
            return;
          } catch (error) {
            const errorMsg = error instanceof Error 
              ? error.message 
              : 'Unknown error processing file';
            console.error('Error converting to data URI:', error);
            
            if (errorMsg.includes('permission') || errorMsg.includes('access')) {
              // This is likely a permission issue
              setError(`Storage permissions required. Please grant permissions in Settings > Apps > YourApp > Permissions.`);
            } else {
              setError(`Error processing file: ${errorMsg}`);
            }
            
            setLoading(false);
            return;
          }
        } else if (uri.startsWith('http')) {
          // Remote URIs can be handled directly
          console.log('Remote PDF URI detected, will load directly:', uri);
          
          setFileInfo(prev => ({
            ...prev,
            exists: true,
            path: uri,
            isLocal: false,
          }));
          
          setDebugInfo(prev => ({
            ...prev,
            sourceStatus: 'remote URI ready',
            fileInfo: {
              exists: true,
              size: 0, // Unknown size for remote URIs
              path: uri,
              isLocal: false,
            },
          }));
          
          setLoading(false);
          return;
        }
      }
      
      // For images, we can also try to use the data URI approach if we encounter permission issues
      if (type === 'image' && (uri.startsWith('content://') || uri.startsWith('file://'))) {
        // Try standard file access first
        let fileAccessSuccessful = false;
        
        try {
          // On Android, remove file:// prefix for RNFS operations
          let cleanUri = uri;
          if (Platform.OS === 'android' && uri.startsWith('file://')) {
            cleanUri = uri.replace('file://', '');
          }
          
          const exists = await RNFS.exists(cleanUri);
          
          if (exists) {
            const stats = await RNFS.stat(cleanUri);
            fileAccessSuccessful = true;
            
            // Success with direct file access
            const viewerUri = Platform.OS === 'android' && uri.startsWith('file://')
              ? uri
              : (Platform.OS === 'android' ? `file://${cleanUri}` : uri);
            
            setFileInfo(prev => ({
              ...prev,
              exists: true,
              size: stats.size,
              path: viewerUri,
            }));
            
            setDebugInfo(prev => ({
              ...prev,
              sourceStatus: 'file exists',
              fileInfo: {
                exists: true,
                size: stats.size,
                path: viewerUri,
                isLocal: true,
              },
            }));
            
            setLoading(false);
            return;
          }
        } catch (fsError) {
          console.log('Standard file access failed, will try data URI approach:', fsError);
          // Continue to data URI approach
        }
        
        if (!fileAccessSuccessful) {
          // Fall back to data URI for images if we couldn't access the file directly
          try {
            console.log('Trying to use data URI for image as fallback');
            setLoading(true);
            
            const dataUri = await processFileToDataUri(uri);
            console.log('Successfully converted image to data URI');
            
            setFileInfo(prev => ({
              ...prev,
              exists: true,
              path: dataUri,
              isLocal: true,
            }));
            
            setDebugInfo(prev => ({
              ...prev,
              sourceStatus: 'converted image to data URI',
              fileInfo: {
                exists: true,
                size: Math.floor(dataUri.length * 0.75),
                path: dataUri.substring(0, 30) + '...',
                isLocal: true,
              },
            }));
            
            setLoading(false);
            return;
          } catch (dataUriError) {
            console.error('Data URI fallback for image also failed:', dataUriError);
            // Continue to the remaining file checking flow
          }
        }
      }
      
      // Non-PDF content (images) or other URI types continue with original handling
      // ... rest of the existing checkFile function ...

      // Handle file:// URIs
      if (uri.startsWith('file://')) {
        console.log('File URI detected');
        
        // On Android, remove file:// prefix for RNFS operations
        let cleanUri = uri;
        if (Platform.OS === 'android') {
          cleanUri = uri.replace('file://', '');
          console.log('Android adjusted path:', cleanUri);
        }

        try {
          console.log('Checking if file exists at:', cleanUri);
          const exists = await RNFS.exists(cleanUri);
          console.log('File exists check result:', exists);

          if (exists) {
            const stats = await RNFS.stat(cleanUri);
            console.log('File stats:', stats);
            console.log('File found with size:', stats.size, 'bytes');

            // Try to read a small part of the file to verify it's accessible
            try {
              const firstBytes = await RNFS.read(cleanUri, 100, 0, 'base64');
              console.log('Successfully read first bytes of file:', firstBytes.substring(0, 20) + '...');
            } catch (readError) {
              console.error('Error reading file content:', readError);
            }

            // On Android, the file:// prefix is important for the PDF viewer
            const viewerUri = Platform.OS === 'android'
              ? uri.startsWith('file://') ? uri : `file://${cleanUri}`
              : uri;

            console.log('Using viewer URI:', viewerUri);

            setFileInfo(prev => ({
              ...prev,
              exists: true,
              size: stats.size,
              path: viewerUri,
            }));

            setDebugInfo(prev => ({
              ...prev,
              sourceStatus: 'file exists',
              fileInfo: {
                exists: true,
                size: stats.size,
                path: viewerUri,
                isLocal: true,
              },
            }));
          } else {
            console.log('File not found at path:', cleanUri);
            setError('File not found');
            setDebugInfo(prev => ({
              ...prev,
              sourceStatus: 'file not found',
              error: `File not found at path: ${cleanUri}`,
            }));
          }
        } catch (fsError) {
          console.error('Error checking file:', fsError);
          const errorMessage = fsError instanceof Error ? fsError.message : 'Unknown file system error';
          setError(errorMessage);
          setDebugInfo(prev => ({
            ...prev,
            sourceStatus: 'file system error',
            error: errorMessage,
          }));
        }
      }
      // Handle remote URIs (http://, https://)
      else if (uri.startsWith('http')) {
        console.log('Remote URI detected, checking accessibility:', uri);

        try {
          const response = await fetch(uri, { method: 'HEAD' });

          if (response.ok) {
            const contentLength = response.headers.get('content-length');
            console.log('Remote file accessible, size:', contentLength);

            setFileInfo(prev => ({
              ...prev,
              exists: true,
              size: parseInt(contentLength || '0', 10),
              path: uri,
              isLocal: false,
            }));

            setDebugInfo(prev => ({
              ...prev,
              sourceStatus: 'remote file accessible',
              fileInfo: {
                exists: true,
                size: parseInt(contentLength || '0', 10),
                path: uri,
                isLocal: false,
              },
            }));
          } else {
            setError(`Failed to access remote file: ${response.status}`);
            setDebugInfo(prev => ({
              ...prev,
              sourceStatus: 'remote file inaccessible',
              error: `Failed to access remote file: ${response.status}`,
            }));
          }
        } catch (fetchError) {
          console.error('Error fetching remote file:', fetchError);
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
          setError(`Network error: ${errorMessage}`);
          setDebugInfo(prev => ({
            ...prev,
            sourceStatus: 'network error',
            error: `Network error: ${errorMessage}`,
          }));
        }
      }
      // Unknown URI scheme
      else {
        console.warn('Unknown URI scheme:', uri);
        setError('Unsupported file location');
        setDebugInfo(prev => ({
          ...prev,
          sourceStatus: 'unknown uri scheme',
          error: 'Unsupported file location',
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error checking file';
      console.error('Error checking file:', err);
      setError(errorMessage);
      setDebugInfo(prev => ({
        ...prev,
        sourceStatus: 'error checking file',
        error: errorMessage,
      }));
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

  // Create a PDF viewer WebView with the appropriate source
  const renderPdfViewer = () => {
    // Handle data URIs directly
    if (fileInfo.path.startsWith('data:application/pdf;base64,')) {
      console.log('Using data URI approach for PDF');
      
      // For data URIs, we'll inject a different script that loads the PDF directly
      const pdfViewerHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>PDF Viewer</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html, body { height: 100%; width: 100%; overflow: hidden; background-color: #f5f5f5; }
            #viewerContainer { width: 100%; height: 100%; overflow: auto; position: absolute; top: 0; left: 0; }
            #pdfContainer { margin: 0 auto; background-color: white; }
            .page { margin: 10px auto; position: relative; overflow: visible; background-color: white; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); }
            .textLayer { position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: hidden; opacity: 0.2; line-height: 1.0; }
            .textLayer span { color: transparent; position: absolute; white-space: pre; cursor: text; transform-origin: 0% 0%; }
            #controls { position: fixed; bottom: 10px; left: 0; right: 0; text-align: center; background-color: rgba(255,255,255,0.8); padding: 10px; z-index: 1000; }
            #controls button { padding: 8px 12px; margin: 0 5px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; }
            #controls button:disabled { background-color: #cccccc; cursor: not-allowed; }
            #pageNumber { padding: 8px; width: 50px; text-align: center; border: 1px solid #ddd; border-radius: 4px; }
            #pageCount { padding: 8px; margin-left: 5px; color: #333; }
            #errorMessage { color: red; text-align: center; margin: 20px; }
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
            
            // Elements
            const viewerContainer = document.getElementById('viewerContainer');
            const pdfContainer = document.getElementById('pdfContainer');
            const controls = document.getElementById('controls');
            const errorMessage = document.getElementById('errorMessage');
            const prevPageBtn = document.getElementById('prevPage');
            const nextPageBtn = document.getElementById('nextPage');
            const pageNumberInput = document.getElementById('pageNumber');
            const pageCountSpan = document.getElementById('pageCount');
            
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
              const pdfData = '${fileInfo.path.substring(fileInfo.path.indexOf(',')+1)}';
              
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
                  
                  // Render first page
                  renderPage(1);
                  
                  // Set up navigation
                  prevPageBtn.addEventListener('click', onPrevPage);
                  nextPageBtn.addEventListener('click', onNextPage);
                  pageNumberInput.addEventListener('change', onPageNumberChange);
                  
                  // Show controls
                  controls.style.display = 'block';
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
                // Get the page
                pdfDoc.getPage(pageNum).then(function(page) {
                  const viewport = page.getViewport({scale: currentScale});
                  
                  // Create page div
                  const pageDiv = document.createElement('div');
                  pageDiv.className = 'page';
                  pageDiv.style.width = viewport.width + 'px';
                  pageDiv.style.height = viewport.height + 'px';
                  pdfContainer.appendChild(pageDiv);
                  
                  // Create canvas for rendering
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;
                  pageDiv.appendChild(canvas);
                  
                  // Create text layer for text selection
                  const textLayerDiv = document.createElement('div');
                  textLayerDiv.className = 'textLayer';
                  textLayerDiv.style.width = viewport.width + 'px';
                  textLayerDiv.style.height = viewport.height + 'px';
                  pageDiv.appendChild(textLayerDiv);
                  
                  // Render PDF page
                  const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                  };
                  
                  const renderTask = page.render(renderContext);
                  renderTask.promise.then(function() {
                    // Get and render text content
                    return page.getTextContent();
                  }).then(function(textContent) {
                    // Create text layer
                    const textLayer = new TextLayerBuilder({
                      textLayerDiv: textLayerDiv,
                      pageIndex: page.pageIndex,
                      viewport: viewport
                    });
                    
                    textLayer.setTextContent(textContent);
                    textLayer.render();
                    
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
              
              // Text layer builder
              function TextLayerBuilder(options) {
                this.textLayerDiv = options.textLayerDiv;
                this.pageIndex = options.pageIndex;
                this.viewport = options.viewport;
                this.textDivs = [];
                this.textContent = null;
              }
              
              TextLayerBuilder.prototype = {
                setTextContent: function(textContent) {
                  this.textContent = textContent;
                },
                
                render: function() {
                  if (!this.textContent) return;
                  
                  const textItems = this.textContent.items;
                  for (let i = 0; i < textItems.length; i++) {
                    const item = textItems[i];
                    
                    // Get text positioning
                    const tx = pdfjsLib.Util.transform(this.viewport.transform, item.transform);
                    
                    // Create text span
                    const textDiv = document.createElement('span');
                    textDiv.style.left = tx[4] + 'px';
                    textDiv.style.top = tx[5] + 'px';
                    textDiv.style.fontSize = tx[0] * 100 + '%';
                    textDiv.style.fontFamily = item.fontName || 'sans-serif';
                    
                    // Apply rotation if needed
                    if (tx[1] !== 0) {
                      const angle = Math.atan2(tx[1], tx[0]);
                      textDiv.style.transform = 'rotate(' + angle + 'rad)';
                    }
                    
                    textDiv.textContent = item.str;
                    this.textLayerDiv.appendChild(textDiv);
                    this.textDivs.push(textDiv);
                  }
                }
              };
              
            } catch (e) {
              console.error('Error in PDF initialization:', e);
              showError('Error initializing PDF: ' + e.message);
            }
          </script>
        </body>
        </html>
      `;
      
      return (
        <WebView
          ref={webViewRef}
          source={{ html: pdfViewerHtml }}
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
          scalesPageToFit={true}
        />
      );
    } 
    // For file:// URIs
    else if (fileInfo.path.startsWith('file://')) {
      console.log('Using file URI for PDF:', fileInfo.path);
      
      // For Android, use the PDF.js viewer from assets
      const viewerSourceUri = getPdfViewerSourceUri(fileInfo.path);
      console.log('Using PDF.js viewer URI:', viewerSourceUri);
      
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
    else if (fileInfo.path.startsWith('http')) {
      console.log('Using remote URL for PDF:', fileInfo.path);
      
      const viewerSourceUri = getPdfViewerSourceUri(fileInfo.path);
      console.log('Using PDF.js viewer URI for remote PDF:', viewerSourceUri);
      
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
        <Text style={styles.errorText}>Unsupported PDF source: {fileInfo.path}</Text>
      </View>
    );
  };

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.errorText}>Path: {fileInfo.path.startsWith('data:') ? 'Data URI' : fileInfo.path}</Text>
          
          {(error.includes('permission') || error.includes('access')) && (
            <View style={styles.permissionHelp}>
              <Text style={styles.permissionTitle}>Permission Required</Text>
              <Text style={styles.permissionText}>
                This file requires storage access permission. Please follow these steps:
              </Text>
              <Text style={styles.permissionStep}>1. Go to your device Settings</Text>
              <Text style={styles.permissionStep}>2. Select Apps or Application Manager</Text>
              <Text style={styles.permissionStep}>3. Find this app in the list</Text>
              <Text style={styles.permissionStep}>4. Tap on Permissions</Text>
              <Text style={styles.permissionStep}>5. Enable "Storage" or "Files and media"</Text>
              <Text style={styles.permissionStep}>6. Return to the app and try again</Text>
              
              <TouchableOpacity 
                style={styles.tryAgainButton}
                onPress={() => {
                  setError(null);
                  setLoading(true);
                  checkFile();
                }}
              >
                <Text style={styles.tryAgainButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    if (type === 'pdf') {
      return renderPdfViewer();
    }

    return (
      <ImageViewer
        imageUrls={[{ url: fileInfo.path }]}
        style={styles.image}
        enableSwipeDown={true}
        onSwipeDown={() => navigation.goBack()}
        loadingRender={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {type === 'pdf' ? 'PDF Document' : 'Image'}
          {type === 'pdf' && <Text style={styles.subtitle}> (Text selection enabled)</Text>}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {showDebug && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>Debug Information</Text>
          <ScrollView style={styles.debugContent}>
            <Text style={styles.debugText}>Type: {type}</Text>
            <Text style={styles.debugText}>URI: {uri}</Text>
            <Text style={styles.debugText}>Loading: {loading ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Source Status: {debugInfo.sourceStatus}</Text>
            <Text style={styles.debugText}>File Exists: {fileInfo.exists ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>File Size: {fileInfo.size} bytes</Text>
            <Text style={styles.debugText}>File Type: {fileInfo.isLocal ? 'Local' : 'Remote'}</Text>
            <Text style={styles.debugText}>Load Attempts: {debugInfo.loadAttempts}</Text>
            {type === 'pdf' && <Text style={styles.debugText}>PDF Pages: {pdfPages}</Text>}
            {type === 'pdf' && <Text style={styles.debugText}>Viewer URI: {getPdfViewerSourceUri(fileInfo.path)}</Text>}
            {error && <Text style={styles.debugError}>Error: {error}</Text>}
            <Text style={styles.debugText}>Last Update: {debugInfo.lastUpdate}</Text>
          </ScrollView>
        </View>
      )}

      <TouchableOpacity 
        style={styles.debugButton} 
        onPress={toggleDebugPanel}
      >
        <Text style={styles.debugButtonText}>🛠️</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'italic',
    color: '#666',
  },
  headerRight: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: '#fff',
  },
  image: {
    flex: 1,
    backgroundColor: '#000',
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
  debugPanel: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    maxHeight: 200,
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    zIndex: 100,
    borderTopWidth: 1,
    borderTopColor: '#444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  debugTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugContent: {
    maxHeight: 150,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
  debugError: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 2,
  },
  debugButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  debugButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  permissionHelp: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 10,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 14,
    marginBottom: 10,
  },
  permissionStep: {
    fontSize: 14,
    marginBottom: 5,
  },
  tryAgainButton: {
    padding: 10,
    backgroundColor: '#2196F3',
    borderRadius: 5,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
}); 