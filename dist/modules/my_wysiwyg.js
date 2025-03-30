export class MyWysiwyg {
  constructor(element, options = {}) {
    this.element = element;
    this.options = options;
    this.buttons = options.buttons || [];

    // Configuration de la sauvegarde automatique
    this.config = {
      autoSaveInterval: options.autoSaveInterval || 300000,
      // 5 minutes par défaut
      storageKey: options.storageKey || 'wysiwyg-content'
    };
    this.autoSaveInterval = null;
    this.init();
  }
  init() {
    this.createToolbar();
    this.bindEvents();
    this.setupAutoSave();
    this.setupBeforeUnloadWarning();
    this.loadSavedContent();
  }

  // Sauvegarde du contenu
  saveContent() {
    try {
      localStorage.setItem(this.config.storageKey, this.element.innerHTML);
      this.showSaveAlert();
      this.updateLastSavedTime();
      return true;
    } catch (e) {
      console.error('Erreur lors de la sauvegarde:', e);
      return false;
    }
  }

  // Ajout alerte de sauvegarde
  showSaveAlert() {
    const saveAlert = document.getElementById('saveAlert');
    saveAlert.style.display = 'block';
    setTimeout(() => {
      saveAlert.style.display = 'none';
    }, 3000);
  }

  // Mise à jour de l'heure de la dernière sauvegarde
  updateLastSavedTime() {
    const lastSaved = document.getElementById('lastSaved');
    const now = new Date();
    lastSaved.textContent = `Dernière sauvegarde : ${now.toLocaleTimeString()}`;
  }

  // Charger le contenu sauvegardé
  loadSavedContent() {
    const savedContent = localStorage.getItem(this.config.storageKey);
    if (savedContent) {
      this.element.innerHTML = savedContent;
    }
  }

  // Vérifier s'il y a des modifications non sauvegardées
  hasUnsavedChanges() {
    const savedContent = localStorage.getItem(this.config.storageKey);
    return this.element.innerHTML !== savedContent;
  }

  // Configuration de la sauvegarde automatique
  setupAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      if (this.hasUnsavedChanges()) {
        this.saveContent();
      }
    }, this.config.autoSaveInterval);
  }

  // Configuration de l'avertissement avant de quitter
  setupBeforeUnloadWarning() {
    window.addEventListener('beforeunload', e => {
      if (this.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?';
      }
    });
  }

  // Création de la barre d'outils
  createToolbar() {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'wysiwyg-toolbar';
    this.buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.textContent = button;
      btn.addEventListener('click', () => this.handleButtonClick(button));
      this.toolbar.appendChild(btn);
    });

    // Ajout du bouton de sauvegarde
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'save';
    saveBtn.addEventListener('click', () => this.saveContent());
    this.toolbar.appendChild(saveBtn);
    this.element.parentNode.insertBefore(this.toolbar, this.element);
  }

  // Lorsque l'utilisateur clique sur un bouton
  handleButtonClick(button) {
    switch (button) {
      case 'bold':
        this.toggleStyle('bold');
        break;
      case 'italic':
        this.toggleStyle('italic');
        break;
      case 'strikeThrough':
        this.toggleStyle('strikeThrough');
        break;
      case 'color':
        this.changeColor();
        break;
      case 'fontSize':
        this.changeFontSize();
        break;
      case 'link':
        this.toggleLink();
        break;
      default:
        break;
    }
  }

  // Pour vérifier si le style est appliqué ou non
  toggleStyle(style) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (this.isStyleAlreadyApplied(range, style)) {
      this.removeStyle(range, style);
    } else {
      this.addStyle(range, style);
    }
  }

  // Si le style est déjà appliqué
  isStyleAlreadyApplied(range, style) {
    const nodes = this.getSelectedNodes(range);
    return nodes.some(node => {
      while (node && node !== this.element) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (style === 'bold' && node.style.fontWeight === 'bold') return true;
          if (style === 'italic' && node.style.fontStyle === 'italic') return true;
          if (style === 'strikeThrough' && node.style.textDecoration === 'line-through') return true;
        }
        node = node.parentNode;
      }
      return false;
    });
  }

  // J'ajoute un style par dessus l'élément sélectionné
  addStyle(range, style) {
    const span = document.createElement('span');
    if (style === 'bold') {
      span.style.fontWeight = 'bold';
    } else if (style === 'italic') {
      span.style.fontStyle = 'italic';
    } else if (style === 'strikeThrough') {
      span.style.textDecoration = 'line-through';
    }
    range.surroundContents(span);
  }

  // Je le supprime
  removeStyle(range, style) {
    const nodes = this.getSelectedNodes(range);
    nodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN') {
        if (style === 'bold') {
          node.style.fontWeight = '';
        } else if (style === 'italic') {
          node.style.fontStyle = '';
        } else if (style === 'strikeThrough') {
          node.style.textDecoration = '';
        }
        if (!node.style.fontWeight && !node.style.fontStyle && !node.style.textDecoration) {
          while (node.firstChild) {
            node.parentNode.insertBefore(node.firstChild, node);
          }
          node.parentNode.removeChild(node);
        }
      }
    });
  }

  // Si plusieurs styles sont appliqués, je vérifie les noeuds de span
  getSelectedNodes(range) {
    const nodes = [];
    const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: node => range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }
    return nodes;
  }

  // Pour le paragraphe
  // Je m'assure de faire un saut de ligne lorsque l'utilisateur clique sur entrée
  bindEvents() {
    this.element.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.insertParagraph();
      }
    });

    // Ajout d'un événement input pour détecter les changements
    this.element.addEventListener('input', () => {
      if (this.options.onChange) {
        this.options.onChange();
      }
    });
  }

  // Le saut de ligne pour les paragraphes
  insertParagraph() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const p = document.createElement('p');
      p.textContent = '\u00A0';
      range.insertNode(p);
      const newRange = document.createRange();
      newRange.setStart(p, 0);
      newRange.setEnd(p, 0);
      selection.removeAllRanges();
      selection.addRange(newRange);
      p.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }

  // Pour changer la couleur du texte
  changeColor() {
    const color = prompt('Entrez une couleur (nom ou code hexadécimal):');
    if (color) {
      document.execCommand('foreColor', false, color);
    }
  }

  // Pour changer la taille de la police
  changeFontSize() {
    const size = prompt('Entrez la taille de la police (ex: 12px, 1em):');
    if (size) {
      document.execCommand('fontSize', false, size);
    }
  }

  // Pour gérer les liens (ajouter ou supprimer)
  toggleLink() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (this.isLinkAlreadyApplied(range)) {
      this.removeLink(range); // Supprimer le lien si déjà appliqué
    } else {
      const url = prompt('Entrez l\'URL du lien:');
      if (url) {
        this.addLink(range, url); // Ajouter le lien si non appliqué
      }
    }
  }

  // Vérifier si un lien est déjà appliqué
  isLinkAlreadyApplied(range) {
    const nodes = this.getSelectedNodes(range);
    return nodes.some(node => {
      while (node && node !== this.element) {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') {
          return true;
        }
        node = node.parentNode;
      }
      return false;
    });
  }

  // Ajoute un lien
  addLink(range, url) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.textContent = range.toString();
    range.deleteContents();
    range.insertNode(anchor);
  }

  // Supprime un lien
  removeLink(range) {
    const nodes = this.getSelectedNodes(range);
    nodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') {
        while (node.firstChild) {
          node.parentNode.insertBefore(node.firstChild, node);
        }
        node.parentNode.removeChild(node);
      }
    });
  }

  // Nettoyage des ressources non nécessaire
  destroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    window.removeEventListener('beforeunload', this.setupBeforeUnloadWarning);
    if (this.toolbar && this.toolbar.parentNode) {
      this.toolbar.parentNode.removeChild(this.toolbar);
    }
  }
}