const API_URL = 'https://script.google.com/macros/s/AKfycbz8lBGl75prYnpy9YT32XK2bVgUaZi96zl8NbQw6n7E-PSx7SIT6mP79-McBfrVvBhA/exec'

export async function fetchPlannerData() {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error('Failed to fetch planner data')
  }

  return response.json()
}