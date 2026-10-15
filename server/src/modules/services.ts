import type { AppConfig } from '../config/env';
import type { Repositories } from '../data/repositories';
import { AuthService } from './auth/auth.service';
import { GoogleVerifier } from './auth/google.verifier';
import { createOtpSender } from './auth/otp-senders';
import { OtpService } from './auth/otp.service';
import { CatalogMapper } from './catalog/catalog.mapper';
import { CatalogService } from './catalog/catalog.service';
import { HistoryService } from './history/history.service';
import { HomeService } from './home/home.service';
import { LibraryService } from './library/library.service';
import { PlaylistService } from './playlists/playlists.service';
import { SearchService } from './search/search.service';
import { UserService } from './users/users.service';

export interface Services {
  users: UserService;
  auth: AuthService;
  otp: OtpService;
  google: GoogleVerifier;
  catalog: CatalogService;
  home: HomeService;
  search: SearchService;
  playlists: PlaylistService;
  library: LibraryService;
  history: HistoryService;
}

/** Khởi tạo toàn bộ service (dependency injection thủ công, không cần framework). */
export function createServices(repos: Repositories, config: AppConfig): Services {
  const mapper = new CatalogMapper(repos, config.mediaBaseUrl);
  const catalog = new CatalogService(repos, mapper);
  const home = new HomeService(repos, mapper, catalog);
  const playlists = new PlaylistService(repos, mapper);
  const users = new UserService(repos);
  const google = new GoogleVerifier(config.auth.googleClientId, config.auth.googleJwksUrl);
  const exposeDevCode = !config.isProduction || config.auth.otpShowCode;
  const otp = new OtpService(repos, createOtpSender(config), config.auth.secret, exposeDevCode);
  return {
    users,
    auth: new AuthService(repos, users, google, otp, config.auth.sessionTtlMs),
    otp,
    google,
    catalog,
    home,
    search: new SearchService(repos, mapper),
    playlists,
    library: new LibraryService(repos, mapper, playlists, home),
    history: new HistoryService(repos, mapper),
  };
}
