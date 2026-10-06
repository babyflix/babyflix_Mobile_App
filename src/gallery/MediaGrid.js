import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Text, StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import GalleryItem, { SubscribePaywallModal } from './GalleryItem';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { setSubscriptionExpired } from '../state/slices/subscriptionSlice';

const keyExtractor = (item) => item.id?.toString();

const MediaGrid = React.memo(({
  data = [],
  type = 'all',
  onPreview,
  refreshing,
  onRefresh,
  selectedItems,
  setSelectedItems,
  selectionMode,
  setSelectionMode,
  activeMenuId,
  setActiveMenuId,
  setShowDeleteModal,
  setShowDownloadModal,
  setShowShareModal,
  setSelectedItem,
  disableMenuAndSelection,
  flix10kSelectionMode,
  selectedItemsForAi,
  toggleItemSelection,
  onRequireSubscription,
  scrollY,
  itemActionsTourTarget,
  itemConvertTourTarget,
}) => {
  const { t } = useTranslation();
  const flatListRef = useRef();
  const router = useRouter();
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (scrollY) scrollY.value = 0;
    }, [scrollY])
  );

  // Runs on the UI thread, so tracking scroll position for the banner
  // collapse no longer competes with JS work while scrolling.
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollY) scrollY.value = event.contentOffset.y;
    },
  });

  const filteredData = useMemo(
    () => (type === 'all' ? data : data.filter(item => item.object_type === type)),
    [data, type]
  );

  // Latest values for the stable callbacks below, so passing them to every
  // card doesn't force all cards to re-render when one selection changes.
  const latestRef = useRef({});
  latestRef.current = {
    filteredData,
    selectionMode,
    selectedItems,
    disableMenuAndSelection,
    onPreview,
  };

  const toggleSelection = useCallback((item) => {
    const { disableMenuAndSelection, selectionMode, selectedItems } = latestRef.current;
    if (disableMenuAndSelection) return;
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedItems([item]);
    } else {
      const exists = selectedItems.find(i => i.id === item.id);
      if (exists) {
        const updated = selectedItems.filter(i => i.id !== item.id);
        setSelectedItems(updated);
        if (updated.length === 0) setSelectionMode(false);
      } else {
        setSelectedItems(prev => [...prev, item]);
      }
    }
  }, [setSelectionMode, setSelectedItems]);

  const handleItemPreview = useCallback((item) => {
    const { filteredData, onPreview } = latestRef.current;
    const index = filteredData.findIndex(i => i.id === item.id);
    onPreview?.(item, index === -1 ? 0 : index, filteredData);
  }, []);

  const handleRequestSubscribe = useCallback(() => {
    setShowSubscribeModal(true);
  }, []);

  // Same as the Flix10K banner button when the subscription has expired:
  // send the user to Profile → Subscriptions to renew.
  const dispatch = useDispatch();
  const handleSubscriptionExpired = useCallback(() => {
    dispatch(setSubscriptionExpired(true));
    router.push({
      pathname: "/profile",
      params: { screen: "Subscriptions" },
    });
  }, [dispatch, router]);

  const selectedIds = useMemo(
    () => new Set((selectedItems || []).map(i => i.id)),
    [selectedItems]
  );

  const aiSelectionList = Array.isArray(selectedItemsForAi) ? selectedItemsForAi : null;
  const hasAiSelection = !!aiSelectionList && aiSelectionList.length >= 1;

  const renderItem = useCallback(({ item, index }) => (
    <GalleryItem
      item={item}
      isSelected={selectedIds.has(item.id)}
      isAiSelected={!!aiSelectionList && aiSelectionList.includes(item.id || item)}
      hasAiSelection={hasAiSelection}
      isMenuVisible={activeMenuId === item.id}
      onPreview={handleItemPreview}
      onToggleSelection={toggleSelection}
      selectionMode={selectionMode}
      disableMenuAndSelection={disableMenuAndSelection}
      setActiveMenuId={setActiveMenuId}
      setSelectedItem={setSelectedItem}
      setSelectedItems={setSelectedItems}
      setShowDeleteModal={setShowDeleteModal}
      setShowDownloadModal={setShowDownloadModal}
      setShowShareModal={setShowShareModal}
      flix10kSelectionMode={flix10kSelectionMode}
      toggleItemSelection={toggleItemSelection}
      onRequestSubscribe={handleRequestSubscribe}
      onSubscriptionExpired={handleSubscriptionExpired}
      itemActionsTourTarget={index === 0 && type === 'image' ? itemActionsTourTarget : undefined}
      itemConvertTourTarget={index === 0 && type === 'image' ? itemConvertTourTarget : undefined}
    />
  ), [
    selectedIds,
    aiSelectionList,
    hasAiSelection,
    activeMenuId,
    handleItemPreview,
    toggleSelection,
    selectionMode,
    disableMenuAndSelection,
    setActiveMenuId,
    setSelectedItem,
    setSelectedItems,
    setShowDeleteModal,
    setShowDownloadModal,
    setShowShareModal,
    flix10kSelectionMode,
    toggleItemSelection,
    handleRequestSubscribe,
    handleSubscriptionExpired,
    type,
    itemActionsTourTarget,
    itemConvertTourTarget,
  ]);

  return (
    <>
      {flix10kSelectionMode &&
        <View style={styles.container}>
          <MaterialIcons name="lightbulb-outline" size={22} color="#f39c12" />

          <Text style={styles.text}>
            {t("upload.uploadOwnImages")}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/upload")}
          >
            <LinearGradient
              colors={["#d63384", "#9b2c6f"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.uploadButton,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <MaterialIcons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={[styles.uploadText, { color: "#fff" }]}>{t("upload.upload")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      }

      <Animated.FlatList
        ref={flatListRef}
        data={filteredData}
        renderItem={renderItem}
        numColumns={2}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('gallery.noMedia')}</Text>
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        // removeClippedSubviews can leave cells blank on iOS; it only pays
        // off on Android.
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={9}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      />

      <SubscribePaywallModal
        visible={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        onProceed={() => {
          setShowSubscribeModal(false);
          onRequireSubscription?.();
        }}
      />
    </>
  );
});

const styles = StyleSheet.create({
  gridContainer: {
    padding: 8,
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    fontFamily: 'Nunito700',
    color: '#666',
  },

  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    backgroundColor: "#dbdadaff",
    borderRadius: 8,
    marginTop: 8,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  text: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontFamily: "Nunito400",
    color: "#333",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d63384",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12
  },
  uploadText: {
    marginLeft: 4,
    fontSize: 13,
    color: "#fff",
    fontFamily: "Nunito700",
  },
});

export default MediaGrid;
