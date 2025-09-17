import React, { useCallback, useRef } from 'react';
import { FlatList, Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import GalleryItem from './GalleryItem';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

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
  flix10kGenerating,
  setFlix10kGenerating,
  flix10kResults,
  setFlix10kResults,
  selectedType,
}) => {
  const { t } = useTranslation();
  const flatListRef = useRef();
  const router = useRouter();

  const filteredData = type === 'all' ? data : data.filter(item => item.object_type === type);
  const aiFilteredData = type === 'aiImages' ? data : data.filter(item => item.object_type === type);

  const toggleSelection = useCallback((item) => {
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
  }, [disableMenuAndSelection, selectionMode, selectedItems]);

  const renderItem = useCallback(({ item }) => (
    <>
      <GalleryItem
        item={item}
        isSelected={selectedItems.some(i => i.id === item.id)}
        isMenuVisible={activeMenuId === item.id}
        onPreview={onPreview}
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
        selectedItemsForAi={selectedItemsForAi.some(i => i.id === item.id)}
        toggleItemSelection={toggleItemSelection}
      />
    </>
  ), [selectedItems, activeMenuId, selectionMode, disableMenuAndSelection, selectedItemsForAi]);

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

      <FlatList
        ref={flatListRef}
        data={filteredData}
        renderItem={renderItem}
        numColumns={2}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('gallery.noMedia')}</Text>
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        extraData={[selectedItems, selectedItemsForAi]}
        removeClippedSubviews={true}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={15}
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
