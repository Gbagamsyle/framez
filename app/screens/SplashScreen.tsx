import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

function SplashScreenComponent() {
  const letters = 'FRAMEZ'.split('');
  const letterAnims = React.useRef(letters.map(() => new Animated.Value(0))).current;
  const logoScale = React.useRef(new Animated.Value(0.9)).current;
  const lettersOpacity = React.useRef(new Animated.Value(1)).current;
  const logoImgOpacity = React.useRef(new Animated.Value(0)).current;
  const logoImgScale = React.useRef(new Animated.Value(0.95)).current;
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // reset
    letterAnims.forEach((a) => a.setValue(0));
    logoScale.setValue(0.9);

    // animate logo scale slightly, then stagger letters, then exit (fade letters, reveal logo image)
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.stagger(
        80,
        letterAnims.map((a) =>
          Animated.timing(a, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ),
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(lettersOpacity, { toValue: 0, duration: 360, useNativeDriver: true }),
        Animated.timing(logoImgOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(logoImgScale, { toValue: 1.08, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(400),
    ]).start(() => {
      // navigate after animation completes: send new/unauthenticated users to login
      try {
        if (user && user.uid) router.replace('/(tabs)');
        else router.replace('/login');
      } catch (err) {
        void err;
      }
    });
  }, [letterAnims, logoScale, lettersOpacity, logoImgOpacity, logoImgScale, router, user]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}> 
      {/* animated app name letters */}
      <Animated.View style={{ transform: [{ scale: logoScale }], alignItems: 'center' }}>
        <Animated.View style={{ opacity: lettersOpacity }}>
          <Text accessibilityRole="header" style={[styles.appName, { color: Colors.accent, fontFamily: Fonts.serif }]}> 
            {letters.map((ch, i) => {
              const anim = letterAnims[i];
              const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
              const opacity = anim;
              const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
              return (
                <Animated.Text
                  key={i}
                  style={{
                    opacity,
                    transform: [{ translateY }, { scale }],
                  }}
                >
                  {ch}
                </Animated.Text>
              );
            })}
          </Text>
        </Animated.View>

        {/* revealed logo image during exit animation */}
        <Animated.View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
          <Animated.Image
            source={require('../../assets/images/framez-logo-new.jpg')}
            style={{ width: 140, height: 140, opacity: logoImgOpacity, transform: [{ scale: logoImgScale }] }}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>

      <Text style={[styles.tagline, { color: Colors.text, fontFamily: Fonts.sans }]}>Share moments. Frame life.</Text>
    </View>
  );
}

export default SplashScreenComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 48,
    letterSpacing: 6,
    textTransform: 'uppercase',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagline: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.9,
  },
});