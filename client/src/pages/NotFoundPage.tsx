import { Compass } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/States';

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={<Compass className="size-7" />}
      title="Không tìm thấy trang"
      description="Đường dẫn có thể đã thay đổi hoặc không tồn tại."
      action={
        <Link to="/">
          <Button variant="primary">Về trang chủ</Button>
        </Link>
      }
      className="py-24"
    />
  );
}
