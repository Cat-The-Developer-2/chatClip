const addNotes = document.getElementById("add-notes");
const clearNotes = document.getElementById("clear-notes");
const noteTitle = document.getElementById("note-title");
const noteText = document.getElementById("note-text");
const notesList = document.getElementById("notes-list");

let notes = [];

function saveNotes() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function loadNotes() {
  const savedNotes = localStorage.getItem("notes");
  if (savedNotes) {
    notes = JSON.parse(savedNotes);
  }
}

function addNote() {
  const note = {
    title: noteTitle.value,
    text: noteText.value,
  };
  notes.push(note);
  saveNotes();
  noteTitle.value = "";
  noteText.value = "";
  renderNotes();
}

function renderNotes() {
  notesList.innerHTML = "";
  notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${note.title}: ${note.text}`;
    notesList.appendChild(li);
  });
}

clearNotes.addEventListener("click", () => {
  notes = [];
  saveNotes();
  renderNotes();
});

addNotes.addEventListener("click", addNote);
