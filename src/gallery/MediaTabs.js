import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTranslation } from 'react-i18next';
import Colors from '../constants/Colors';
import MediaGrid from './MediaGrid';
import Flix10KTab from './Flix10KTab';
import { Ionicons } from '@expo/vector-icons';

const Tab = createMaterialTopTabNavigator();

const AllTab = React.memo((props) => <MediaGrid {...props} />);
const ImagesTab = React.memo((props) => <MediaGrid {...props} />);
const VideosTab = React.memo((props) => <MediaGrid {...props} />);

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
  setSelectedType
}) => {
  const { t } = useTranslation();

  const sortedAllData = [...mediaData.images, ...mediaData.videos].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const tabProps = {
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
    setSelectedType
  };

  return (
    <Tab.Navigator
      initialRouteName={
        (selectedType === "babyProfile" || selectedType === "predictiveBaby")
          ? t("gallery.tabs.flix10k")
          : t("gallery.tabs.images")
      }
      screenOptions={{
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
      {/* <Tab.Screen
        name={t("gallery.tabs.all")}
        options={{
          tabBarLabel: ({ color }) => (
            <View style={styles.tabItem}>
              <Ionicons name="albums-outline" size={20} color={color} />
              <View style={styles.tabRow}>
                <Text style={[styles.tabLabel, { color }]}>{t("gallery.tabs.all")}</Text>
                {sortedAllData.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{sortedAllData.length}</Text>
                  </View>
                )}
              </View>
            </View>
          ),
        }}
        children={() => (
          <MediaGrid {...tabProps} data={sortedAllData} type="all" />
        )}
      /> */}
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
            //data={[...mediaData.babyProfile, ...mediaData.predictiveBabyImages]}
            data={[...mediaData.babyProfile, ...mediaData.predictiveBabyImages, ...mediaData.images]}
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

export default MediaTabs;
