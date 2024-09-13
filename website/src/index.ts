const API_BASE_URL =
  "https://p54lkqueq1.execute-api.us-east-1.amazonaws.com/prod";

type AddBlurbToWallProps = {
  name: string;
  message: string;
  date?: string;
};
const addBlurbToWall = ({
  name,
  message,
  date = new Date().toISOString(),
}: AddBlurbToWallProps) => {
  const timeString = new Date(date).toDateString();

  const blurbWall = document.getElementsByClassName(
    "section__content--messages"
  )?.[0];
  const blurb = document.createElement("article");
  blurb.classList.add("blurb", "blurb--messages");
  blurb.innerHTML = `
        <div class="blurb__name">${name}</div>
        <div class="blurb__date">${timeString}</div>
        <div class="blurb__content">${message}</div>
    `;
  blurbWall.appendChild(blurb);
};

const handleSubmit = async (event: SubmitEvent) => {
  event.preventDefault();

  const nameInput = document?.getElementById("name") as HTMLInputElement;
  const messageInput = document?.getElementById(
    "message"
  ) as HTMLTextAreaElement;
  const name = nameInput?.value;
  const message = messageInput?.value;
  const date = new Date().toISOString();

  if (!name || !message) {
    alert("Please fill in both fields.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, message }),
    });

    if (response.ok) {
      addBlurbToWall({ name, message, date });

      //reset form
      nameInput.value = "";
      messageInput.value = "";
    } else {
      alert("Failed to add message. Please try again.");
    }
  } catch (error) {
    alert(`An error occurred: ${error}`);
  }
};

const postHit = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/hits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("Error record hit:", error);
  }
};

async function fetchHits() {
  try {
    const response = await fetch(`${API_BASE_URL}/hits`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }

    const json = await response.json();
    return json.data.hits;
  } catch (error) {
    console.error("Error fetching hits:", error);
  }
}

async function fetchMessages() {
  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }

    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
}

const initializePage = async () => {
  await postHit();
  const hits = await fetchHits();
  const messages = await fetchMessages();

  const form = document.getElementsByClassName("blurb-form")[0];
  form.addEventListener("submit", handleSubmit);
  const hitsElement = document.getElementsByClassName("number-of-hits")[0];
  hitsElement.innerHTML = hits;

  for (const message of messages) {
    addBlurbToWall(message);
  }
};

initializePage();
