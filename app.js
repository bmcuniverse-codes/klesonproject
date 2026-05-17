const STORAGE_KEY = "klesonFinanceDataV1";
const USER_KEY = "klesonFinanceUserV1";

const incomeCategories = ["Salary", "Gift", "Business", "Allowance", "Compensation", "Other"];
const expenseCategories = ["Food", "Transport", "Data", "Rent", "School Fees", "Utilities", "Health", "Entertainment", "Savings", "Other"];

let chartType = "pie";
let mainChart = null;
let categoryChart = null;
let deferredPrompt = null;

let state = loadState();
let user = loadUser();

const $ = (id) => document.getElementById(id);

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return {
    budget: 150000,
    transactions: demoTransactions(),
    demoLoaded: true
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadUser() {
  const saved = localStorage.getItem(USER_KEY);
  return saved ? JSON.parse(saved) : {
    name: "Adepoju Ayomide",
    email: "student@example.com",
    department: "Computer Science Department",
    school: "Lagos State University of Science and Technology"
  };
}

function saveUser() {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function demoTransactions() {
  const now = new Date();
  const ym = now.toISOString().slice(0, 7);
  return [
    tx(85000, "income", "Salary", `${ym}-02`, "Monthly salary"),
    tx(35000, "income", "Gift", `${ym}-05`, "Support gift"),
    tx(18500, "expense", "Food", `${ym}-06`, "Groceries"),
    tx(12000, "expense", "Transport", `${ym}-07`, "Bus and ride fare"),
    tx(6500, "expense", "Data", `${ym}-08`, "Internet bundle"),
    tx(22000, "expense", "School Fees", `${ym}-10`, "Academic payment"),
    tx(8000, "expense", "Entertainment", `${ym}-12`, "Weekend outing")
  ];
}

function tx(amount, type, category, date, note = "") {
  return { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()), amount, type, category, date, note };
}

function formatNaira(amount) {
  return `₦${Number(amount || 0).toLocaleString("en-NG")}`;
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function validateAmount(value) {
  const raw = String(value).trim();
  if (!raw || Number(raw) <= 0) return "Amount must be greater than zero.";
  if (/^0\d+/.test(raw)) return "Amount cannot start with zero.";
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return "Enter a valid amount.";
  return null;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getFilteredTransactions() {
  const search = ($("searchInput")?.value || "").toLowerCase();
  const month = $("monthFilter")?.value || currentMonth();
  const type = $("typeFilter")?.value || "all";
  const category = $("categoryFilter")?.value || "all";

  return state.transactions.filter((item) => {
    const matchesSearch = !search || `${item.type} ${item.category} ${item.note} ${item.amount}`.toLowerCase().includes(search);
    const matchesMonth = !month || item.date.startsWith(month);
    const matchesType = type === "all" || item.type === type;
    const matchesCategory = category === "all" || item.category === category;
    return matchesSearch && matchesMonth && matchesType && matchesCategory;
  });
}

function totals(records = getFilteredTransactions()) {
  const income = records.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = records.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, balance: income - expense };
}

function categoryExpenseMap(records = getFilteredTransactions()) {
  return records.filter(t => t.type === "expense").reduce((map, t) => {
    map[t.category] = (map[t.category] || 0) + t.amount;
    return map;
  }, {});
}

function setDefaultDates() {
  const today = new Date().toISOString().slice(0, 10);
  if ($("date")) $("date").value = today;
  if ($("monthFilter") && !$("monthFilter").value) $("monthFilter").value = currentMonth();
}

function updateCategoryOptions() {
  const type = $("type").value;
  const categories = type === "income" ? incomeCategories : expenseCategories;
  $("category").innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join("");
}

function updateFilterCategoryOptions() {
  const allCats = [...new Set([...incomeCategories, ...expenseCategories])];
  $("categoryFilter").innerHTML = `<option value="all">All Categories</option>` + allCats.map(c => `<option value="${c}">${c}</option>`).join("");
}

function renderAll() {
  renderUser();
  renderSummary();
  renderTransactions();
  renderProgressBars();
  renderBudget();
  renderReports();
  renderInsights();
  renderCharts();
  saveState();
}

function renderUser() {
  $("userGreeting").textContent = user.name || "Adepoju Ayomide";
  $("profileName").value = user.name || "";
  $("profileDept").value = user.department || "";
  $("profileSchool").value = user.school || "";
}

function renderSummary() {
  const { income, expense, balance } = totals();
  $("incomeTotal").textContent = formatNaira(income);
  $("expenseTotal").textContent = formatNaira(expense);
  $("balanceTotal").textContent = formatNaira(balance);

  const score = calculateHealthScore(income, expense);
  $("healthScore").textContent = `${score}%`;
  $("healthText").textContent = score >= 70 ? "Healthy spending" : score >= 40 ? "Moderate caution" : "Needs attention";
}

function calculateHealthScore(income, expense) {
  if (income <= 0 && expense <= 0) return 0;
  if (income <= 0) return 20;
  const ratio = expense / income;
  return Math.max(5, Math.min(100, Math.round(100 - ratio * 70)));
}

function renderTransactions() {
  const list = $("transactionList");
  const records = getFilteredTransactions().sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!records.length) {
    list.innerHTML = `<div class="disclaimer">No transaction found for this filter. Add a new record or change your search.</div>`;
    return;
  }

  list.innerHTML = records.map(item => `
    <article class="transaction-item reveal" data-id="${item.id}">
      <div>
        <strong>${item.type === "income" ? "🟢" : "🔴"} ${item.category}</strong>
        <div class="transaction-meta">
          <span>${item.type.toUpperCase()}</span>
          <span>${item.date}</span>
          <span>${item.note || "No note"}</span>
        </div>
      </div>
      <div class="button-row">
        <span class="${item.type === "income" ? "amount-income" : "amount-expense"}">${formatNaira(item.amount)}</span>
        <button class="icon-btn" onclick="deleteTransaction('${item.id}')">×</button>
      </div>
    </article>
  `).join("");

  addSwipeHandlers();
}

function addSwipeHandlers() {
  document.querySelectorAll(".transaction-item").forEach(item => {
    let startX = 0;
    item.addEventListener("touchstart", e => startX = e.touches[0].clientX, { passive: true });
    item.addEventListener("touchend", e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (diff > 75) deleteTransaction(item.dataset.id);
    });
  });
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter(item => item.id !== id);
  showToast("Transaction deleted");
  renderAll();
}

function renderProgressBars() {
  const holder = $("expenseProgress");
  const map = categoryExpenseMap();
  const budget = Number(state.budget || 0);

  if (!Object.keys(map).length) {
    holder.innerHTML = `<div class="disclaimer">No expenses yet. Expense category progress bars will appear here.</div>`;
    return;
  }

  holder.innerHTML = Object.entries(map).map(([category, amount]) => {
    const percent = budget > 0 ? Math.min(100, Math.round((amount / budget) * 100)) : 0;
    return `
      <div class="progress-row">
        <div class="progress-top"><span>${category}</span><span>${formatNaira(amount)} • ${percent}%</span></div>
        <div class="progress-track"><span style="width:${percent}%"></span></div>
      </div>
    `;
  }).join("");
}

function renderBudget() {
  const { expense } = totals();
  const budget = Number(state.budget || 0);
  const remaining = budget - expense;
  const percent = budget > 0 ? Math.min(100, Math.round((expense / budget) * 100)) : 0;

  $("budgetAmount").textContent = formatNaira(budget);
  $("budgetSpent").textContent = formatNaira(expense);
  $("budgetRemaining").textContent = formatNaira(remaining);
  $("budgetInput").value = budget || "";
  $("budgetBar").style.width = `${percent}%`;
}

function renderReports() {
  const records = getFilteredTransactions();
  const { income, expense, balance } = totals(records);
  const map = categoryExpenseMap(records);
  const highest = Object.entries(map).sort((a, b) => b[1] - a[1])[0];

  $("reportCards").innerHTML = `
    <article class="report-card"><span>Income</span><strong>${formatNaira(income)}</strong></article>
    <article class="report-card"><span>Expenses</span><strong>${formatNaira(expense)}</strong></article>
    <article class="report-card"><span>Balance</span><strong>${formatNaira(balance)}</strong></article>
    <article class="report-card"><span>Total Records</span><strong>${records.length}</strong></article>
    <article class="report-card"><span>Highest Expense</span><strong>${highest ? highest[0] : "None"}</strong></article>
    <article class="report-card"><span>Budget</span><strong>${formatNaira(state.budget)}</strong></article>
  `;
}

function renderInsights() {
  const { income, expense, balance } = totals();
  const map = categoryExpenseMap();
  const highest = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
  const insights = [];

  if (!state.transactions.length) insights.push("Start by adding your first income or expense record.");
  if (expense > Number(state.budget || 0) && Number(state.budget || 0) > 0) insights.push("Your expenses have exceeded your monthly budget. Reduce non-essential spending.");
  if (income > 0 && expense / income > 0.75) insights.push("You are spending more than 75% of your income. Consider increasing savings or reducing expenses.");
  if (highest) insights.push(`${highest[0]} is currently your highest spending category at ${formatNaira(highest[1])}.`);
  if (balance > 0) insights.push("You have a positive balance. Consider setting aside part of it as savings.");
  if (!insights.length) insights.push("Your financial activity looks balanced based on the current records.");

  $("insightList").innerHTML = insights.map(text => `<div class="insight">${text}</div>`).join("");
}

function renderCharts() {
  const { income, expense } = totals();
  const ctx = $("mainChart");
  if (mainChart) mainChart.destroy();
  mainChart = new Chart(ctx, {
    type: chartType,
    data: {
      labels: chartType === "pie" ? ["Income", "Expense"] : ["Income", "Expense"],
      datasets: [{ label: "Amount", data: [income, expense], backgroundColor: ["#10b981", "#ef4444"], borderRadius: 12 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
  });

  const map = categoryExpenseMap();
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart($("categoryChart"), {
    type: "bar",
    data: {
      labels: Object.keys(map),
      datasets: [{ label: "Category Expenses", data: Object.values(map), backgroundColor: "#10b981", borderRadius: 12 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
}

function switchPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
  $(`${page}Page`).classList.add("active-page");
  document.querySelectorAll(".nav-link,.mobile-nav").forEach(btn => btn.classList.toggle("active", btn.dataset.page === page));
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(renderCharts, 50);
}

function addTransaction(e) {
  e.preventDefault();
  const amountError = validateAmount($("amount").value);
  if (amountError) return alert(amountError);
  if (!$("date").value) return alert("Please select a date.");

  state.transactions.push(tx(Number($("amount").value), $("type").value, $("category").value, $("date").value, $("note").value.trim()));
  $("transactionForm").reset();
  setDefaultDates();
  updateCategoryOptions();
  showToast("Transaction added successfully");
  renderAll();
}

function setBudget() {
  const error = validateAmount($("budgetInput").value);
  if (error) return alert(error);
  state.budget = Number($("budgetInput").value);
  showToast("Budget updated");
  renderAll();
}

function resetBudget() {
  if (!confirm("Reset monthly budget?")) return;
  state.budget = 0;
  showToast("Budget reset");
  renderAll();
}

function resetApp() {
  if (!confirm("This will delete all transactions, budget, and profile data on this browser. Continue?")) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USER_KEY);
  state = { budget: 0, transactions: [], demoLoaded: false };
  user = loadUser();
  showToast("App reset complete");
  renderAll();
}

function exportCSV() {
  const records = getFilteredTransactions();
  let csv = "Type,Category,Amount,Date,Note\n";
  records.forEach(t => {
    csv += `${t.type},${t.category},${t.amount},${t.date},"${(t.note || "").replaceAll('"', '""')}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kleson-finance-report.csv";
  a.click();
  URL.revokeObjectURL(url);
  showToast("CSV report exported");
}

function openGuide() { $("guideModal").classList.remove("hidden"); }
function closeGuide() { $("guideModal").classList.add("hidden"); localStorage.setItem("klesonGuideSeen", "yes"); }
function openLogin() { $("loginModal").classList.remove("hidden"); }
function closeLogin() { $("loginModal").classList.add("hidden"); }

function init() {
  setTimeout(() => {
    $("loader").classList.add("hidden");
    $("introPage").classList.remove("hidden");
  }, 2200);

  setDefaultDates();
  updateCategoryOptions();
  updateFilterCategoryOptions();
  renderAll();

  $("proceedBtn").addEventListener("click", () => {
    $("introPage").classList.add("hidden");
    $("app").classList.remove("hidden");
    if (!localStorage.getItem("klesonGuideSeen")) openGuide();
    setTimeout(renderCharts, 80);
  });

  $("viewGuideBtn").addEventListener("click", openGuide);
  $("guideBtn").addEventListener("click", openGuide);
  $("closeGuideBtn").addEventListener("click", closeGuide);
  $("understoodGuideBtn").addEventListener("click", closeGuide);
  $("openLoginFromIntro").addEventListener("click", openLogin);
  $("closeLoginBtn").addEventListener("click", closeLogin);

  document.querySelectorAll(".nav-link,.mobile-nav").forEach(btn => btn.addEventListener("click", () => switchPage(btn.dataset.page)));
  $("type").addEventListener("change", updateCategoryOptions);
  $("transactionForm").addEventListener("submit", addTransaction);
  $("setBudgetBtn").addEventListener("click", setBudget);
  $("resetBudgetBtn").addEventListener("click", resetBudget);
  $("resetAllBtn").addEventListener("click", resetApp);
  $("toggleChartBtn").addEventListener("click", () => { chartType = chartType === "pie" ? "bar" : "pie"; renderCharts(); });
  $("exportCsvBtn").addEventListener("click", exportCSV);
  $("printReportBtn").addEventListener("click", () => window.print());
  ["searchInput", "monthFilter", "typeFilter", "categoryFilter"].forEach(id => $(id).addEventListener("input", renderAll));

  $("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    user.name = $("profileName").value.trim() || "Adepoju Ayomide";
    user.department = $("profileDept").value.trim();
    user.school = $("profileSchool").value.trim();
    saveUser();
    showToast("Profile saved");
    renderUser();
  });

  $("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    user.name = $("loginName").value.trim();
    user.email = $("loginEmail").value.trim();
    saveUser();
    closeLogin();
    showToast("Demo login successful");
    renderUser();
  });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    $("installBtn").hidden = false;
  });

  $("installBtn").addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt = null;
    $("installBtn").hidden = true;
  });

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
}

init();
