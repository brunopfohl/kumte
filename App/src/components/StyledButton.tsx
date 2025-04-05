import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

type StyledButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export function StyledButton({ title, onPress, variant = 'primary' }: StyledButtonProps) {
  const buttonClasses = variant === 'primary' 
    ? 'bg-blue-500 active:bg-blue-700' 
    : 'bg-gray-500 active:bg-gray-700';

  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`px-4 py-2 rounded-lg ${buttonClasses}`}
    >
      <Text className="text-white font-bold text-center">
        {title}
      </Text>
    </TouchableOpacity>
  );
} 