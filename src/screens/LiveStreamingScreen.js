import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Header from '../components/Header';
import Colors from '../constants/Colors';
import GlobalStyles from '../styles/GlobalStyles';
import { useSelector, useDispatch } from 'react-redux';
import { liveStreamUpdate } from '../state/slices/streamSlice';
import { router } from 'expo-router';
import moment from 'moment';

const LiveStreamingScreen = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const videoRef = useRef(null);
  const dispatch = useDispatch();
  const streamState = useSelector(state => state.stream);

  const streamingUrl = streamState.streamUrl || '';
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loadAsync({ uri: streamingUrl }, {}, false);
      videoRef.current.playAsync();
    }

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
    try {
      const response = await fetch(url, {
        method: 'GET',
      });

      if (response.ok) {
      } else {
        if (streamState.streamState == 'live') {
          updateLiveStreamState(url, false, 'stop', '');
          setModalVisible(true);
          clearInterval(intervalId);
        } else {
          updateLiveStreamState('', true, '', '');
        }
      }
    } catch (error) {
      updateLiveStreamState(url, false, '', '');
      setModalVisible(true);

    }
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

        <View style={styles.previewContainer}>
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: streamingUrl }}
            useNativeControls={true}
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
          />
        </View>
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

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  liveTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: Colors.primary,
  },
  previewContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: Colors.black,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  video: {
    width: '100%',
    height: '100%',
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
});

export default LiveStreamingScreen;
