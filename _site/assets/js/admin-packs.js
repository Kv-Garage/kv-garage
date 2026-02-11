document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('packs-list');
    if (!container) return;
    
    fetch('/data/packs.json')
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<p>No packs found.</p>';
                return;
            }
            
            let html = '<table class="data-table"><thead><tr>';
            html += '<th>Name</th><th>Price</th><th>Units</th><th>Status</th><th>Actions</th>';
            html += '</tr></thead><tbody>';
            
            data.forEach(pack => {
                html += `<tr>
                    <td>${pack.name || 'Unnamed'}</td>
                    <td>$${pack.price || 0}</td>
                    <td>${pack.units || 0}</td>
                    <td><span class="status-badge active">Active</span></td>
                    <td>
                        <button class="btn btn-small" onclick="editPack('${pack.id}')">Edit</button>
                    </td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        })
        .catch(err => {
            console.error('Error:', err);
            container.innerHTML = '<p class="error">Error loading packs.</p>';
        });
    
    window.editPack = function(id) {
        alert('Edit pack: ' + id);
    };
});
