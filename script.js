document.addEventListener("DOMContentLoaded", function () {
  const notesList = document.getElementById("notes-list");
  const fileInput = document.getElementById("file-input");
  const previewImage = document.getElementById("preview-image");
  const uploadBtn = document.getElementById("upload-btn");
  const noteTitleInput = document.getElementById("note-title");
  const noteTextInput = document.getElementById("note-text");
  const ifLoading = document.getElementById("ifLoading");
  const saveBtn = document.getElementById("save-btn");
  const clearBtn = document.getElementById("clear-btn");
  const searchInput = document.getElementById("search-input");

  let allNotes = []; // Store all notes in memory for filtering

  // Load existing notes from storage
  chrome.storage.sync.get("notes", function (data) {
    if (data.notes) {
      allNotes = data.notes;
      renderNotes(allNotes);
    }
  });

  function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  }

  function renderNotes(notes) {
    notesList.innerHTML = ""; // Clear previous notes
    notes.forEach((note) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${toTitleCase(note.title)}</strong><p>${
        note.text
      }</p>`;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.classList.add("delete-btn");
      deleteBtn.onclick = function () {
        removeNote(note);
        li.remove();
      };

      li.appendChild(deleteBtn);
      notesList.appendChild(li);
    });
  }

  function saveNote() {
    const title = noteTitleInput.value.trim();
    const text = noteTextInput.value.trim();
    if (!title || !text) return;

    const newNote = { title, text };
    allNotes.push(newNote);
    chrome.storage.sync.set({ notes: allNotes }, function () {
      renderNotes(allNotes);
      noteTitleInput.value = "";
      noteTextInput.value = "";
    });
  }

  function removeNote(noteToRemove) {
    allNotes = allNotes.filter(
      (note) =>
        note.title !== noteToRemove.title || note.text !== noteToRemove.text
    );
    chrome.storage.sync.set({ notes: allNotes }, function () {
      renderNotes(allNotes);
    });
  }

  function clearNote() {
    noteTitleInput.value = "";
    noteTextInput.value = "";
  }

  // Real-time search while typing
  searchInput.addEventListener("input", function () {
    const searchValue = searchInput.value.toLowerCase();
    const filteredNotes = allNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(searchValue) ||
        note.text.toLowerCase().includes(searchValue)
    );
    renderNotes(filteredNotes);
  });

  // File Upload and OCR Processing
  async function handleFileUpload() {
    const API_KEY = "AIzaSyBJvbNDMrIIo6R_8cElq3TD_H6Ra0onpAY"; // Replace with your actual API key!
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const file = fileInput.files[0];
    if (!file) {
      alert("No file selected.");
      return;
    }

    const base64Image = await convertToBase64(file);

    fileInput.value = "";
    previewImage.src = "";
    ifLoading.textContent = "Loading...";

    const requestData = {
      contents: [
        {
          parts: [
            {
              text: "Extract the text from the given image and generate an appropriate title for it. Return the result in JSON format with the following structure: {'title': 'Generated Title', 'text': 'Extracted text from the image.'}",
            },
            {
              inline_data: {
                mime_type: file.type,
                data: base64Image.split(",")[1],
              },
            },
          ],
        },
      ],
    };

    try {
      const response = await axios.post(URL, requestData, {
        headers: { "Content-Type": "application/json" },
      });

      const markdownText = response.data.candidates[0].content.parts[0].text;
      const jsonString = extractJSONFromMarkdown(markdownText);

      if (jsonString) {
        try {
          const obj = JSON.parse(jsonString);
          notesMaker(obj["title"], obj["text"]);
        } catch (error) {
          console.error("JSON parsing error:", error);
          ifLoading.textContent = "Error: Invalid JSON from API.";
        }
      } else {
        console.error("Could not extract JSON from API response.");
        ifLoading.textContent =
          "Error: Could not extract JSON from API response.";
      }
    } catch (error) {
      console.error("Error:", error);
      ifLoading.textContent = "Error: " + error;
    }
  }

  function extractJSONFromMarkdown(markdownText) {
    const jsonMatch = markdownText.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0].trim() : null;
  }

  function convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  fileInput.addEventListener("change", () => {
    let file = fileInput.files[0];
    if (file) {
      let reader = new FileReader();
      reader.onload = function (e) {
        previewImage.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  function notesMaker(title, text) {
    ifLoading.textContent = "";
    noteTitleInput.value = title;
    noteTextInput.value = text;
  }

  uploadBtn.addEventListener("click", handleFileUpload);
  saveBtn.addEventListener("click", saveNote);
  clearBtn.addEventListener("click", clearNote);
});
