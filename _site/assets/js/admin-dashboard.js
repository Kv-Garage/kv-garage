document.addEventListener('DOMContentLoaded', function() {
    fetch('/data/packs.json')
        .then(response => response.json())
        .then(data => {
            const totalPacks = Array.isArray(data) ? data.length : 0;
            const el = document.getElementById('total-packs');
            if (el) el.textContent = totalPacks;
        })
        .catch(err => {
            console.error('Error loading packs:', err);
            const el = document.getElementById('total-packs');
            if (el) el.textContent = 'Error';
        });
    
    const ordersEl = document.getElementById('active-orders');
    const revenueEl = document.getElementById('revenue');
    if (ordersEl) ordersEl.textContent = '0';
    if (revenueEl) revenueEl.textContent = '$0';
});
