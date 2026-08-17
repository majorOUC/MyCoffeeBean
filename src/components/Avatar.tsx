import { generateAvatarColor, getAvatarInitials } from '@/utils/avatar'

interface AvatarProps {
  username: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
}

/**
 * 用户头像组件
 * 根据用户名自动生成独特的颜色和首字母
 */
export default function Avatar({ username, size = 'md' }: AvatarProps) {
  const color = generateAvatarColor(username)
  const initials = getAvatarInitials(username)

  return (
    <div
      className={`flex items-center justify-center rounded-full font-medium text-white ${sizeClasses[size]}`}
      style={{ backgroundColor: color }}
      title={username}
    >
      {initials}
    </div>
  )
}
