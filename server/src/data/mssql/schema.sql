/*
  Nocturne — lược đồ Microsoft SQL Server (giai đoạn 3).
  Mỗi bảng tương ứng một file trong server/storage/data/*.json (xem README.md cùng thư mục).
*/

CREATE TABLE dbo.Moods (
  Id          NVARCHAR(64)  NOT NULL PRIMARY KEY,
  Name        NVARCHAR(100) NOT NULL,
  Color       CHAR(7)       NOT NULL,
  Description NVARCHAR(500) NOT NULL CONSTRAINT DF_Moods_Description DEFAULT N'',
  SortOrder   INT           NOT NULL CONSTRAINT DF_Moods_SortOrder DEFAULT 0,
  CoverPath   NVARCHAR(400) NULL
);

CREATE TABLE dbo.Genres (
  Id          NVARCHAR(64)  NOT NULL PRIMARY KEY,
  Name        NVARCHAR(100) NOT NULL,
  Color       CHAR(7)       NOT NULL,
  Description NVARCHAR(500) NOT NULL CONSTRAINT DF_Genres_Description DEFAULT N'',
  SortOrder   INT           NOT NULL CONSTRAINT DF_Genres_SortOrder DEFAULT 0,
  CoverPath   NVARCHAR(400) NULL
);

CREATE TABLE dbo.Artists (
  Id               NVARCHAR(64)   NOT NULL PRIMARY KEY,
  Name             NVARCHAR(200)  NOT NULL,
  Bio              NVARCHAR(2000) NOT NULL CONSTRAINT DF_Artists_Bio DEFAULT N'',
  Location         NVARCHAR(200)  NOT NULL CONSTRAINT DF_Artists_Location DEFAULT N'',
  ImagePath        NVARCHAR(400)  NOT NULL,
  MonthlyListeners INT            NOT NULL CONSTRAINT DF_Artists_Listeners DEFAULT 0,
  CreatedAt        DATETIME2(3)   NOT NULL CONSTRAINT DF_Artists_CreatedAt DEFAULT SYSUTCDATETIME()
);

/* artists.json → genreIds[] */
CREATE TABLE dbo.ArtistGenres (
  ArtistId NVARCHAR(64) NOT NULL REFERENCES dbo.Artists(Id) ON DELETE CASCADE,
  GenreId  NVARCHAR(64) NOT NULL REFERENCES dbo.Genres(Id),
  CONSTRAINT PK_ArtistGenres PRIMARY KEY (ArtistId, GenreId)
);

CREATE TABLE dbo.Albums (
  Id          NVARCHAR(64)   NOT NULL PRIMARY KEY,
  Title       NVARCHAR(200)  NOT NULL,
  Type        NVARCHAR(10)   NOT NULL CONSTRAINT CK_Albums_Type CHECK (Type IN (N'album', N'ep', N'single')),
  ArtistId    NVARCHAR(64)   NOT NULL REFERENCES dbo.Artists(Id),
  ReleaseDate DATE           NOT NULL,
  GenreId     NVARCHAR(64)   NOT NULL REFERENCES dbo.Genres(Id),
  MoodId      NVARCHAR(64)   NOT NULL REFERENCES dbo.Moods(Id),
  CoverPath   NVARCHAR(400)  NOT NULL,
  Description NVARCHAR(2000) NOT NULL CONSTRAINT DF_Albums_Description DEFAULT N'',
  CreatedAt   DATETIME2(3)   NOT NULL CONSTRAINT DF_Albums_CreatedAt DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_Albums_ArtistId ON dbo.Albums(ArtistId);
CREATE INDEX IX_Albums_ReleaseDate ON dbo.Albums(ReleaseDate DESC);

CREATE TABLE dbo.Songs (
  Id          NVARCHAR(64)  NOT NULL PRIMARY KEY,
  Title       NVARCHAR(200) NOT NULL,
  ArtistId    NVARCHAR(64)  NOT NULL REFERENCES dbo.Artists(Id),
  AlbumId     NVARCHAR(64)  NOT NULL REFERENCES dbo.Albums(Id),
  TrackNumber INT           NOT NULL,
  DurationSec INT           NOT NULL,
  AudioPath   NVARCHAR(400) NOT NULL,
  MoodId      NVARCHAR(64)  NOT NULL REFERENCES dbo.Moods(Id),
  GenreId     NVARCHAR(64)  NOT NULL REFERENCES dbo.Genres(Id),
  Plays       BIGINT        NOT NULL CONSTRAINT DF_Songs_Plays DEFAULT 0,
  ReleaseDate DATE          NOT NULL,
  CreatedAt   DATETIME2(3)  NOT NULL CONSTRAINT DF_Songs_CreatedAt DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_Songs_AlbumId ON dbo.Songs(AlbumId, TrackNumber);
CREATE INDEX IX_Songs_ArtistId ON dbo.Songs(ArtistId);
CREATE INDEX IX_Songs_MoodId ON dbo.Songs(MoodId);
CREATE INDEX IX_Songs_GenreId ON dbo.Songs(GenreId);
CREATE INDEX IX_Songs_Plays ON dbo.Songs(Plays DESC);

/* lyrics.json → mỗi bài một dòng SongLyrics + các dòng lời trong SongLyricLines */
CREATE TABLE dbo.SongLyrics (
  SongId         NVARCHAR(64)  NOT NULL PRIMARY KEY REFERENCES dbo.Songs(Id) ON DELETE CASCADE,
  Language       NVARCHAR(10)  NOT NULL,
  IsSynced       BIT           NOT NULL CONSTRAINT DF_SongLyrics_IsSynced DEFAULT 1,
  IsInstrumental BIT           NOT NULL CONSTRAINT DF_SongLyrics_IsInstrumental DEFAULT 0,
  Writers        NVARCHAR(400) NOT NULL CONSTRAINT DF_SongLyrics_Writers DEFAULT N'',  -- phân tách bằng dấu phẩy
  UpdatedAt      DATETIME2(3)  NOT NULL CONSTRAINT DF_SongLyrics_UpdatedAt DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.SongLyricLines (
  SongId    NVARCHAR(64)  NOT NULL REFERENCES dbo.SongLyrics(SongId) ON DELETE CASCADE,
  LineIndex INT           NOT NULL,
  TimeMs    INT           NOT NULL,          -- lines[].time × 1000
  Text      NVARCHAR(500) NOT NULL,          -- chuỗi rỗng = đoạn nhạc không lời
  CONSTRAINT PK_SongLyricLines PRIMARY KEY (SongId, LineIndex)
);

/* Khách (guest) và thành viên. Các cột Email/PasswordHash/Role dành cho đăng nhập & phân quyền ở giai đoạn 3. */
CREATE TABLE dbo.Users (
  Id           NVARCHAR(64)  NOT NULL PRIMARY KEY,
  Kind         NVARCHAR(10)  NOT NULL CONSTRAINT CK_Users_Kind CHECK (Kind IN (N'guest', N'member')),
  DisplayName  NVARCHAR(100) NOT NULL,
  AvatarUrl    NVARCHAR(500) NULL,
  MoodSync     BIT           NOT NULL CONSTRAINT DF_Users_MoodSync DEFAULT 1,
  Email        NVARCHAR(256) NULL,
  PasswordHash NVARCHAR(500) NULL,
  Role         NVARCHAR(20)  NOT NULL CONSTRAINT DF_Users_Role DEFAULT N'user',
  CreatedAt    DATETIME2(3)  NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
  LastSeenAt   DATETIME2(3)  NOT NULL CONSTRAINT DF_Users_LastSeenAt DEFAULT SYSUTCDATETIME()
);
CREATE UNIQUE INDEX UX_Users_Email ON dbo.Users(Email) WHERE Email IS NOT NULL;

/* identities.json — mỗi cách đăng nhập (Google / số điện thoại Zalo) gắn với một tài khoản */
CREATE TABLE dbo.UserIdentities (
  Id             NVARCHAR(64)  NOT NULL PRIMARY KEY,
  UserId         NVARCHAR(64)  NOT NULL REFERENCES dbo.Users(Id) ON DELETE CASCADE,
  Provider       NVARCHAR(16)  NOT NULL CONSTRAINT CK_UserIdentities_Provider CHECK (Provider IN (N'google', N'zalo')),
  ProviderUserId NVARCHAR(128) NOT NULL,   -- Google: sub · Zalo: 84xxxxxxxxx
  Email          NVARCHAR(256) NULL,
  CreatedAt      DATETIME2(3)  NOT NULL CONSTRAINT DF_UserIdentities_CreatedAt DEFAULT SYSUTCDATETIME(),
  LastLoginAt    DATETIME2(3)  NOT NULL CONSTRAINT DF_UserIdentities_LastLoginAt DEFAULT SYSUTCDATETIME()
);
CREATE UNIQUE INDEX UX_UserIdentities_Provider ON dbo.UserIdentities(Provider, ProviderUserId);
CREATE INDEX IX_UserIdentities_UserId ON dbo.UserIdentities(UserId);

/* sessions.json — chỉ lưu SHA-256 của token */
CREATE TABLE dbo.Sessions (
  Id         NVARCHAR(64)  NOT NULL PRIMARY KEY,
  UserId     NVARCHAR(64)  NOT NULL REFERENCES dbo.Users(Id) ON DELETE CASCADE,
  TokenHash  CHAR(64)      NOT NULL,
  UserAgent  NVARCHAR(200) NOT NULL CONSTRAINT DF_Sessions_UserAgent DEFAULT N'',
  CreatedAt  DATETIME2(3)  NOT NULL CONSTRAINT DF_Sessions_CreatedAt DEFAULT SYSUTCDATETIME(),
  LastUsedAt DATETIME2(3)  NOT NULL CONSTRAINT DF_Sessions_LastUsedAt DEFAULT SYSUTCDATETIME(),
  ExpiresAt  DATETIME2(3)  NOT NULL
);
CREATE UNIQUE INDEX UX_Sessions_TokenHash ON dbo.Sessions(TokenHash);
CREATE INDEX IX_Sessions_ExpiresAt ON dbo.Sessions(ExpiresAt);

/* otp-challenges.json — chỉ lưu HMAC của mã OTP */
CREATE TABLE dbo.OtpChallenges (
  Id         NVARCHAR(64) NOT NULL PRIMARY KEY,
  Phone      VARCHAR(15)  NOT NULL,
  CodeHash   CHAR(64)     NOT NULL,
  Attempts   INT          NOT NULL CONSTRAINT DF_OtpChallenges_Attempts DEFAULT 0,
  CreatedAt  DATETIME2(3) NOT NULL CONSTRAINT DF_OtpChallenges_CreatedAt DEFAULT SYSUTCDATETIME(),
  ExpiresAt  DATETIME2(3) NOT NULL,
  ConsumedAt DATETIME2(3) NULL
);
CREATE INDEX IX_OtpChallenges_Phone ON dbo.OtpChallenges(Phone, CreatedAt DESC);

CREATE TABLE dbo.Playlists (
  Id          NVARCHAR(64)   NOT NULL PRIMARY KEY,
  OwnerId     NVARCHAR(64)   NULL REFERENCES dbo.Users(Id) ON DELETE CASCADE, -- NULL = playlist biên tập
  Name        NVARCHAR(100)  NOT NULL,
  Description NVARCHAR(500)  NOT NULL CONSTRAINT DF_Playlists_Description DEFAULT N'',
  CoverPath   NVARCHAR(400)  NULL,
  IsPublic    BIT            NOT NULL CONSTRAINT DF_Playlists_IsPublic DEFAULT 0,
  CreatedAt   DATETIME2(3)   NOT NULL CONSTRAINT DF_Playlists_CreatedAt DEFAULT SYSUTCDATETIME(),
  UpdatedAt   DATETIME2(3)   NOT NULL CONSTRAINT DF_Playlists_UpdatedAt DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_Playlists_OwnerId ON dbo.Playlists(OwnerId, UpdatedAt DESC);

/* playlists.json → songIds[] (giữ thứ tự bằng Position) */
CREATE TABLE dbo.PlaylistSongs (
  PlaylistId NVARCHAR(64) NOT NULL REFERENCES dbo.Playlists(Id) ON DELETE CASCADE,
  SongId     NVARCHAR(64) NOT NULL REFERENCES dbo.Songs(Id),
  Position   INT          NOT NULL,
  AddedAt    DATETIME2(3) NOT NULL CONSTRAINT DF_PlaylistSongs_AddedAt DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_PlaylistSongs PRIMARY KEY (PlaylistId, SongId)
);
CREATE INDEX IX_PlaylistSongs_Position ON dbo.PlaylistSongs(PlaylistId, Position);

CREATE TABLE dbo.Favorites (
  UserId    NVARCHAR(64) NOT NULL REFERENCES dbo.Users(Id) ON DELETE CASCADE,
  SongId    NVARCHAR(64) NOT NULL REFERENCES dbo.Songs(Id),
  CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Favorites_CreatedAt DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_Favorites PRIMARY KEY (UserId, SongId)
);

CREATE TABLE dbo.SavedAlbums (
  UserId    NVARCHAR(64) NOT NULL REFERENCES dbo.Users(Id) ON DELETE CASCADE,
  AlbumId   NVARCHAR(64) NOT NULL REFERENCES dbo.Albums(Id),
  CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_SavedAlbums_CreatedAt DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_SavedAlbums PRIMARY KEY (UserId, AlbumId)
);

CREATE TABLE dbo.FollowedArtists (
  UserId    NVARCHAR(64) NOT NULL REFERENCES dbo.Users(Id) ON DELETE CASCADE,
  ArtistId  NVARCHAR(64) NOT NULL REFERENCES dbo.Artists(Id),
  CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_FollowedArtists_CreatedAt DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_FollowedArtists PRIMARY KEY (UserId, ArtistId)
);
CREATE INDEX IX_FollowedArtists_ArtistId ON dbo.FollowedArtists(ArtistId);

CREATE TABLE dbo.PlayHistory (
  Id       NVARCHAR(64) NOT NULL PRIMARY KEY,
  UserId   NVARCHAR(64) NOT NULL REFERENCES dbo.Users(Id) ON DELETE CASCADE,
  SongId   NVARCHAR(64) NOT NULL REFERENCES dbo.Songs(Id),
  PlayedAt DATETIME2(3) NOT NULL CONSTRAINT DF_PlayHistory_PlayedAt DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_PlayHistory_User ON dbo.PlayHistory(UserId, PlayedAt DESC);
