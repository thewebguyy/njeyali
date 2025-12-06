/**
 * Packages Page JavaScript
 * Handles package loading, filtering, and display
 */

// Global variables
let allPackages = [];
let filteredPackages = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    await loadPackages();
    setupFilterForm();
});

/**
 * Load all packages from API
 */
async function loadPackages() {
    try {
        showLoading();
        
        const packages = await NjeyaliAPI.packages.getAllPackages();
        
        if (packages && packages.length > 0) {
            allPackages = packages;
            filteredPackages = packages;
            displayPackages(packages);
            updateResultsCount(packages.length);
        } else {
            showEmptyState();
        }
        
    } catch (error) {
        console.error('Error loading packages:', error);
        NjeyaliAPI.utils.showToast('Failed to load packages. Please refresh the page.', 'error');
        showEmptyState();
    }
}

/**
 * Display packages in grid
 */
function displayPackages(packages) {
    const container = document.getElementById('packagesContainer');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    // Hide loading, show container
    loadingState.style.display = 'none';
    emptyState.style.display = 'none';
    container.style.display = 'flex';
    
    // Clear container
    container.innerHTML = '';
    
    // Create package cards
    packages.forEach(package => {
        const card = createPackageCard(package);
        container.appendChild(card);
    });
}

/**
 * Create package card HTML element
 */
function createPackageCard(package) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    // Format price
    const price = package.currency === 'USD' ? `$${package.price.toLocaleString()}` : `${package.price.toLocaleString()} ${package.currency}`;
    
    // Get first 3 highlights
    const highlights = package.highlights ? package.highlights.slice(0, 3) : [];
    
    // Badge class
    const badgeClass = package.featured ? 'featured' : '';
    const badgeText = package.featured ? 'Featured' : 'Popular';
    
    // Placeholder image if none provided
    const imageUrl = package.mainImage || package.images?.[0] || 'images/package-placeholder.jpg';
    
    col.innerHTML = `
        <div class="package-card">
            <div class="package-image">
                <img src="${imageUrl}" alt="${package.name}" onerror="this.src='images/package-placeholder.jpg'">
                ${package.featured ? `<span class="package-badge ${badgeClass}">${badgeText}</span>` : ''}
            </div>
            <div class="package-content">
                <div class="package-category">
                    <i class="fas fa-tag"></i> ${formatCategory(package.category)}
                </div>
                <h3 class="package-title">${package.name}</h3>
                <div class="package-destination">
                    <i class="fas fa-map-marker-alt"></i>
                    ${package.destination}
                </div>
                <div class="package-duration">
                    <i class="fas fa-clock"></i>
                    ${package.duration}
                </div>
                
                ${highlights.length > 0 ? `
                <ul class="package-highlights">
                    ${highlights.map(highlight => `
                        <li><i class="fas fa-check-circle"></i> ${highlight}</li>
                    `).join('')}
                </ul>
                ` : ''}
                
                <div class="package-footer">
                    <div class="package-price">
                        ${price} <small>per person</small>
                    </div>
                </div>
                
                <a href="package-detail.html?id=${package._id}" class="btn-view-package">
                    View Details <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `;
    
    return col;
}

/**
 * Format category name
 */
function formatCategory(category) {
    if (!category) return 'Travel Package';
    
    const categoryMap = {
        'luxury': 'Luxury Travel',
        'adventure': 'Adventure',
        'cultural': 'Cultural Tour',
        'beach': 'Beach Getaway',
        'safari': 'Safari Adventure',
        'city-break': 'City Break',
        'group': 'Group Travel'
    };
    
    return categoryMap[category] || category;
}

/**
 * Setup filter form
 */
function setupFilterForm() {
    const form = document.getElementById('filterForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await applyFilters();
    });
}

/**
 * Apply filters to packages
 */
async function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const destination = document.getElementById('destinationFilter').value.toLowerCase();
    const minPrice = parseInt(document.getElementById('minPrice').value) || 0;
    const maxPrice = parseInt(document.getElementById('maxPrice').value) || Infinity;
    
    showLoading();
    
    // Filter packages
    filteredPackages = allPackages.filter(package => {
        // Category filter
        if (category && package.category !== category) {
            return false;
        }
        
        // Destination filter
        if (destination && !package.destination.toLowerCase().includes(destination)) {
            return false;
        }
        
        // Price filter
        if (package.price < minPrice || package.price > maxPrice) {
            return false;
        }
        
        return true;
    });
    
    // Display filtered results
    if (filteredPackages.length > 0) {
        displayPackages(filteredPackages);
        updateResultsCount(filteredPackages.length);
        
        // Scroll to results
        document.getElementById('packagesContainer').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    } else {
        showEmptyState();
    }
}

/**
 * Reset filters
 */
function resetFilters() {
    document.getElementById('filterForm').reset();
    filteredPackages = allPackages;
    displayPackages(allPackages);
    updateResultsCount(allPackages.length);
}

/**
 * Update results count
 */
function updateResultsCount(count) {
    const resultsDiv = document.getElementById('resultsCount');
    const total = allPackages.length;
    
    if (count === total) {
        resultsDiv.innerHTML = `Showing <strong>all ${total}</strong> packages`;
    } else {
        resultsDiv.innerHTML = `Showing <strong>${count}</strong> of <strong>${total}</strong> packages`;
    }
}

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('packagesContainer').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';
}

/**
 * Show empty state
 */
function showEmptyState() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('packagesContainer').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('resultsCount').innerHTML = '';
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'USD') {
    if (currency === 'USD') {
        return `$${amount.toLocaleString()}`;
    }
    return `${amount.toLocaleString()} ${currency}`;
}