import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Easing, Platform } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Colors from '../constants/Colors';
import { useTour } from './TourContext';

// Single-blob "thought bubble" outline (6 rounded lobes), matching the
// reference shape — a plain filled <Path>, not the <Mask> feature that had
// the real Fabric/Android rendering gap earlier in this file's history, so
// it's a much lower-risk use of react-native-svg. Fixed viewBox stretched
// with preserveAspectRatio="none" to exactly match the content's natural
// (variable, per-step) size — organic blob shapes tolerate non-uniform
// stretching far better than a precise geometric shape would.
const CLOUD_BLOB_PATH =
  'M150,10 C210,-5 260,20 270,60 C295,85 290,130 260,150 C270,180 210,205 150,195 C90,205 45,175 40,150 C10,130 5,85 30,55 C35,20 90,-5 150,10 Z';

// Flashy touch lives on the outline itself (animated strokeWidth), not a
// separate glow shape — a rounded-rect shadow behind an organic blob was
// visibly showing as an unwanted pink box outside the bubble's true edges.
const AnimatedPath = Animated.createAnimatedComponent(Path);

const SPOTLIGHT_PADDING = 8;
const TOOLTIP_MARGIN = 16;
const TOOLTIP_WIDTH_RATIO = 0.92;
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
  // step.forceBelow lets a step override the automatic space-based
  // placement outright — set explicitly rather than trusting the
  // above/below space math for that step.
  const placeBelow = typeof step.forceBelow === 'boolean'
    ? step.forceBelow
    : spaceBelow >= MIN_SPACE_BELOW || spaceBelow >= spaceAbove;

  const tooltipWidth = screenW * TOOLTIP_WIDTH_RATIO;
  let tooltipLeft = rect.x + rect.width / 2 - tooltipWidth / 2;
  tooltipLeft = Math.max(TOOLTIP_MARGIN, Math.min(tooltipLeft, screenW - tooltipWidth - TOOLTIP_MARGIN));

  const measuredHeight = tooltipHeight || ESTIMATED_TOOLTIP_HEIGHT;
  const minTop = insets.top + TOOLTIP_MARGIN;
  const maxTop = screenH - insets.bottom - TOOLTIP_MARGIN - measuredHeight;
  // Gap between the highlighted area and the bubble — large enough to clear
  // the tail dots too (they protrude up to 26px beyond the bubble's own
  // edge), so there's visible breathing room, not just clearance for the
  // bubble outline itself.
  const TARGET_GAP = 34;
  let tooltipTop = placeBelow ? holeY + holeH + TARGET_GAP : holeY - TARGET_GAP - measuredHeight;
  tooltipTop = Math.max(minTop, Math.min(tooltipTop, maxTop));

  const isFirst = activeStepIndex === 0;
  const isLast = activeStepIndex === activeSteps.length - 1;

  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });
  const glowScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const glowBorderRadius = shape === 'circle' ? (holeW + 12) / 2 : holeRadius + 6;
  // "Flashy" pulses the blob's own outline (strokeWidth), reusing the
  // same glowPulse driver as the spotlight ring — no separate glow shape
  // that could show as a box outside the organic bubble edges.
  const tooltipStrokeWidth = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [3, 6] });

  // Tail dots point toward whichever side the target is on: if the bubble
  // sits BELOW the target, the tail needs to point UP (dots at the top of
  // the bubble); if the bubble is ABOVE the target, the tail points DOWN
  // (dots at the bottom) — matches the reference shape's tail direction
  // instead of a fixed position regardless of layout.
  const tailSide = placeBelow ? 'top' : 'bottom';

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
          style={[
            styles.tooltipWrapper,
            {
              width: tooltipWidth,
              left: tooltipLeft,
              top: tooltipTop,
              opacity: fade,
              transform: [{ translateY: tooltipSlide }],
            },
          ]}
        >
          {/* Two trailing "thinking" dots, on whichever side the tail
              needs to point toward the target. */}
          <View pointerEvents="none" style={[styles.tailDotBig, styles[`tailDotBig_${tailSide}`]]} />
          <View pointerEvents="none" style={[styles.tailDotSmall, styles[`tailDotSmall_${tailSide}`]]} />

          <View style={styles.tooltipBody}>
            {/* Blob background, sized via percentage to exactly match
                whatever height tooltipContent below naturally ends up —
                no dependency on the onLayout-measured height for this. */}
            <Svg
              pointerEvents="none"
              width="100%"
              height="100%"
              viewBox="0 0 300 200"
              preserveAspectRatio="none"
              style={StyleSheet.absoluteFill}
            >
              <Defs>
                {/* Soft, light fill — stays subtle so title/description text
                    keeps good contrast against it. */}
                <SvgGradient id="cloudFill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#ffffff" />
                  <Stop offset="100%" stopColor="#fbe4f1" />
                </SvgGradient>
                {/* Vivid brand-matching outline — same two colors as the
                    Next button's gradient, for a cohesive, punchier look. */}
                <SvgGradient id="cloudStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#c85fb0" />
                  <Stop offset="100%" stopColor={Colors.primary} />
                </SvgGradient>
              </Defs>
              <AnimatedPath
                d={CLOUD_BLOB_PATH}
                fill="url(#cloudFill)"
                stroke="url(#cloudStroke)"
                strokeWidth={tooltipStrokeWidth}
              />
            </Svg>

            <View
              onLayout={(e) => setTooltipHeight(e.nativeEvent.layout.height)}
              style={styles.tooltipContent}
            >
              {/*<View style={styles.dotsRow}>
                {activeSteps.map((s, i) => (
                  <View key={s.id} style={[styles.dot, i === activeStepIndex && styles.dotActive]} />
                ))}
              </View>*/}

              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.description}>{step.description}</Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={skip} style={styles.skipBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.skipText}>{t('tour.common.skip')}</Text>
                </TouchableOpacity>

                <View style={styles.navBtns}>
                  {!isFirst && (
                    <TouchableOpacity onPress={previous} style={styles.navBtnGhost} activeOpacity={0.7}>
                      <Text style={styles.navBtnGhostText}>{t('tour.common.back')}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={next} style={styles.nextBtn} activeOpacity={0.85}>
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
  tooltipWrapper: {
    position: 'absolute',
  },
  // The two small trailing "thinking" dots. Anchored with a negative
  // bottom/top (relative to tooltipWrapper, whose own height is whatever
  // tooltipBody/tooltipContent naturally end up being) so they hang
  // correctly regardless of how tall a given step's text makes the
  // bubble, without needing to know that height in advance. Which side
  // they're on is picked at render time (tailSide) based on whether the
  // bubble is placed above or below its target.
  tailDotBig: {
    position: 'absolute',
    left: 46,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fdf2f8',
    borderWidth: 2,
    borderColor: '#c85fb0',
  },
  tailDotBig_bottom: { bottom: -14 },
  tailDotBig_top: { top: -14 },
  tailDotSmall: {
    position: 'absolute',
    left: 28,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#fdf2f8',
    borderWidth: 2,
    borderColor: '#c85fb0',
  },
  tailDotSmall_bottom: { bottom: -26 },
  tailDotSmall_top: { top: -26 },
  // No background/shadow of its own — sized purely by tooltipContent
  // below, and the Svg blob (absoluteFill sibling of tooltipContent, see
  // render) stretches to match whatever size that resolves to. Deliberately
  // no View-level drop shadow here — shadow/elevation follows the View's
  // rectangular bounds, not the organic blob's actual silhouette inside
  // it, which would show as a boxy shadow poking out past the bumpy
  // outline (the same class of issue as the earlier rejected glow shape).
  tooltipBody: {
    position: 'relative',
  },
  // Extra padding (vs. the old plain-box version) to keep text clear of
  // the blob's bumpy waist, where the outline dips inward between lobes.
  // Bottom gets more than the rest so the Skip/Back/Next row — the parts
  // that were spilling outside the bubble's lower edge — sit well clear
  // of the bottom lobes.
  tooltipContent: {
    padding: 32,
    paddingBottom: 40,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
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
    fontSize: 16,
    fontFamily: 'Nunito700',
    color: Colors.primary,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  description: {
    fontSize: 13,
    fontFamily: 'Nunito400',
    color: '#555',
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Nudges Skip in from the very left edge, staying on the same side.
  skipBtn: {
    marginLeft: 40,
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
   nextBtn: {
    marginRight: 35,
  },
});
