document.addEventListener('DOMContentLoaded', () => {
    console.log("Gallery App Started"); // Debug log
    const gallery = document.getElementById('gallery');
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const modalPrompt = document.getElementById('modal-prompt');
    const modalModel = document.getElementById('modal-model');
    const modalUser = document.getElementById('modal-user');
    const modalLink = document.getElementById('modal-link'); // New element
    const closeBtn = document.querySelector('.close');

    // Fetch images from our Worker API
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
            gallery.innerHTML = `<div class="loading">Error loading images: ${error.message}<br>Check console for details.</div>`;
        });

    function openModal(image) {
        modal.style.display = 'block';
        modalImg.src = image.url;
        modalPrompt.textContent = image.prompt;
        modalModel.textContent = `Model: ${image.stats?.model || 'Unknown'}`;
        modalUser.textContent = `Artist: ${image.username}`;

        // Set external link
        if (image.id) {
            modalLink.href = `https://civitai.com/images/${image.id}`;
            modalLink.style.display = 'inline-block';
        } else {
            modalLink.style.display = 'none';
        }
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
