document.addEventListener("DOMContentLoaded", function () {
  const notesList = document.getElementById("notes-list");
  const addNoteBtn = document.getElementById("add-note");
  const noteTitleInput = document.getElementById("note-title");
  const noteTextInput = document.getElementById("note-text");

  // Load notes from storage
  chrome.storage.sync.get("notes", function (data) {
    if (data.notes) {
      data.notes.forEach((note) => addNoteToUI(note));
    }
  });

  function saveNote() {
    const title = noteTitleInput.value.trim();
    const text = noteTextInput.value.trim();
    if (!title || !text) return;

    const newNote = { title, text };
    chrome.storage.sync.get("notes", function (data) {
      let notes = data.notes || [];
      notes.push(newNote);
      chrome.storage.sync.set({ notes }, function () {
        addNoteToUI(newNote);
        noteTitleInput.value = "";
        noteTextInput.value = "";
      });
    });
  }

  function addNoteToUI(note) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${note.title}</strong><p>${note.text}</p>`;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.onclick = function () {
      removeNote(note);
      li.remove();
    };

    li.appendChild(deleteBtn);
    notesList.appendChild(li);
  }

  function removeNote(noteToRemove) {
    chrome.storage.sync.get("notes", function (data) {
      let notes = data.notes || [];
      notes = notes.filter(
        (note) =>
          note.title !== noteToRemove.title || note.text !== noteToRemove.text
      );
      chrome.storage.sync.set({ notes });
    });
  }

  addNoteBtn.addEventListener("click", saveNote);
});
