import { useState, useMemo } from 'react';
import { Document } from '../../../services/FileService';

export type FilterTab = 'all' | 'recent';

export const useDocumentFilters = (documents: Document[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (searchQuery) {
        return doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      }
      
      if (activeFilter === 'recent') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return doc.date > sevenDaysAgo;
      }
      
      return true;
    });
  }, [documents, searchQuery, activeFilter]);

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredDocuments
  };
}; 