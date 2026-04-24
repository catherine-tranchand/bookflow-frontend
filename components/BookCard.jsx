import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const OFFER_LABELS = {
  don: "🎁 Don",
  echange: "🔄 Échange",
  vente: "💶 Vente",
};

const DELIVERY_LABELS = {
  mains_propres: "🤝 Mains propres",
  poste: "📮 Poste",
};

const STATE_LABELS = {
  neuf: "✨ Neuf",
  bon_etat: "👍 Bon état",
  acceptable: "📖 Acceptable",
};

export default function BookCard({ book }) {
  const router = useRouter();
  const creatorName = book.creator?.username ?? "…";
  const city = book.city ?? book.creator?.city ?? "";

  const offerLabel = OFFER_LABELS[book.offer_type];
  const deliveryLabel = DELIVERY_LABELS[book.delivery];
  const stateLabel = STATE_LABELS[book.state];

  // Pour une vente, on affiche le prix dans le badge offre : "💶 12 €"
  const isVente = book.offer_type === "vente";
  const offerBadgeText = isVente && book.price != null
    ? `💶 ${book.price} €`
    : offerLabel;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/book/${book.id}`)}
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
            className="text-gray-50 font-plight text-sm mb-2"
            numberOfLines={1}
          >
            {book.author}
          </Text>

          {/* Badges : offre + remise + état */}
          <View className="flex-row flex-wrap gap-1.5 mb-2">
            {offerBadgeText && (
              <View
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
                  {offerBadgeText}
                </Text>
              </View>
            )}

            {deliveryLabel && (
              <View
                className="rounded-full px-2.5 py-0.5"
                style={{
                  backgroundColor: "rgba(255,156,1,0.10)",
                  borderWidth: 1,
                  borderColor: "rgba(255,156,1,0.25)",
                }}
              >
                <Text
                  className="text-secondary-100 font-pmedium"
                  style={{ fontSize: 10 }}
                >
                  {deliveryLabel}
                </Text>
              </View>
            )}

            {stateLabel && (
              <View
                className="rounded-full px-2.5 py-0.5"
                style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
              >
                <Text
                  className="text-gray-100 font-pmedium"
                  style={{ fontSize: 10 }}
                >
                  {stateLabel}
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