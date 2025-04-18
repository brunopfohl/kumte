import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface GenerateIconProps {
  color?: string;
}

export const GenerateIcon: React.FC<GenerateIconProps> = ({ color = "currentColor" }) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M3 8l4.394 4.394a2 2 0 0 1 0 2.83L3 19.5" />
    <Path d="M13.757 6.833l1.122 1.122a3 3 0 0 1 0 4.243l-1.122 1.122a3 3 0 0 1 -4.243 0l-1.122 -1.122a3 3 0 0 1 0 -4.243l1.122 -1.122a3 3 0 0 1 4.243 0z" />
    <Path d="M21 15l-4.394 -4.394a2 2 0 0 1 0 -2.83L21 4" />
  </Svg>
); 