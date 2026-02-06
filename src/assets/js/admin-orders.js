document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    container.innerHTML = '<p>No orders found. Orders will appear here when customers make purchases.</p>';
});
