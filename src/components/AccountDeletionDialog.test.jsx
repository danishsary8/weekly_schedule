import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AccountDeletionDialog from './AccountDeletionDialog.jsx'
import { permanentlyDeleteAccount } from '../api/services.js'

vi.mock('../api/services.js', () => ({ permanentlyDeleteAccount: vi.fn() }))

const setup = (props = {}) => {
  const onDeleted = vi.fn()
  const onClose = vi.fn()
  render(<AccountDeletionDialog open onClose={onClose} onDeleted={onDeleted} {...props} />)
  return { onDeleted, onClose }
}

describe('AccountDeletionDialog', () => {
  beforeEach(() => {
    vi.mocked(permanentlyDeleteAccount).mockReset()
    vi.mocked(permanentlyDeleteAccount).mockResolvedValue({})
  })

  it('renders nothing until opened', () => {
    render(<AccountDeletionDialog open={false} onClose={() => {}} onDeleted={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  describe('password-backed account', () => {
    it('asks for the current password using a masked field', () => {
      setup({ hasPassword: true })
      const input = screen.getByLabelText(/confirm your password/i)
      expect(input).toHaveAttribute('type', 'password')
      expect(input).toHaveAttribute('autocomplete', 'current-password')
    })

    it('keeps the delete action disabled until something is typed', () => {
      setup({ hasPassword: true })
      const submit = screen.getByRole('button', { name: /delete forever/i })
      expect(submit).toBeDisabled()

      fireEvent.change(screen.getByLabelText(/confirm your password/i), { target: { value: 'hunter2' } })
      expect(submit).toBeEnabled()
    })

    it('sends the password, not a confirmation word', async () => {
      const { onDeleted } = setup({ hasPassword: true })
      fireEvent.change(screen.getByLabelText(/confirm your password/i), { target: { value: 'Str0ng-Pass!42' } })
      fireEvent.click(screen.getByRole('button', { name: /delete forever/i }))

      await waitFor(() => expect(permanentlyDeleteAccount).toHaveBeenCalledWith({ password: 'Str0ng-Pass!42' }))
      await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    })

    it('surfaces the field error and clears the input on a wrong password', async () => {
      const failure = Object.assign(new Error('The given data was invalid.'), {
        fieldError: (field) => (field === 'password' ? 'That password is incorrect.' : undefined),
      })
      vi.mocked(permanentlyDeleteAccount).mockRejectedValue(failure)

      const { onDeleted } = setup({ hasPassword: true })
      fireEvent.change(screen.getByLabelText(/confirm your password/i), { target: { value: 'wrong' } })
      fireEvent.click(screen.getByRole('button', { name: /delete forever/i }))

      expect(await screen.findByRole('alert')).toHaveTextContent(/that password is incorrect/i)
      expect(onDeleted).not.toHaveBeenCalled()
      // Cleared so a failed attempt cannot be resubmitted unchanged.
      expect(screen.getByLabelText(/confirm your password/i)).toHaveValue('')
    })
  })

  describe('Google-only account', () => {
    it('falls back to typing DELETE because there is no password to check', () => {
      setup({ hasPassword: false })
      const input = screen.getByLabelText(/type delete to confirm/i)
      expect(input).toHaveAttribute('type', 'text')
      expect(screen.getByText(/signed in with google/i)).toBeInTheDocument()
    })

    it('requires the exact confirmation word', async () => {
      setup({ hasPassword: false })
      const input = screen.getByLabelText(/type delete to confirm/i)
      const submit = screen.getByRole('button', { name: /delete forever/i })

      fireEvent.change(input, { target: { value: 'delete' } })
      expect(submit).toBeDisabled()

      fireEvent.change(input, { target: { value: 'DELETE' } })
      expect(submit).toBeEnabled()

      fireEvent.click(submit)
      await waitFor(() => expect(permanentlyDeleteAccount).toHaveBeenCalledWith({ confirmation: 'DELETE' }))
    })
  })

  it('lets the user back out without deleting', () => {
    const { onClose } = setup({ hasPassword: true })
    fireEvent.click(screen.getByRole('button', { name: /keep my account/i }))
    expect(onClose).toHaveBeenCalled()
    expect(permanentlyDeleteAccount).not.toHaveBeenCalled()
  })
})
