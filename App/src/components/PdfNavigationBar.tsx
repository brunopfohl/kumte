import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, Animated } from 'react-native';
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
          name === 'psychology' ? '🧠' :
            name === 'star' ? '⭐' :
              name === 'auto_awesome' ? '✨' :
                name === 'light_mode' ? '💡' :
                  name === 'close' ? '×' : '●'}
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
  const [showAIPanel, setShowAIPanel] = useState(false);
  const aiPanelOpacity = useState(new Animated.Value(0))[0];
  const aiPanelHeight = useState(new Animated.Value(0))[0];
  const [aiActivated, setAiActivated] = useState(false);

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
      // Change button state
      setAiActivated(!aiActivated);

      // Call the parent handler
      onAIExplain(selectedText);

      // Toggle AI panel visibility
      setShowAIPanel(!showAIPanel);
      Animated.parallel([
        Animated.timing(aiPanelOpacity, {
          toValue: showAIPanel ? 0 : 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(aiPanelHeight, {
          toValue: showAIPanel ? 0 : 1,
          duration: 300,
          useNativeDriver: false,
        })
      ]).start();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.mainControlsContainer}>
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentPage <= 1 ? styles.disabledButton : null]}
            onPress={handlePreviousPage}
            disabled={currentPage <= 1}
          >
            <Icon name="navigate-before" size={28} color={currentPage <= 1 ? '#999' : '#333'} />
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
              selectTextOnFocus={true}
            />
            <Text style={styles.pageCount}>of {totalPages}</Text>
          </View>

          <TouchableOpacity
            style={[styles.navButton, currentPage >= totalPages ? styles.disabledButton : null]}
            onPress={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <Icon name="navigate-next" size={28} color={currentPage >= totalPages ? '#999' : '#333'} />
          </TouchableOpacity>
        </View>

        {selectedText ? (
          <TouchableOpacity
            style={[styles.aiIconButton, aiActivated && styles.aiIconButtonActive]}
            onPress={handleAIExplain}
            activeOpacity={0.8}
          >
            <Icon
              name="light_mode"
              size={24}
              color={aiActivated ? "#fff" : "#fff"}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.aiButtonPlaceholder} />
        )}
      </View>

      {showAIPanel && (
        <Animated.View
          style={[
            styles.aiPanel,
            {
              opacity: aiPanelOpacity,
              maxHeight: aiPanelHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 180]
              })
            }
          ]}
        >
          <View style={styles.aiPanelContent}>
            <View style={styles.selectedTextContainer}>
              <Text numberOfLines={2} style={styles.selectedTextLabel}>SELECTED TEXT</Text>
              <Text numberOfLines={2} style={styles.selectedTextValue}>
                {selectedText ? selectedText.substring(0, 120) + (selectedText.length > 120 ? '...' : '') : ''}
              </Text>
            </View>

            <View style={styles.aiResponseContainer}>
              <View style={styles.aiResponseHeader}>
                <Text style={styles.aiResponseTitle}>AI INSIGHTS</Text>
                <TouchableOpacity style={styles.closeButton} onPress={handleAIExplain}>
                  <Icon name="close" size={18} color="#888" />
                </TouchableOpacity>
              </View>
              <Text style={styles.aiResponseText}>
                This text appears to discuss an important concept. I can help you understand it better.
              </Text>
              <View style={styles.aiActionRow}>
                <TouchableOpacity style={styles.aiAction}>
                  <Text style={styles.aiActionText}>Summarize</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.aiAction}>
                  <Text style={styles.aiActionText}>Explain</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.aiAction}>
                  <Text style={styles.aiActionText}>Define</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  mainControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 30,
    paddingHorizontal: 10,
    height: 50,
    flex: 1,
    maxWidth: '80%',
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  pageInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#6200ee',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 36,
    textAlign: 'center',
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  pageCount: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  aiIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffb6c1',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#ffb6c1',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  aiIconButtonActive: {
    backgroundColor: '#ff758c',
    transform: [{ scale: 1.05 }],
  },
  aiButtonPlaceholder: {
    width: 48,
  },
  aiPanel: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    overflow: 'hidden',
  },
  aiPanelContent: {
    padding: 20,
  },
  selectedTextContainer: {
    backgroundColor: '#f8f9fb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  selectedTextLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  selectedTextValue: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  aiResponseContainer: {
    backgroundColor: '#fff',
  },
  aiResponseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiResponseTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ff758c',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  aiResponseText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 12,
  },
  aiActionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  aiAction: {
    backgroundColor: '#f8f9fb',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  aiActionText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  }
});

export default PdfNavigationBar; 