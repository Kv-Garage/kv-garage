/**
 * Shared Pack Loading Utility
 * Provides consistent pack data loading across all pages
 */

class PackLoader {
    constructor() {
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3001/api' 
            : '/api';
        this.jsonDataUrl = '/data';
        this.packs = [];
        this.loading = false;
    }

    /**
     * Load packs from API with fallback to JSON
     */
    async loadPacks(options = {}) {
        if (this.loading) {
            return this.packs;
        }

        this.loading = true;

        try {
            // Try API first
            const apiPacks = await this.loadFromAPI(options);
            if (apiPacks && apiPacks.length > 0) {
                this.packs = apiPacks;
                return this.packs;
            }
        } catch (error) {
            console.warn('API loading failed, trying JSON fallback:', error);
        }

        try {
            // Fallback to JSON
            const jsonPacks = await this.loadFromJSON();
            this.packs = jsonPacks;
            return this.packs;
        } catch (error) {
            console.error('Both API and JSON loading failed:', error);
            this.packs = [];
            return [];
        } finally {
            this.loading = false;
        }
    }

    /**
     * Load packs from API
     */
    async loadFromAPI(options = {}) {
        const params = new URLSearchParams();
        
        // Set a higher limit to get all packs by default
        params.append('limit', options.limit || '100');
        if (options.offset) params.append('offset', options.offset);
        if (options.status) params.append('status', options.status);
        if (options.type) params.append('type', options.type);

        const url = `${this.apiBaseUrl}/packs${params.toString() ? '?' + params.toString() : ''}`;
        
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.packs || data.data || [];
    }

    /**
     * Load packs from JSON fallback
     */
    async loadFromJSON() {
        const response = await fetch(`${this.jsonDataUrl}/packs.json`);
        
        if (!response.ok) {
            throw new Error(`JSON request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.packs || [];
    }

    /**
     * Get pack by ID
     */
    async getPackById(packId) {
        // First check if we have it in cache
        const cachedPack = this.packs.find(p => p.id == packId);
        if (cachedPack) {
            return cachedPack;
        }

        try {
            // Try to load from API
            const response = await fetch(`${this.apiBaseUrl}/packs/${packId}`);
            if (response.ok) {
                const data = await response.json();
                return data.pack || data.data;
            }
        } catch (error) {
            console.warn('API pack fetch failed, trying JSON:', error);
        }

        // Fallback to JSON
        const allPacks = await this.loadFromJSON();
        return allPacks.find(p => p.id == packId);
    }

    /**
     * Get featured packs (for homepage)
     */
    async getFeaturedPacks(limit = 4) {
        const packs = await this.loadPacks({ limit });
        return packs.slice(0, limit);
    }

    /**
     * Get packs by status
     */
    async getPacksByStatus(status) {
        return await this.loadPacks({ status });
    }

    /**
     * Get packs by type
     */
    async getPacksByType(type) {
        return await this.loadPacks({ type });
    }

    /**
     * Render packs in a table format (for homepage catalog)
     */
    renderPacksTable(packs, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID '${containerId}' not found`);
            return;
        }

        if (!packs || packs.length === 0) {
            container.innerHTML = '<tr><td colspan="7" class="no-data">No packs available</td></tr>';
            return;
        }

        const tbody = container.querySelector('tbody') || container;
        const rows = packs.map(pack => {
            return `
                <tr class="catalog-row">
                    <td class="pack-name">
                        <strong>${pack.name}</strong>
                    </td>
                    <td class="pack-price">
                        <span class="price">$${parseFloat(pack.price).toFixed(2)}</span>
                    </td>
                    <td class="pack-units">
                        ~${pack.units || pack.number_of_units || 0}
                    </td>
                    <td class="pack-contents">
                        ${pack.short_description || pack.description || 'N/A'}
                    </td>
                    <td class="pack-resale">
                        <span class="resale-value">${pack.estimated_resale_value || pack.resale_estimate || 'N/A'}</span>
                    </td>
                    <td class="pack-image">
                        <img 
                            src="${pack.image_url || pack.image || '/images/placeholder.jpg'}" 
                            alt="${pack.name}"
                            loading="lazy"
                            decoding="async"
                            class="catalog-image"
                        />
                    </td>
                    <td class="pack-action">
                        <button 
                            class="add-to-cart cs-button-solid catalog-btn"
                            data-pack-id="${pack.id}"
                            data-pack-name="${pack.name}"
                            data-pack-price="${pack.price}"
                            data-pack-image="${pack.image_url || pack.image}"
                            data-pack-slug="${pack.slug || pack.id}"
                        >
                            Add to Cart
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }

    /**
     * Render packs in card format (for shop/packs pages)
     */
    renderPacksCards(packs, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID '${containerId}' not found`);
            return;
        }

        if (!packs || packs.length === 0) {
            container.innerHTML = '<div class="no-packs">No packs available</div>';
            return;
        }

        const cards = packs.map(pack => {
            return `
                <div class="pack-card" data-pack-id="${pack.id}">
                    <div class="pack-image">
                        <img 
                            src="${pack.image_url || pack.image || '/images/placeholder.jpg'}" 
                            alt="${pack.name}"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                    <div class="pack-content">
                        <h3 class="pack-name">${pack.name}</h3>
                        <p class="pack-description">${pack.short_description || pack.description || ''}</p>
                        <div class="pack-details">
                            <div class="pack-price">$${parseFloat(pack.price).toFixed(2)}</div>
                            <div class="pack-units">${pack.units || pack.number_of_units || 0} units</div>
                            <div class="pack-resale">${pack.estimated_resale_value || pack.resale_estimate || 'N/A'}</div>
                        </div>
                        <button class="pack-btn buy" data-pack-id="${pack.id}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = cards;
    }
}

// Create global instance
window.packLoader = new PackLoader();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PackLoader;
}
