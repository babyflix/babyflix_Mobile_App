import React, { memo, useCallback, useEffect, useState } from "react";
import {
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import { useTranslation } from "react-i18next";
import { generateImage } from "../constants/generateApi";
import { callImageAction } from "../constants/imageAction";
import { useSelector } from "react-redux";
import sendDeviceUserInfo, { USERACTIONS } from "../components/deviceInfo";

const { width } = Dimensions.get("window");
const ITEM_SIZE = width / 2 - 16;

const AiMediaGrid = memo(
  ({
    data = [],
    onPreview,
    selectedItems = [],
    setSelectedItems,
    selectionMode,
    setSelectionMode,
    setShowDeleteModal,
    setShowDownloadModal,
    setShowShareModal,
    setSelectedItem,
    flix10kSelectionMode,
    selectedItemsForAi = [],
    toggleItemSelection,
    disableMenuAndSelection,
    setFlix10kAiImages,
    setSelectedType,
  }) => {
    const { t } = useTranslation();

    const [regeneratingIds, setRegeneratingIds] = useState([]);
    const [regenerationQueue, setRegenerationQueue] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [keptItems, setKeptItems] = useState([]);
    const user = useSelector((state) => state.auth);

    const enqueueRegeneration = (item) => {
      setRegenerationQueue((prev) => [...prev, item]);
    };

    useEffect(() => {
      const processQueue = async () => {
        if (isProcessing || regenerationQueue.length === 0) return;

        setIsProcessing(true);
        const currentItem = regenerationQueue[0];

        try {
          console.log("Regenerating sequentially:", currentItem.id);

          await callImageAction({
            object_name: currentItem?.flix10kAiImages?.output_path?.object_name,
            action: "regenerate",
            user,
          });

          const response = await generateImage(
            currentItem?.object_url,
            currentItem?.object_type,
            user
          );

          setFlix10kAiImages((prev) =>
            prev.map((i) =>
              i.id === currentItem.id ? { ...i, flix10kAiImages: response } : i
            )
          );

          sendDeviceUserInfo({
            action_type: USERACTIONS.FLIX10KBABYPREDICTIVEIMAGE,
            action_description: `Flox10K reGenerate predictiveimage for ${currentItem}`,
          });

          //setRegeneratingIds((prev) => prev.filter((id) => id !== currentItem.id));
        } catch (err) {
          console.error("Error regenerating:", err);
        } finally {
          setRegeneratingIds((prev) => prev.filter((id) => id !== currentItem.id));
          setRegenerationQueue((prev) => prev.slice(1));
          setIsProcessing(false);
        }
      };

      processQueue();
    }, [regenerationQueue, isProcessing]);

    const handleRegenerate = (item) => {
      setRegeneratingIds((prev) => [...prev, item.id]);
      enqueueRegeneration(item);
    };

    const handleKeep = async (item) => {
      setKeptItems((prev) => [...prev, item.id]);

      try {
        await callImageAction({
          object_name: item?.flix10kAiImages?.output_path?.object_name,
          action: "keep",
          user,
        });

      } catch (err) {
        console.error("Error keeping image:", err);
      }
    };

    const renderItem = useCallback(
      ({ item }) => {
        if (!item) return null;

        //const isSelected = selectedItems.some((i) => i.id === item.id);
        //const isAiSelected = selectedItemsForAi.some((i) => i.id === item.id);
        const result = item.flix10kResult || {};

        const isKept = keptItems.includes(item.id);
        const hasAiVersion = !!item?.flix10kAiImages;

        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onPreview && onPreview(item)}
            activeOpacity={0.85}
          >
            {item.object_type === "video" ? (
              <View style={styles.videoContainer}>
                <Image
                  source={{ uri: item.thumbnail_url || item.object_url }}
                  style={styles.media}
                />
                <MaterialCommunityIcons
                  name="play-circle-outline"
                  size={40}
                  color={Colors.white}
                  style={styles.playIcon}
                />
              </View>
              //) : regeneratingId === item.id ? (
            ) : regeneratingIds.includes(item.id) ? (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator
                  size={30}
                  color={Colors.primary}
                />
                <Text style={{ marginTop: 6, fontFamily: 'Nunito400', fontSize: 12, color: "#333" }}>
                  {t("flix10k.regenerating")}
                </Text>
              </View>
            ) : (
              <Image
                source={{
                  uri:
                    item?.flix10kAiImages?.output_path?.gcs_url ||
                    item.object_url,
                }}
                style={styles.media}
              />
            )}

            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title || "Untitled"}
              </Text>
              <Text style={styles.date}>
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString()
                  : "-"}
              </Text>
            </View>

            {item.object_type !== "predictiveBabyImage" && !item?.flix10kAiImages && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>{t("flix10k.info")}</Text>

                <View style={styles.row}>
                  <MaterialCommunityIcons
                    name="circle-small"
                    size={16}
                    color="#d63384"
                  />
                  <Text style={styles.infoText}>
                    {t("flix10k.gestationalAge")}: {result.gestational_age || "-"}
                  </Text>
                </View>

                <View style={styles.row}>
                  <MaterialCommunityIcons
                    name="circle-small"
                    size={16}
                    color="#d63384"
                  />
                  <Text style={styles.infoText}>
                    {t("flix10k.heartRate")}: {result.heart_rate || "-"}
                  </Text>
                </View>

                <View style={styles.row}>
                  <MaterialCommunityIcons
                    name="circle-small"
                    size={16}
                    color="#d63384"
                  />
                  <Text style={styles.infoText}>
                    {t("flix10k.measurement")}: {result.measurement || "-"}
                  </Text>
                </View>
              </View>
            )}

            {!disableMenuAndSelection && (
              <View style={styles.actions}>
                {(!hasAiVersion || isKept) ? (
                  <>
                    <TouchableOpacity
                      style={styles.actionBtnDownload}
                      onPress={() => {
                        setSelectedItem([item]);
                        setShowDownloadModal(true);
                      }}
                    >
                      <MaterialIcons name="file-download" size={18} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnShare}
                      onPress={() => {
                        setSelectedItem([item]);
                        setShowShareModal(true);
                      }}
                    >
                      <MaterialIcons name="share" size={18} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnDelete}
                      onPress={() => {
                        setSelectedItem([item]);
                        setShowDeleteModal(true);
                      }}
                    >
                      <MaterialIcons name="delete" size={18} color="white" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtnDownload, { borderRadius: 50 }]}
                      onPress={() => handleKeep(item)}
                    >
                      <MaterialIcons name="check" size={18} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtnDelete, { borderRadius: 50 }]}
                      onPress={() => handleRegenerate(item)}
                    >
                      <MaterialIcons name="autorenew" size={18} color="white" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Checkbox Selection */}
            {/* {(isSelected || flix10kSelectionMode || isAiSelected) && (
              <View style={styles.checkboxOverlay}>
                <MaterialIcons
                  name={
                    isSelected || isAiSelected
                      ? "check-box"
                      : "check-box-outline-blank"
                  }
                  size={22}
                  color={Colors.primary}
                />
              </View>
            )} */}
          </TouchableOpacity>
        );
      },
      [selectedItems, selectedItemsForAi, regeneratingIds, keptItems]
    );

    return (
      <FlatList
        // data={data}
        data={(data || []).filter(item => item && item.id)}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        extraData={[selectedItems, selectedItemsForAi, regeneratingIds, keptItems]}
      />
    );
  }
);

const styles = StyleSheet.create({
  gridContainer: {
    padding: 8,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 8,
    padding: 8,
    width: '46%',
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  media: {
    width: "100%",
    height: 132,
    borderRadius: 12,
  },
  videoContainer: {
    position: "relative",
  },
  playIcon: {
    position: "absolute",
    top: "35%",
    left: "38%",
  },

  header: {
    marginTop: 8,
    alignItems: "center",
  },
  title: {
    fontSize: 13,
    fontFamily: "Nunito700",
    color: "#222",
  },
  date: {
    fontFamily: "Nunito400",
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },

  infoCard: {
    backgroundColor: "#f7f4f4ff",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 1,
  },
  infoText: {
    fontFamily: "Nunito400",
    fontSize: 11,
    color: "#333",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingVertical: 6,
  },
  actionBtnDownload: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "#00c851",
    padding: 8,
    marginHorizontal: 7,
    borderRadius: '50%',
  },
  actionBtnShare: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "#0072ff",
    padding: 8,
    marginHorizontal: 6,
    borderRadius: '50%',
  },
  actionBtnDelete: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "#ff4444",
    padding: 8,
    marginHorizontal: 7,
    borderRadius: '50%',
  },

  checkboxOverlay: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderTopLeftRadius: 8,
    padding: 2,
  },
  loaderOverlay: {
    width: "100%",
    height: 132,
    backgroundColor: "rgba(200,200,200,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },

});

export default AiMediaGrid;