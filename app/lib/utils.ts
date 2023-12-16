import type { UsersResponse } from './pocketbase-types'

export const getImageURL = (
  collectionId: string,
  recordId: string,
  fileName: string,
  size = '0x0',
) => {
  return `http://localhost:8090/api/files/${collectionId}/${recordId}/${fileName}?thumb=${size}`
}

export const getAvatarURL = (user: UsersResponse) => {
  return user.avatar
    ? getImageURL(user.collectionId, user.id, user.avatar, '200x200')
    : null
}

export const getSizeForMegaBytes = (mb: number) => mb * 1024 * 1024
