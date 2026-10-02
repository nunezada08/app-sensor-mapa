import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export function BackButton({ onPress }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Voltar" style={styles.backButton} onPress={onPress}><Text style={styles.backArrow}>‹</Text></Pressable>;
}

export function SearchBar({ value, onChangeText, onSubmit, suggestions, onSelectSuggestion, searching }) {
  const showEmpty = !searching && value.trim().length >= 2 && !suggestions?.length;
  return <View style={styles.searchArea}><View style={styles.searchBar}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel="Buscar rua, município ou lugar em São Paulo" value={value} onChangeText={onChangeText} onSubmitEditing={onSubmit} placeholder="Rua, cidade ou lugar" placeholderTextColor="#efefef" returnKeyType="search" style={styles.searchInput} /></View>{searching ? <Text style={styles.searchStatus}>Buscando em ruas, municípios e lugares de São Paulo...</Text> : null}{showEmpty ? <Text style={styles.searchStatus}>Nenhum resultado encontrado em São Paulo.</Text> : null}{suggestions?.length ? <View style={styles.suggestions}>{suggestions.map((suggestion) => <Pressable key={`${suggestion.latitude}-${suggestion.longitude}`} style={styles.suggestion} onPress={() => onSelectSuggestion(suggestion)}><Text style={styles.suggestionIcon}>⌖</Text><Text numberOfLines={2} style={styles.suggestionText}>{suggestion.label}</Text></Pressable>)}</View> : null}</View>;
}

export function RouteCard({ title, duration, distance, icon, disabled, onPress }) {
  return <Pressable disabled={disabled} style={[styles.routeCard, disabled && styles.disabledCard]} onPress={onPress}><View style={styles.routeHeader}><Text style={styles.routeIcon}>{icon}</Text><Text style={styles.routeTitle}>{title}</Text></View><Text style={styles.routeTime}>{duration} · {distance}</Text><Text style={styles.routeHint}>{disabled ? 'Aguardando rota real' : 'Trajeto calculado pelo mapa'}</Text></Pressable>;
}

export function PrimaryButton({ children, onPress, disabled }) {
  return <Pressable disabled={disabled} style={[styles.primaryButton, disabled && styles.disabledButton]} onPress={onPress}><Text style={styles.primaryButtonText}>{children}</Text></Pressable>;
}

export const uiStyles = styles;

const styles = StyleSheet.create({
  backButton: { width: 45, height: 45, borderRadius: 24, backgroundColor: 'rgba(35,35,35,.95)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: '#f5f5f5', fontSize: 37, lineHeight: 36, fontWeight: '300', marginTop: -4 },
  searchBar: { height: 58, borderRadius: 18, backgroundColor: '#333', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  searchStatus: { color: '#999', fontSize: 11, paddingHorizontal: 14, paddingTop: 7 },
  suggestions: { backgroundColor: '#2a2a2a', borderRadius: 14, marginTop: 6, overflow: 'hidden' },
  suggestion: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#444' },
  suggestionIcon: { color: '#0cc5d7', fontSize: 20, marginRight: 10 },
  suggestionText: { color: '#f5f5f5', fontSize: 12, lineHeight: 16, flex: 1 },
  searchIcon: { color: '#f5f5f5', fontSize: 33, lineHeight: 32, marginRight: 12, transform: [{ rotate: '-20deg' }] },
  searchInput: { flex: 1, color: '#f5f5f5', fontSize: 17, fontWeight: '700' },
  routeCard: { backgroundColor: '#2a2a2a', borderRadius: 22, padding: 19, marginBottom: 14, minHeight: 122, width: '100%' },
  disabledCard: { opacity: 0.52 },
  routeHeader: { flexDirection: 'row', alignItems: 'center' },
  routeIcon: { color: '#f5f5f5', fontSize: 22, width: 34 },
  routeTitle: { color: '#f5f5f5', fontSize: 18, fontWeight: '800' },
  routeTime: { color: '#d1d1d1', fontSize: 13, marginTop: 9, marginLeft: 34 },
  routeHint: { color: '#0cc5d7', fontSize: 11, marginTop: 8, marginLeft: 34 },
  primaryButton: { backgroundColor: '#0cc5d7', minHeight: 56, borderRadius: 17, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20, width: '100%' },
  disabledButton: { opacity: 0.45 },
  primaryButtonText: { color: '#062a31', fontWeight: '900', fontSize: 17 },
  searchArea: { marginBottom: 18, zIndex: 10 },
});
