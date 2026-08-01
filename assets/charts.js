// -------------------------------------------------------------
// SMARTNET MANAGER - CHART.JS ANALYTICS ENGINE
// -------------------------------------------------------------

window.smartNetCharts = {
    packageDistChart: null,
    lineUtilChart: null,
    paymentStatusChart: null,
    revenueProfitChart: null
};

function renderDashboardCharts() {
    if (typeof Chart === 'undefined') return;

    // 1. Package Distribution Doughnut Chart
    const packageCanvas = document.getElementById('chartPackageDistribution');
    if (packageCanvas) {
        const waiting = typeof getWaitingList === 'function' ? getWaitingList() : [];
        const lines = typeof getLines === 'function' ? getLines() : [];

        const packageCounts = {};
        const countPackage = (gb) => {
            const num = parseInt(gb || 0, 10);
            if (num > 0) {
                const label = `${num} GB`;
                packageCounts[label] = (packageCounts[label] || 0) + 1;
            }
        };

        waiting.forEach(b => {
            if (b.isBundle && (b.members || b.items)) {
                (b.members || b.items).forEach(m => countPackage(m.package_gigas || m.gb));
            } else {
                countPackage(b.package_gigas || b.gb);
            }
        });

        lines.forEach(l => {
            (l.bookings || l.allocatedNumbers || []).forEach(b => {
                if (b.isBundle && (b.members || b.items)) {
                    (b.members || b.items).forEach(m => countPackage(m.package_gigas || m.gb));
                } else {
                    countPackage(b.package_gigas || b.gb);
                }
            });
        });

        const labels = Object.keys(packageCounts);
        const data = Object.values(packageCounts);

        if (window.smartNetCharts.packageDistChart) {
            window.smartNetCharts.packageDistChart.destroy();
        }

        const ctx = packageCanvas.getContext('2d');
        window.smartNetCharts.packageDistChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.length > 0 ? labels : ['لا توجد باقات'],
                datasets: [{
                    data: data.length > 0 ? data : [1],
                    backgroundColor: [
                        '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
                        '#8b5cf6', '#06b6d4', '#ec4899', '#3b82f6'
                    ],
                    borderWidth: 2,
                    borderColor: 'rgba(15, 23, 42, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', font: { family: 'inherit', size: 12 } }
                    }
                }
            }
        });
    }

    // 2. Line Capacity Utilization Bar Chart
    const lineCanvas = document.getElementById('chartLineUtilization');
    if (lineCanvas) {
        const lines = typeof getLines === 'function' ? getLines() : [];
        const labels = lines.map(l => l.line_number ? l.line_number.slice(-4) : l.id);
        const usedGBData = lines.map(l => {
            return (l.bookings || l.allocatedNumbers || []).reduce((sum, b) => {
                if (b.isBundle && (b.members || b.items)) {
                    return sum + (b.members || b.items).reduce((s, m) => s + parseInt(m.package_gigas || m.gb || 0), 0);
                }
                return sum + parseInt(b.package_gigas || b.gb || 0);
            }, 0);
        });
        const totalGBData = lines.map(l => l.total_gigas || 70);

        if (window.smartNetCharts.lineUtilChart) {
            window.smartNetCharts.lineUtilChart.destroy();
        }

        const ctx = lineCanvas.getContext('2d');
        window.smartNetCharts.lineUtilChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'المستهلك (GB)',
                        data: usedGBData,
                        backgroundColor: 'rgba(99, 102, 241, 0.85)',
                        borderRadius: 6
                    },
                    {
                        label: 'السعة الكلية (GB)',
                        data: totalGBData,
                        backgroundColor: 'rgba(51, 65, 85, 0.5)',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                },
                plugins: {
                    legend: { labels: { color: '#94a3b8' } }
                }
            }
        });
    }
}

function renderPaymentsCharts() {
    if (typeof Chart === 'undefined') return;

    // 1. Payment Status Doughnut Chart
    const statusCanvas = document.getElementById('chartPaymentStatus');
    if (statusCanvas) {
        const items = typeof getAllPaymentItems === 'function' ? getAllPaymentItems() : [];
        let paid = 0, partial = 0, unpaid = 0;

        items.forEach(i => {
            if (i.status === 'paid') paid++;
            else if (i.status === 'partial') partial++;
            else unpaid++;
        });

        if (window.smartNetCharts.paymentStatusChart) {
            window.smartNetCharts.paymentStatusChart.destroy();
        }

        const ctx = statusCanvas.getContext('2d');
        window.smartNetCharts.paymentStatusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['تم الدفع بالكامل', 'دفع جزئي', 'غير مدفوع'],
                datasets: [{
                    data: [paid, partial, unpaid],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 2,
                    borderColor: 'rgba(15, 23, 42, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8' } }
                }
            }
        });
    }

    // 2. Revenue vs Expenses vs Profit Chart
    const revCanvas = document.getElementById('chartRevenueProfit');
    if (revCanvas) {
        const items = typeof getAllPaymentItems === 'function' ? getAllPaymentItems() : [];
        const totalBookingsValue = items.reduce((sum, i) => sum + (parseInt(i.total_price, 10) || 0), 0);
        const totalCollected = items.reduce((sum, i) => sum + (parseInt(i.paid_amount, 10) || 0), 0);

        const lines = typeof getLines === 'function' ? getLines() : [];
        const billsData = typeof getAdminBillsData === 'function' ? getAdminBillsData() : {};
        const outsideExpenses = parseInt(billsData.outside_expenses || '0', 10);
        const lineBillsSum = lines.reduce((sum, line) => {
            const val = billsData[line.id] !== undefined ? billsData[line.id] : (billsData[line.line_number] || 0);
            return sum + parseInt(val || '0', 10);
        }, 0);
        const totalBills = lineBillsSum + outsideExpenses;
        const netProfit = totalBookingsValue - totalBills;

        if (window.smartNetCharts.revenueProfitChart) {
            window.smartNetCharts.revenueProfitChart.destroy();
        }

        const ctx = revCanvas.getContext('2d');
        window.smartNetCharts.revenueProfitChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['إجمالي الحجوزات', 'المحصل فعلياً', 'الفواتير والمصاريف', 'صافي الربح المتوقع'],
                datasets: [{
                    data: [totalBookingsValue, totalCollected, totalBills, netProfit],
                    backgroundColor: ['#6366f1', '#10b981', '#ef4444', netProfit >= 0 ? '#34d399' : '#f87171'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }
}

// Hook onto refreshActiveView
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        renderDashboardCharts();
        renderPaymentsCharts();
    }, 300);
});
