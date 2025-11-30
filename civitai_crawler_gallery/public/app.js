document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.getElementById('gallery');
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const modalPrompt = document.getElementById('modal-prompt');
    const modalModel = document.getElementById('modal-model');
    const modalUser = document.getElementById('modal-user');
    const closeBtn = document.querySelector('.close');

    // Fetch images from our Worker API
    // For local development with `wrangler dev`, this should work if served correctly.
    // In production, it points to /api/images
    fetch('/api/images')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(images => {
            gallery.innerHTML = ''; // Clear loading message

            if (images.length === 0) {
                gallery.innerHTML = '<div class="loading">No images found. The crawler might need to run first.</div>';
                return;
            }

            images.forEach(image => {
                const item = document.createElement('div');
                item.className = 'gallery-item';

                // Calculate aspect ratio for masonry feel if we wanted to get fancy with grid-row-end
                // For now, CSS aspect-ratio handles it simply.

                item.innerHTML = `
                    <img src="${image.url}" alt="AI Art" loading="lazy">
                    <div class="item-overlay">
                        <div class="item-user">@${image.username}</div>
                    </div>
                `;

                item.addEventListener('click', () => {
                    openModal(image);
                });

                gallery.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error fetching images:', error);
            // Fallback for demo if API fails (e.g. local file opening)
            gallery.innerHTML = '<div class="loading">Error loading images. Ensure the Worker is running.</div>';
        });

    function openModal(image) {
        modal.style.display = 'block';
        modalImg.src = image.url;
        modalPrompt.textContent = image.prompt;
        modalModel.textContent = `Model: ${image.stats?.model || 'Unknown'}`; // stats might not have model directly, check structure
        modalUser.textContent = `Artist: ${image.username}`;
    }

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
