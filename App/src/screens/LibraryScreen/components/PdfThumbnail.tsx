import React, { useState, useEffect, memo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Pdf from 'react-native-pdf';
import { Document } from '../../../services/FileService';
import { DocumentService } from '../../../services/DocumentService';
import Icon from '../../../components/icons';

interface PdfThumbnailProps {
  document: Document;
  width: number;
  height: number;
}

const PdfThumbnail: React.FC<PdfThumbnailProps> = memo(({ document, width, height }) => {
  const [loading, setLoading] = useState(true);
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (document.uri.startsWith('mock-')) {
      setLoading(false);
      setError(true);
    }
  }, [document.uri]);

  useEffect(() => {
    if (document.uri.startsWith('mock-')) {
      return;
    }
    
    let isMounted = true;
    
    const preparePdf = async () => {
      try {
        if (!uri && isMounted) {
          setLoading(true);
          setError(false);

          const preparedUri = await DocumentService.prepareDocumentForViewing(document);
          if (isMounted) {
            setUri(preparedUri);
          }
        }
      } catch (error) {
        console.error('Error preparing PDF thumbnail:', error);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    preparePdf();
    
    return () => {
      isMounted = false;
    };
  }, [document, uri]);

  if (loading) {
    return (
      <View style={[styles.container, { width, height }]}>
        <ActivityIndicator size="small" color="#ff7675" />
      </View>
    );
  }

  if (error || !uri || document.uri.startsWith('mock-')) {
    return (
      <View style={[styles.container, styles.fallbackContainer, { width, height }]}>
        <Icon name="file-pdf" size={24} color="white" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <Pdf
        source={{ uri }}
        style={[styles.pdf, { width, height }]}
        page={1}
        singlePage={true}
        enablePaging={false}
        renderActivityIndicator={() => <ActivityIndicator size="small" color="#ff7675" />}
        onLoadComplete={() => setLoading(false)}
        onError={() => {
          console.error('Error rendering PDF thumbnail');
          setError(true);
        }}
        minScale={1.0}
        maxScale={1.0}
        scale={1.0}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8faff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fallbackContainer: {
    backgroundColor: '#ff7675',
  },
  pdf: {
    backgroundColor: 'transparent',
  },
});

export default PdfThumbnail; 