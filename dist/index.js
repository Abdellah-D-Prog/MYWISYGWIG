import { MyWysiwyg } from './modules/my_wysiwyg.js';
let mw = new MyWysiwyg(document.getElementById('textarea'), {
  buttons: ["bold", "italic", "strikeThrough", "color", "fontSize", "link"],
  autoSaveInterval: 300000 // Sauvegarde toutes 5 minutes
});