import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CustomerPortal from '../../src/pages/CustomerPortal/CustomerPortal'

describe('CustomerPortal', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('submits a valid inquiry and displays its reference number', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ inquiry: { id: 42 } }),
      })
    )

    render(<CustomerPortal />)

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Customer' },
    })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'jane@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^subject/i), {
      target: { value: 'Help with my order' },
    })
    fireEvent.change(screen.getByLabelText(/inquiry description/i), {
      target: { value: 'I need help with my recent order.' },
    })

    fireEvent.click(screen.getByRole('button', { name: /submit inquiry/i }))

    await waitFor(() => {
      expect(
        screen.getByText('Your inquiry has been submitted!')
      ).toBeInTheDocument()
    })

    expect(screen.getByText('#INQ-42')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/inquiries'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('displays the API error when submission fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Unable to submit inquiry.' }),
      })
    )

    render(<CustomerPortal />)

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Jane Customer' },
    })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'jane@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^subject/i), {
      target: { value: 'Help with my order' },
    })
    fireEvent.change(screen.getByLabelText(/inquiry description/i), {
      target: { value: 'I need help with my recent order.' },
    })

    fireEvent.click(screen.getByRole('button', { name: /submit inquiry/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Unable to submit inquiry.'
      )
    })
  })
})
