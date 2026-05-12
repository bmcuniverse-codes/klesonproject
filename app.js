const amountEl = document.getElementById("amount");
const type = document.getElementById("type");
const category = document.getElementById("category");
const date = document.getElementById("date");

const list = document.getElementById("list");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const balanceEl = document.getElementById("balance");
const remaining = document.getElementById("remaining");

const chartEl = document.getElementById("chart");
const budgetInput = document.getElementById("budgetInput");
const modal = document.getElementById("modal");
const installBtn = document.getElementById("installBtn");
const monthFilter = document.getElementById("monthFilter");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let budget = localStorage.getItem("budget") || 0;
let chart, deferredPrompt;

const incomeCats = ["Salary", "Gift", "Bonus"];
const expenseCats = ["Food", "Transport", "Data", "Rent"];

function format(n) {
  return n.toLocaleString();
}

function updateCategory() {
  let type = document.getElementById("type").value;
  let cat = document.getElementById("category");
  cat.innerHTML = "";
  (type === "income" ? incomeCats : expenseCats).forEach((c) => {
    let o = document.createElement("option");
    o.text = c;
    cat.appendChild(o);
  });
}
updateCategory();

function addTransaction() {
  let amount = amountEl.value;

  if (amount.startsWith("0") || amount <= 0) return alert("Invalid amount");

  let t = {
    id: Date.now(),
    amount: Number(amount),
    type: type.value,
    category: category.value,
    date: date.value,
  };

  transactions.push(t);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  render();
}

function render() {
  list.innerHTML = "";
  let income = 0,
    expense = 0;

  transactions.forEach((t) => {
    let li = document.createElement("li");
    li.className = "bg-white p-2 rounded shadow fade flex justify-between";

    li.innerHTML = `
      <span>${t.category} - ₦${format(t.amount)}</span>
      <span>${t.type === "income" ? "🟢" : "🔴"}</span>
    `;

    // swipe delete
    let startX = 0;
    li.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX));
    li.addEventListener("touchend", (e) => {
      let endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) {
        transactions = transactions.filter((x) => x.id !== t.id);
        localStorage.setItem("transactions", JSON.stringify(transactions));
        render();
      }
    });

    list.appendChild(li);

    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  });

  incomeEl.innerText = format(income);
  expenseEl.innerText = format(expense);
  balanceEl.innerText = format(income - expense);
  remaining.innerText = format(budget - expense);

  renderChart(income, expense);
}

function renderChart(income, expense) {
  if (chart) chart.destroy();
  chart = new Chart(chartEl, {
    type: "pie",
    data: {
      labels: ["Income", "Expense"],
      datasets: [{ data: [income, expense] }],
    },
  });
}

function setBudget() {
  budget = budgetInput.value;
  localStorage.setItem("budget", budget);
  render();
}

function resetBudget() {
  budget = 0;
  localStorage.removeItem("budget");
  render();
}

function exportCSV() {
  let csv = "Type,Category,Amount\n";
  transactions.forEach((t) => (csv += `${t.type},${t.category},${t.amount}\n`));
  let blob = new Blob([csv]);
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "report.csv";
  a.click();
}

// PWA install
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", () => {
  deferredPrompt.prompt();
});

// modal
if (!localStorage.getItem("seen")) {
  modal.classList.remove("hidden");
}
function closeModal() {
  modal.classList.add("hidden");
  localStorage.setItem("seen", "yes");
}

function resetApp() {
  const confirmReset = confirm("This will delete all your data. Continue?");

  if (!confirmReset) return;

  // Clear everything
  localStorage.clear();

  // Reset variables
  transactions = [];
  budget = 0;

  // Clear inputs
  budgetInput.value = "";
  amountEl.value = "";

  // Reset UI
  render();
}

monthFilter.addEventListener("change", render);

render();
