import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

const CommonSVG = ({ color }) => {
  return (
    <>
      <View style={styles.topWave}>
        <Svg
          width={width * 1.05} 
          height={110}
          viewBox="0 0 1440 320"
          style={styles.svgStyle}
        >
          <Path
            fill={Colors.primary}
            d="M1440,256 C1080,128 720,352 360,256 C0,160 0,0 0,0 L1440,0 Z"
          />
        </Svg>
      </View>

      <View style={styles.bottomWave}>
        <Svg
          width={width * 1.05}
          height={110}
          viewBox="0 0 1440 320"
          style={styles.svgStyle}
        >
          <Path
            fill={color}
            d="M0,64 C360,192 720,-32 1080,64 C1440,160 1440,320 1440,320 L0,320 Z"
          />
        </Svg>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  topWave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    alignItems: 'center',
    overflow: 'hidden',
  },
  bottomWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    alignItems: 'center',
    overflow: 'hidden',
  },
  svgStyle: {
    marginTop: -15, 
    marginBottom: -15,
  },
});

export default CommonSVG;