import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Fonts } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, signUp } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signUp(email, password, name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: Colors.background }]}
    >
      <View style={styles.centerWrap}>
        <View style={[styles.card, { backgroundColor: Colors.card, borderColor: Colors.cardBorder }]}> 
          <View style={styles.brandRow}>
            <Image source={require('../../assets/images/framez-logo-new.jpg')} style={styles.logo} />
            <Text style={[styles.title, { color: Colors.text, fontFamily: Fonts.serif, position: 'absolute', left: 0, right: 0, textAlign: 'center' }]}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          </View>

          {!isLogin && (
            <TextInput
              style={[styles.input, { backgroundColor: Colors.inputBackground, color: Colors.text, fontFamily: Fonts.sans }]}
              placeholder="Full name"
              placeholderTextColor={Colors.placeholder}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={[styles.input, { backgroundColor: Colors.inputBackground, color: Colors.text, fontFamily: Fonts.sans }]}
            placeholder="Email"
            placeholderTextColor={Colors.placeholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <TextInput
            style={[styles.input, { backgroundColor: Colors.inputBackground, color: Colors.text, fontFamily: Fonts.sans }]}
            placeholder="Password"
            placeholderTextColor={Colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
          />

          {error ? <Text style={[styles.error, { color: Colors.error }]}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.accent }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.buttonText, { fontFamily: Fonts.serif }]}>
                {isLogin ? 'Login' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsLogin(!isLogin)}
            style={styles.switchButton}
          >
            <Text style={[styles.switchText, { color: Colors.accent, fontFamily: Fonts.sans }]}>
              {isLogin ? "Don't have an account? Create one" : 'Already have an account? Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 720,
    borderRadius: 14,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: {
    marginBottom: 12,
    textAlign: 'left',
    fontSize: 22,
  },
  input: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 0,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  switchButton: {
    marginTop: 24,
  },
  switchText: {
    textAlign: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative',
    height: 48,
  },
  logo: {
    width: 44,
    height: 44,
    marginRight: 12,
    resizeMode: 'contain',
    position: 'absolute',
    left: 0,
    top: 2,
  },
  modalButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
});