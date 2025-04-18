import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Icon from '../../../components/icons';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerGradient} />
      <View style={styles.diagonalGradient} />
      <View style={styles.bottomAccent} />
      <View style={styles.topHighlight} />
      
      <View style={styles.headerContent}>
        <Text style={styles.title}>IntelliRead</Text>
        <View style={styles.searchContainer}>
          <Icon name="search" size={18} color="rgba(255, 255, 255, 0.8)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 30,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3498db',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#ffffff',
    opacity: 0.15,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  diagonalGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#2ecc71',
    opacity: 0.6,
    transform: [{ skewY: '-20deg' }, { translateY: -120 }],
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#2980b9',
    opacity: 0.3,
  },
  headerContent: {
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: 'white',
    padding: 0,
    height: 40,
  },
}); 