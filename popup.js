document.addEventListener("DOMContentLoaded", async () => {

    const jsonInput = document.getElementById("jsonInput");
    const profileSelect = document.getElementById("profileSelect");
    const modal = document.getElementById("newProfileModal");
    const modalCancelBtn = document.getElementById("modalCancelBtn");
    const modalCreateBtn = document.getElementById("modalCreateBtn");

    let storage = await chrome.storage.local.get([
        "profiles",
        "activeProfile"
    ]);

    let profiles = storage.profiles || [];
    let activeProfile = storage.activeProfile || null;

    // Create default profile on first launch
    if (profiles.length === 0) {

        const defaultProfile = {

            id: Date.now().toString(),

            profileName: "My Job Search",

            applicantName: "Me",

            applicationType: "Employment",

            data: {

                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                address: "",
                city: "",
                stateProvince: "",
                country: "",
                postalCode: "",
                university: "",
                degree: "",
                major: "",
                graduationYear: "",
                currentCompany: "",
                linkedin: "",
                github: "",
                portfolio: ""

            }

        };

        profiles.push(defaultProfile);

        activeProfile = defaultProfile.id;

        await chrome.storage.local.set({

            profiles,
            activeProfile

        });

    }

    // If active profile doesn't exist, use the first one
    if (!activeProfile || !profiles.find(p => p.id === activeProfile)) {

        activeProfile = profiles[0].id;

        await chrome.storage.local.set({

            activeProfile

        });

    }

    function refreshDropdown() {

        profileSelect.innerHTML = "";

        profiles.forEach(profile => {

            const option = document.createElement("option");

            option.value = profile.id;

            option.textContent =
                `${profile.profileName} (${profile.applicationType})`;

            profileSelect.appendChild(option);

        });

        profileSelect.value = activeProfile;

    }

    function loadProfile() {

        const profile = profiles.find(
            p => p.id === activeProfile
        );

        if (!profile) return;

        jsonInput.value = JSON.stringify(
            profile.data,
            null,
            4
        );

    }

    refreshDropdown();
    loadProfile();

    profileSelect.addEventListener("change", async () => {

        activeProfile = profileSelect.value;

        await chrome.storage.local.set({

            activeProfile

        });

        loadProfile();

    });

    // Delete profile
    document.getElementById("deleteProfileBtn").addEventListener("click", async () => {

        if (profiles.length === 1) {

            alert("You can't delete your only profile.");

            return;

        }

        const profile = profiles.find(p => p.id === activeProfile);

        if (!profile) return;

        const confirmed = confirm(
            `Delete "${profile.profileName}"? This can't be undone.`
        );

        if (!confirmed) return;

        profiles = profiles.filter(p => p.id !== activeProfile);

        activeProfile = profiles[0].id;

        await chrome.storage.local.set({

            profiles,
            activeProfile

        });

        refreshDropdown();
        loadProfile();

    });

    // Open modal
    document.getElementById("newProfileBtn").addEventListener("click", () => {

        document.getElementById("inputProfileName").value = "";
        document.getElementById("inputApplicantName").value = "";
        document.getElementById("inputApplicationType").value = "Employment";
        document.getElementById("modalError").textContent = "";

        modal.style.display = "flex";
        document.getElementById("inputProfileName").focus();

    });

    modalCancelBtn.addEventListener("click", () => {

        modal.style.display = "none";

    });

    // Close modal on backdrop click
    modal.addEventListener("click", (e) => {

        if (e.target === modal) {
            modal.style.display = "none";
        }

    });

    modalCreateBtn.addEventListener("click", async () => {

        const profileName = document.getElementById("inputProfileName").value.trim();
        const applicantName = document.getElementById("inputApplicantName").value.trim();
        const applicationType = document.getElementById("inputApplicationType").value.trim();

        if (!profileName || !applicantName || !applicationType) {

            document.getElementById("modalError").textContent =
                "All fields are required.";

            return;

        }

        document.getElementById("modalError").textContent = "";

        const profile = {

            id: Date.now().toString(),

            profileName,

            applicantName,

            applicationType,

            data: {

                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                address: "",
                city: "",
                stateProvince: "",
                country: "",
                postalCode: "",
                university: "",
                degree: "",
                major: "",
                graduationYear: "",
                currentCompany: "",
                linkedin: "",
                github: "",
                portfolio: ""

            }

        };

        profiles.push(profile);

        activeProfile = profile.id;

        await chrome.storage.local.set({

            profiles,
            activeProfile

        });

        modal.style.display = "none";

        refreshDropdown();
        loadProfile();

    });

    document.getElementById("saveBtn").addEventListener("click", async () => {

        try {

            const profile = profiles.find(
                p => p.id === activeProfile
            );

            if (!profile) return;

            profile.data = JSON.parse(
                jsonInput.value
            );

            await chrome.storage.local.set({

                profiles,
                activeProfile

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