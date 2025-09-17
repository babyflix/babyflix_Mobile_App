import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Video } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

const MediaPreviewModal = ({ visible, item, onClose, insets }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withSpring(1);
    } else {
      scale.value = withSpring(0.8);
      opacity.value = withSpring(0);
    }
  }, [visible]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (!visible) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
    StatusBar.setHidden(visible);
  }, [visible]);

  const closeModal = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    StatusBar.setHidden(false);
    setIsFullScreen(false);
    setIsMaximized(false);
    onClose();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullScreen = () => {
    setIsMaximized(!isMaximized);
  };

  const enterFullScreen = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    setIsFullScreen(true);
    StatusBar.setHidden(false);
  };

  const exitFullScreen = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    setIsFullScreen(false);
    StatusBar.setHidden(false);
  };

  if (!item || !item.object_url) return null;
  
  let objectUrl;
  let ObjectTitle;

  if (item.flix10kAiImages){
    objectUrl = item?.flix10kAiImages?.output_path?.gcs_url;
    ObjectTitle = item?.flix10kAiImages?.output_path?.object_name;
  }else{
    objectUrl = item?.object_url;
    ObjectTitle = item?.title;
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[
          styles.modalContent,
          isFullScreen && styles.maxRotateModelContent,
          isMaximized && styles.maxModalContent,
          Platform.OS === 'ios' ? { paddingTop: insets.top } : null,
          animatedModalStyle
        ]}>

          <View style={[styles.headerInfo,isFullScreen && {marginTop: 0}]}>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {ObjectTitle || "Untitled"}
              </Text>
              <Text style={styles.itemDate}>
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString()
                  : "-"}
              </Text>
            </View>
          </View>

          {item.object_type === 'video' ? (
            <Video
              key={item?.id}
              source={{ uri: item.object_url }}
              style={[styles.modalVideo, isFullScreen && { width: '100%', height: '80%' }]}
              useNativeControls
              shouldPlay={visible}
              isLooping
              isMuted={isMuted}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={{ uri: objectUrl }}
              style={[
                styles.modalImage,
                isMaximized && {
                  width: "100%",
                  height: "82%",
                }
              ]}
              resizeMode="contain"
            />
          )}

          {/* Control buttons */}
          {item.object_type === 'video' ? (
            <View style={styles.controlsContainer}>
              <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
                <View style={styles.controlButtonInner}>
                  <MaterialIcons
                    name={isMuted ? "volume-off" : "volume-up"}
                    size={20}
                    color="white"
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={isFullScreen ? exitFullScreen : enterFullScreen} 
                style={[styles.controlButton, { marginLeft: 8 }]}
              >
                <View style={styles.controlButtonInner}>
                  <MaterialIcons
                    name={isFullScreen ? "stay-current-landscape" : "stay-current-portrait"}
                    size={20}
                    color="white"
                  />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.controlsContainer}>
              <TouchableOpacity onPress={toggleFullScreen} style={styles.controlButton}>
                <View style={styles.controlButtonInner}>
                  <MaterialIcons
                    name={isMaximized ? "fullscreen-exit" : "fullscreen"}
                    size={20}
                    color="white"
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={isFullScreen ? exitFullScreen : enterFullScreen} 
                style={[styles.controlButton, { marginLeft: 8 }]}
              >
                <View style={styles.controlButtonInner}>
                  <MaterialIcons
                    name={isFullScreen ? "stay-current-landscape" : "stay-current-portrait"}
                    size={20}
                    color="white"
                  />
                </View>
              </TouchableOpacity>
            </View>
          )}

           {/* <View style={styles.headerInfo}>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title || "Untitled"}
              </Text>
              <Text style={styles.itemDate}>
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString()
                  : "-"}
              </Text>
            </View>
          </View> */}

          {/* Show InfoCard if flix10kResult is available */}
          {item?.flix10kResult && (
            <View style={[styles.infoCard,(isFullScreen && item.object_type == 'video') && {position: 'absolute',bottom:60,right:10}]}>
              <Text style={styles.infoTitle}>{t("flix10k.info")}</Text>

              <View style={styles.infoRow}>
                <MaterialIcons name="circle" size={4} color="#d63384" />
                <Text style={styles.infoText}>
                  {t("flix10k.gestationalAge")}: {item.flix10kResult.gestational_age || "-"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="circle" size={4} color="#d63384" />
                <Text style={styles.infoText}>
                  {t("flix10k.heartRate")}: {item.flix10kResult.heart_rate || "-"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="circle" size={4} color="#d63384" />
                <Text style={styles.infoText}>
                  {t("flix10k.measurement")}: {item.flix10kResult.measurement || "-"}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <MaterialIcons name="close" size={28} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContent: {
    width: '92%',
    height: '70%',
    maxWidth: Dimensions.get('window').width,
    maxHeight: Dimensions.get('window').height,
    backgroundColor: 'black',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 10,
  },
  maxModalContent: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  maxRotateModelContent: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    maxWidth: Dimensions.get('window').height,
    maxHeight: Dimensions.get('window').width,
  },
  modalImage: {
    width: '100%',
    height: '77%',
    resizeMode: 'contain',
  },
  modalVideo: {
    width: '100%',
    height: '65%',
    resizeMode: 'contain',
  },
  controlsContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    zIndex: 999,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 8,
  },
  controlButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8,
    zIndex: 999,
  },
  headerInfo: {
  // position: "absolute",
  // top: 60, // below buttons
  // left: 12,
  // right: 12,
  backgroundColor: "rgba(0,0,0,0.5)",
  borderRadius: 8,
  padding: 6,
  zIndex: 998,
  marginBottom:10,
  marginTop: 40
},
headerTextWrapper: {
  flexDirection: "column",
  alignItems:'center'
},
itemTitle: {
  color: "white",
  fontSize: 16,
  fontFamily: 'Nunito700',
  marginBottom: 2,
},
itemDate: {
  color: "#ccc",
  fontSize: 14,
},
infoCard: {
  position: 'absolute',
  bottom: 10,
  right: 10,
  backgroundColor: "#c5c4c4ff",
  borderRadius: 8,
  paddingVertical: 6,
  paddingHorizontal: 10,
  marginTop: 12,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
infoTitle: {
  color: "#d63384",
  fontFamily: "Nunito700",
  fontSize: 12,
  marginBottom: 2,
},
infoRow: {
  flexDirection: "row",
  alignItems: "center",
  marginVertical: 2,
},
infoText: {
  fontFamily: "Nunito400",
  fontSize: 10,
  color: "#333",
  marginLeft: 4,
},

});

export default MediaPreviewModal;