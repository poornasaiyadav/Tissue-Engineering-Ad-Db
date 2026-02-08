/**
 * Tissue Engineering–Based Alzheimer's Gene Database
 * JavaScript Application
 */

// Global variables
let databaseData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadDatabase();
  attachEventListeners();
});

/**
 * Load the JSON database
 */
async function loadDatabase() {
  try {
    const response = await fetch('alzheimers_data.json');
    if (!response.ok) {
      throw new Error('Failed to load database');
    }
    databaseData = await response.json();
    console.log(`Database loaded: ${databaseData.length} entries`);
  } catch (error) {
    console.error('Error loading database:', error);
    showError('Failed to load database. Please refresh the page.');
  }
}

/**
 * Attach all event listeners
 */
function attachEventListeners() {
  // Search functionality
  document.getElementById('searchButton').addEventListener('click', performSearch);
  document.getElementById('geneSearch').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      document.getElementById('geneSearch').value = filter;
      performSearch();
    });
  });

  // Action buttons
  document.getElementById('exportBtn').addEventListener('click', exportResults);
  document.getElementById('clearBtn').addEventListener('click', clearResults);
  document.getElementById('closeToolBtn').addEventListener('click', closeTool);

  // Tool menu buttons
  const toolButtons = {
    'blastMenuBtn': () => showTool('blast'),
    'keggMenuBtn': () => showTool('kegg'),
    'primerMenuBtn': () => showTool('primer'),
    'translateMenuBtn': () => showTool('translate'),
    'complementMenuBtn': () => showTool('complement'),
    'uniprotMenuBtn': () => showTool('uniprot'),
    'chemblMenuBtn': () => showTool('chembl')
  };

  Object.entries(toolButtons).forEach(([id, handler]) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', handler);
  });

  // Navigation smooth scroll
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });
}

// ============================================
// Search & Display Functions
// ============================================

/**
 * Perform search on the database
 */
function performSearch() {
  const searchTerm = document.getElementById('geneSearch').value.trim().toLowerCase();
  
  if (!searchTerm) {
    showEmptyState();
    return;
  }

  // Filter data based on search term
  filteredData = databaseData.filter(row => {
    return Object.values(row).some(value => {
      if (value && typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm);
      }
      return false;
    });
  });

  currentPage = 1;
  displayResults();
}

/**
 * Display search results in a professional table
 */
function displayResults() {
  const container = document.getElementById('dynamicContent');
  
  if (filteredData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>No results found</p>
        <span class="hint">Try a different search term</span>
      </div>
    `;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Build the table
  let html = `
    <div class="data-table-container fade-in">
      <div style="margin-bottom: 1rem; color: var(--text-muted); font-size: 0.875rem;">
        <i class="fas fa-info-circle"></i> Showing ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredData.length)} of ${filteredData.length} results
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th><i class="fas fa-dna"></i> Gene</th>
            <th><i class="fas fa-code-branch"></i> Variant</th>
            <th><i class="fas fa-cog"></i> Function</th>
            <th><i class="fas fa-exclamation-triangle"></i> AD Mechanism</th>
            <th><i class="fas fa-flask"></i> TE Relevance</th>
            <th><i class="fas fa-layer-group"></i> Scaffold Strategy</th>
            <th><i class="fas fa-microscope"></i> Cell Type</th>
            <th><i class="fas fa-vial"></i> Growth Factors</th>
            <th><i class="fas fa-cube"></i> Biomaterial</th>
            <th><i class="fas fa-heartbeat"></i> Outcome</th>
          </tr>
        </thead>
        <tbody>
  `;

  paginatedData.forEach(row => {
    html += `
      <tr>
        <td>${row.gene_name || '-'}</td>
        <td>${row.variant || '-'}</td>
        <td>${truncateText(row.function, 50)}</td>
        <td>${truncateText(row.ad_mechanism, 50)}</td>
        <td>${getTEBadge(row.te_relevance)}</td>
        <td>${truncateText(row.scaffold_strategy, 50)}</td>
        <td>${truncateText(row.cell_type, 40)}</td>
        <td>${row.growth_factors || '-'}</td>
        <td>${truncateText(row.biomaterial_suggestion, 40)}</td>
        <td>${truncateText(row.regeneration_outcome, 50)}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
  renderPagination(totalPages);
}

/**
 * Render pagination controls
 */
function renderPagination(totalPages) {
  const pagination = document.getElementById('pagination');
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = '';
  
  // Previous button
  html += `
    <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
      <i class="fas fa-chevron-left"></i>
    </button>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `
        <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span class="page-btn" disabled>...</span>`;
    }
  }

  // Next button
  html += `
    <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  pagination.innerHTML = html;
}

/**
 * Change page
 */
function changePage(page) {
  currentPage = page;
  displayResults();
  document.getElementById('dynamicContent').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Show empty state
 */
function showEmptyState() {
  document.getElementById('dynamicContent').innerHTML = `
    <div class="empty-state">
      <i class="fas fa-database"></i>
      <p>Enter a search term to explore the database</p>
      <span class="hint">Try searching for "APOE", "APP", or "Neural tissue engineering"</span>
    </div>
  `;
  document.getElementById('pagination').innerHTML = '';
}

/**
 * Clear results
 */
function clearResults() {
  document.getElementById('geneSearch').value = '';
  filteredData = [];
  currentPage = 1;
  showEmptyState();
}

/**
 * Export results to CSV
 */
function exportResults() {
  if (filteredData.length === 0) {
    alert('No results to export. Please perform a search first.');
    return;
  }

  const headers = [
    'Gene Name', 'Variant', 'Disease', 'Function', 'AD Mechanism',
    'Oxidative Stress', 'Angiogenesis', 'Neural Survival', 'TE Relevance',
    'Scaffold Strategy', 'Cell Type', 'Growth Factors', 'Biomaterial Suggestion', 'Regeneration Outcome'
  ];

  const csvContent = [
    headers.join(','),
    ...filteredData.map(row => [
      row.gene_name, row.variant, row.disease, row.function, row.ad_mechanism,
      row.oxidative_stress, row.angiogenesis, row.neural_survival, row.te_relevance,
      row.scaffold_strategy, row.cell_type, row.growth_factors, row.biomaterial_suggestion, row.regeneration_outcome
    ].map(field => `"${(field || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `TE_Alzheimers_Search_Results_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// ============================================
// Helper Functions
// ============================================

/**
 * Truncate text with ellipsis
 */
function truncateText(text, maxLength) {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get TE relevance badge
 */
function getTEBadge(teRelevance) {
  if (!teRelevance) return '-';
  
  let badgeClass = '';
  if (teRelevance.includes('Neural tissue engineering')) {
    badgeClass = 'badge-neural';
  } else if (teRelevance.includes('Neuroimmune')) {
    badgeClass = 'badge-neuroimmune';
  } else if (teRelevance.includes('Neurovascular')) {
    badgeClass = 'badge-neurovascular';
  } else if (teRelevance.includes('Metabolic')) {
    badgeClass = 'badge-metabolic';
  }
  
  return `<span class="cell-badge ${badgeClass}">${teRelevance}</span>`;
}

/**
 * Show error message
 */
function showError(message) {
  document.getElementById('dynamicContent').innerHTML = `
    <div class="empty-state">
      <i class="fas fa-exclamation-circle" style="color: var(--danger-color);"></i>
      <p>${message}</p>
    </div>
  `;
}

// ============================================
// Tool Functions
// ============================================

/**
 * Show tool in the tool content area
 */
function showTool(toolName) {
  const toolContent = document.getElementById('toolContent');
  const toolBody = document.getElementById('toolBody');
  const toolTitle = document.getElementById('toolTitle');
  const resultsContainer = document.getElementById('resultsContainer');

  // Hide results, show tool
  resultsContainer.style.display = 'none';
  toolContent.style.display = 'block';

  const tools = {
    blast: {
      title: 'BLAST Tool',
      content: `
        <div class="tool-form">
          <label for="blastSeq">Enter DNA/Protein Sequence (FASTA format):</label>
          <textarea id="blastSeq" rows="6" placeholder=">Sequence\nATCGATCGATCG..."></textarea>
          <div class="tool-actions">
            <button onclick="runBLAST()" class="action-btn"><i class="fas fa-play"></i> Run BLAST</button>
          </div>
          <div id="blastResults" class="tool-results"></div>
        </div>
      `
    },
    kegg: {
      title: 'KEGG Pathway Tool',
      content: `
        <div class="tool-form">
          <label for="keggInput">Enter KEGG ID:</label>
          <input type="text" id="keggInput" placeholder="e.g., hsa:10458 or map05010" />
          <div class="tool-actions">
            <button onclick="openKEGG()" class="action-btn"><i class="fas fa-external-link-alt"></i> Open KEGG</button>
          </div>
          <div id="keggResults" class="tool-results"></div>
        </div>
      `
    },
    primer: {
      title: 'Primer Designing Tool',
      content: `
        <div class="tool-form">
          <label for="primerSeq">Enter Target DNA Sequence:</label>
          <textarea id="primerSeq" rows="6" placeholder="ATCGATCGATCG..."></textarea>
          <div class="tool-actions">
            <button onclick="designPrimers()" class="action-btn"><i class="fas fa-magic"></i> Design Primers</button>
          </div>
          <div id="primerResults" class="tool-results"></div>
        </div>
      `
    },
    translate: {
      title: 'Transcription & Translation Tool',
      content: `
        <div class="tool-form">
          <label for="transSeq">Enter DNA Sequence:</label>
          <textarea id="transSeq" rows="6" placeholder="ATCGATCGATCG..."></textarea>
          <div class="tool-actions">
            <button onclick="transcribeDNA()" class="action-btn"><i class="fas fa-arrow-right"></i> Transcribe to RNA</button>
            <button onclick="translateDNA()" class="action-btn"><i class="fas fa-arrow-right"></i> Translate to Protein</button>
          </div>
          <div id="transResults" class="tool-results"></div>
        </div>
      `
    },
    complement: {
      title: 'Complement & Reverse Complement Tool',
      content: `
        <div class="tool-form">
          <label for="compSeq">Enter DNA Sequence:</label>
          <textarea id="compSeq" rows="6" placeholder="ATCGATCGATCG..."></textarea>
          <div class="tool-actions">
            <button onclick="complementDNA()" class="action-btn"><i class="fas fa-sync"></i> Complement</button>
            <button onclick="reverseComplementDNA()" class="action-btn"><i class="fas fa-sync-alt"></i> Reverse Complement</button>
          </div>
          <div id="compResults" class="tool-results"></div>
        </div>
      `
    },
    uniprot: {
      title: 'UniProt Search',
      content: `
        <div class="tool-form">
          <label for="uniInput">Enter UniProt ID or Protein Name:</label>
          <input type="text" id="uniInput" placeholder="e.g., P05067 (APP) or Tau" />
          <div class="tool-actions">
            <button onclick="openUniProt()" class="action-btn"><i class="fas fa-search"></i> Search UniProt</button>
          </div>
        </div>
      `
    },
    chembl: {
      title: 'ChEMBL Database',
      content: `
        <div class="tool-form">
          <label for="chemblInput">Enter ChEMBL ID or Compound Name:</label>
          <input type="text" id="chemblInput" placeholder="e.g., CHEMBL25 or Donepezil" />
          <div class="tool-actions">
            <button onclick="openChEMBL()" class="action-btn"><i class="fas fa-search"></i> Search ChEMBL</button>
          </div>
        </div>
      `
    }
  };

  const tool = tools[toolName];
  if (tool) {
    toolTitle.textContent = tool.title;
    toolBody.innerHTML = tool.content;
  }
}

/**
 * Close tool and show results
 */
function closeTool() {
  document.getElementById('toolContent').style.display = 'none';
  document.getElementById('resultsContainer').style.display = 'block';
}

// ============================================
// Bioinformatics Tool Implementations
// ============================================

function runBLAST() {
  const seq = document.getElementById('blastSeq').value.trim();
  if (!seq) {
    alert('Please enter a sequence.');
    return;
  }
  const blastURL = `https://blast.ncbi.nlm.nih.gov/Blast.cgi?CMD=Put&QUERY=${encodeURIComponent(seq)}&DATABASE=nr&PROGRAM=blastn`;
  document.getElementById('blastResults').innerHTML = `
    <div class="alert alert-info">
      <i class="fas fa-info-circle"></i> 
      Opening NCBI BLAST with your sequence... 
      <a href="${blastURL}" target="_blank" class="alert-link">Click here if not redirected</a>
    </div>
  `;
  window.open(blastURL, '_blank');
}

function openKEGG() {
  const keggId = document.getElementById('keggInput').value.trim();
  if (!keggId) {
    alert('Please enter a KEGG ID.');
    return;
  }
  const keggURL = `https://www.genome.jp/dbget-bin/www_bget?${keggId}`;
  document.getElementById('keggResults').innerHTML = `
    <div class="alert alert-info">
      <i class="fas fa-info-circle"></i> 
      Opening KEGG database... 
      <a href="${keggURL}" target="_blank" class="alert-link">View on KEGG</a>
    </div>
  `;
  window.open(keggURL, '_blank');
}

function designPrimers() {
  const seq = document.getElementById('primerSeq').value.trim().toUpperCase().replace(/\s+/g, '');
  if (!seq) {
    alert('Please enter a DNA sequence.');
    return;
  }
  if (seq.length < 40) {
    alert('Sequence should be at least 40 bases for primer design.');
    return;
  }
  
  const primerLength = 20;
  const forwardPrimer = seq.substring(0, primerLength);
  const reversePrimer = getReverseComplement(seq.substring(seq.length - primerLength));
  
  const forwardTm = calculateTm(forwardPrimer);
  const reverseTm = calculateTm(reversePrimer);
  
  document.getElementById('primerResults').innerHTML = `
    <div class="primer-results">
      <h4><i class="fas fa-check-circle"></i> Designed Primers</h4>
      <div class="primer-card">
        <div class="primer-header">
          <span class="primer-label">Forward Primer</span>
          <span class="primer-tm">Tm: ${forwardTm}°C</span>
        </div>
        <div class="primer-seq">5'-${forwardPrimer}-3'</div>
        <div class="primer-info">Length: ${forwardPrimer.length} bp | GC: ${calculateGC(forwardPrimer)}%</div>
      </div>
      <div class="primer-card">
        <div class="primer-header">
          <span class="primer-label">Reverse Primer</span>
          <span class="primer-tm">Tm: ${reverseTm}°C</span>
        </div>
        <div class="primer-seq">5'-${reversePrimer}-3'</div>
        <div class="primer-info">Length: ${reversePrimer.length} bp | GC: ${calculateGC(reversePrimer)}%</div>
      </div>
    </div>
  `;
}

function transcribeDNA() {
  let seq = document.getElementById('transSeq').value.trim().toUpperCase().replace(/\s+/g, '');
  if (!seq) {
    alert('Please enter a DNA sequence.');
    return;
  }
  const rnaSeq = seq.replace(/T/g, 'U');
  document.getElementById('transResults').innerHTML = `
    <div class="sequence-result">
      <h4><i class="fas fa-arrow-right"></i> Transcribed RNA Sequence</h4>
      <div class="sequence-box rna">${formatSequence(rnaSeq)}</div>
      <div class="sequence-info">Length: ${rnaSeq.length} nucleotides</div>
    </div>
  `;
}

function translateDNA() {
  let seq = document.getElementById('transSeq').value.trim().toUpperCase().replace(/\s+/g, '');
  if (!seq) {
    alert('Please enter a DNA sequence.');
    return;
  }
  if (seq.includes('T')) {
    seq = seq.replace(/T/g, 'U');
  }
  
  const codonTable = {
    'UUU': 'F', 'UUC': 'F', 'UUA': 'L', 'UUG': 'L',
    'CUU': 'L', 'CUC': 'L', 'CUA': 'L', 'CUG': 'L',
    'AUU': 'I', 'AUC': 'I', 'AUA': 'I', 'AUG': 'M',
    'GUU': 'V', 'GUC': 'V', 'GUA': 'V', 'GUG': 'V',
    'UCU': 'S', 'UCC': 'S', 'UCA': 'S', 'UCG': 'S',
    'CCU': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
    'ACU': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
    'GCU': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
    'UAU': 'Y', 'UAC': 'Y', 'UAA': '*', 'UAG': '*',
    'CAU': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
    'AAU': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
    'GAU': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
    'UGU': 'C', 'UGC': 'C', 'UGA': '*', 'UGG': 'W',
    'CGU': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
    'AGU': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
    'GGU': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
  };
  
  let protein = '';
  for (let i = 0; i < seq.length - 2; i += 3) {
    const codon = seq.substring(i, i + 3);
    protein += codonTable[codon] || 'X';
  }
  
  document.getElementById('transResults').innerHTML = `
    <div class="sequence-result">
      <h4><i class="fas fa-arrow-right"></i> Translated Protein Sequence</h4>
      <div class="sequence-box protein">${formatSequence(protein)}</div>
      <div class="sequence-info">Length: ${protein.length} amino acids</div>
    </div>
  `;
}

function complementDNA() {
  let seq = document.getElementById('compSeq').value.trim().toUpperCase().replace(/\s+/g, '');
  if (!seq) {
    alert('Please enter a DNA sequence.');
    return;
  }
  const comp = getComplement(seq);
  document.getElementById('compResults').innerHTML = `
    <div class="sequence-result">
      <h4><i class="fas fa-sync"></i> Complement Sequence</h4>
      <div class="sequence-box">${formatSequence(comp)}</div>
    </div>
  `;
}

function reverseComplementDNA() {
  let seq = document.getElementById('compSeq').value.trim().toUpperCase().replace(/\s+/g, '');
  if (!seq) {
    alert('Please enter a DNA sequence.');
    return;
  }
  const revComp = getReverseComplement(seq);
  document.getElementById('compResults').innerHTML = `
    <div class="sequence-result">
      <h4><i class="fas fa-sync-alt"></i> Reverse Complement</h4>
      <div class="sequence-box">${formatSequence(revComp)}</div>
    </div>
  `;
}

function openUniProt() {
  const input = document.getElementById('uniInput').value.trim();
  if (!input) {
    alert('Please enter a UniProt ID or protein name.');
    return;
  }
  const url = `https://www.uniprot.org/uniprotkb?query=${encodeURIComponent(input)}`;
  window.open(url, '_blank');
}

function openChEMBL() {
  const input = document.getElementById('chemblInput').value.trim();
  if (!input) {
    alert('Please enter a ChEMBL ID or compound name.');
    return;
  }
  const url = `https://www.ebi.ac.uk/chembl/g/#search_results/all/query=${encodeURIComponent(input)}`;
  window.open(url, '_blank');
}

// ============================================
// Helper Functions for Bioinformatics
// ============================================

function getComplement(seq) {
  const complement = { 'A': 'T', 'T': 'A', 'U': 'A', 'C': 'G', 'G': 'C' };
  return seq.split('').map(n => complement[n] || 'N').join('');
}

function getReverseComplement(seq) {
  return getComplement(seq).split('').reverse().join('');
}

function calculateTm(primer) {
  const gc = (primer.match(/[GC]/g) || []).length;
  const at = (primer.match(/[AT]/g) || []).length;
  return Math.round(2 * at + 4 * gc);
}

function calculateGC(seq) {
  const gc = (seq.match(/[GC]/g) || []).length;
  return Math.round((gc / seq.length) * 100);
}

function formatSequence(seq, chunkSize = 10) {
  const chunks = [];
  for (let i = 0; i < seq.length; i += chunkSize) {
    chunks.push(seq.substring(i, i + chunkSize));
  }
  return chunks.join(' ');
}

// ============================================
// Additional Styles for Tools
// ============================================

const toolStyles = document.createElement('style');
toolStyles.textContent = `
  .tool-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .tool-form label {
    font-weight: 600;
    color: var(--primary-color);
  }
  
  .tool-form input,
  .tool-form textarea {
    padding: 0.875rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    font-family: monospace;
    font-size: 0.875rem;
    transition: border-color var(--transition-fast);
  }
  
  .tool-form input:focus,
  .tool-form textarea:focus {
    outline: none;
    border-color: var(--accent-color);
  }
  
  .tool-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .tool-results {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
  }
  
  .sequence-result h4,
  .primer-results h4 {
    color: var(--primary-color);
    margin-bottom: 1rem;
  }
  
  .sequence-box {
    background: white;
    padding: 1rem;
    border-radius: var(--radius-md);
    font-family: monospace;
    font-size: 0.875rem;
    word-break: break-all;
    border: 1px solid var(--border-color);
  }
  
  .sequence-box.rna {
    background: #ebf8ff;
    border-color: #90cdf4;
  }
  
  .sequence-box.protein {
    background: #f0fff4;
    border-color: #9ae6b4;
  }
  
  .sequence-info {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
  }
  
  .primer-card {
    background: white;
    padding: 1rem;
    border-radius: var(--radius-md);
    margin-bottom: 1rem;
    border: 1px solid var(--border-color);
  }
  
  .primer-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  
  .primer-label {
    font-weight: 600;
    color: var(--primary-color);
  }
  
  .primer-tm {
    color: var(--success-color);
    font-weight: 600;
  }
  
  .primer-seq {
    font-family: monospace;
    font-size: 1rem;
    color: var(--text-primary);
    padding: 0.5rem;
    background: var(--bg-secondary);
    border-radius: var(--radius-sm);
    margin-bottom: 0.5rem;
  }
  
  .primer-info {
    font-size: 0.875rem;
    color: var(--text-muted);
  }
  
  .alert {
    padding: 1rem;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .alert-info {
    background: #ebf8ff;
    color: #2b6cb0;
    border: 1px solid #90cdf4;
  }
  
  .alert-link {
    color: var(--primary-color);
    font-weight: 600;
  }
`;
document.head.appendChild(toolStyles);
