(() => {
  const form = document.getElementById("msgForm");
  const nameInput = document.getElementById("name");
  const msgInput = document.getElementById("message");
  const sendBtn = document.getElementById("sendBtn");
  const clearBtn = document.getElementById("clearBtn");
  const notice = document.getElementById("notice");
  const chars = document.getElementById("chars");
  const pname = document.getElementById("pname");
  const pmsg = document.getElementById("pmsg");
  const themeBtn = document.getElementById("themeBtn");

  const MIN_INTERVAL = 3000;
  let lastSend = 0;

  function setNotice(text, type = "") {
    notice.textContent = text;
    notice.className = "notice" + (type ? " " + type : "");
  }

  function updatePreview() {
    pname.textContent = nameInput.value.trim() || "Anonymous";
    pmsg.textContent = msgInput.value.trim() || "Your message preview...";
    chars.textContent = msgInput.value.length;
  }

  function theme(t) {
    document.documentElement.setAttribute("data-theme", t);
    themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
  }
  themeBtn.onclick = () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    theme(dark ? "light" : "dark");
  };

  msgInput.addEventListener("input", updatePreview);
  nameInput.addEventListener("input", updatePreview);

  clearBtn.onclick = () => {
    nameInput.value = "";
    msgInput.value = "";
    updatePreview();
    setNotice("");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastSend < MIN_INTERVAL) {
      setNotice("Wait a moment before sending again", "err");
      return;
    }

    const name = nameInput.value.trim() || "Anonymous";
    const message = msgInput.value.trim();
    if (!message) return setNotice("Message required", "err");

    sendBtn.disabled = true;
    setNotice("Sending...");

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setNotice("Message sent.", "ok");
      lastSend = Date.now();
      msgInput.value = "";
      updatePreview();
    } catch (err) {
      setNotice(err.message, "err");
    } finally {
      sendBtn.disabled = false;
    }
  });

  updatePreview();
})();
