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
  const tagInput = document.getElementById("tag-input");
  const filterTags = document.getElementById("filter-tags");
  const createTagBtn = document.getElementById("create-tag-btn");
  const existingTagsSelect = document.getElementById("existing-tags");

  let allNotes = []; // Store all notes in memory for filtering
  let allTags = []; // Store all tags
  let selectedTags = []; // Currently selected tags for the new note
  let API_KEY = ""; // Will be set when needed

  // Load existing notes and tags from storage
  chrome.storage.sync.get(["notes", "tags"], function (data) {
    if (data.notes) {
      allNotes = data.notes;
      renderNotes(allNotes);
    }
    if (data.tags) {
      allTags = data.tags;
      renderTags();
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

      // Add tags if they exist
      if (note.tags && note.tags.length > 0) {
        const tagsContainer = document.createElement("div");
        tagsContainer.classList.add("tags-container");
        tagsContainer.style.display = "flex";
        tagsContainer.style.flexWrap = "wrap";
        tagsContainer.style.gap = "5px";
        tagsContainer.style.marginTop = "8px";

        note.tags.forEach((tag) => {
          const tagSpan = document.createElement("span");
          tagSpan.classList.add("note-tag");
          tagSpan.textContent = tag;
          tagSpan.style.background = "#e9ecef";
          tagSpan.style.padding = "3px 8px";
          tagSpan.style.borderRadius = "4px";
          tagSpan.style.fontSize = "12px";
          tagsContainer.appendChild(tagSpan);
        });
        li.appendChild(tagsContainer);
      }

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

  function renderTags() {
    // Update filter dropdown
    filterTags.innerHTML = "<option value=''>All</option>";

    // Update existing tags dropdown
    existingTagsSelect.innerHTML =
      "<option value=''>Select existing tag</option>";

    allTags.forEach((tag) => {
      // For filter dropdown
      const filterOption = document.createElement("option");
      filterOption.value = tag;
      filterOption.textContent = tag;
      filterTags.appendChild(filterOption);

      // For existing tags dropdown
      const tagOption = document.createElement("option");
      tagOption.value = tag;
      tagOption.textContent = tag;
      existingTagsSelect.appendChild(tagOption);
    });
  }

  // Handle selecting a tag from the dropdown
  existingTagsSelect.addEventListener("change", function () {
    const selectedTag = this.value;
    if (selectedTag && !selectedTags.includes(selectedTag)) {
      selectedTags.push(selectedTag);
      renderSelectedTags();
      this.value = ""; // Reset dropdown
    }
  });

  function renderSelectedTags() {
    // Create or get container for selected tags
    let selectedTagsContainer = document.getElementById(
      "selected-tags-container"
    );
    if (!selectedTagsContainer) {
      selectedTagsContainer = document.createElement("div");
      selectedTagsContainer.id = "selected-tags-container";
      selectedTagsContainer.style.display = "flex";
      selectedTagsContainer.style.flexWrap = "wrap";
      selectedTagsContainer.style.gap = "5px";
      selectedTagsContainer.style.marginTop = "5px";

      // Insert after tag input section
      const tagSection = document.querySelector(".tag-section");
      tagSection.appendChild(selectedTagsContainer);
    }

    // Clear and repopulate
    selectedTagsContainer.innerHTML = "";
    selectedTags.forEach((tag) => {
      const tagChip = document.createElement("span");
      tagChip.textContent = tag;
      tagChip.style.background = "#4f46e5";
      tagChip.style.color = "white";
      tagChip.style.padding = "3px 8px";
      tagChip.style.borderRadius = "4px";
      tagChip.style.fontSize = "12px";
      tagChip.style.display = "flex";
      tagChip.style.alignItems = "center";
      tagChip.style.gap = "5px";

      // Add remove button
      const removeBtn = document.createElement("span");
      removeBtn.textContent = "×";
      removeBtn.style.cursor = "pointer";
      removeBtn.style.fontWeight = "bold";
      removeBtn.onclick = function (e) {
        e.stopPropagation();
        selectedTags = selectedTags.filter((t) => t !== tag);
        renderSelectedTags();
      };

      tagChip.appendChild(removeBtn);
      selectedTagsContainer.appendChild(tagChip);
    });
  }

  function saveNote() {
    const title = noteTitleInput.value.trim();
    const text = noteTextInput.value.trim();
    if (!title || !text) return;

    const newNote = { title, text, tags: [...selectedTags] };
    allNotes.push(newNote);
    chrome.storage.sync.set({ notes: allNotes }, function () {
      renderNotes(allNotes);
      noteTitleInput.value = "";
      noteTextInput.value = "";

      // Clear selected tags
      selectedTags = [];
      renderSelectedTags();
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

  function createTag() {
    // Handle multiple tags separated by commas
    const newTagInput = tagInput.value.trim();
    if (!newTagInput) return;

    const tagsToAdd = newTagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag && !allTags.includes(tag));

    if (tagsToAdd.length === 0) {
      tagInput.value = "";
      return;
    }

    // Add new tags to our tag collection
    allTags = [...allTags, ...tagsToAdd];
    chrome.storage.sync.set({ tags: allTags }, function () {
      renderTags();
      tagInput.value = "";

      // Add newly created tags to selected tags for current note
      selectedTags = [...selectedTags, ...tagsToAdd];
      renderSelectedTags();
    });
  }

  function clearNote() {
    noteTitleInput.value = "";
    noteTextInput.value = "";
    selectedTags = [];
    renderSelectedTags();
  }

  // Real-time search while typing
  searchInput.addEventListener("input", function () {
    filterNotes();
  });

  // Filter by tag
  filterTags.addEventListener("change", function () {
    filterNotes();
  });

  function filterNotes() {
    const searchValue = searchInput.value.toLowerCase();
    const tagFilter = filterTags.value;

    const filteredNotes = allNotes.filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchValue) ||
        note.text.toLowerCase().includes(searchValue);

      const matchesTag =
        !tagFilter || (note.tags && note.tags.includes(tagFilter));

      return matchesSearch && matchesTag;
    });

    renderNotes(filteredNotes);
  }

  // File Upload and OCR Processing
  async function handleFileUpload() {
    if (!API_KEY) {
      API_KEY = prompt("Enter your gemini API key"); // Get API key if not already set
      if (!API_KEY) {
        alert("API key is required for OCR functionality.");
        return;
      }
    }

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

  // Event Listeners
  uploadBtn.addEventListener("click", handleFileUpload);
  saveBtn.addEventListener("click", saveNote);
  clearBtn.addEventListener("click", clearNote);
  createTagBtn.addEventListener("click", createTag);
});
