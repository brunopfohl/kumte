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

  const handlePdfLoaded = (pageCount: number, initialPage: number) => {
    setTotalPages(pageCount);
    setCurrentPage(initialPage);
  };

  const handlePageChanged = (pageNumber: number, totalPageCount: number) => {
    setCurrentPage(pageNumber);
    setTotalPages(totalPageCount);
  };

  const handleTextSelected = (text: string) => {
    setSelectedText(text);
  };

  const handleAIExplain = (text: string) => {
    // This would be replaced with actual AI explanation functionality
    Alert.alert(
      "AI Explanation",
      `In the future, this will provide an AI explanation for: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`,
      [{ text: "OK" }]
    );
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
    backgroundColor: '#fff',
  },
  navigationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  }
});

export default PdfViewerWithControls; 