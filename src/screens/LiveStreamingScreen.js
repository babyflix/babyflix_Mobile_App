import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Header from '../components/Header';
import Colors from '../constants/Colors';
import GlobalStyles from '../styles/GlobalStyles';
import { useSelector, useDispatch } from 'react-redux';
import { liveStreamUpdate } from '../state/slices/streamSlice';
import { router, useFocusEffect } from 'expo-router';
import moment from 'moment';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

const LiveStreamingScreen = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
const [isMinimized, setIsMinimized] = useState(true);
const [isRotated, setIsRotated] = useState(false);


  const videoRef = useRef(null);
  const dispatch = useDispatch();
  const streamState = useSelector(state => state.stream);

  const streamingUrl = streamState.streamUrl || '';

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const isLandscape = window.width > window.height;
      setIsFullScreen(isLandscape); 
    });
  
    return () => {
      subscription.remove();
    };
  }, []);

   useEffect(() => {
    console.log('useEffect 3')

      const playVideo = async () => {
        if (videoRef.current && streamState.streamState == 'live') {
          if (!streamingUrl || !streamingUrl.startsWith('http') || streamState.streamState !== 'live') {
            return;
          }
      
          try {
            await videoRef.current.loadAsync(
              { uri: streamingUrl },
              { shouldPlay: true },
              false
            );
            await videoRef.current.playAsync();
          } catch (err) {
            setModalVisible(true);
          }
        }
      };
    
      playVideo();
  
      const id = setInterval(() => {
        checkUrlStatus(streamingUrl, dispatch);
      }, 3000);
  
      setIntervalId(id);
  
      return () => clearInterval(id);
    }, [streamState.streamState]);

    const checkUrlStatus = async (url, dispatch) => {
      if (streamState.streamState !== 'live') {
        return;
      }
    
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); 
    
      try {
        const response = await fetch(url + '?nocache=' + Date.now(), {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          signal: controller.signal,
        });
    
        clearTimeout(timeoutId);
    
        const text = await response.text();
        const isLiveStream = response.ok && text.includes('#EXTM3U');
    
        console.log('✅ response.ok:2', response.ok);
        console.log('✅ text contains #EXTM3U:', text.includes('#EXTM3U'));
    
        if (!isLiveStream) {
          if (streamState.streamState === 'live') {
            updateLiveStreamState('', false, 'stop', '');
            setModalVisible(true);
            if (intervalId) {
              clearInterval(intervalId);
              setIntervalId(null);
            }
          }else{
            updateLiveStreamState('', true, '', '');
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
    
        if (err.name === 'AbortError') {
        }
    
        if (streamState.streamState === 'live') {
          updateLiveStreamState('', false, 'stop', '');
          if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
          }
        }
      }
    };
    
    const enterFullScreen = () => {
      setIsFullScreen(true);
      setIsMinimized(false);
      setIsRotated(true);
    };
    
    const exitFullScreen = () => {
      setIsFullScreen(false);
      setIsMinimized(true);
      setIsRotated(false);
    };    
    

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const handleModalClose = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    setModalVisible(false);
    setTimeout(() => {
      router.replace('gallery');
    }, 100);
    updateLiveStreamState('', false, '', moment().toISOString());
    clearInterval(intervalId);
  };

  const updateLiveStreamState = (streamUrl, isStreamStarted, streamState, reStart) => {
    dispatch(liveStreamUpdate({
      streamUrl: streamUrl,
      isStreamStarted: isStreamStarted,
      streamState: streamState,
      reStart: reStart,
    }));
  }  

  return (
    <View style={GlobalStyles.container}>
      {!isFullScreen &&<Header title="Live Streaming" />}

   <ScrollView contentContainerStyle={styles.container}>
   {!isFullScreen && <Text style={styles.liveTitle}>Video Streaming is Live</Text>}

      {streamState.streamState === 'live' && streamingUrl?.startsWith('https') ? (
      <View
      style={[
        styles.previewContainer,
        isMinimized ? styles.minimized : styles.maximized,
        isFullScreen && styles.maxRotateModelContent,
        isRotated && styles.rotated,
      ]}
    >    
      <Video
        ref={videoRef}
        style={[styles.video]}
        useNativeControls={false}
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        isMuted={isMuted}
        // onReadyForDisplay={() => {
        //   console.log('✅ Video component is ready');
        //   // Optionally: set a state like setVideoReady(true)
        // }}
      />
      <View style={styles.overlay}>
          <Text style={styles.liveLabel}>LIVE</Text>

          <View style={styles.controls}>
            {isMinimized ? (
              <TouchableOpacity onPress={handleMaximize}>
                <Ionicons name="expand-outline" size={24} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleMinimize}>
                <Ionicons name="contract-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.muteButton} onPress={() => setIsMuted(!isMuted)}>
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={24}
            color="white"
          />
        </TouchableOpacity>

         <TouchableOpacity onPress={isFullScreen ? exitFullScreen : enterFullScreen} style={styles.rotateButton}>
            <View style={styles.muteButtonText}>
              <MaterialIcons
                name={isFullScreen ? "stay-current-landscape" : "stay-current-portrait"}
                size={20}
                color="white"
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      ) : (
        <Text style={{ textAlign: 'center', color: 'gray', marginVertical: 20 }}>
          Waiting for live stream...
        </Text>
      )}
    </ScrollView>
    

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible && streamState.streamState == 'stop'}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Stopped</Text>
            <Text style={styles.modalMessage}>Live streaming is stopped now, please try again when started.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleModalClose}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  rotated: {
    width:  screenHeight-65,
    height: Math.min(screenWidth, screenHeight),    
    position: 'absolute',
    top: 0,
    left: 0,
    right:-65,
    backgroundColor: 'black',
    borderRadius:0,
    zIndex: 1000,
    transform: [
      { rotate: '90deg' },
      { translateX: ((screenHeight - 65) - screenWidth) / 2 },
      { translateY: (screenHeight - screenWidth-65) / 2 }
    ],
  },
  container: {
    padding: 16,
  },
  liveTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: Colors.primary,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginVertical: 10,
    textAlign: 'center',
  },
  modalButton: {
    marginTop: 15,
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: 16,
  },
  liveTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  previewContainer: {
    position: 'relative',
    width: Math.max(screenWidth, screenHeight),
    height: Math.min(screenWidth, screenHeight),
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'black',
    padding: 10,
  },  
  video: {
    width: '100%',
    height: '100%',
  },
  minimized: {
    height: 220,
    width: '100%',
  },
  maximized: {
    height: screenHeight,
    width: screenWidth,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999, 
    backgroundColor: 'black', 
  },
  
  overlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveLabel: {
    backgroundColor: 'red',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: 'bold',
    fontSize: 12,
    marginTop : 10
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  muteButton: {
    position: 'absolute',
    top: 0,
    right: 30,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  rotateButton: {
    position: 'absolute',
    top: 6,
    left: 43,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    borderRadius: 5,
  },
  muteButtonText: {
    color: 'white',
    fontSize: 10,
  },  
  maxRotateModelContent: { 
    width: screenHeight, 
    height: screenWidth,
    backgroundColor: 'black',
    padding: 10,
    },
});

export default LiveStreamingScreen;