document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  let messageTimeout;

  // Show a status message that hides itself after 5 seconds
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;

    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Build the participants section for an activity card
  function createParticipantsSection(activityName, participants) {
    const section = document.createElement("div");
    section.className = "participants-section";

    const heading = document.createElement("p");
    heading.className = "participants-heading";
    heading.textContent = `Participants (${participants.length})`;
    section.appendChild(heading);

    if (participants.length === 0) {
      const empty = document.createElement("p");
      empty.className = "participants-empty";
      empty.textContent = "No one has signed up yet. Be the first!";
      section.appendChild(empty);
      return section;
    }

    const list = document.createElement("ul");
    list.className = "participants-list";

    participants.forEach((email) => {
      const item = document.createElement("li");

      const emailSpan = document.createElement("span");
      emailSpan.className = "participant-email";
      emailSpan.textContent = email;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-participant";
      deleteButton.title = "Unregister";
      deleteButton.setAttribute("aria-label", `Unregister ${email} from ${activityName}`);
      deleteButton.textContent = "🗑️";
      deleteButton.addEventListener("click", () => unregisterParticipant(activityName, email));

      item.append(emailSpan, deleteButton);
      list.appendChild(item);
    });

    section.appendChild(list);
    return section;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and previously loaded options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activityCard.appendChild(createParticipantsSection(name, details.participants));
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Unregister a participant from an activity
  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
