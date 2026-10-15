# Chuyển từ JSON sang SQL Server

Ứng dụng đã tách tầng lưu trữ ngay từ đầu, nên việc chuyển sang SQL Server **không cần sửa route hay service**.

```
routes (HTTP + Zod) ──▶ services (nghiệp vụ) ──▶ Repository interfaces (src/data/repositories.ts)
                                                       ├── json/   ← đang dùng
                                                       └── mssql/  ← viết ở giai đoạn 3
```

## Ánh xạ file JSON → bảng

| File `storage/data/*.json` | Bảng SQL Server                          | Ghi chú                                  |
| -------------------------- | ---------------------------------------- | ---------------------------------------- |
| `moods.json`               | `Moods`                                  |                                          |
| `genres.json`              | `Genres`                                 |                                          |
| `artists.json`             | `Artists` + `ArtistGenres`               | `genreIds[]` → bảng nối                  |
| `albums.json`              | `Albums`                                 |                                          |
| `songs.json`               | `Songs`                                  |                                          |
| `lyrics.json`              | `SongLyrics` + `SongLyricLines`          | `lines[]` → bảng con, `time` lưu mili giây |
| `users.json`               | `Users`                                  | `preferences.moodSync` → cột `MoodSync`  |
| `identities.json`          | `UserIdentities`                         | Google / số Zalo gắn với tài khoản       |
| `sessions.json`            | `Sessions`                               | chỉ lưu SHA-256 của token                |
| `otp-challenges.json`      | `OtpChallenges`                          | chỉ lưu HMAC của mã OTP                  |
| `playlists.json`           | `Playlists` + `PlaylistSongs`            | `songIds[]` → bảng nối có `Position`     |
| `favorites.json`           | `Favorites`                              |                                          |
| `saved-albums.json`        | `SavedAlbums`                            |                                          |
| `followed-artists.json`    | `FollowedArtists`                        |                                          |
| `play-history.json`        | `PlayHistory`                            |                                          |

## Các bước

1. Cài driver: `npm install mssql -w server`
2. Tạo database rồi chạy [`schema.sql`](./schema.sql).
3. Viết script import đọc `storage/data/*.json` và `INSERT` vào các bảng trên (thứ tự: Moods, Genres, Artists, ArtistGenres, Albums, Songs, SongLyrics, SongLyricLines, Users, Playlists, PlaylistSongs, Favorites, SavedAlbums, FollowedArtists, PlayHistory).
4. Viết các class trong thư mục này, mỗi class implement một interface trong `../repositories.ts`, ví dụ:

   ```ts
   import sql from 'mssql';
   import type { SongRepository, SongQuery } from '../repositories';

   export class MssqlSongRepository implements SongRepository {
     constructor(private readonly pool: sql.ConnectionPool) {}

     async findById(id: string) {
       const { recordset } = await this.pool.request()
         .input('id', sql.NVarChar(64), id)
         .query('SELECT * FROM dbo.Songs WHERE Id = @id');
       return recordset[0] ? toSongRecord(recordset[0]) : null;
     }

     async incrementPlays(id: string, by = 1) {
       await this.pool.request()
         .input('id', sql.NVarChar(64), id)
         .input('by', sql.Int, by)
         .query('UPDATE dbo.Songs SET Plays = Plays + @by WHERE Id = @id');
     }
     // ... list(), findByIds(), countBy(), statsByAlbum()
   }
   ```

5. Trả về các repository đó trong `createMssqlRepositories()` (file `index.ts`), `close()` gọi `pool.close()`.
6. Cấu hình `.env`:

   ```
   DATA_PROVIDER=mssql
   MSSQL_CONNECTION_STRING=Server=localhost,1433;Database=Nocturne;User Id=sa;Password=...;Encrypt=true;TrustServerCertificate=true
   ```

## Lưu ý khi viết repository SQL

- `findByIds()` phải **giữ đúng thứ tự** của mảng `ids` (dùng cho playlist, lịch sử).
- Tìm kiếm không dấu: dùng collation `Vietnamese_CI_AI` (ví dụ `WHERE Title COLLATE Vietnamese_CI_AI LIKE @q`) hoặc Full-Text Search.
- `PlaylistRepository.update({ songIds })` nên chạy trong transaction: xoá `PlaylistSongs` cũ rồi chèn lại theo `Position`.
- `LyricsRepository.search()` có thể dùng `WHERE Text COLLATE Vietnamese_CI_AI LIKE @q` trên `SongLyricLines`, lấy dòng có `LineIndex` nhỏ nhất của mỗi bài.
- `HistoryRepository.add(entry, maxPerUser)` có thể bỏ qua giới hạn số dòng (SQL không cần cắt bớt như file JSON).
