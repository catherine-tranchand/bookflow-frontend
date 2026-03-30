// app/(tabs)/home.jsx
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { Query } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";
import { databases, config } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import BookCard from "../../components/BookCard";

// ─── Filtres ───────────────────────────────────────────────────────────────────
const TYPE_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "don", label: "🎁 Don" },
  { key: "echange", label: "🔄 Échange" },
  { key: "vente", label: "💶 Vente" },
];

const CITY_FILTERS = [
  "Paris", "Lyon", "Marseille", "Bordeaux", "Toulouse", "Nice", "Strasbourg",
];

const TABS = [
  { key: "recent", label: "Récents" },
  { key: "nearby", label: "Près de moi" },
  { key: "wishlist", label: "Ma wishlist" },
];

// ─── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`rounded-xl px-3 py-2 mr-2 border ${
        active
          ? "bg-secondary-100 border-secondary-100"
          : "bg-black-200 border-gray-100/20"
      }`}
    >
      <Text
        className={`text-xs font-pmedium ${
          active ? "text-primary" : "text-gray-100"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useGlobalContext();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [activeCity, setActiveCity] = useState(null);
  const [activeTab, setActiveTab] = useState("recent");

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchBooks = useCallback(async () => {
    try {
      const queries = [Query.orderDesc("$createdAt"), Query.limit(30)];

      // Pour le filtre type, on cherche dans la string CSV "don,mains_propres"
      if (activeType !== "all") {
        queries.push(Query.contains("type", activeType));
      }

      const res = await databases.listDocuments(
        config.databaseId,
        config.booksCollectionId,
        queries
      );

      let docs = res.documents;

      // Filtre ville sur le creator
      if (activeCity) {
        docs = docs.filter(
          (b) =>
            b.creator?.city?.toLowerCase().includes(activeCity.toLowerCase())
        );
      }

      // Filtre search local
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        docs = docs.filter(
          (b) =>
            b.title?.toLowerCase().includes(q) ||
            b.author?.toLowerCase().includes(q)
        );
      }

      // Filtre wishlist
      if (activeTab === "wishlist") {
        const wishlist = user?.wishlist ?? [];
        docs = docs.filter((b) => wishlist.includes(b.$id));
      }

      setBooks(docs);
    } catch (err) {
      console.error("fetchBooks error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeType, activeCity, search, activeTab]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBooks();
    }, [fetchBooks])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooks();
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="bg-primary h-full">
      {/* Header */}
      <View className="px-4 pt-2 pb-3">
        {/* Logo */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-2xl font-pbold">
            Book<Text className="text-secondary-100">Flow</Text>
          </Text>
          {/* Avatar user */}
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255,156,1,0.2)" }}
          >
            <Text className="text-secondary-100 font-pbold text-sm">
              {user?.username?.charAt(0).toUpperCase() ?? "?"}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View
          className="flex-row items-center rounded-xl px-4 py-3 gap-2"
          style={{ backgroundColor: "#232533" }}
        >
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchBooks}
            returnKeyType="search"
            placeholder="Titre, auteur…"
            placeholderTextColor="#CDCDE0"
            className="flex-1 text-white font-pmedium text-sm"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text className="text-gray-100 text-sm">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Type filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-11"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
      >
        {TYPE_FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            active={activeType === f.key}
            onPress={() => setActiveType(f.key)}
          />
        ))}
        {/* Séparateur */}
        <View
          className="w-px h-6 self-center mx-1"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
        />
        {CITY_FILTERS.map((city) => (
          <Chip
            key={city}
            label={city}
            active={activeCity === city}
            onPress={() =>
              setActiveCity((prev) => (prev === city ? null : city))
            }
          />
        ))}
      </ScrollView>

      {/* Tabs */}
      <View
        className="flex-row px-4 mt-3 mb-1"
        style={{ borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className="mr-6 pb-2"
            style={{
              borderBottomWidth: 2,
              borderColor:
                activeTab === tab.key ? "#FF9C01" : "transparent",
            }}
          >
            <Text
              className={`text-xs font-pmedium ${
                activeTab === tab.key
                  ? "text-secondary-100"
                  : "text-gray-100/50"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF9C01" />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => <BookCard book={item} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF9C01"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-5xl mb-4">📚</Text>
              <Text className="text-gray-100 font-pmedium text-center text-sm opacity-60">
                {search
                  ? `Aucun résultat pour "${search}"`
                  : "Aucun livre disponible\navec ces filtres"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}