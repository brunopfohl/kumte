import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  FlatList,
  SafeAreaView
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Language globe icon
export const LanguageIcon = ({ color = "#6b7280", size = 20 }: { color?: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <Path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
    <Path d="M3.6 9h16.8" />
    <Path d="M3.6 15h16.8" />
    <Path d="M11.5 3a17 17 0 0 0 0 18" />
    <Path d="M12.5 3a17 17 0 0 1 0 18" />
  </Svg>
);

export type Language = {
  code: string;
  name: string;
};

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'cs', name: 'Czech' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
];

export const STORAGE_KEY = 'selectedLanguage';

interface LanguageSelectorProps {
  onLanguageChange?: (language: Language) => void;
  buttonStyle?: any;
  textStyle?: any;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  onLanguageChange,
  buttonStyle,
  textStyle
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]);

  // Load the selected language from AsyncStorage when component mounts
  React.useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguageCode = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedLanguageCode) {
          const language = LANGUAGES.find(lang => lang.code === savedLanguageCode);
          if (language) {
            setSelectedLanguage(language);
          }
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    loadLanguage();
  }, []);

  const selectLanguage = async (language: Language) => {
    setSelectedLanguage(language);
    setModalVisible(false);
    
    // Save selection to AsyncStorage
    try {
      await AsyncStorage.setItem(STORAGE_KEY, language.code);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
    
    // Notify parent component if callback provided
    if (onLanguageChange) {
      onLanguageChange(language);
    }
  };

  return (
    <View>
      <TouchableOpacity 
        style={[styles.languageButton, buttonStyle]} 
        onPress={() => setModalVisible(true)}
      >
        <LanguageIcon />
        <Text style={[styles.languageButtonText, textStyle]}>
          {selectedLanguage.name}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selectedLanguage.code === item.code && styles.languageItemSelected
                  ]}
                  onPress={() => selectLanguage(item)}
                >
                  <Text 
                    style={[
                      styles.languageItemText,
                      selectedLanguage.code === item.code && styles.languageItemTextSelected
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedLanguage.code === item.code && (
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M5 12l5 5l10 -10" />
                    </Svg>
                  )}
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#6b7280',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  languageItemSelected: {
    backgroundColor: '#f5f3ff',
  },
  languageItemText: {
    fontSize: 16,
    color: '#374151',
  },
  languageItemTextSelected: {
    fontWeight: '600',
    color: '#8B5CF6',
  },
});

export default LanguageSelector; 