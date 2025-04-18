import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Icon } from '../../../../../components/icons';
import { Language } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  showDropdown: boolean;
  onLanguageSelect: (language: Language) => void;
  onToggleDropdown: () => void;
  languages: Language[];
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  showDropdown,
  onLanguageSelect,
  onToggleDropdown,
  languages,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.selector}
        onPress={onToggleDropdown}
      >
        <Text style={styles.languageText}>{selectedLanguage.name}</Text>
        <Icon name="chevron-down" size={10} color="#6b7280" />
      </TouchableOpacity>
      
      {showDropdown && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownScroll}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.option,
                  language.code === selectedLanguage.code && styles.selectedOption
                ]}
                onPress={() => onLanguageSelect(language)}
              >
                <Text style={[
                  styles.optionText,
                  language.code === selectedLanguage.code && styles.selectedOptionText
                ]}>
                  {language.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  languageText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8b5cf6',
    marginRight: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 28,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    zIndex: 30,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  option: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedOption: {
    backgroundColor: '#f5f3ff',
  },
  optionText: {
    fontSize: 14,
    color: '#4b5563',
  },
  selectedOptionText: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
}); 