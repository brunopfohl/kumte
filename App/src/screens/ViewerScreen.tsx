import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, ScrollView, ActivityIndicator, Platform, PermissionsAndroid, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import RNFS from 'react-native-fs';
import ImageViewer from 'react-native-image-zoom-viewer';
import { DocumentService } from '../services/DocumentService';
import { FileService, Document } from '../services/FileService';
import PdfViewerWithControls from '../components/PdfViewerWithControls';
import LanguageSelector, { Language } from '../components/LanguageSelector';

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
  selectedText?: string;
}

export const ViewerScreen = () => {
  const route = useRoute<ViewerScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { uri, type } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  
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

  // Handle text selection from PDF
  const handleTextSelected = (text: string) => {
    console.log('Selected text:', text);
    setSelectedText(text);
    setDebugInfo(prev => ({
      ...prev,
      selectedText: text,
      lastUpdate: new Date().toISOString(),
    }));
  };

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    // The language selection is saved by the LanguageSelector component
  };

  // Handle PDF loaded event
  const handlePdfLoaded = (pageCount: number) => {
    console.log('PDF loaded with', pageCount, 'pages');
    setPdfPages(pageCount);
    setLoading(false);
    setDebugInfo(prev => ({
      ...prev,
      loading: false,
      pdfPages: pageCount,
      lastUpdate: new Date().toISOString(),
      sourceStatus: 'loaded successfully',
      loadAttempts: prev.loadAttempts + 1,
    }));
  };

  // Handle PDF error event
  const handlePdfError = (errorMessage: string) => {
    console.error('PDF error:', errorMessage);
    setLoading(false);
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

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading {type === 'pdf' ? 'PDF' : 'image'}...</Text>
        </View>
      );
    }

    if (type === 'pdf') {
      return (
        <PdfViewerWithControls 
          uri={fileInfo.path}
          onError={handlePdfError}
        />
      );
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

  const getDocumentTitle = () => {
    // Extract filename from the URI
    if (uri) {
      // For file:// URIs, extract the filename
      if (uri.startsWith('file://')) {
        const pathParts = uri.split('/');
        const filename = pathParts[pathParts.length - 1];
        return decodeURIComponent(filename);
      }
      
      // For content:// URIs, use a generic name
      if (uri.startsWith('content://')) {
        return 'Document';
      }
      
      // For data URIs, use a generic name
      if (uri.startsWith('data:')) {
        return 'PDF Document';
      }
      
      // For remote URLs, extract filename if possible
      if (uri.startsWith('http')) {
        try {
          const url = new URL(uri);
          const pathParts = url.pathname.split('/');
          const filename = pathParts[pathParts.length - 1];
          return filename || 'Document';
        } catch (e) {
          return 'Document';
        }
      }
    }
    
    return type === 'pdf' ? 'PDF Document' : 'Image';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {getDocumentTitle()}
        </Text>
        <LanguageSelector 
          onLanguageChange={handleLanguageChange}
          buttonStyle={styles.languageButton}
        />
      </View>

      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {selectedText.length > 0 && (
        <View style={styles.selectionContainer}>
          <Text style={styles.selectionTitle}>Selected Text:</Text>
          <Text style={styles.selectionText}>{selectedText}</Text>
        </View>
      )}

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
            {selectedText.length > 0 && <Text style={styles.debugText}>Selected Text: {selectedText}</Text>}
            {error && <Text style={styles.debugError}>Error: {error}</Text>}
            <Text style={styles.debugText}>Last Update: {debugInfo.lastUpdate}</Text>
          </ScrollView>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '500',
  },
  languageButton: {
    height: 36,
    paddingHorizontal: 8,
  },
  contentContainer: {
    flex: 1,
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
  selectionContainer: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectionText: {
    fontSize: 14,
    color: '#333',
  },
}); 