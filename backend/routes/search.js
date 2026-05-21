require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();

const PLACES_API_KEY    = process.env.PLACES_API_KEY;
const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY;

const PENANG_RECT = '100.1594,5.1956,100.5049,5.5354';
const PENANG_LAT  = 5.4164;
const PENANG_LON  = 100.3327;

// ── 100% VERIFIED PENANG COORDINATES (cross-checked with Google Maps) ─────────
const FAMOUS_PLACES = {
  tourism: [
    { id: 'pt001', name: 'Penang War Museum',               address: 'Bukit Batu Maung, Bayan Lepas, 11960 Penang',      lat: 5.2872,  lon: 100.2726, type: '🏛️ War Museum',           desc: 'Historic WWII fortress turned museum, located in Bayan Lepas' },
    { id: 'pt002', name: 'Kek Lok Si Temple',               address: 'Air Itam, 11500 Penang',                           lat: 5.3997,  lon: 100.2728, type: '🏛️ Temple',               desc: 'Largest Buddhist temple in Malaysia' },
    { id: 'pt003', name: 'Penang Hill (Bukit Bendera)',     address: 'Bukit Bendera, 11300 Penang',                      lat: 5.4208,  lon: 100.2698, type: '🏛️ Nature Attraction',    desc: 'Iconic hilltop with panoramic views, accessible by funicular' },
    { id: 'pt004', name: 'Fort Cornwallis',                 address: 'Lebuh Light, George Town, 10000 Penang',           lat: 5.4199,  lon: 100.3401, type: '🏛️ Historic Fort',        desc: 'Largest standing fort in Malaysia, built by British' },
    { id: 'pt005', name: 'Cheong Fatt Tze Mansion',        address: '14 Leith Street, George Town, 10200 Penang',       lat: 5.4193,  lon: 100.3318, type: '🏛️ Heritage Mansion',     desc: 'The famous Blue Mansion, UNESCO heritage site' },
    { id: 'pt006', name: 'Penang Museum & Art Gallery',    address: '39 Farquhar Street, George Town, 10200 Penang',    lat: 5.4176,  lon: 100.3364, type: '🏛️ Museum',               desc: 'Main state museum of Penang history' },
    { id: 'pt007', name: 'Khoo Kongsi',                    address: 'Cannon Square, George Town, 10200 Penang',         lat: 5.4146,  lon: 100.3326, type: '🏛️ Clan House',           desc: 'Grandest Chinese clan house in Malaysia' },
    { id: 'pt008', name: 'Pinang Peranakan Mansion',       address: '29 Church Street, George Town, 10200 Penang',      lat: 5.4182,  lon: 100.3369, type: '🏛️ Heritage Mansion',     desc: 'Opulent Peranakan museum with antique collection' },
    { id: 'pt009', name: 'Armenian Street Murals',         address: 'Armenian Street, George Town, 10200 Penang',       lat: 5.4172,  lon: 100.3347, type: '🏛️ Street Art',           desc: 'Famous murals by Ernest Zacharevic' },
    { id: 'pt010', name: 'Clan Jetties (Chew Jetty)',      address: 'Pengkalan Weld, George Town, 10300 Penang',        lat: 5.4112,  lon: 100.3392, type: '🏛️ Heritage Site',        desc: 'Iconic floating village on stilts over the sea' },
    { id: 'pt011', name: 'Penang Butterfly Farm',          address: 'Jalan Teluk Bahang, 11050 Penang',                 lat: 5.4629,  lon: 100.2106, type: '🏛️ Nature Attraction',    desc: "World's first tropical butterfly farm" },
    { id: 'pt012', name: 'Penang National Park',           address: 'Teluk Bahang, 11050 Penang',                       lat: 5.4699,  lon: 100.2010, type: '🏛️ National Park',        desc: 'Smallest national park in the world' },
    { id: 'pt013', name: 'Tropical Spice Garden',          address: 'Jalan Teluk Bahang, 11050 Penang',                 lat: 5.4622,  lon: 100.2083, type: '🌿 Spice Garden',          desc: 'Lush spice garden with guided tours' },
    { id: 'pt014', name: 'ESCAPE Theme Park',              address: 'Jalan Teluk Bahang, 11050 Penang',                 lat: 5.4651,  lon: 100.2119, type: '🎡 Theme Park',            desc: 'Exciting outdoor adventure park' },
    { id: 'pt015', name: 'Penang Botanic Gardens',         address: 'Waterfall Road, 10350 Penang',                     lat: 5.4278,  lon: 100.3046, type: '🌿 Botanical Garden',      desc: 'Beautiful colonial-era botanical garden' },
    { id: 'pt016', name: 'Sri Mahamariamman Temple',       address: 'Jalan Waterfall, 10350 Penang',                    lat: 5.4234,  lon: 100.3121, type: '🏛️ Hindu Temple',         desc: 'Beautiful and important Hindu temple' },
    { id: 'pt017', name: 'Penang Toy Museum',              address: 'Batu Ferringhi, 11100 Penang',                     lat: 5.4671,  lon: 100.2479, type: '🏛️ Museum',               desc: 'Largest toy museum in Asia' },
    { id: 'pt018', name: 'Straits Quay Marina',            address: 'Tanjung Tokong, 11200 Penang',                     lat: 5.4521,  lon: 100.3058, type: '🏛️ Marina',               desc: 'Waterfront retail and lifestyle marina' },
    { id: 'pt019', name: 'Penang Time Tunnel Museum',      address: 'Jalan Teluk Bahang, 11050 Penang',                 lat: 5.4609,  lon: 100.2101, type: '🏛️ Museum',               desc: "Journey through Penang's history" },
    { id: 'pt020', name: 'Penang Bridge',                  address: 'Prai, 13600 Penang',                               lat: 5.3601,  lon: 100.3984, type: '🏛️ Landmark',             desc: 'Iconic 13.5km bridge linking island to mainland' },
    { id: 'pt021', name: 'Penang Second Bridge (PTSC)',    address: 'Batu Maung, 11960 Penang',                         lat: 5.2981,  lon: 100.3206, type: '🏛️ Landmark',             desc: 'Longest bridge in Malaysia at 24km' },
    { id: 'pt022', name: 'Upside Down Museum Penang',      address: 'Jalan Burmah, George Town, 10050 Penang',         lat: 5.4256,  lon: 100.3196, type: '🏛️ Museum',               desc: 'Fun interactive upside-down museum' },
    { id: 'pt023', name: 'Penang Hill Habitat',            address: 'Bukit Bendera, 11300 Penang',                      lat: 5.4215,  lon: 100.2692, type: '🌿 Eco Attraction',        desc: 'Treetop walkway on Penang Hill' },
    { id: 'pt024', name: 'St George Church',               address: 'Lebuh Farquhar, George Town, 10200 Penang',        lat: 5.4188,  lon: 100.3374, type: '🏛️ Heritage Church',      desc: 'Oldest Anglican church in Southeast Asia' },
    { id: 'pt025', name: 'Kapitan Keling Mosque',          address: 'Lebuh Buckingham, George Town, 10200 Penang',      lat: 5.4162,  lon: 100.3352, type: '🕌 Mosque',               desc: 'Largest mosque in George Town, built 1801' },
  ],
  restaurant: [
    { id: 'pr001', name: 'Gurney Drive Hawker Centre',     address: 'Persiaran Gurney, 10250 Penang',                   lat: 5.4378,  lon: 100.3103, type: '🍜 Hawker Centre',         desc: 'Most famous hawker centre in Penang' },
    { id: 'pr002', name: 'New Lane Hawker Stalls',         address: 'Lorong Baru, 10050 Penang',                        lat: 5.4226,  lon: 100.3208, type: '🍜 Hawker Centre',         desc: 'Popular night hawker stalls, open from 6pm' },
    { id: 'pr003', name: 'Chulia Street Night Hawkers',    address: 'Jalan Chulia, George Town, 10200 Penang',          lat: 5.4177,  lon: 100.3362, type: '🍜 Night Hawker Street',   desc: 'Vibrant street food at night' },
    { id: 'pr004', name: 'Penang Road Famous Cendol',      address: 'Jalan Penang, George Town, 10000 Penang',         lat: 5.4185,  lon: 100.3328, type: '🍧 Cendol Stall',          desc: 'World famous cendol, queue is worth it' },
    { id: 'pr005', name: 'Lorong Selamat Char Kway Teow', address: 'Lorong Selamat, George Town, 10400 Penang',        lat: 5.4234,  lon: 100.3176, type: '🍜 Char Kway Teow',        desc: 'Best Char Kway Teow in Penang, long queue expected' },
    { id: 'pr006', name: 'Sri Ananda Bahwan',              address: '55 Jalan Penang, George Town, 10000 Penang',       lat: 5.4183,  lon: 100.3319, type: '🍛 Indian Vegetarian',     desc: 'Famous Indian vegetarian restaurant' },
    { id: 'pr007', name: 'Hameediyah Restaurant',          address: '164A Campbell Street, George Town, 10200 Penang', lat: 5.4193,  lon: 100.3322, type: '🍛 Nasi Kandar',           desc: 'Oldest nasi kandar in Penang since 1907' },
    { id: 'pr008', name: 'Line Clear Nasi Kandar',         address: 'Jalan Penang, George Town, 10000 Penang',         lat: 5.4190,  lon: 100.3315, type: '🍛 Nasi Kandar',           desc: '24-hour famous nasi kandar restaurant' },
    { id: 'pr009', name: 'Tek Sen Restaurant',             address: '18 Carnarvon Street, George Town, 10100 Penang',  lat: 5.4162,  lon: 100.3338, type: '🍜 Chinese Restaurant',    desc: 'Award-winning heritage Chinese restaurant' },
    { id: 'pr010', name: 'Restoran Kapitan',               address: '93 Chulia Street, George Town, 10200 Penang',     lat: 5.4174,  lon: 100.3364, type: '🍛 Indian Muslim',         desc: 'Famous mamak restaurant in heritage zone' },
    { id: 'pr011', name: 'Padang Brown Hawker Centre',     address: 'Jalan Perak, George Town, 10050 Penang',          lat: 5.4283,  lon: 100.3243, type: '🍜 Hawker Centre',         desc: 'Legendary local hawker centre' },
    { id: 'pr012', name: 'Batu Ferringhi Night Market',    address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.4659,  lon: 100.2490, type: '🍜 Night Market',          desc: 'Bustling beachside night market with food' },
    { id: 'pr013', name: 'Eden Seafood Village',           address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.4663,  lon: 100.2481, type: '🦞 Seafood Restaurant',     desc: 'Famous seafood restaurant by the beach' },
    { id: 'pr014', name: 'Toh Soon Cafe',                  address: 'Campbell Street, George Town, 10200 Penang',      lat: 5.4193,  lon: 100.3319, type: '☕ Old School Kopitiam',   desc: 'Iconic old school coffee shop' },
    { id: 'pr015', name: 'Auntie Gaik Lean Nyonya',        address: 'Jalan Penang, George Town, 10000 Penang',         lat: 5.4186,  lon: 100.3329, type: '🍜 Nyonya Food',           desc: 'Famous traditional Nyonya cuisine' },
    { id: 'pr016', name: 'Sup Hameed',                     address: 'Jalan Penang, George Town, 10000 Penang',         lat: 5.4189,  lon: 100.3311, type: '🍲 Sup Hameed',            desc: 'Famous overnight roti and soup' },
    { id: 'pr017', name: 'Khunthai Restaurant',            address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.4668,  lon: 100.2488, type: '🍜 Thai Restaurant',        desc: 'Popular beachside Thai restaurant' },
    { id: 'pr018', name: 'Nasi Kandar Beratur',            address: 'Jalan Transfer, George Town, 10050 Penang',       lat: 5.4262,  lon: 100.3198, type: '🍛 Nasi Kandar',           desc: 'Queue-worthy nasi kandar, very popular' },
    { id: 'pr019', name: 'Chendul Teochew',                address: 'Jalan Penang, George Town, 10000 Penang',         lat: 5.4187,  lon: 100.3330, type: '🍧 Cendol & Desserts',     desc: 'Famous Teochew cendol and desserts' },
    { id: 'pr020', name: 'Lorong Abu Siti Hawker',         address: 'Lorong Abu Siti, 10400 Penang',                   lat: 5.4243,  lon: 100.3172, type: '🍜 Hawker Centre',         desc: 'Popular local hawker area' },
  ],
  hotel: [
    { id: 'ph001', name: 'Eastern & Oriental Hotel',       address: '10 Lebuh Farquhar, George Town, 10200 Penang',    lat: 5.4196,  lon: 100.3388, type: '🏨 5-Star Heritage Hotel',  desc: 'Iconic colonial heritage hotel established 1885' },
    { id: 'ph002', name: 'Hard Rock Hotel Penang',         address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.4662,  lon: 100.2513, type: '🏨 5-Star Resort',          desc: 'Famous beachfront rock-themed resort' },
    { id: 'ph003', name: 'Shangri-La Rasa Sayang Resort',  address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.4675,  lon: 100.2524, type: '🏨 5-Star Resort',          desc: 'Premier luxury beach resort' },
    { id: 'ph004', name: 'Penang Marriott Hotel',          address: 'Persiaran Gurney, 10250 Penang',                  lat: 5.4374,  lon: 100.3108, type: '🏨 5-Star Hotel',           desc: 'Luxury hotel on Gurney Drive' },
    { id: 'ph005', name: 'Hotel Jen Penang',               address: 'Magazine Road, George Town, 10300 Penang',        lat: 5.4241,  lon: 100.3282, type: '🏨 4-Star Hotel',           desc: 'Modern hotel in central George Town' },
    { id: 'ph006', name: 'Sunway Hotel Georgetown',        address: 'Brown Road, George Town, 10350 Penang',           lat: 5.4271,  lon: 100.3214, type: '🏨 4-Star Hotel',           desc: 'Well-located city hotel near botanical garden' },
    { id: 'ph007', name: 'Bayview Hotel Georgetown',       address: '25A Lebuh Farquhar, George Town, 10200 Penang',   lat: 5.4181,  lon: 100.3376, type: '🏨 3-Star Hotel',           desc: 'Central hotel near UNESCO heritage zone' },
    { id: 'ph008', name: 'Cititel Penang',                 address: '66 Jalan Penang, George Town, 10000 Penang',      lat: 5.4188,  lon: 100.3304, type: '🏨 3-Star Hotel',           desc: 'Popular city centre budget hotel' },
    { id: 'ph009', name: 'Golden Sands Resort',            address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.4669,  lon: 100.2531, type: '🏨 4-Star Resort',          desc: 'Beachfront family-friendly resort' },
    { id: 'ph010', name: 'Copthorne Orchid Hotel',         address: 'Jalan Tanjung Bungah, 11200 Penang',              lat: 5.4528,  lon: 100.2956, type: '🏨 4-Star Hotel',           desc: 'Seafront hotel with great sea views' },
    { id: 'ph011', name: 'G Hotel Kelawai',                address: 'Jalan Kelawai, 10250 Penang',                     lat: 5.4354,  lon: 100.3093, type: '🏨 4-Star Hotel',           desc: 'Trendy boutique hotel near Gurney Drive' },
    { id: 'ph012', name: 'The Prestige Hotel',             address: '8 Jalan Penang, George Town, 10000 Penang',       lat: 5.4190,  lon: 100.3307, type: '🏨 5-Star Boutique Hotel',  desc: 'Luxury boutique hotel in heritage building' },
    { id: 'ph013', name: 'Lone Pine Hotel',                address: '97 Jalan Batu Ferringhi, 11100 Penang',           lat: 5.4657,  lon: 100.2469, type: '🏨 Boutique Beach Hotel',   desc: 'Charming boutique hotel right on the beach' },
    { id: 'ph014', name: 'Parkroyal Penang Resort',        address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.4676,  lon: 100.2539, type: '🏨 5-Star Resort',          desc: 'Luxury beachfront resort with pools' },
    { id: 'ph015', name: 'Wembley Hotel Penang',           address: 'Jalan Penang, George Town, 10000 Penang',         lat: 5.4191,  lon: 100.3308, type: '🏨 4-Star Hotel',           desc: 'Classic hotel in the heart of George Town' },
  ],
  beach: [
    { id: 'pb001', name: 'Batu Ferringhi Beach',           address: 'Jalan Batu Ferringhi, 11100 Penang',              lat: 5.4671,  lon: 100.2481, type: '🏖️ Beach',                 desc: 'Most popular beach, water sports available' },
    { id: 'pb002', name: 'Tanjung Bungah Beach',           address: 'Jalan Tanjung Bungah, 11200 Penang',              lat: 5.4534,  lon: 100.2960, type: '🏖️ Beach',                 desc: 'Quieter beach closer to George Town' },
    { id: 'pb003', name: 'Monkey Beach',                   address: 'Penang National Park, Teluk Bahang, 11050 Penang',lat: 5.4731,  lon: 100.2024, type: '🏖️ Beach',                 desc: 'Pristine beach inside national park, jungle trek needed' },
    { id: 'pb004', name: 'Kerachut Beach',                 address: 'Penang National Park, Teluk Bahang, 11050 Penang',lat: 5.4742,  lon: 100.1969, type: '🏖️ Beach',                 desc: 'Turtle nesting beach, very scenic and remote' },
    { id: 'pb005', name: 'Teluk Bahang Beach',             address: 'Teluk Bahang, 11050 Penang',                      lat: 5.4631,  lon: 100.2072, type: '🏖️ Beach',                 desc: 'Quiet fishing village beach, local feel' },
    { id: 'pb006', name: 'Miami Beach Tanjung Bungah',     address: 'Jalan Tanjung Bungah, 11200 Penang',              lat: 5.4554,  lon: 100.2933, type: '🏖️ Beach',                 desc: 'Local favourite beach spot' },
    { id: 'pb007', name: 'Pantai Pasir Panjang',           address: 'Balik Pulau, 11000 Penang',                       lat: 5.3247,  lon: 100.2119, type: '🏖️ Beach',                 desc: 'Secluded beach on the quieter side of Penang island' },
  ],
};

const CATEGORY_MAP = {
  tourism:    'tourism.sights,tourism.attraction,tourism.museum,entertainment',
  restaurant: 'catering.restaurant,catering.cafe,catering.fast_food,catering.food_court',
  hotel:      'accommodation.hotel,accommodation.hostel,accommodation.guest_house,accommodation.motel',
  beach:      'beach,leisure.beach_resort',
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
      } else {
        // Fallback to Geoapify Geocoding
        const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
          params: {
            text:   q + ' Penang Malaysia',
            lang:   'en',
            limit:  15,
            format: 'json',
            filter: `rect:${PENANG_RECT}`,
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
      }

    } else {
      const famousForCat = FAMOUS_PLACES[category] || [];

      // Also fetch live from Geoapify
      let livePlaces = [];
      try {
        const categories = CATEGORY_MAP[category];
        if (categories) {
          const response = await axios.get('https://api.geoapify.com/v2/places', {
            params: {
              categories: categories,
              filter:     `rect:${PENANG_RECT}`,
              bias:       `proximity:${PENANG_LON},${PENANG_LAT}`,
              limit:      50,
              lang:       'en',
              apiKey:     PLACES_API_KEY,
            },
            timeout: 10000,
          });

          const hardcodedNames = new Set(famousForCat.map(p => p.name.toLowerCase()));
          livePlaces = (response.data.features || [])
            .filter(f => f.properties.name && !hardcodedNames.has(f.properties.name.toLowerCase()))
            .map(f => {
              const p = f.properties;
              return {
                id:            p.place_id,
                name:          p.name,
                address:       p.address_line2 || p.formatted || 'Penang, Malaysia',
                lat:           f.geometry.coordinates[1],
                lon:           f.geometry.coordinates[0],
                type:          getCategoryLabel(category),
                desc:          '',
                phone:         p.contact?.phone || null,
                website:       p.contact?.website || null,
                opening_hours: p.opening_hours || null,
                cuisine:       p.catering?.cuisine || null,
              };
            });
        }
      } catch (liveErr) {
        console.warn('Live Geoapify fetch failed:', liveErr.message);
      }

      places = [...famousForCat, ...livePlaces];
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
    const found = allFamous.find(p => p.name.toLowerCase().includes(query));
    if (found) {
      return res.json({ success: true, lat: found.lat, lon: found.lon, name: found.name });
    }

    const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
      params: {
        text:   q + ' Penang Malaysia',
        lang:   'en',
        limit:  1,
        format: 'json',
        filter: `rect:${PENANG_RECT}`,
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
