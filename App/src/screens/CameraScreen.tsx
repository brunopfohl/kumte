import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, ActivityIndicator, Alert, Platform } from 'react-native';
import { CameraScreenProps } from '../types';
import { FileService } from '../services/FileService';
import { Camera, useCameraDevice, CameraPermissionStatus } from 'react-native-vision-camera';
import { PermissionsAndroid } from 'react-native';

const { width } = Dimensions.get('window');
const frameSize = width * 0.7;

export const CameraScreen: React.FC<CameraScreenProps> = ({ navigation }) => {
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [grid, setGrid] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take pictures.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const permission = await Camera.requestCameraPermission();
        setHasPermission(permission === 'granted');
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      Alert.alert('Error', 'Failed to check camera permission');
    }
  };

  const handleCaptureDocument = async () => {
    console.log('Starting capture...');
    console.log('Camera ref:', cameraRef.current);
    console.log('Device:', device);
    
    if (!cameraRef.current || !device) {
      console.log('Camera not ready - ref:', !!cameraRef.current, 'device:', !!device);
      Alert.alert('Error', 'Camera is not ready');
      return;
    }
    
    setCapturing(true);
    try {
      console.log('Attempting to take photo...');
      const photo = await cameraRef.current.takePhoto({
        flash: flash ? 'on' : 'off',
        enableAutoRedEyeReduction: autoMode,
      });
      console.log('Photo captured:', photo);

      if (photo.path) {
        console.log('Photo path:', photo.path);
        const document = {
          title: 'Captured Document',
          type: 'image' as const,
          uri: photo.path
        };
        
        console.log('Saving document...');
        const savedDoc = await FileService.addDocument(document);
        console.log('Document saved:', savedDoc);
        
        if (savedDoc) {
          Alert.alert(
            'Success',
            'Document captured successfully',
            [
              { 
                text: 'View Document', 
                onPress: () => navigation.navigate('Viewer', {
                  uri: savedDoc.uri,
                  type: savedDoc.type
                })
              },
              { 
                text: 'Back to Library', 
                onPress: () => navigation.navigate('Library')
              },
            ]
          );
        }
      } else {
        console.log('No photo path received');
        Alert.alert('Error', 'Failed to capture photo - no path received');
      }
    } catch (error: any) {
      console.error('Error capturing document:', error);
      Alert.alert('Error', `Failed to capture document: ${error?.message || 'Unknown error'}`);
    } finally {
      setCapturing(false);
    }
  };

  const toggleFlash = () => setFlash(!flash);
  const toggleGrid = () => setGrid(!grid);
  const toggleAutoMode = () => setAutoMode(!autoMode);

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Camera Permission Required</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Please grant camera permission in your device settings to use this feature.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
          enableZoomGesture
        />
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

        {/* Debug Information Overlay */}
        <View style={styles.debugOverlay}>
          <Text style={styles.debugText}>Camera Status:</Text>
          <Text style={styles.debugText}>Permission: {hasPermission ? 'Granted' : 'Not Granted'}</Text>
          <Text style={styles.debugText}>Device: {device ? 'Available' : 'Not Available'}</Text>
          <Text style={styles.debugText}>Camera Ref: {cameraRef.current ? 'Initialized' : 'Not Initialized'}</Text>
          <Text style={styles.debugText}>Flash: {flash ? 'On' : 'Off'}</Text>
          <Text style={styles.debugText}>Auto Mode: {autoMode ? 'On' : 'Off'}</Text>
          <Text style={styles.debugText}>Capturing: {capturing ? 'Yes' : 'No'}</Text>
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
    position: 'absolute',
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
    position: 'absolute',
    bottom: 100,
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  debugOverlay: {
    position: 'absolute',
    top: 80,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
}); 