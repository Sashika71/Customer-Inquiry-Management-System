
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function loginAdmin(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(
      result.message || 'Unable to sign in. Please try again.'
    )
  }

  return result
}
