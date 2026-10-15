import type { Song } from '@nocturne/shared';

/** Số giây nghe thực tế để tính là một lượt nghe (ghi vào lịch sử). */
const LISTEN_THRESHOLD_SEC = 10;

export interface EngineEvents {
  onPlay(): void;
  onPause(): void;
  onEnded(): void;
  onError(): void;
  onTime(currentTime: number, duration: number): void;
  onBuffering(buffering: boolean): void;
  onListened(songId: string): void;
  /** Điều khiển từ màn hình khoá / tai nghe / thông báo hệ thống. */
  remote: {
    play(): void;
    pause(): void;
    next(): void;
    previous(): void;
    seek(time: number): void;
  };
}

/**
 * Bọc HTMLAudioElement (một phần tử duy nhất cho cả ứng dụng).
 * Không phụ thuộc React — store gọi trực tiếp các hàm này ngay trong sự kiện click,
 * nhờ vậy Safari iOS cho phép phát nhạc (yêu cầu thao tác người dùng).
 */
class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private events: EngineEvents | null = null;
  private loadedKey: string | null = null;
  private loadedSongId: string | null = null;
  private pendingSeek: number | null = null;
  private listened = 0;
  private lastTick = 0;
  private reported = false;

  bind(events: EngineEvents): void {
    this.events = events;
  }

  private element(): HTMLAudioElement {
    if (this.audio) return this.audio;
    const a = new Audio();
    a.preload = 'auto';
    a.addEventListener('play', () => this.events?.onPlay());
    a.addEventListener('pause', () => this.events?.onPause());
    a.addEventListener('playing', () => this.events?.onBuffering(false));
    a.addEventListener('waiting', () => this.events?.onBuffering(true));
    a.addEventListener('canplay', () => this.events?.onBuffering(false));
    a.addEventListener('ended', () => this.events?.onEnded());
    a.addEventListener('error', () => {
      if (a.getAttribute('src')) this.events?.onError();
    });
    a.addEventListener('loadedmetadata', () => {
      if (this.pendingSeek !== null) {
        a.currentTime = Math.min(this.pendingSeek, Math.max(0, a.duration - 1));
        this.pendingSeek = null;
      }
      this.emitTime();
    });
    a.addEventListener('durationchange', () => this.emitTime());
    a.addEventListener('timeupdate', () => {
      this.trackListening(a);
      this.emitTime();
    });
    this.audio = a;
    this.setupRemoteControls();
    return a;
  }

  isLoaded(key: string): boolean {
    return this.loadedKey === key;
  }

  get currentTime(): number {
    return this.audio?.currentTime ?? 0;
  }

  /** Nạp bài hát (nếu khác bài đang nạp) và phát nếu `autoplay`. */
  load(key: string, song: Song, options: { autoplay: boolean; startAt?: number }): void {
    const a = this.element();
    if (this.loadedKey !== key) {
      this.loadedKey = key;
      this.loadedSongId = song.id;
      this.listened = 0;
      this.lastTick = options.startAt ?? 0;
      this.reported = false;
      this.pendingSeek = options.startAt && options.startAt > 1 ? options.startAt : null;
      a.src = song.audioUrl;
      this.updateMetadata(song);
    }
    if (options.autoplay) void this.play();
  }

  async play(): Promise<void> {
    try {
      await this.element().play();
    } catch (error) {
      // AbortError = bị ngắt vì đã chuyển bài khác → bỏ qua. Lỗi khác (vd. chặn autoplay) → báo đã dừng.
      if ((error as DOMException).name !== 'AbortError') this.events?.onPause();
    }
  }

  pause(): void {
    this.audio?.pause();
  }

  seek(time: number): void {
    const a = this.audio;
    if (!a) return;
    if (a.readyState >= HTMLMediaElement.HAVE_METADATA) {
      a.currentTime = time;
      this.lastTick = time;
    } else {
      this.pendingSeek = time;
    }
    this.emitTime();
  }

  setVolume(volume: number, muted: boolean): void {
    const a = this.element();
    a.volume = volume;
    a.muted = muted;
  }

  stop(): void {
    const a = this.audio;
    if (!a) return;
    a.pause();
    a.removeAttribute('src');
    a.load();
    this.loadedKey = null;
    this.loadedSongId = null;
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = null;
  }

  /** Cộng dồn thời gian nghe thật (bỏ qua các lần tua) để ghi nhận lượt nghe. */
  private trackListening(a: HTMLAudioElement): void {
    const t = a.currentTime;
    const delta = t - this.lastTick;
    this.lastTick = t;
    if (delta > 0 && delta < 1.5) this.listened += delta;
    const threshold = Number.isFinite(a.duration) ? Math.min(LISTEN_THRESHOLD_SEC, a.duration * 0.5) : LISTEN_THRESHOLD_SEC;
    if (!this.reported && this.loadedSongId && this.listened >= threshold) {
      this.reported = true;
      this.events?.onListened(this.loadedSongId);
    }
  }

  private emitTime(): void {
    const a = this.audio;
    if (!a) return;
    const duration = Number.isFinite(a.duration) ? a.duration : 0;
    this.events?.onTime(a.currentTime, duration);
    if ('mediaSession' in navigator && duration > 0 && 'setPositionState' in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({ duration, position: Math.min(a.currentTime, duration), playbackRate: a.playbackRate || 1 });
      } catch {
        /* một số trình duyệt từ chối khi metadata chưa sẵn sàng */
      }
    }
  }

  private updateMetadata(song: Song): void {
    if (!('mediaSession' in navigator)) return;
    const artwork = new URL(song.coverUrl, window.location.origin).href;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artistName,
      album: song.albumTitle,
      artwork: [
        { src: artwork, sizes: '640x640', type: 'image/jpeg' },
        { src: artwork, sizes: '512x512', type: 'image/jpeg' },
      ],
    });
  }

  private setupRemoteControls(): void {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => this.events?.remote.play()],
      ['pause', () => this.events?.remote.pause()],
      ['nexttrack', () => this.events?.remote.next()],
      ['previoustrack', () => this.events?.remote.previous()],
      ['seekto', (d) => d.seekTime !== undefined && this.events?.remote.seek(d.seekTime)],
      ['seekbackward', (d) => this.events?.remote.seek(Math.max(0, this.currentTime - (d.seekOffset ?? 10)))],
      ['seekforward', (d) => this.events?.remote.seek(this.currentTime + (d.seekOffset ?? 10))],
    ];
    for (const [action, handler] of handlers) {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        /* action không được hỗ trợ trên trình duyệt này */
      }
    }
  }
}

export const audioEngine = new AudioEngine();
