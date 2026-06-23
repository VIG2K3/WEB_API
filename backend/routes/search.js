require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();


const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY;

const hasGeocodingKey  = Boolean(GEOCODING_API_KEY);


if (!hasGeocodingKey) console.warn('GEOCODING_API_KEY missing; live Geoapify geocoding will be disabled.');

const PENANG_RECT = '100.1594,5.1956,100.5049,5.5354';
const PENANG_LAT  = 5.4164;
const PENANG_LON  = 100.3327;

// ── 100% VERIFIED PENANG COORDINATES (cross-checked with Google Maps) ─────────
const FAMOUS_PLACES = {
  tourism: [
    { id: 'pt001', name: 'Penang War Museum',               address: 'Bukit Batu Maung, Bayan Lepas, 11960 Penang',      lat:5.281548827106277, lon:100.28880598166577, type: '🏛️ War Museum',           desc: 'Historic WWII fortress turned museum, located in Bayan Lepas' },
    { id: 'pt002', name: 'Kek Lok Si Temple',               address: 'Air Itam, 11500 Penang',                           lat: 5.3997,  lon: 100.2728, type: '🏛️ Temple',               desc: 'Largest Buddhist temple in Malaysia' },
    { id: 'pt003', name: 'Penang Hill (Bukit Bendera)',     address: 'Bukit Bendera, 11300 Penang',                      lat: 5.4208,  lon: 100.2698, type: '🏛️ Nature Attraction',    desc: 'Iconic hilltop with panoramic views, accessible by funicular' },
    { id: 'pt004', name: 'Fort Cornwallis',                 address: 'Lebuh Light, George Town, 10000 Penang',          lat: 5.420921635228991, lon: 100.34459181015721, type: '🏛️ Historic Fort',        desc: 'Largest standing fort in Malaysia, built by British' },
    { id: 'pt005', name: 'Cheong Fatt Tze Mansion',        address: '14 Leith Street, George Town, 10200 Penang',       lat: 5.421728496400296, lon: 100.33483975063572, type: '🏛️ Heritage Mansion',     desc: 'The famous Blue Mansion, UNESCO heritage site' },
    { id: 'pt006', name: 'Penang Museum & Art Gallery',    address: '39 Farquhar Street, George Town, 10200 Penang',    lat: 5.42057958679891, lon: 100.33866483171269, type: '🏛️ Museum',               desc: 'Main state museum of Penang history' },
    { id: 'pt007', name: 'Khoo Kongsi',                    address: 'Cannon Square, George Town, 10200 Penang',         lat: 5.414851399568558, lon: 100.33724363899285, type: '🏛️ Clan House',           desc: 'Grandest Chinese clan house in Malaysia' },
    { id: 'pt008', name: 'Pinang Peranakan Mansion',       address: '29 Church Street, George Town, 10200 Penang',      lat: 5.418356199198732, lon: 100.34120459481426, type: '🏛️ Heritage Mansion',     desc: 'Opulent Peranakan museum with antique collection' },
    { id: 'pt009', name: 'Armenian Street Murals',         address: 'Armenian Street, George Town, 10200 Penang',       lat: 5.415586127834719, lon: 100.33700065063573, type: '🏛️ Street Art',           desc: 'Famous murals by Ernest Zacharevic' },
    { id: 'pt010', name: 'Clan Jetties (Chew Jetty)',      address: 'Pengkalan Weld, George Town, 10300 Penang',        lat: 5.413064381376989, lon: 100.33958534867202, type: '🏛️ Heritage Site',        desc: 'Iconic floating village on stilts over the sea' },
    { id: 'pt011', name: 'Penang Butterfly Farm',          address: 'Jalan Teluk Bahang, 11050 Penang',                 lat: 5.4475057, lon: 100.2152348, type: '🏛️ Nature Attraction',    desc: "World's first tropical butterfly farm" },
    { id: 'pt012', name: 'Penang National Park',           address: 'Teluk Bahang, 11050 Penang',                       lat: 5.4602695571639455, lon: 100.20617897007297, type: '🏛️ National Park',        desc: 'Smallest national park in the world' },
    { id: 'pt013', name: 'Tropical Spice Garden',          address: 'Jalan Teluk Bahang, 11050 Penang',                 lat: 5.463500861201718, lon: 100.22934093793377, type: '🌿 Spice Garden',          desc: 'Lush spice garden with guided tours' },
    { id: 'pt014', name: 'ESCAPE Theme Park',              address: 'Jalan Teluk Bahang, 11050 Penang',                 lat: 5.449991487945566, lon: 100.2140272710196, type: '🎡 Theme Park',            desc: 'Exciting outdoor adventure park' },
    { id: 'pt015', name: 'Penang Botanic Gardens',         address: 'Waterfall Road, 10350 Penang',                     lat: 5.437903590954854, lon: 100.29068648786249, type: '🌿 Botanical Garden',      desc: 'Beautiful colonial-era botanical garden' },
    { id: 'pt016', name: 'Sri Mahamariamman Temple',       address: 'Jalan Waterfall, 10350 Penang',                    lat: 5.421368471480587, lon: 100.33890056953622, type: '🏛️ Hindu Temple',         desc: 'Beautiful and important Hindu temple' },
    { id: 'pt017', name: 'Penang Toy Museum',              address: 'Batu Ferringhi, 11100 Penang',                     lat: 5.456561582525605, lon: 100.21588171461443, type: '🏛️ Museum',               desc: 'Largest toy museum in Asia' },
    { id: 'pt018', name: 'Straits Quay Marina',            address: 'Tanjung Tokong, 11200 Penang',                     lat: 5.458202970121524, lon: 100.31295670698685, type: '🏛️ Marina',               desc: 'Waterfront retail and lifestyle marina' },
    { id: 'pt019', name: 'Penang Time Tunnel Museum',      address: 'Jalan Teluk Bahang, 11050 Penang',                 lat: 5.4225354535454615, lon: 100.33965620830712, type: '🏛️ Museum',               desc: "Journey through Penang's history" },
    { id: 'pt020', name: 'Penang Bridge',                  address: 'Prai, 13600 Penang',                               lat: 5.352375653743409, lon: 100.35825396597829, type: '🏛️ Landmark',             desc: 'Iconic 13.5km bridge linking island to mainland' },
    { id: 'pt021', name: 'Penang Second Bridge (PTSC)',    address: 'Batu Maung, 11960 Penang',                         lat: 5.283481625836969, lon: 100.30926945063526, type: '🏛️ Landmark',             desc: 'Longest bridge in Malaysia at 24km' },
    { id: 'pt022', name: 'Upside Down Museum Penang',      address: 'Jalan Burmah, George Town, 10050 Penang',          lat: 5.415996851499155, lon: 100.33344376412855, type: '🏛️ Museum',               desc: 'Fun interactive upside-down museum' },
    { id: 'pt023', name: 'Penang Hill Habitat',            address: 'Bukit Bendera, 11300 Penang',                      lat: 5.4215,  lon: 100.2692, type: '🌿 Eco Attraction',        desc: 'Treetop walkway on Penang Hill' },
    { id: 'pt024', name: 'St George Church',               address: 'Lebuh Farquhar, George Town, 10200 Penang',        lat: 5.4199683311031785, lon: 100.33902527762146, type: '🏛️ Heritage Church',      desc: 'Oldest Anglican church in Southeast Asia' },
    { id: 'pt025', name: 'Kapitan Keling Mosque',          address: 'Lebuh Buckingham, George Town, 10200 Penang',      lat: 5.417090811505336, lon: 100.33710987101954, type: '🕌 Mosque',               desc: 'Largest mosque in George Town, built 1801' },
  ],
  restaurant: [
    { id: 'pr001', name: 'Gurney Drive Hawker Centre',     address: 'Persiaran Gurney, 10250 Penang',                  lat: 5.440418743688126, lon: 100.30872086597869, type: '🍜 Hawker Centre',        desc: 'Most famous hawker centre in Penang' },
    { id: 'pr004', name: 'Penang Road Famous Cendol',      address: 'Jalan Penang, George Town, 10000 Penang',         lat: 5.417743124260099, lon: 100.3309647366087, type: '🍧 Cendol Stall',          desc: 'World famous cendol, queue is worth it' },
    { id: 'pr006', name: 'Sri Ananda Bahwan',              address: '55 Jalan Penang, George Town, 10000 Penang',      lat: 5.41811359927757,  lon: 100.34047414635063, type: '🍛 Indian Vegetarian',    desc: 'Famous Indian vegetarian restaurant' },
    { id: 'pr007', name: 'Hameediyah Restaurant',          address: '164A Campbell Street, George Town, 10200 Penang', lat: 5.419584568656056, lon: 100.33253679454378, type: '🍛 Nasi Kandar',           desc: 'Oldest nasi kandar in Penang since 1907' },
    { id: 'pr009', name: 'Tek Sen Restaurant',             address: '18 Carnarvon Street, George Town, 10100 Penang',  lat: 5.41771469824993,  lon: 100.33601563899289, type: '🍜 Chinese Restaurant',    desc: 'Award-winning heritage Chinese restaurant' },
    { id: 'pr010', name: 'Restoran Kapitan',               address: '93 Chulia Street, George Town, 10200 Penang',     lat: 5.416465019813175, lon: 100.33855837278604, type: '🍛 Indian Muslim',         desc: 'Famous mamak restaurant in heritage zone' },
    { id: 'pr011', name: 'Padang Brown Hawker Centre',     address: 'Jalan Perak, George Town, 10050 Penang',          lat: 5.414459975860006, lon: 100.31696114263943, type: '🍜 Hawker Centre',         desc: 'Legendary local hawker centre' },
    { id: 'pr013', name: 'Eden Seafood Village',           address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.473889153013076, lon: 100.24725373714313, type: '🦞 Seafood Restaurant',    desc: 'Famous seafood restaurant by the beach' },
    { id: 'pr020', name: 'Lorong Abu Siti Hawker',         address: 'Lorong Abu Siti, 10400 Penang',                   lat: 5.419065936789824, lon: 100.32391684878576, type: '🍜 Hawker Centre',         desc: 'Popular local hawker area' },
    { id: 'pr021', name: 'Kedai Kopi Swee Kong',           address: 'Kampung Baru, 11700 Penang',                      lat: 5.430753567716384, lon: 100.31258629723585, type: '🍜 Kopitiam',               desc: 'Popular local kopitiam in Kampung Baru' },
    { id: 'pr022', name: 'Restoran Farlim Jaya',           address: 'Taman Farlim, 11500 Penang',                      lat: 5.39489858613278,  lon: 100.28401594317043, type: '🍜 Local Restaurant',       desc: 'Well-known local eatery in Farlim area' },
    { id: 'pr023', name: 'Wai Kee Noodles Jelutong',       address: 'Jelutong, 11600 Penang',                          lat: 5.414672232366969, lon: 100.31020880325723, type: '🍜 Noodle Shop',            desc: 'Famous noodle shop in Jelutong' },
    { id: 'pr025', name: 'Bayan Baru Hawker Centre',       address: 'Bayan Baru, 11950 Penang',                        lat: 5.326105987281505, lon: 100.28622535339258, type: '🍜 Hawker Centre',          desc: 'Popular hawker centre in Bayan Baru' },
    { id: 'pr026', name: 'Restoran Balik Pulau Laksa',     address: 'Balik Pulau, 11000 Penang',                       lat: 5.359555638689265, lon: 100.23603525384809, type: '🍜 Laksa',                  desc: 'Famous Balik Pulau asam laksa' },
    { id: 'pr027', name: 'Relau Seafood Restaurant',       address: 'Relau, 11900 Penang',                             lat: 5.326387041614684, lon: 100.26830727870956, type: '🦞 Seafood',                desc: 'Popular seafood restaurant in Relau' },
    { id: 'pr024', name: 'Gelugor Char Koay Teow',         address: 'Gelugor, 11700 Penang',                           lat: 5.370076549662053, lon: 100.3098202484978, type: '🍜 Char Koay Teow',         desc: 'Popular char koay teow stall in Gelugor' },
  ],
  hotel: [
    { id: 'ph001', name: 'Eastern & Oriental Hotel',       address: '10 Lebuh Farquhar, George Town, 10200 Penang',    lat: 5.423470610732463, lon: 100.33587630830715, type: '🏨 5-Star Heritage Hotel',  desc: 'Iconic colonial heritage hotel established 1885' },
    { id: 'ph002', name: 'Hard Rock Hotel Penang',         address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.467886434861278, lon: 100.24150205063599, type: '🏨 5-Star Resort',          desc: 'Famous beachfront rock-themed resort' },
    { id: 'ph003', name: 'Shangri-La Rasa Sayang Resort',  address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.478368450815994, lon: 100.25359686597888, type: '🏨 5-Star Resort',          desc: 'Premier luxury beach resort' },
    { id: 'ph004', name: 'Penang Marriott Hotel',          address: 'Persiaran Gurney, 10250 Penang',                  lat: 5.4328516692039015, lon: 100.31759977282955, type: '🏨 5-Star Hotel',           desc: 'Luxury hotel on Gurney Drive' },
    { id: 'ph005', name: 'Hotel Jen Penang',               address: 'Magazine Road, George Town, 10300 Penang',        lat: 5.413725352223903, lon: 100.33026805063572, type: '🏨 4-Star Hotel',           desc: 'Modern hotel in central George Town' },
    { id: 'ph006', name: 'Sunway Hotel Georgetown',        address: 'Brown Road, George Town, 10350 Penang',           lat: 5.414481166173514, lon: 100.32587580830717, type: '🏨 4-Star Hotel',           desc: 'Well-located city hotel near botanical garden' },
    { id: 'ph007', name: 'Bayview Hotel Georgetown',       address: '25A Lebuh Farquhar, George Town, 10200 Penang',   lat: 5.421984445409153, lon: 100.33602182365004, type: '🏨 3-Star Hotel',           desc: 'Central hotel near UNESCO heritage zone' },
    { id: 'ph009', name: 'Golden Sands Resort',            address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.47676791117279, lon: 100.25153523714307, type: '🏨 4-Star Resort',          desc: 'Beachfront family-friendly resort' },
    { id: 'ph010', name: 'Copthorne Orchid Hotel',         address: 'Jalan Tanjung Bungah, 11200 Penang',              lat: 5.46742221518717, lon: 100.29226707947167, type: '🏨 4-Star Hotel',           desc: 'Seafront hotel with great sea views' },
    { id: 'ph011', name: 'G Hotel Kelawai',                address: 'Jalan Kelawai, 10250 Penang',                     lat: 5.435699897982423, lon: 100.30990638556437, type: '🏨 4-Star Hotel',           desc: 'Trendy boutique hotel near Gurney Drive' },
    { id: 'ph013', name: 'Lone Pine Hotel',                address: '97 Jalan Batu Ferringhi, 11100 Penang',           lat: 5.476388752911179, lon: 100.25011036597887, type: '🏨 Boutique Beach Hotel',   desc: 'Charming boutique hotel right on the beach' },
    { id: 'ph014', name: 'Parkroyal Penang Resort',        address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.472594812656726, lon: 100.24618666597877, type: '🏨 5-Star Resort',          desc: 'Luxury beachfront resort with pools' },
    { id: 'ph015', name: 'Wembley Hotel Penang',           address: 'Jalan Penang, George Town, 10000 Penang',         lat: 5.41339483331738, lon: 100.32993962364996, type: '🏨 4-Star Hotel',           desc: 'Classic hotel in the heart of George Town' },
    { id: 'ph017', name: 'Farlim Guest House',             address: 'Taman Farlim, 11500 Penang',                      lat: 5.38710612503351, lon: 100.27641626935555, type: '🏨 Guesthouse',              desc: 'Cosy guesthouse near Farlim' },
    { id: 'ph018', name: 'Jelutong Budget Hotel',          address: 'Jelutong, 11600 Penang',                          lat: 5.39019889691903, lon: 100.31058350830705, type: '🏨 Budget Hotel',            desc: 'Affordable hotel in Jelutong area' },
    { id: 'ph021', name: 'Balik Pulau Homestay',           address: 'Balik Pulau, 11000 Penang',                       lat: 5.367111093472416, lon: 100.2088286773052, type: '🏨 Homestay',                desc: 'Charming rural homestay in Balik Pulau' },
  ],
  beach: [
    { id: 'pb001', name: 'Batu Ferringhi Beach',           address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.473166477533177, lon: 100.24549981835294, type: '🏖️ Beach',                 desc: 'Most popular beach, water sports available' },
    { id: 'pb002', name: 'Tanjung Bungah Beach',           address: 'Jalan Tanjung Bungah, 11200 Penang',              lat: 5.468529907237842, lon: 100.28851096194214, type: '🏖️ Beach',                 desc: 'Quieter beach closer to George Town' },
    { id: 'pb003', name: 'Monkey Beach',                   address: 'Penang National Park, Teluk Bahang, 11050 Penang',lat: 5.473095157026646, lon: 100.18742141894565, type: '🏖️ Beach',                 desc: 'Pristine beach inside national park, jungle trek needed' },
    { id: 'pb004', name: 'Kerachut Beach',                 address: 'Penang National Park, Teluk Bahang, 11050 Penang',lat: 5.452485257004794, lon: 100.18265714168297, type: '🏖️ Beach',                 desc: 'Turtle nesting beach, very scenic and remote' },
    { id: 'pb005', name: 'Teluk Bahang Beach',             address: 'Teluk Bahang, 11050 Penang',                      lat: 5.461626497806623, lon: 100.21742402365014, type: '🏖️ Beach',                 desc: 'Quiet fishing village beach, local feel' },
    { id: 'pb006', name: 'Miami Beach Tanjung Bungah',     address: 'Jalan Tanjung Bungah, 11200 Penang',              lat: 5.4781496912266405, lon: 100.26806319481457, type: '🏖️ Beach',                 desc: 'Local favourite beach spot' },
    { id: 'pb007', name: 'Pantai Pasir Panjang',           address: 'Balik Pulau, 11000 Penang',                       lat: 5.303795290182557, lon: 100.18549998421045, type: '🏖️ Beach',                 desc: 'Secluded beach on the quieter side of Penang island' },
  ],
};

// ── GET /api/search/places ────────────────────────────────────────────────────
router.get('/places', async (req, res) => {
  const { q, category } = req.query;

  if (!q && !category) {
    return res.status(400).json({ error: 'Query (q) or category is required' });
  }

  try {
    let places = [];

    if (q) {
      const query = q.toLowerCase().trim();
      const allFamous = [
        ...FAMOUS_PLACES.tourism,
        ...FAMOUS_PLACES.restaurant,
        ...FAMOUS_PLACES.hotel,
        ...FAMOUS_PLACES.beach,
      ];

      const localResults = allFamous.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query) ||
        (p.desc && p.desc.toLowerCase().includes(query)) ||
        (p.type && p.type.toLowerCase().includes(query))
      );

      if (localResults.length > 0) {
        places = localResults;
      } else if (hasGeocodingKey) {
        const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
          params: {
            text:   q + ' Penang Malaysia',
            lang:   'en',
            limit:  15,
            format: 'json',
            bias:   `proximity:${PENANG_LON},${PENANG_LAT}`,
            apiKey: GEOCODING_API_KEY,
          },
          timeout: 8000,
        });
        places = (response.data.results || []).map(p => ({
          id:      p.place_id,
          name:    p.name || p.address_line1 || 'Unknown Place',
          address: p.address_line2 || p.formatted || 'Penang, Malaysia',
          lat:     p.lat,
          lon:     p.lon,
          type:    '📍 Place',
          desc:    '',
        }));
      } else {
        places = [];
      }

    } else {
      // return hardcoded places
      places = FAMOUS_PLACES[category] || [];
    }

    res.json({ success: true, count: places.length, places });

  } catch (err) {
    console.error('Places search error:', err.response?.data || err.message);
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Search timed out. Please try again.' });
    }
    res.status(502).json({ error: 'Failed to fetch places. Try again.' });
  }
});

// ── GET /api/search/geocode ───────────────────────────────────────────────────
router.get('/geocode', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query (q) is required' });

  try {
    const query = q.toLowerCase().trim();
    const allFamous = [
      ...FAMOUS_PLACES.tourism,
      ...FAMOUS_PLACES.restaurant,
      ...FAMOUS_PLACES.hotel,
      ...FAMOUS_PLACES.beach,
    ];

    // Exact match first, then partial — more reliable than partial-only
    const found =
      allFamous.find(p => p.name.toLowerCase() === query) ||
      allFamous.find(p => p.name.toLowerCase().includes(query));

    if (found) {
      return res.json({ success: true, lat: found.lat, lon: found.lon, name: found.name });
    }

    if (!hasGeocodingKey) {
      return res.status(404).json({ error: 'Location not found in Penang' });
    }

    // Fallback to Geoapify — bias instead of hard rect filter
    const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
      params: {
        text:   q + ' Penang Malaysia',
        lang:   'en',
        limit:  1,
        format: 'json',
        bias:   `proximity:${PENANG_LON},${PENANG_LAT}`,  // ← soft bias, not hard filter
        apiKey: GEOCODING_API_KEY,
      },
      timeout: 8000,
    });

    const results = response.data.results || [];
    if (!results.length) {
      return res.status(404).json({ error: 'Location not found in Penang' });
    }

    const place = results[0];
    res.json({ success: true, lat: place.lat, lon: place.lon, name: place.name || q });

  } catch (err) {
    console.error('Geocode error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Geocoding failed. Try again.' });
  }
});

function getCategoryLabel(cat) {
  const labels = {
    tourism:    '🏛️ Tourist Attraction',
    restaurant: '🍜 Restaurant',
    hotel:      '🏨 Hotel',
    beach:      '🏖️ Beach',
  };
  return labels[cat] || '📍 Place';
}

module.exports = router;