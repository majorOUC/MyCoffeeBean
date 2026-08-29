import { useEffect, useState } from 'react'

import Avatar from '@/components/Avatar'
import AccessDenied from '@/components/AccessDenied'
import { useAuth } from '@/components/AuthContext'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import { useToast } from '@/components/toastContext'
import type { UserRole } from '@/types/coffee'

interface User {
  id: string
  username: string
  displayName: string
  role: UserRole
  createdAt: string
}

const ROLE_LABELS: Record<UserRole, string> = {
  user: '仅浏览',
  publisher: '可发豆',
  admin: '管理员',
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return

    const loadUsers = async () => {
      try {
        const token = localStorage.getItem('coffee-atlas:token')
        const res = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch users')
        const data = await res.json()
        setUsers(data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    void loadUsers()
  }, [currentUser])

  const handleDelete = async (userId: string, username: string) => {
    if (!window.confirm(`确定删除用户「${username}」？`)) return
    try {
      const token = localStorage.getItem('coffee-atlas:token')
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete user')
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      toast.show(`已删除用户「${username}」`, 'success')
    } catch {
      toast.show('删除失败，请重试', 'error')
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const token = localStorage.getItem('coffee-atlas:token')
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error('Failed to update role')
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      )
      toast.show('权限已更新', 'success')
    } catch {
      toast.show('更新失败，请重试', 'error')
    }
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return <AccessDenied message="只有管理员才能访问用户管理。" />
  }

  if (error) {
    return (
      <div className="py-16">
        <ErrorState onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="py-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-coffee-900">
          用户管理
        </h1>
        <p className="mt-1 text-sm text-ink-400">管理注册用户和权限</p>
      </header>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-coffee-100/60"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState emoji="👥" title="暂无用户" />
        ) : (
          <div className="space-y-4">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-2xl border border-coffee-200/70 bg-cream-50 p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar username={u.displayName || u.username} size="md" />
                  <div>
                    <div className="font-medium text-coffee-900">
                      {u.displayName || u.username}
                      {u.id === currentUser.id && (
                        <span className="ml-2 text-xs text-ink-400">
                          (你)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-400">
                      @{u.username} · {ROLE_LABELS[u.role]}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={u.role}
                    onChange={(e) =>
                      void handleRoleChange(u.id, e.target.value as UserRole)
                    }
                    disabled={u.id === currentUser.id}
                    className="rounded-full border border-coffee-300/70 bg-cream-50 py-1.5 pl-3 pr-10 text-sm text-ink-900 focus:border-coffee-500 focus:ring-2 focus:ring-coffee-300/40 focus:outline-none disabled:opacity-50"
                  >
                    <option value="user">仅浏览</option>
                    <option value="publisher">可发豆</option>
                    <option value="admin">管理员</option>
                  </select>
                  {u.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => void handleDelete(u.id, u.username)}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
