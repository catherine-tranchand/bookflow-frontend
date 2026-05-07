// app/(tabs)/home.jsx
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getBooks } from "../../lib/supabase";
import { useGlobalContext } from "../../context/GlobalProvider";
import BookCard from "../../components/BookCard";
import { CITIES } from '../../constants/cities';

// ─── Données filtres ───────────────────────────────────────────────────────────
const FILTERS = {
  offerType: {
    label: "Offre",
    options: [
      { key: "all", label: "Tout" },
      { key: "don", label: "🎁 Don" },
      { key: "echange", label: "🔄 Échange" },
      { key: "vente", label: "💶 Vente" },
    ],
  },
  delivery: {
    label: "Remise",
    options: [
      { key: "all", label: "Tout" },
      { key: "mains_propres", label: "🤝 Mains propres" },
      { key: "poste", label: "📮 Par la poste" },
    ],
  },
  city: {
  label: "Ville",
  options: [
    { key: "all", label: "Toutes" },
    ...CITIES.map((c) => ({ key: c, label: c })),
  ],
},
};

const TABS = [
  { key: "recent", label: "Récents" },
  { key: "nearby", label: "Près de moi" },
  { key: "wishlist", label: "Ma wishlist" },
];

// ─── Bottom Sheet ──────────────────────────────────────────────────────────────
function FilterSheet({ visible, filterKey, selected, onSelect, onClose, onReset }) {
  if (!filterKey) return null;
  const filter = FILTERS[filterKey];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={{ backgroundColor: "#1E1E2D", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 }}>
        {/* Handle */}
        <View style={{ width: 36, height: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 }} />

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pb-3"
          style={{ borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
          <Text className="text-white font-pbold text-base">{filter.label}</Text>
          <TouchableOpacity onPress={onReset}>
            <Text className="text-secondary-100 font-pmedium text-sm">Réinitialiser</Text>
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View className="flex-row flex-wrap gap-2 px-5 pt-4 pb-2">
          {filter.options.map((opt) => {
            const isSelected = selected === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => onSelect(opt.key)}
                className="rounded-2xl px-4 py-2"
                style={{
                  backgroundColor: isSelected ? "rgba(255,156,1,0.18)" : "transparent",
                  borderWidth: 1,
                  borderColor: isSelected ? "rgba(255,156,1,0.5)" : "rgba(255,255,255,0.15)",
                }}
              >
                <Text
                  className="font-pmedium text-sm"
                  style={{ color: isSelected ? "#FF9C01" : "rgba(205,205,224,0.8)" }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={onClose}
          className="mx-5 mt-3 rounded-xl py-3.5 items-center"
          style={{ backgroundColor: "#FF9C01" }}
          activeOpacity={0.85}
        >
          <Text className="text-primary font-pbold text-sm">Afficher les résultats</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Bouton filtre ─────────────────────────────────────────────────────────────
function FilterButton({ filterKey, selected, onPress, disabled }) {
  const filter = FILTERS[filterKey];
  const selectedOpt = filter.options.find((o) => o.key === selected);
  const isActive = selected !== "all";
  const label = isActive ? selectedOpt?.label : filter.label;

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      className="flex-row items-center rounded-3xl px-4 py-2 mr-2"
      style={{
        backgroundColor: isActive ? "rgba(255,156,1,0.18)" : "#232533",
        borderWidth: 1,
        borderColor: isActive ? "rgba(255,156,1,0.5)" : "rgba(255,255,255,0.12)",
        opacity: disabled ? 0.4 : 1,
        gap: 5,
      }}
    >
      <Text
        className="font-pmedium text-sm"
        style={{ color: isActive ? "#FF9C01" : "rgba(205,205,224,0.75)" }}
      >
        {label}
      </Text>
      <Text style={{ color: isActive ? "#FF9C01" : "rgba(205,205,224,0.4)", fontSize: 9 }}>▾</Text>
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
  const [activeTab, setActiveTab] = useState("recent");

  const [selected, setSelected] = useState({ offerType: "all", delivery: "all", city: "all" });
  const [openSheet, setOpenSheet] = useState(null);

  // Règle métier : si offre = don ou échange, le filtre Remise n'a pas de sens
  // (c'est forcément mains propres). On le désactive et on force à "all".
  const deliveryDisabled = selected.offerType === "don" || selected.offerType === "echange";

  const fetchBooks = useCallback(async () => {
    try {
      let docs = await getBooks({
        offerType: selected.offerType !== "all" ? selected.offerType : undefined,
        delivery: selected.delivery !== "all" && !deliveryDisabled ? selected.delivery : undefined,
        city: selected.city !== "all" ? selected.city : undefined,
      });

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        docs = docs.filter(
          (b) => b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q)
        );
      }

      if (activeTab === "wishlist") {
        const wishlist = user?.wishlist ?? [];
        docs = docs.filter((b) => wishlist.includes(b.id));
      }

      setBooks(docs);
    } catch (err) {
      console.error("fetchBooks error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selected, search, activeTab, user?.wishlist, deliveryDisabled]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBooks();
    }, [fetchBooks])
  );

  function handleSelect(filterKey, value) {
    setSelected((prev) => {
      const next = { ...prev, [filterKey]: value };
      // Si on choisit don ou échange, on reset delivery à "all"
      if (filterKey === "offerType" && (value === "don" || value === "echange")) {
        next.delivery = "all";
      }
      return next;
    });
  }

  function handleReset(filterKey) {
    setSelected((prev) => ({ ...prev, [filterKey]: "all" }));
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      {/* Header */}
      <View className="px-4 pt-2 pb-3" style={{ borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white text-2xl font-pbold">
            Book<Text className="text-secondary-100">Flow</Text>
          </Text>
          <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(255,156,1,0.2)" }}>
            <Text className="text-secondary-100 font-pbold text-sm">
              {user?.username?.charAt(0).toUpperCase() ?? "?"}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center rounded-xl px-4 py-2.5 gap-2" style={{ backgroundColor: "#232533" }}>
          <Text style={{ fontSize: 13 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchBooks}
            returnKeyType="search"
            placeholder="Titre, auteur…"
            placeholderTextColor="rgba(205,205,224,0.4)"
            className="flex-1 text-white font-pmedium text-sm"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: "rgba(205,205,224,0.4)", fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Barre filtres */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <FilterButton
          filterKey="offerType"
          selected={selected.offerType}
          onPress={() => setOpenSheet("offerType")}
        />
        <FilterButton
          filterKey="delivery"
          selected={selected.delivery}
          onPress={() => setOpenSheet("delivery")}
          disabled={deliveryDisabled}
        />
        <FilterButton
          filterKey="city"
          selected={selected.city}
          onPress={() => setOpenSheet("city")}
        />
      </View>

      {/* Tabs */}
      <View className="flex-row px-4" style={{ borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className="mr-5 py-2.5"
            style={{ borderBottomWidth: 2, borderColor: activeTab === tab.key ? "#FF9C01" : "transparent" }}
          >
            <Text className="text-sm font-pmedium" style={{ color: activeTab === tab.key ? "#FF9C01" : "rgba(205,205,224,0.4)" }}>
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
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BookCard book={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchBooks(); }}
              tintColor="#FF9C01"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-5xl mb-4">📚</Text>
              <Text className="font-pmedium text-center text-sm" style={{ color: "rgba(205,205,224,0.4)" }}>
                {search ? `Aucun résultat pour "${search}"` : "Aucun livre avec ces filtres"}
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Sheet */}
      <FilterSheet
        visible={openSheet !== null}
        filterKey={openSheet}
        selected={openSheet ? selected[openSheet] : "all"}
        onSelect={(val) => handleSelect(openSheet, val)}
        onClose={() => { setOpenSheet(null); fetchBooks(); }}
        onReset={() => handleReset(openSheet)}
      />
    </SafeAreaView>
  );
}
