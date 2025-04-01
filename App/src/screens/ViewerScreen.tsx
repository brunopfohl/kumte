import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, ScrollView, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import Pdf from 'react-native-pdf';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import RNFS from 'react-native-fs';
import ImageViewer from 'react-native-image-zoom-viewer';

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

export const ViewerScreen = () => {
  const route = useRoute<ViewerScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { uri, type } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState(0);
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

    const checkFile = async () => {
      try {
        console.log('Checking file with URI:', uri);

        // Handle file:// URIs (preferred for better compatibility)
        if (uri.startsWith('file://')) {
          console.log('File URI detected');

          // For Android, we may need to remove the file:// prefix when checking with RNFS
          let cleanUri = uri;

          // On Android, remove file:// prefix for RNFS operations
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
        // Handle content:// URIs (from Android storage access framework)
        else if (uri.startsWith('content://')) {
          console.log('Content URI detected');

          // Content URIs are handled directly by the PDF viewer
          setFileInfo(prev => ({
            ...prev,
            exists: true,
            path: uri,
            isLocal: true,
          }));

          setDebugInfo(prev => ({
            ...prev,
            sourceStatus: 'content uri ready',
            fileInfo: {
              exists: true,
              size: 0, // Size cannot be determined for content URIs
              path: uri,
              isLocal: true,
            },
          }));
          setLoading(false);
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

    checkFile();
  }, [uri, type]);

  const handlePdfLoadComplete = (numberOfPages: number) => {
    console.log(`PDF loaded successfully with ${numberOfPages} pages`);
    if (loading) {
      setLoading(false);
    }
    setPdfPages(numberOfPages);
    setDebugInfo(prev => ({
      ...prev,
      loading: false,
      pdfPages: numberOfPages,
      lastUpdate: new Date().toISOString(),
      sourceStatus: 'loaded successfully',
      loadAttempts: prev.loadAttempts + 1,
    }));
  };

  const handlePdfError = (err: unknown) => {
    console.error('PDF loading error:', err);
    setLoading(false);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while loading PDF';
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

  const handleImageLoadComplete = () => {
    console.log('Image loaded successfully');
    setLoading(false);
    setDebugInfo(prev => ({
      ...prev,
      loading: false,
      lastUpdate: new Date().toISOString(),
      sourceStatus: 'loaded successfully',
    }));
  };

  const handleImageError = () => {
    console.error('Image loading error');
    setLoading(false);
    setError('Failed to load image');
    setDebugInfo(prev => ({
      ...prev,
      loading: false,
      error: 'Failed to load image',
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
          <Text style={styles.errorText}>Path: {fileInfo.path}</Text>
        </View>
      );
    }

    if (type === 'pdf') {
      // Prepare source object based on URI type
      let source: any = { uri: fileInfo.path, cache: false };

      // For file:// URIs, ensure proper handling on Android
      if (fileInfo.path.startsWith('file://') && Platform.OS === 'android') {
        // On Android, we may need additional settings
        source = {
          uri: fileInfo.path,
          cache: false,
          // Add a timestamp parameter to avoid caching issues
          cacheFileName: `pdf-${Date.now()}.pdf`
        };
        console.log('Using optimized Android PDF source config:', source);
      }

      return (
        <Pdf
          source={source}
          style={styles.pdf}
          onLoadComplete={handlePdfLoadComplete}
          onError={handlePdfError}
          enablePaging={true}
          trustAllCerts={false}
          enableAnnotationRendering={false}
          fitPolicy={0}
          spacing={0}
          renderActivityIndicator={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
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
        </Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

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
          {error && <Text style={styles.debugError}>Error: {error}</Text>}
          <Text style={styles.debugText}>Last Update: {debugInfo.lastUpdate}</Text>
        </ScrollView>
      </View>
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
  headerRight: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdf: {
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
}); 