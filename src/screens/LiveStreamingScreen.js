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
import { Ionicons } from '@expo/vector-icons';

const LiveStreamingScreen = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);


  const videoRef = useRef(null);
  const dispatch = useDispatch();
  const streamState = useSelector(state => state.stream);

  const streamingUrl = streamState.streamUrl || '';
  console.log('streamingUrl',streamingUrl)
  // useEffect(() => {
  //   console.log('useEffect 3');
  
  //   const playVideo = async () => {
  //     if (videoRef.current) {
  //       try {
  //         await videoRef.current.loadAsync({ uri: streamingUrl }, {}, false);
  //         await videoRef.current.playAsync(); 
  //       } catch (err) {
  //         console.error('Video playback error:', err);
  //       }
  //     }
  //   };

  //   if (!streamingUrl) {
  //     console.warn("Streaming URL is empty, skipping video load.");
  //     return;
  //   }
  
  //   playVideo();
  
  //   const id = setInterval(() => {
  //     checkUrlStatus(streamingUrl, dispatch);
  //   }, 3000);
  
  //   setIntervalId(id);
  
  //   return () => {
  //     clearInterval(id);
  //   };
  // }, [streamState.streamState]);
  
  // const checkUrlStatus = async (url, dispatch) => {
  //   if (streamState.streamState != 'live') {
  //     return;
  //   }
  //   try {
  //     const response = await fetch(url, {
  //       method: 'GET',
  //     });
  //     console.log('response.ok 2',response.ok)
  //     if (response.ok) {
  //     } else {
  //       if (streamState.streamState == 'live') {
  //         updateLiveStreamState(url, false, 'stop', '');
  //         setModalVisible(true);
  //         clearInterval(intervalId);
  //       } else {
  //         updateLiveStreamState('', true, '', '');
  //       }
  //     }
  //   } catch (error) {
  //     updateLiveStreamState(url, false, '', '');
  //     setModalVisible(true);

  //   }
  // };

   useEffect(() => {
    console.log('useEffect 3')
      // if (videoRef.current) {
      //   videoRef.current.loadAsync({ uri: streamingUrl }, {}, false);
      //   videoRef.current.playAsync();
      // }

      const playVideo = async () => {
        if (videoRef.current) {
          console.log('videoRef:', videoRef.current);
          if (!streamingUrl || !streamingUrl.startsWith('http') || streamState.streamState !== 'live') {
            console.log("Invalid stream URL or state, skipping load.");
            return;
          }
      
          console.log("Trying to load video from", streamingUrl);
          try {
            await videoRef.current.loadAsync(
              { uri: streamingUrl },
              { shouldPlay: true },
            );
            await videoRef.current.playAsync();
            console.log('Video loaded and playing...');
          } catch (err) {
            console.error('Video playback error:', err);
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
      if (streamState.streamState != 'live') {
        return;
      }
      // try {
      //   const response = await fetch(url, {
      //     method: 'GET',
      //   });
      //   console.log('response ok 2',response.ok)
      //   if (response.ok) {
      //   } else {
      //     if (streamState.streamState == 'live') {
      //       updateLiveStreamState(url, false, 'stop', '');
      //       setModalVisible(true);
      //       clearInterval(intervalId);
      //     } else {
      //       updateLiveStreamState('', true, '', '');
      //     }
      //   }
      // } catch (error) {
      //   updateLiveStreamState(url, false, '', '');
      //   setModalVisible(true);
  
      // }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

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
        console.log("text",text)
        console.log('response ok 2',response.ok)
        if (!response.ok || !text.includes('#EXTM3U')) {
          console.log('!text.includes(#EXTM3U)',!text.includes('#EXTM3U'))
          updateLiveStreamState(url, false, 'stop', '');
          setModalVisible(true);
          clearInterval(intervalId);
        }
      } catch (err) {
        console.log('Fetch failed or aborted', err);
        updateLiveStreamState(url, false, 'stop', '');
        setModalVisible(true);
        clearInterval(intervalId);
      }

    };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const handleModalClose = () => {
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
      <Header title="Live Streaming" />

<ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.liveTitle}>Video Streaming is Live</Text>

      {streamState.streamState === 'live' && streamingUrl?.startsWith('https') ? (
      <View style={[styles.previewContainer, isMinimized ? styles.maximized : styles.minimized ]}>
      <Video
        ref={videoRef}
        style={styles.video}
        useNativeControls={false}
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        isMuted={isMuted}
        onReadyForDisplay={() => {
          console.log('✅ Video component is ready');
          // Optionally: set a state like setVideoReady(true)
        }}
        onError={(e) => {
          console.error('❌ Video error:', e);
          setModalVisible(true); // Show error modal if needed
        }}
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
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
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
  },
  muteButton: {
    position: 'absolute',
    top: 0,
    right: 30,
    padding: 6,
    borderRadius: 20
  }  
});

export default LiveStreamingScreen;