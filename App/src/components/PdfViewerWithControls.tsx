import React, { useRef, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import PdfViewer, { PdfViewerMethods } from './PdfViewer';
import PdfNavigationBar from './PdfNavigationBar';

interface PdfViewerWithControlsProps {
  uri: string;
  onError?: (error: string) => void;
}

/**
 * Enhanced PDF Viewer with external controls
 * Combines the PdfViewer with a custom navigation bar
 */
const PdfViewerWithControls: React.FC<PdfViewerWithControlsProps> = ({
  uri,
  onError
}) => {
  const pdfViewerRef = useRef<PdfViewerMethods>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedText, setSelectedText] = useState<string | undefined>(undefined);
  const [aiPanelVisible, setAiPanelVisible] = useState(false);

  const handlePdfLoaded = (pageCount: number, initialPage: number) => {
    setTotalPages(pageCount);
    setCurrentPage(initialPage);
  };

  const handlePageChanged = (pageNumber: number, totalPageCount: number) => {
    setCurrentPage(pageNumber);
    setTotalPages(totalPageCount);
    
    // If page changes, hide any AI panel that might be visible
    if (aiPanelVisible) {
      setAiPanelVisible(false);
    }
  };

  const handleTextSelected = (text: string) => {
    setSelectedText(text);
  };

  const handleAIExplain = (text: string) => {
    // Toggle AI panel visibility when AI explain is requested
    setAiPanelVisible(!aiPanelVisible);
    
    // In the future, this would call the actual AI service
    console.log(`AI insight requested for: "${text.substring(0, 80)}${text.length > 80 ? '...' : ''}"`);
  };

  return (
    <View style={styles.container}>
      <PdfViewer
        ref={pdfViewerRef}
        uri={uri}
        onLoaded={handlePdfLoaded}
        onPageChanged={handlePageChanged}
        onTextSelected={handleTextSelected}
        onError={onError}
        hideControls={true} // Hide built-in controls since we're using custom ones
      />
      
      <PdfNavigationBar
        viewerRef={pdfViewerRef}
        currentPage={currentPage}
        totalPages={totalPages}
        selectedText={selectedText}
        onAIExplain={handleAIExplain}
        style={styles.navigationBar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    margin: 8,
  },
  navigationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  }
});

export default PdfViewerWithControls; 