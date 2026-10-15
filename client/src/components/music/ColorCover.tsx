import { alpha } from '../../lib/cn';

/** Ảnh đại diện màu cho trang tâm trạng / thể loại. */
export function ColorCover({ color, imageUrl, label }: { color: string; imageUrl: string | null; label: string }) {
  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-[1.75rem] shadow-[0_30px_60px_-25px_rgb(0_0_0/0.85)]"
      style={{ background: `linear-gradient(150deg, ${alpha(color, 0.9)}, ${alpha(color, 0.25)} 70%, #0c1024)` }}
    >
      {imageUrl && <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover opacity-45 mix-blend-screen" />}
      <span className="absolute bottom-5 left-5 text-left text-3xl font-extrabold tracking-tight">{label}</span>
    </div>
  );
}
