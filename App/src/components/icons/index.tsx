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
  | 'clock'
  | 'quiz'
  | 'question'
  | 'more'
  | 'close'
  | 'eye'
  | 'pencil'
  | 'trash'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'chat'
  | 'send'
  | 'check'
  | 'language';

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
    quiz: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M3.5 5.5l1.5 1.5l2.5 -2.5" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M3.5 11.5l1.5 1.5l2.5 -2.5" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M3.5 17.5l1.5 1.5l2.5 -2.5" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M11 6l9 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M11 12l9 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M11 18l9 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    question: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M8 8a3.5 3 0 0 1 3.5 -3h1a3.5 3 0 0 1 0 7h-.5h-1a3.5 3 0 0 0 -3 3v1" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 19v.01" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    more: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    close: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M18 6L6 18" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M6 6l12 12" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    eye: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    pencil: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M4 20h4l10.5 -10.5a1.5 1.5 0 0 0 -4 -4l-10.5 10.5v4" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M13.5 6.5l4 4" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    trash: (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M4 7l16 0" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M10 11l0 6" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M14 11l0 6" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    ),
    'chevron-left': (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 20 20" fill="none" {...props}>
        <Path
          fillRule="evenodd"
          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
          clipRule="evenodd"
          fill={props.color}
        />
      </Svg>
    ),
    'chevron-right': (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 20 20" fill="none" {...props}>
        <Path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
          fill={props.color}
        />
      </Svg>
    ),
    'chevron-down': (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
        <Path d="M6 9l6 6 6-6" />
      </Svg>
    ),
    'chat': (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
        <Path d="M0 0h24v24H0z" stroke="none" fill="none" />
        <Path d="M17.802 17.292s.077 -.055 .2 -.149c1.843 -1.425 3 -3.49 3 -5.789c0 -4.286 -4.03 -7.764 -9 -7.764c-4.97 0 -9 3.478 -9 7.764c0 4.288 4.03 7.646 9 7.646c.424 0 1.12 -.028 2.088 -.084c1.262 .82 3.104 1.493 4.716 1.493c.499 0 .734 -.41 .414 -.828c-.486 -.596 -1.156 -1.551 -1.416 -2.29z" />
        <Path d="M7.5 13.5c2.5 2.5 6.5 2.5 9 0" />
      </Svg>
    ),
    'send': (props) => (
      <Svg
        width={props.size}
        height={props.size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={props.color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <Path d="M8 9h8" />
        <Path d="M8 13h6" />
        <Path d="M14.5 18.5l-2.5 2.5l-3 -3h-3a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v4.5" />
        <Path d="M19 22v.01" />
        <Path d="M19 19a2.003 2.003 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" />
      </Svg>
    ),
    'check': (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
        <Path d="M5 12l5 5l10 -10" />
      </Svg>
    ),
    'language': (props) => (
      <Svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
        <Path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <Path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
        <Path d="M3.6 9h16.8" />
        <Path d="M3.6 15h16.8" />
        <Path d="M11.5 3a17 17 0 0 0 0 18" />
        <Path d="M12.5 3a17 17 0 0 1 0 18" />
      </Svg>
    ),
  };

  const IconComponent = icons[name];
  return <IconComponent size={size} color={color} {...props} />;
};

export default Icon; 