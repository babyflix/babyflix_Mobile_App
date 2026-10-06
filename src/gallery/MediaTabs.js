import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTranslation } from 'react-i18next';
import Colors from '../constants/Colors';
import MediaGrid from './MediaGrid';
import Flix10KTab from './Flix10KTab';
import { Ionicons } from '@expo/vector-icons';

const Tab = createMaterialTopTabNavigator();

const MediaTabs = ({
  mediaData,
  onPreview,
  refreshing,
  onRefresh,
  selectedItems,
  setSelectedItems,
  selectionMode,
  setSelectionMode,
  setActiveMenuId,
  activeMenuId,
  setShowDeleteModal,
  setShowDownloadModal,
  setShowShareModal,
  setSelectedItem,
  disableMenuAndSelection,
  tL,
  flix10kSelectionMode,
  selectedItemsForAi,
  toggleItemSelection,
  flix10kGenerating,
  setFlix10kGenerating,
  flix10kResults,
  setFlix10kResults,
  selectedType,
  flix10kAiImages,
  setFlix10kAiImages,
  setSelectedType,
  onRequireSubscription,
  scrollY,
  itemActionsTourTarget,
  itemConvertTourTarget,
}) => {
  const { t } = useTranslation();

  const tabProps = useMemo(() => ({
    mediaData,
    onPreview,
    refreshing,
    onRefresh,
    selectedItems,
    setSelectedItems,
    selectionMode,
    setSelectionMode,
    setActiveMenuId,
    activeMenuId,
    setShowDeleteModal,
    setShowDownloadModal,
    setShowShareModal,
    setSelectedItem,
    disableMenuAndSelection,
    tL,
    flix10kSelectionMode,
    selectedItemsForAi,
    toggleItemSelection,
    selectedType,
    setSelectedType,
    onRequireSubscription,
    scrollY,
    itemActionsTourTarget,
    itemConvertTourTarget,
  }), [
    mediaData,
    onPreview,
    refreshing,
    onRefresh,
    selectedItems,
    setSelectedItems,
    selectionMode,
    setSelectionMode,
    setActiveMenuId,
    activeMenuId,
    setShowDeleteModal,
    setShowDownloadModal,
    setShowShareModal,
    setSelectedItem,
    disableMenuAndSelection,
    tL,
    flix10kSelectionMode,
    selectedItemsForAi,
    toggleItemSelection,
    selectedType,
    setSelectedType,
    onRequireSubscription,
    scrollY,
    itemActionsTourTarget,
    itemConvertTourTarget,
  ]);

  const flix10kData = useMemo(
    () => [...mediaData.babyProfile, ...mediaData.predictiveBabyImages, ...mediaData.images],
    [mediaData]
  );

  const imagesRouteName = t("gallery.tabs.images");
  const flix10kRouteName = t("gallery.tabs.flix10k");
  const targetRouteName =
    (selectedType === "babyProfile" || selectedType === "predictiveBaby")
      ? flix10kRouteName
      : imagesRouteName;

  // Previously the whole tab navigator was torn down and rebuilt on every
  // media re-fetch, which reset it to initialRouteName. Flix10K flows relied
  // on that whenever selection mode toggled (Images tab while picking photos,
  // Flix10K tab once generation finishes). The grid is no longer rebuilt, so
  // switch tabs explicitly at that same moment instead.
  const tabNavigationRef = useRef(null);
  const targetRouteNameRef = useRef(targetRouteName);
  targetRouteNameRef.current = targetRouteName;
  const isFirstSelectionModeRunRef = useRef(true);
  useEffect(() => {
    if (isFirstSelectionModeRunRef.current) {
      isFirstSelectionModeRunRef.current = false;
      return;
    }
    tabNavigationRef.current?.navigate(targetRouteNameRef.current);
  }, [flix10kSelectionMode]);

  const captureTabNavigation = ({ navigation }) => {
    tabNavigationRef.current = navigation;
    return {};
  };

  return (
    <Tab.Navigator
      initialRouteName={targetRouteName}
      screenListeners={captureTabNavigation}
      screenOptions={{
        // Build each tab the first time it is opened instead of all at once.
        lazy: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: { marginTop: 12 },
        tabBarStyle: styles.tabBar,
        tabBarIndicatorStyle: styles.tabIndicator,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarPressColor: Colors.primaryLight,
        tabBarShowIcon: true,
      }}
    >
      <Tab.Screen
        name={t("gallery.tabs.images")}
        options={{
          tabBarLabel: ({ color }) => (
            <View style={styles.tabItem}>
              <Ionicons name="image-outline" size={20} color={color} />
              <View style={styles.tabRow}>
                <Text style={[styles.tabLabel, { color }]}>{t("gallery.tabs.images")}</Text>
                {mediaData.images.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={[styles.badgeText, { color }]}>{mediaData.images.length}</Text>
                  </View>
                )}
              </View>
            </View>
          ),
        }}
        children={() => (
          <MediaGrid {...tabProps} data={mediaData.images} type="image" />
        )}
      />
      <Tab.Screen
        name={t("gallery.tabs.videos")}
        options={{
          tabBarLabel: ({ color }) => (
            <View style={styles.tabItem}>
              <Ionicons name="videocam-outline" size={20} color={color} />
              <View style={styles.tabRow}>
                <Text style={[styles.tabLabel, { color }]}>{t("gallery.tabs.videos")}</Text>
                {mediaData.videos.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={[styles.badgeText, { color }]}>{mediaData.videos.length}</Text>
                  </View>
                )}
              </View>
            </View>
          ),
        }}
        children={() => (
          <MediaGrid {...tabProps} data={mediaData.videos} type="video" />
        )}
      />
      <Tab.Screen
        name={t("gallery.tabs.flix10k")}
        options={{
          tabBarLabel: ({ color }) => (
            <View style={styles.tabItem}>
              <Ionicons name="sparkles-outline" size={20} color={color} />
              <View style={styles.tabRow}>
                <Text style={[styles.tabLabel, { color }]}>{t("gallery.tabs.flix10k")}</Text>
                {(mediaData.babyProfile.length + mediaData.predictiveBabyImages.length) > 0 && (
                  <View style={styles.badge}>
                    <Text style={[styles.badgeText, { color }]}>
                      {mediaData.babyProfile.length + mediaData.predictiveBabyImages.length + flix10kAiImages.length}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ),
        }}
        children={() => (
          <Flix10KTab
            tabProps={tabProps}
            data={flix10kData}
            flix10kGenerating={flix10kGenerating}
            flix10kResults={flix10kResults}
            flix10kAiImages={flix10kAiImages}
            setFlix10kAiImages={setFlix10kAiImages}
          />
        )}
      />
    </Tab.Navigator>
  );

};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 0,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 8,
    overflow: 'hidden',
    //paddingHorizontal:2
  },
  tabIndicator: {
    backgroundColor: Colors.primary,
    height: 3,
    borderRadius: 1.5,
    marginBottom: 1,
  },
  tabItem: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    //marginTop: 4,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  tabLabel: {
    textTransform: 'none',
    fontFamily: 'Nunito700',
    fontSize: 12,
  },
  badge: {
    backgroundColor: "#e9b7dcff",
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: "Nunito700"
  },
});

export default React.memo(MediaTabs);
