// User management system
const users = JSON.parse(localStorage.getItem('bankUsers')) || {};

// Demo user for testing
if (!users['rahulkumar773954@gmail.com']) {
    users['rahulkumar773954@gmail.com'] = {
        password: 'rahul123',
        name: 'Rahul Kumar',
        accounts: {
            savings: 285000.00,
            current: 158473.20,
            credit: 23405.00
        },
        transactions: [
            { type: 'credit', amount: 85000.00, description: 'Salary Credit', date: 'Dec 28, 2024 • 09:30 AM' },
            { type: 'debit', amount: 25000.00, description: 'Rent Payment', date: 'Dec 25, 2024 • 02:15 PM' },
            { type: 'debit', amount: 847.00, description: 'Swiggy Order', date: 'Dec 24, 2024 • 08:45 PM' },
            { type: 'debit', amount: 3499.00, description: 'Amazon Purchase', date: 'Dec 23, 2024 • 11:20 AM' },
            { type: 'credit', amount: 1299.00, description: 'Refund - Flipkart', date: 'Dec 22, 2024 • 03:50 PM' },
            { type: 'debit', amount: 2340.00, description: 'Electricity Bill', date: 'Dec 20, 2024 • 10:00 AM' },
            { type: 'debit', amount: 625.00, description: 'Zomato Order', date: 'Dec 19, 2024 • 07:30 PM' }
        ]
    };
    localStorage.setItem('bankUsers', JSON.stringify(users));
}

// Selected bill and recharge types
let selectedBillType = '';
let selectedRechargeType = '';

// Current user
let currentUser = null;

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userEmail = sessionStorage.getItem('userEmail');

    if (isLoggedIn === 'true' && userEmail) {
        currentUser = users[userEmail];
        if (currentUser) {
            showDashboard();
            updateUserInfo();
            updateAccountBalances();
            renderTransactions();
        }
    }

    // Add event listeners for auth switching
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('registerPage').style.display = 'flex';
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerPage').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
    });
});

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();
    const errorMessage = document.getElementById('errorMessage');

    if (users[email] && users[email].password === password) {
        // Set current user
        currentUser = users[email];

        // Store login state
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userEmail', email);

        // Hide error message
        errorMessage.style.display = 'none';

        // Show success and redirect
        showToast('Login successful! Welcome back.', 'success');

        setTimeout(() => {
            showDashboard();
            updateUserInfo();
            updateAccountBalances();
            renderTransactions();
        }, 1000);
    } else {
        errorMessage.style.display = 'block';
        showToast('Invalid credentials. Please try again.', 'error');
    }
});

// Register Form Handler
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('regErrorMessage');

    if (users[email]) {
        errorMessage.textContent = 'An account with this email already exists.';
        errorMessage.style.display = 'block';
        showToast('An account with this email already exists.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match.';
        errorMessage.style.display = 'block';
        showToast('Passwords do not match.', 'error');
        return;
    }

    if (password.length < 6) {
        errorMessage.textContent = 'Password must be at least 6 characters.';
        errorMessage.style.display = 'block';
        showToast('Password must be at least 6 characters.', 'error');
        return;
    }

    // Create new user
    users[email] = {
        password: password,
        name: name,
        accounts: {
            savings: 50000.00, // Starting balance
            current: 10000.00,
            credit: 0.00
        },
        transactions: [
            { type: 'credit', amount: 50000.00, description: 'Account Opening', date: getCurrentDateTime() }
        ]
    };

    // Save to localStorage
    localStorage.setItem('bankUsers', JSON.stringify(users));

    // Set current user
    currentUser = users[email];

    // Store login state
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userEmail', email);

    // Hide error message
    errorMessage.style.display = 'none';

    // Show success and redirect
    showToast('Account created successfully! Welcome to State Bank.', 'success');

    setTimeout(() => {
        showDashboard();
        updateUserInfo();
        updateAccountBalances();
        renderTransactions();

        // Switch back to login view for future use
        document.getElementById('registerPage').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
    }, 1000);
});

// Transfer Form Handler
document.getElementById('transferForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fromAccount = document.getElementById('fromAccount').value;
    const beneficiary = document.getElementById('beneficiary').value;
    const amount = parseFloat(document.getElementById('transferAmount').value);

    if (processTransfer(fromAccount, beneficiary, amount, 'Quick Transfer')) {
        e.target.reset();
    }
});

// Modal Transfer Form Handler
document.getElementById('modalTransferForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fromAccount = document.getElementById('modalFromAccount').value;
    const beneficiary = document.getElementById('modalBeneficiary').value;
    const amount = parseFloat(document.getElementById('modalAmount').value);
    const description = document.getElementById('modalDescription').value || 'Transfer';

    if (processTransfer(fromAccount, beneficiary, amount, description)) {
        closeTransferModal();
        document.getElementById('modalTransferForm').reset();
    }
});

// Bills Form Handler
document.getElementById('billsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fromAccount = document.getElementById('billsFromAccount').value;
    const idAccount = document.getElementById('billIdAccount').value;
    const amount = parseFloat(document.getElementById('billAmount').value);

    if (!selectedBillType) {
        showToast('Please select a bill type', 'error');
        return;
    }

    if (processBillPayment(fromAccount, idAccount, amount, selectedBillType)) {
        closeBillsModal();
        document.getElementById('billsForm').reset();
        resetBillSelection();
    }
});

// Recharge Form Handler
document.getElementById('rechargeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fromAccount = document.getElementById('rechargeFromAccount').value;
    const number = document.getElementById('rechargeNumber').value;
    const amount = parseFloat(document.getElementById('rechargeAmount').value);

    if (!selectedRechargeType) {
        showToast('Please select a recharge type', 'error');
        return;
    }

    if (processRecharge(fromAccount, number, amount, selectedRechargeType)) {
        closeRechargeModal();
        document.getElementById('rechargeForm').reset();
        resetRechargeSelection();
    }
});

// Process transfer function
function processTransfer(fromAccount, beneficiary, amount, description) {
    if (!fromAccount) {
        showToast('Please select a source account', 'error');
        return false;
    }

    if (amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return false;
    }

    if (currentUser.accounts[fromAccount] < amount) {
        showToast('Insufficient funds for this transfer', 'error');
        return false;
    }

    // Update account balance
    currentUser.accounts[fromAccount] -= amount;

    // Add transaction to history
    currentUser.transactions.unshift({
        type: 'debit',
        amount: amount,
        description: description,
        date: getCurrentDateTime()
    });

    // Update users in localStorage
    users[sessionStorage.getItem('userEmail')] = currentUser;
    localStorage.setItem('bankUsers', JSON.stringify(users));

    // Update UI
    updateAccountBalances();
    renderTransactions();

    showToast(`Transfer of ₹${amount.toLocaleString()} to ${beneficiary} was successful!`, 'success');
    return true;
}

// Process bill payment function
function processBillPayment(fromAccount, idAccount, amount, billType) {
    if (!fromAccount) {
        showToast('Please select a source account', 'error');
        return false;
    }

    if (amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return false;
    }

    if (currentUser.accounts[fromAccount] < amount) {
        showToast('Insufficient funds for this payment', 'error');
        return false;
    }

    // Update account balance
    currentUser.accounts[fromAccount] -= amount;

    // Add transaction to history
    const billNames = {
        electricity: 'Electricity Bill',
        gas: 'Gas Bill',
        phone: 'Phone Bill',
        water: 'Water Bill'
    };

    currentUser.transactions.unshift({
        type: 'debit',
        amount: amount,
        description: billNames[billType],
        date: getCurrentDateTime()
    });

    // Update users in localStorage
    users[sessionStorage.getItem('userEmail')] = currentUser;
    localStorage.setItem('bankUsers', JSON.stringify(users));

    // Update UI
    updateAccountBalances();
    renderTransactions();

    showToast(`Payment of ₹${amount.toLocaleString()} for ${billNames[billType]} was successful!`, 'success');
    return true;
}

// Process recharge function
function processRecharge(fromAccount, number, amount, rechargeType) {
    if (!fromAccount) {
        showToast('Please select a source account', 'error');
        return false;
    }

    if (amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return false;
    }

    if (currentUser.accounts[fromAccount] < amount) {
        showToast('Insufficient funds for this recharge', 'error');
        return false;
    }

    // Update account balance
    currentUser.accounts[fromAccount] -= amount;

    // Add transaction to history
    const rechargeNames = {
        mobile: 'Mobile Recharge',
        broadband: 'Broadband Recharge',
        dth: 'DTH Recharge',
        fastag: 'FASTag Recharge'
    };

    currentUser.transactions.unshift({
        type: 'debit',
        amount: amount,
        description: rechargeNames[rechargeType],
        date: getCurrentDateTime()
    });

    // Update users in localStorage
    users[sessionStorage.getItem('userEmail')] = currentUser;
    localStorage.setItem('bankUsers', JSON.stringify(users));

    // Update UI
    updateAccountBalances();
    renderTransactions();

    showToast(`${rechargeNames[rechargeType]} of ₹${amount.toLocaleString()} was successful!`, 'success');
    return true;
}

// Update user info in UI
function updateUserInfo() {
    const userEmail = sessionStorage.getItem('userEmail');
    if (currentUser && userEmail) {
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userEmail').textContent = userEmail;
        document.getElementById('welcomeMessage').textContent = `Welcome back, ${currentUser.name.split(' ')[0]}! 👋`;

        // Set avatar initials
        const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('userAvatar').textContent = initials;
    }
}

// Update account balances in UI
function updateAccountBalances() {
    if (currentUser) {
        document.getElementById('savingsBalance').textContent = `₹${currentUser.accounts.savings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('currentBalance').textContent = `₹${currentUser.accounts.current.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        document.getElementById('creditBalance').textContent = `₹${currentUser.accounts.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
}

// Render transactions in UI
function renderTransactions() {
    const transactionsList = document.getElementById('transactionsList');
    transactionsList.innerHTML = '';

    if (currentUser && currentUser.transactions) {
        currentUser.transactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item';

            const isCredit = transaction.type === 'credit';

            transactionItem.innerHTML = `
                        <div class="transaction-info">
                            <div class="transaction-icon ${isCredit ? 'credit' : 'debit'}">${isCredit ? '↓' : '↑'}</div>
                            <div class="transaction-details">
                                <h4>${transaction.description}</h4>
                                <p>${transaction.date}</p>
                            </div>
                        </div>
                        <div class="transaction-amount ${isCredit ? 'credit' : 'debit'}">${isCredit ? '+' : '-'}₹${transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    `;

            transactionsList.appendChild(transactionItem);
        });
    }
}

// Render statements in UI
function renderStatements() {
    const statementsList = document.getElementById('statementsList');
    statementsList.innerHTML = '';

    if (currentUser && currentUser.transactions) {
        currentUser.transactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item';

            const isCredit = transaction.type === 'credit';

            transactionItem.innerHTML = `
                        <div class="transaction-info">
                            <div class="transaction-icon ${isCredit ? 'credit' : 'debit'}">${isCredit ? '↓' : '↑'}</div>
                            <div class="transaction-details">
                                <h4>${transaction.description}</h4>
                                <p>${transaction.date}</p>
                            </div>
                        </div>
                        <div class="transaction-amount ${isCredit ? 'credit' : 'debit'}">${isCredit ? '+' : '-'}₹${transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    `;

            statementsList.appendChild(transactionItem);
        });
    }
}

// Get current date and time
function getCurrentDateTime() {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${dateString} • ${timeString}`;
}

// Quick action functions
function openTransferModal() {
    document.getElementById('transferModal').style.display = 'flex';
}

function closeTransferModal() {
    document.getElementById('transferModal').style.display = 'none';
}

function openBillsModal() {
    document.getElementById('billsModal').style.display = 'flex';
}

function closeBillsModal() {
    document.getElementById('billsModal').style.display = 'none';
}

function openRechargeModal() {
    document.getElementById('rechargeModal').style.display = 'flex';
}

function closeRechargeModal() {
    document.getElementById('rechargeModal').style.display = 'none';
}

function openStatementsModal() {
    document.getElementById('statementsModal').style.display = 'flex';
    renderStatements();
}

function closeStatementsModal() {
    document.getElementById('statementsModal').style.display = 'none';
}

function selectBill(element) {
    // Remove selected class from all options
    document.querySelectorAll('.bill-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // Add selected class to clicked option
    element.classList.add('selected');
    selectedBillType = element.getAttribute('data-type');
}

function selectRecharge(element) {
    // Remove selected class from all options
    document.querySelectorAll('.recharge-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // Add selected class to clicked option
    element.classList.add('selected');
    selectedRechargeType = element.getAttribute('data-type');
}

function resetBillSelection() {
    selectedBillType = '';
    document.querySelectorAll('.bill-option').forEach(opt => {
        opt.classList.remove('selected');
    });
}

function resetRechargeSelection() {
    selectedRechargeType = '';
    document.querySelectorAll('.recharge-option').forEach(opt => {
        opt.classList.remove('selected');
    });
}

// Show Dashboard
function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'block';
}

// Logout Function
function logout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userEmail');
    currentUser = null;
    document.getElementById('dashboardPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    showToast('Logged out successfully', 'success');
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'flex';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

