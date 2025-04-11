import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Colors from '../constants/Colors';

const CommonSVG = ({ color }) => {
  return (
    <>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 }}>
        <Svg height="87" width="101%" viewBox="0 0 1440 320">
          <Path fill={Colors.primary} d="M1440,256 C1080,128 720,352 360,256 C0,160 0,0 0,0 L1440,0 Z" />
        </Svg>
      </View>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 0 }}>
        <Svg height="87" width="99%" viewBox="0 0 1440 320">
          <Path fill={color} d="M0,64 C360,192 720,-32 1080,64 C1440,160 1440,320 1440,320 L0,320 Z" />
        </Svg>
      </View>
    </>
  );
};

export default CommonSVG;
