// ---------- STATE ----------
// Each entry looks like: { id, title, author, rating, readNumber, review, date }
let entries = JSON.parse(localStorage.getItem('readingLog')) || [];
let currentRating = 0;
let currentReadNumber = 1;

// ---------- ELEMENT REFERENCES ----------
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const reviewInput = document.getElementById('review');
const wordCountEl = document.getElementById('wordCount');
const starRow = document.getElementById('starRow');
const readDigits = document.getElementById('readDigits');
const readLabel = document.getElementById('readLabel');
const incReadBtn = document.getElementById('incRead');
const decReadBtn = document.getElementById('decRead');
const saveBtn = document.getElementById('saveEntry');
const logGrid = document.getElementById('logGrid');
const emptyState = document.getElementById('emptyState');
const entryCountEl = document.getElementById('entryCount');

const MAX_WORDS = 200;

// ---------- BUILD STAR WIDGET ----------
// Each star is built from two invisible half-width buttons stacked on
// top of a filled/unfilled glyph, so a click on the left half of a star
// registers as .5 and the right half registers as a full point.
for (let i = 1; i <= 5; i++) {
  const star = document.createElement('div');
  star.className = 'star';
  star.innerHTML = `
    <span class="outline">★</span>
    <span class="fill">★</span>
    <button type="button" class="half-btn" data-value="${i - 0.5}"></button>
    <button type="button" class="full-btn" data-value="${i}"></button>
  `;
  starRow.appendChild(star);
}

starRow.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  currentRating = parseFloat(btn.dataset.value);
  renderStars();
});

function renderStars() {
  const stars = starRow.querySelectorAll('.star');
  stars.forEach((star, index) => {
    const starValue = index + 1;
    const fillAmount = Math.max(0, Math.min(1, currentRating - (starValue - 1))) * 100;
    star.querySelector('.fill').style.width = fillAmount + '%';
  });
}

// ---------- READ COUNTER ----------
function renderCounter() {
  readDigits.textContent = String(currentReadNumber).padStart(2, '0');
  readLabel.textContent = currentReadNumber === 1
    ? 'First read'
    : `Reread \u00B7 ${currentReadNumber - 1}`;
}

incReadBtn.addEventListener('click', () => {
  currentReadNumber = Math.min(99, currentReadNumber + 1);
  renderCounter();
});

decReadBtn.addEventListener('click', () => {
  currentReadNumber = Math.max(1, currentReadNumber - 1);
  renderCounter();
});

// ---------- WORD LIMIT ----------
reviewInput.addEventListener('input', () => {
  const words = reviewInput.value.trim().split(/\s+/).filter(Boolean);
  if (words.length > MAX_WORDS) {
    reviewInput.value = words.slice(0, MAX_WORDS).join(' ');
  }
  const finalCount = reviewInput.value.trim().split(/\s+/).filter(Boolean).length;
  wordCountEl.textContent = `${finalCount} / ${MAX_WORDS}`;
});

// ---------- SAVE ENTRY ----------
saveBtn.addEventListener('click', () => {
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();

  if (!title) {
    titleInput.focus();
    titleInput.style.outline = '2px solid #C1502E';
    return;
  }

  const entry = {
    id: Date.now(),
    title,
    author,
    rating: currentRating,
    readNumber: currentReadNumber,
    review: reviewInput.value.trim(),
    date: new Date().toISOString()
  };

  entries.unshift(entry);
  saveToStorage();
  renderEntries();
  resetForm();
});

function resetForm() {
  titleInput.value = '';
  authorInput.value = '';
  reviewInput.value = '';
  titleInput.style.outline = '';
  wordCountEl.textContent = `0 / ${MAX_WORDS}`;
  currentRating = 0;
  currentReadNumber = 1;
  renderStars();
  renderCounter();
}

// ---------- DELETE ENTRY ----------
function deleteEntry(id) {
  entries = entries.filter(entry => entry.id !== id);
  saveToStorage();
  renderEntries();
}

// ---------- STORAGE ----------
function saveToStorage() {
  localStorage.setItem('readingLog', JSON.stringify(entries));
}

// ---------- RENDER LOG ----------
function starDisplay(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 !== 0;
  let display = '★'.repeat(full);
  if (half) display += '½';
  return display || '—';
}

function renderEntries() {
  logGrid.innerHTML = '';
  emptyState.style.display = entries.length === 0 ? 'block' : 'none';
  entryCountEl.textContent = `Vol. ${String(entries.length).padStart(3, '0')}`;

  entries.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'entry-card';

    const readTag = entry.readNumber === 1
      ? 'First read'
      : `Reread \u00B7 ${String(entry.readNumber - 1).padStart(2, '0')}`;

    const dateLabel = new Date(entry.date).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    card.innerHTML = `
      <div class="entry-strip">
        <div>
          <div class="entry-title">${escapeHtml(entry.title)}</div>
          ${entry.author ? `<div class="entry-author">${escapeHtml(entry.author)}</div>` : ''}
        </div>
        <button class="entry-delete" aria-label="Delete entry">✕</button>
      </div>
      <div class="entry-body">
        <div class="entry-stars">${starDisplay(entry.rating)}</div>
        ${entry.review ? `<div class="entry-review">${escapeHtml(entry.review)}</div>` : ''}
        <div class="entry-meta">
          <span>${readTag}</span>
          <span>${dateLabel}</span>
        </div>
      </div>
    `;

    card.querySelector('.entry-delete').addEventListener('click', () => deleteEntry(entry.id));
    logGrid.appendChild(card);
  });
}

// Basic escaping so pasted titles/reviews can't break the HTML structure
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- INIT ----------
renderStars();
renderCounter();
renderEntries();