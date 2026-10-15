import type { Repositories } from '../repositories';
import { JsonIdentityRepository, JsonOtpChallengeRepository, JsonSessionRepository } from './auth.repositories';
import {
  JsonAlbumRepository,
  JsonArtistRepository,
  JsonGenreRepository,
  JsonLyricsRepository,
  JsonMoodRepository,
  JsonSongRepository,
} from './catalog.repositories';
import { openJsonDatabase } from './json-database';
import {
  JsonHistoryRepository,
  JsonLibraryRepository,
  JsonPlaylistRepository,
  JsonUserRepository,
} from './user.repositories';

export async function createJsonRepositories(options: { dataDir: string; seedDir: string }): Promise<Repositories> {
  const db = await openJsonDatabase(options.dataDir, options.seedDir);
  return {
    songs: new JsonSongRepository(db.songs),
    albums: new JsonAlbumRepository(db.albums),
    artists: new JsonArtistRepository(db.artists),
    moods: new JsonMoodRepository(db.moods),
    genres: new JsonGenreRepository(db.genres),
    lyrics: new JsonLyricsRepository(db.lyrics),
    users: new JsonUserRepository(db.users),
    identities: new JsonIdentityRepository(db.identities),
    sessions: new JsonSessionRepository(db.sessions),
    otpChallenges: new JsonOtpChallengeRepository(db.otpChallenges),
    playlists: new JsonPlaylistRepository(db.playlists),
    library: new JsonLibraryRepository(db.favorites, db.savedAlbums, db.followedArtists),
    history: new JsonHistoryRepository(db.playHistory),
    close: () => db.flushAll(),
  };
}
