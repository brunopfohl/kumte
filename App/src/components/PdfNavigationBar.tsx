import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform } from 'react-native';
import { PdfViewerMethods } from './PdfViewer';

// Import vector icons with fallback
let Icon: any;
try {
  // Try to import MaterialIcons
  Icon = require('react-native-vector-icons/MaterialIcons').default;
} catch (error) {
  // Fallback to a simple component if the library is not available
  Icon = ({ name, size, color }: { name: string, size: number, color: string }) => (
    <Text style={{ color, fontSize: size }}>
      {name === 'navigate-before' ? '◀' : 
       name === 'navigate-next' ? '▶' : 
       name === 'psychology' ? '🧠' : '●'}
    </Text>
  );
}

interface PdfNavigationBarProps {
  viewerRef: React.RefObject<PdfViewerMethods | null>;
  currentPage: number;
  totalPages: number;
  onAIExplain?: (selectedText: string) => void;
  selectedText?: string;
  style?: any;
}

/**
 * A navigation bar for controlling PDF viewer
 * Displays current page, allows page navigation, and shows AI explain button when text is selected
 */
const PdfNavigationBar: React.FC<PdfNavigationBarProps> = ({
  viewerRef,
  currentPage,
  totalPages,
  onAIExplain,
  selectedText,
  style
}) => {
  const [pageInput, setPageInput] = useState(currentPage.toString());
  const [isEditing, setIsEditing] = useState(false);

  // Update input field when current page changes externally
  useEffect(() => {
    if (!isEditing) {
      setPageInput(currentPage.toString());
    }
  }, [currentPage, isEditing]);

  const handleGoToPage = () => {
    setIsEditing(false);
    const pageNumber = parseInt(pageInput);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      viewerRef.current?.goToPage(pageNumber);
    } else {
      // Reset to current page if invalid input
      setPageInput(currentPage.toString());
    }
  };

  const handlePreviousPage = () => {
    viewerRef.current?.goToPreviousPage();
  };

  const handleNextPage = () => {
    viewerRef.current?.goToNextPage();
  };

  const handleAIExplain = () => {
    if (onAIExplain && selectedText) {
      onAIExplain(selectedText);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentPage <= 1 ? styles.disabledButton : null]}
          onPress={handlePreviousPage}
          disabled={currentPage <= 1}
        >
          <Icon name="navigate-before" size={24} color={currentPage <= 1 ? '#aaa' : '#2196F3'} />
        </TouchableOpacity>

        <View style={styles.pageInfoContainer}>
          <TextInput
            style={styles.pageInput}
            value={pageInput}
            onChangeText={setPageInput}
            keyboardType="number-pad"
            returnKeyType="go"
            onFocus={() => setIsEditing(true)}
            onBlur={handleGoToPage}
            onSubmitEditing={handleGoToPage}
          />
          <Text style={styles.pageCount}>/ {totalPages}</Text>
        </View>

        <TouchableOpacity
          style={[styles.navButton, currentPage >= totalPages ? styles.disabledButton : null]}
          onPress={handleNextPage}
          disabled={currentPage >= totalPages}
        >
          <Icon name="navigate-next" size={24} color={currentPage >= totalPages ? '#aaa' : '#2196F3'} />
        </TouchableOpacity>
      </View>

      {selectedText && onAIExplain && (
        <TouchableOpacity style={styles.aiButton} onPress={handleAIExplain}>
          <Icon name="psychology" size={20} color="#fff" />
          <Text style={styles.aiButtonText}>Explain with AI</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopColor: '#e0e0e0',
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
  },
  pageInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  pageInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#2196F3',
    paddingVertical: 2,
    paddingHorizontal: 6,
    minWidth: 36,
    textAlign: 'center',
    color: '#333',
    fontSize: 16,
  },
  pageCount: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  aiButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default PdfNavigationBar; 