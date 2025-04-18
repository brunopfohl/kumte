import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FilterTab } from '../hooks/useDocumentFilters';

interface FilterTabsProps {
  activeFilter: FilterTab;
  onFilterChange: (filter: FilterTab) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ activeFilter, onFilterChange }) => {
  return (
    <View style={styles.filterContainer}>
      <TouchableOpacity 
        style={[
          styles.filterTab, 
          activeFilter === 'all' && styles.filterTabActive
        ]}
        onPress={() => onFilterChange('all')}
      >
        <Text style={[
          styles.filterTabText,
          activeFilter === 'all' && styles.filterTabTextActive
        ]}>All Files</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.filterTab, 
          activeFilter === 'recent' && styles.filterTabActive
        ]}
        onPress={() => onFilterChange('recent')}
      >
        <Text style={[
          styles.filterTabText,
          activeFilter === 'recent' && styles.filterTabTextActive
        ]}>Recent</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
  },
  filterTabActive: {
    backgroundColor: '#3498db',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterTabTextActive: {
    color: 'white',
  },
}); 