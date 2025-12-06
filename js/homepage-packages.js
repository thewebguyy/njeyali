/**
 * Homepage Featured Packages Loader
 * Add this script to index.html to display featured packages
 */

document.addEventListener('DOMContentLoaded', async function() {
    await loadFeaturedPackages();
});

/**
 * Load and display featured packages on homepage
 */
async function loadFeaturedPackages() {
    const container = document.getElementById('featuredPackages');
    
    if (!container) {
        console.log('Featured packages container not found on this page');
        return;
    }
    
    try {
        // Show loading
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-circle-notch fa-spin fa-3x text-primary"></i>
                <p class="mt-3">Loading packages...</p>
            </div>
        `;
        
        // Load featured packages (limit to 6)
        const packages = await NjeyaliAPI.packages.getFeaturedPackages(6);
        
        if (packages && packages.length > 0) {
            displayFeaturedPackages(packages, container);
        } else {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No packages available at the moment.</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading featured packages:', error);
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-danger">Failed to load packages. Please try again later.</p>
            </div>
        `;
    }
}

/**
 * Display featured packages
 */
function displayFeaturedPackages(packages, container) {
    container.innerHTML = '';
    
    packages.forEach(package => {
        const price = package.currency === 'USD' 
            ? `$${package.price.toLocaleString()}` 
            : `${package.price.toLocaleString()} ${package.currency}`;
        
        const imageUrl = package.mainImage || package.images?.[0] || 'images/package-placeholder.jpg';
        
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4';
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${imageUrl}" class="card-img-top" alt="${package.name}" style="height: 200px; object-fit: cover;" onerror="this.src='images/package-placeholder.jpg'">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${package.name}</h5>
                    <p class="card-text text-muted">
                        <i class="fas fa-map-marker-alt"></i> ${package.destination}
                    </p>
                    <p class="card-text text-muted">
                        <i class="fas fa-clock"></i> ${package.duration}
                    </p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h4 class="mb-0 text-primary">${price}</h4>
                            <small class="text-muted">per person</small>
                        </div>
                        <a href="package-detail.html?id=${package._id}" class="btn btn-primary btn-block">
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(col);
    });
}