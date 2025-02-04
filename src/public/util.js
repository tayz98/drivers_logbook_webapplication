async function loadUser() {
  try {
    const response = await fetch("/user");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching user:", error);
  }
}
