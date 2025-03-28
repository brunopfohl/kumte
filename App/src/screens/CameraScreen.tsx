import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { CameraScreenProps } from '../types';
import { FileService } from '../services/FileService';

const { width } = Dimensions.get('window');
const frameSize = width * 0.7;

export const CameraScreen: React.FC<CameraScreenProps> = ({ navigation }) => {
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [grid, setGrid] = useState(false);
  const [autoMode, setAutoMode] = useState(true);

  const handleCaptureDocument = async () => {
    setCapturing(true);
    try {
      const document = await FileService.captureDocument();
      if (document) {
        Alert.alert(
          'Success',
          'Document captured successfully',
          [
            { 
              text: 'View Document', 
              onPress: () => navigation.navigate('Viewer', {
                uri: document.uri,
                type: document.type
              })
            },
            { 
              text: 'Back to Library', 
              onPress: () => navigation.navigate('Library')
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error capturing document:', error);
      Alert.alert('Error', 'Failed to capture document');
    } finally {
      setCapturing(false);
    }
  };

  const toggleFlash = () => setFlash(!flash);
  const toggleGrid = () => setGrid(!grid);
  const toggleAutoMode = () => setAutoMode(!autoMode);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Capture Document</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.cameraContainer}>
        <View style={styles.viewfinder}>
          <View style={styles.frame}>
            {grid && (
              <>
                <View style={styles.gridHorizontal} />
                <View style={styles.gridVertical} />
              </>
            )}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        <Text style={styles.instruction}>
          Position your document within the frame
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCaptureDocument}
          disabled={capturing}
        >
          {capturing ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[styles.optionButton, autoMode && styles.optionButtonActive]}
            onPress={toggleAutoMode}
          >
            <Text style={[styles.optionText, autoMode && styles.optionTextActive]}>Auto</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionButton, flash && styles.optionButtonActive]}
            onPress={toggleFlash}
          >
            <Text style={[styles.optionText, flash && styles.optionTextActive]}>Flash</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.optionButton, grid && styles.optionButtonActive]}
            onPress={toggleGrid}
          >
            <Text style={[styles.optionText, grid && styles.optionTextActive]}>Grid</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: frameSize,
    height: frameSize * 1.4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: '100%',
    height: '100%',
  },
  gridHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: '50%',
  },
  gridVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    left: '50%',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#3a86ff',
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  instruction: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  controlsContainer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  optionButtonActive: {
    backgroundColor: '#3a86ff',
  },
  optionText: {
    color: '#fff',
    fontSize: 14,
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 