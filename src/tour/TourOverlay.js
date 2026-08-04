import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Colors from '../constants/Colors';
import { useTour } from './TourContext';

const SPOTLIGHT_PADDING = 8;
const TOOLTIP_MARGIN = 16;
const TOOLTIP_WIDTH_RATIO = 0.86;
const MIN_SPACE_BELOW = 170;
const ESTIMATED_TOOLTIP_HEIGHT = 190;
const SAFE_ZONE_TOP = 100;
const SAFE_ZONE_BOTTOM_MARGIN = 260;
const SCROLL_TARGET_OFFSET = 140;

const GRADIENT_PRIMARY = ['#c85fb0', Colors.primary];

function measureInWindow(ref) {
  return new Promise((resolve) => {
    if (!ref.current?.measureInWindow) { resolve(null); return; }
    ref.current.measureInWindow((x, y, width, height) => {
      resolve({ x, y, width, height });
    });
  });
}

function scrollTargetIntoView(targetRef, scrollRef) {
  return new Promise((resolve) => {
    if (!targetRef.current?.measureLayout || !scrollRef.current?.scrollTo) { resolve(); return; }
    try {
      targetRef.current.measureLayout(
        scrollRef.current,
        (_x, y) => {
          scrollRef.current.scrollTo({ y: Math.max(0, y - SCROLL_TARGET_OFFSET), animated: true });
          resolve();
        },
        () => resolve()
      );
    } catch {
      resolve();
    }
  });
}

export default function TourOverlay() {
  const { activeScreenId, activeStepIndex, activeSteps, next, previous, skip, getTargetRef, getScrollRef, insets } = useTour();
  const { t } = useTranslation();

  // Position updates instantly once measured — no slide/tween animation.
  // Both attempts at animating it (LayoutAnimation, then a JS-driven
  // Animated listener) made the transition feel laggier, not smoother, so
  // this stays a plain, immediate snap.
  const [rect, setRect] = useState(null);
  const [tooltipHeight, setTooltipHeight] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const tooltipSlide = useRef(new Animated.Value(12)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;

  const step = activeScreenId ? activeSteps[activeStepIndex] ?? null : null;

  useEffect(() => {
    setTooltipHeight(0);
    if (!activeScreenId || !step) { setRect(null); return; }
    // Deliberately NOT clearing rect here — keep the previous step's
    // highlight visible while the new one is being measured, instead of
    // blanking the whole overlay out for the duration of every transition.
    // applyRect() below swaps it the moment the new position is ready.

    let cancelled = false;

    const applyRect = (r) => {
      setRect((prev) => {
        if (prev && prev.x === r.x && prev.y === r.y && prev.width === r.width && prev.height === r.height) {
          return prev;
        }
        return r;
      });
    };

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      // Fixed-position steps (e.g. the bottom tab bar, which isn't easily
      // ref-able through the navigator's own internals) skip measurement
      // entirely and use a supplied rect directly.
      if (step.manualRect) {
        const r = typeof step.manualRect === 'function' ? step.manualRect() : step.manualRect;
        if (r) applyRect(r);
        return;
      }

      let targetRef = getTargetRef(activeScreenId, step.id);
      if (!targetRef?.current) {
        await sleep(80);
        if (cancelled) return;
        targetRef = getTargetRef(activeScreenId, step.id);
      }
      if (!targetRef?.current) {
        if (!cancelled) next();
        return;
      }

      // No settle delay here — the underlying screen's layout doesn't
      // change between tour steps (nothing new mounts/unmounts), so there's
      // nothing to wait for; measuring immediately makes the highlight
      // start moving the instant Next/Back is pressed.
      if (cancelled) return;
      const initial = await measureInWindow(targetRef);
      if (cancelled || !initial) return;

      const { height: winH } = Dimensions.get('window');
      const offScreen = initial.y < SAFE_ZONE_TOP || initial.y + initial.height > winH - SAFE_ZONE_BOTTOM_MARGIN;
      const scrollRef = getScrollRef(activeScreenId);

      if (offScreen && scrollRef) {
        await scrollTargetIntoView(targetRef, scrollRef);
        if (cancelled) return;
        await sleep(450);
        if (cancelled) return;
        const afterScroll = await measureInWindow(targetRef);
        if (!cancelled && afterScroll) applyRect(afterScroll);
        return;
      }

      applyRect(initial);
      if (activeStepIndex === 0) {
        await sleep(350);
        if (cancelled) return;
        const corrected = await measureInWindow(targetRef);
        if (!cancelled && corrected) applyRect(corrected);
      }
    };

    run();

    return () => { cancelled = true; };
  }, [activeScreenId, step?.id]);

  useEffect(() => {
    if (!rect) return;
    fade.setValue(0);
    tooltipSlide.setValue(12);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(tooltipSlide, { toValue: 0, useNativeDriver: true, tension: 60, friction: 9 }),
    ]).start();
  }, [rect]);

  useEffect(() => {
    if (!rect) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [rect]);

  if (!activeScreenId || !step || !rect) return null;

  const { width: screenW, height: screenH } = Dimensions.get('window');
  const shape = step.shape ?? 'rounded';
  // Manual per-step fine-tuning — tweak these numbers on the step definition
  // (in the screen that calls useScreenTour) and reload to nudge the
  // highlight box until it lines up, instead of relying on automatic
  // measurement/inset math alone.
  const offsetX = step.offsetX ?? 0;
  const offsetY = step.offsetY ?? 0;
  const offsetWidth = step.offsetWidth ?? 0;
  const offsetHeight = step.offsetHeight ?? 0;

  const holeX = rect.x - SPOTLIGHT_PADDING + offsetX;
  const holeY = rect.y - SPOTLIGHT_PADDING + offsetY;
  const holeW = rect.width + SPOTLIGHT_PADDING * 2 + offsetWidth;
  let holeH = rect.height + SPOTLIGHT_PADDING * 2 + offsetHeight;
  // Caps the highlight to a fixed height — for isolating just the top
  // (e.g. a tab bar) or bottom slice of a much taller measured area,
  // instead of highlighting the whole thing.
  if (typeof step.maxHeight === 'number') {
    holeH = Math.min(holeH, step.maxHeight);
  }
  const holeRadius = shape === 'circle' ? Math.max(holeW, holeH) / 2 : 16;

  const spaceBelow = screenH - (holeY + holeH);
  const spaceAbove = holeY;
  const placeBelow = spaceBelow >= MIN_SPACE_BELOW || spaceBelow >= spaceAbove;

  const tooltipWidth = screenW * TOOLTIP_WIDTH_RATIO;
  let tooltipLeft = rect.x + rect.width / 2 - tooltipWidth / 2;
  tooltipLeft = Math.max(TOOLTIP_MARGIN, Math.min(tooltipLeft, screenW - tooltipWidth - TOOLTIP_MARGIN));

  const measuredHeight = tooltipHeight || ESTIMATED_TOOLTIP_HEIGHT;
  const minTop = insets.top + TOOLTIP_MARGIN;
  const maxTop = screenH - insets.bottom - TOOLTIP_MARGIN - measuredHeight;
  let tooltipTop = placeBelow ? holeY + holeH + 14 : holeY - 14 - measuredHeight;
  tooltipTop = Math.max(minTop, Math.min(tooltipTop, maxTop));

  const isFirst = activeStepIndex === 0;
  const isLast = activeStepIndex === activeSteps.length - 1;

  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });
  const glowScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const glowBorderRadius = shape === 'circle' ? (holeW + 12) / 2 : holeRadius + 6;

  return (
    <Modal visible transparent animationType="none" presentationStyle="overFullScreen">
      <View style={StyleSheet.absoluteFill}>
        {/* Four opaque bands framing the spotlight cutout instead of an SVG
            mask — avoids a real react-native-svg <Mask> + Fabric/New
            Architecture rendering gap on Android that silently drew no
            dimming at all. Only gives a rectangular cutout (not a true
            circle for shape="circle" steps), which isn't used here. */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]} pointerEvents="none">
          <View style={[styles.dim, { top: 0, left: 0, right: 0, height: Math.max(holeY, 0) }]} />
          <View style={[styles.dim, { top: holeY + holeH, left: 0, right: 0, bottom: 0 }]} />
          <View style={[styles.dim, { top: holeY, left: 0, width: Math.max(holeX, 0), height: holeH }]} />
          <View style={[styles.dim, { top: holeY, left: holeX + holeW, right: 0, height: holeH }]} />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowRing,
            {
              left: holeX - 6,
              top: holeY - 6,
              width: holeW + 12,
              height: holeH + 12,
              borderRadius: glowBorderRadius,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        <Animated.View
          onLayout={(e) => setTooltipHeight(e.nativeEvent.layout.height)}
          style={[
            styles.tooltip,
            {
              width: tooltipWidth,
              left: tooltipLeft,
              top: tooltipTop,
              opacity: fade,
              transform: [{ translateY: tooltipSlide }],
            },
          ]}
        >
          <View style={styles.dotsRow}>
            {activeSteps.map((s, i) => (
              <View key={s.id} style={[styles.dot, i === activeStepIndex && styles.dotActive]} />
            ))}
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={skip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.skipText}>{t('tour.common.skip')}</Text>
            </TouchableOpacity>

            <View style={styles.navBtns}>
              {!isFirst && (
                <TouchableOpacity onPress={previous} style={styles.navBtnGhost} activeOpacity={0.7}>
                  <Text style={styles.navBtnGhostText}>{t('tour.common.back')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={next} activeOpacity={0.85}>
                <LinearGradient
                  colors={GRADIENT_PRIMARY}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.navBtnPrimary}
                >
                  <Text style={styles.navBtnPrimaryText}>{isLast ? t('tour.common.done') : t('tour.common.next')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    backgroundColor: 'rgba(20,10,30,0.75)',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#e8a6d3',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 10,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#fdf2f8',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  dotsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    backgroundColor: Colors.lightGray,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 18,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Nunito700',
    color: Colors.primary,
    fontWeight: '800',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Nunito400',
    color: '#555',
    lineHeight: 19,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Nunito700',
    color: '#555',
  },
  navBtns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtnGhost: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navBtnGhostText: {
    fontSize: 14,
    fontFamily: 'Nunito700',
    color: Colors.primary,
  },
  navBtnPrimary: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    marginLeft: 8,
  },
  navBtnPrimaryText: {
    fontSize: 14,
    fontFamily: 'Nunito700',
    color: '#fff',
  },
});
