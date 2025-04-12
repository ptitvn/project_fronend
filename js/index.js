// Data storage
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
// Đổi budgets từ object sang mảng
let monthlyCategories =
  JSON.parse(localStorage.getItem("monthlyCategories")) || [];
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

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
let nextCategoryId = monthlyCategories.reduce((maxId, monthData) => {
    return Math.max(maxId, ...(monthData.categories?.map(cat => cat.id) || [0]));
}, 0) + 1;
let nextTransactionId = transactions.reduce((maxId, trans) => Math.max(maxId, trans.id || 0), 0) + 1;

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

//  Hiển thị một hộp thoại xác nhận đăng xuất cho người dùng.
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
// Lưu ngân sách đã nhập cho tháng được chọn vào localStorage
function saveBudget() {
  const month = monthSelect.value.substring(0, 7);
  const budget = parseFloat(budgetInput.value);

  if (!budget || isNaN(budget)) {
    showAlertModal("Vui lòng nhập số tiền ngân sách");
    return;
  }

  let monthData = monthlyCategories.find((b) => b.month === month);
  if (!monthData) {
    monthData = { month: month, categories: [], amount: 0 };
    monthlyCategories.push(monthData);
  }
  monthData.amount = budget;

  localStorage.setItem("monthlyCategories", JSON.stringify(monthlyCategories));
  localStorage.setItem("transactions", JSON.stringify(transactions));

  loadMonthData();
  budgetInput.value = "";
}
// Thêm một danh mục chi tiêu mới (với tên và giới hạn) cho tháng được chọn vào localStorage.
function addCategory() {
  const month = monthSelect.value.substring(0, 7);
  const name = categoryName.value.trim();
  const limit = parseFloat(categoryLimit.value);

  if (!name) {
    showAlertModal("Vui lòng nhập tên danh mục");
    return;
  }

  if (!limit || isNaN(limit) || limit <= 0) {
    showAlertModal("Vui lòng nhập giới hạn chi tiêu hợp lệ (số dương)");
    return;
  }

  let monthData = monthlyCategories.find((b) => b.month === month);
  if (!monthData) {
    monthData = { month: month, categories: [], amount: 0 };
    monthlyCategories.push(monthData);
  }

  const existingCategory = monthData.categories.find(
    (cat) => cat.name.toLowerCase() === name.toLowerCase()
  );

  if (existingCategory) {
    showAlertModal("Danh mục này đã tồn tại");
    return;
  }

  monthData.categories.push({
    id: nextCategoryId++,
    name: name,
    budget: limit,
  });

  localStorage.setItem("monthlyCategories", JSON.stringify(monthlyCategories));
  loadMonthData();

  categoryName.value = "";
  categoryLimit.value = "";
  categoryName.focus();
}
// Thêm một giao dịch chi tiêu mới (với số tiền, danh mục, ghi chú) vào localStorage.
function addExpense() {
  const month = monthSelect.value.substring(0, 7);
  const amount = parseFloat(expenseAmount.value);
  const categoryName = expenseCategory.value;
  const note = expenseNote.value;

  if (!amount || isNaN(amount)) {
    showAlertModal("Vui lòng nhập số tiền");
    return;
  }

  if (!categoryName) {
    showAlertModal("Vui lòng chọn danh mục");
    return;
  }

  if (!note) {
    showAlertModal("Vui lòng nhập ghi chú");
    return;
  }

  const category = getCategoryByName(month, categoryName);
  const categoryId = category ? category.id : null;

  const newTransaction = {
    id: nextTransactionId++,
    userId: currentUser.id,
    month: month,
    categoryId: categoryId,
    amount: amount,
    date: new Date().toISOString().slice(0, 10),
    note: note,
  };
  transactions.push(newTransaction);

  localStorage.setItem("transactions", JSON.stringify(transactions));
  loadMonthData();
  expenseAmount.value = "";
  expenseNote.value = "";
}
//Tìm một danh mục theo tên trong dữ liệu của tháng cụ thể.
function getCategoryByName(month, name) {
  const monthData = monthlyCategories.find((b) => b.month === month);
  return monthData?.categories.find((cat) => cat.name === name);
}
//Tìm một danh mục theo ID trong dữ liệu của tháng cụ thể.
function getCategoryById(month, id) {
  const monthData = monthlyCategories.find((b) => b.month === month);
  return monthData?.categories.find((cat) => cat.id === id);``
}
//Tải dữ liệu (ngân sách, danh mục, giao dịch) cho tháng được chọn và cập nhật giao diện người dùng.
function loadMonthData() {
    const month = monthSelect.value.substring(0, 7);
    currentPage = 1; // Reset về trang 1 khi tải lại dữ liệu tháng

    const monthBudget =
        monthlyCategories.find((b) => b.month === month)?.amount || 0;
    const currentMonthTransactions = transactions.filter(
        (t) => t.month === month && t.userId === currentUser.id
    );
    const totalSpent = currentMonthTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
    );

    remainingAmount.textContent =
        (monthBudget - totalSpent).toLocaleString() + " VND";

    const monthCategories =
        monthlyCategories.find((b) => b.month === month)?.categories || [];
    updateCategoryList(monthCategories, currentMonthTransactions);
    updateExpenseHistory(currentMonthTransactions); // Gọi với toàn bộ dữ liệu ban đầu
    updateCategoryDropdown(monthCategories);

    let warningText = "";
    monthCategories.forEach((category) => {
        const categoryExpenses = currentMonthTransactions.filter(
            (t) => t.categoryId === category.id
        );
        const categoryTotalSpent = categoryExpenses.reduce(
            (sum, t) => sum + t.amount,
            0
        );
        if (categoryTotalSpent > category.budget) {
            warningText += `Danh mục ${
                category.name
            } đã vượt giới hạn: ${categoryTotalSpent.toLocaleString()} / ${category.budget.toLocaleString()} VND<br>`;
        }
    });

    budgetWarning.innerHTML = warningText;

    updateMonthlyStats();
}
//Hiển thị một hộp thoại để sửa thông tin của một danh mục chi tiêu.
function editCategory(categoryId) {
  showEditCategoryModal(categoryId);
}
//Cập nhật danh sách các danh mục chi tiêu hiển thị trên trang.
function updateCategoryList(categories, currentMonthTransactions) {
  categoriesList.innerHTML = categories
    .map((category) => {
      const categoryExpenses = currentMonthTransactions.filter(
        (t) => t.categoryId === category.id
      );
      const categoryTotalSpent = categoryExpenses.reduce(
        (sum, t) => sum + t.amount,
        0
      );
      const budgetExceeded = categoryTotalSpent > category.budget;
      const warningClass = budgetExceeded ? "budget-exceeded" : "";

      return `
           <div class="content2">
            <div class="item">${
              category.name
            } - Giới hạn: ${category.budget.toLocaleString()} VND </div>
            <div class="item_button">
                <button onclick="editCategory(${category.id})">Sửa</button>
                <button onclick="deleteCategory(${category.id})">Xóa</button>
            </div>
        </div>
        `;
    })
    .join("");
}
//Hiển thị hộp thoại chỉnh sửa danh mục với thông tin hiện tại của danh mục đó.
function showEditCategoryModal(categoryId) {
  const month = monthSelect.value.substring(0, 7);
  const category = getCategoryById(month, categoryId);

  if (!category) {
    showAlertModal("Không tìm thấy danh mục");
    return;
  }
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
        <div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" style="background: white; padding: 20px; border-radius: 8px; width: 300px;">
            <div class="bg-white p-6 rounded-lg shadow-lg w-96">
                <h3 class="text-xl font-bold mb-4">Sửa danh mục</h3>
                <input type="text" id="editCategoryName" value="${category.name}"
                       class="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Tên danh mục">
                <input type="number" id="editCategoryBudget" value="${category.budget}"
                       class="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Giới hạn (VND)">
                <div class="flex justify-between mt-4" style="display: flex; justify-content: space-between; margin-top: 20px;" >
                    <button id="confirmEdit"style="padding: 8px 16px; background: #4F46E5; color: white; border: none; border-radius: 4px;" data-category-id="${categoryId}"
                            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Lưu</button>
                    <button id="cancelEdit" style="padding: 8px 16px; background: #f0f0f0; border: none; border-radius: 4px;"
                            class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Hủy</button>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  const confirmEditBtn = modal.querySelector("#confirmEdit");
  const cancelEditBtn = modal.querySelector("#cancelEdit");
  const editCategoryNameInput = modal.querySelector("#editCategoryName");
  const editCategoryBudgetInput = modal.querySelector("#editCategoryBudget");

  confirmEditBtn.addEventListener("click", () => {
    const newName = editCategoryNameInput.value.trim();
    const newBudget = parseFloat(editCategoryBudgetInput.value);
    const categoryIdToEdit = parseInt(confirmEditBtn.dataset.categoryId);

    if (!newName || !newBudget || isNaN(newBudget)) {
      showAlertModal("Vui lòng nhập thông tin hợp lệ");
      return;
    }

    const monthData = monthlyCategories.find((b) => b.month === month);
    const categoryIndex = monthData?.categories.findIndex(
      (cat) => cat.id === categoryIdToEdit
    );

    if (monthData && categoryIndex !== -1) {
      monthData.categories[categoryIndex].name = newName;
      monthData.categories[categoryIndex].budget = newBudget;
      localStorage.setItem(
        "monthlyCategories",
        JSON.stringify(monthlyCategories)
      );
      loadMonthData();
      document.body.removeChild(modal);
    } else {
      showAlertModal("Không tìm thấy danh mục để sửa");
    }
  });

  cancelEditBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });
}
//Xóa một danh mục chi tiêu khỏi localStorage.
function deleteCategory(categoryId) {
  const month = monthSelect.value.substring(0, 7);
  const categoryToDelete = getCategoryById(month, categoryId);

  if (!categoryToDelete) return;

  showDeleteConfirmationModal(
    `Bạn có chắc chắn muốn xóa danh mục "${categoryToDelete.name}"? `,
    () => {
      const monthData = monthlyCategories.find((b) => b.month === month);
      if (monthData) {
        monthData.categories = monthData.categories.filter(
          (cat) => cat.id !== categoryId
        );
        localStorage.setItem(
          "monthlyCategories",
          JSON.stringify(monthlyCategories)
        );

        // Tùy chọn, có thể muốn xử lý các giao dịch liên quan đến danh mục này
        //Để đơn giản,chỉ cần loại bỏ chúng.
        transactions = transactions.filter(
          (trans) => trans.month === month && trans.categoryId === categoryId
        );
        localStorage.setItem("transactions", JSON.stringify(transactions));

        loadMonthData();
      }
    }
  );
}
//Xóa một giao dịch chi tiêu khỏi localStorage
function deleteExpense(expenseId) {
  showDeleteConfirmationModal(
    "Bạn có chắc chắn muốn xóa giao dịch này?",
    () => {
      const initialLength = transactions.length;
      transactions = transactions.filter((exp) => exp.id !== expenseId);
      if (transactions.length < initialLength) {
        localStorage.setItem("transactions", JSON.stringify(transactions));
        loadMonthData();
      }
    }
  );
}
// Cập nhật lịch sử các giao dịch chi tiêu hiển thị trên trang, có hỗ trợ phân trang.
function updateExpenseHistory(expenses) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedExpenses = expenses.slice(startIndex, endIndex);

    expensesHistory.innerHTML = paginatedExpenses
        .map((expense) => {
            const category =
                getCategoryById(expense.month, expense.categoryId)?.name || "Khác";
            const categoryData = getCategoryById(expense.month, expense.categoryId);
            const budgetExceeded =
                categoryData && expense.amount > categoryData.budget;
            const warningClass = budgetExceeded ? "warning" : "";

            return `
                <div class="content2">
                    <div class="item">
                        ${new Date(expense.date).toLocaleDateString()} - ${category}: ${expense.note} (${expense.amount.toLocaleString()} VND)
                        ${
                            budgetExceeded
                                ? `<span class="${warningClass}"> (${expense.amount.toLocaleString()} / ${categoryData.budget.toLocaleString()})</span>`: ""
                        }
                    </div>
                    <div class="item_button">
                        <button onclick="deleteExpense(${expense.id})">Xóa</button>
                    </div>
                </div>
            `;
        })
        .join("");

    updatePaginationButtons(expenses.length);
}

//Cập nhật danh sách các danh mục hiển thị trong dropdown (ví dụ: khi thêm chi phí).
function updateCategoryDropdown(categories) {
  expenseCategory.innerHTML =
    '<option value="">Chọn danh mục</option>' +
    categories
      .map(
        (category) => `
                    <option value="${category.name}">${category.name}</option>
                `
      )
      .join("") +
    '<option value="Khác">Khác</option>';
}
//Cập nhật thống kê ngân sách và chi tiêu cho các tháng gần đây.
function updateMonthlyStats() {
  const monthlyData = monthlyCategories
    .filter((data) => data.categories && data.categories.length > 0)
    .sort((a, b) => new Date(b.month + "-01") - new Date(a.month + "-01"))
    .slice(0, 3);

  monthlyStats.innerHTML = monthlyData
    .map((monthData) => {
      const totalBudget = monthData.amount || 0;
      const monthTransactions = transactions.filter(
        (t) => t.month === monthData.month && t.userId === currentUser.id
      );
      const totalSpent = monthTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
      );
      const status = totalSpent > totalBudget ? "❌ Vượt" : "✅ Đạt";
      return `
                <div class="item">
                    <span>${monthData.month}</span>
                    <span>${totalSpent.toLocaleString() || 0} VND</span>
                    <span>${totalBudget.toLocaleString() || 0} VND</span>
                    <span>${status}</span>
                </div>
            `;
    })
    .join("");
}
//Hiển thị một hộp thoại thông báo đơn giản cho người dùng
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
//Hiển thị một hộp thoại xác nhận xóa cho người dùng.
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

//Lọc và hiển thị các giao dịch chi tiêu dựa trên từ khóa tìm kiếm (chỉ theo nội dung)
function searchExpenses() {
    const month = monthSelect.value.substring(0, 7);
    const searchTerm = searchInput.value.toLowerCase();

    if (!searchTerm) {
        loadMonthData();
        return;
    }

    const currentMonthTransactions = transactions.filter(
        (t) => t.month === month && t.userId === currentUser.id
    );

    const filteredExpenses = currentMonthTransactions.filter(
        (expense) =>
            expense.note.toLowerCase().includes(searchTerm)
    );

    updateExpenseHistory(filteredExpenses);
}
//Sắp xếp các giao dịch chi tiêu theo số tiền (tăng dần hoặc giảm dần).
function sortExpenses() {
  const month = monthSelect.value.substring(0, 7);
  const sortValue = sortExpense.value;
  const currentMonthTransactions = transactions.filter(
    (t) => t.month === month && t.userId === currentUser.id
  );

  if (!sortValue) {
    updateExpenseHistory(currentMonthTransactions);
    return;
  }

  let sortedExpenses = [...currentMonthTransactions];

  if (sortValue === "asc") {
    sortedExpenses.sort((a, b) => a.amount - b.amount);
  } else if (sortValue === "desc") {
    sortedExpenses.sort((a, b) => b.amount - a.amount);
  }

  updateExpenseHistory(sortedExpenses);
}
//Xử lý việc chuyển đổi giữa các trang trong lịch sử chi tiêu.
function handlePagination(e) {
    const month = monthSelect.value.substring(0, 7);
    const currentMonthTransactions = transactions.filter(
        (t) => t.month === month && t.userId === currentUser.id
    );
    const totalPages = Math.ceil(currentMonthTransactions.length / itemsPerPage);

    if (e.target.textContent === "Previous" && currentPage > 1) {
        currentPage--;
    } else if (e.target.textContent === "Next" && currentPage < totalPages) {
        currentPage++;
    } else if (!isNaN(parseInt(e.target.textContent))) {
        currentPage = parseInt(e.target.textContent);
    }

    // Gọi updateExpenseHistory với dữ liệu đã được phân trang
    updateExpenseHistory(currentMonthTransactions);
}
//Cập nhật các nút phân trang dựa trên tổng số mục và số mục trên mỗi trang.
function updatePaginationButtons(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationContainer = document.querySelector(".move");

  if (totalPages <= 1) {
    paginationContainer.style.display = "none";
    return;
  }

  paginationContainer.style.display = "flex";

  // Xóa các nút số hiện có
  const buttons = paginationContainer.querySelectorAll(".button");
  buttons.forEach((button) => button.remove());

  // Thêm các nút số
  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.className = "button";
    button.textContent = i;
    button.addEventListener("click", handlePagination);

    if (i === currentPage) {
      button.style.backgroundColor = "#3B82F6";
      button.style.color = "white";
    }

    // Chèn trước nút "Tiếp theo"
    const nextButton = paginationContainer.querySelector(".item2");
    paginationContainer.insertBefore(button, nextButton);
  }
}
