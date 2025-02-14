async function handleCommonClickEvents() {
  document.addEventListener("click", async (e) => {
    const logoutButton = e.target.closest("#logoutButton");
    const sidebarToggle = e.target.closest("#sidebarToggle");

    if (sidebarToggle) {
      const sidebar = document.querySelector(".sidebar");
      sidebar.classList.toggle("open");
      if (sidebar.classList.contains("open")) {
        document.body.classList.remove("sidebar-closed");
      } else {
        document.body.classList.add("sidebar-closed");
      }
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
