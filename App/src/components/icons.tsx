import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

export type IconType = 
  | 'camera'
  | 'download'
  | 'upload'
  | 'file'
  | 'file-doc'
  | 'file-docx'
  | 'file-pdf'
  | 'file-txt'
  | 'focus'
  | 'jpg'
  | 'png'
  | 'svg'
  | 'tex'
  | 'search'
  | 'clock';

interface IconProps extends SvgProps {
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps & { name: IconType }> = ({
  name,
  size = 24,
  color = 'currentColor',
  ...props
}) => {
  const icons: Record<IconType, React.FC<IconProps>> = {
    camera: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    download: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M7 11l5 5l5 -5" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 4l0 12" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    upload: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M7 9l5 -5l5 5" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 4l0 12" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    file: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M14 3v4a1 1 0 0 0 1 1h4" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    'file-doc': (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M14 3v4a1 1 0 0 0 1 1h4" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M5 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M20 16.5a1.5 1.5 0 0 0 -3 0v3a1.5 1.5 0 0 0 3 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12.5 15a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1 -3 0v-3a1.5 1.5 0 0 1 1.5 -1.5z" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    'file-docx': (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M14 3v4a1 1 0 0 0 1 1h4" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M2 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M17 16.5a1.5 1.5 0 0 0 -3 0v3a1.5 1.5 0 0 0 3 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M9.5 15a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1 -3 0v-3a1.5 1.5 0 0 1 1.5 -1.5z" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M19.5 15l3 6" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M19.5 21l3 -6" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    'file-pdf': (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M14 3v4a1 1 0 0 0 1 1h4" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M17 18h2" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M20 15h-3v6" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    'file-txt': (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M14 3v4a1 1 0 0 0 1 1h4" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M14 3v4a1 1 0 0 0 1 1h4" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M16.5 15h3" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M4.5 15h3" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M6 15v6" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M18 15v6" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M10 15l4 6" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M10 21l4 -6" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    focus: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M4 8v-2a2 2 0 0 1 2 -2h2" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M4 16v2a2 2 0 0 0 2 2h2" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M16 4h2a2 2 0 0 1 2 2v2" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M16 20h2a2 2 0 0 0 2 -2v-2" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    jpg: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M21 8h-2a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2v-4h-1" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M10 16v-8h2a2 2 0 1 1 0 4h-2" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M3 8h4v6a2 2 0 0 1 -2 2h-1.5a.5 .5 0 0 1 -.5 -.5v-.5" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    png: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M21 8h-2a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2v-4h-1" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M3 16v-8h2a2 2 0 1 1 0 4h-2" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M10 16v-8l4 8v-8" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    svg: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M21 8h-2a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2v-4h-1" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M7 8h-3a1 1 0 0 0 -1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-3" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M10 8l1.5 8h1l1.5 -8" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    tex: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M9 8v-1h-6v1" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M6 15v-8" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M21 15l-5 -8" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M16 15l5 -8" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M14 11h-4v8h4" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M10 15h3" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    search: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M21 21l-6 -6" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    clock: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 7v5l3 3" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
  };

  const IconComponent = icons[name];
  return <IconComponent size={size} color={color} {...props} />;
};

export default Icon; 