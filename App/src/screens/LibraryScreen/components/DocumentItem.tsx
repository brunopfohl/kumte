import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import Icon from '../../../components/icons';
import PdfThumbnail from './PdfThumbnail';
import { Document } from '../../../services/FileService';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2 columns with padding

interface DocumentItemProps {
  document: Document;
  onPress: (document: Document) => void;
  onOptionsPress: (document: Document) => void;
}

export const DocumentItem: React.FC<DocumentItemProps> = ({ 
  document, 
  onPress, 
  onOptionsPress 
}) => {
  return (
    <TouchableOpacity 
      style={styles.documentCard}
      onPress={() => onPress(document)}
    >
      <View style={styles.documentPreviewContainer}>
        {document.type === 'pdf' ? (
          <PdfThumbnail 
            document={document} 
            width={ITEM_WIDTH}
            height={180} 
          />
        ) : (
          <Image
            source={{ uri: document.uri }}
            style={styles.documentThumbnail}
            resizeMode="cover"
          />
        )}
        <TouchableOpacity 
          style={styles.optionsButton}
          onPress={() => onOptionsPress(document)}
        >
          <Icon name="more" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle} numberOfLines={2}>{document.title}</Text>
        <View style={styles.documentMeta}>
          <Icon name="clock" size={12} color="#94a3b8" style={styles.metaIcon} />
          <Text style={styles.documentDate}>
            {document.date instanceof Date ? 
              document.date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              }) : 
              String(document.date)
            }
          </Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.documentType}>{document.type.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  documentCard: {
    width: ITEM_WIDTH,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 0,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  documentPreviewContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    position: 'relative',
  },
  documentThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
  },
  documentInfo: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'center',
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  documentDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  metaSeparator: {
    fontSize: 12,
    color: '#cbd5e1',
    marginHorizontal: 4,
  },
  documentType: {
    fontSize: 12,
    color: '#94a3b8',
  },
  optionsButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
}); 