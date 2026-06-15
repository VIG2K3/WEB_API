import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { tripService } from "./services/tripService";
import type { Trip } from "./types/trip";
import { TripImage } from "./components/TripImage";

interface FavouritesProps {
  onBack: () => void;
  onOpenExplorer?: (place: any) => void;
  onChanged?: () => void;
}

export default function Favourites({ onBack, onOpenExplorer, onChanged }: FavouritesProps) {
  const [favourites, setFavourites] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadFavourites = async () => {
    try {
      setLoading(true);
      const data = await tripService.getFavourites();
      setFavourites(data);
    } catch (err) {
      console.error("Failed to load favourites:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFavourites(); }, []);

  const removeFavourite = async (trip: Trip) => {
    try {
      setRemovingId(trip._id);
      if (trip.isFavouriteOnly) {
        await tripService.deleteTrip(trip._id);
      } else {
        await tripService.toggleFavourite(trip._id, false);
      }
      setFavourites(prev => prev.filter(item => item._id !== trip._id));
      onChanged?.();
    } catch (err) {
      console.error("Failed to remove favourite:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const openPlace = (trip: Trip) => {
    onOpenExplorer?.({
      name: trip.destination,
      address: trip.address,
      lat: trip.lat,
      lon: trip.lon,
      type: trip.type || trip.category,
      category: trip.category,
    });
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f7fa; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; }
      `}</style>

      <main style={styles.main}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Favourites</h1>
            <p style={styles.pageSub}>{favourites.length} saved place{favourites.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {loading && <div style={styles.emptyState}>Loading favourites...</div>}

        {!loading && favourites.length === 0 && (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 42 }}>🤍</span>
            <h3 style={{ marginTop: 10 }}>No favourites yet</h3>
            <p style={{ color: "#777", marginTop: 6 }}>Open Penang Explorer and click the heart on any place.</p>
          </div>
        )}

        {!loading && favourites.length > 0 && (
          <div style={styles.grid}>
            {favourites.map((trip) => (
              <div key={trip._id} style={styles.card}>
                <div style={styles.imageWrap}>
                  <TripImage trip={trip} style={styles.image} />
                  <span style={styles.heart}>❤️</span>
                </div>
                <div style={styles.body}>
                  <h3 style={styles.title}>{trip.destination}</h3>
                  <p style={styles.address}>{trip.address || "Penang, Malaysia"}</p>
                  <p style={styles.meta}>{trip.type || trip.category || "Saved place"}</p>
                  <div style={styles.actions}>
                    <button style={styles.primaryBtn} onClick={() => openPlace(trip)}>View / Route</button>
                    <button style={styles.removeBtn} onClick={() => removeFavourite(trip)} disabled={removingId === trip._id}>
                      {removingId === trip._id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  root: { fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f0ede8", color: "#111" },
  main: { maxWidth: 1120, margin: "0 auto", padding: "34px 48px 80px" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  pageTitle: { fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800 },
  pageSub: { fontSize: 13, color: "#777", marginTop: 4 },
  backBtn: { background: "#eef4ff", color: "#3e84f6", padding: "10px 16px", borderRadius: 10, fontWeight: 700 },
  emptyState: { background: "#fff", borderRadius: 20, padding: 48, textAlign: "center", border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 },
  card: { background: "#fff", borderRadius: 18, overflow: "hidden", border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" },
  imageWrap: { position: "relative", height: 170, overflow: "hidden" },
  image: { width: "100%", height: "100%", objectFit: "cover" },
  heart: { position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.9)", width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.15)" },
  body: { padding: 16 },
  title: { fontSize: 16, fontWeight: 800, marginBottom: 6 },
  address: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  meta: { fontSize: 12, color: "#999", marginBottom: 14, textTransform: "capitalize" },
  actions: { display: "flex", gap: 8 },
  primaryBtn: { flex: 1, background: "#3e84f6", color: "#fff", borderRadius: 999, padding: "9px 12px", fontWeight: 700, fontSize: 12 },
  removeBtn: { background: "#fef2f2", color: "#dc2626", borderRadius: 999, padding: "9px 12px", fontWeight: 700, fontSize: 12 },
};
