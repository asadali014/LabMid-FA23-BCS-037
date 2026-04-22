// ── Toggle mobile menu (existing) ──────────────────────────────
function toggleMenu() {
    const nav = document.getElementById('nav');
    nav.classList.toggle('open');
}

// ── Helper: generate star string from rating number ────────────
function generateStars(rate) {
    const full = Math.round(rate);
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= full ? '★' : '☆';
    }
    return stars;
}

// ── Helper: build one product card HTML string ─────────────────
// Uses data from our own MongoDB via /api/products (emoji field)
function buildCard(product) {
    return `
        <div class="product-card">
            <div class="card-img api-emoji">${product.emoji}</div>
            <p class="category">${product.category}</p>
            <h3>${product.title}</h3>
            <div class="price-row">
                <span class="price">Rs. ${Number(product.price).toLocaleString()}</span>
                ${product.oldPrice ? `<span class="old-price">Rs. ${Number(product.oldPrice).toLocaleString()}</span>` : ''}
                ${product.discount ? `<span class="discount">${product.discount}</span>` : ''}
            </div>
            <button class="add-cart">Add to Cart</button>
            <button
                class="quick-view"
                data-id="${product._id}"
                data-title="${product.title}"
                data-price="${product.price}"
                data-category="${product.category}"
                data-emoji="${product.emoji}"
                data-desc="${product.description}"
                data-rate="${product.rating.rate}"
                data-count="${product.rating.count}">
                Quick View
            </button>
        </div>
    `;
}

// ── DB Connection Check ──────────────────────────────────────────
function checkDbStatus() {
    $.ajax({
        url: '/api/health',
        method: 'GET',
        success: function (data) {
            const dot = $('#db-dot');
            const text = $('#db-status-text');
            if (data.status === 'ok') {
                dot.addClass('connected').removeClass('error');
                text.text('DB Connected');
            } else {
                dot.addClass('error').removeClass('connected');
                text.text('DB Error');
            }
        },
        error: function () {
            $('#db-dot').addClass('error').removeClass('connected');
            $('#db-status-text').text('DB Offline');
        }
    });
}

// ── AJAX call using jQuery ─────────────────────────────────────
// Fetches products from our own Express + MongoDB backend API
$(document).ready(function () {

    // Initial DB Check
    checkDbStatus();

    // Load Featured Deals (Limit 4)
    $.ajax({
        url: '/api/products?limit=4',
        method: 'GET',
        success: function (products) {
            $('#featured-deals-grid').empty();
            products.forEach(function (product) {
                $('#featured-deals-grid').append(buildCard(product));
            });
        },
        error: function () {
            $('#featured-deals-grid').html(
                '<p style="color:red; grid-column: 1/-1; text-align:center;">Failed to load deals from database.</p>'
            );
        }
    });

    // Load All Products (No Limit)
    $.ajax({
        url: '/api/products',
        method: 'GET',
        success: function (products) {
            $('#all-products-grid').empty();
            products.forEach(function (product) {
                $('#all-products-grid').append(buildCard(product));
            });
        },
        error: function () {
            $('#all-products-grid').html(
                '<p style="color:red; grid-column: 1/-1; text-align:center;">Failed to load all products from database.</p>'
            );
        }
    });

});

// ── Open / Close Modals ─────────────────────────────
document.addEventListener('click', function (e) {

    // Quick View
    if (e.target.classList.contains('quick-view')) {
        const btn = e.target;
        document.getElementById('modal-title').textContent        = btn.dataset.title;
        document.getElementById('modal-category').textContent     = btn.dataset.category;
        document.getElementById('modal-price').textContent        = 'Rs. ' + Number(btn.dataset.price).toLocaleString();
        document.getElementById('modal-desc').textContent         = btn.dataset.desc;
        document.getElementById('modal-emoji').textContent        = btn.dataset.emoji;
        document.getElementById('modal-stars').textContent        = generateStars(parseFloat(btn.dataset.rate));
        document.getElementById('modal-rating-val').textContent   = btn.dataset.rate;
        document.getElementById('modal-rating-count').textContent = '(' + btn.dataset.count + ' reviews)';
        document.getElementById('qv-modal').classList.add('active');
    }

    if (e.target.id === 'modal-close-btn' || e.target.id === 'qv-modal') {
        document.getElementById('qv-modal').classList.remove('active');
    }

    // Add Product Modal
    if (e.target.id === 'open-add-modal') {
        document.getElementById('add-modal').classList.add('active');
    }

    if (e.target.id === 'add-modal-close-btn' || e.target.id === 'add-modal') {
        document.getElementById('add-modal').classList.remove('active');
    }

});

// ── Handle Add Product Form Submission ─────────────────────────
$(document).on('submit', '#add-product-form', function (e) {
    e.preventDefault();

    const newProduct = {
        title       : $('#add-title').val(),
        price       : $('#add-price').val(),
        category    : $('#add-category').val(),
        emoji       : $('#add-emoji').val(),
        description : $('#add-desc').val()
    };

    $.ajax({
        url: '/api/products',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(newProduct),
        success: function () {
            // Close modal & reset form
            document.getElementById('add-modal').classList.remove('active');
            $('#add-product-form')[0].reset();
            
            // Refresh grids
            location.reload(); // Simplest way to show the new product
        },
        error: function () {
            alert('Failed to save product to MongoDB. Check server logs.');
        }
    });
});