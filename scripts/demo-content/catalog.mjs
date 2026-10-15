/**
 * Danh mục nội dung demo.
 * Mọi bài hát đều được TỰ TỔNG HỢP bằng code (xem synth.mjs) nên không vướng bản quyền.
 * Trường `music` mô tả cách "sáng tác": phong cách, nhịp độ, giọng, vòng hợp âm...
 */

export const moods = [
  { id: 'late-night', name: 'Đêm muộn', color: '#5cc8f0', description: 'Cho những giờ thức khuya, khi phố đã lên đèn và mọi thứ chậm lại.' },
  { id: 'dreamy', name: 'Mơ màng', color: '#f28cc0', description: 'Lơ lửng, mềm mại, như đang trôi giữa những tầng mây.' },
  { id: 'calm', name: 'Bình yên', color: '#5fd6a0', description: 'Thở chậm lại. Những giai điệu nhẹ nhàng để thư giãn.' },
  { id: 'melancholy', name: 'Sầu lắng', color: '#8fa6ff', description: 'Một chút buồn, một chút nhớ — vừa đủ để thấy mình.' },
  { id: 'energised', name: 'Sôi động', color: '#ffb35c', description: 'Nhịp nhanh, năng lượng cao cho buổi sáng hay lúc vận động.' },
  { id: 'soulful', name: 'Ấm áp', color: '#f5a48a', description: 'Âm thanh mộc, ấm và gần gũi như một chiều Chủ nhật.' },
  { id: 'focus', name: 'Tập trung', color: '#b9a3ff', description: 'Đều đặn, ít lời — giúp bạn làm việc và học tập sâu hơn.' },
];

export const genres = [
  { id: 'dream-pop', name: 'Dream Pop', color: '#f28cc0', description: 'Synth mềm, reverb dày và giai điệu bồng bềnh.' },
  { id: 'lofi', name: 'Lo-fi', color: '#e9b07a', description: 'Nhịp trống lười biếng, tiếng đĩa than và hợp âm jazz.' },
  { id: 'synthwave', name: 'Synthwave', color: '#ff5fa2', description: 'Âm thanh thập niên 80, đèn neon và những chuyến xe đêm.' },
  { id: 'neo-soul', name: 'Neo Soul', color: '#f5a48a', description: 'Hợp âm ấm, groove thả lỏng và cảm xúc mộc mạc.' },
  { id: 'ambient', name: 'Ambient', color: '#6fc3df', description: 'Không gian rộng, âm thanh trôi chậm như mặt biển.' },
];

export const artists = [
  {
    id: 'vera-lux',
    name: 'Vera Lux',
    location: 'Lisbon, Bồ Đào Nha',
    bio: 'Dream-pop từ Lisbon. Synth mềm, phố mưa và những bài hát được viết trong khoảng từ 2 đến 5 giờ sáng.',
    genreIds: ['dream-pop'],
    monthlyListeners: 1284000,
    art: { hair: 'long', rim: ['#ff4fa0', '#5cc8f0'], bokeh: ['#ffb35c', '#ff4fa0', '#ffd9a0', '#5cc8f0'], bg: ['#140d22', '#3a1631'] },
  },
  {
    id: 'lam-phong',
    name: 'Lam Phong',
    location: 'Hà Nội, Việt Nam',
    bio: 'Producer lo-fi người Hà Nội. Nhạc của Phong là tiếng mưa trên mái tôn, cà phê sáng và những con phố cũ.',
    genreIds: ['lofi'],
    monthlyListeners: 642000,
    art: { hair: 'headphones', rim: ['#ffb35c', '#8fa6ff'], bokeh: ['#ffcf7a', '#ff9f5a', '#8fa6ff'], bg: ['#141526', '#3b2a2a'] },
  },
  {
    id: 'neon-koi',
    name: 'Neon Koi',
    location: 'Tokyo, Nhật Bản',
    bio: 'Bộ đôi synthwave mang âm thanh thập niên 80 vào những chuyến xe đêm xuyên qua thành phố đèn neon.',
    genreIds: ['synthwave'],
    monthlyListeners: 932000,
    art: { hair: 'duo', rim: ['#ff2fb3', '#3ff0ff'], bokeh: ['#ff2fb3', '#7a5cff', '#3ff0ff'], bg: ['#0c0620', '#2a0d3d'] },
  },
  {
    id: 'mira-sol',
    name: 'Mira Sol',
    location: 'Sài Gòn, Việt Nam',
    bio: 'Giọng neo-soul ấm áp với những hợp âm jazz mộc và nhịp trống thả lỏng của buổi chiều Chủ nhật.',
    genreIds: ['neo-soul'],
    monthlyListeners: 418000,
    art: { hair: 'curly', rim: ['#ffc86b', '#ff7e6b'], bokeh: ['#ffc86b', '#ff7e6b', '#ffe3b0'], bg: ['#1f0f14', '#4a2318'] },
  },
  {
    id: 'ocean-atlas',
    name: 'Ocean Atlas',
    location: 'Reykjavík, Iceland',
    bio: 'Dự án ambient lấy cảm hứng từ biển Bắc, băng tuyết và ánh cực quang.',
    genreIds: ['ambient'],
    monthlyListeners: 276000,
    art: { hair: 'beanie', rim: ['#5fd6a0', '#6fc3df'], bokeh: ['#5fd6a0', '#6fc3df', '#b9a3ff'], bg: ['#06131f', '#0d2e3b'] },
  },
];

export const albums = [
  {
    id: 'glass-hours',
    title: 'Glass Hours',
    type: 'album',
    artistId: 'vera-lux',
    releaseDate: '2026-03-13',
    genreId: 'dream-pop',
    moodId: 'late-night',
    description: 'Bảy bài hát về những thành phố ướt mưa, ánh đèn neon nhòe trên kính và chuyến tàu cuối cùng về nhà.',
    art: { theme: 'city-rain', palette: ['#5cc8f0', '#ff4fa0', '#ffb35c', '#a78bfa'] },
    songs: [
      { id: 'glass-hours', title: 'Glass Hours', moodId: 'late-night', music: { style: 'dreampop', bpm: 84, key: 'A', scale: 'minor', progression: [0, 5, 2, 6], targetSec: 100, energy: 0.55, rain: true } },
      { id: 'neon-umbrella', title: 'Neon Umbrella', moodId: 'energised', music: { style: 'dreampop', bpm: 112, key: 'D', scale: 'major', progression: [0, 4, 5, 3], targetSec: 92, energy: 0.9 } },
      { id: 'tram-28', title: 'Tram 28', moodId: 'calm', music: { style: 'dreampop', bpm: 76, key: 'F', scale: 'major', progression: [0, 3, 5, 4], targetSec: 98, energy: 0.35 } },
      { id: 'paper-moons', title: 'Paper Moons', moodId: 'dreamy', music: { style: 'dreampop', bpm: 88, key: 'E', scale: 'major', progression: [3, 0, 4, 5], targetSec: 96, energy: 0.5 } },
      { id: 'blue-before-day', title: 'Blue Before Day', moodId: 'melancholy', music: { style: 'dreampop', bpm: 70, key: 'C#', scale: 'minor', progression: [0, 3, 5, 4], targetSec: 104, energy: 0.3, rain: true } },
      { id: 'honey-static', title: 'Honey Static', moodId: 'soulful', music: { style: 'neosoul', bpm: 92, key: 'Bb', scale: 'major', progression: [1, 4, 0, 5], targetSec: 94, energy: 0.6 } },
      { id: 'last-train-home', title: 'Last Train Home', moodId: 'late-night', music: { style: 'dreampop', bpm: 80, key: 'G', scale: 'minor', progression: [0, 6, 5, 6], targetSec: 108, energy: 0.45, rain: true } },
    ],
  },
  {
    id: 'mua-pho-cu',
    title: 'Mưa Phố Cũ',
    type: 'album',
    artistId: 'lam-phong',
    releaseDate: '2025-11-20',
    genreId: 'lofi',
    moodId: 'calm',
    description: 'Bốn bản lo-fi cho những ngày Hà Nội mưa phùn — nghe khi pha cà phê, đọc sách hay chỉ ngồi nhìn mái nhà.',
    art: { theme: 'rooftops', palette: ['#ffcf7a', '#ff9f5a', '#8fa6ff', '#e8a87c'] },
    songs: [
      { id: 'mua-pho-cu', title: 'Mưa Phố Cũ', moodId: 'melancholy', music: { style: 'lofi', bpm: 74, key: 'F', scale: 'dorian', progression: [0, 3, 6, 2], targetSec: 100, rain: true } },
      { id: 'ca-phe-sang', title: 'Cà Phê Sáng', moodId: 'calm', music: { style: 'lofi', bpm: 84, key: 'Eb', scale: 'major', progression: [1, 4, 0, 5], targetSec: 94 } },
      { id: 'ho-guom-5am', title: 'Hồ Gươm 5AM', moodId: 'focus', music: { style: 'lofi', bpm: 70, key: 'G', scale: 'major', progression: [3, 2, 1, 0], targetSec: 104, noLead: true } },
      { id: 'gac-mai', title: 'Gác Mái', moodId: 'late-night', music: { style: 'lofi', bpm: 78, key: 'C', scale: 'minor', progression: [0, 5, 3, 4], targetSec: 98 } },
    ],
  },
  {
    id: 'midnight-arcade',
    title: 'Midnight Arcade',
    type: 'album',
    artistId: 'neon-koi',
    releaseDate: '2026-06-05',
    genreId: 'synthwave',
    moodId: 'energised',
    description: 'Đèn neon, đường cao tốc vắng và những trò chơi điện tử lúc nửa đêm.',
    art: { theme: 'grid-sun', palette: ['#ff2fb3', '#ffd319', '#3ff0ff', '#7a5cff'] },
    songs: [
      { id: 'midnight-arcade', title: 'Midnight Arcade', moodId: 'energised', music: { style: 'synthwave', bpm: 108, key: 'E', scale: 'minor', progression: [0, 5, 2, 6], targetSec: 96 } },
      { id: 'chrome-hearts', title: 'Chrome Hearts', moodId: 'late-night', music: { style: 'synthwave', bpm: 98, key: 'F#', scale: 'minor', progression: [0, 3, 5, 6], targetSec: 100 } },
      { id: 'overdrive', title: 'Overdrive', moodId: 'energised', music: { style: 'synthwave', bpm: 118, key: 'A', scale: 'minor', progression: [5, 6, 0, 0], targetSec: 90, fourOnFloor: true, energy: 1 } },
      { id: 'pixel-rain', title: 'Pixel Rain', moodId: 'focus', music: { style: 'synthwave', bpm: 104, key: 'D', scale: 'minor', progression: [0, 6, 5, 4], targetSec: 98, noLead: true } },
    ],
  },
  {
    id: 'velvet-sunday',
    title: 'Velvet Sunday',
    type: 'album',
    artistId: 'mira-sol',
    releaseDate: '2026-08-22',
    genreId: 'neo-soul',
    moodId: 'soulful',
    description: 'Ánh nắng chiều xuyên qua rèm cửa, một tách trà và những hợp âm chẳng vội vàng.',
    art: { theme: 'bloom', palette: ['#ffc86b', '#ff7e6b', '#c2477a', '#ffe3b0'] },
    songs: [
      { id: 'velvet-sunday', title: 'Velvet Sunday', moodId: 'soulful', music: { style: 'neosoul', bpm: 82, key: 'Ab', scale: 'major', progression: [3, 2, 1, 0], targetSec: 100 } },
      { id: 'slow-bloom', title: 'Slow Bloom', moodId: 'dreamy', music: { style: 'neosoul', bpm: 74, key: 'Db', scale: 'major', progression: [1, 4, 0, 5], targetSec: 104 } },
      { id: 'golden-hour', title: 'Golden Hour', moodId: 'soulful', music: { style: 'neosoul', bpm: 90, key: 'B', scale: 'dorian', progression: [0, 3, 0, 3], targetSec: 92 } },
    ],
  },
  {
    id: 'tidal-atlas',
    title: 'Tidal Atlas',
    type: 'ep',
    artistId: 'ocean-atlas',
    releaseDate: '2025-09-01',
    genreId: 'ambient',
    moodId: 'calm',
    description: 'Ba bản ambient được ghi lại trong những đêm dài ở biển Bắc.',
    art: { theme: 'ocean', palette: ['#5fd6a0', '#6fc3df', '#b9a3ff', '#1f6f8b'] },
    songs: [
      { id: 'northern-drift', title: 'Northern Drift', moodId: 'calm', music: { style: 'ambient', bpm: 60, key: 'D', scale: 'major', progression: [0, 3, 5, 4], chordBars: 2, targetSec: 110, surf: true } },
      { id: 'glacier-light', title: 'Glacier Light', moodId: 'focus', music: { style: 'ambient', bpm: 64, key: 'E', scale: 'lydian', progression: [0, 1, 0, 1], chordBars: 2, targetSec: 110 } },
      { id: 'low-tide', title: 'Low Tide', moodId: 'melancholy', music: { style: 'ambient', bpm: 58, key: 'B', scale: 'minor', progression: [0, 5, 3, 4], chordBars: 2, targetSec: 110, surf: true } },
    ],
  },
  {
    id: 'afterglow',
    title: 'Afterglow',
    type: 'single',
    artistId: 'vera-lux',
    releaseDate: '2026-09-26',
    genreId: 'dream-pop',
    moodId: 'dreamy',
    description: 'Đĩa đơn mới nhất của Vera Lux — khoảnh khắc ánh hoàng hôn còn vương lại trên mặt nước.',
    art: { theme: 'moon', palette: ['#ffb38a', '#f28cc0', '#9b7fe0', '#3b3a8f'] },
    songs: [
      { id: 'afterglow', title: 'Afterglow', moodId: 'dreamy', music: { style: 'dreampop', bpm: 96, key: 'B', scale: 'major', progression: [0, 5, 3, 4], targetSec: 96, energy: 0.7 } },
    ],
  },
];

/** Playlist biên tập (do hệ thống tạo, ownerId = null). */
export const editorialPlaylists = [
  {
    id: 'dem-khong-ngu',
    name: 'Đêm không ngủ',
    description: 'Khi thành phố đã ngủ còn bạn thì chưa.',
    moodId: 'late-night',
    songIds: ['glass-hours', 'chrome-hearts', 'gac-mai', 'last-train-home', 'blue-before-day', 'low-tide'],
  },
  {
    id: 'ca-phe-va-mua',
    name: 'Cà phê & mưa',
    description: 'Lo-fi và những giai điệu chậm cho ngày mưa.',
    moodId: 'calm',
    songIds: ['mua-pho-cu', 'ca-phe-sang', 'tram-28', 'velvet-sunday', 'northern-drift', 'gac-mai'],
  },
  {
    id: 'tap-trung-sau',
    name: 'Tập trung sâu',
    description: 'Ít lời, đều nhịp — để bạn chìm vào công việc.',
    moodId: 'focus',
    songIds: ['ho-guom-5am', 'pixel-rain', 'glacier-light', 'northern-drift', 'ca-phe-sang'],
  },
  {
    id: 'nang-luong-buoi-sang',
    name: 'Năng lượng buổi sáng',
    description: 'Bật lên và bắt đầu một ngày thật tươi.',
    moodId: 'energised',
    songIds: ['overdrive', 'neon-umbrella', 'midnight-arcade', 'afterglow', 'golden-hour'],
  },
  {
    id: 'mo-giua-ban-ngay',
    name: 'Mơ giữa ban ngày',
    description: 'Bồng bềnh, mềm mại và một chút lãng mạn.',
    moodId: 'dreamy',
    songIds: ['paper-moons', 'afterglow', 'slow-bloom', 'honey-static', 'glass-hours'],
  },
];
