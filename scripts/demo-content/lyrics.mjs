/**
 * Lời bài hát demo — sáng tác gốc cho các bài hát hư cấu trong catalog.mjs.
 *
 * Mỗi bài gồm các đoạn: verse (+ verse2), chorus, bridge (tuỳ chọn).
 * generate.mjs tự canh thời gian từng dòng theo cấu trúc bài nhạc đã tổng hợp:
 *   đoạn A → verse, đoạn B (có giai điệu chính) → chorus, đoạn break → bridge, intro/outro → khoảng nhạc.
 * `instrumental: true` = bản nhạc không lời.
 */
export const lyrics = {
  /* ------------------------------ Vera Lux ------------------------------ */
  'glass-hours': {
    language: 'en',
    verse: [
      'Rain writes letters on the window glass',
      'Neon bleeding into puddles as I pass',
      'Every clock in Lisbon whispers half past two',
      'And every empty street is leading back to you',
    ],
    verse2: [
      'Trams asleep beneath a violet sky',
      "Shop signs flicker like they're learning how to lie",
      'I keep the radio low, I keep the window wide',
      'Counting all the colours that the city hides',
    ],
    chorus: ['We live in glass hours', 'Fragile and bright', 'Hold me before the morning', 'Breaks through the night'],
    bridge: ['If the dawn comes knocking', 'Let it wait outside'],
  },
  'neon-umbrella': {
    language: 'en',
    verse: [
      'Pink umbrella, running down the stairs',
      'Thunder laughing, but nobody cares',
      'Shoes are soaking, heart is beating loud',
      'Dancing like a spark inside the crowd',
    ],
    verse2: [
      'Taxi headlights paint us gold and blue',
      'Every puddle is a mirror made for two',
      'Let the weather try to slow us down',
      "We're the only summer left in town",
    ],
    chorus: [
      'Neon umbrella, spin me around',
      'Light up the rain till it falls without a sound',
      "Neon umbrella, don't let me go",
      "We're the brightest thing this city knows",
    ],
  },
  'tram-28': {
    language: 'en',
    verse: [
      'Yellow carriage climbing up the hill',
      'Sunlight resting on the windowsill',
      "Old men reading yesterday's news",
      "I've got nowhere I would rather lose",
    ],
    verse2: [
      'Bells are ringing round the narrow bend',
      'Every corner feels like an old friend',
      'Laundry waving from the balconies',
      'Slow as the river, easy as the breeze',
    ],
    chorus: ['Ride with me on twenty-eight', "There's no hurry, no one's late", 'Let the city roll on by', 'Underneath a paper sky'],
  },
  'paper-moons': {
    language: 'en',
    verse: [
      "I cut a moon from yesterday's page",
      'Hung it up above an empty stage',
      'Glitter falling from a ribbon star',
      'Shining softly anywhere you are',
    ],
    verse2: [
      'Silver rivers and a cotton cloud',
      "Whisper softly or we'll wake the crowd",
      'Every shadow is a friendly ghost',
      'Dreaming is the thing I trust the most',
    ],
    chorus: ['Paper moons, paper skies', 'Folded wishes in your eyes', "Even if it's borrowed light", 'Let it glow tonight'],
  },
  'blue-before-day': {
    language: 'en',
    verse: [
      "There's a colour just before the light",
      'Not quite morning, not quite night',
      "I've been sitting with it on my own",
      'Learning how to let you go',
    ],
    verse2: [
      'Coffee cooling on the kitchen chair',
      'Your old jacket still hanging there',
      "Every bird is singing someone's name",
      'None of them will sound the same',
    ],
    chorus: ['Blue before day', 'Stay a little while', 'Blue before day', 'Before I learn to smile'],
  },
  'honey-static': {
    language: 'en',
    verse: [
      'Your voice like honey through the static',
      'A station only I can find',
      'Turn the dial, the room goes golden',
      'Sweet interference on my mind',
    ],
    verse2: [
      'Old receiver humming on the table',
      'Lamplight melting into gold',
      'Every word you say is half a secret',
      'Every secret never told',
    ],
    chorus: ['Honey static, stay with me', 'Crackle soft and warm', "Even when the signal's weak", 'You still keep me from the storm'],
  },
  'last-train-home': {
    language: 'en',
    verse: [
      'Platform lights are fading one by one',
      'The last guitar has packed away its song',
      "I've got a ticket and a tired heart",
      'And half a city keeping us apart',
    ],
    verse2: [
      'Window seat, my reflection in the dark',
      'Passing stations like an unlit spark',
      "Somebody's laughing two carriages down",
      'I close my eyes and listen for the sound',
    ],
    chorus: ['Last train home', 'Carry me slow', 'Through the sleeping towns', 'Where the river glows'],
    bridge: ["Wake me when we're near", "Wake me when you're here"],
  },
  afterglow: {
    language: 'en',
    verse: [
      'Sun goes down in a slow parade',
      'Painting gold on the things we made',
      'You and me on the harbour wall',
      'Watching evening begin to fall',
    ],
    verse2: [
      'Seagulls drawing circles in the air',
      'Salt and summer tangled in your hair',
      'Every colour softer than before',
      'Waves keep asking, we keep wanting more',
    ],
    chorus: ['In the afterglow', 'Everything feels slow', 'Hold on to the light', 'Just a little more tonight'],
  },

  /* ------------------------------ Lam Phong ----------------------------- */
  'mua-pho-cu': {
    language: 'vi',
    verse: ['Mưa rơi trên mái ngói rêu phong', 'Phố cũ im lìm giữa chiều đông', 'Tách trà nguội dần bên ô cửa', 'Nghe lòng mình khẽ gọi tên ai'],
    verse2: ['Hàng sấu lặng thầm ướt vai áo', 'Chuông xe đạp vọng cuối con đường', 'Ta đi qua nhau như hai vệt nước', 'Loang trên kính rồi tan vào sương'],
    chorus: ['Mưa phố cũ, mưa phố cũ', 'Rơi cho ai những câu chưa nói', 'Mưa phố cũ, mưa phố cũ', 'Giữ giùm tôi một chút bồi hồi'],
  },
  'ca-phe-sang': {
    language: 'vi',
    verse: ['Sáng nay nắng khẽ đậu bên hiên', 'Phin cà phê nhỏ giọt bình yên', 'Tiếng rao xa xa ngoài ngõ nhỏ', 'Một ngày mới bắt đầu thật hiền'],
    verse2: ['Ly cà phê đen thêm chút đường', 'Bánh mì nóng giòn thơm cả phường', 'Chẳng cần vội vã đi đâu cả', 'Cứ để thời gian trôi dịu dàng'],
    chorus: ['Cà phê sáng, ngồi bên nhau', 'Kể chuyện hôm qua chẳng cần lâu', 'Cà phê sáng, nắng vàng ươm', 'Lòng nhẹ như mây trên phố phường'],
  },
  'ho-guom-5am': { language: 'vi', instrumental: true },
  'gac-mai': {
    language: 'vi',
    verse: ['Gác mái nhỏ chênh vênh trên phố', 'Đèn vàng soi những trang thư cũ', 'Thành phố ngủ, chỉ còn tiếng gió', 'Và đôi ta thức cùng ánh trăng'],
    verse2: ['Mái tôn khẽ hát lời mưa đêm', 'Chăn len ấm, tiếng đàn êm đềm', 'Ngoài kia xa những ô cửa tắt', 'Chỉ còn ta với những ước mơ'],
    chorus: ['Trên gác mái, ta đếm sao', 'Gửi theo gió những lời thì thào', 'Trên gác mái, đêm thật dài', 'Mình cứ thức, chẳng cần ngày mai'],
  },

  /* ------------------------------ Neon Koi ------------------------------ */
  'midnight-arcade': {
    language: 'en',
    verse: [
      'Coin in the slot and the screen comes alive',
      "Pixel horizon, we're ready to drive",
      'High score glowing in electric blue',
      'Player two, I was waiting for you',
    ],
    verse2: [
      'Joystick shaking and the music is loud',
      "We're the heroes of a digital crowd",
      'Neon dragons on a chrome highway',
      'Hit continue, we were born to play',
    ],
    chorus: [
      'Midnight arcade, lights in our eyes',
      'Racing the dark till the morning arrives',
      'Midnight arcade, never game over',
      'One more level, come a little closer',
    ],
  },
  'chrome-hearts': {
    language: 'en',
    verse: ['Streetlights humming on the overpass', 'Your reflection on the window glass', 'Engines purring like a lullaby', 'Chrome and starlight in your eyes'],
    verse2: [
      'Radio static and a midnight call',
      'Tunnel lights are dancing on the wall',
      "Nothing's real except the road ahead",
      'And every word you never said',
    ],
    chorus: [
      'Chrome hearts, beating in the dark',
      'Cold outside but warm inside the spark',
      'Chrome hearts, made to shine',
      'Drive with me till the end of the line',
    ],
  },
  overdrive: {
    language: 'en',
    verse: [
      'Feel the bass line pulling at the floor',
      'Heartbeat racing, can you take some more',
      'Lights are flashing like a falling star',
      'Push it faster, show me who you are',
    ],
    chorus: ['Overdrive, overdrive', 'Turn it up and come alive', 'Overdrive, overdrive', "We're the night, we're the ride"],
  },
  'pixel-rain': { language: 'en', instrumental: true },

  /* ------------------------------ Mira Sol ------------------------------ */
  'velvet-sunday': {
    language: 'vi',
    verse: ['Chủ nhật trôi chậm như nhung', 'Rèm cửa bay, nắng vương mái tóc', 'Đĩa than cũ hát bài ta thích', 'Em chẳng muốn đi đâu hết'],
    verse2: ['Trà gừng ấm trong tay đôi mình', 'Sách mở dở trang còn đang đọc', 'Thành phố ngoài kia cứ vội vã', 'Còn ta ở lại với giai điệu'],
    chorus: ['Velvet Sunday, ở lại đây', 'Ôm nhau giữa những phút giây này', 'Velvet Sunday, chẳng cần lo', 'Mọi điều khác cứ để ngày mai'],
  },
  'slow-bloom': {
    language: 'vi',
    verse: ['Có những đoá hoa nở muộn màng', 'Chẳng vội đâu, cứ thong thả sang', 'Như tình mình lớn lên từng chút', 'Trong nắng chiều dịu dàng'],
    verse2: ['Mưa có rơi, gió có về', 'Rễ vẫn bám sâu dưới bờ đê', 'Một ngày kia khi em nhìn lại', 'Cả khu vườn đã xanh'],
    chorus: ['Nở chậm thôi, nở chậm thôi', 'Từng cánh hoa mở ra trong đời', 'Nở chậm thôi, đừng vội vàng', 'Vì yêu thương cần thời gian'],
  },
  'golden-hour': {
    language: 'vi',
    verse: ['Sài Gòn năm giờ chiều', 'Nắng vàng rót lên vai áo', 'Xe qua cầu, gió mang hương sông', 'Ta cười như chưa từng biết buồn'],
    verse2: ['Ly đá chanh trên vỉa hè', 'Tiếng ai ngân nga câu hát nhỏ', 'Một ngày dài rồi cũng qua', 'Chỉ cần có nhau là đủ'],
    chorus: ['Giờ vàng ơi, xin chậm lại', 'Cho ta giữ ánh mắt ai', 'Giờ vàng ơi, đừng tắt vội', 'Để tim này còn mãi đầy'],
  },

  /* ----------------------------- Ocean Atlas ---------------------------- */
  'northern-drift': { language: 'en', instrumental: true },
  'glacier-light': { language: 'en', instrumental: true },
  'low-tide': { language: 'en', instrumental: true },
};
