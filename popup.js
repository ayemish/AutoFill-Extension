document.addEventListener("DOMContentLoaded", () => {

    const jsonInput = document.getElementById("jsonInput");

    document.getElementById("saveBtn").addEventListener("click", async () => {

        try {

            const profile = JSON.parse(jsonInput.value);

            await chrome.storage.local.set({
                profile
            });

            alert("Profile Saved");

        }

        catch {

            alert("Invalid JSON");

        }

    });

    document.getElementById("fillBtn").addEventListener("click", async () => {

        const [tab] = await chrome.tabs.query({

            active: true,
            currentWindow: true

        });

        chrome.tabs.sendMessage(tab.id, {

            action: "fillForm"

        });

    });

});