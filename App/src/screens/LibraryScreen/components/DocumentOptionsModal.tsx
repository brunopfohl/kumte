import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { Document } from '../../../services/FileService';
import Icon from '../../../components/icons';

const { width } = Dimensions.get('window');

type DocumentOptionsModalProps = {
  visible: boolean;
  document: Document;
  onClose: () => void;
  onView: () => void;
  onRename: () => void;
  onDelete: () => void;
};

export const DocumentOptionsModal: React.FC<DocumentOptionsModalProps> = ({
  visible,
  onClose,
  onView,
  onRename,
  onDelete,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Document Options</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionButton} onPress={onView}>
              <View style={styles.optionIconContainer}>
                <Icon name="eye" size={20} color="#3498db" />
              </View>
              <Text style={styles.optionText}>View Document</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={onRename}>
              <View style={styles.optionIconContainer}>
                <Icon name="pencil" size={20} color="#3498db" />
              </View>
              <Text style={styles.optionText}>Rename Document</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, styles.deleteButton]} 
              onPress={onDelete}
            >
              <View style={[styles.optionIconContainer, styles.deleteIconContainer]}>
                <Icon name="trash" size={20} color="#ef4444" />
              </View>
              <Text style={[styles.optionText, styles.deleteText]}>Delete Document</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: width * 0.9,
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ebf5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteIconContainer: {
    backgroundColor: '#fee2e2',
  },
  deleteText: {
    color: '#ef4444',
  },
}); 