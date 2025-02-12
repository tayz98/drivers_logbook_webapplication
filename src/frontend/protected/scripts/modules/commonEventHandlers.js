async function handleCommonClickEvents() {
  document.addEventListener("click", async (e) => {
    const logoutButton = e.target.closest("#logoutButton");
    const sidebarToggle = e.target.closest("#sidebarToggle");

    if (sidebarToggle) {
      console.log("Sidebar toggle clicked");
      const sidebar = document.querySelector(".sidebar");
      sidebar.classList.toggle("open");
    }
    if (logoutButton) {
      handleLogout(e);
    }
  });
}

async function handleLogout(e) {
  e.preventDefault();
  logOutUser();
}
