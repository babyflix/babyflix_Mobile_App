import React, { useRef } from 'react';
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
import { useDispatch } from 'react-redux';

const { width } = Dimensions.get('window');
const itemSize = (width - 40) / 2.2;

const GalleryItem = ({
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
}) => {
  const dispatch = useDispatch();
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
    if (selectionMode || flix10kSelectionMode) {
      onToggleSelection(item);
      toggleItemSelection(item);
    } else {
      onPreview(item);
    }
  };

  // const handleLongPress = () => {
  //   if (!disableMenuAndSelection && !flix10kSelectionMode) {
  //     onToggleSelection(item);
  //   }
  // };

  return (
    <>
      <TouchableOpacity style={[styles.card, (isSelected || selectedItemsForAi) && styles.selectedMediaItem,]}
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
              style={styles.actionBtnDownload}
              onPress={() => {
                setSelectedItem([item]);
                setShowDownloadModal(true);
              }}
            >
              <MaterialIcons name="file-download" size={18} color="white" />
              {/* <Text style={styles.actionText}>Download</Text> */}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnShare}
              onPress={() => {
                setSelectedItem([item]);
                setShowShareModal(true);
              }}
            >
              <MaterialIcons name="share" size={18} color="white" />
              {/* <Text style={styles.actionText}>Share</Text> */}
            </TouchableOpacity>

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
        {(isSelected || flix10kSelectionMode || selectedItemsForAi) && (
          <View style={[styles.selectionOverlayPrev, (isSelected || selectedItemsForAi) && styles.selectionOverlay]}>
            <MaterialIcons
              name={
                isSelected || selectedItemsForAi
                  ? 'check-box'
                  : 'check-box-outline-blank'
              }
              size={isSelected || selectedItemsForAi ? 22 : 25}
              color={Colors.primary}
            />
          </View>
        )}
      </TouchableOpacity>
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
    justifyContent: 'space-between',
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
});

export default React.memo(GalleryItem);