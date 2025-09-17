import React, { memo, useEffect, useState } from 'react';
import { View, Text, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Colors from '../constants/Colors';
import MediaGrid from './MediaGrid';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import AiMediaGrid from './AiMediaGrid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AIGenerationModal from './AIGenerationModal';

const FlixTab = createMaterialTopTabNavigator();

// const AiImagesTab =({ data, flix10kGenerating, flix10kResults, ...props }) => {

//  const [savedResults, setSavedResults] = useState([]);
//  const { t } = useTranslation();

//   const combinedResults = (data?.length || 0) > 0 ? data : flix10kResults;
//   const hasResults = (combinedResults?.length || 0) > 0;

//   console.log('combinedResults:', combinedResults);
//   return (
//     <>
//       {/* Results */}
//       {hasResults ? (
//         <AiMediaGrid {...props} data={combinedResults} type="babyProfile" />
//       ) : (
//         <View style={styles.empty}>
//           <Text style={styles.emptyText}>{t("flix10k.noAiImages")}</Text>
//         </View>
//       )}

//        {/* Modal overlay */}
//       <Modal visible={flix10kGenerating} transparent animationType="fade">
//          <View style={styles.modalBackground}>
//         <View style={styles.modalContainer}>
//           {/* Icon at the top */}
//           <MaterialCommunityIcons
//             name="robot-happy"
//             size={50}
//             color={Colors.primary}
//             style={{ marginBottom: 16 }}
//           />

//           {/* Main message */}
//           <Text style={styles.titleText}>{t("flix10k.imageGenerationProgress")}</Text>
//           <Text style={styles.subText}>
//             {t("flix10k.imageEnhancing")}
//           </Text>

//           {/* Continuous progress bar */}
//           <Progress.Bar
//             indeterminate
//             width={200}
//             color={Colors.primary} // Blue progress bar
//             borderColor="#ccc"
//             borderRadius={5}
//             style={{ marginTop: 20 }}
//           />
//         </View>
//       </View>
//       </Modal>
//     </>
//   );
// };
//const ImageInfoTab = memo((props,flix10kResults, flix10kAiImages, setFlix10kAiImages) => <AiMediaGrid {...props} data={flix10kAiImages} type="predictiveBabyImages" />);

const ImageInfoTab = memo(({ data, flix10kGenerating, flix10kAiImages, setFlix10kAiImages, ...props }) => {
  const { t } = useTranslation();

  const combinedResults = [
    ...(flix10kAiImages || []),
    ...(data || []),
  ];
  const hasResults = (combinedResults?.length || 0) > 0;

  console.log("ImageInfoTab flix10kAiImages:", flix10kAiImages);

  return (
    <>
      {hasResults ? (
        <AiMediaGrid
          {...props}
          data={combinedResults}
          type="predictiveBabyImages"
          setFlix10kAiImages={setFlix10kAiImages}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t("flix10k.noAiImages")}</Text>
        </View>
      )}

      <AIGenerationModal visible={flix10kGenerating} />
    </>
  );
});


const Flix10KTab = ({ tabProps, data, flix10kGenerating, flix10kResults, flix10kAiImages, setFlix10kAiImages }) => {
  const { t } = useTranslation();
  const [aiData, setAiData] = useState({ babyProfile: [], predictiveBabyImages: [], images: [] });

  useEffect(() => {
    if (data?.length > 0) {
      const babyProfile = [];
      const predictiveBabyImages = [];
      const images = [];

      data.forEach(item => {
        if (item.object_type === "babyProfile") babyProfile.push(item);
        else if (item.object_type === "predictiveBabyImage") predictiveBabyImages.push(item);
        else if (item.object_type === "image") images.push(item);
      });

      setAiData({ babyProfile, predictiveBabyImages, images });
    }
  }, [data]);

  return (
    <>
      <FlixTab.Navigator
        initialRouteName={
          tabProps.selectedType === "babyProfile"
            ? t('flix10k.tabs.babyProfile')
            : t('flix10k.tabs.predictiveBabyImages')
        }
        screenOptions={{
          tabBarLabelStyle: {
            fontFamily: 'Nunito700',
            fontSize: 14,
            textTransform: 'none',
          },
          tabBarIndicatorStyle: {
            backgroundColor: Colors.primary,
            height: 3,
            borderRadius: 1.5,
            marginBottom: 2,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          //tabBarStyle: { backgroundColor: Colors.white },
          tabBarStyle: { display: "none" },
          tabBarPressColor: Colors.primaryLight,
        }}
      >
        {/* <FlixTab.Screen
        name={t('flix10k.tabs.babyProfile')}
        options={{
          tabBarLabel: ({ color }) => (
            <View style={styles.tabItem}>
              <MaterialCommunityIcons name="baby-face-outline" size={20} color={color} />
              <View style={styles.tabRow}>
                <Text style={[styles.tabLabel, { color }]}>
                  {t('flix10k.tabs.babyProfile')}
                </Text>
                {(aiData.babyProfile.length || flix10kResults.length) > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {(aiData.babyProfile.length || flix10kResults.length)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ),
        }}
        children={() => (
          <AiImagesTab
            {...tabProps}
            data={aiData.babyProfile}
            flix10kGenerating={flix10kGenerating}
            flix10kResults={flix10kResults}
          />
        )}
      /> */}

        <FlixTab.Screen
          name={t('flix10k.tabs.predictiveBabyImages')}
          options={{
            tabBarLabel: ({ color }) => (
              <View style={styles.tabItem}>
                <Ionicons
                  name="sparkles-outline" size={20} color={color} />
                <View style={styles.tabRow}>
                  <Text style={[styles.tabLabel, { color }]}>
                    {t('flix10k.tabs.predictiveBabyImages')}
                  </Text>
                  {aiData.predictiveBabyImages.length > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {aiData.predictiveBabyImages.length}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ),
          }}
          children={() => (
            <ImageInfoTab
              {...tabProps}
              data={aiData.predictiveBabyImages}
              //data={aiData.images}
              flix10kGenerating={flix10kGenerating}
              flix10kResults={flix10kResults}
              flix10kAiImages={flix10kAiImages}
              setFlix10kAiImages={setFlix10kAiImages}
            />
          )}
        />
      </FlixTab.Navigator>
    </>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#d8e9f8ff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: 280,
  },
  titleText: {
    fontSize: 18,
    fontFamily: 'Nunito700',
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.textPrimary,
  },
  subText: {
    fontSize: 14,
    fontFamily: 'Nunito400',
    textAlign: 'center',
    color: Colors.textSecondary,
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
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontFamily: "Nunito700",
  },
  empty: {
    flex: 1,
    //justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Nunito700',
    fontWeight: '600',
    color: '#666',
  },
});

export default Flix10KTab;
