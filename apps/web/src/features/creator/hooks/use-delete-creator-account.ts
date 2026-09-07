import { useMutation } from '@tanstack/react-query'
import { deleteCreatorAccount } from '../api/delete-creator-account'

export function useDeleteCreatorAccount() {
  return useMutation({
    mutationFn: ({ confirmation }: { confirmation: string }) =>
      deleteCreatorAccount(confirmation),
  })
}
