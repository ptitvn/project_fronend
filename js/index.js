// Data storage
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
// Đổi budgets từ object sang mảng
let budgets = JSON.parse(localStorage.getItem("budgets")) || [];

// DOM Elements
const monthSelect = document.getElementById("monthSelect");
const budgetInput = document.getElementById("budgetInput");
const saveBudgetBtn = document.getElementById("saveBudgetBtn");
const remainingAmount = document.getElementById("remainingAmount");
const categoryName = document.getElementById("categoryName");
const categoryLimit = document.getElementById("categoryLimit");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const categoriesList = document.getElementById("categoriesList");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCategory = document.getElementById("expenseCategory");
const expenseNote = document.getElementById("expenseNote");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const expensesHistory = document.getElementById("expensesHistory");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const sortExpense = document.getElementById("sortExpense");
const budgetWarning = document.getElementById("budgetWarning");
const monthlyStats = document.getElementById("monthlyStats");
const logoutBtn = document.querySelector(".logout-button");

// Biến phân trang
let currentPage = 1;
const itemsPerPage = 5;

// Khởi tạo ứng dụng
document.addEventListener("DOMContentLoaded", () => {
  // Kiểm tra đăng nhập
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // Đặt tháng hiện tại làm mặc định
  const today = new Date();
  const currentMonth = today.toISOString().substring(0, 7);
  monthSelect.value = currentMonth + "-01";

  // Tải dữ liệu cho tháng hiện tại
  loadMonthData();
});

// Chức năng đăng xuất
if (logoutBtn) {
  logoutBtn.addEventListener("click", showLogoutConfirmation);
}

// Thay đổi lựa chọn tháng
if (monthSelect) {
  monthSelect.addEventListener("change", loadMonthData);
}

// Tiết kiệm ngân sách
if (saveBudgetBtn) {
  saveBudgetBtn.addEventListener("click", saveBudget);
}

// Thêm danh mục
if (addCategoryBtn) {
  addCategoryBtn.addEventListener("click", addCategory);
}

// Thêm chi phí
if (addExpenseBtn) {
  addExpenseBtn.addEventListener("click", addExpense);
}

// Tìm kiếm chi phí
if (searchBtn) {
  searchBtn.addEventListener("click", searchExpenses);
}

// Phân loại chi phí
if (sortExpense) {
  sortExpense.addEventListener("change", sortExpenses);
}

// Các nút phân trang
document.querySelectorAll(".move button").forEach((button) => {
  button.addEventListener("click", handlePagination);
});

// Month selection change
if (monthSelect) {
  monthSelect.addEventListener("change", loadMonthData);
}

// Save budget
if (saveBudgetBtn) {
  saveBudgetBtn.addEventListener("click", saveBudget);
}

// Add category
if (addCategoryBtn) {
  addCategoryBtn.addEventListener("click", addCategory);
}

// Add expense
if (addExpenseBtn) {
  addExpenseBtn.addEventListener("click", addExpense);
}

// Search expenses
if (searchBtn) {
  searchBtn.addEventListener("click", searchExpenses);
}

// Sort expenses
if (sortExpense) {
  sortExpense.addEventListener("change", sortExpenses);
}

// Pagination buttons
document.querySelectorAll(".move button").forEach((button) => {
  button.addEventListener("click", handlePagination);
});

// Functions
function showLogoutConfirmation() {
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "1000";

  modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; width: 300px;">
            <h3>Xác nhận đăng xuất</h3>
            <p>Bạn có chắc chắn muốn đăng xuất?</p>
            <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                <button id="confirmLogout" style="padding: 8px 16px; background: #4F46E5; color: white; border: none; border-radius: 4px;">Đăng xuất</button>
                <button id="cancelLogout" style="padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 4px;">Hủy</button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  document.getElementById("confirmLogout").addEventListener("click", () => {
    currentUser = null;
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  });

  document.getElementById("cancelLogout").addEventListener("click", () => {
    document.body.removeChild(modal);
  });
}

function saveBudget() {
  const month = monthSelect.value.substring(0, 7);
  const budget = parseFloat(budgetInput.value);

  if (!budget || isNaN(budget)) {
    showAlertModal("Vui lòng nhập số tiền ngân sách");
    return;
  }

  // Tìm hoặc tạo dữ liệu ngân sách cho người dùng
  let userBudget = budgets.find((b) => b.email === currentUser.email);
  if (!userBudget) {
    userBudget = { email: currentUser.email, monthly: {} };
    budgets.push(userBudget);
  }

  // Lưu ngân sách cho tháng
  userBudget.monthly[month] = {
    budget: budget,
    categories: userBudget.monthly[month]?.categories || [],
    expenses: userBudget.monthly[month]?.expenses || [],
    spent: userBudget.monthly[month]?.spent || 0,
  };

  localStorage.setItem("budgets", JSON.stringify(budgets));

  // Update UI
  loadMonthData();
  budgetInput.value = "";
}

function addCategory() {
  const month = monthSelect.value.substring(0, 7);
  const name = categoryName.value.trim();
  const limit = parseFloat(categoryLimit.value);

  // Validate inputs
  if (!name) {
    showAlertModal("Vui lòng nhập tên danh mục");
    return;
  }

  if (!limit || isNaN(limit) || limit <= 0) {
    showAlertModal("Vui lòng nhập giới hạn chi tiêu hợp lệ (số dương)");
    return;
  }

  // Tìm dữ liệu ngân sách cho người dùng và tháng
  const userBudget = budgets.find((b) => b.email === currentUser.email);
  if (!userBudget || !userBudget.monthly[month]) {
    showAlertModal("Không tìm thấy dữ liệu ngân sách cho tháng này.");
    return;
  }

  // Check for duplicate category name
  const existingCategory = userBudget.monthly[month].categories.find(
    (cat) => cat.name.toLowerCase() === name.toLowerCase()
  );

  if (existingCategory) {
    showAlertModal("Danh mục này đã tồn tại");
    return;
  }

  // Add new category
  userBudget.monthly[month].categories.push({
    name,
    limit,
    spent: 0,
  });

  localStorage.setItem("budgets", JSON.stringify(budgets));
  loadMonthData();

  // Reset form
  categoryName.value = "";
  categoryLimit.value = "";
  categoryName.focus();
}

function addExpense() {
  const month = monthSelect.value.substring(0, 7);
  const amount = parseFloat(expenseAmount.value);
  const category = expenseCategory.value;
  const note = expenseNote.value;

  if (!amount || isNaN(amount)) {
    showAlertModal("Vui lòng nhập số tiền");
    return;
  }

  if (!category) {
    showAlertModal("Vui lòng chọn danh mục");
    return;
  }

  if (!note) {
    showAlertModal("Vui lòng nhập ghi chú");
    return;
  }

  // Tìm dữ liệu ngân sách cho người dùng và tháng
  const userBudget = budgets.find((b) => b.email === currentUser.email);
  if (!userBudget || !userBudget.monthly[month]) {
    showAlertModal("Không tìm thấy dữ liệu ngân sách cho tháng này.");
    return;
  }

  // Add expense
  const expense = {
    amount,
    note,
    date: new Date().toLocaleDateString(),
    category,
  };
  userBudget.monthly[month].expenses.push(expense);

  // Update spent amount
  userBudget.monthly[month].spent += amount;

  // Update category spent
  const categoryObj = userBudget.monthly[month].categories.find(
    (c) => c.name === category
  );
  if (categoryObj) {
    categoryObj.spent += amount;
  }

  localStorage.setItem("budgets", JSON.stringify(budgets));

  // Update UI
  loadMonthData();
  expenseAmount.value = "";
  expenseNote.value = "";
}

function loadMonthData() {
  const month = monthSelect.value.substring(0, 7);
  currentPage = 1;

  const userBudget = budgets.find((b) => b.email === currentUser.email);
  const monthData = userBudget?.monthly[month];

  if (!monthData) {
    // Initialize empty month data in UI
    remainingAmount.textContent = "0 VND";
    categoriesList.innerHTML = "";
    expensesHistory.innerHTML = "";
    budgetWarning.textContent = "";
    monthlyStats.innerHTML = "";
    return;
  }

  // Update budget display
  remainingAmount.textContent =
    (monthData.budget - monthData.spent).toLocaleString() + " VND";

  // Update category list
  updateCategoryList(monthData);

  // Update expense history
  updateExpenseHistory(monthData);

  // Update category dropdown
  updateCategoryDropdown(monthData);

  // Check budget warning
  if (monthData.spent > monthData.budget) {
    budgetWarning.textContent = `Cảnh báo: Bạn đã vượt quá ngân sách! Đã chi ${monthData.spent.toLocaleString()} / ${monthData.budget.toLocaleString()} VND`;
  } else {
    budgetWarning.textContent = "";
  }

  // Update monthly stats
  updateMonthlyStats();
}

function updateCategoryList(monthData) {
    categoriesList.innerHTML = monthData.categories.map((category, index) => `
        <div class="content2">
            <div class="item">${category.name} - Giới hạn: ${category.limit.toLocaleString()} VND </div>
            <div class="item_button">
                <button onclick="editCategory(${index})">Sửa</button>
                <button onclick="deleteCategory(${index})">Xóa</button>
            </div>
        </div>
    `).join('');
}

function showEditCategoryModal(index) {
  const month = monthSelect.value.substring(0, 7);
  const userBudget = budgets.find((b) => b.email === currentUser.email);
  const category = userBudget?.monthly[month]?.categories[index];

  if (!category) return;

  // Show the existing modal (from HTML)
  const modal = document.getElementById("editCategoryModal");
  document.getElementById("editCategoryName").value = category.name;
  document.getElementById("editCategoryLimit").value = category.limit;
  modal.classList.remove("hidden");

  // Store current editing index
  currentEditingCategoryIndex = index;

  // Event listeners are already set up in HTML
}

function showDeleteConfirmModal(index) {
  const month = monthSelect.value.substring(0, 7);
  const userBudget = budgets.find((b) => b.email === currentUser.email);
  const category = userBudget?.monthly[month]?.categories[index];

  if (!category) return;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
        <div class="modal-content">
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa danh mục "${category.name}"?</p>
            <div class="modal-actions">
                <button id="cancelDelete">Hủy</button>
                <button id="confirmDelete">Xóa</button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  document.getElementById("confirmDelete").addEventListener("click", () => {
    const userBudget = budgets.find((b) => b.email === currentUser.email);
    if (userBudget?.monthly[month]) {
      userBudget.monthly[month].categories.splice(index, 1);
      localStorage.setItem("budgets", JSON.stringify(budgets));
      modal.remove();
      loadMonthData();
    }
  });

  document.getElementById("cancelDelete").addEventListener("click", () => {
    modal.remove();
  });
}

function editCategory(index) {
  const month = monthSelect.value.substring(0, 7);
  const userBudget = budgets.find((b) => b.email === currentUser.email);
  const category = userBudget?.monthly[month]?.categories[index];

  if (!category) return;

  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "1000";

  modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; width: 300px;">
            <h3>Sửa danh mục</h3>
            <input type="text" id="editCategoryName" value="${category.name}" placeholder="Tên danh mục" />
            <input type="number" id="editCategoryLimit" value="${category.limit}" placeholder="Giới hạn (VND)" />
            <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                <button id="confirmEdit" style="padding: 8px 16px; background: #4F46E5; color: white; border: none; border-radius: 4px;">Lưu</button>
                <button id="cancelEdit" style="padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 4px;">Hủy</button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  document.getElementById("confirmEdit").addEventListener("click", () => {
    const newName = document.getElementById("editCategoryName").value;
    const newLimit = parseFloat(
      document.getElementById("editCategoryLimit").value
    );

    if (newName && !isNaN(newLimit)) {
      const userBudget = budgets.find((b) => b.email === currentUser.email);
      if (userBudget?.monthly[month]?.categories[index]) {
        userBudget.monthly[month].categories[index].name = newName;
        userBudget.monthly[month].categories[index].limit = newLimit;
        localStorage.setItem("budgets", JSON.stringify(budgets));
        loadMonthData();
        document.body.removeChild(modal);
      }
    } else {
      showAlertModal("Vui lòng nhập thông tin hợp lệ");
    }
  });

  document.getElementById("cancelEdit").addEventListener("click", () => {
    document.body.removeChild(modal);
  });
}

function deleteCategory(index) {
  const month = monthSelect.value.substring(0, 7);
  const userBudget = budgets.find((b) => b.email === currentUser.email);
  const category = userBudget?.monthly[month]?.categories[index];

  if (!category) return;

  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "1000";
  modal.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px; width: 300px;">
        <h3>Xác nhận xóa danh mục</h3>
        <p>Bạn có chắc chắn muốn xóa danh mục "${category.name}"?</p>
        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            <button id="confirmDelete" style="padding: 8px 16px; background: #e53e3e; color: white; border: none; border-radius: 4px;">Xóa</button>
            <button id="cancelDelete" style="padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 4px;">Hủy</button>
        </div>
    </div>
`;

  document.body.appendChild(modal);

  document.getElementById("confirmDelete").addEventListener("click", () => {
    const userBudget = budgets.find((b) => b.email === currentUser.email);
    if (userBudget?.monthly[month]?.categories) {
      userBudget.monthly[month].categories.splice(index, 1);
      localStorage.setItem("budgets", JSON.stringify(budgets));
      loadMonthData();
      document.body.removeChild(modal);
    }
  });

  document.getElementById("cancelDelete").addEventListener("click", () => {
    document.body.removeChild(modal);
  });
}

function deleteExpense(index) {
  showDeleteConfirmationModal(
    "Bạn có chắc chắn muốn xóa giao dịch này?",
    () => {
      const month = monthSelect.value.substring(0, 7);
      const userBudget = budgets.find((b) => b.email === currentUser.email);
      const expense = userBudget?.monthly[month]?.expenses[index];

      if (!expense) return;

      // Update total spent
      if (userBudget?.monthly[month]) {
        userBudget.monthly[month].spent -= expense.amount;

        // Update category spent if applicable
        if (expense.category !== "Khác") {
          const category = userBudget.monthly[month].categories.find(
            (c) => c.name === expense.category
          );
          if (category) {
            category.spent -= expense.amount;
          }
        }

        // Remove expense
        userBudget.monthly[month].expenses.splice(index, 1);
        localStorage.setItem("budgets", JSON.stringify(budgets));

        loadMonthData();
      }
    }
  );
}

function updateExpenseHistory(monthData) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = monthData.expenses.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  expensesHistory.innerHTML = paginatedExpenses
    .map(
      (expense, index) => `
    <div class="content2">
        <div class="item">
            ${expense.date} - ${expense.category}: ${
        expense.note
      } (${expense.amount.toLocaleString()} VND)
        </div>
        <div class="item_button">
            <button onclick="deleteExpense(${startIndex + index})">Xóa</button>
        </div>
    </div>
`
    )
    .join("");

  // Update pagination buttons
  updatePaginationButtons(monthData.expenses.length);
}

function updateCategoryDropdown(monthData) {
  expenseCategory.innerHTML =
    '<option value="">Tiền chi tiêu </option>' +
    monthData.categories
      .map(
        (category) => `
        <option value="${category.name}">${category.name}</option>
    `
      ).join("") +'<option value="Khác">Khác</option>';
}

function updateMonthlyStats() {
  const userBudget = budgets.find((b) => b.email === currentUser.email);
  if (!userBudget) {
    monthlyStats.innerHTML = "";
    return;
  }

  const userData = userBudget.monthly;
  const months = Object.keys(userData).sort().reverse().slice(0, 3);

  monthlyStats.innerHTML = months
    .map((month) => {
      const data = userData[month];
      const status = data.spent > data.budget ? "❌ Vượt" : "✅ Đạt";
      return `
        <div class="item">
            <span>${month}</span>
            <span>${data.spent?.toLocaleString() || 0} VND</span>
            <span>${data.budget?.toLocaleString() || 0} VND</span>
            <span>${status}</span>
        </div>
    `;
    })
    .join("");
}

// Xử lý sự kiện cho các nút modal
document.getElementById("confirmLogout").addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
});

document.getElementById("cancelLogout").addEventListener("click", () => {
  document.getElementById("logoutModal").classList.add("hidden");
});

document.getElementById("saveEditCategory").addEventListener("click", () => {
  const month = monthSelect.value.substring(0, 7);
  const newName = document.getElementById("editCategoryName").value;
  const newLimit = parseFloat(
    document.getElementById("editCategoryLimit").value
  );

  if (!newName || isNaN(newLimit)) {
    alert("Vui lòng nhập đầy đủ thông tin");
    return;
  }

  const userBudget = budgets.find((b) => b.email === currentUser.email);
  if (userBudget?.monthly[month]?.categories[currentEditingCategoryIndex]) {
    userBudget.monthly[month].categories[currentEditingCategoryIndex].name =
      newName;
    userBudget.monthly[month].categories[currentEditingCategoryIndex].limit =
      newLimit;
    localStorage.setItem("budgets", JSON.stringify(budgets));

    document.getElementById("editCategoryModal").classList.add("hidden");
    loadMonthData();
  }
});

document.getElementById("cancelEditCategory").addEventListener("click", () => {
  document.getElementById("editCategoryModal").classList.add("hidden");
});

document.getElementById("confirmDelete").addEventListener("click", () => {
  const month = monthSelect.value.substring(0, 7);
  const userBudget = budgets.find((b) => b.email === currentUser.email);
  if (userBudget?.monthly[month]?.categories) {
    userBudget.monthly[month].categories.splice(currentEditingCategoryIndex, 1);
    localStorage.setItem("budgets", JSON.stringify(budgets));

    document.getElementById("deleteConfirmModal").classList.add("hidden");
    loadMonthData();
  }
});

document.getElementById("cancelDelete").addEventListener("click", () => {
  document.getElementById("deleteConfirmModal").classList.add("hidden");
});

function showAlertModal(message) {
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "1000";

  modal.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px; width: 300px;">
        <h3>Thông báo</h3>
        <p>${message}</p>
        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
            <button id="closeAlert" style="padding: 8px 16px; background: #4F46E5; color: white; border: none; border-radius: 4px;">Đóng</button>
        </div>
    </div>
`;

  document.body.appendChild(modal);

  document.getElementById("closeAlert").addEventListener("click", () => {
    document.body.removeChild(modal);
  });
}

function showDeleteConfirmationModal(message, callback) {
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "1000";

  modal.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 8px; width: 300px;">
        <h3>Xác nhận</h3>
        <p>${message}</p>
        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            <button id="confirmAction" style="padding: 8px 16px; background: #e53e3e; color: white; border: none; border-radius: 4px;">Xác nhận</button>
            <button id="cancelAction" style="padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 4px;">Hủy</button>
        </div>
    </div>
`;

  document.body.appendChild(modal);

  document.getElementById("confirmAction").addEventListener("click", () => {
    callback();
    document.body.removeChild(modal);
  });

  document.getElementById("cancelAction").addEventListener("click", () => {
    document.body.removeChild(modal);
  });
}

function searchExpenses() {
  const month = monthSelect.value.substring(0, 7);
  const searchTerm = searchInput.value.toLowerCase();

  if (!searchTerm) {
    loadMonthData();
    return;
  }

  const userBudget = budgets.find((b) => b.email === currentUser.email);
  const monthData = userBudget?.monthly[month];

  if (!monthData) return;

  const filteredExpenses = monthData.expenses.filter(
    (expense) =>
      expense.note.toLowerCase().includes(searchTerm) ||
      expense.category.toLowerCase().includes(searchTerm)
  );

  // Display filtered results
  expensesHistory.innerHTML = filteredExpenses
    .map(
      (expense, index) => `
    <div class="content2">
        <div class="item">
            ${expense.date} - ${expense.category}: ${
        expense.note
      } (${expense.amount.toLocaleString()} VND)
        </div>
        <div class="item_button">
            <button onclick="deleteExpense(${monthData.expenses.indexOf(
              expense
            )})">Xóa</button>
        </div>
    </div>
`
    )
    .join("");

  // Update pagination for search results (optional)
  updatePaginationButtons(filteredExpenses.length);
}

function sortExpenses() {
  const month = monthSelect.value.substring(0, 7);
  const sortValue = sortExpense.value;

  if (!sortValue) return;

  const userBudget = budgets.find((b) => b.email === currentUser.email);
  const monthData = userBudget?.monthly[month];

  if (!monthData) return;

  let sortedExpenses = [...monthData.expenses];

  if (sortValue === "asc") {
    sortedExpenses.sort((a, b) => a.amount - b.amount);
  } else if (sortValue === "desc") {
    sortedExpenses.sort((a, b) => b.amount - a.amount);
  }

  // Display sorted results
  expensesHistory.innerHTML = sortedExpenses
    .slice(0, itemsPerPage)
    .map(
      (expense, index) => `
    <div class="content2">
        <div class="item">
            ${expense.date} - ${expense.category}: ${
        expense.note
      } (${expense.amount.toLocaleString()} VND)
        </div>
        <div class="item_button">
            <button onclick="deleteExpense(${monthData.expenses.indexOf(
              expense
            )})">Xóa</button>
        </div>
    </div>
`
    )
    .join("");

  // Update pagination for sorted results
  updatePaginationButtons(sortedExpenses.length);
}

function handlePagination(e) {
  const month = monthSelect.value.substring(0, 7);
  const userBudget = budgets.find((b) => b.email === currentUser.email);
  const monthData = userBudget?.monthly[month];

  if (!monthData) return;

  const totalPages = Math.ceil(monthData.expenses.length / itemsPerPage);

  if (e.target.textContent === "Previous" && currentPage > 1) {
    currentPage--;
  } else if (e.target.textContent === "Next" && currentPage < totalPages) {
    currentPage++;
  } else if (!isNaN(parseInt(e.target.textContent))) {
    currentPage = parseInt(e.target.textContent);
  }

  updateExpenseHistory(monthData);
}

function updatePaginationButtons(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationContainer = document.querySelector(".move");

  if (totalPages <= 1) {
    paginationContainer.style.display = "none";
    return;
  }

  paginationContainer.style.display = "flex";

  // Clear existing number buttons
  const buttons = paginationContainer.querySelectorAll(".button");
  buttons.forEach((button) => button.remove());

  // Add number buttons
  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.className = "button";
    button.textContent = i;
    button.addEventListener("click", handlePagination);

    if (i === currentPage) {
      button.style.backgroundColor = "#3B82F6";
      button.style.color = "white";
    }

    // Insert before the "Next" button
    const nextButton = paginationContainer.querySelector(".item2");
    paginationContainer.insertBefore(button, nextButton);
  }
}
