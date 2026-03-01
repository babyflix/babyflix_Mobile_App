import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors.js';
import MediaMenu from './MediaMenu';
import { defaultThumbnail } from '../../assets/images/Pause_video.js';
import moment from 'moment-timezone';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const itemSize = (width - 40) / 2.2;

const GalleryItem = ({
  mediaData,
  item,
  isSelected,
  isMenuVisible,
  onPreview,
  onToggleSelection,
  selectionMode,
  disableMenuAndSelection,
  setActiveMenuId,
  setSelectedItem,
  setSelectedItems,
  setShowDeleteModal,
  setShowDownloadModal,
  setShowShareModal,
  flix10kSelectionMode,
  selectedItemsForAi,
  toggleItemSelection,
  onRequireSubscription,
}) => {
  const dispatch = useDispatch();
  const scaleAnim = useRef(new Animated.Value(1)).current;
   const [freeCreditUsed, setFreeCreditUsed] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  // ✅ selector
  const { subscriptionId, subscriptionIsActive } = useSelector(
    (state) => state.auth
  );

  // 🔍 check if user already has predictive image in gallery
const hasPredictiveImage = Array.isArray(mediaData)
  ? mediaData.some(m => m?.object_type === "predictiveBabyImage")
  : (
      mediaData?.predictiveBabyImages &&
      mediaData.predictiveBabyImages.length > 0
    );

  console.log("subscriptionId, subscriptionIsActive", subscriptionId, subscriptionIsActive)
  // ✅ MUST BE HERE (top-level)
  const isSubscribed = !!subscriptionIsActive && !!subscriptionId;
  const isFreeUser = !isSubscribed;
  const freeCreditAvailable = isFreeUser && !freeCreditUsed && !hasPredictiveImage;

  console.log("isSubscribed, isFreeUser, freeCreditAvailable", isSubscribed, isFreeUser, freeCreditAvailable)

  useEffect(() => {
    const loadCredit = async () => {
      const used = await AsyncStorage.getItem('freeFlixCreditUsed');
      setFreeCreditUsed(used === 'true');
    };

    loadCredit();
  }, []);

 const isAiSelected =
    Array.isArray(selectedItemsForAi) &&
    selectedItemsForAi.includes(item.id || item);

  const selectedCount = Array.isArray(selectedItemsForAi)
      ? selectedItemsForAi.length
      : 0;

      console.log("isAiSelected",isAiSelected,selectedItemsForAi)
    // ⭐ free user single-select rule
    const isOtherItemDisabled  =
      freeCreditAvailable && selectedCount >= 1 && !isAiSelected;

  const formatCreatedAtToIST = (created_at) => {
    const istDate = moment.utc(created_at).tz('Asia/Kolkata');
    const date = istDate.format('DD/MM/YYYY');
    const time = istDate.format('HH:mm');
    return `${date} | ${time}`;
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (isOtherItemDisabled) {
      return;
    }
    if (selectionMode || flix10kSelectionMode) {
      onToggleSelection(item);
      toggleItemSelection(item);
    } else {
      onPreview(item);
    }
  };

  const handleConvertPress = (e) => {
    e?.stopPropagation?.(); // ⭐⭐⭐ VERY IMPORTANT

    if (isFreeUser && (freeCreditUsed || hasPredictiveImage)) {
      setShowSubscribeModal(true); // we will add this
      return;
    }

    console.log("isOtherItemDisabled",isOtherItemDisabled)

    if (isOtherItemDisabled) {
      console.log("here")
      return;
    }

    toggleItemSelection(item, { forceSingle: true });
    onToggleSelection(item);
  };

  // const handleLongPress = () => {
  //   if (!disableMenuAndSelection && !flix10kSelectionMode) {
  //     onToggleSelection(item);
  //   }
  // };

  return (
    <>
      <TouchableOpacity style={[styles.card, (isSelected || isAiSelected) && styles.selectedMediaItem,]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        //onLongPress={handleLongPress}
        activeOpacity={0.8}
      >
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[
              styles.mediaItem,
              //(isSelected || selectedItemsForAi) && styles.selectedMediaItem,
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            //onLongPress={handleLongPress}
            activeOpacity={0.8}
          >
            {item.object_type === 'image' && (
            <TouchableOpacity
              style={styles.convertBtn}
              onPress={(e) => handleConvertPress(e)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="auto-fix-high" size={14} color="#fff" />
              <Text style={styles.convertText}>CONVERT</Text>
            </TouchableOpacity>
          )}

            <Image
              source={{
                uri:
                  item.object_type === 'video'
                    ? item.thumbnail_url || defaultThumbnail
                    : item.object_url,
              }}
              style={styles.mediaImage}
              resizeMode="cover"
            />

            {item.object_type === 'video' && (
              <View style={styles.videoBadge}>
                <MaterialIcons
                  name="play-circle-filled"
                  size={16}
                  color="white"
                />
                <Text style={styles.videoDuration}>
                  {formatCreatedAtToIST(item.created_at)}
                </Text>
              </View>
            )}

            {/* {(isSelected || flix10kSelectionMode || selectedItemsForAi) && (
            <View style={styles.selectionOverlay}>
              <MaterialIcons
                name={
                  isSelected || selectedItemsForAi
                    ? 'check-circle'
                    : 'radio-button-unchecked'
                }
                size={24}
                color={isSelected || selectedItemsForAi ? Colors.primary : '#ccc'}
              />
            </View>
          )} */}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title || "Untitled"}
          </Text>
          <Text style={styles.date}>
            {item.created_at ? formatCreatedAtToIST(item.created_at) : "-"}
          </Text>
        </View>

        {!disableMenuAndSelection &&
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtnDownload, !isSubscribed && { marginRight: 12,marginLeft: 20,}]}
              onPress={() => {
                setSelectedItem([item]);
                setShowDownloadModal(true);
              }}
            >
              <MaterialIcons name="file-download" size={18} color="white" />
              {/* <Text style={styles.actionText}>Download</Text> */}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtnShare, !isSubscribed && { marginRight: 20,marginLeft: 12,}]}
              onPress={() => {
                setSelectedItem([item]);
                setShowShareModal(true);
              }}
            >
              <MaterialIcons name="share" size={18} color="white" />
              {/* <Text style={styles.actionText}>Share</Text> */}
            </TouchableOpacity>

            {isSubscribed && (
            <TouchableOpacity
              style={styles.actionBtnDelete}
              onPress={() => {
                setSelectedItem([item]);
                setShowDeleteModal(true);
              }}
            >
              <MaterialIcons name="delete" size={18} color="white" />
              {/* <Text style={styles.actionText}>Delete</Text> */}
            </TouchableOpacity>
            )}
          </View>
        }

        {/* Media Menu */}
        {/* {!disableMenuAndSelection && (
        <TouchableOpacity
          style={styles.menuIcon}
          onPress={() => setActiveMenuId(isMenuVisible ? null : item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="more-vert" size={18} color="white" />
        </TouchableOpacity>
      )}

      {isMenuVisible && (
        <>
          <TouchableWithoutFeedback onPress={() => setActiveMenuId(null)}>
            <View style={[StyleSheet.absoluteFillObject, { zIndex: 1 }]} />
          </TouchableWithoutFeedback>

          <MediaMenu
            item={item}
            onClose={() => setActiveMenuId(null)}
            setSelectedItem={setSelectedItem}
            setShowDeleteModal={setShowDeleteModal}
            setShowDownloadModal={setShowDownloadModal}
            setShowShareModal={setShowShareModal}
          />
        </>
      )} */}
        {(isSelected || flix10kSelectionMode || isAiSelected) && (
          <View style={[styles.selectionOverlayPrev, (isSelected || isAiSelected) && styles.selectionOverlay]}>
            <MaterialIcons
              name={
                (isSelected || isAiSelected)
                  ? 'check-box'
                  : isOtherItemDisabled
                  ? 'check-box-outline-blank'
                  : 'check-box-outline-blank'
              }
              size={isSelected || isAiSelected ? 22 : 25}
              color={
                (isSelected || isAiSelected)
                  ? Colors.primary
                  : isOtherItemDisabled
                  ? '#bbb'
                  : Colors.primary
              }
            />
          </View>
        )}
      </TouchableOpacity>

      <Modal
        transparent
        visible={showSubscribeModal}
        animationType="fade"
        onRequestClose={() => setShowSubscribeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paywallBox}>

            {/* ⭐ Title */}
            <Text style={styles.paywallTitle}>
              Subscribe Flix10K
            </Text>

            {/* ⭐ Subtitle */}
            <Text style={styles.paywallText}>
              To continue generating AI images, please subscribe to Flix10K and unlock unlimited baby predictions.
            </Text>

            {/* ⭐ Buttons */}
            <View style={styles.paywallActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowSubscribeModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.proceedBtn}
                onPress={() => {
                  setShowSubscribeModal(false);
                  onRequireSubscription?.();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.proceedText}>Proceed</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    width: '46%'
  },
  header: {
    marginTop: 8,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Nunito700',
    fontSize: 13,
    color: '#222',
  },
  date: {
    fontFamily: 'Nunito400',
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  mediaItem: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  selectedMediaItem: {
    borderWidth: 3,
    borderColor: Colors.primary,
    opacity: 0.8,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoDuration: {
    color: 'white',
    fontSize: 8,
    fontFamily: 'Nunito400',
    marginLeft: 2,
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopLeftRadius: 12,
    //padding: 0,

    borderBottomWidth: 2,
    borderRightWidth: 2,
    //borderBlockEndColor: Colors.primary,
    borderBottomColor: Colors.primary,
    borderRightColor: Colors.primary
  },
  selectionOverlayPrev: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  menuIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
    zIndex: 5,
    elevation: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 6,
    paddingVertical: 6,
    //backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  actionBtnDownload: {
    alignItems: 'center',
    flex: 1,
    borderRadius: '50%',
    backgroundColor: '#00c851',
    padding: 8,
    marginRight: 7,
    marginLeft: 7,
    //width:'7%'
  },
  actionBtnShare: {
    alignItems: 'center',
    flex: 1,
    borderRadius: '50%',
    backgroundColor: '#0072ff',
    padding: 8,
    marginLeft: 6,
    marginRight: 6,
    //width:'7%',
  },
  actionBtnDelete: {
    alignItems: 'center',
    flex: 1,
    borderRadius: '50%',
    backgroundColor: '#ff4444',
    padding: 8,
    marginLeft: 7,
    marginRight: 7,
    //width:'6%',
  },
  actionText: {
    fontSize: 10,
    color: '#333',
    marginTop: 2,
    fontFamily: 'Nunito400',
  },

  convertBtn: {
  position: 'absolute',
  bottom: 8,
  alignSelf: 'center',
  backgroundColor: '#a23b72',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 6,
  flexDirection: 'row',
  alignItems: 'center',
  zIndex: 5,
},

convertText: {
  color: '#fff',
  fontSize: 11,
  fontFamily: 'Nunito700',
  marginLeft: 4,
},
paywallBox: {
  width: '85%',
  backgroundColor: '#fff',
  borderRadius: 20,
  paddingVertical: 24,
  paddingHorizontal: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius: 20,
  elevation: 10,
  alignItems: 'center',
},

paywallTitle: {
  fontSize: 20,
  fontFamily: 'Nunito700',
  color: '#9b2c6f',
  marginBottom: 10,
  textAlign: 'center',
},

paywallText: {
  fontSize: 14,
  fontFamily: 'Nunito400',
  color: '#555',
  textAlign: 'center',
  lineHeight: 20,
},

paywallActions: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 24,
  width: '100%',
},

proceedBtn: {
  flex: 1,
  backgroundColor: '#d63384',
  paddingVertical: 12,
  borderRadius: 12,
  alignItems: 'center',
  marginLeft: 8,
  shadowColor: '#d63384',
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 4,
},

proceedText: {
  color: '#fff',
  fontFamily: 'Nunito700',
  fontSize: 14,
},

cancelBtn: {
  flex: 1,
  borderWidth: 1.5,
  borderColor: '#d63384',
  paddingVertical: 11,
  borderRadius: 12,
  alignItems: 'center',
  marginRight: 8,
  backgroundColor: '#fff',
},

cancelBtnText: {
  color: '#d63384',
  fontFamily: 'Nunito700',
  fontSize: 14,
},

modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.55)',
  justifyContent: 'center',
  alignItems: 'center',
},

disabledCardSoft: {
  opacity: 0.65, // 👈 softer
},
});

export default GalleryItem;