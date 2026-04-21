// components/BookCard.jsx
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const TYPE_LABELS = {
  don: "🎁 Don",
  echange: "🔄 Échange",
  vente: "💶 Vente",
  poste: "📮 Poste",
  mains_propres: "🤝 Mains propres",
};

const STATE_LABELS = {
  neuf: "✨ Neuf",
  bon_etat: "👍 Bon état",
  acceptable: "📖 Acceptable",
};

// type est stocké en CSV : "don,mains_propres"
function parseTypes(typeStr) {
  if (!typeStr) return [];
  return typeStr.split(",").map((t) => t.trim()).filter(Boolean);
}

export default function BookCard({ book }) {
  const router = useRouter();
  const types = parseTypes(book.type);
  const creatorName = book.creator?.username ?? "…";
  const city = book.city ?? book.creator?.city ?? "";

  return (
    <TouchableOpacity
      onPress={() => router.push(`/book/${book.$id}`)}
      activeOpacity={0.7}
      className="flex-row bg-black-200 rounded-2xl p-3 mb-3"
      style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}
    >
      {/* Couverture */}
      <View
        className="w-[52px] h-[72px] rounded-xl overflow-hidden mr-3 items-center justify-center"
        style={{ backgroundColor: "#1E1E2D" }}
      >
        {book.image ? (
          <Image
            source={{ uri: book.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-2xl">📖</Text>
        )}
      </View>

      {/* Infos */}
      <View className="flex-1 min-w-0 justify-between">
        <View>
          <Text
            className="text-white font-psemibold text-base mb-0.5" 
            numberOfLines={1}
          >
            {book.title}
          </Text>
          <Text
            className="text-gray-50 font-plight text-s mb-2"
            numberOfLines={1}
          >
            {book.author}
          </Text>

          {/* Badges type — orange secondaire */}
          <View className="flex-row flex-wrap gap-1.5 mb-2">
            {types.slice(0, 2).map((t) => (
              <View
                key={t}
                className="rounded-full px-2.5 py-0.5"
                style={{
                  backgroundColor: "rgba(255,156,1,0.15)",
                  borderWidth: 1,
                  borderColor: "rgba(255,156,1,0.35)",
                }}
              >
                <Text
                  className="text-secondary-100 font-pmedium"
                  style={{ fontSize: 10 }}
                >
                  {TYPE_LABELS[t] ?? t}
                </Text>
              </View>
            ))}
            {book.state && (
              <View
                className="rounded-full px-2.5 py-0.5"
                style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
              >
                <Text
                  className="text-gray-100 font-pmedium"
                  style={{ fontSize: 10 }}
                >
                  {STATE_LABELS[book.state] ?? book.state}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between">
          <Text
            className="text-gray-50 font-plight"
            style={{ fontSize: 10, opacity: 0.5 }}
            numberOfLines={1}
          >
            {city ? `📍 ${city}` : ""}
          </Text>
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <View
              className="w-4 h-4 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(255,156,1,0.25)" }}
            >
              <Text
                className="text-secondary-100 font-pbold"
                style={{ fontSize: 8 }}
              >
                {creatorName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text
              className="text-gray-100 font-plight"
              style={{ fontSize: 10, opacity: 0.5 }}
            >
              {creatorName}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}