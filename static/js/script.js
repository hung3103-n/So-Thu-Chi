document.addEventListener('DOMContentLoaded', () => {
    let supabase = null;
    let allTransactions = [];
    let monthlyChartInstance = null;

    const setupSection = document.getElementById('setupSection');
    const mainAppSection = document.getElementById('mainApp');
    const supabaseUrlInput = document.getElementById('supabaseUrl');
    const supabaseKeyInput = document.getElementById('supabaseKey');
    const initialBalanceInput = document.getElementById('initialBalance');
    const connectSupabaseBtn = document.getElementById('connectSupabaseBtn');
    const transactionForm = document.getElementById('transactionForm');
    const submitBtn = document.getElementById('submitBtn');
    const transactionsListDiv = document.getElementById('transactionsList');
    const transactionsEmptyState = document.getElementById('transactionsEmptyState');
    const statusMessageEl = document.getElementById('statusMessage');

    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    const dateTimeInput = document.getElementById('transaction_datetime');
    const notesInput = document.getElementById('notes');

    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpenseEl = document.getElementById('totalExpense');
    const totalBalanceEl = document.getElementById('totalBalance');

    const totalTransactionsEl = document.getElementById('totalTransactions');
    const avgExpenseEl = document.getElementById('avgExpense');
    const periodIncomeEl = document.getElementById('periodIncome');
    const periodExpenseEl = document.getElementById('periodExpense');
    const statsLoadingEl = document.getElementById('statsLoading');
    const statsGridEl = document.getElementById('statsGrid');
    const filterPeriodSelect = document.getElementById('filterPeriod');


    const CATEGORIES = {
        expense: ['🍜 Ăn uống', '🚌 Di chuyển', '🎬 Giải trí', '🛍️ Mua sắm', '🧾 Hóa đơn', '💊 Sức khỏe', '🎓 Giáo dục', '🏡 Nhà cửa', '📎 Khác'],
        income: ['💰 Lương', '🧧 Thưởng', '💼 Thu nhập phụ', '💹 Đầu tư', '🎁 Quà tặng', '💡 Khác']
    };

    function showStatusMessage(message, type = 'info', persistent = false) {
        statusMessageEl.innerHTML = type === 'loading'
            ? `<span class="loading-spinner"></span> ${message}`
            : message;
        statusMessageEl.className = `status ${type}`;
        statusMessageEl.classList.remove('hidden');

        if (!persistent && (type === 'success' || type === 'info')) {
            setTimeout(() => {
                statusMessageEl.classList.add('hidden');
            }, 3000);
        }
    }

    function populateCategories() {
        const selectedType = typeSelect.value;
        categorySelect.innerHTML = '<option value="">-- Chọn danh mục --</option>';

        if (CATEGORIES[selectedType]) {
            CATEGORIES[selectedType].forEach(catText => {
                const option = document.createElement('option');
                const cleanText = catText.replace(/^[^\w\s]+/, '').trim(); 
                const categoryKey = cleanText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/đ/g, "d");

                option.value = categoryKey;
                option.textContent = catText; 
                categorySelect.appendChild(option);
            });
        }
    }

    function getCurrentDateTimeLocal() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    async function initializeApp() {
        dateTimeInput.value = getCurrentDateTimeLocal();
        populateCategories();

        const storedUrl = localStorage.getItem('supabaseUrl');
        const storedKey = localStorage.getItem('supabaseKey');
        const storedInitialBalance = localStorage.getItem('initialBalance');

        mainAppSection.classList.add('hidden');
        setupSection.classList.add('hidden');
        showStatusMessage('Đang kiểm tra cấu hình...', 'loading', true);

        if (storedUrl && storedKey) {
            supabaseUrlInput.value = storedUrl;
            supabaseKeyInput.value = storedKey;
            initialBalanceInput.value = storedInitialBalance ? parseFloat(storedInitialBalance) : 0;
            await connectToSupabase(storedUrl, storedKey, true);
        } else {
            showStatusMessage('Vui lòng cấu hình Supabase và Số dư ban đầu.', 'info', true);
            setupSection.classList.remove('hidden');
            statusMessageEl.classList.add('hidden');
        }
    }

    async function connectToSupabase(url, key, isAutoConnect = false) {
        if (!url || !key) {
            showStatusMessage('Vui lòng nhập đầy đủ thông tin Supabase URL và Key.', 'error');
            if (!isAutoConnect) {
                 setupSection.classList.remove('hidden');
                 statusMessageEl.classList.add('hidden');
            }
            return;
        }
        const initialBalanceStr = initialBalanceInput.value;
        const initialBalance = parseFloat(initialBalanceStr);

        if (isNaN(initialBalance)) {
            showStatusMessage('Số dư ban đầu không hợp lệ. Vui lòng nhập một số.', 'error');
             if (!isAutoConnect) {
                connectSupabaseBtn.disabled = false;
                connectSupabaseBtn.innerHTML = 'Lưu & Kết nối';
            }
            return;
        }

        if (!isAutoConnect) {
            connectSupabaseBtn.disabled = true;
            connectSupabaseBtn.innerHTML = '<span class="loading-spinner"></span> Đang kết nối...';
            showStatusMessage('Đang kết nối Supabase...', 'loading', true);
        }


        try {
            if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
                throw new Error('Thư viện Supabase SDK chưa được tải. Vui lòng làm mới trang hoặc kiểm tra kết nối mạng.');
            }
            supabase = window.supabase.createClient(url, key);

            const { error: testError } = await supabase.from('transactions').select('id').limit(1);

            if (testError && !testError.message.includes("relation \"transactions\" does not exist")) {
                throw new Error(testError.message + (testError.details ? ` (${testError.details})` : ''));
            }

            localStorage.setItem('supabaseUrl', url);
            localStorage.setItem('supabaseKey', key);
            localStorage.setItem('initialBalance', initialBalance.toString());

            if (!isAutoConnect) {
                showStatusMessage('Cấu hình đã được lưu. Đang tải lại ứng dụng...', 'loading', true);
                setTimeout(() => location.reload(), 500);
                return;
            }

            setupSection.classList.add('hidden');
            mainAppSection.classList.remove('hidden');
            statusMessageEl.classList.add('hidden');

            if (testError && testError.message.includes("relation \"transactions\" does not exist")) {
                showStatusMessage('Kết nối thành công, nhưng bảng "transactions" chưa tồn tại. Vui lòng chạy SQL setup.', 'info');
            } else {
                showStatusMessage('Kết nối Supabase thành công!', 'success');
            }
            await loadTransactions();
            setupRealtimeSubscription();

        } catch (error) {
            showStatusMessage('Lỗi kết nối Supabase: ' + error.message + '. Kiểm tra URL, Key và SQL setup.', 'error', true);
            mainAppSection.classList.add('hidden');
            setupSection.classList.remove('hidden');
        } finally {
            if (!isAutoConnect) {
                connectSupabaseBtn.disabled = false;
                connectSupabaseBtn.textContent = 'Lưu & Kết nối';
            }
        }
    }

    function setupRealtimeSubscription() {
        if (!supabase) return;
        try {
            const existingChannels = supabase.getChannels();
            existingChannels.forEach(channel => {
                if (channel.topic.startsWith('realtime:public:transactions')) {
                    supabase.removeChannel(channel);
                }
            });

            const channel = supabase
                .channel('public:transactions_all_v2')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'transactions' },
                    (payload) => {
                        if (!document.hidden) {
                           loadTransactions();
                        }
                    }
                )
                .subscribe((status, err) => {
                    if (err) {
                        showStatusMessage("Lỗi kết nối real-time: " + err.message, "error");
                    }
                });
        } catch (error) {
            showStatusMessage("Không thể thiết lập cập nhật real-time.", "error");
        }
    }

    async function loadTransactions() {
        if (!supabase) return;

        transactionsEmptyState.classList.remove('hidden');
        transactionsEmptyState.innerHTML = '<div class="loading-spinner"></div><h3>Đang tải dữ liệu...</h3>';
        transactionsListDiv.innerHTML = '';

        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('transaction_datetime', { ascending: false });

            if (error) {
                if (error.message.includes("relation \"transactions\" does not exist")) {
                    transactionsEmptyState.innerHTML = '<h3>Bảng "transactions" chưa được tạo.</h3><p>Vui lòng chạy SQL setup trong Supabase Studio.</p>';
                } else {
                    showStatusMessage('Lỗi tải giao dịch: ' + error.message, 'error');
                    transactionsEmptyState.innerHTML = '<h3>Lỗi tải dữ liệu</h3>';
                }
                allTransactions = [];
            } else {
                allTransactions = data || [];
                if (allTransactions.length === 0 && !transactionsEmptyState.textContent.includes("Bảng \"transactions\" chưa được tạo")) {
                     transactionsEmptyState.innerHTML = '<h3>📝 Chưa có giao dịch nào</h3><p>Hãy thêm giao dịch đầu tiên của bạn!</p>';
                } else if (allTransactions.length > 0) {
                    transactionsEmptyState.classList.add('hidden');
                }
            }
            displayTransactions();
            updateBalanceAndStats();

        } catch (error) {
            showStatusMessage('Lỗi không xác định khi tải giao dịch.', 'error');
            transactionsEmptyState.innerHTML = '<h3>Lỗi không xác định</h3>';
        }
    }

    function filterTransactionsByPeriod(period) {
        const now = new Date();
        let filtered = [];

        switch (period) {
            case 'month':
                filtered = allTransactions.filter(t => {
                    const tDate = new Date(t.transaction_datetime);
                    return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
                });
                break;
            case 'last30days':
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                thirtyDaysAgo.setHours(0,0,0,0);
                filtered = allTransactions.filter(t => new Date(t.transaction_datetime) >= thirtyDaysAgo);
                break;
            case 'year':
                filtered = allTransactions.filter(t => new Date(t.transaction_datetime).getFullYear() === now.getFullYear());
                break;
            case 'all':
            default:
                filtered = [...allTransactions];
                break;
        }
        return filtered;
    }


    function displayTransactions() {
        const currentFilterPeriod = filterPeriodSelect.value;
        const transactionsToDisplay = filterTransactionsByPeriod(currentFilterPeriod);

        transactionsListDiv.innerHTML = '';

        if (transactionsToDisplay.length === 0) {
            if (allTransactions.length > 0) {
                 transactionsListDiv.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Không có giao dịch nào cho khoảng thời gian đã chọn.</p>';
                 transactionsEmptyState.classList.add('hidden');
            } else if (!transactionsEmptyState.textContent.includes("Bảng \"transactions\" chưa được tạo")) {
                 transactionsListDiv.innerHTML = ''; 
                 transactionsEmptyState.classList.remove('hidden');
                 transactionsEmptyState.innerHTML = '<h3>📝 Chưa có giao dịch nào</h3><p>Hãy thêm giao dịch đầu tiên của bạn!</p>';
            } else {
                 transactionsEmptyState.classList.remove('hidden'); 
            }
            return;
        }
        transactionsEmptyState.classList.add('hidden');


         if (transactionsToDisplay.length > 0) {
            transactionsListDiv.innerHTML = transactionsToDisplay.map(transaction => `
                <div class="transaction-item ${transaction.type}" id="transaction-${transaction.id}">
                    <div class="transaction-info">
                        <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                        <div class="transaction-category">${getCategoryName(transaction.category, transaction.type)}</div>
                        ${transaction.notes ? `<div class="transaction-notes">${escapeHtml(transaction.notes)}</div>` : ''}
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-amount ${transaction.type}">
                            ${transaction.type === 'income' ? '+' : '-'}${formatMoney(transaction.amount)}
                        </div>
                        <div class="transaction-date">${formatDateTime(transaction.transaction_datetime)}</div>
                    </div>
                    <button class="delete-btn" data-id="${transaction.id}" title="Xóa giao dịch">🗑️</button>
                </div>
            `).join('');

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', handleDeleteTransaction);
            });
         }
    }

    async function handleDeleteTransaction(event) {
        const id = event.target.closest('button').dataset.id;
        if (!id) return;
        if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) return;

        const deleteButton = event.target.closest('button');
        deleteButton.disabled = true;
        deleteButton.innerHTML = '<span class="loading-spinner"></span>';
        showStatusMessage('Đang xóa giao dịch...', 'loading', true);


        if (!supabase) return;

        try {
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (error) {
                throw error;
            }
            location.reload(); 
        } catch (error) {
            showStatusMessage('Lỗi xóa giao dịch: ' + error.message, 'error', true);
             if (deleteButton) {
                deleteButton.disabled = false;
                deleteButton.innerHTML = '🗑️';
            }
        }
    }

    function updateBalanceAndStats() {
        const filterMode = filterPeriodSelect.value;
        const filteredTransactions = filterTransactionsByPeriod(filterMode);

        if (statsLoadingEl) statsLoadingEl.classList.remove('hidden');
        if (statsGridEl) statsGridEl.classList.add('hidden');

        const initialBalance = parseFloat(localStorage.getItem('initialBalance')) || 0;

        const overallTotalIncome = allTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const overallTotalExpense = allTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const overallCurrentPeriodBalance = overallTotalIncome - overallTotalExpense;
        const finalOverallBalance = initialBalance + overallCurrentPeriodBalance;

        if(totalIncomeEl) totalIncomeEl.textContent = formatMoney(overallTotalIncome);
        if(totalExpenseEl) totalExpenseEl.textContent = formatMoney(overallTotalExpense);
        if(totalBalanceEl) {
            totalBalanceEl.textContent = formatMoney(finalOverallBalance);
            totalBalanceEl.className = `balance-amount total ${finalOverallBalance >= 0 ? 'income' : 'expense'}`;
        }


        if(totalTransactionsEl) totalTransactionsEl.textContent = filteredTransactions.length;

        const periodIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        if(periodIncomeEl) periodIncomeEl.textContent = formatMoney(periodIncome);

        const periodExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        if(periodExpenseEl) periodExpenseEl.textContent = formatMoney(periodExpense);

        let daysInPeriodForAvg = 30; 
        if (filterMode === 'month') {
            const now = new Date();
            daysInPeriodForAvg = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        } else if (filterMode === 'year') {
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            
            
            const diffTime = Math.abs(now - startOfYear);
            daysInPeriodForAvg = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) +1);
        } else if (filterMode === 'all' && allTransactions.length > 0) { 
             const firstTransactionDate = new Date(Math.min(...allTransactions.map(t => new Date(t.transaction_datetime))));
             const lastTransactionDate = new Date(Math.max(...allTransactions.map(t => new Date(t.transaction_datetime))));
             const timeDiff = Math.abs(lastTransactionDate - firstTransactionDate);
             daysInPeriodForAvg = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) +1);
        }


        const avgExpenseDaily = periodExpense / (daysInPeriodForAvg > 0 ? daysInPeriodForAvg : 1);
        if(avgExpenseEl) avgExpenseEl.textContent = formatMoney(isNaN(avgExpenseDaily) ? 0 : avgExpenseDaily);

        const avgExpenseLabelEl = document.querySelector('#avgExpense + .stat-label');
        if(avgExpenseLabelEl) {
            avgExpenseLabelEl.textContent =
                filterMode === 'all' ? `Chi tiêu TB/ngày (toàn bộ)` :
                filterMode === 'last30days' ? `Chi tiêu TB/ngày (30 ngày qua)` :
                filterMode === 'month' ? `Chi tiêu TB/ngày (tháng này)` :
                filterMode === 'year' ? `Chi tiêu TB/ngày (năm này)` :
                `Chi tiêu TB/ngày`;
        }

        if (statsLoadingEl) statsLoadingEl.classList.add('hidden');
        if (statsGridEl) statsGridEl.classList.remove('hidden');

        renderMonthlyChart(allTransactions); 
    }

     function renderMonthlyChart(transactionsForChart) {
        const chartEl = document.getElementById('monthlyChart');
        if (!chartEl) return;
        const ctx = chartEl.getContext('2d');

        const monthlyData = {};
        
        for (let i = 0; i < 12; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            monthlyData[yearMonth] = { income: 0, expense: 0 };
        }

        transactionsForChart.forEach(t => {
            const date = new Date(t.transaction_datetime);
            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (monthlyData.hasOwnProperty(yearMonth)) { 
                if (t.type === 'income') {
                    monthlyData[yearMonth].income += parseFloat(t.amount);
                } else {
                    monthlyData[yearMonth].expense += parseFloat(t.amount);
                }
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort(); 
        const labels = sortedMonths.map(ym => {
            const [year, month] = ym.split('-');
            return `${month}/${year.slice(2)}`; 
        });
        const incomeData = sortedMonths.map(ym => monthlyData[ym].income);
        const expenseData = sortedMonths.map(ym => monthlyData[ym].expense);

        if (monthlyChartInstance) {
            monthlyChartInstance.destroy();
        }

        monthlyChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Thu nhập',
                        data: incomeData,
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--income-color').trim() || '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--income-color').trim() || '#10b981',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: getComputedStyle(document.documentElement).getPropertyValue('--income-color').trim() || '#10b981',
                        borderWidth: 2
                    },
                    {
                        label: 'Chi tiêu',
                        data: expenseData,
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--expense-color').trim() || '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--expense-color').trim() || '#ef4444',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: getComputedStyle(document.documentElement).getPropertyValue('--expense-color').trim() || '#ef4444',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return formatMoney(value).replace('₫',''); },
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#64748b'
                        },
                        grid: {
                            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e2e8f0',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e2e8f0'
                        }
                    },
                    x: {
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#64748b'
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#1e293b'
                        }
                    },
                    tooltip: {
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || '#ffffff',
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#1e293b',
                        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#1e293b',
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e2e8f0',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatMoney(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }


    async function handleAddTransaction(e) {
        e.preventDefault();
        if (!supabase) {
            showStatusMessage('Supabase chưa được kết nối.', 'error');
            return;
        }

        const description = descriptionInput.value.trim();
        const amountStr = amountInput.value;
        const type = typeSelect.value;
        const category = categorySelect.value;
        const transaction_datetime_val = dateTimeInput.value;
        const notes_val = notesInput.value.trim();

        if (!description || !amountStr || !type || !transaction_datetime_val || !category) {
            showStatusMessage('Vui lòng điền đầy đủ các trường: Mô tả, Số tiền, Loại, Danh mục, Ngày & Giờ.', 'error');
            return;
        }

        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            showStatusMessage('Số tiền không hợp lệ hoặc phải lớn hơn 0.', 'error');
            return;
        }

        const formData = {
            description: description,
            amount: amount,
            type: type,
            category: category, 
            notes: notes_val || null,
            transaction_datetime: new Date(transaction_datetime_val).toISOString()
        };

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Đang thêm...';
        showStatusMessage('Đang gửi dữ liệu lên Supabase...', 'loading', true);

        try {
            const { data, error } = await supabase.from('transactions').insert([formData]).select().single();
            if (error) {
                throw error;
            }
            location.reload(); 
        } catch (error) {
            showStatusMessage('Lỗi thêm giao dịch: ' + error.message, 'error', true);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '➕ Thêm giao dịch';
        }
    }

    function formatMoney(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
    }

    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'N/A';
        try {
            const date = new Date(dateTimeString);
            const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            return `${day} ${time}`;
        } catch (e) {
            return dateTimeString;
        }
    }

    function getCategoryName(categoryKey, transactionType) { 
        for (const type in CATEGORIES) {
            const categoryObject = CATEGORIES[type].find(catFullText => {
                const cleanText = catFullText.replace(/^[^\w\s]+/, '').trim();
                const key = cleanText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/đ/g, "d");
                return key === categoryKey;
            });
            if (categoryObject) return categoryObject; 
        }
        return categoryKey || 'Không phân loại'; 
    }


    function getCategoryIcon(categoryKey, transactionType) {
        
        
        const expenseIcons = {
            'an_uong': '🍜', 'di_chuyen': '🚌', 'giai_tri': '🎬', 'mua_sam': '🛍️',
            'hoa_don': '🧾', 'suc_khoe': '💊', 'giao_duc': '🎓', 'nha_cua': '🏡', 'khac': '📎'
        };
        const incomeIcons = {
            'luong': '💰', 'thuong': '🧧', 'thu_nhap_phu': '💼', 'dau_tu': '💹',
            'qua_tang': '🎁', 'khac': '💡'
        };

        if (transactionType === 'expense' && expenseIcons[categoryKey]) {
            return expenseIcons[categoryKey];
        }
        if (transactionType === 'income' && incomeIcons[categoryKey]) {
            return incomeIcons[categoryKey];
        }
        
        const firstChar = categoryKey.codePointAt(0);
         if (firstChar && (firstChar > 0x1F000 && firstChar < 0x1FAFF)) { 
            return categoryKey.substring(0, categoryKey.indexOf(' ')+1) || categoryKey.charAt(0);
        }
        return '⭐'; 
    }

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    connectSupabaseBtn.addEventListener('click', () => {
        const url = supabaseUrlInput.value.trim();
        const key = supabaseKeyInput.value.trim();
        connectToSupabase(url, key, false);
    });
    transactionForm.addEventListener('submit', handleAddTransaction);
    typeSelect.addEventListener('change', populateCategories);
    filterPeriodSelect.addEventListener('change', () => {
        displayTransactions();
        updateBalanceAndStats();
    });

    initializeApp();
});