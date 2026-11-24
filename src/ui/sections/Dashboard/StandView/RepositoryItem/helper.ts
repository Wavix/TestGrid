export const setNotification = (standId: number, repositoryId: number) => {
  const currentNotifications = getNotifications(standId)
  if (currentNotifications.includes(repositoryId)) return

  localStorage.setItem(`notifications_${standId}`, JSON.stringify([...currentNotifications, repositoryId]))
}

export const removeNotification = (standId: number, repositoryId: number) => {
  const currentNotifications = getNotifications(standId)
  if (!currentNotifications.includes(repositoryId)) return

  const newNotifications = currentNotifications.filter(id => id !== repositoryId)
  localStorage.setItem(`notifications_${standId}`, JSON.stringify(newNotifications))
}

export const getNotifications = (standId: number): Array<number> => {
  const notifications = localStorage.getItem(`notifications_${standId}`)
  if (!notifications) return []

  return JSON.parse(notifications)
}
