import { View, Text, StyleSheet } from 'react-native';

export default function MapWeb() {
  return (
    <View style={styles.root}>
      <Text style={styles.text}>Map view — open on mobile for full experience</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C14', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#BAE6FD', fontSize: 16 },
});
