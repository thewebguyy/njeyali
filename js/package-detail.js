/**
 * Package Detail Page JavaScript
 * Handles loading and displaying individual package details
 */

// Global package data
let currentPackage = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    const packageId = getPackageIdFromURL();
    
    if (packageId) {
        await loadPackageDetails(packageId);
    } else {
        NjeyaliAPI.utils.showToast('Package not found', 'error');
        setTimeout(() => {
            window.location.href = 'packages.html';
        }, 2000);
    }
    
    setupNavigation();
});

/**
 * Get package ID from URL parameter
 */
function getPackageIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Load package details from API
 */
async function loadPackageDetails(packageId) {
    try {
        const data = await NjeyaliAPI.packages.getPackageById(packageId);
        
        if (data) {
            currentPackage = data;
            displayPackageDetails(data);
        } else {
            throw new Error('Package not found');
        }
        
    } catch (error) {
        console.error('Error loading package:', error);
        NjeyaliAPI.utils.showToast('Failed to load package details', 'error');
        setTimeout(() => {
            window.location.href = 'packages.html';
        }, 2000);
    }
}

/**
 * Display package details on page
 */
function displayPackageDetails(package) {
    // Hide loading, show content
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('packageContent').style.display = 'block';
    
    // Update page title
    document.title = `${package.name} - Njeyali Travel`;
    
    // Set hero background
    const heroSection = document.getElementById('packageHero');
    const imageUrl = package.mainImage || package.images?.[0] || 'images/package-placeholder.jpg';
    heroSection.style.backgroundImage = `url('${imageUrl}')`;
    
    // Hero content
    document.getElementById('packageName').textContent = package.name;
    document.getElementById('packageDestination').textContent = package.destination;
    document.getElementById('packageDuration').textContent = package.duration;
    document.getElementById('packageCategory').textContent = formatCategory(package.category);
    
    // Overview section
    document.getElementById('packageDescription').textContent = package.description;
    displayHighlights(package.highlights);
    
    // Itinerary section
    if (package.itinerary && package.itinerary.length > 0) {
        displayItinerary(package.itinerary);
    } else {
        document.getElementById('itinerary').style.display = 'none';
    }
    
    // Inclusions/Exclusions
    displayInclusions(package.inclusions);
    displayExclusions(package.exclusions);
    
    // Booking sidebar
    const price = package.currency === 'USD' ? `$${package.price.toLocaleString()}` : `${package.price.toLocaleString()} ${package.currency}`;
    document.getElementById('bookingPrice').textContent = price;
    document.getElementById('bookingDuration').textContent = package.duration;
    document.getElementById('bookingGroupSize').textContent = package.maxParticipants ? `Up to ${package.maxParticipants} people` : 'Flexible';
    document.getElementById('bookingDifficulty').textContent = formatDifficulty(package.difficulty);
}

/**
 * Display highlights
 */
function displayHighlights(highlights) {
    const container = document.getElementById('packageHighlights');
    container.innerHTML = '';
    
    if (!highlights || highlights.length === 0) {
        container.innerHTML = '<p class="text-muted">No highlights available</p>';
        return;
    }
    
    highlights.forEach(highlight => {
        const div = document.createElement('div');
        div.className = 'highlight-item';
        div.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${highlight}</span>
        `;
        container.appendChild(div);
    });
}

/**
 * Display itinerary
 */
function displayItinerary(itinerary) {
    const container = document.getElementById('packageItinerary');
    container.innerHTML = '';
    
    itinerary.forEach(day => {
        const div = document.createElement('div');
        div.className = 'itinerary-item';
        
        const activitiesHTML = day.activities && day.activities.length > 0
            ? `<div class="itinerary-activities">
                ${day.activities.map(activity => `<span class="activity-tag">${activity}</span>`).join('')}
               </div>`
            : '';
        
        div.innerHTML = `
            <div class="itinerary-day">Day ${day.day}</div>
            <div class="itinerary-title">${day.title}</div>
            <div class="itinerary-description">${day.description}</div>
            ${activitiesHTML}
        `;
        
        container.appendChild(div);
    });
}

/**
 * Display inclusions
 */
function displayInclusions(inclusions) {
    const container = document.getElementById('packageInclusions');
    container.innerHTML = '';
    
    if (!inclusions || inclusions.length === 0) {
        container.innerHTML = '<li><i class="fas fa-check"></i> Details available upon request</li>';
        return;
    }
    
    inclusions.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-check"></i> ${item}`;
        container.appendChild(li);
    });
}

/**
 * Display exclusions
 */
function displayExclusions(exclusions) {
    const container = document.getElementById('packageExclusions');
    container.innerHTML = '';
    
    if (!exclusions || exclusions.length === 0) {
        container.innerHTML = '<li><i class="fas fa-times"></i> Details available upon request</li>';
        return;
    }
    
    exclusions.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-times"></i> ${item}`;
        container.appendChild(li);
    });
}

/**
 * Setup navigation tab clicks
 */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.package-nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active to clicked
            this.classList.add('active');
            
            // Scroll to section
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offset = 80; // Account for sticky nav
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Update active nav on scroll
    window.addEventListener('scroll', updateActiveNav);
}

/**
 * Update active navigation based on scroll position
 */
function updateActiveNav() {
    const sections = ['overview', 'itinerary', 'inclusions', 'booking'];
    const navLinks = document.querySelectorAll('.package-nav a');
    
    let currentSection = 'overview';
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                currentSection = sectionId;
            }
        }
    });
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href').substring(1);
        if (href === currentSection) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Request package booking
 */
async function requestPackage() {
    if (!currentPackage) {
        NjeyaliAPI.utils.showToast('Package information not available', 'error');
        return;
    }
    
    // Store package data and redirect to services page
    sessionStorage.setItem('packageRequest', JSON.stringify({
        packageId: currentPackage._id,
        packageName: currentPackage.name,
        price: currentPackage.price,
        currency: currentPackage.currency,
        destination: currentPackage.destination,
        duration: currentPackage.duration
    }));
    
    // Redirect to services page with package-request pre-selected
    window.location.href = 'services.html?service=package';
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
    
    return categoryMap[category] || category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format difficulty level
 */
function formatDifficulty(difficulty) {
    if (!difficulty) return 'Moderate';
    
    const difficultyMap = {
        'easy': 'Easy',
        'moderate': 'Moderate',
        'challenging': 'Challenging'
    };
    
    return difficultyMap[difficulty] || difficulty;
}

/**
 * Share package
 */
function sharePackage() {
    if (navigator.share && currentPackage) {
        navigator.share({
            title: currentPackage.name,
            text: currentPackage.description,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    }
}