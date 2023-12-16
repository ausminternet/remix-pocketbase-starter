import invariant from 'tiny-invariant'
import type { UsersResponse } from './pocketbase-types'

export const getImageURL = (
  collectionId: string,
  recordId: string,
  fileName: string,
  size = '0x0',
) => {
  invariant(process.env.POCKETBASE_URL, 'POCKETBASE_URL is not set')
  return `${process.env.POCKETBASE_URL}/api/files/${collectionId}/${recordId}/${fileName}?thumb=${size}`
}

export const getAvatarURL = (user: UsersResponse) => {
  return user.avatar
    ? getImageURL(user.collectionId, user.id, user.avatar, '200x200')
    : null
}
